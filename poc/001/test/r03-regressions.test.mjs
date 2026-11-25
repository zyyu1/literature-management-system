// REMEDIATION-03 (D007-A22) regression tests — LOCAL MOCK ONLY.
// Q1 export integrity, Q2 fence read-back, and Q3/Q4/Q5 informational probes that pin the
// documented (README) residual behaviour. Case ids follow REMEDIATION_03_QA_PLAN.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { startStack, syntheticNote } from './helpers.mjs';
import { decodeEnvelope } from '../src/note-codec.mjs';
import { createMockWebDav } from '../src/mock-webdav.mjs';
import { createWebDavAdapter } from '../src/webdav-adapter.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 2000) { const t0 = Date.now(); while (!fn()) { if (Date.now() - t0 > ms) throw new Error('timeout'); await sleep(10); } }

// ---------------------------------------------------------------- Q1 helpers
const DAVP = 'd';
const r = (href, { col = false, status = 'HTTP/1.1 200 OK', direct = null } = {}) =>
  `<d:response><d:href>${href}</d:href>${direct ? `<d:status>${direct}</d:status>` : ''}<d:propstat><d:prop><d:resourcetype>${col ? '<d:collection/>' : ''}</d:resourcetype></d:prop><d:status>${status}</d:status></d:propstat></d:response>`;
const ms = (body) => `<?xml version="1.0"?><d:multistatus xmlns:${DAVP}="DAV:">${body}</d:multistatus>`;

async function q1Stack(t) {
  let override = null;
  const s = await startStack({ mockOptions: { propfindOverride: (p) => (override ? override(p) : null) } });
  t.after(() => s.stop());
  const n1 = syntheticNote(9000001, undefined, 0);
  const n2 = syntheticNote(9000001, undefined, 1);
  for (const n of [n1, n2]) assert.equal((await s.client.put('notes', n.literatureId, n, '*')).data.outcome, 'saved');
  const proj = { projectId: 'proj-q1', name: 'Q1 synthetic', literatureIds: [n1.literatureId] };
  assert.equal((await s.client.put('projects', proj.projectId, proj, '*')).data.outcome, 'saved');
  const ns = `/lms-poc/${s.namespace}`;
  return { s, ns, n1, n2, setOverride: (f) => { override = f; } };
}
const expectIncomplete = async (s, label, reason) => {
  const ex = await s.client.exportAll();
  assert.equal(ex.status, 503, label); assert.equal(ex.data.outcome, 'export_incomplete', label);
  assert.equal(ex.data.records, undefined, `${label}: no bundle`);
  if (reason) assert.equal(ex.data.reason, reason, label);
  return ex;
};

test('R03-Q1a well-formed root listing omitting projects/ while a project exists → 503 (not 200 count 2)', async (t) => {
  const { s, ns, setOverride } = await q1Stack(t);
  assert.equal((await s.client.exportAll()).data.count, 3, 'baseline: 2 notes + 1 project');
  setOverride((p) => (p === ns ? ms(r(`${ns}/`, { col: true }) + r(`${ns}/notes/`, { col: true }) + r(`${ns}/progress/`, { col: true })) : null));
  await expectIncomplete(s, 'omitted projects', 'missing_kind_collection');
});

test('R03-Q1a missing canonical collection even when it would be empty (progress) → 503', async (t) => {
  const { s, ns, setOverride } = await q1Stack(t);
  setOverride((p) => (p === ns ? ms(r(`${ns}/`, { col: true }) + r(`${ns}/notes/`, { col: true }) + r(`${ns}/projects/`, { col: true })) : null));
  await expectIncomplete(s, 'omitted empty progress', 'missing_kind_collection');
});

test('R03-Q1b duplicates: root kind href, record href, percent-encoded and trailing-slash variants → 503', async (t) => {
  const { s, ns, n1, n2, setOverride } = await q1Stack(t);
  const root = (extra = '') => ms(r(`${ns}/`, { col: true }) + r(`${ns}/notes/`, { col: true }) + r(`${ns}/projects/`, { col: true }) + r(`${ns}/progress/`, { col: true }) + extra);
  setOverride((p) => (p === ns ? root(r(`${ns}/notes/`, { col: true })) : null));
  await expectIncomplete(s, 'duplicate root kind href');
  setOverride((p) => (p === ns ? root(r(`${ns}/notes`, { col: true })) : null));
  await expectIncomplete(s, 'duplicate kind href without trailing slash');
  const notes = (extra) => ms(r(`${ns}/notes/`, { col: true }) + r(`${ns}/notes/${n1.literatureId}.json`) + r(`${ns}/notes/${n2.literatureId}.json`) + extra);
  setOverride((p) => (p === `${ns}/notes` ? notes(r(`${ns}/notes/${n1.literatureId}.json`)) : null));
  await expectIncomplete(s, 'duplicate record href (would count 3 for 2)');
  const encoded = `${ns}/notes/${n1.literatureId.replace('l', '%6C')}.json`;
  setOverride((p) => (p === `${ns}/notes` ? notes(r(encoded)) : null));
  await expectIncomplete(s, 'percent-encoded duplicate of the same path');
  setOverride((p) => (p === `${ns}/notes` ? notes(r(`${ns}/notes/`, { col: true })) : null));
  await expectIncomplete(s, 'duplicate kind self entry');
});

test('R03-Q1c conflicting response-level vs propstat status, all-non-2xx propstat, nested/unexpected entries → 503', async (t) => {
  const { s, ns, n1, setOverride } = await q1Stack(t);
  const base = r(`${ns}/`, { col: true }) + r(`${ns}/projects/`, { col: true }) + r(`${ns}/progress/`, { col: true });
  setOverride((p) => (p === ns ? ms(base + r(`${ns}/notes/`, { col: true, direct: 'HTTP/1.1 200 OK', status: 'HTTP/1.1 404 Not Found' })) : null));
  await expectIncomplete(s, 'response status + propstat status');
  setOverride((p) => (p === ns ? ms(base + r(`${ns}/notes/`, { col: true, direct: 'HTTP/1.1 200 OK' })) : null));
  await expectIncomplete(s, 'response status + propstat (both 200) is still ambiguous');
  setOverride((p) => (p === ns ? ms(base + r(`${ns}/notes/`, { col: true, status: 'HTTP/1.1 403 Forbidden' })) : null));
  await expectIncomplete(s, 'kind collection with non-2xx propstat');
  setOverride((p) => (p === `${ns}/notes` ? ms(r(`${ns}/notes/`, { col: true }) + r(`${ns}/notes/${n1.literatureId}.json`) + r(`${ns}/notes/sub/`, { col: true })) : null));
  await expectIncomplete(s, 'nested collection inside a kind', 'unrecognized_entry');
  setOverride((p) => (p === ns ? ms(base + r(`${ns}/notes/`, { col: true }) + r(`${ns}/stray.json`)) : null));
  await expectIncomplete(s, 'file at namespace root', 'unrecognized_entry');
  setOverride((p) => (p === ns ? ms(base + r(`${ns}/notes.json`)) : null));
  await expectIncomplete(s, 'kind present as a file, not a collection');
});

test('R03-Q1d absent namespace is unproven → 503 namespace_absent (not 200 count 0)', async (t) => {
  const s = await startStack();
  t.after(() => s.stop());
  await expectIncomplete(s, 'never-created namespace', 'namespace_absent');
});

test('R03-Q1d valid zero-record managed namespace → 200 count 0; restores once into a fresh namespace', async (t) => {
  const s = await startStack();
  t.after(() => s.stop());
  for (const p of ['', '/notes', '/projects', '/progress']) s.mock.collections.add(`/lms-poc/${s.namespace}${p}`);
  const ex = await s.client.exportAll();
  assert.equal(ex.status, 200); assert.equal(ex.data.count, 0);
  const rs = await s.client.restore(ex.data, 'restore-q1-empty');
  assert.deepEqual([rs.status, rs.data.outcome, rs.data.expected], [200, 'restored', 0]);
  assert.equal((await s.client.restore(ex.data, 'restore-q1-empty')).status, 409);
});

test('R03-Q1d valid two-record namespace → count 2, unique manifest, byte-identical one-time restore', async (t) => {
  const s = await startStack();
  t.after(() => s.stop());
  const notes = [syntheticNote(9000001, undefined, 0), syntheticNote(9000001, undefined, 1)];
  for (const n of notes) await s.client.put('notes', n.literatureId, n, '*');
  const ex = await s.client.exportAll();
  assert.equal(ex.status, 200); assert.equal(ex.data.count, 2);
  assert.equal(new Set(ex.data.records.map((x) => `${x.kind}/${x.id}`)).size, 2);
  const rs = await s.client.restore(ex.data, 'restore-q1-two');
  assert.deepEqual([rs.data.outcome, rs.data.verified], ['restored', 2]);
  const src = s.mock.snapshot().filter((f) => f.path.startsWith(`/lms-poc/${s.namespace}/`)).map((f) => [f.path.split('/').slice(3).join('/'), f.sha256]);
  const dst = s.mock.snapshot().filter((f) => f.path.startsWith('/lms-poc/restore-q1-two/')).map((f) => [f.path.split('/').slice(3).join('/'), f.sha256]);
  assert.deepEqual(dst, src);
  assert.equal((await s.client.restore(ex.data, 'restore-q1-two')).status, 409, 'one-time');
});

test('R03-Q1e INFO / UNSUPPORTED: a record silently omitted by a well-formed kind listing is NOT detectable', async (t) => {
  const { s, ns, n1, setOverride } = await q1Stack(t);
  setOverride((p) => (p === `${ns}/notes` ? ms(r(`${ns}/notes/`, { col: true }) + r(`${ns}/notes/${n1.literatureId}.json`)) : null));
  const ex = await s.client.exportAll();
  // Pinned on purpose: without a trusted manifest/snapshot the API cannot know an unknown record exists.
  assert.deepEqual([ex.status, ex.data.count], [200, 2], 'documented provider-integrity dependency (README): not claimed as complete');
});

// ---------------------------------------------------------------- Q2
async function fenceStack(t, etagMode = 'generation') {
  const s = await startStack({ timeoutMs: 250, mockOptions: { etagMode } });
  t.after(() => s.stop());
  const note = syntheticNote();
  const c = await s.client.put('notes', note.literatureId, note, '*');
  assert.equal(c.data.outcome, 'saved');
  const path = `/lms-poc/${s.namespace}/notes/${note.literatureId}.json`;
  const stored = () => decodeEnvelope(s.mock.files.get(path).bytes).data;
  const puts = () => s.mock.requestLog.filter((e) => e.method === 'PUT' && e.path === path).length;
  return { s, note, rev: c.data.revision, path, stored, puts };
}
async function unknownOp(s, note, rev, faultKind = 'hang', holdId) {
  s.mock.faults.push({ method: 'PUT', kind: faultKind, ...(holdId ? { holdId } : {}) });
  const opId = s.client.newOperationId();
  const v2 = { ...note, question: `pending ${opId.slice(0, 6)}` };
  assert.equal((await s.client.put('notes', note.literatureId, v2, rev, opId)).data.outcome, 'unknown');
  if (holdId) await s.mock.waitHeld(holdId);
  return { opId, v2 };
}

test('R03-Q2a (QA R1l) dishonest fence PUT ETag + content-hash storage: non-terminal, then late original commits → committed', async (t) => {
  const { s, note, rev, stored } = await fenceStack(t, 'content-hash');
  const { opId, v2 } = await unknownOp(s, note, rev, 'hold', 'r1l');
  s.mock.faults.push({ method: 'PUT', kind: 'bogus-etag' }); // fence PUT claims "bogus-0"; storage keeps base
  const f = await s.client.fence(opId);
  assert.deepEqual([f.data.outcome, f.data.reason, f.data.terminal], ['fence_not_confirmed', 'readback_etag_mismatch', false]);
  assert.equal((await s.client.put('notes', note.literatureId, v2, rev, opId)).data.outcome, 'verification_required');
  s.mock.release('r1l');
  await until(() => stored().question === v2.question);
  const v = await s.client.verify(opId);
  assert.deepEqual([v.data.outcome, v.data.terminal], ['committed', true], 'no stale terminal not_committed');
});

test('R03-Q2a same dishonest PUT ETag on generation storage: GET ETag ≠ PUT ETag → non-terminal', async (t) => {
  const { s, note, rev } = await fenceStack(t);
  const { opId } = await unknownOp(s, note, rev);
  s.mock.faults.push({ method: 'PUT', kind: 'bogus-etag' });
  const f = await s.client.fence(opId);
  assert.deepEqual([f.data.outcome, f.data.reason, f.data.terminal], ['fence_not_confirmed', 'readback_etag_mismatch', false]);
});

test('R03-Q2b conforming generation ETags: terminal only after matching PUT+GET strong ETags ≠ base and identical bytes (both race orders)', async (t) => {
  const { s, note, rev, stored, path } = await fenceStack(t);
  const before = s.mock.files.get(path).bytes;
  const a = await unknownOp(s, note, rev, 'hold', 'qa');
  const f = await s.client.fence(a.opId);
  assert.deepEqual([f.data.outcome, f.data.terminal], ['not_committed', true]);
  assert.equal(f.data.currentRevision, s.mock.files.get(path).etag, 'reported revision is the read-back ETag');
  assert.ok(s.mock.files.get(path).bytes.equals(before), 'fence left the bytes unchanged');
  s.mock.release('qa'); await sleep(60);
  assert.deepEqual(stored(), note, 'late write rejected by CAS');
  assert.equal((await s.client.verify(a.opId)).data.outcome, 'not_committed');
  const cur = (await s.client.get('notes', note.literatureId)).data.revision;
  const b = await unknownOp(s, note, cur, 'hold', 'qb');
  s.mock.release('qb');
  await until(() => stored().question === b.v2.question);
  assert.deepEqual([(await s.client.fence(b.opId)).data.outcome], ['committed']);
});

test('R03-Q2b content-hash identical bytes still non-terminal (P1-R1 preserved)', async (t) => {
  const { s, note, rev } = await fenceStack(t, 'content-hash');
  const { opId } = await unknownOp(s, note, rev);
  const f = await s.client.fence(opId);
  assert.deepEqual([f.data.outcome, f.data.reason, f.data.terminal], ['fence_not_confirmed', 'etag_unchanged', false]);
});

const READBACK_FAULTS = [
  ['GET 500 on read-back', { method: 'GET', kind: 'status', status: 500, skip: 1 }, 'readback_error'],
  ['GET hang on read-back (timeout)', { method: 'GET', kind: 'hang', skip: 1 }, 'readback_unavailable'],
  ['GET weak ETag on read-back', { method: 'GET', kind: 'weaken-etag', skip: 1 }, 'readback_untrusted_etag'],
  ['GET strong ETag ≠ PUT ETag', { method: 'GET', kind: 'bogus-etag', skip: 1 }, 'readback_etag_mismatch'],
  ['GET body changed on read-back', { method: 'GET', kind: 'corrupt-read', skip: 1 }, null],
];
for (const [label, fault, reason] of READBACK_FAULTS) {
  test(`R03-Q2c ${label} → fence_not_confirmed, original Unknown retained, no re-send`, async (t) => {
    const { s, note, rev, puts } = await fenceStack(t);
    const { opId, v2 } = await unknownOp(s, note, rev);
    const before = puts();
    s.mock.faults.push(fault); // skip:1 lets the fence's initial read through; hits the read-back GET
    const f = await s.client.fence(opId);
    assert.equal(f.data.outcome, 'fence_not_confirmed'); assert.equal(f.data.terminal, false);
    if (reason) assert.equal(f.data.reason, reason);
    assert.equal(puts() - before, 1, 'only the fence PUT itself');
    assert.equal((await s.client.put('notes', note.literatureId, v2, rev, opId)).data.outcome, 'verification_required');
    assert.notEqual((await s.client.verify(opId)).data.terminal, true);
  });
}

test('R03-Q2c read-back finds the object deleted → record_missing (non-terminal)', async (t) => {
  const { s, note, rev } = await fenceStack(t);
  const { opId } = await unknownOp(s, note, rev);
  s.mock.faults.push({ method: 'GET', kind: 'status', status: 404, skip: 1 });
  const f = await s.client.fence(opId);
  assert.deepEqual([f.data.outcome, f.data.terminal], ['record_missing', false]);
});

test('R03-Q2c third-party overwrite between fence PUT and read-back → non-terminal', async (t) => {
  const { s, note, rev } = await fenceStack(t);
  const { opId } = await unknownOp(s, note, rev);
  s.mock.faults.push({ method: 'GET', kind: 'hold', holdId: 'rb', skip: 1 });
  const fp = s.client.fence(opId);
  await s.mock.waitHeld('rb');
  const cur = (await s.adapter.get(`/${s.namespace}/notes/${note.literatureId}.json`)).etag; // the fence's new ETag
  const w = await s.client.put('notes', note.literatureId, { ...note, question: 'third party' }, cur);
  assert.equal(w.data.outcome, 'saved');
  s.mock.release('rb');
  const f = await fp;
  assert.equal(f.data.terminal, false); assert.equal(f.data.outcome, 'fence_not_confirmed');
});

test('R03-Q2c fence PUT 5xx / missing / weak ETag → non-terminal', async (t) => {
  const { s, note, rev } = await fenceStack(t);
  for (const [fault, reason] of [[{ method: 'PUT', kind: 'status', status: 503 }, 'fence_unknown'], [{ method: 'PUT', kind: 'strip-etag' }, 'no_etag'], [{ method: 'PUT', kind: 'weaken-etag' }, 'untrusted_etag']]) {
    const cur = (await s.client.get('notes', note.literatureId)).data.revision;
    const { opId } = await unknownOp(s, note, cur);
    s.mock.faults.push(fault);
    const f = await s.client.fence(opId);
    assert.deepEqual([f.data.outcome, f.data.reason, f.data.terminal], ['fence_not_confirmed', reason, false]);
  }
  assert.ok(rev);
});

// ---------------------------------------------------------------- Q3 / Q4 / Q5 informational probes
test('R03-Q3a INFO: beyond the tombstone window a previously REJECTED op can be re-sent and save (documented)', async (t) => {
  const s = await startStack({ timeoutMs: 250, maxPerPrincipal: 1, maxTombstonesPerPrincipal: 1 });
  t.after(() => s.stop());
  const note = syntheticNote();
  const rev = (await s.client.put('notes', note.literatureId, note, '*')).data.revision;
  s.mock.faults.push({ method: 'PUT', kind: 'status', status: 429 });
  const op = s.client.newOperationId();
  const v = { ...note, question: 'rejected then forgotten' };
  assert.equal((await s.client.put('notes', note.literatureId, v, rev, op)).data.reason, 'rate_limited');
  for (let i = 0; i < 3; i++) { const p = { projectId: `proj-fill-${i}`, name: 'fill' }; await s.client.put('projects', p.projectId, p, '*'); }
  const replay = await s.client.put('notes', note.literatureId, v, rev, op);
  assert.equal(replay.data.outcome, 'saved', 'same Operation-Id re-dispatched after protection expired (README Q3)');
});

test('R03-Q4 INFO: Unknown-saturated principal stays blocked; global cap below the sum of quotas starves others', async (t) => {
  const s = await startStack({ timeoutMs: 250, maxPerPrincipal: 2, maxLedgerEntries: 2, extraTokens: 1 });
  t.after(() => s.stop());
  const note = syntheticNote();
  let cur = (await s.client.put('notes', note.literatureId, note, '*')).data.revision;
  for (let i = 0; i < 2; i++) {
    s.mock.faults.push({ method: 'PUT', kind: 'hang' });
    assert.equal((await s.client.put('notes', note.literatureId, { ...note, question: `u${i}` }, cur)).data.outcome, 'unknown');
    cur = (await s.client.get('notes', note.literatureId)).data.revision;
  }
  const self = await s.client.put('notes', note.literatureId, note, cur);
  assert.equal(self.data.reason, 'principal_ledger_full', 'blocked while its Unknown slots are unresolved');
  const n2 = syntheticNote();
  const other = await s.extraClients[0].put('notes', n2.literatureId, n2, '*');
  assert.equal(other.data.reason, 'operation_ledger_full', 'global cap < sum of quotas re-introduces starvation (documented)');
});

test('R03-Q4 INFO: a slowly uploaded request body keeps its reservation pending', async (t) => {
  const s = await startStack();
  t.after(() => s.stop());
  const note = syntheticNote();
  const op = s.client.newOperationId();
  const body = Buffer.from(JSON.stringify(note));
  const { port } = new URL(s.apiUrl);
  const req = http.request({ host: '127.0.0.1', port, method: 'PUT', path: `/api/records/notes/${note.literatureId}`, headers: { Authorization: `Bearer ${s.secrets.apiToken}`, 'Content-Type': 'application/json', 'If-None-Match': '*', 'Operation-Id': op, 'Content-Length': body.length } });
  req.on('error', () => {});
  req.write(body.subarray(0, 5));
  await sleep(50);
  const e = [...s.api.ledger.values()].find((x) => x.opId === op);
  assert.equal(e?.verdict, 'pending', 'reservation held while the client trickles its body');
  req.destroy();
});

test('R03-Q5 INFO: an Unknown fence PUT that applies later strands the operation as indeterminate', async (t) => {
  const { s, note, rev } = await fenceStack(t);
  const { opId } = await unknownOp(s, note, rev);
  s.mock.faults.push({ method: 'PUT', kind: 'hold', holdId: 'fence-late' });
  const fp = s.client.fence(opId);
  await s.mock.waitHeld('fence-late');
  await sleep(400);
  s.mock.release('fence-late');
  assert.deepEqual([(await fp).data.outcome, (await fp).data.terminal], ['fence_not_confirmed', false]);
  await sleep(50);
  const v = await s.client.verify(opId);
  assert.deepEqual([v.data.outcome, v.data.terminal], ['indeterminate', false]);
  const f2 = await s.client.fence(opId);
  assert.deepEqual([f2.data.outcome, f2.data.terminal], ['indeterminate', false], 'no certified safe recovery (documented)');
});

test('R03-Q1b adapter level: duplicate normalized hrefs are reported malformed (not de-duplicated)', async (t) => {
  let xml = null;
  const m = createMockWebDav({ username: 'synthetic', password: 'SYNTH-x', propfindOverride: () => xml });
  const d = await m.start();
  t.after(() => m.stop());
  m.collections.add('/x');
  const a = createWebDavAdapter({ baseUrl: `${d.url}/x`, username: 'synthetic', password: 'SYNTH-x' });
  for (const dup of ['/x/n/a.json', '/x/n/%61.json']) {
    xml = ms(r('/x/n/', { col: true }) + r('/x/n/a.json') + r(dup));
    const p = await a.propfind('/n', '1');
    assert.deepEqual([p.outcome, p.reason], ['malformed', 'duplicate href'], dup);
  }
  xml = ms(r('/x/n/', { col: true }) + r('/x/n', { col: true }));
  assert.equal((await a.propfind('/n', '1')).reason, 'duplicate href', 'trailing-slash variant of the same path');
});

test('R03-Q2c read-back serves different (older, still authentic) bytes under the fence ETag → readback_bytes_changed', async (t) => {
  const { s, note, rev } = await fenceStack(t);
  const v1 = await s.client.put('notes', note.literatureId, { ...note, question: 'v1' }, rev);
  assert.equal(v1.data.outcome, 'saved');
  const { opId } = await unknownOp(s, note, v1.data.revision);
  s.mock.faults.push({ method: 'GET', kind: 'stale-body', skip: 1 });
  const f = await s.client.fence(opId);
  assert.deepEqual([f.data.outcome, f.data.reason, f.data.terminal], ['fence_not_confirmed', 'readback_bytes_changed', false]);
});
