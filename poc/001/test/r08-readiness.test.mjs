// REMEDIATION-08 (D007-A30 Option A) local security readiness — LOCAL / SYNTHETIC ONLY.
// Cases follow REMEDIATION_08_QA_PLAN.md: R08-TLS-01/02, R08-NET-03, R08-PATH-04, R08-Q4-05, R08-Q5-06,
// R08-CAP-07, R08-BUD-08, R08-SCOPE-10 (R08-REG-09 is the separate suite/mutation/scan run).
// Every socket is 127.0.0.1 (or the 127.0.0.2 trap that must stay untouched). TLS material is generated
// per run in os.tmpdir(), held in memory and deleted (r08-local-tls-fixtures.mjs). No real host, provider,
// credential, PDF or bibliographic record is used; all secrets are random synthetic values.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createMockWebDav } from '../src/mock-webdav.mjs';
import { createWebDavAdapter, PROPFIND_RESOURCETYPE_BODY } from '../src/webdav-adapter.mjs';
import { createSafeApi } from '../src/safe-api.mjs';
import { createClient } from '../src/client.mjs';
import { encodeEnvelope, dataDigest, literatureId } from '../src/note-codec.mjs';
import { parseXml } from '../src/dav-xml.mjs';
import { createRequestBudget, ACCESS01_LIMITS, randomId } from '../src/util.mjs';
import { syntheticSecrets, SRC } from './helpers.mjs';
import { generateTlsFixtures, tlsFixtureAvailability, startTlsFront, startRedirector } from './r08-local-tls-fixtures.mjs';

const NS = 'poc-ns-r08';
const EXPECTED_BODY = PROPFIND_RESOURCETYPE_BODY.toString('utf8');
const FX = generateTlsFixtures(); // throws TLS_FIXTURE_UNAVAILABLE (suite fails, never skips) without openssl
const evidence = (id, obj) => console.log(`R08-EVIDENCE ${id} ${JSON.stringify(obj)}`);

const smallNote = (n) => {
  const id = literatureId(9000001, `S${String(n).padStart(7, '0')}`);
  return { id, data: { literatureId: id, question: `synthetic q ${n}`, arguments: 'a', methods: 'm', contributions: 'c', limitations: 'l' } };
};
const count = (mock, method) => mock.requestLog.filter((e) => e.method === method).length;
const writes = (mock) => mock.requestLog.filter((e) => ['PUT', 'DELETE', 'MKCOL'].includes(e.method)).length;
const snapshot = (mock) => JSON.stringify({
  files: [...mock.files.entries()].map(([p, f]) => [p, f.etag, Buffer.from(f.bytes).toString('base64')]).sort(),
  collections: [...mock.collections].sort(),
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** mock (+ optional TLS front) + adapter + safe API + one client per token. */
async function stack(t, { tlsPair, ca, host = '127.0.0.1', lookup, budget, tokens = 1, api: apiOpts = {}, mock: mockOpts = {}, adapter: adapterOpts = {} } = {}) {
  const sec = syntheticSecrets();
  const apiTokens = [sec.apiToken, ...Array.from({ length: tokens - 1 }, () => `synthetic-token-${randomId(16)}`)];
  const mock = createMockWebDav({ username: sec.davUser, password: sec.davPass, ...mockOpts });
  const dav = await mock.start();
  mock.collections.add('/lms-poc');
  let front = null;
  let baseUrl = `http://${host}:${dav.port}/lms-poc`;
  if (tlsPair) {
    front = await startTlsFront({ ...tlsPair, backendPort: dav.port });
    baseUrl = `https://${host}:${front.port}/lms-poc`;
  }
  const mkAdapter = () => createWebDavAdapter({
    baseUrl, username: sec.davUser, password: sec.davPass, timeoutMs: 800,
    ...(tlsPair ? { localTls: { ca: ca ?? FX.caGood } } : {}), ...(budget ? { budget } : {}), ...(lookup ? { lookup } : {}), ...adapterOpts,
  });
  const adapter = mkAdapter();
  const logs = [];
  const mkApi = (a = adapter) => createSafeApi({ adapter: a, namespace: NS, apiTokens, provenanceKey: sec.provenanceKey, log: (e) => logs.push(e), ...apiOpts });
  const api = mkApi();
  const info = await api.start();
  const apis = [api];
  const s = {
    sec, mock, dav, front, adapter, api, logs, apiUrl: info.url, apiTokens, baseUrl, mkAdapter,
    clients: apiTokens.map((token) => createClient({ apiUrl: info.url, token })),
    principal: (i) => api.principalIdFor(apiTokens[i]),
    async restart() { const a2 = mkApi(mkAdapter()); const i2 = await a2.start(); apis.push(a2); return { api: a2, client: createClient({ apiUrl: i2.url, token: apiTokens[0] }) }; },
  };
  t.after(async () => { for (const a of apis) await a.stop(); if (front) await front.stop(); await mock.stop(); });
  return s;
}

function assertExplicitPropfind(id, e, depth = '1') {
  assert.equal(e.body, EXPECTED_BODY, `${id}: PROPFIND body must equal PROPFIND_RESOURCETYPE_BODY`);
  assert.equal(e.bodyBytes, 114, `${id}: PROPFIND body 114 bytes`);
  assert.equal(e.contentLength, '114', `${id}: Content-Length 114`);
  assert.equal(e.contentType, 'application/xml; charset=utf-8', `${id}: Content-Type`);
  assert.equal(e.depth, depth, `${id}: Depth`);
  assert.doesNotMatch(e.body, /allprop|propname/, `${id}: no allprop`);
}

// =====================================================================================================
// R08-TLS-01 — strict local HTTPS positive path (and unchanged HTTP / default-refusal controls)
// =====================================================================================================
test('R08-TLS-01 strict loopback HTTPS (IP SAN) carries the full API: save, read-back, export, restore', async (t) => {
  const s = await stack(t, { tlsPair: FX.good });
  const c = s.clients[0];
  const n = smallNote(1);
  const w = await c.put('notes', n.id, n.data, '*');
  assert.equal(w.status, 200, 'R08-TLS-01 save over verified TLS');
  assert.equal(w.data.outcome, 'saved');
  const r = await c.get('notes', n.id);
  assert.equal(r.status, 200);
  assert.deepEqual(r.data.record, n.data);
  const ex = await c.exportAll();
  assert.equal(ex.status, 200, 'R08-TLS-01 export over TLS');
  assert.equal(ex.data.count, 1);
  const rs = await c.restore(ex.data, 'restore-r08-tls');
  assert.equal(rs.status, 200);
  assert.equal(rs.data.outcome, 'restored');
  assert.ok(s.front.stats.handshakes >= 1 && s.front.stats.appBytes > 0, 'traffic really went through the TLS front');
  assert.equal(s.front.stats.clientErrors, 0, 'no failed handshake on the valid path');
  const pf = s.mock.requestLog.filter((e) => e.method === 'PROPFIND');
  assert.equal(pf.length, 4, 'export issues exactly 4 PROPFINDs (root + 3 kinds)');
  for (const e of pf) assertExplicitPropfind('R08-TLS-01 PROPFIND over TLS', e);
  assert.equal(JSON.stringify(s.adapter).includes(s.sec.davPass), false, 'adapter serialisation never contains the password');
  assert.ok(!JSON.stringify(s.logs).includes(s.sec.davPass) && !JSON.stringify(s.logs).includes(s.sec.apiToken), 'logs carry no secret');
  evidence('R08-TLS-01', { cert: FX.metadata.good.san, handshakes: s.front.stats.handshakes, appBytes: s.front.stats.appBytes, propfinds: pf.length, openssl: FX.tool.openssl, nodeOpenssl: FX.tool.nodeOpenssl });
});

test('R08-TLS-01 strict loopback HTTPS by name: localhost is verified against the DNS SAN and resolved to loopback', async (t) => {
  const s = await stack(t, { tlsPair: FX.good, host: 'localhost' });
  const n = smallNote(2);
  const w = await s.clients[0].put('notes', n.id, n.data, '*');
  assert.equal(w.status, 200, 'R08-TLS-01 localhost over verified TLS');
  assert.equal(w.data.outcome, 'saved');
});

test('R08-TLS-01 controls: plain-HTTP loopback still works; https without explicit localTls still fails closed', async (t) => {
  const s = await stack(t);
  const n = smallNote(3);
  assert.equal((await s.clients[0].put('notes', n.id, n.data, '*')).status, 200, 'R08-TLS-01 HTTP loopback regression');
  assert.throws(() => createWebDavAdapter({ baseUrl: 'https://127.0.0.1:9/x', username: 'synthetic', password: 'SYNTH-x' }), /HTTPS_TRANSPORT_NOT_IMPLEMENTED/);
  assert.throws(() => createWebDavAdapter({ baseUrl: 'https://dav.example.com/dav/', username: 'synthetic', password: 'SYNTH-x' }), /HTTPS_TRANSPORT_NOT_IMPLEMENTED/);
});

// =====================================================================================================
// R08-TLS-02 — invalid peers fail closed: handshake may happen, the application request never does
// =====================================================================================================
const BAD_PEERS = [
  ['wrong CA', () => FX.wrongCa, FX.caGood, /UNABLE_TO_VERIFY|unable to verify/],
  ['self-signed untrusted', () => FX.selfSigned, FX.caGood, /SELF_SIGNED|self.signed/],
  ['expired', () => FX.expired, FX.caGood, /CERT_HAS_EXPIRED|expired/],
  ['SAN mismatch', () => FX.wrongSan, FX.caGood, /ERR_TLS_CERT_ALTNAME_INVALID|altname/i],
  ['valid cert but client trusts another CA only', () => FX.good, FX.caOther, /UNABLE_TO_VERIFY|unable to verify/],
];
for (const [label, pair, ca, codeRe] of BAD_PEERS) {
  test(`R08-TLS-02 ${label}: no application request, no Authorization; write is not_sent (not Unknown)`, async (t) => {
    const s = await stack(t, { tlsPair: pair(), ca });
    const g = await s.adapter.get('/poc-ns-r08/notes/x.json');
    assert.equal(g.outcome, 'unavailable', `R08-TLS-02 ${label}: read refused`);
    assert.match(String(g.code), codeRe, `R08-TLS-02 ${label}: refusal is the certificate check (${g.code})`);
    const p = await s.adapter.put('/poc-ns-r08/notes/x.json', Buffer.from('{}'), { ifNoneMatch: '*' });
    assert.equal(p.outcome, 'not_sent', `R08-TLS-02 ${label}: no request byte left before verification -> not_sent`);
    const n = smallNote(10);
    const api = await s.clients[0].put('notes', n.id, n.data, '*');
    assert.equal(api.status, 503, `R08-TLS-02 ${label}: API answers definite 503 not_saved, never 504 unknown`);
    assert.equal(api.data.outcome, 'not_saved');
    assert.equal(s.mock.requestLog.length, 0, `R08-TLS-02 ${label}: no application request reached the backend`);
    assert.equal(s.front.stats.appBytes, 0, `R08-TLS-02 ${label}: zero decrypted application bytes (no request line, no Authorization)`);
    assert.ok(s.front.stats.tcp >= 1, 'a TCP/TLS handshake was attempted (QA plan: do not claim zero packets)');
    assert.equal([...s.api.ledger.values()].length, 0, 'nothing left pending or unknown');
    evidence('R08-TLS-02', { label, code: g.code, tcp: s.front.stats.tcp, handshakes: s.front.stats.handshakes, appBytes: s.front.stats.appBytes, backendRequests: s.mock.requestLog.length });
  });
}

test('R08-TLS-02 insecure trust overrides and ambiguous TLS configuration are refused at construction', () => {
  const mk = (localTls, baseUrl = 'https://127.0.0.1:9/x') => () => createWebDavAdapter({ baseUrl, username: 'synthetic', password: 'SYNTH-x', localTls });
  assert.throws(mk({ ca: FX.caGood, rejectUnauthorized: false }), /TLS_CONFIG_REFUSED/, 'R08-TLS-02 rejectUnauthorized override refused');
  assert.throws(mk({ ca: FX.caGood, checkServerIdentity: () => undefined }), /TLS_CONFIG_REFUSED/, 'R08-TLS-02 identity override refused');
  assert.throws(mk({ ca: FX.caGood, secureOptions: 0 }), /TLS_CONFIG_REFUSED/);
  assert.throws(mk({}), /TLS_CONFIG_REFUSED/, 'a test CA is mandatory');
  assert.throws(mk({ ca: 'not a pem' }), /TLS_CONFIG_REFUSED/);
  assert.throws(mk(null), /TLS_CONFIG_REFUSED/);
  assert.throws(mk({ ca: FX.caGood }, 'http://127.0.0.1:9/x'), /TLS_CONFIG_REFUSED/, 'localTls on an http: URL is refused');
  assert.throws(mk({ ca: FX.caGood }, 'https://10.0.0.5:8443/x'), /REAL_SERVICE_BLOCKED/, 'R08-TLS-02 TLS mode never unlocks a non-loopback host');
  assert.throws(mk({ ca: FX.caGood }, 'https://dav.example.com:443/x'), /REAL_SERVICE_BLOCKED/);
});

test('R08-TLS-02 NODE_TLS_REJECT_UNAUTHORIZED=0 cannot weaken verification (separate process)', () => {
  const script = `
    import { createWebDavAdapter } from ${JSON.stringify(SRC('webdav-adapter.mjs'))};
    import { startTlsFront } from ${JSON.stringify(new URL('./r08-local-tls-fixtures.mjs', import.meta.url).href)};
    import net from 'node:net';
    const backend = net.createServer((s) => { process.stdout.write('BACKEND_HIT\\n'); s.destroy(); });
    await new Promise((r) => backend.listen(0, '127.0.0.1', r));
    const front = await startTlsFront({ key: process.env.K, cert: process.env.C, backendPort: backend.address().port });
    const a = createWebDavAdapter({ baseUrl: 'https://127.0.0.1:' + front.port + '/x', username: 'synthetic', password: 'SYNTH-x', localTls: { ca: process.env.CA } });
    const r = await a.get('/y');
    process.stdout.write(JSON.stringify({ r, appBytes: front.stats.appBytes }) + '\\n');
    await front.stop(); backend.close();`;
  const out = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    env: { PATH: process.env.PATH, NODE_TLS_REJECT_UNAUTHORIZED: '0', K: FX.wrongCa.key, C: FX.wrongCa.cert, CA: FX.caGood },
    encoding: 'utf8', timeout: 20_000,
  });
  assert.equal(out.status, 0, out.stderr);
  assert.doesNotMatch(out.stdout, /BACKEND_HIT/, 'R08-TLS-02 env override: nothing forwarded');
  const res = JSON.parse(out.stdout.trim().split('\n').pop());
  assert.equal(res.r.outcome, 'unavailable', 'R08-TLS-02 env override: still refused');
  assert.equal(res.appBytes, 0);
});

test('R08-TLS-02 redirects (downgrade to http:, cross-host https:) are never followed; no second request', async (t) => {
  for (const location of ['http://127.0.0.1:9/lms-poc/x', 'https://dav.example.com/lms-poc/x', 'https://127.0.0.1:9/elsewhere']) {
    const red = await startRedirector({ ...FX.good, location });
    t.after(() => red.stop());
    const a = createWebDavAdapter({ baseUrl: `https://127.0.0.1:${red.port}/lms-poc`, username: 'synthetic', password: 'SYNTH-x', localTls: { ca: FX.caGood }, timeoutMs: 800 });
    const g = await a.get('/poc-ns-r08/notes/x.json');
    assert.equal(g.outcome, 'error', `R08-TLS-02 redirect to ${location} is an error, not a followed fetch`);
    assert.equal(g.status, 307);
    const pf = await a.propfind('/poc-ns-r08', '1');
    assert.equal(pf.outcome, 'error');
    const w = await a.put('/poc-ns-r08/notes/x.json', Buffer.from('{}'), { ifNoneMatch: '*' });
    assert.notEqual(w.outcome, 'committed', 'a redirect is never a commit');
    assert.equal(red.seen.length, 3, `R08-TLS-02 exactly the three original requests, none re-issued (${location})`);
  }
});

// =====================================================================================================
// R08-NET-03 — non-loopback / dangerous targets refused before any egress
// =====================================================================================================
test('R08-NET-03 non-loopback, arbitrary, obfuscated, credentialed or port-less targets are refused at construction', () => {
  const cases = [
    ['http://10.0.0.5:8080/x', /REAL_SERVICE_BLOCKED/], ['http://192.168.1.10:80/x', /REAL_SERVICE_BLOCKED/],
    ['http://[2001:db8::1]:8080/x', /REAL_SERVICE_BLOCKED/], ['http://[fe80::1]:8080/x', /REAL_SERVICE_BLOCKED/],
    ['http://dav.example.com:8080/x', /REAL_SERVICE_BLOCKED/], ['http://0.0.0.0:8080/x', /REAL_SERVICE_BLOCKED/],
    ['http://127.0.0.2:8080/x', /REAL_SERVICE_BLOCKED/], ['http://[::ffff:127.0.0.1]:8080/x', /REAL_SERVICE_BLOCKED/],
    ['http://127.1:8080/x', /UNSAFE_TARGET/], ['http://0x7f.0.0.1:8080/x', /UNSAFE_TARGET/], ['http://2130706433:8080/x', /UNSAFE_TARGET/],
    ['http://localhost/x', /UNSAFE_TARGET/], ['http://127.0.0.1/x', /UNSAFE_TARGET/], ['http://127.0.0.1:0/x', /UNSAFE_TARGET/],
    ['http://127.0.0.1:080/x', /UNSAFE_TARGET/],
    // Userinfo is set through URL setters so no credential-shaped literal sits in this file (heuristic secret scan).
    [Object.assign(new URL('http://127.0.0.1:8080/x'), { username: 'synthetic', password: 'not-a-secret' }).href, /credentials must not be embedded/],
    ['ftp://127.0.0.1:21/x', /unsupported protocol/],
    ['file:///etc/passwd', /unsupported protocol/],
  ];
  for (const [url, re] of cases) {
    assert.throws(() => createWebDavAdapter({ baseUrl: url, username: 'synthetic', password: 'SYNTH-x' }), re, `R08-NET-03 refused: ${url}`);
  }
});

test('R08-NET-03 a name resolving outside the loopback allowlist is refused before connecting (trap untouched)', async (t) => {
  // Trap on 127.0.0.2 (a loopback-range address that is NOT allowed): if the resolver result were trusted the
  // adapter would connect here. No address outside the machine is ever used, even by a broken mutant.
  const trapHits = [];
  const trap = net.createServer((sock) => { trapHits.push(1); sock.destroy(); });
  await new Promise((r) => trap.listen(0, '127.0.0.2', r));
  t.after(() => new Promise((r) => trap.close(r)));
  const port = trap.address().port;
  // Both resolver shapes: synchronous callback and asynchronous (as the real dns.lookup).
  const fakeLookup = (answers, async) => (host, opts, cb) => (async ? setImmediate(() => cb(null, answers)) : cb(null, answers));
  const sets = [[{ address: '127.0.0.2', family: 4 }], [{ address: '0.0.0.0', family: 4 }], [{ address: '127.0.0.1', family: 4 }, { address: '127.0.0.2', family: 4 }], [{ address: '::ffff:127.0.0.1', family: 6 }]];
  for (const [answers, async] of sets.flatMap((x) => [[x, false], [x, true]])) {
    const a = createWebDavAdapter({ baseUrl: `http://localhost:${port}/x`, username: 'synthetic', password: 'SYNTH-x', timeoutMs: 500, lookup: fakeLookup(answers, async) });
    const g = await a.get('/y');
    assert.equal(g.outcome, 'unavailable', `R08-NET-03 resolution ${JSON.stringify(answers)} refused`);
    assert.equal(g.code, 'REAL_SERVICE_BLOCKED', 'R08-NET-03 refusal comes from the resolved-address allowlist');
    const w = await a.put('/y', Buffer.from('{}'), { ifNoneMatch: '*' });
    assert.equal(w.outcome, 'not_sent', 'R08-NET-03 refused before connect -> not_sent');
  }
  await sleep(50);
  assert.equal(trapHits.length, 0, 'R08-NET-03 no connection reached the non-allowed address');
});

test('R08-NET-03 positive control: the system resolver maps localhost to an allowed loopback address', async (t) => {
  const s = await stack(t, { host: 'localhost' });
  const n = smallNote(4);
  assert.equal((await s.clients[0].put('notes', n.id, n.data, '*')).status, 200);
});

// =====================================================================================================
// R08-PATH-04 — canonical paths only; no traversal / encoded / cross-namespace escape
// =====================================================================================================
test('R08-PATH-04 adapter refuses non-canonical request paths before any request', async (t) => {
  const s = await stack(t);
  const bad = ['/poc-ns-r08/../restore-x', '/poc-ns-r08/./notes', '/poc-ns-r08//notes', '/poc-ns-r08/%2e%2e/x', '/poc-ns-r08/%252e%252e/x',
    '/poc-ns-r08/notes%2Fx.json', '/poc-ns-r08\\notes', '/poc-ns-r08/notes/x.json?x=1', '/poc-ns-r08/notes/x.json#f', '/', '', 'poc-ns-r08/notes',
    '/poc-ns-r08/ notes', '/poc-ns-r08/notes/\u0000', '/poc-ns-r08/..%2f', '/../restore-x', '/poc-ns-r08/notes/.hidden'];
  for (const p of bad) {
    for (const call of [() => s.adapter.get(p), () => s.adapter.propfind(p, '1'), () => s.adapter.put(p, Buffer.from('{}'), { ifNoneMatch: '*' }), () => s.adapter.mkcol(p)]) {
      await assert.rejects(call(), /UNSAFE_TARGET/, `R08-PATH-04 refused path ${JSON.stringify(p)}`);
    }
  }
  assert.equal(s.mock.requestLog.length, 0, 'R08-PATH-04 nothing reached the server');
});

test('R08-PATH-04 non-canonical base paths are refused at construction', () => {
  for (const u of ['http://127.0.0.1:9/a/../b', 'http://127.0.0.1:9/a/%2e%2e/b', 'http://127.0.0.1:9/a/%2Fb', 'http://127.0.0.1:9/a?x=1', 'http://127.0.0.1:9/a#f',
    'http://127.0.0.1:9/a//b', 'http://127.0.0.1:9/./a', 'http://127.0.0.1:9/a\\b', 'http://127.0.0.1:9\\a', 'http://127.0.0.1:9/a b']) {
    assert.throws(() => createWebDavAdapter({ baseUrl: u, username: 'synthetic', password: 'SYNTH-x' }), /UNSAFE_TARGET/, `R08-PATH-04 base refused: ${u}`);
  }
});

test('R08-PATH-04 API refuses encoded traversal and cross-namespace targets; valid note paths still work', async (t) => {
  const s = await stack(t);
  const c = s.clients[0];
  const n = smallNote(5);
  assert.equal((await c.put('notes', n.id, n.data, '*')).status, 200, 'valid synthetic note path works');
  const before = snapshot(s.mock);
  const putsBefore = count(s.mock, 'PUT');
  for (const p of ['/api/records/notes/..%2f..%2frestore-x%2fnotes%2fx', '/api/records/notes/%2e%2e', '/api/records/notes/a%5cb', '/api/records/notes/x%252e%252e',
    '/api/records/..%2fnotes/x', '/api/records/notes/x/..%2f..%2fexport']) {
    const r = await c.raw('PUT', p, { body: n.data, headers: { 'Operation-Id': crypto.randomUUID(), 'If-None-Match': '*' } });
    assert.ok([400, 404].includes(r.status), `R08-PATH-04 ${p} refused (${r.status})`);
  }
  for (const target of [NS, 'restore-../poc-ns-r08', '../poc-ns-r08', 'restore-x/../../poc-ns-r08', 'Restore-x', 'restore-']) {
    const r = await c.restore({ format: 'lms.poc001.export/v1', records: [], manifestSha256: crypto.createHash('sha256').update('').digest('hex') }, target);
    assert.equal(r.status, 400, `R08-PATH-04 cross-namespace restore target refused: ${target}`);
  }
  assert.equal(count(s.mock, 'PUT'), putsBefore, 'R08-PATH-04 no write from any refused path');
  assert.equal(snapshot(s.mock), before, 'storage unchanged');
});

// =====================================================================================================
// R08-Q4-05 — admission + absolute inbound-body deadline (fixture: 2 principals, 2 each, 4 global, 1000 ms)
// =====================================================================================================
const Q4 = { maxPerPrincipal: 2, maxLedgerEntries: 4, bodyDeadlineMs: 1000 };

/** Raw PUT whose body is sent in pieces under the caller's control. */
function rawPut(s, tokenIdx, n, { opId = crypto.randomUUID(), declared, extraHeaders = {} } = {}) {
  const bytes = Buffer.from(JSON.stringify(n.data));
  const u = new URL(s.apiUrl);
  const t0 = Date.now();
  let req;
  const done = new Promise((resolve) => {
    req = http.request({ host: u.hostname, port: u.port, method: 'PUT', path: `/api/records/notes/${n.id}`, agent: false,
      headers: { Authorization: `Bearer ${s.apiTokens[tokenIdx]}`, 'Content-Type': 'application/json', 'Content-Length': declared ?? bytes.length, 'Operation-Id': opId, 'If-None-Match': '*', ...extraHeaders } },
    (res) => { const ch = []; res.on('data', (c) => ch.push(c)); res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(Buffer.concat(ch).toString() || 'null'), ms: Date.now() - t0 })); res.on('error', () => resolve({ status: 'reset', ms: Date.now() - t0 })); });
    req.on('error', () => resolve({ status: 'reset', ms: Date.now() - t0 }));
    req.flushHeaders();
  });
  // A write to a socket the server already closed may never call back: bound the wait.
  const send = (b) => (req.destroyed || req.socket?.destroyed ? Promise.resolve(false)
    : Promise.race([new Promise((r) => req.write(b, (err) => r(!err))), sleep(300).then(() => false)]));
  return { bytes, opId, done, send, end: () => { if (!req.destroyed && !req.socket?.destroyed) req.end(); }, destroy: () => req.destroy() };
}
const withTimeout = (p, ms, label) => Promise.race([p, sleep(ms).then(() => { throw new Error(`${label}: no response within ${ms} ms`); })]);

test('R08-Q4-05 deadline: a stalled body is answered 408 by the 1000 ms absolute deadline, before any dispatch', async (t) => {
  const s = await stack(t, { tokens: 2, api: Q4 });
  const n = smallNote(20);
  const up = rawPut(s, 0, n);
  await up.send(up.bytes.subarray(0, 20)); // then stall
  const r = await withTimeout(up.done, 3000, 'R08-Q4-05 deadline');
  assert.equal(r.status, 408, 'R08-Q4-05 deadline: 408 body_deadline_exceeded');
  assert.equal(r.body.reason, 'body_deadline_exceeded');
  assert.ok(r.ms >= 950 && r.ms < 2500, `R08-Q4-05 deadline bounded (${r.ms} ms)`);
  assert.equal(count(s.mock, 'PUT'), 0, 'R08-Q4-05 deadline: no upstream PUT');
  evidence('R08-Q4-05', { case: 'stalled-body', status: r.status, ms: r.ms, upstreamPut: 0 });
});

test('R08-Q4-05 late chunks after the deadline never become a write; the reservation is released', async (t) => {
  const s = await stack(t, { tokens: 2, api: Q4 });
  const p0 = s.principal(0);
  const n = smallNote(21);
  const up = rawPut(s, 0, n);
  await up.send(up.bytes.subarray(0, 20));
  await sleep(200);
  assert.equal([...s.api.ledger.values()].filter((e) => e.principal === p0 && e.verdict === 'pending').length, 1, 'slot held while the body is in flight');
  const r = await withTimeout(up.done, 3000, 'R08-Q4-05 late');
  assert.equal(r.status, 408);
  await up.send(up.bytes.subarray(20)); // the rest arrives late
  up.end();
  await sleep(600);
  assert.equal(count(s.mock, 'PUT'), 0, 'R08-Q4-05 late chunks never written upstream');
  assert.equal(s.mock.files.size, 0, 'nothing stored');
  assert.equal([...s.api.ledger.values()].filter((e) => e.principal === p0).length, 0, 'R08-Q4-05 reservation released after the deadline');
  // Both slots of principal 0 are usable again: two fresh writes succeed.
  for (const k of [22, 23]) { const m = smallNote(k); assert.equal((await s.clients[0].put('notes', m.id, m.data, '*')).status, 200, 'R08-Q4-05 reservation released: slot reusable'); }
});

test('R08-Q4-05 admission: 2 per principal / 4 global while bodies stall; other principal unaffected; all released by the deadline', async (t) => {
  const s = await stack(t, { tokens: 2, api: Q4 });
  const stalled = [];
  for (const [tok, k] of [[0, 30], [0, 31], [1, 32], [1, 33]]) {
    const up = rawPut(s, tok, smallNote(k));
    await up.send(up.bytes.subarray(0, 10));
    stalled.push(up);
  }
  await sleep(150);
  assert.equal(s.api.ledger.size, 4, 'four pending reservations (global cap)');
  const third0 = await s.clients[0].put('notes', smallNote(34).id, smallNote(34).data, '*');
  assert.equal(third0.status, 503, 'R08-Q4-05 principal 0 third concurrent write refused');
  assert.equal(third0.data.reason, 'principal_ledger_full');
  const third1 = await s.clients[1].put('notes', smallNote(35).id, smallNote(35).data, '*');
  assert.equal(third1.status, 503);
  const results = await Promise.all(stalled.map((u) => withTimeout(u.done, 3000, 'R08-Q4-05 admission')));
  assert.deepEqual(results.map((r) => r.status), [408, 408, 408, 408]);
  assert.equal(s.api.ledger.size, 0, 'R08-Q4-05 all reservations released');
  assert.equal(count(s.mock, 'PUT'), 0);
  const ok = await s.clients[1].put('notes', smallNote(36).id, smallNote(36).data, '*');
  assert.equal(ok.status, 200, 'admission restored after release');
});

test('R08-Q4-05 aborted upload releases the reservation; no PUT', async (t) => {
  const s = await stack(t, { tokens: 2, api: Q4 });
  const up = rawPut(s, 0, smallNote(40));
  await up.send(up.bytes.subarray(0, 10));
  await sleep(100);
  assert.equal(s.api.ledger.size, 1);
  up.destroy();
  for (let i = 0; i < 20 && s.api.ledger.size; i++) await sleep(25);
  assert.equal(s.api.ledger.size, 0, 'R08-Q4-05 aborted body released');
  assert.equal(count(s.mock, 'PUT'), 0);
});

test('R08-Q4-05 dispatch uncertain: an upstream stall past the body deadline stays Unknown (no 408, no false verdict)', async (t) => {
  const s = await stack(t, { tokens: 2, api: Q4, adapter: { timeoutMs: 300, deadlineMs: 1500 } });
  s.mock.faults.push({ method: 'PUT', kind: 'hang' });
  const n = smallNote(41);
  const opId = crypto.randomUUID();
  const r = await s.clients[0].put('notes', n.id, n.data, '*', opId);
  assert.equal(r.status, 504, 'R08-Q4-05 dispatched + no answer -> Unknown');
  assert.equal(r.data.outcome, 'unknown');
  const e = [...s.api.ledger.values()].find((x) => x.opId === opId);
  assert.equal(e.verdict, 'unknown', 'kept as Unknown and still holding its slot');
  const again = await s.clients[0].put('notes', n.id, n.data, '*', opId);
  assert.equal(again.status, 409, 'same opId is never re-dispatched');
  assert.equal(count(s.mock, 'PUT'), 1);
});

test('R08-Q4-05 body cap, opId reuse with another payload, reuse while pending, upstream 429 (no retry)', async (t) => {
  const s = await stack(t, { tokens: 2, api: Q4 });
  const n = smallNote(42);
  const big = { ...n.data, arguments: 'x'.repeat(1_000_001) };
  const r413 = await s.clients[0].put('notes', n.id, big, '*');
  assert.equal(r413.status, 413);
  assert.equal(s.api.ledger.size, 0, 'over-cap body released');
  // reuse while pending
  const opId = crypto.randomUUID();
  const up = rawPut(s, 0, n, { opId });
  await up.send(up.bytes.subarray(0, 10));
  await sleep(100);
  const dup = await s.clients[0].put('notes', n.id, n.data, '*', opId);
  assert.equal(dup.status, 409);
  assert.equal(dup.data.outcome, 'operation_in_progress');
  assert.equal((await withTimeout(up.done, 3000, 'pending')).status, 408);
  // completed op reused with a different payload
  const op2 = crypto.randomUUID();
  assert.equal((await s.clients[0].put('notes', n.id, n.data, '*', op2)).status, 200);
  const diff = await s.clients[0].put('notes', n.id, { ...n.data, question: 'other' }, '*', op2);
  assert.equal(diff.status, 422, 'R08-Q4-05 fingerprint mismatch refused');
  // upstream 429 -> definite not_saved, exactly one PUT
  const m = smallNote(43);
  s.mock.faults.push({ method: 'PUT', kind: 'status', status: 429, retryAfter: '30' });
  const putsBefore = count(s.mock, 'PUT');
  const r429 = await s.clients[0].put('notes', m.id, m.data, '*');
  assert.equal(r429.status, 503);
  assert.equal(r429.data.reason, 'rate_limited');
  assert.equal(count(s.mock, 'PUT') - putsBefore, 1, 'R08-Q4-05 429 is not retried');
  assert.throws(() => createSafeApi({ adapter: s.adapter, namespace: 'x-ns', apiTokens: ['t'], provenanceKey: s.sec.provenanceKey, bodyDeadlineMs: 0 }), /bodyDeadlineMs/);
});

// =====================================================================================================
// R08-Q5-06 — UNKNOWN / indeterminate stay non-terminal; no hidden replay, retry or eviction
// =====================================================================================================
async function unknownOp(s, n, client = s.clients[0]) {
  const w = await client.put('notes', n.id, n.data, '*');
  assert.equal(w.status, 200, 'seed saved');
  const opId = crypto.randomUUID();
  s.mock.faults.push({ method: 'PUT', kind: 'status', status: 500 }); // NOT applied; answer lost as 5xx
  const u = await client.put('notes', n.id, { ...n.data, question: 'changed' }, w.data.revision, opId);
  assert.equal(u.data.outcome, 'unknown');
  return { opId, base: w.data.revision };
}
const verdictOf = (s, opId) => [...s.api.ledger.values()].find((e) => e.opId === opId)?.verdict;

test('R08-Q5-06 applied-but-unconfirmed fence (lost ACK) stays non-terminal; no blind fence retry', async (t) => {
  const s = await stack(t);
  const { opId } = await unknownOp(s, smallNote(50));
  const v1 = await s.clients[0].verify(opId);
  assert.equal(v1.data.outcome, 'not_yet_observed');
  assert.equal(v1.data.terminal, false);
  const putsBefore = count(s.mock, 'PUT');
  s.mock.faults.push({ method: 'PUT', kind: 'commit-then-drop' }); // fence APPLIED, acknowledgement lost
  const f = await s.clients[0].fence(opId);
  assert.equal(f.data.outcome, 'fence_not_confirmed', 'R08-Q5-06 applied-but-unconfirmed fence is not confirmed');
  assert.equal(f.data.terminal, false);
  assert.equal(verdictOf(s, opId), 'unknown', 'R08-Q5-06 applied-but-unconfirmed fence: ledger stays Unknown');
  assert.equal(count(s.mock, 'PUT') - putsBefore, 1, 'R08-Q5-06 exactly one fence PUT, no blind retry');
  const v2 = await s.clients[0].verify(opId);
  assert.equal(v2.data.terminal, false, 'still non-terminal after the applied fence');
  assert.equal(v2.data.outcome, 'indeterminate');
  const f2 = await s.clients[0].fence(opId);
  assert.equal(f2.data.terminal, false);
  assert.equal(count(s.mock, 'PUT') - putsBefore, 1, 'R08-Q5-06 a second fence call does not re-PUT over a changed revision');
  evidence('R08-Q5-06', { case: 'applied-unconfirmed-fence', fence: f.data.outcome, verify: v2.data.outcome, fencePuts: 1 });
});

for (const [label, fault, reason] of [
  ['missing ETag on fence', { method: 'PUT', kind: 'strip-etag' }, 'no_etag'],
  ['weak ETag on fence', { method: 'PUT', kind: 'weaken-etag' }, 'untrusted_etag'],
  ['mismatched (bogus) fence ETag', { method: 'PUT', kind: 'bogus-etag' }, 'readback_etag_mismatch'],
  ['GET read-back failure', { method: 'GET', kind: 'status', status: 500, skip: 1 }, 'readback_error'],
]) {
  test(`R08-Q5-06 ${label}: fence_not_confirmed, Unknown retained, no retry`, async (t) => {
    const s = await stack(t);
    const { opId } = await unknownOp(s, smallNote(51));
    const putsBefore = count(s.mock, 'PUT');
    s.mock.faults.push(fault);
    const f = await s.clients[0].fence(opId);
    assert.equal(f.data.outcome, 'fence_not_confirmed', `R08-Q5-06 ${label}`);
    assert.equal(f.data.reason, reason);
    assert.equal(f.data.terminal, false);
    assert.equal(verdictOf(s, opId), 'unknown', `R08-Q5-06 ${label}: Unknown retained`);
    assert.equal(count(s.mock, 'PUT') - putsBefore, 1, `R08-Q5-06 ${label}: one fence PUT`);
  });
}

test('R08-Q5-06 restart: a fresh instance never terminalises, never fences, never replays', async (t) => {
  const s = await stack(t);
  const { opId, base } = await unknownOp(s, smallNote(52));
  const n = smallNote(52);
  const putsBefore = count(s.mock, 'PUT');
  const r2 = await s.restart();
  const v = await r2.client.verify(opId, { kind: 'notes', id: n.id, base });
  assert.equal(v.data.terminal, false, 'R08-Q5-06 restart verify non-terminal');
  const f = await r2.client.fence(opId);
  assert.equal(f.status, 404, 'R08-Q5-06 restart: fence needs the in-process ledger');
  // Applied-but-unacknowledged write observed after a restart: reported, but still not made terminal there.
  const op2 = crypto.randomUUID();
  s.mock.faults.push({ method: 'PUT', kind: 'commit-then-drop' });
  const cur = await s.clients[0].get('notes', n.id);
  const u2 = await s.clients[0].put('notes', n.id, { ...n.data, question: 'applied' }, cur.data.revision, op2);
  assert.equal(u2.data.outcome, 'unknown');
  const r3 = await s.restart();
  const v2 = await r3.client.verify(op2, { kind: 'notes', id: n.id, base: cur.data.revision });
  assert.equal(v2.data.outcome, 'committed');
  assert.equal(v2.data.terminal, false, 'R08-Q5-06 restart observation is never a terminal verdict');
  assert.equal(count(s.mock, 'PUT') - putsBefore, 1, 'only the one new write; no replay of the Unknown one');
});

test('R08-Q5-06 Unknown entries hold their quota slot (no TTL/pressure eviction); manual STOP is the outcome', async (t) => {
  const s = await stack(t, { api: { maxPerPrincipal: 2, maxLedgerEntries: 4 } });
  const a = await unknownOp(s, smallNote(53)); // seed + unknown: the saved seed is terminal and evictable
  const b = await unknownOp(s, smallNote(54));
  assert.equal(verdictOf(s, a.opId), 'unknown', 'R08-Q5-06 quota hold: first Unknown still held after more work');
  assert.equal(verdictOf(s, b.opId), 'unknown', 'R08-Q5-06 quota hold: second Unknown held');
  const m = smallNote(55);
  const r = await s.clients[0].put('notes', m.id, m.data, '*');
  assert.equal(r.status, 503, 'R08-Q5-06 quota hold: new work refused while two Unknowns are open');
  assert.equal(r.data.reason, 'principal_ledger_full');
  assert.equal(verdictOf(s, a.opId), 'unknown', 'R08-Q5-06 Unknown not evicted under pressure');
  assert.equal(verdictOf(s, b.opId), 'unknown');
});

test('R08-Q5-06 sibling write after an Unknown: CAS decides, the Unknown becomes indeterminate (never terminal)', async (t) => {
  const s = await stack(t);
  const n = smallNote(56);
  const { opId, base } = await unknownOp(s, n);
  const sib = await s.clients[0].put('notes', n.id, { ...n.data, question: 'sibling' }, base);
  assert.equal(sib.status, 200, 'sibling with the same base succeeds (the Unknown one was not applied)');
  const putsBefore = count(s.mock, 'PUT');
  const v = await s.clients[0].verify(opId);
  assert.equal(v.data.outcome, 'indeterminate');
  assert.equal(v.data.terminal, false, 'R08-Q5-06 sibling: Unknown not falsely terminal');
  const f = await s.clients[0].fence(opId);
  assert.equal(f.data.terminal, false);
  assert.equal(count(s.mock, 'PUT'), putsBefore, 'R08-Q5-06 sibling: no fence PUT over a changed revision');
  assert.equal(verdictOf(s, opId), 'unknown');
});

// =====================================================================================================
// R08-CAP-07 — end-to-end export capacity at the documented 8 + 6*N boundary
// =====================================================================================================
async function seedKind(s, kind, n) {
  const root = `/lms-poc/${NS}`;
  for (const p of [root, `${root}/notes`, `${root}/projects`, `${root}/progress`]) s.mock.collections.add(p);
  const hmac = (m) => crypto.createHmac('sha256', s.sec.provenanceKey).update(m).digest('hex');
  for (let i = 0; i < n; i++) {
    const id = `cap-${String(i).padStart(5, '0')}`;
    const data = { literatureId: id, status: 'read' };
    const op = crypto.randomBytes(16).toString('hex');
    const provenance = hmac(`prov\u0000${kind}\u0000${id}\u0000${op}\u0000${dataDigest(data)}`);
    s.mock.files.set(`${root}/${kind}/${id}.json`, { bytes: encodeEnvelope({ kind, id, operationId: op, data, provenance }), etag: `"seed-${i}"`, prev: null });
  }
}
function rawPropfind(s, path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: s.dav.port, method: 'PROPFIND', path, agent: false,
      headers: { Authorization: 'Basic ' + Buffer.from(`${s.sec.davUser}:${s.sec.davPass}`).toString('base64'), Depth: '1', 'Content-Type': 'application/xml; charset=utf-8', 'Content-Length': PROPFIND_RESOURCETYPE_BODY.length } },
    (res) => { const ch = []; res.on('data', (c) => ch.push(c)); res.on('end', () => resolve(Buffer.concat(ch))); });
    req.on('error', reject);
    req.end(PROPFIND_RESOURCETYPE_BODY);
  });
}

for (const [N, elements, ok] of [[1665, 9998, true], [1666, 10004, false]]) {
  test(`R08-CAP-07 N=${N}: listing has ${elements} XML elements -> ${ok ? '200 complete bundle' : '503 export_incomplete, no partial bundle, no GET, no write'}`, async (t) => {
    const s = await stack(t);
    await seedKind(s, 'progress', N);
    const xml = await rawPropfind(s, `/lms-poc/${NS}/progress`);
    const stats = {};
    try { parseXml(xml, stats); } catch { /* over the cap: stats still counted up to the refusal */ }
    // Count independently of the parser: every opening element tag.
    const opening = (xml.toString('utf8').match(/<(?![?/!])[^>]*>/g) ?? []).length;
    assert.equal(opening, elements, `R08-CAP-07 fixture is exactly 8 + 6*N = ${elements} elements`);
    s.mock.requestLog.length = 0;
    const before = snapshot(s.mock);
    const rss0 = process.memoryUsage().rss;
    const t0 = process.hrtime.bigint();
    const ex = await s.clients[0].exportAll();
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    const rss1 = process.memoryUsage().rss;
    const responseBytes = Buffer.byteLength(JSON.stringify(ex.data));
    const gets = count(s.mock, 'GET');
    const pfs = s.mock.requestLog.filter((e) => e.method === 'PROPFIND');
    if (ok) {
      assert.equal(ex.status, 200, `R08-CAP-07 N=${N} complete`);
      assert.equal(ex.data.count, N);
      assert.equal(ex.data.records.length, N);
      assert.equal(gets, N, 'one GET per record');
    } else {
      assert.equal(ex.status, 503, `R08-CAP-07 N=${N} over the element cap fails closed`);
      assert.equal(ex.data.outcome, 'export_incomplete');
      assert.equal(ex.data.at, `/${NS}/progress`);
      assert.match(String(ex.data.detail), /resource limit/);
      assert.equal(ex.data.records, undefined, 'R08-CAP-07 no partial bundle');
      assert.equal(gets, 0, 'R08-CAP-07 no record GET when the listing fails');
    }
    assert.equal(pfs.length, 4, 'root + three kind listings');
    for (const e of pfs) assertExplicitPropfind(`R08-CAP-07 N=${N}`, e);
    assert.equal(writes(s.mock), 0, 'R08-CAP-07 export never writes');
    assert.equal(snapshot(s.mock), before, 'data unchanged');
    evidence('R08-CAP-07', { N, listingElements: opening, listingBytes: xml.length, status: ex.status, count: ex.data.count ?? null, propfind: pfs.length, get: gets, writes: 0, exportMs: Math.round(ms), responseBytes, rssDeltaMB: +((rss1 - rss0) / 1048576).toFixed(1), maxRssMB: +(process.resourceUsage().maxRSS / 1024).toFixed(1) });
  });
}

// =====================================================================================================
// R08-BUD-08 — test-only ACCESS-01 budget arithmetic (synthetic dry run, no provider)
// =====================================================================================================
test('R08-BUD-08 arithmetic: 100/rolling 30 min incl. cleanup reserve, files, bytes, writers, 401/429 stop', () => {
  assert.deepEqual({ ...ACCESS01_LIMITS }, { maxRequests: 100, windowMs: 1_800_000, maxFiles: 20, maxFileBytes: 1_048_576, maxTotalBytes: 20_971_520, maxWriters: 2 }, 'ACCESS-01 values unchanged');
  let now = 0;
  const b = createRequestBudget({ now: () => now });
  assert.equal(b.cleanupReserve, 21, '20 per-file deletes + 1 verification listing reserved');
  for (let i = 0; i < 79; i++) assert.equal(b.admitRequest('request').ok, true);
  const r80 = b.admitRequest('request');
  assert.equal(r80.ok, false, 'R08-BUD-08 ordinary work stops while only the cleanup reserve is left');
  assert.equal(r80.code, 'BUDGET_CLEANUP_RESERVE');
  assert.equal(b.admitRequest('request').ok, false, 'stopped: no further ordinary work');
  for (let i = 0; i < 21; i++) assert.equal(b.admitRequest('cleanup').ok, true, 'reserved cleanup slots usable after the STOP');
  const r101 = b.admitRequest('cleanup');
  assert.equal(r101.ok, false, 'R08-BUD-08 hard cap: request 101 in the window is refused');
  assert.equal(b.usage().requests, 100);
  // rolling window
  let t2 = 0;
  const w = createRequestBudget({ cleanupReserve: 0, now: () => t2 });
  for (let i = 0; i < 100; i++) assert.equal(w.admitRequest().ok, true);
  t2 = 1_800_000 - 1;
  const fresh = createRequestBudget({ cleanupReserve: 0, now: () => t2 });
  assert.equal(fresh.admitRequest().ok, true);
  assert.equal(w.usage().requests, 100, 'R08-BUD-08 rolling window: still 100 inside 30 min');
  t2 = 1_800_000;
  assert.equal(w.usage().requests, 0, 'R08-BUD-08 rolling window: requests leave the window after 30 min');
  // files / bytes / writers
  const f = createRequestBudget();
  for (let i = 0; i < 20; i++) assert.equal(f.admitWrite(`/r/f${i}.json`, 1_048_576).ok, true, '20 x 1 MiB = 20 MiB allowed');
  assert.equal(f.admitWrite('/r/f20.json', 1).code, 'BUDGET_FILES', 'R08-BUD-08 file 21 refused');
  assert.equal(createRequestBudget().admitWrite('/r/x', 1_048_577).code, 'BUDGET_FILE_BYTES', 'R08-BUD-08 1 MiB + 1 refused');
  const tb = createRequestBudget();
  for (let i = 0; i < 20; i++) tb.admitWrite('/r/same.json', 1_048_576);
  assert.equal(tb.admitWrite('/r/same.json', 1).code, 'BUDGET_TOTAL_BYTES', 'R08-BUD-08 20 MiB total enforced across rewrites');
  const wr = createRequestBudget();
  assert.equal(wr.acquireWriter('A').ok && wr.acquireWriter('B').ok && wr.acquireWriter('A').ok, true);
  assert.equal(wr.acquireWriter('C').code, 'BUDGET_WRITERS', 'R08-BUD-08 third writer refused');
  for (const st of [401, 429]) {
    const h = createRequestBudget();
    h.admitRequest();
    h.observeStatus(st);
    assert.equal(h.admitRequest().code, `UPSTREAM_${st}`, `R08-BUD-08 ${st} stops the run`);
    assert.equal(h.admitRequest('cleanup').ok, false, `R08-BUD-08 ${st}: no cleanup burst either`);
  }
});

test('R08-BUD-08 end-to-end dry run against the local mock: 2 writers, 20 files, stop before the reserve, cleanup in reserve, exactly 100 requests', async (t) => {
  const budget = createRequestBudget();
  const s = await stack(t, { tokens: 2, budget });
  assert.equal(budget.acquireWriter('A').ok && budget.acquireWriter('B').ok, true);
  const first = smallNote(60);
  assert.equal((await s.clients[0].put('notes', first.id, first.data, '*')).status, 200); // 4 MKCOL + PUT + GET
  for (let i = 1; i < 19; i += 2) { // 9 concurrent pairs from the two writers
    const [x, y] = [smallNote(60 + i), smallNote(61 + i)];
    const [rx, ry] = await Promise.all([s.clients[0].put('notes', x.id, x.data, '*'), s.clients[1].put('notes', y.id, y.data, '*')]);
    assert.equal(rx.status, 200); assert.equal(ry.status, 200);
  }
  const last = smallNote(79);
  assert.equal((await s.clients[1].put('notes', last.id, last.data, '*')).status, 200, 'file 20');
  assert.equal(budget.usage().requests, 44);
  assert.equal(budget.usage().files, 20);
  const ex = await s.clients[0].exportAll(); // 4 PROPFIND + 20 GET
  assert.equal(ex.status, 200);
  assert.equal(budget.usage().requests, 68);
  let refused = null;
  for (let i = 0; i < 20 && !refused; i++) {
    const r = await s.clients[0].get('notes', first.id);
    if (r.status !== 200) refused = { i, status: r.status };
  }
  assert.deepEqual(refused, { i: 11, status: 503 }, 'R08-BUD-08 the 80th request (12th extra read) is refused before dispatch');
  assert.equal(budget.stopped, 'BUDGET_CLEANUP_RESERVE');
  assert.equal(s.mock.requestLog.length, 79, 'the refused request never reached the server');
  const extra = smallNote(90);
  assert.equal((await s.clients[0].put('notes', extra.id, extra.data, '*')).status, 503, 'R08-BUD-08 no new file after the STOP');
  assert.equal(count(s.mock, 'PUT'), 20);
  budget.beginCleanup();
  for (const [p, f] of [...s.mock.files.entries()]) {
    const r = await s.adapter.remove(p.replace('/lms-poc', ''), { ifMatch: f.etag });
    assert.equal(r.outcome, 'committed', 'R08-BUD-08 cleanup DELETE within the reserve');
  }
  const verify = await s.adapter.propfind(`/${NS}/notes`, '1');
  assert.equal(verify.outcome, 'ok');
  assert.deepEqual(verify.entries.map((e) => e.path), [`/${NS}/notes`], 'run namespace empty after cleanup');
  assert.equal(budget.usage().requests, 100);
  assert.equal(s.mock.requestLog.length, 100, 'R08-BUD-08 exactly 100 requests reached the server, cleanup included');
  assert.equal((await s.adapter.get(`/${NS}/notes`)).code, 'BUDGET_REQUESTS', 'R08-BUD-08 request 101 refused');
  assert.equal(s.mock.requestLog.length, 100);
  evidence('R08-BUD-08', { writers: 2, files: 20, requestsTotal: 100, ordinaryStoppedAt: 80, cleanup: 21, upstream: s.mock.requestLog.length });
});

test('R08-BUD-08 end-to-end: file cap, 1 MiB cap and upstream 429 STOP are enforced before dispatch', async (t) => {
  const budget = createRequestBudget();
  const s = await stack(t, { budget });
  s.mock.collections.add(`/lms-poc/${NS}`);
  for (let i = 0; i < 20; i++) assert.equal((await s.adapter.put(`/${NS}/f${i}.json`, Buffer.from('{}'), { ifNoneMatch: '*' })).outcome, 'committed');
  const r21 = await s.adapter.put(`/${NS}/f20.json`, Buffer.from('{}'), { ifNoneMatch: '*' });
  assert.equal(r21.outcome, 'not_sent', 'R08-BUD-08 file 21 not sent');
  assert.equal(r21.code, 'BUDGET_FILES');
  assert.equal(count(s.mock, 'PUT'), 20);
  const b2 = createRequestBudget();
  const s2 = await stack(t, { budget: b2 });
  s2.mock.collections.add(`/lms-poc/${NS}`);
  const big = await s2.adapter.put(`/${NS}/big.json`, Buffer.alloc(1_048_577, 0x20), { ifNoneMatch: '*' });
  assert.equal(big.code, 'BUDGET_FILE_BYTES');
  assert.equal(s2.mock.requestLog.length, 0, 'R08-BUD-08 oversize file never sent');
  const b3 = createRequestBudget();
  const s3 = await stack(t, { budget: b3 });
  s3.mock.faults.push({ method: 'GET', kind: 'status', status: 429, retryAfter: '60' });
  assert.equal((await s3.adapter.get(`/${NS}/x.json`)).status, 429);
  const after = await s3.adapter.get(`/${NS}/x.json`);
  assert.equal(after.code, 'UPSTREAM_429', 'R08-BUD-08 after 429 nothing more is sent');
  assert.equal(s3.mock.requestLog.length, 1);
});

// =====================================================================================================
// R08-SCOPE-10 — explicit PROPFIND unchanged over TLS; no fallback; nothing leaves loopback
// =====================================================================================================
test('R08-SCOPE-10 malformed HTTP 207 over TLS: exactly one explicit PROPFIND for the failing path, 503, no GET/write', async (t) => {
  const s = await stack(t, { tlsPair: FX.good, mock: { propfindOverride: (p) => (p.endsWith('/notes') ? '<d:multistatus xmlns:d="DAV:"><d:response>' : null) } });
  const n = smallNote(70);
  assert.equal((await s.clients[0].put('notes', n.id, n.data, '*')).status, 200);
  s.mock.requestLog.length = 0;
  const before = snapshot(s.mock);
  const ex = await s.clients[0].exportAll();
  assert.equal(ex.status, 503);
  assert.equal(ex.data.outcome, 'export_incomplete');
  const pfs = s.mock.requestLog.filter((e) => e.method === 'PROPFIND');
  assert.deepEqual(pfs.map((e) => e.path), [`/lms-poc/${NS}`, `/lms-poc/${NS}/notes`], 'R08-SCOPE-10 exactly one PROPFIND for the failing listing');
  for (const e of pfs) assertExplicitPropfind('R08-SCOPE-10', e);
  assert.equal(count(s.mock, 'GET'), 0);
  assert.equal(writes(s.mock), 0);
  assert.equal(snapshot(s.mock), before);
});

test('R08-SCOPE-10 PROPFIND contract and loopback-only endpoints are unchanged by R08', async (t) => {
  assert.equal(PROPFIND_RESOURCETYPE_BODY.length, 114);
  assert.equal(EXPECTED_BODY, '<?xml version="1.0" encoding="utf-8"?>\n<d:propfind xmlns:d="DAV:"><d:prop><d:resourcetype/></d:prop></d:propfind>\n');
  const s = await stack(t, { tlsPair: FX.good });
  assert.match(s.baseUrl, /^https:\/\/127\.0\.0\.1:\d+\/lms-poc$/);
  assert.match(s.apiUrl, /^http:\/\/127\.0\.0\.1:\d+$/);
  for (const v of Object.values(FX.metadata)) assert.doesNotMatch(JSON.stringify(v), /PRIVATE KEY/, 'metadata never carries key material');
  assert.throws(() => createSafeApi({ adapter: s.adapter, namespace: 'n', apiTokens: ['t'], provenanceKey: s.sec.provenanceKey, host: '0.0.0.0' }), /REAL_SERVICE_BLOCKED/);
  assert.equal(tlsFixtureAvailability().ok, true);
});
