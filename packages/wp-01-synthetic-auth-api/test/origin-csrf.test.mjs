// Q04 (ORIGIN-01, CSRF-01): exact credentialed CORS/Vary, no wildcard; Origin, Fetch Metadata and CSRF
// deny BEFORE dispatch. Origins are simulated header strings; no live TLS/DNS/browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSyntheticAuthServer } from '../src/server.mjs';
import {
  loadFixture, fixtureCase, startServer, browserHeaders, newOperationId, requestTally, APP_ORIGIN, EVIL_ORIGIN,
} from '../support/harness.mjs';

const ALPHA = '/api/v1/projects/project_synth_alpha';

async function ownerWrite(client, a, headersOverride) {
  return client.request('POST', `${ALPHA}/mutations`, {
    headers: headersOverride ?? browserHeaders({ cookie: a.cookieValue, csrf: a.csrfToken, extra: { 'If-Match': '"rev-fake-alpha-01"' } }),
    body: { operationId: newOperationId(), action: 'SET_ARCHIVED', value: true },
  });
}

test('Q04 ORIGIN-01 untrusted Origin POST is denied before dispatch, no credentialed CORS', async (t) => {
  const { fixture, srv, client } = await startServer(t);
  const c = fixtureCase(fixture, 'ORIGIN-01');
  assert.equal(c.expect, 'DENY_BEFORE_DISPATCH');
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  const r = await ownerWrite(client, a, browserHeaders({ cookie: a.cookieValue, csrf: a.csrfToken, origin: c.origin, extra: { 'If-Match': '"rev-fake-alpha-01"' } }));
  assert.equal(r.status, 403);
  assert.equal(r.body.error.code, 'ORIGIN_DENIED');
  assert.equal(r.body.dispatched, false);
  assert.equal(r.headers['access-control-allow-origin'], undefined);
  assert.equal(r.headers['access-control-allow-credentials'], undefined);
  assert.equal(r.headers.vary, 'Origin');
  assert.equal(srv.backend.dispatches, 0);
  assert.equal(srv.control.projectSnapshot('project_synth_alpha').archived, false);
});

test('Q04 CSRF-01 trusted Origin but MISSING CSRF token is denied before dispatch', async (t) => {
  const { fixture, srv, client } = await startServer(t);
  const c = fixtureCase(fixture, 'CSRF-01');
  assert.equal(c.expect, 'DENY_BEFORE_DISPATCH');
  assert.equal(c.origin, APP_ORIGIN);
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  const r = await ownerWrite(client, a, browserHeaders({ cookie: a.cookieValue, origin: c.origin, extra: { 'If-Match': '"rev-fake-alpha-01"' } }));
  assert.equal(r.status, 403);
  assert.equal(r.body.error.code, 'CSRF_DENIED');
  assert.equal(srv.backend.dispatches, 0);
});

test('Q04 wrong CSRF token, and another Session\'s valid token, are both denied before dispatch', async (t) => {
  const { srv, client } = await startServer(t);
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  const a2 = srv.control.issueFreshSession('user_demo_a');
  for (const csrf of ['x'.repeat(43), a2.csrfToken, '']) {
    const r = await ownerWrite(client, a, browserHeaders({ cookie: a.cookieValue, csrf, extra: { 'If-Match': '"rev-fake-alpha-01"' } }));
    assert.equal(r.status, 403);
    assert.equal(r.body.error.code, 'CSRF_DENIED');
  }
  assert.equal(srv.backend.dispatches, 0);
});

test('Q04 missing / null / suffix-lookalike / http Origin on unsafe request are denied', async (t) => {
  const { srv, client } = await startServer(t);
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  const variants = [
    null, 'null', 'https://app.wp01.invalid.evil.invalid', 'http://app.wp01.invalid',
    'https://APP.wp01.invalid', 'https://app.wp01.invalid:443', 'https://sub.app.wp01.invalid', EVIL_ORIGIN,
  ];
  for (const o of variants) {
    const h = { Cookie: `__Host-lms_session=${a.cookieValue}`, 'X-CSRF-Token': a.csrfToken, 'Sec-Fetch-Site': 'same-site', 'If-Match': '"rev-fake-alpha-01"' };
    if (o !== null) h.Origin = o;
    const r = await ownerWrite(client, a, h);
    assert.equal(r.status, 403, `origin ${o}`);
    assert.equal(r.body.error.code, 'ORIGIN_DENIED');
  }
  assert.equal(srv.backend.dispatches, 0);
});

test('Q04 Fetch Metadata: cross-site and absent Sec-Fetch-Site deny unsafe requests before dispatch', async (t) => {
  const { srv, client } = await startServer(t);
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  for (const site of ['cross-site', 'none', null]) {
    const r = await ownerWrite(client, a, browserHeaders({ cookie: a.cookieValue, csrf: a.csrfToken, fetchSite: site, extra: { 'If-Match': '"rev-fake-alpha-01"' } }));
    assert.equal(r.status, 403, `Sec-Fetch-Site=${site}`);
    assert.equal(r.body.error.code, 'FETCH_METADATA_DENIED');
  }
  assert.equal(srv.backend.dispatches, 0);
});

test('Q04 authorized flow: allowed Origin + Fetch Metadata + CSRF dispatches exactly once', async (t) => {
  const { srv, client } = await startServer(t);
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  const r = await ownerWrite(client, a);
  assert.equal(r.status, 200);
  assert.equal(r.body.outcome, 'CONFIRMED');
  assert.equal(srv.backend.dispatches, 1);
});

test('Q04 credentialed CORS: exact allowed Origin echoed with credentials and Vary; never wildcard or reflection', async (t) => {
  const { srv, client } = await startServer(t);
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  const ok = await client.request('GET', ALPHA, { headers: browserHeaders({ cookie: a.cookieValue }) });
  assert.equal(ok.headers['access-control-allow-origin'], APP_ORIGIN);
  assert.equal(ok.headers['access-control-allow-credentials'], 'true');
  assert.equal(ok.headers.vary, 'Origin');
  const evil = await client.request('GET', ALPHA, { headers: browserHeaders({ cookie: a.cookieValue, origin: EVIL_ORIGIN }) });
  assert.equal(evil.headers['access-control-allow-origin'], undefined);
  assert.equal(evil.headers['access-control-allow-credentials'], undefined);
  assert.equal(evil.headers.vary, 'Origin');
  for (const r of [ok, evil]) {
    const raw = r.rawHeaders.join('\n');
    assert.doesNotMatch(raw, /Access-Control-Allow-Origin\n\*/i);
  }
});

test('Q04 preflight: allowed Origin/method/headers -> 204 exact; foreign Origin, odd method or header -> 403', async (t) => {
  const { client } = await startServer(t);
  const pf = (origin, method, hdrs) => client.request('OPTIONS', `${ALPHA}/mutations`, {
    headers: { Origin: origin, 'Access-Control-Request-Method': method, 'Access-Control-Request-Headers': hdrs },
  });
  const good = await pf(APP_ORIGIN, 'POST', 'content-type, x-csrf-token, if-match');
  assert.equal(good.status, 204);
  assert.equal(good.headers['access-control-allow-origin'], APP_ORIGIN);
  assert.equal(good.headers['access-control-allow-credentials'], 'true');
  assert.equal(good.headers.vary, 'Origin');
  assert.ok(!good.headers['access-control-allow-headers'].includes('*'));
  for (const [o, m, h] of [[EVIL_ORIGIN, 'POST', 'content-type'], [APP_ORIGIN, 'PUT', 'content-type'], [APP_ORIGIN, 'POST', 'x-evil']]) {
    const r = await pf(o, m, h);
    assert.equal(r.status, 403);
    assert.equal(r.headers['access-control-allow-origin'], undefined);
  }
});

test('Q04 unsafe config is refused: wildcard, null or non-https origin allowlist', () => {
  const { fixture } = loadFixture();
  for (const bad of [['*'], ['null'], ['http://app.wp01.invalid'], ['https://*.wp01.invalid']]) {
    assert.throws(() => createSyntheticAuthServer({ fixture, allowedOrigins: bad }), /UNSAFE_CONFIG/);
  }
  assert.throws(() => createSyntheticAuthServer({ fixture, requireFetchMetadata: 'no' }), /UNSAFE_CONFIG/);
});

test('Q04 no state-changing GET: GET on mutation/unlink endpoints is 405 and dispatches nothing', async (t) => {
  const { srv, client } = await startServer(t);
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  for (const p of [`${ALPHA}/mutations`, `${ALPHA}/unlink-all`, '/api/v1/session/logout']) {
    const r = await client.request('GET', p, { headers: browserHeaders({ cookie: a.cookieValue }) });
    assert.equal(r.status, 405, p);
  }
  assert.equal(srv.backend.dispatches, 0);
  assert.equal((await client.request('GET', ALPHA, { headers: browserHeaders({ cookie: a.cookieValue }) })).status, 200);
});

test('zz request tally for this file stays within the WP-01 5000-request cap', (t) => {
  const n = requestTally();
  t.diagnostic(`WP01_LOCAL_REQUESTS file=origin-csrf n=${n}`);
  assert.ok(n <= 5000);
});
