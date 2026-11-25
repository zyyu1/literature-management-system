// Q08 (PATH-01, REDIRECT-01): malicious path/__proto__, unsafe URL/redirect/destination, non-loopback bind/fetch
// fail closed with ZERO outbound connections; sanitized logs; WP-01 body/response/request limits.
// Also an in-process, zero-traffic egress-isolation precondition (A60: Linux `lo`-only or a proven Windows offline state).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import http from 'node:http';
import { createSyntheticAuthServer } from '../src/server.mjs';
import { LIMITS } from '../src/policy.mjs';
import {
  loadFixture, fixtureCase, startServer, createFakeClient, browserHeaders, newOperationId, requestTally,
} from '../support/harness.mjs';
import { assertPlatformEgressPrecondition } from '../support/platform-precondition.mjs';

function spyConnections() {
  const calls = [];
  const orig = net.Socket.prototype.connect;
  net.Socket.prototype.connect = function patched(...args) {
    let o = args[0];
    if (Array.isArray(o)) o = o[0]; // Node passes normalized [options, cb]
    calls.push(o && typeof o === 'object' ? String(o.host ?? o.path) : String(args[1] ?? o));
    return orig.apply(this, args);
  };
  return { calls, restore() { net.Socket.prototype.connect = orig; } };
}

function rawRequest(port, text) {
  return new Promise((resolve, reject) => {
    const s = net.connect({ host: '127.0.0.1', port });
    let buf = '';
    s.on('data', (d) => { buf += d.toString('latin1'); });
    s.on('end', () => resolve(buf));
    s.on('close', () => resolve(buf));
    s.on('error', reject);
    s.write(text);
  });
}

// A60: shared fail-closed platform precondition (Linux: only `lo`; Windows: proven offline state).
test('egress precondition (zero traffic): no usable non-loopback path and no proxy variables are set', () => {
  const evidence = assertPlatformEgressPrecondition();
  assert.equal(evidence.ok, true);
  assert.ok(['linux', 'win32'].includes(evidence.platform));
  assert.equal(evidence.node, 'v22.23.5');
  assert.equal(evidence.arch, 'x64');
});

test('Q08 non-loopback / wildcard / non-ephemeral bind is refused before any socket exists', () => {
  const { fixture } = loadFixture();
  const spy = spyConnections();
  try {
    for (const host of ['0.0.0.0', '::', '::1', 'localhost', '192.0.2.10', '', '127.0.0.2']) {
      assert.throws(() => createSyntheticAuthServer({ fixture, host }), /UNSAFE_CONFIG/, host);
    }
    for (const port of [80, 8080, 1, -1]) assert.throws(() => createSyntheticAuthServer({ fixture, port }), /UNSAFE_CONFIG/);
  } finally { spy.restore(); }
  assert.deepEqual(spy.calls, []);
});

test('Q08 server binds 127.0.0.1 on an ephemeral port only, and import alone listens on nothing', async (t) => {
  const { srv, addr } = await startServer(t);
  assert.equal(addr.host, '127.0.0.1');
  assert.ok(addr.port > 0);
  assert.equal(srv.address().address, '127.0.0.1');
  const { fixture } = loadFixture();
  const inert = createSyntheticAuthServer({ fixture });
  assert.equal(inert.address(), null, 'inert until listen()');
});

test('Q08 fake client refuses every non-loopback destination with zero bytes / zero connects', () => {
  const spy = spyConnections();
  try {
    for (const u of [
      'http://1.1.1.1:443', 'https://api.wp01.invalid', 'https://webdav.example.invalid/redirect',
      'http://localhost:80', 'http://127.0.0.1.nip.io:80', 'http://user:pw@127.0.0.1:80', 'http://127.0.0.1',
      'https://127.0.0.1:443', 'http://[::ffff:1.1.1.1]:80', 'file:///etc/passwd', 'not a url',
    ]) {
      assert.throws(() => createFakeClient({ baseUrl: u }), /NON_LOOPBACK_DENIED/, u);
    }
  } finally { spy.restore(); }
  assert.deepEqual(spy.calls, []);
});

test('Q08 REDIRECT-01 server never redirects to an external destination (DENY_OUTBOUND, no Location)', async (t) => {
  const { fixture, client } = await startServer(t);
  const c = fixtureCase(fixture, 'REDIRECT-01');
  assert.equal(c.expect, 'DENY_OUTBOUND');
  const spy = spyConnections();
  try {
    for (const to of [c.destination, '//evil.wp01.invalid/x', 'javascript:alert(1)', 'https://user:pw@app.wp01.invalid/x', 'https://evil.wp01.invalid/', 'http://127.0.0.1:1/']) {
      const r = await client.request('GET', `/api/v1/redirect?to=${encodeURIComponent(to)}`);
      assert.equal(r.status, 400, to);
      assert.equal(r.body.error.code, 'DENY_OUTBOUND');
      assert.equal(r.headers.location, undefined);
    }
  } finally { spy.restore(); }
  assert.ok(spy.calls.every((h) => h === '127.0.0.1'), JSON.stringify(spy.calls));
});

test('Q08 REDIRECT-01 client never follows a 3xx to a non-loopback destination (zero outbound connects)', async (t) => {
  const { fixture } = loadFixture();
  const dest = fixtureCase(fixture, 'REDIRECT-01').destination;
  const upstream = http.createServer((req, res) => { res.writeHead(302, { Location: dest }); res.end(); });
  await new Promise((r) => upstream.listen(0, '127.0.0.1', r));
  t.after(() => new Promise((r) => upstream.close(r)));
  const client = createFakeClient({ baseUrl: `http://127.0.0.1:${upstream.address().port}` });
  const spy = spyConnections();
  let r;
  try { r = await client.request('GET', '/anything'); } finally { spy.restore(); }
  assert.equal(r.status, 302);
  assert.equal(r.redirectDenied, true);
  assert.equal(r.deniedDestination, dest);
  assert.deepEqual(spy.calls, ['127.0.0.1'], 'exactly one loopback connect, none to the redirect target');
  assert.equal(client.counters.deniedRedirects, 1);
});

test('Q08 allowed same-frontend redirect is a header string only; the client still never follows it', async (t) => {
  const { client } = await startServer(t);
  const r = await client.request('GET', `/api/v1/redirect?to=${encodeURIComponent('https://app.wp01.invalid/done')}`);
  assert.equal(r.status, 303);
  assert.equal(r.headers.location, 'https://app.wp01.invalid/done');
  assert.equal(r.redirectDenied, true);
});

test('Q08 PATH-01 __proto__ resource is rejected with no dispatch (GET and unsafe)', async (t) => {
  const { fixture, srv, client } = await startServer(t);
  const c = fixtureCase(fixture, 'PATH-01');
  assert.equal(c.expect, 'DENY_NO_DISPATCH');
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  const g = await client.request('GET', `/api/v1/projects/${c.resource}`, { headers: browserHeaders({ cookie: a.cookieValue }) });
  assert.equal(g.status, 400);
  assert.equal(g.body.error.code, 'INVALID_RESOURCE_ID');
  const p = await client.request('POST', `/api/v1/projects/${c.resource}/mutations`, {
    headers: browserHeaders({ cookie: a.cookieValue, csrf: a.csrfToken, extra: { 'If-Match': '"x"' } }),
    body: { operationId: newOperationId(), action: 'SET_ARCHIVED', value: true },
  });
  assert.equal(p.status, 400);
  assert.equal(srv.backend.dispatches, 0);
  assert.equal(Object.prototype.polluted, undefined);
});

test('Q08 malicious paths and encodings fail closed (traversal, encoded slash, NUL, prototype names, overlong)', async (t) => {
  const { srv, client } = await startServer(t);
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  const bad = [
    '/api/v1/projects/constructor', '/api/v1/projects/prototype', '/api/v1/projects/%5F%5Fproto%5F%5F',
    '/api/v1/projects/..%2Fsecrets', '/api/v1/projects/%2e%2e', '/api/v1/projects/a%00b', '/api/v1/projects/a%5Cb',
    '/api/v1/projects/project_synth_alpha/constructor', '/api/v1/projects/project_synth_alpha/__proto__',
    '/api/v1/projects/project_synth_alpha/toString', '/api/v1/../v1/health', '/api/v1/projects/%E0%A4%A',
    '/api/v1/projects/PROJECT_SYNTH_ALPHA', `/api/v1/projects/${'a'.repeat(65)}`, `/api/v1/${'x/'.repeat(1100)}`,
    '/api/v1/operations/not-an-op', '/api/v2/health',
  ];
  for (const p of bad) {
    const r = await client.request('GET', p, { headers: browserHeaders({ cookie: a.cookieValue }) });
    assert.ok([400, 404].includes(r.status), `${p.slice(0, 60)} -> ${r.status}`);
    assert.equal(r.body.project, undefined);
  }
  assert.equal(srv.backend.dispatches, 0);
});

test('Q08 absolute-form and protocol-relative request targets are rejected (no proxying)', async (t) => {
  const { addr } = await startServer(t);
  for (const target of ['http://api.zotero.invalid/api/v1/health', '//evil.wp01.invalid/api/v1/health', '*']) {
    const resp = await rawRequest(addr.port, `GET ${target} HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n`);
    assert.match(resp, /^HTTP\/1\.1 400 /, target);
  }
});

test('Q08 prototype-pollution keys in JSON bodies are rejected before dispatch', async (t) => {
  const { srv, client } = await startServer(t);
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  for (const raw of [
    '{"__proto__":{"polluted":1},"operationId":"op_abcdefghij","action":"SET_ARCHIVED","value":true}',
    '{"operationId":"op_abcdefghij","action":"SET_ARCHIVED","value":true,"x":{"constructor":{"prototype":{}}}}',
  ]) {
    const r = await client.request('POST', '/api/v1/projects/project_synth_alpha/mutations', {
      headers: browserHeaders({ cookie: a.cookieValue, csrf: a.csrfToken, extra: { 'If-Match': '"rev-fake-alpha-01"' } }),
      rawBody: Buffer.from(raw),
    });
    assert.equal(r.status, 400);
    assert.equal(r.body.error.code, 'FORBIDDEN_KEY');
  }
  assert.equal(srv.backend.dispatches, 0);
  assert.equal({}.polluted, undefined);
});

test('Q08 WP-01 limits are exactly 64 KiB request, 256 KiB response, 5000 requests', () => {
  assert.equal(LIMITS.maxRequestBodyBytes, 65536);
  assert.equal(LIMITS.maxResponseBodyBytes, 262144);
  assert.equal(LIMITS.maxRequestsPerRun, 5000);
  const { fixture } = loadFixture();
  for (const b of [5001, 0, 1.5, '10']) assert.throws(() => createSyntheticAuthServer({ fixture, requestBudget: b }), /UNSAFE_CONFIG/);
});

test('Q08 request body over 64 KiB is rejected (declared and streamed) with no dispatch', async (t) => {
  const { srv, client, addr } = await startServer(t);
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  const big = Buffer.alloc(LIMITS.maxRequestBodyBytes + 1, 0x20);
  const r = await client.request('POST', '/api/v1/projects/project_synth_alpha/mutations', {
    headers: browserHeaders({ cookie: a.cookieValue, csrf: a.csrfToken, extra: { 'If-Match': '"rev-fake-alpha-01"' } }),
    rawBody: big,
  });
  assert.equal(r.status, 413);
  assert.equal(r.body.error.code, 'BODY_TOO_LARGE');
  // Chunked, no Content-Length: counted while streaming.
  const chunk = 'x'.repeat(20000);
  const chunks = Array.from({ length: 4 }, () => `${chunk.length.toString(16)}\r\n${chunk}\r\n`).join('');
  const resp = await rawRequest(addr.port,
    'POST /api/v1/projects/project_synth_alpha/mutations HTTP/1.1\r\nHost: 127.0.0.1\r\n'
    + 'Origin: https://app.wp01.invalid\r\nSec-Fetch-Site: same-site\r\nContent-Type: application/json\r\n'
    + 'Transfer-Encoding: chunked\r\nConnection: close\r\n\r\n' + chunks + '0\r\n\r\n');
  assert.match(resp, /^HTTP\/1\.1 413 /);
  assert.equal(srv.backend.dispatches, 0);
});

test('Q08 response over 256 KiB is replaced by a bounded RESPONSE_LIMIT error (in-memory fixture copy only)', async (t) => {
  const { fixture } = loadFixture();
  const copy = structuredClone(fixture);
  copy.resources.projects[0].revision = 'rev-' + 'z'.repeat(LIMITS.maxResponseBodyBytes);
  const { srv, client } = await startServer(t, { fixture: copy });
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  const r = await client.request('GET', '/api/v1/projects/project_synth_alpha', { headers: browserHeaders({ cookie: a.cookieValue }) });
  assert.equal(r.status, 500);
  assert.equal(r.body.error.code, 'RESPONSE_LIMIT');
  assert.ok(Number(r.headers['content-length']) < 1024);
  assert.equal(r.headers.etag, undefined);
});

test('Q08 request budget: requests beyond the (lowered) budget get 429 and nothing is dispatched', async (t) => {
  const { srv, client } = await startServer(t, { server: { requestBudget: 5 } });
  const codes = [];
  for (let i = 0; i < 7; i += 1) codes.push((await client.request('GET', '/api/v1/health')).status);
  assert.deepEqual(codes, [200, 200, 200, 200, 200, 429, 429]);
  assert.equal(srv.stats.rejectedOverBudget, 2);
  assert.equal(srv.backend.dispatches, 0);
});

test('Q08 sanitized logs: no Cookie, CSRF token, header or body content is ever recorded', async (t) => {
  const { srv, client } = await startServer(t);
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  const secretish = 'hunter2-password-SHOULD-NOT-APPEAR';
  await client.request('POST', '/api/v1/projects/project_synth_alpha/mutations', {
    headers: browserHeaders({ cookie: a.cookieValue, csrf: a.csrfToken, extra: { 'If-Match': '"rev-fake-alpha-01"', Authorization: `Basic ${secretish}` } }),
    body: { operationId: newOperationId(), action: 'SET_ARCHIVED', value: true, password: secretish },
  });
  await client.request('GET', '/api/v1/projects/__proto__', { headers: browserHeaders({ cookie: a.cookieValue }) });
  await client.request('POST', '/api/v1/session/logout', { headers: browserHeaders({ cookie: a.cookieValue, csrf: 'wrong' }) });
  const dump = JSON.stringify(srv.logs);
  assert.ok(srv.logs.length >= 3);
  for (const needle of [a.cookieValue, a.csrfToken, secretish, 'Cookie', 'project_synth_alpha', 'password', 'wp01.invalid']) {
    assert.ok(!dump.includes(needle), `log leaked ${needle.slice(0, 12)}`);
  }
  for (const e of srv.logs) assert.deepEqual(Object.keys(e).sort(), ['code', 'method', 'route', 'status', 't']);
});

test('zz request tally for this file stays within the WP-01 5000-request cap', (t) => {
  const n = requestTally();
  t.diagnostic(`WP01_LOCAL_REQUESTS file=transport-negative n=${n}`);
  assert.ok(n <= 5000);
});
