// POC-06 — network/auth/failure injection (LOCAL MOCK). Unknown stays Unknown,
// no blind retry, never a false "saved", recovery only via explicit verification.
import test from 'node:test';
import assert from 'node:assert/strict';
import { startStack, syntheticNote } from './helpers.mjs';
import { decodeEnvelope } from '../src/note-codec.mjs';

async function seeded(t) {
  const s = await startStack({ timeoutMs: 300 });
  t.after(() => s.stop());
  const note = syntheticNote();
  const c = await s.client.put('notes', note.literatureId, note, '*');
  assert.equal(c.data.outcome, 'saved');
  const path = `/lms-poc/${s.namespace}/notes/${note.literatureId}.json`;
  const putCount = () => s.mock.requestLog.filter((e) => e.method === 'PUT' && e.path === path).length;
  const stored = () => decodeEnvelope(s.mock.files.get(path).bytes).data;
  return { s, note, rev: c.data.revision, putCount, stored };
}

const DEFINITE = [
  // [injected upstream status, expected API status, expected reason]
  [401, 502, 'upstream_auth'],
  [403, 502, 'upstream_forbidden'],
  [409, 502, 'upstream_conflict'],
  [423, 423, 'locked'],
  [429, 503, 'rate_limited'],
];

for (const [up, apiStatus, reason] of DEFINITE) {
  test(`POC-06 upstream ${up}: definite not_saved (${reason}), single attempt, data intact`, async (t) => {
    const { s, note, rev, putCount, stored } = await seeded(t);
    s.mock.faults.push({ method: 'PUT', kind: 'status', status: up, retryAfter: up === 429 ? 30 : undefined });
    const before = putCount();
    const r = await s.client.put('notes', note.literatureId, { ...note, question: 'x' }, rev);
    assert.equal(r.status, apiStatus);
    assert.equal(r.data.outcome, 'not_saved');
    assert.equal(r.data.reason, reason);
    if (up === 429) assert.equal(r.data.retryAfter, '30', 'Retry-After surfaced, not acted on automatically');
    assert.equal(putCount() - before, 1, 'no automatic retry');
    assert.deepEqual(stored(), note);
  });
}

test('POC-06 upstream 412 (stale): conflict with current content, nothing written', async (t) => {
  const { s, note, rev, stored } = await seeded(t);
  s.mock.faults.push({ method: 'PUT', kind: 'status', status: 412 });
  const r = await s.client.put('notes', note.literatureId, { ...note, question: 'x' }, rev);
  assert.equal(r.status, 412); assert.equal(r.data.outcome, 'conflict'); assert.deepEqual(r.data.currentRecord, note);
  assert.deepEqual(stored(), note);
});

const UNKNOWN = [
  // [fault, did upstream apply?]
  [{ kind: 'hang' }, false],
  [{ kind: 'status', status: 500 }, false],
  [{ kind: 'status', status: 503 }, false],
  [{ kind: 'commit-then-drop' }, true],
  [{ kind: 'commit-then-hang' }, true],
  [{ kind: 'commit-then-status', status: 502 }, true],
];

for (const [fault, applied] of UNKNOWN) {
  const label = fault.kind + (fault.status ? ` ${fault.status}` : '');
  const path = applied ? 'verify → committed' : 'verify → not_yet_observed (non-terminal) → fence → not_committed';
  test(`POC-06 ${label}: Unknown → ${path}; no blind repeat`, async (t) => {
    const { s, note, rev, putCount, stored } = await seeded(t);
    s.mock.faults.push({ method: 'PUT', ...fault });
    const opId = s.client.newOperationId();
    const v2 = { ...note, question: `after ${label}` };
    const before = putCount();
    const r = await s.client.put('notes', note.literatureId, v2, rev, opId);
    assert.equal(r.status, 504);
    assert.equal(r.data.outcome, 'unknown', 'never converted to saved or failed');
    assert.deepEqual(stored(), applied ? v2 : note, 'mock state matches the injected scenario');

    const again = await s.client.put('notes', note.literatureId, v2, rev, opId);
    assert.equal(again.status, 409); assert.equal(again.data.outcome, 'verification_required');
    assert.equal(putCount() - before, 1, 'same operation is not re-sent while Unknown');

    const v = await s.client.verify(opId);
    if (applied) {
      assert.equal(v.data.outcome, 'committed'); assert.equal(v.data.terminal, true);
    } else {
      assert.equal(v.data.outcome, 'not_yet_observed', 'unchanged base is NOT proof of failure (P1-1)');
      assert.equal(v.data.terminal, false);
      assert.equal((await s.client.put('notes', note.literatureId, v2, rev, opId)).data.outcome, 'verification_required', 'still Unknown after observation');
      const f = await s.client.fence(opId);
      assert.equal(f.data.outcome, 'not_committed'); assert.equal(f.data.fenced, true);
      assert.deepEqual(stored(), note, 'fence rewrote identical content (only the ETag changed)');
    }
    const replay = await s.client.put('notes', note.literatureId, v2, rev, opId);
    assert.equal(replay.headers['operation-replayed'], 'true');
    assert.equal(replay.data.outcome, applied ? 'saved' : 'not_committed');
    const upstreamPuts = putCount() - before;
    assert.equal(upstreamPuts, applied ? 1 : 2, 'only the original attempt (+ one fence write) reached storage');
    if (!applied) {
      const cur = await s.client.get('notes', note.literatureId);
      const fresh = await s.client.put('notes', note.literatureId, v2, cur.data.revision); // NEW op id = explicit user retry
      assert.equal(fresh.data.outcome, 'saved');
    }
  });
}

test('POC-06 Unknown, then another writer changes the record → verify says indeterminate (not guessed)', async (t) => {
  const { s, note, rev } = await seeded(t);
  s.mock.faults.push({ method: 'PUT', kind: 'hang' });
  const opId = s.client.newOperationId();
  assert.equal((await s.client.put('notes', note.literatureId, { ...note, question: 'mine' }, rev, opId)).data.outcome, 'unknown');
  assert.equal((await s.client.put('notes', note.literatureId, { ...note, question: 'other writer' }, rev)).data.outcome, 'saved');
  const v = await s.client.verify(opId);
  assert.equal(v.data.outcome, 'indeterminate');
  const again = await s.client.put('notes', note.literatureId, { ...note, question: 'mine' }, rev, opId);
  assert.equal(again.data.outcome, 'verification_required', 'still blocked from blind repeat');
});

test('POC-06 identical text from another writer is NOT treated as proof our op landed', async (t) => {
  const { s, note, rev } = await seeded(t);
  const same = { ...note, question: 'identical text' };
  s.mock.faults.push({ method: 'PUT', kind: 'hang' });
  const opId = s.client.newOperationId();
  assert.equal((await s.client.put('notes', note.literatureId, same, rev, opId)).data.outcome, 'unknown');
  assert.equal((await s.client.put('notes', note.literatureId, same, rev)).data.outcome, 'saved');
  assert.equal((await s.client.verify(opId)).data.outcome, 'indeterminate', 'operation identity, not text equality, decides');
});

test('POC-06 corrupt write: storage acknowledges but bytes differ → verification_failed, never saved', async (t) => {
  const { s, note, rev } = await seeded(t);
  s.mock.faults.push({ method: 'PUT', kind: 'corrupt' });
  const r = await s.client.put('notes', note.literatureId, { ...note, question: 'corrupt me' }, rev);
  assert.equal(r.status, 502); assert.equal(r.data.outcome, 'verification_failed');
});

test('POC-06 offline (storage down): writes definite not_saved/offline, reads unavailable, verify unavailable', async (t) => {
  const { s, note, rev } = await seeded(t);
  s.mock.faults.push({ method: 'PUT', kind: 'hang' });
  const opId = s.client.newOperationId();
  assert.equal((await s.client.put('notes', note.literatureId, { ...note, question: 'q' }, rev, opId)).data.outcome, 'unknown');
  await s.mock.stop();
  const w = await s.client.put('notes', note.literatureId, { ...note, question: 'offline' }, rev);
  assert.equal(w.status, 503); assert.deepEqual([w.data.outcome, w.data.reason], ['not_saved', 'offline']);
  assert.equal((await s.client.get('notes', note.literatureId)).status, 503);
  const v = await s.client.verify(opId);
  assert.equal(v.data.outcome, 'unavailable', 'verification cannot run offline; Unknown is preserved');
  assert.equal((await s.client.put('notes', note.literatureId, { ...note, question: 'q' }, rev, opId)).data.outcome, 'verification_required');
  await s.mock.start(); // allow t.after stop() to close cleanly on a new port
});

test('POC-06 read-path errors (401 expired creds, 429, 500) are surfaced, not masked as empty data', async (t) => {
  const { s, note } = await seeded(t);
  s.mock.revokeCredentials();
  assert.equal((await s.client.get('notes', note.literatureId)).status, 503);
  s.mock.restoreCredentials();
  for (const status of [429, 500]) {
    s.mock.faults.push({ method: 'GET', kind: 'status', status });
    const r = await s.client.get('notes', note.literatureId);
    assert.equal(r.status, 503); assert.notEqual(r.data.outcome, 'not_found');
  }
});
