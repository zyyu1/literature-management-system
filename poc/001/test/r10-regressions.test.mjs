// REMEDIATION-10 (D007-A39) — LOCAL / SYNTHETIC ONLY. Single P2: P2-R09-QA-1 (a premature own-scope PROPFIND
// after beginCleanup() consumed the only verification and stranded every own file). The verification is now FINAL
// only: refused before dispatch — no request, no slot, token kept, no STOP — until every own file has had its one
// conditional DELETE attempt. All sockets are 127.0.0.1; all credentials and records are random synthetic values.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createMockWebDav } from '../src/mock-webdav.mjs';
import { createWebDavAdapter } from '../src/webdav-adapter.mjs';
import { createSafeApi } from '../src/safe-api.mjs';
import { createClient } from '../src/client.mjs';
import { literatureId } from '../src/note-codec.mjs';
import { createRequestBudget, ACCESS01_LIMITS, randomId } from '../src/util.mjs';
import { syntheticSecrets } from './helpers.mjs';

const NS = 'poc-ns-r10';
const evidence = (id, obj) => console.log(`R10-EVIDENCE ${id} ${JSON.stringify(obj)}`);
const note = (n) => {
  const id = literatureId(9000003, `S${String(n).padStart(7, '0')}`);
  return { id, data: { literatureId: id, question: `synthetic q ${n}`, arguments: 'a', methods: 'm', contributions: 'c', limitations: 'l' } };
};
const count = (mock, method) => mock.requestLog.filter((e) => e.method === method).length;
const ownStored = (mock) => [...mock.files.keys()].filter((p) => p.startsWith(`/lms-poc/${NS}/`));

async function stack(t, { budget, tokens = 2 } = {}) {
  const sec = syntheticSecrets();
  const apiTokens = [sec.apiToken, ...Array.from({ length: tokens - 1 }, () => `synthetic-token-${randomId(16)}`)];
  const mock = createMockWebDav({ username: sec.davUser, password: sec.davPass });
  const dav = await mock.start();
  mock.collections.add('/lms-poc');
  const adapter = createWebDavAdapter({ baseUrl: `http://127.0.0.1:${dav.port}/lms-poc`, username: sec.davUser, password: sec.davPass, timeoutMs: 800, budget });
  const api = createSafeApi({ adapter, namespace: NS, apiTokens, provenanceKey: sec.provenanceKey, log: () => {} });
  const info = await api.start();
  t.after(async () => { await api.stop(); await mock.stop(); });
  return { mock, adapter, api, clients: apiTokens.map((token) => createClient({ apiUrl: info.url, token })) };
}

/** 2 writers, 20 own files via the safe API (4 MKCOL + 20 x (PUT + read-back) = 44 requests). */
async function twentyFiles(s, budget, base) {
  assert.equal(budget.acquireWriter('A').ok && budget.acquireWriter('B').ok, true);
  const first = note(base);
  assert.equal((await s.clients[0].put('notes', first.id, first.data, '*')).status, 200);
  for (let i = 1; i < 19; i += 2) {
    const [x, y] = [note(base + i), note(base + i + 1)];
    const [rx, ry] = await Promise.all([s.clients[0].put('notes', x.id, x.data, '*'), s.clients[1].put('notes', y.id, y.data, '*')]);
    assert.equal(rx.status, 200); assert.equal(ry.status, 200);
  }
  assert.equal((await s.clients[1].put('notes', note(base + 19).id, note(base + 19).data, '*')).status, 200);
  assert.equal(budget.usage().files, 20);
  return first;
}

/** Early verification: refused before dispatch and nothing in the budget or on the wire changes. */
async function assertEarlyVerificationRefused(s, budget, label, scope = `/${NS}/notes`) {
  const before = { ...budget.usage(), wire: s.mock.requestLog.length, pf: count(s.mock, 'PROPFIND') };
  const r = await s.adapter.propfind(scope, '1');
  assert.equal(r.code, 'CLEANUP_VERIFICATION_PREMATURE', `R10-CLEAN-01 early verification refused before dispatch (${label})`);
  assert.equal(count(s.mock, 'PROPFIND'), before.pf, `R10-CLEAN-01 early verification refused before dispatch: 0 PROPFIND sent (${label})`);
  assert.equal(s.mock.requestLog.length, before.wire);
  const after = budget.usage();
  assert.equal(after.requests, before.requests, `R10-CLEAN-01 early verification consumes no slot (${label})`);
  assert.equal(after.cleanupUsed, before.cleanupUsed, `R10-CLEAN-01 early verification consumes no slot: reserve kept (${label})`);
  assert.equal(after.verified, false, `R10-CLEAN-01 verification token preserved (${label})`);
  assert.equal(after.stopped, before.stopped, `R10-CLEAN-01 no STOP from an early verification (${label})`);
}

test('R10-CLEAN-01 unit: verification refused at 0, 1 and 19 of 20 DELETE attempts; token, slots and STOP state preserved', () => {
  const b = createRequestBudget();
  const own = Array.from({ length: 20 }, (_, i) => `/r/f${i}.json`);
  for (const p of own) { assert.equal(b.admitDispatch({ method: 'PUT', path: p }).ok, true); assert.equal(b.admitDispatchWrite(p, 10).ok, true); }
  b.beginCleanup();
  const check = (k) => {
    const u0 = b.usage();
    const r = b.admitDispatch({ method: 'PROPFIND', path: '/r' });
    assert.equal(r.code, 'CLEANUP_VERIFICATION_PREMATURE', `R10-CLEAN-01 early verification refused before dispatch (unit ${k}/20)`);
    const u1 = b.usage();
    assert.deepEqual([u1.requests, u1.cleanupUsed, u1.verified, u1.stopped], [u0.requests, u0.cleanupUsed, false, null], `R10-CLEAN-01 verification token preserved (unit ${k}/20)`);
  };
  check(0);
  assert.equal(b.admitDispatch({ method: 'DELETE', path: own[0], conditional: true }).ok, true);
  check(1);
  for (let i = 1; i < 19; i++) assert.equal(b.admitDispatch({ method: 'DELETE', path: own[i], conditional: true }).ok, true, 'later DELETEs still admitted');
  check(19);
  assert.equal(b.admitDispatch({ method: 'DELETE', path: own[19], conditional: true }).ok, true);
  assert.equal(b.admitDispatch({ method: 'PROPFIND', path: '/r' }).ok, true, 'R10-CLEAN-01 exactly one final verification after all attempts');
  assert.equal(b.admitDispatch({ method: 'PROPFIND', path: '/r' }).code, 'CLEANUP_VERIFICATION_ALREADY_USED', 'R10-CLEAN-01 second final verification refused');
  assert.equal(b.admitDispatch({ method: 'DELETE', path: own[0], conditional: true }).ok, false, 'repeated DELETE refused');
  assert.equal(b.usage().requests, 20 + 20 + 1);
  assert.equal(b.usage().cleanupUsed, 21);
});

test('R10-CLEAN-01/02 two writers, early cleanup at 75: early PROPFIND at 0/1/19 of 20 refused, 10 stragglers refused, then 20 DELETE + 1 final = 96, 0 files', async (t) => {
  const budget = createRequestBudget();
  const s = await stack(t, { budget });
  const first = await twentyFiles(s, budget, 100);
  assert.equal((await s.clients[0].exportAll()).status, 200);
  for (let i = 0; i < 7; i++) assert.equal((await s.clients[0].get('notes', first.id)).status, 200);
  assert.equal(s.mock.requestLog.length, 75);
  budget.beginCleanup();
  await assertEarlyVerificationRefused(s, budget, '0/20');
  const puts0 = count(s.mock, 'PUT');
  const stragglers = Array.from({ length: 10 }, (_, i) => note(200 + i));
  const res = await Promise.all(stragglers.map((n, i) => s.clients[i % 2].put('notes', n.id, n.data, '*')));
  assert.deepEqual(res.map((r) => r.status), Array(10).fill(503));
  assert.equal(count(s.mock, 'PUT') - puts0, 0, 'R10-CLEAN-02 0 upstream straggler PUT');
  assert.equal(budget.usage().cleanupUsed, 0);
  assert.equal(budget.stopped, null);
  const own = budget.ownFiles();
  const del = async (p) => s.adapter.remove(p, { ifMatch: s.mock.files.get(`/lms-poc${p}`).etag });
  assert.equal((await del(own[0])).outcome, 'committed');
  await assertEarlyVerificationRefused(s, budget, '1/20');
  for (let i = 1; i < 19; i++) assert.equal((await del(own[i])).outcome, 'committed');
  await assertEarlyVerificationRefused(s, budget, '19/20');
  assert.equal((await del(own[19])).outcome, 'committed', 'R10-CLEAN-01 remaining DELETEs still possible after early refusals');
  const v = await s.adapter.propfind(`/${NS}/notes`, '1');
  assert.equal(v.outcome, 'ok', 'R10-CLEAN-01 exactly one final verification after all attempts');
  assert.deepEqual(v.entries.map((e) => e.path), [`/${NS}/notes`]);
  assert.equal(s.mock.requestLog.filter((e) => e.method === 'PROPFIND').at(-1).bodyBytes, 114, '114-byte resourcetype PROPFIND');
  const wire = s.mock.requestLog.length;
  assert.equal((await s.adapter.propfind(`/${NS}/notes`, '1')).code, 'CLEANUP_VERIFICATION_ALREADY_USED', 'R10-CLEAN-01 second final verification refused');
  assert.equal((await s.adapter.remove(own[0], { ifMatch: '"x"' })).outcome, 'not_sent', 'repeated DELETE refused');
  assert.equal(s.mock.requestLog.length, wire, '0 extra sends');
  assert.equal(s.mock.requestLog.length, 96, 'R10-CLEAN-02 75 + 20 + 1 = 96 server requests');
  assert.equal(ownStored(s.mock).length, 0, 'R10-CLEAN-02 0 own files remain');
  evidence('R10-CLEAN-02', { ordinary: 75, earlyVerificationsRefused: 3, stragglersRefused: 10, deletes: 20, finalVerification: 1, serverRequests: 96, ownFilesLeft: 0 });
});

test('R10-CLEAN-02 legacy profile with an early PROPFIND: 79 + 21 = 100, request 101 refused', async (t) => {
  const budget = createRequestBudget();
  const s = await stack(t, { budget });
  const first = await twentyFiles(s, budget, 300);
  assert.equal((await s.clients[0].exportAll()).status, 200);
  let refusedAt = null;
  for (let i = 0; i < 20 && refusedAt === null; i++) if ((await s.clients[0].get('notes', first.id)).status !== 200) refusedAt = budget.usage().requests + 1;
  assert.equal(refusedAt, 80);
  budget.beginCleanup();
  await assertEarlyVerificationRefused(s, budget, 'legacy 0/20');
  for (const p of budget.ownFiles()) assert.equal((await s.adapter.remove(p, { ifMatch: s.mock.files.get(`/lms-poc${p}`).etag })).outcome, 'committed');
  assert.equal((await s.adapter.propfind(`/${NS}/notes`, '1')).outcome, 'ok');
  assert.equal(s.mock.requestLog.length, 100, 'R10-CLEAN-02 legacy 100');
  assert.equal((await s.adapter.get(`/${NS}/notes`)).code, 'BUDGET_REQUESTS', 'R10-CLEAN-02 request 101 refused');
  assert.equal(s.mock.requestLog.length, 100);
  assert.deepEqual({ ...ACCESS01_LIMITS }, { maxRequests: 100, windowMs: 1_800_000, maxFiles: 20, maxFileBytes: 1_048_576, maxTotalBytes: 20_971_520, maxWriters: 2 });
});

test('R10-SAFE 412 counts as attempted (not success): final verification allowed and the residual stays visible', async (t) => {
  const budget = createRequestBudget();
  const s = await stack(t, { budget, tokens: 1 });
  s.mock.collections.add(`/lms-poc/${NS}`);
  for (let i = 0; i < 3; i++) assert.equal((await s.adapter.put(`/${NS}/f${i}.json`, Buffer.from('{}'), { ifNoneMatch: '*' })).outcome, 'committed');
  budget.beginCleanup();
  const own = budget.ownFiles();
  const bad = await s.adapter.remove(own[0], { ifMatch: '"wrong-etag"' });
  assert.equal(bad.outcome, 'precondition_failed', '412 is not success');
  await assertEarlyVerificationRefused(s, budget, '412 + 0 of 2 remaining', `/${NS}`);
  for (const p of own.slice(1)) assert.equal((await s.adapter.remove(p, { ifMatch: s.mock.files.get(`/lms-poc${p}`).etag })).outcome, 'committed');
  const v = await s.adapter.propfind(`/${NS}`, '1');
  assert.equal(v.outcome, 'ok', 'all attempted (one 412) -> final verification allowed');
  assert.deepEqual(v.entries.map((e) => e.path).filter((p) => p.endsWith('.json')), [own[0]], 'R10-SAFE residual from the 412 stays visible, not reported clean');
  assert.equal((await s.adapter.remove(own[0], { ifMatch: s.mock.files.get(`/lms-poc${own[0]}`).etag })).outcome, 'not_sent', 'no uncontrolled retry');
  assert.equal(ownStored(s.mock).length, 1);
});

for (const status of [401, 429]) {
  test(`R10-SAFE upstream ${status} mid-cleanup: hard STOP still refuses DELETE and the verification`, async (t) => {
    const budget = createRequestBudget();
    const s = await stack(t, { budget, tokens: 1 });
    s.mock.collections.add(`/lms-poc/${NS}`);
    for (let i = 0; i < 3; i++) assert.equal((await s.adapter.put(`/${NS}/f${i}.json`, Buffer.from('{}'), { ifNoneMatch: '*' })).outcome, 'committed');
    budget.beginCleanup();
    const own = budget.ownFiles();
    s.mock.faults.push({ method: 'DELETE', kind: 'status', status, retryAfter: '60' });
    assert.equal((await s.adapter.remove(own[0], { ifMatch: s.mock.files.get(`/lms-poc${own[0]}`).etag })).outcome, 'rejected');
    assert.equal((await s.adapter.remove(own[1], { ifMatch: s.mock.files.get(`/lms-poc${own[1]}`).etag })).code, `UPSTREAM_${status}`);
    assert.equal((await s.adapter.propfind(`/${NS}`, '1')).code, `UPSTREAM_${status}`, `R10-SAFE ${status} STOP outranks verification`);
    assert.equal(count(s.mock, 'DELETE'), 1);
    assert.equal(ownStored(s.mock).length, 3, 'residual files reported, not force-deleted');
  });
}

test('R10-SAFE lost-ACK own write: its DELETE cannot be claimed, so no final verification and no false "clean"', async (t) => {
  const budget = createRequestBudget();
  const s = await stack(t, { budget, tokens: 1 });
  s.mock.collections.add(`/lms-poc/${NS}`);
  assert.equal((await s.adapter.put(`/${NS}/known.json`, Buffer.from('{}'), { ifNoneMatch: '*' })).outcome, 'committed');
  s.mock.faults.push({ method: 'PUT', kind: 'commit-then-drop' });
  assert.equal((await s.adapter.put(`/${NS}/lost.json`, Buffer.from('{}'), { ifNoneMatch: '*' })).outcome, 'unknown', 'stored but unacknowledged');
  budget.beginCleanup();
  assert.equal((await s.adapter.remove(`/${NS}/known.json`, { ifMatch: s.mock.files.get(`/lms-poc/${NS}/known.json`).etag })).outcome, 'committed');
  await assertEarlyVerificationRefused(s, budget, 'unknown write not attempted', `/${NS}`);
  assert.equal(ownStored(s.mock).length, 1, 'R10-SAFE unknown write left for operator quarantine, never blind-deleted');
  assert.equal(count(s.mock, 'PUT'), 2, 'no retry of the unknown write');
  evidence('R10-SAFE', { unknownWriteResidual: 1, finalVerification: 'refused (finality not assertable)' });
});
