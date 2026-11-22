// POC-01 — WebDAV protocol CRUD (LOCAL MOCK). Provider kind: MOCK.
import test from 'node:test';
import assert from 'node:assert/strict';
import { startStack, syntheticNote } from './helpers.mjs';
import { sha256Hex } from '../src/util.mjs';

test('POC-01 adapter CRUD: exact payload, status codes, conditional update/delete', async (t) => {
  const s = await startStack();
  t.after(() => s.stop());
  const a = s.adapter;
  assert.equal((await a.mkcol('/poc01')).status, 201, 'MKCOL creates isolated test collection');
  const p = '/poc01/synthetic-file.json';
  const v1 = Buffer.from(JSON.stringify({ synthetic: true, text: '创建 v1' }), 'utf8');

  const c = await a.put(p, v1, { ifNoneMatch: '*' });
  assert.equal(c.outcome, 'committed'); assert.equal(c.status, 201); assert.ok(c.etag);
  const again = await a.put(p, v1, { ifNoneMatch: '*' });
  assert.equal(again.outcome, 'precondition_failed', 'create-only refuses to overwrite');

  const r1 = await a.get(p);
  assert.equal(r1.outcome, 'ok'); assert.equal(r1.etag, c.etag);
  assert.equal(sha256Hex(r1.body), sha256Hex(v1), 'byte-exact read');

  const v2 = Buffer.from(JSON.stringify({ synthetic: true, text: '更新 v2' }), 'utf8');
  const u = await a.put(p, v2, { ifMatch: c.etag });
  assert.equal(u.outcome, 'committed'); assert.equal(u.status, 204); assert.notEqual(u.etag, c.etag);
  assert.equal(sha256Hex((await a.get(p)).body), sha256Hex(v2));

  const sameBytes = await a.put(p, v2, { ifMatch: u.etag });
  assert.notEqual(sameBytes.etag, u.etag, 'rewrite with identical bytes still yields a new ETag (no ABA)');

  const staleDel = await a.remove(p, { ifMatch: c.etag });
  assert.equal(staleDel.outcome, 'precondition_failed', 'stale delete refused');
  const d = await a.remove(p, { ifMatch: sameBytes.etag });
  assert.equal(d.outcome, 'committed'); assert.equal(d.status, 204);
  assert.equal((await a.get(p)).outcome, 'not_found');

  await assert.rejects(() => a.put(p, v1, {}), /conditional write required/, 'unconditional write refused by adapter');
  await assert.rejects(() => a.remove(p, {}), /conditional delete required/);
  const missingParent = await a.put('/no-such-dir/x.json', v1, { ifNoneMatch: '*' });
  assert.equal(missingParent.outcome, 'rejected'); assert.equal(missingParent.status, 409);

  for (const e of s.mock.requestLog) assert.ok(e.path.startsWith('/lms-poc/'), `all upstream traffic stays under fixed base path: ${e.path}`);
});

test('POC-01 API CRUD (create/read/update via safe API; delete intentionally not exposed)', async (t) => {
  const s = await startStack();
  t.after(() => s.stop());
  const note = syntheticNote();
  const c = await s.client.put('notes', note.literatureId, note, '*');
  assert.equal(c.status, 200); assert.equal(c.data.outcome, 'saved');
  const g = await s.client.get('notes', note.literatureId);
  assert.equal(g.status, 200); assert.deepEqual(g.data.record, note); assert.equal(g.data.revision, c.data.revision);
  const upd = { ...note, limitations: '更新后的局限 (synthetic)' };
  const u = await s.client.put('notes', note.literatureId, upd, g.data.revision);
  assert.equal(u.data.outcome, 'saved');
  assert.deepEqual((await s.client.get('notes', note.literatureId)).data.record, upd);
  const del = await s.client.raw('DELETE', `/api/records/notes/${note.literatureId}`);
  assert.equal(del.status, 405, 'API exposes no delete');
  assert.equal(s.mock.requestLog.filter((e) => e.method === 'DELETE').length, 0);
});
