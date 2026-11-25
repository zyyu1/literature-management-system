// REMEDIATION-09 (D007-A32 Option A) — LOCAL / SYNTHETIC ONLY.
// Regressions for P2-R08-QA-1/2/3 (REMEDIATION_09.md §3): R09-CLEAN-01/02 (cleanup gate + early-cleanup race),
// R09-B5-03 (a refused write admission must never reach the store), R09-Q4B-04 (ABSOLUTE 1000 ms inbound-body
// deadline under a continuous trickle, against UNCHANGED src/safe-api.mjs), R09-SAFE-05 (401/429 STOP, Unknown
// untouched, ACCESS-01 ceilings and the 114-byte PROPFIND unchanged). Every socket is 127.0.0.1; all
// credentials and records are random synthetic values; no real host, provider, credential or PDF.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import { createMockWebDav } from '../src/mock-webdav.mjs';
import { createWebDavAdapter, PROPFIND_RESOURCETYPE_BODY } from '../src/webdav-adapter.mjs';
import { createSafeApi } from '../src/safe-api.mjs';
import { createClient } from '../src/client.mjs';
import { literatureId } from '../src/note-codec.mjs';
import { createRequestBudget, ACCESS01_LIMITS, randomId } from '../src/util.mjs';
import { syntheticSecrets } from './helpers.mjs';

const NS = 'poc-ns-r09';
const evidence = (id, obj) => console.log(`R09-EVIDENCE ${id} ${JSON.stringify(obj)}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const note = (n) => {
  const id = literatureId(9000002, `S${String(n).padStart(7, '0')}`);
  return { id, data: { literatureId: id, question: `synthetic q ${n}`, arguments: 'a', methods: 'm', contributions: 'c', limitations: 'l' } };
};
const count = (mock, method) => mock.requestLog.filter((e) => e.method === method).length;
const ownStored = (mock) => [...mock.files.keys()].filter((p) => p.startsWith(`/lms-poc/${NS}/`));
const snapshot = (mock) => JSON.stringify([...mock.files.entries()].map(([p, f]) => [p, f.etag, Buffer.from(f.bytes).toString('base64')]).sort());

async function stack(t, { budget, tokens = 1, api: apiOpts = {}, adapter: adapterOpts = {} } = {}) {
  const sec = syntheticSecrets();
  const apiTokens = [sec.apiToken, ...Array.from({ length: tokens - 1 }, () => `synthetic-token-${randomId(16)}`)];
  const mock = createMockWebDav({ username: sec.davUser, password: sec.davPass });
  const dav = await mock.start();
  mock.collections.add('/lms-poc');
  const adapter = createWebDavAdapter({ baseUrl: `http://127.0.0.1:${dav.port}/lms-poc`, username: sec.davUser, password: sec.davPass, timeoutMs: 800, ...(budget ? { budget } : {}), ...adapterOpts });
  const api = createSafeApi({ adapter, namespace: NS, apiTokens, provenanceKey: sec.provenanceKey, log: () => {}, ...apiOpts });
  const info = await api.start();
  t.after(async () => { await api.stop(); await mock.stop(); });
  return { sec, mock, dav, adapter, api, apiUrl: info.url, apiTokens, clients: apiTokens.map((token) => createClient({ apiUrl: info.url, token })) };
}

/** 2 writers, 20 own synthetic files through the safe API: 4 MKCOL + 20 x (PUT + read-back GET) = 44 requests. */
async function twentyFiles(s, budget, base = 0) {
  assert.equal(budget.acquireWriter('A').ok && budget.acquireWriter('B').ok, true);
  const first = note(base);
  assert.equal((await s.clients[0].put('notes', first.id, first.data, '*')).status, 200);
  for (let i = 1; i < 19; i += 2) {
    const [x, y] = [note(base + i), note(base + i + 1)];
    const [rx, ry] = await Promise.all([s.clients[0].put('notes', x.id, x.data, '*'), s.clients[1].put('notes', y.id, y.data, '*')]);
    assert.equal(rx.status, 200); assert.equal(ry.status, 200);
  }
  const last = note(base + 19);
  assert.equal((await s.clients[1].put('notes', last.id, last.data, '*')).status, 200);
  assert.equal(budget.usage().requests, 44);
  assert.equal(budget.usage().files, 20);
  return first;
}

// =====================================================================================================
// R09-CLEAN-01 — beginCleanup() is an irreversible gate; nothing ordinary is relabelled as cleanup
// =====================================================================================================
test('R09-CLEAN-01 unit: after beginCleanup ordinary work is refused without STOP and without consuming a slot', () => {
  const b = createRequestBudget();
  assert.equal(b.admitDispatch({ method: 'PUT', path: '/r/own.json' }).ok, true);
  assert.equal(b.admitDispatchWrite('/r/own.json', 10).ok, true, 'own synthetic file admitted in the ordinary phase');
  assert.equal(b.admitDispatch({ method: 'GET', path: '/r/own.json' }).ok, true);
  b.beginCleanup();
  const before = b.usage();
  assert.equal(b.admitRequest('request').ok, false, 'R09-CLEAN-01 ordinary work is never relabelled as cleanup');
  assert.equal(b.admitRequest('request').code, 'CLEANUP_PHASE_ORDINARY_REFUSED');
  assert.equal(b.admitWrite('/r/new.json', 1).code, 'CLEANUP_PHASE_ORDINARY_REFUSED');
  for (const method of ['PUT', 'MKCOL', 'GET', 'POST', 'MOVE', 'COPY', 'LOCK']) {
    assert.equal(b.admitDispatch({ method, path: '/r/own.json', conditional: true, bytes: 1 }).code, 'CLEANUP_PHASE_ORDINARY_REFUSED', `R09-CLEAN-01 ${method} refused in cleanup phase`);
  }
  assert.equal(b.admitDispatch({ method: 'DELETE', path: '/r/own.json', conditional: false }).code, 'CLEANUP_UNCONDITIONAL_DELETE', 'R09-CLEAN-01 unconditional DELETE refused');
  assert.equal(b.admitDispatch({ method: 'DELETE', path: '/r/other.json', conditional: true }).code, 'CLEANUP_NOT_OWN_FILE', 'R09-CLEAN-01 foreign DELETE refused');
  assert.equal(b.admitDispatch({ method: 'DELETE', path: '/r', conditional: true }).code, 'CLEANUP_NOT_OWN_FILE', 'R09-CLEAN-01 collection (recursive) DELETE refused');
  assert.equal(b.admitDispatch({ method: 'PROPFIND', path: '/' }).code, 'CLEANUP_VERIFICATION_SCOPE');
  assert.equal(b.admitDispatch({ method: 'PROPFIND', path: '/other' }).code, 'CLEANUP_VERIFICATION_SCOPE');
  const after = b.usage();
  assert.equal(after.requests, before.requests, 'R09-CLEAN-01 refusals consume no request slot');
  assert.equal(after.cleanupUsed, 0, 'R09-CLEAN-01 refusals consume no cleanup slot');
  assert.equal(b.stopped, null, 'R09-CLEAN-01 a refused straggler does not STOP the run');
  assert.equal(b.admitDispatch({ method: 'DELETE', path: '/r/own.json', conditional: true }).ok, true, 'own conditional DELETE admitted');
  assert.equal(b.admitDispatch({ method: 'DELETE', path: '/r/own.json', conditional: true }).code, 'CLEANUP_DUPLICATE_DELETE');
  assert.equal(b.admitDispatch({ method: 'PROPFIND', path: '/r' }).ok, true, 'one verification listing of the exact parent');
  assert.equal(b.admitDispatch({ method: 'PROPFIND', path: '/r' }).code, 'CLEANUP_VERIFICATION_ALREADY_USED', 'R09-CLEAN-02 only one verification listing');
  assert.equal(b.usage().cleanupPhase, true, 'irreversible: there is no method to leave the cleanup phase');
});

test('R09-CLEAN-01/02 early cleanup at 75 requests: 10 straggler PUTs from 2 writers refused, then 20 DELETE + 1 verification empty the own namespace', async (t) => {
  const budget = createRequestBudget();
  const s = await stack(t, { tokens: 2, budget });
  const first = await twentyFiles(s, budget, 100);
  assert.equal((await s.clients[0].exportAll()).status, 200); // 4 PROPFIND + 20 GET -> 68
  for (let i = 0; i < 7; i++) assert.equal((await s.clients[0].get('notes', first.id)).status, 200); // -> 75
  assert.equal(budget.usage().requests, 75);
  assert.equal(s.mock.requestLog.length, 75);
  assert.equal(budget.stopped, null, 'below the 79 ordinary STOP');

  budget.beginCleanup();
  const store0 = snapshot(s.mock);
  const puts0 = count(s.mock, 'PUT');
  const stragglers = Array.from({ length: 10 }, (_, i) => note(200 + i));
  const res = await Promise.all(stragglers.map((n, i) => s.clients[i % 2].put('notes', n.id, n.data, '*')));
  assert.deepEqual(res.map((r) => r.status), Array(10).fill(503), 'R09-CLEAN-01 straggler PUTs refused before dispatch');
  assert.ok(res.every((r) => r.data.outcome === 'not_saved'), 'definite not_saved (never Unknown)');
  assert.equal(count(s.mock, 'PUT') - puts0, 0, 'R09-CLEAN-01 0 additional upstream PUT');
  assert.equal(snapshot(s.mock), store0, 'R09-CLEAN-01 storage unchanged by stragglers');
  assert.equal(budget.usage().requests, 75, 'R09-CLEAN-01 stragglers consumed 0 request slots');
  assert.equal(budget.usage().cleanupUsed, 0, 'R09-CLEAN-01 stragglers consumed 0 cleanup slots');

  // Adversarial ordinary/foreign work through the real adapter: all refused, nothing sent.
  const own = budget.ownFiles();
  assert.equal(own.length, 20);
  assert.equal((await s.adapter.get(own[0])).code, 'CLEANUP_PHASE_ORDINARY_REFUSED', 'R09-CLEAN-01 GET refused in cleanup phase');
  assert.equal((await s.adapter.mkcol(`/${NS}/notes2`)).outcome, 'not_sent', 'R09-CLEAN-01 MKCOL refused in cleanup phase');
  assert.equal((await s.adapter.propfind(`/${NS}`, '1')).outcome, 'unavailable', 'root listing is not the verification scope');
  assert.equal((await s.adapter.remove(`/${NS}/projects/foreign.json`, { ifMatch: '"x"' })).code, 'CLEANUP_NOT_OWN_FILE', 'R09-CLEAN-01 foreign DELETE refused');
  assert.equal((await s.adapter.remove(`/${NS}/notes`, { ifMatch: '"x"' })).code, 'CLEANUP_NOT_OWN_FILE', 'R09-CLEAN-01 collection DELETE refused');
  assert.equal(s.mock.requestLog.length, 75, 'R09-CLEAN-01 adversarial calls reached nothing');
  assert.equal(budget.usage().cleanupUsed, 0);

  for (const p of own) {
    const f = s.mock.files.get(`/lms-poc${p}`);
    const r = await s.adapter.remove(p, { ifMatch: f.etag });
    assert.equal(r.outcome, 'committed', `R09-CLEAN-02 conditional DELETE of own file ${p}`);
  }
  const v = await s.adapter.propfind(`/${NS}/notes`, '1');
  assert.equal(v.outcome, 'ok');
  assert.deepEqual(v.entries.map((e) => e.path), [`/${NS}/notes`], 'R09-CLEAN-02 own namespace empty');
  assert.equal((await s.adapter.propfind(`/${NS}/notes`, '1')).code, 'CLEANUP_VERIFICATION_ALREADY_USED', 'R09-CLEAN-02 only one verification listing');
  const vlog = s.mock.requestLog.filter((e) => e.method === 'PROPFIND').at(-1);
  assert.equal(vlog.bodyBytes, 114, 'verification PROPFIND is the unchanged 114-byte resourcetype body');
  assert.equal(ownStored(s.mock).length, 0, 'R09-CLEAN-02 0 own fake files left');
  assert.equal(count(s.mock, 'DELETE'), 20);
  assert.equal(budget.usage().requests, 96);
  assert.equal(s.mock.requestLog.length, 96, 'R09-CLEAN-02 server count = budget count (75 + 20 + 1)');
  assert.equal(budget.usage().cleanupUsed, 21);
  evidence('R09-CLEAN-02', { ordinaryBeforeCleanup: 75, stragglersRefused: 10, extraPut: 0, cleanupDeletes: 20, verification: 1, serverRequests: s.mock.requestLog.length, ownFilesLeft: 0 });
});

test('R09-CLEAN-02 legacy profile kept: 79 ordinary + 21 cleanup = 100, request 101 refused (server-verified)', async (t) => {
  const budget = createRequestBudget();
  const s = await stack(t, { tokens: 2, budget });
  const first = await twentyFiles(s, budget, 300);
  assert.equal((await s.clients[0].exportAll()).status, 200);
  let refusedAt = null;
  for (let i = 0; i < 20 && refusedAt === null; i++) if ((await s.clients[0].get('notes', first.id)).status !== 200) refusedAt = budget.usage().requests + 1;
  assert.equal(refusedAt, 80, 'ordinary STOP at the 80th request');
  assert.equal(s.mock.requestLog.length, 79);
  budget.beginCleanup();
  for (const p of budget.ownFiles()) assert.equal((await s.adapter.remove(p, { ifMatch: s.mock.files.get(`/lms-poc${p}`).etag })).outcome, 'committed');
  assert.equal((await s.adapter.propfind(`/${NS}/notes`, '1')).outcome, 'ok');
  assert.equal(s.mock.requestLog.length, 100);
  assert.equal((await s.adapter.get(`/${NS}/notes`)).code, 'BUDGET_REQUESTS', 'R09-CLEAN-02 request 101 refused');
  assert.equal(s.mock.requestLog.length, 100);
  assert.equal(ownStored(s.mock).length, 0);
});

// =====================================================================================================
// R09-B5-03 — a refused write admission never reaches the store (B5 is NOT equivalent)
// =====================================================================================================
test('R09-B5-03 refused write admissions (early cleanup with budget left; 21st file) never reach the store', async (t) => {
  const budget = createRequestBudget();
  const s = await stack(t, { budget });
  s.mock.collections.add(`/lms-poc/${NS}`);
  assert.equal((await s.adapter.put(`/${NS}/own.json`, Buffer.from('{"a":1}'), { ifNoneMatch: '*' })).outcome, 'committed');
  budget.beginCleanup(); // early: 98 requests of budget left
  const store0 = snapshot(s.mock);
  const w = await s.adapter.put(`/${NS}/late.json`, Buffer.from('{"late":1}'), { ifNoneMatch: '*' });
  assert.equal(count(s.mock, 'PUT'), 1, 'R09-B5-03 refused write never reaches the store');
  assert.equal(snapshot(s.mock), store0, 'R09-B5-03 refused write never reaches the store (stored data unchanged)');
  assert.equal(w.outcome, 'not_sent');
  assert.equal(w.code, 'CLEANUP_PHASE_ORDINARY_REFUSED');
  const over = await s.adapter.put(`/${NS}/own.json`, Buffer.from('{"a":2}'), { ifMatch: s.mock.files.get(`/lms-poc/${NS}/own.json`).etag });
  assert.equal(over.outcome, 'not_sent', 'R09-B5-03 overwrite of an own file refused in cleanup phase');
  assert.equal(count(s.mock, 'PUT'), 1, 'R09-B5-03 refused write never reaches the store');
  assert.equal(budget.usage().cleanupUsed, 0);

  // Ordinary phase: file 21 refused by the file cap; the reserved request slot is returned.
  const b2 = createRequestBudget();
  const s2 = await stack(t, { budget: b2 });
  s2.mock.collections.add(`/lms-poc/${NS}`);
  for (let i = 0; i < 20; i++) assert.equal((await s2.adapter.put(`/${NS}/f${i}.json`, Buffer.from('{}'), { ifNoneMatch: '*' })).outcome, 'committed');
  const st0 = snapshot(s2.mock);
  const r21 = await s2.adapter.put(`/${NS}/f20.json`, Buffer.from('{}'), { ifNoneMatch: '*' });
  assert.equal(count(s2.mock, 'PUT'), 20, 'R09-B5-03 refused write never reaches the store');
  assert.equal(snapshot(s2.mock), st0, 'R09-B5-03 refused write never reaches the store (stored data unchanged)');
  assert.equal(r21.outcome, 'not_sent');
  assert.equal(r21.code, 'BUDGET_FILES');
  assert.equal(b2.usage().requests, s2.mock.requestLog.length, 'R09-B5-03 refused write consumes no request slot');
  evidence('R09-B5-03', { earlyCleanupPutRefused: w.code, upstreamPut: 1, file21: r21.code, budgetRequests: b2.usage().requests, serverRequests: s2.mock.requestLog.length });
});

// =====================================================================================================
// R09-Q4B-04 — ABSOLUTE (not idle) 1000 ms inbound-body deadline under a continuous trickle
// =====================================================================================================
const Q4 = { maxPerPrincipal: 2, maxLedgerEntries: 4, bodyDeadlineMs: 1000 };
function trickle(s, n, { chunked = false, everyMs = 100, stopAfterMs = 3000 } = {}) {
  const bytes = Buffer.from(JSON.stringify(n.data));
  const u = new URL(s.apiUrl);
  const t0 = Date.now();
  let sent = 0;
  let timer;
  const done = new Promise((resolve) => {
    const headers = { Authorization: `Bearer ${s.apiTokens[0]}`, 'Content-Type': 'application/json', 'Operation-Id': crypto.randomUUID(), 'If-None-Match': '*' };
    if (!chunked) headers['Content-Length'] = bytes.length;
    const req = http.request({ host: u.hostname, port: u.port, method: 'PUT', path: `/api/records/notes/${n.id}`, agent: false, headers }, (res) => {
      clearInterval(timer);
      const ch = []; res.on('data', (c) => ch.push(c));
      res.on('end', () => { req.destroy(); resolve({ status: res.statusCode, body: JSON.parse(Buffer.concat(ch).toString() || 'null'), ms: Date.now() - t0, sentBytes: sent }); });
    });
    req.on('error', () => resolve({ status: 'reset', ms: Date.now() - t0, sentBytes: sent }));
    req.flushHeaders();
    // One byte every `everyMs` — far more often than any inactivity timeout — until stopAfterMs.
    timer = setInterval(() => {
      if (Date.now() - t0 > stopAfterMs || sent >= bytes.length - 1 || req.destroyed) return clearInterval(timer);
      req.write(bytes.subarray(sent, sent + 1)); sent++;
    }, everyMs);
  });
  return done;
}

for (const chunked of [false, true]) {
  test(`R09-Q4B-04 ${chunked ? 'chunked' : 'Content-Length'} trickle every 100 ms: 408 at the ABSOLUTE 1000 ms deadline, no PUT, slot released`, async (t) => {
    const s = await stack(t, { api: Q4 });
    const r = await Promise.race([trickle(s, note(400 + (chunked ? 1 : 0)), { chunked }), sleep(8000).then(() => ({ status: 'no-response', ms: 8000 }))]);
    assert.equal(r.status, 408, `R09-Q4B-04 absolute deadline: 408 (got ${r.status} after ${r.ms} ms)`);
    assert.ok(r.ms >= 950 && r.ms <= 1500, `R09-Q4B-04 absolute deadline fires near 1000 ms despite a continuous trickle (${r.ms} ms; window 950-1500)`);
    assert.equal(r.body.reason, 'body_deadline_exceeded');
    assert.ok(r.sentBytes >= 8, `the client kept trickling up to the deadline (${r.sentBytes} bytes)`);
    await sleep(300);
    assert.equal(count(s.mock, 'PUT'), 0, 'R09-Q4B-04 no late PUT / late commit');
    assert.equal(s.api.ledger.size, 0, 'R09-Q4B-04 reservation released before dispatch');
    evidence('R09-Q4B-04', { chunked, status: r.status, ms: r.ms, trickledBytes: r.sentBytes, upstreamPut: 0 });
  });
}

test('R09-Q4B-04 control: once dispatched, an upstream stall stays Unknown (non-terminal); the body deadline does not apply', async (t) => {
  const s = await stack(t, { api: Q4, adapter: { timeoutMs: 1300, deadlineMs: 1500 } });
  s.mock.faults.push({ method: 'PUT', kind: 'hang' });
  const n = note(410);
  const opId = crypto.randomUUID();
  const t0 = Date.now();
  const r = await s.clients[0].put('notes', n.id, n.data, '*', opId);
  const ms = Date.now() - t0;
  assert.equal(r.status, 504, `R09-Q4B-04 control: 504 Unknown after ${ms} ms, never 408`);
  assert.ok(ms > 1000, `the upstream stall crossed the 1000 ms body deadline (${ms} ms)`);
  assert.equal(r.data.outcome, 'unknown');
  const v = await s.clients[0].verify(opId);
  assert.equal(v.data.terminal, false, 'R09-Q4B-04 post-dispatch Unknown stays non-terminal');
  assert.equal(count(s.mock, 'PUT'), 1);
});

// =====================================================================================================
// R09-SAFE-05 — no unsafe undo or policy bypass
// =====================================================================================================
for (const status of [401, 429]) {
  test(`R09-SAFE-05 upstream ${status} during cleanup is a hard STOP: no further DELETE, no verification, residual files reported`, async (t) => {
    const budget = createRequestBudget();
    const s = await stack(t, { budget });
    s.mock.collections.add(`/lms-poc/${NS}`);
    for (let i = 0; i < 3; i++) assert.equal((await s.adapter.put(`/${NS}/f${i}.json`, Buffer.from('{}'), { ifNoneMatch: '*' })).outcome, 'committed');
    budget.beginCleanup();
    s.mock.faults.push({ method: 'DELETE', kind: 'status', status, retryAfter: '60' });
    const own = budget.ownFiles();
    const d0 = await s.adapter.remove(own[0], { ifMatch: s.mock.files.get(`/lms-poc${own[0]}`).etag });
    assert.equal(d0.outcome, 'rejected');
    assert.equal(budget.stopped, `UPSTREAM_${status}`);
    const d1 = await s.adapter.remove(own[1], { ifMatch: s.mock.files.get(`/lms-poc${own[1]}`).etag });
    assert.equal(d1.code, `UPSTREAM_${status}`, `R09-SAFE-05 ${status} blocks cleanup`);
    assert.equal((await s.adapter.propfind(`/${NS}`, '1')).code, `UPSTREAM_${status}`);
    assert.equal(count(s.mock, 'DELETE'), 1, 'no retry');
    assert.equal(ownStored(s.mock).length, 3, 'residual synthetic files remain and are reported, not force-deleted');
    evidence('R09-SAFE-05', { status, deletesSent: 1, residualFiles: ownStored(s.mock).length, stopped: budget.stopped });
  });
}

test('R09-SAFE-05 a write in flight when cleanup begins stays Unknown; nothing is retried, reclassified or deleted blindly', async (t) => {
  const budget = createRequestBudget();
  const s = await stack(t, { budget, adapter: { timeoutMs: 300, deadlineMs: 900 } });
  const n = note(500);
  assert.equal((await s.clients[0].put('notes', n.id, n.data, '*')).status, 200);
  const cur = await s.clients[0].get('notes', n.id);
  s.mock.faults.push({ method: 'PUT', kind: 'hang' });
  const opId = crypto.randomUUID();
  const inflight = s.clients[0].put('notes', n.id, { ...n.data, question: 'in flight' }, cur.data.revision, opId);
  await sleep(100);
  budget.beginCleanup();
  const r = await inflight;
  assert.equal(r.data.outcome, 'unknown', 'R09-SAFE-05 dispatched write stays Unknown after the phase change');
  const e = [...s.api.ledger.values()].find((x) => x.opId === opId);
  assert.equal(e.verdict, 'unknown', 'R09-SAFE-05 not reclassified as not_sent');
  assert.equal(count(s.mock, 'PUT'), 2, 'no retry of the in-flight write');
  const v = await s.clients[0].verify(opId);
  assert.equal(v.data.terminal, false);
});

test('R09-SAFE-05 ACCESS-01 ceilings and the PROPFIND contract are unchanged', () => {
  assert.deepEqual({ ...ACCESS01_LIMITS }, { maxRequests: 100, windowMs: 1_800_000, maxFiles: 20, maxFileBytes: 1_048_576, maxTotalBytes: 20_971_520, maxWriters: 2 });
  assert.equal(createRequestBudget().cleanupReserve, 21);
  assert.equal(PROPFIND_RESOURCETYPE_BODY.length, 114);
  assert.equal(PROPFIND_RESOURCETYPE_BODY.toString(), '<?xml version="1.0" encoding="utf-8"?>\n<d:propfind xmlns:d="DAV:"><d:prop><d:resourcetype/></d:prop></d:propfind>\n');
});
