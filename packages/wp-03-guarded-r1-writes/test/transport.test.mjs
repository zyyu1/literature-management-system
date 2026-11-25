// Q3-10: bounded loopback transport. 127.0.0.1 ephemeral only, inert import, absolute-form /
// protocol-relative / traversal / prototype targets, unsupported methods/queries, request and
// response limits, request budget, no redirects, safe headers, redacted logs, GET never mutates and
// an in-process egress spy that sees only 127.0.0.1 (no host-level isolation claim).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import {
  startServer, requestTally, loadRawFixtures, createFakeClient, browserHeaders,
  projectPatchBody, PROJECT_PATH, XFAKE001, APP_ORIGIN, EVIL_ORIGIN,
} from '../support/harness.mjs';
import { createGuardedR1Server } from '../src/server.mjs';
import { LIMITS } from '../../wp-01-synthetic-auth-api/src/policy.mjs';
import { ACTION } from '../src/contract.mjs';

const ALPHA = 'project_synth_alpha';

function spyConnections() {
  const calls = [];
  const orig = net.Socket.prototype.connect;
  net.Socket.prototype.connect = function patched(...args) {
    let o = args[0];
    if (Array.isArray(o)) o = o[0];
    calls.push(o && typeof o === 'object' ? String(o.host ?? o.path) : String(args[1] ?? o));
    return orig.apply(this, args);
  };
  return { calls, restore() { net.Socket.prototype.connect = orig; } };
}

function optionsWith(overrides = {}) {
  const fx = loadRawFixtures();
  return { wp01Raw: fx.wp01Raw, wp02Raw: fx.wp02Raw, ...overrides };
}

test('Q3-10 unsafe bind/budget configuration is refused before any socket exists; import is inert', async (t) => {
  const spy = spyConnections();
  try {
    for (const host of ['0.0.0.0', '::', '::1', 'localhost', '192.0.2.10', '', '127.0.0.2']) {
      assert.throws(() => createGuardedR1Server(optionsWith({ host })), /UNSAFE_CONFIG/, host);
    }
    for (const port of [80, 8080, 1, -1, 443]) {
      assert.throws(() => createGuardedR1Server(optionsWith({ port })), /UNSAFE_CONFIG/, String(port));
    }
    for (const budget of [5001, 0, 1.5, '10']) {
      assert.throws(() => createGuardedR1Server(optionsWith({ requestBudget: budget })), /UNSAFE_CONFIG/);
    }
    for (const budget of [LIMITS.maxResponseBodyBytes + 1, 255, 0, '1024']) {
      assert.throws(() => createGuardedR1Server(optionsWith({ responseBudgetBytes: budget })), /UNSAFE_CONFIG/);
    }
    // Fixtures are accepted ONLY as raw bytes that match the frozen oracle.
    assert.throws(() => createGuardedR1Server({}), /UNSAFE_CONFIG/);
    assert.throws(() => createGuardedR1Server({ wp01Fixture: {}, wp02Fixture: {} }), /UNSAFE_CONFIG/);
    assert.throws(() => createGuardedR1Server({ ...optionsWith(), wp01Raw: Buffer.from('{}') }), /UNSAFE_CONFIG/);
    assert.throws(() => createGuardedR1Server({ ...optionsWith(), wp02Raw: Buffer.from('{}') }), /UNSAFE_CONFIG/);
    const tampered = Buffer.from(loadRawFixtures().wp02Raw);
    tampered[0] = 0x20;
    assert.throws(() => createGuardedR1Server({ ...optionsWith(), wp02Raw: tampered }), /UNSAFE_CONFIG/);
  } finally { spy.restore(); }
  assert.deepEqual(spy.calls, [], 'no socket was created while validating configuration');
  const inert = createGuardedR1Server(optionsWith());
  assert.equal(inert.address(), null, 'the server is inert until listen()');
  assert.equal(inert.stats.requests, 0);
  const ctx = await startServer(t);
  assert.equal(ctx.addr.host, '127.0.0.1');
  assert.ok(ctx.addr.port > 0);
  assert.equal(ctx.srv.address().address, '127.0.0.1');
  assert.match(ctx.addr.baseUrl, /^http:\/\/127\.0\.0\.1:\d+$/);
});

test('Q3-10 the loopback-only fake client refuses every non-loopback base URL with zero connects', () => {
  const spy = spyConnections();
  try {
    for (const u of [
      'http://1.1.1.1:443', 'https://api.wp01.invalid', 'http://localhost:80', 'http://127.0.0.1.nip.io:80',
      'http://user:pw@127.0.0.1:80', 'http://127.0.0.1', 'https://127.0.0.1:443', 'http://[::ffff:1.1.1.1]:80',
      'file:///etc/passwd', 'not a url',
    ]) {
      assert.throws(() => createFakeClient({ baseUrl: u }), /NON_LOOPBACK_DENIED/, u);
    }
  } finally { spy.restore(); }
  assert.deepEqual(spy.calls, []);
  assert.deepEqual(Object.keys(process.env).filter((k) => /^(http|https|all)_proxy$/i.test(k)), []);
});

test('Q3-10 an in-process egress spy sees only 127.0.0.1 for a full request cycle', async (t) => {
  const spy = spyConnections();
  let ctx;
  try {
    ctx = await startServer(t);
    await ctx.get('/api/v1/health');
    await ctx.get('/api/v1/projects?state=all', ctx.owner);
    await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, {
      body: projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'egress' }), ifMatch: `"${ctx.srv.control.project(ALPHA).revision}"`,
    });
    await ctx.call('POST', '/api/v1/nope', ctx.owner, { body: {} });
  } finally {
    spy.restore();
  }
  assert.ok(spy.calls.length >= 4, JSON.stringify(spy.calls));
  assert.ok(spy.calls.every((h) => h === '127.0.0.1'), JSON.stringify(spy.calls));
});

test('Q3-10 absolute-form, protocol-relative, asterisk and overlong targets are rejected without dispatch', async (t) => {
  const ctx = await startServer(t);
  const digest = ctx.srv.control.stateDigest();
  for (const target of [
    'http://api.zotero.invalid/api/v1/health',
    'https://evil.wp01.invalid/api/v1/projects',
    '//evil.wp01.invalid/api/v1/health',
    '*',
    `/api/v1/${'x/'.repeat(1100)}`,
  ]) {
    const resp = (await ctx.rawClient.raw(`GET ${target} HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n`)).toString('latin1');
    assert.match(resp, /^HTTP\/1\.1 400 /, target.slice(0, 40));
    assert.match(resp, /INVALID_PATH/);
  }
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q3-10 traversal, encoded separators, NUL and prototype path segments fail closed', async (t) => {
  const ctx = await startServer(t);
  const digest = ctx.srv.control.stateDigest();
  const paths = [
    `/api/v1/projects/${ALPHA}/..%2Fsecrets`, '/api/v1/projects/%2e%2e', '/api/v1/projects/a%00b',
    '/api/v1/projects/a%5Cb', '/api/v1/projects/__proto__', '/api/v1/projects/constructor',
    '/api/v1/projects/prototype', '/api/v1/projects/%E0%A4%A', '/api/v1/projects/PROJECT_SYNTH_ALPHA',
    '/api/v1/projects/' + 'a'.repeat(65), '/api/v1/papers/user/fakeLib01/XFAKE001/../important',
  ];
  for (const path of paths) {
    const res = await ctx.get(path, ctx.owner);
    assert.ok([400, 404].includes(res.status), `${path} -> ${res.status}`);
    assert.ok(!('project' in res.body));
  }
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q3-10 unsupported methods are 405 with Allow, unknown routes 404, unknown queries 400, never mutating', async (t) => {
  const ctx = await startServer(t);
  const digest = ctx.srv.control.stateDigest();
  const ledger = ctx.srv.control.ledgerSize();
  const probes = [
    ['PUT', PROJECT_PATH(ALPHA), 405],
    ['PATCH', '/api/v1/health', 405],
    ['DELETE', '/api/v1/health', 405],
    ['POST', `/api/v1/papers/${XFAKE001.join('/')}/reading-status`, 405],
    ['GET', '/api/v1/projects', 200],
    ['DELETE', '/api/v1/projects', 405],
    ['GET', '/api/v1/unknown', 404],
    ['POST', '/api/v1/unknown', 404],
    ['GET', '/api/v1/health?x=1', 400],
    ['GET', '/api/v1/projects?state=all&x=1', 400],
    ['GET', '/api/v1/projects?state=all&state=active', 400],
    ['PATCH', `${PROJECT_PATH(ALPHA)}?x=1`, 400],
  ];
  for (const [method, path, status] of probes) {
    const res = await ctx.call(method, path, ctx.owner, { body: method === 'GET' ? undefined : {} });
    assert.equal(res.status, status, `${method} ${path}`);
    if (status === 405) assert.ok(res.headers.allow, `${method} ${path} Allow`);
  }
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.ledgerSize(), ledger);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q3-10 OPTIONS preflight is bounded and never dispatches', async (t) => {
  const ctx = await startServer(t);
  const headers = {
    Origin: APP_ORIGIN,
    'Access-Control-Request-Method': 'PATCH',
    'Access-Control-Request-Headers': 'content-type, if-match, x-csrf-token',
  };
  const ok = await ctx.rawClient.request('OPTIONS', PROJECT_PATH(ALPHA), { headers });
  assert.equal(ok.status, 204);
  assert.equal(ok.headers['access-control-allow-origin'], APP_ORIGIN);
  assert.equal(ok.headers['access-control-allow-credentials'], 'true');
  assert.ok(String(ok.headers['access-control-allow-methods']).includes('PATCH'));
  const badMethod = await ctx.rawClient.request('OPTIONS', PROJECT_PATH(ALPHA), { headers: { ...headers, 'Access-Control-Request-Method': 'TRACE' } });
  assert.equal(badMethod.status, 403);
  assert.equal(badMethod.body.error.code, 'PREFLIGHT_DENIED');
  const evil = await ctx.rawClient.request('OPTIONS', PROJECT_PATH(ALPHA), { headers: { ...headers, Origin: EVIL_ORIGIN } });
  assert.equal(evil.status, 403);
  assert.equal(evil.headers['access-control-allow-origin'], undefined);
  const badHeader = await ctx.rawClient.request('OPTIONS', PROJECT_PATH(ALPHA), { headers: { ...headers, 'Access-Control-Request-Headers': 'authorization' } });
  assert.equal(badHeader.status, 403);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q3-10 request bodies over 64 KiB are 413 both declared and streamed, with no dispatch', async (t) => {
  const ctx = await startServer(t);
  const body = Buffer.alloc(LIMITS.maxRequestBodyBytes + 1, 0x20);
  const declared = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, { rawBody: body, ifMatch: '"x"' });
  assert.equal(declared.status, 413);
  assert.equal(declared.body.error.code, 'BODY_TOO_LARGE');
  const chunk = 'x'.repeat(20000);
  const chunks = Array.from({ length: 4 }, () => `${chunk.length.toString(16)}\r\n${chunk}\r\n`).join('');
  const text = [
    `PATCH /api/v1/projects/${ALPHA} HTTP/1.1`,
    'Host: 127.0.0.1',
    `Origin: ${APP_ORIGIN}`,
    'Sec-Fetch-Site: same-site',
    'Content-Type: application/json',
    `Cookie: __Host-lms_session=${ctx.owner.cookieValue}`,
    `X-CSRF-Token: ${ctx.owner.csrfToken}`,
    'Transfer-Encoding: chunked',
    'Connection: close',
    '',
    chunks + '0\r\n\r\n',
  ].join('\r\n');
  const streamed = (await ctx.rawClient.raw(text)).toString('latin1');
  assert.match(streamed, /^HTTP\/1\.1 413 /);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
});

test('Q3-10 GET responses over the lowered response budget are bounded 500 RESPONSE_LIMIT', async (t) => {
  const ctx = await startServer(t, { server: { responseBudgetBytes: 256 } });
  const res = await ctx.get('/api/v1/health');
  assert.equal(res.status, 500);
  assert.equal(res.body.error.code, 'RESPONSE_LIMIT');
  assert.ok(Number(res.headers['content-length']) < 1024);
  assert.equal(res.headers.etag, undefined);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q3-10 the request budget is a hard ceiling: beyond it every request is 429 and nothing dispatches', async (t) => {
  const ctx = await startServer(t, { server: { requestBudget: 5 } });
  const codes = [];
  for (let i = 0; i < 7; i += 1) codes.push((await ctx.get('/api/v1/health')).status);
  assert.deepEqual(codes, [200, 200, 200, 200, 200, 429, 429]);
  assert.equal(ctx.srv.stats.rejectedOverBudget, 2);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q3-10 no route ever redirects, no wildcard CORS credentials, no-store and nosniff are always set', async (t) => {
  const ctx = await startServer(t);
  const probes = [
    ['GET', '/api/v1/health'],
    ['GET', '/api/v1/projects', ctx.owner],
    ['GET', '/api/v1/redirect?to=' + encodeURIComponent('https://evil.wp01.invalid/'), ctx.owner],
    ['POST', '/api/v1/unknown', ctx.owner],
    ['DELETE', PROJECT_PATH(ALPHA), ctx.owner],
  ];
  for (const [method, path, creds] of probes) {
    const res = await ctx.call(method, path, creds, { body: method === 'GET' ? undefined : {}, origin: APP_ORIGIN });
    assert.ok(!(res.status >= 300 && res.status < 400), `${method} ${path} -> ${res.status}`);
    assert.equal(res.headers.location, undefined);
    assert.equal(res.headers['cache-control'], 'no-store');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['access-control-allow-origin'], APP_ORIGIN);
    assert.equal(res.headers['access-control-allow-credentials'], 'true');
    assert.notEqual(res.headers['access-control-allow-origin'], '*');
  }
  const evil = await ctx.call('GET', '/api/v1/health', undefined, { origin: EVIL_ORIGIN });
  assert.equal(evil.headers['access-control-allow-origin'], undefined);
  assert.equal(evil.headers.vary, 'Origin');
  const anon = await ctx.call('GET', '/api/v1/health', undefined, { origin: null });
  assert.equal(anon.headers['access-control-allow-origin'], undefined);
});

test('Q3-10 sanitized logs contain only time/method/route-template/status/code (no tokens, ids, bodies, notes)', async (t) => {
  const ctx = await startServer(t);
  const secret = 'SECRET-NOTE-BYTES-SHOULD-NOT-APPEAR';
  const revision = ctx.srv.control.project(ALPHA).revision;
  const body = { ...projectPatchBody(ctx.runId, ACTION.RENAME, { name: secret }), note: secret };
  await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, { body, ifMatch: `"${revision}"`, extraHeaders: { Authorization: 'Bearer ' + secret } });
  await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, { body: { bad: true }, origin: EVIL_ORIGIN });
  await ctx.get('/api/v1/unknown', ctx.owner);
  await ctx.call('DELETE', PROJECT_PATH(ALPHA), ctx.owner, { body: { stepUp: secret } });
  const logs = ctx.srv.logs;
  assert.ok(logs.length >= 4);
  const dump = JSON.stringify(logs);
  for (const needle of [ctx.owner.cookieValue, ctx.owner.csrfToken, ctx.ownerSecond.cookieValue, secret, 'project_synth_alpha', 'Alpha 综述', 'Cookie', 'authorization', 'operationId', 'op_']) {
    assert.ok(!dump.includes(needle), `log leaked ${needle.slice(0, 14)}`);
  }
  for (const entry of logs) assert.deepEqual(Object.keys(entry).sort(), ['code', 'method', 'route', 'status', 't']);
});

test('Q3-10 every GET and unknown route leaves model state and ledger untouched', async (t) => {
  const ctx = await startServer(t);
  const digest = ctx.srv.control.stateDigest();
  const ledger = ctx.srv.control.ledgerDigest();
  const gets = [
    '/api/v1/health', '/api/v1/projects', '/api/v1/projects?state=active', '/api/v1/projects?state=archived',
    '/api/v1/projects?state=all', '/api/v1/projects/project_synth_alpha/papers', '/api/v1/projects/project_synth_foreign/papers',
    `/api/v1/papers/${XFAKE001.join('/')}`, '/api/v1/papers/user/fakeLib01/xfake001', '/api/v1/papers/group/fakeLib02/XFAKE001',
    '/api/v1/papers/user/fakeLibForeign/XFOREIGN1', '/api/v1/no-such-route', '/api/v1/projects/no_such_project/papers',
  ];
  for (const path of gets) {
    const res = await ctx.get(path, ctx.owner);
    assert.ok([200, 403, 404].includes(res.status), `${path} -> ${res.status}`);
  }
  await ctx.rawClient.raw('GET http://evil.wp01.invalid/api/v1/health HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n');
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.ledgerDigest(), ledger);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('zz request tally for this file stays within the 5000-request per-instance budget', (t) => {
  const n = requestTally();
  t.diagnostic(`WP03_LOCAL_REQUESTS file=transport n=${n}`);
  assert.ok(n <= 5000);
});
