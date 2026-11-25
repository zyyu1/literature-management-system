// POC-04 — two independent client PROCESSES, each behind its own safe-API PROCESS,
// sharing one storage (LOCAL MOCK). Proves read-after-confirmed-save on explicit
// refresh only. No push / live sync is claimed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { startMultiProcessStack, syntheticNote } from './helpers.mjs';

test('POC-04 client B observes client A\'s confirmed revision after explicit refresh', async (t) => {
  const s = await startMultiProcessStack({ apis: 2 });
  t.after(() => s.stop());
  const [A, B] = s.clients;
  assert.notEqual(s.apiProcs[0].child.pid, s.apiProcs[1].child.pid);
  const note = syntheticNote();
  const id = note.literatureId;

  const empty = await B.send({ cmd: 'get', kind: 'notes', id });
  assert.equal(empty.status, 404);

  const c = await A.send({ cmd: 'put', kind: 'notes', id, record: note, revision: '*' });
  assert.equal(c.data.outcome, 'saved');
  const r1 = c.data.revision;

  const b1 = await B.send({ cmd: 'get', kind: 'notes', id });
  assert.equal(b1.status, 200);
  assert.equal(b1.data.revision, r1, 'B sees exactly the revision A was told was saved');
  assert.deepEqual(b1.data.record, note);

  const upd = { ...note, question: '客户端 A 的第二版 (synthetic)' };
  const u = await A.send({ cmd: 'put', kind: 'notes', id, record: upd, revision: r1 });
  assert.equal(u.data.outcome, 'saved');

  const cached = await B.send({ cmd: 'cached' });
  assert.equal(cached.cachedRevision, r1, 'B is NOT pushed the new revision; it still holds r1 until refresh');
  const b2 = await B.send({ cmd: 'get', kind: 'notes', id });
  assert.equal(b2.data.revision, u.data.revision);
  assert.deepEqual(b2.data.record, upd);

  // A write that is definitely NOT saved must never become visible to B.
  s.mock.faults.push({ method: 'PUT', kind: 'status', status: 423 });
  const failed = await A.send({ cmd: 'put', kind: 'notes', id, record: { ...upd, question: 'should not persist' }, revision: u.data.revision });
  assert.equal(failed.status, 423); assert.equal(failed.data.outcome, 'not_saved');
  const b3 = await B.send({ cmd: 'get', kind: 'notes', id });
  assert.equal(b3.data.revision, u.data.revision);
  assert.deepEqual(b3.data.record, upd, 'last CONFIRMED state is what B observes');
});
