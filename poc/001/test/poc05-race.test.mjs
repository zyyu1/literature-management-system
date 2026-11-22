// POC-05 — deterministic stale two-writer race across independent processes (LOCAL MOCK).
// The conflict guard is the STORAGE-LEVEL atomic If-Match check, not an API mutex:
// writers go through two different API processes. This proves client/API logic
// only; it does NOT prove Nutstore provides atomic If-Match (BLOCKED_REAL_SERVICE).
import test from 'node:test';
import assert from 'node:assert/strict';
import { startMultiProcessStack, startStack, syntheticNote } from './helpers.mjs';
import { decodeEnvelope, encodeEnvelope } from '../src/note-codec.mjs';

const ROUNDS = 50;

test(`POC-05 ${ROUNDS} forced-overlap rounds: exactly one stale writer wins, loser gets 412 with winner intact`, async (t) => {
  const s = await startMultiProcessStack({ apis: 2 });
  t.after(() => s.stop());
  const [A, B] = s.clients;
  const note = syntheticNote();
  const id = note.literatureId;
  const path = `/lms-poc/${s.namespace}/notes/${id}.json`;
  assert.equal((await A.send({ cmd: 'put', kind: 'notes', id, record: note, revision: '*' })).data.outcome, 'saved');
  const tally = { A: 0, B: 0 };

  for (let round = 0; round < ROUNDS; round++) {
    const ra = await A.send({ cmd: 'get', kind: 'notes', id });
    const rb = await B.send({ cmd: 'get', kind: 'notes', id });
    assert.equal(ra.data.revision, rb.data.revision, 'both writers start from the same revision');
    const base = ra.data.revision;
    const va = { ...note, question: `A round ${round}` };
    const vb = { ...note, question: `B round ${round}` };
    s.mock.setBarrier({ method: 'PUT', pathIncludes: `/notes/${id}.json`, count: 2 }); // both PUTs in flight at storage
    const [wa, wb] = await Promise.all([
      A.send({ cmd: 'put', kind: 'notes', id, record: va, revision: base }),
      B.send({ cmd: 'put', kind: 'notes', id, record: vb, revision: base }),
    ]);
    const outcomes = [wa.data.outcome, wb.data.outcome].sort();
    assert.deepEqual(outcomes, ['conflict', 'saved'], `round ${round}: exactly one saved`);
    const [winner, loser, wv] = wa.data.outcome === 'saved' ? [wa, wb, va] : [wb, wa, vb];
    tally[winner.name.slice(-1)]++;
    assert.equal(loser.status, 412);
    assert.equal(loser.data.currentRevision, winner.data.revision, 'loser is shown the winning revision');
    assert.deepEqual(loser.data.currentRecord, wv, 'loser sees winner content, can resolve manually');
    const stored = decodeEnvelope(s.mock.files.get(path).bytes).data;
    assert.deepEqual(stored, wv, 'storage holds the winner; loser did not overwrite');
  }
  const puts = s.mock.requestLog.filter((e) => e.method === 'PUT');
  assert.ok(puts.every((e) => e.ifMatch || e.ifNoneMatch), 'every upstream write was conditional');
  t.diagnostic(`winners: A=${tally.A} B=${tally.B} over ${ROUNDS} rounds`);
});

test('POC-05 concurrent create-only race: one create wins, other 412', async (t) => {
  const s = await startMultiProcessStack({ apis: 2 });
  t.after(() => s.stop());
  const [A, B] = s.clients;
  const note = syntheticNote();
  s.mock.setBarrier({ method: 'PUT', pathIncludes: `/notes/${note.literatureId}.json`, count: 2 });
  const [wa, wb] = await Promise.all([
    A.send({ cmd: 'put', kind: 'notes', id: note.literatureId, record: { ...note, question: 'A' }, revision: '*' }),
    B.send({ cmd: 'put', kind: 'notes', id: note.literatureId, record: { ...note, question: 'B' }, revision: '*' }),
  ]);
  assert.deepEqual([wa.status, wb.status].sort(), [200, 412]);
});

test('POC-05 negative control: naive GET-then-unconditional-PUT LOSES an update (why If-Match is mandatory)', async (t) => {
  const s = await startStack();
  t.after(() => s.stop());
  const a = s.adapter;
  await a.mkcol(`/${s.namespace}`); await a.mkcol(`/${s.namespace}/notes`);
  const note = syntheticNote();
  const p = `/${s.namespace}/notes/${note.literatureId}.json`;
  const enc = (q) => encodeEnvelope({ kind: 'notes', id: note.literatureId, operationId: 'naive', data: { ...note, question: q } });
  await a.put(p, enc('v0'), { ifNoneMatch: '*' });
  await a.get(p); await a.get(p); // both naive writers "check" first
  s.mock.setBarrier({ method: 'PUT', pathIncludes: note.literatureId, count: 2 });
  const [x, y] = await Promise.all([
    a.put(p, enc('naive A'), { unsafeUnconditional: true }),
    a.put(p, enc('naive B'), { unsafeUnconditional: true }),
  ]);
  assert.equal(x.outcome, 'committed'); assert.equal(y.outcome, 'committed');
  const final = decodeEnvelope((await a.get(p)).body).data.question;
  assert.ok(['naive A', 'naive B'].includes(final));
  t.diagnostic(`naive mode: both writers told "committed", one update silently lost (final=${final})`);
});
