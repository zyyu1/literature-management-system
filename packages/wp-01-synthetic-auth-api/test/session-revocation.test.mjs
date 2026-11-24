// Q03 (SESS-01, SESS-02, fixation/renewal) and Q05 (__Host- Cookie policy, syntactic only on HTTP loopback).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixtureCase, startServer, browserHeaders, requestTally } from '../support/harness.mjs';

const get = (client, cookie, path = '/api/v1/projects/project_synth_alpha') =>
  client.request('GET', path, { headers: browserHeaders({ cookie }) });

test('Q03 SESS-01 revoked Session is denied (401 SESSION_REVOKED, no data)', async (t) => {
  const { fixture, srv, client } = await startServer(t);
  const c = fixtureCase(fixture, 'SESS-01');
  assert.equal(c.expect, 'DENY_REVOKED');
  const r = await get(client, srv.control.tokenFor(c.session).cookieValue);
  assert.equal(r.status, 401);
  assert.equal(r.body.error.code, 'SESSION_REVOKED');
  assert.equal(r.body.project, undefined);
});

test('Q03 SESS-02 expired Session is denied (401 SESSION_EXPIRED, no data)', async (t) => {
  const { fixture, srv, client } = await startServer(t);
  const c = fixtureCase(fixture, 'SESS-02');
  assert.equal(c.expect, 'DENY_EXPIRED');
  const r = await get(client, srv.control.tokenFor(c.session).cookieValue);
  assert.equal(r.status, 401);
  assert.equal(r.body.error.code, 'SESSION_EXPIRED');
  assert.equal(r.body.project, undefined);
});

test('Q03 revoking one Session leaves the other active fake Session unaffected', async (t) => {
  const { srv, client } = await startServer(t);
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  const a2 = srv.control.issueFreshSession('user_demo_a');
  assert.equal((await get(client, a.cookieValue)).status, 200);
  srv.control.revokeByCookie(a2.cookieValue);
  assert.equal((await get(client, a2.cookieValue)).status, 401);
  assert.equal((await get(client, a.cookieValue)).status, 200);
  const w = srv.control.tokenFor('synthetic_session_workspace');
  assert.equal((await get(client, w.cookieValue, '/api/v1/projects/project_synth_alpha/projection')).status, 200);
});

test('Q03 fake clock: active Session expires exactly when the clock passes expiresAt (advanceMs from fixture)', async (t) => {
  const { fixture, srv, client } = await startServer(t);
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  const steps = fixture.clock.advanceMs; // [0, 250, 2000, 3600000]
  assert.deepEqual(steps, [0, 250, 2000, 3600000]);
  for (const ms of steps.slice(0, 3)) {
    srv.control.advanceClock(ms);
    assert.equal((await get(client, a.cookieValue)).status, 200, `still active after +${ms}ms`);
  }
  srv.control.advanceClock(steps[3]);
  const r = await get(client, a.cookieValue);
  assert.equal(r.status, 401);
  assert.equal(r.body.error.code, 'SESSION_EXPIRED');
  assert.throws(() => srv.control.advanceClock(-1));
});

test('Q03 logout revokes only that Session (CSRF required) and clears the cookie', async (t) => {
  const { srv, client } = await startServer(t);
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  const w = srv.control.tokenFor('synthetic_session_workspace');
  const noCsrf = await client.request('POST', '/api/v1/session/logout', { headers: browserHeaders({ cookie: a.cookieValue }) });
  assert.equal(noCsrf.status, 403);
  assert.equal((await get(client, a.cookieValue)).status, 200, 'CSRF-less logout must not log out');
  const r = await client.request('POST', '/api/v1/session/logout', { headers: browserHeaders({ cookie: a.cookieValue, csrf: a.csrfToken }) });
  assert.equal(r.status, 200);
  assert.match(r.headers['set-cookie'][0], /^__Host-lms_session=; Path=\/; Secure; HttpOnly; SameSite=Lax; Max-Age=0$/);
  assert.equal((await get(client, a.cookieValue)).status, 401);
  assert.equal((await get(client, w.cookieValue, '/api/v1/projects/project_synth_alpha/projection')).status, 200);
});

test('Q03 fixation defence: renewal rotates token+CSRF, kills the old token, never extends absolute expiry', async (t) => {
  const { srv, client } = await startServer(t);
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  const r = await client.request('POST', '/api/v1/session/renew', { headers: browserHeaders({ cookie: a.cookieValue, csrf: a.csrfToken }) });
  assert.equal(r.status, 200);
  assert.equal(r.body.absoluteExpiryExtended, false);
  const m = /^__Host-lms_session=([A-Za-z0-9_-]{43}); /.exec(r.headers['set-cookie'][0]);
  assert.ok(m, 'opaque 256-bit token');
  const newTok = m[1];
  assert.notEqual(newTok, a.cookieValue);
  assert.notEqual(r.body.csrfToken, a.csrfToken);
  assert.equal((await get(client, a.cookieValue)).status, 401, 'old token dead after rotation');
  assert.equal((await get(client, newTok)).status, 200);
  // Old CSRF token is not accepted with the new Session.
  const stale = await client.request('POST', '/api/v1/session/renew', { headers: browserHeaders({ cookie: newTok, csrf: a.csrfToken }) });
  assert.equal(stale.status, 403);
  // Absolute expiry retained: fixture owner_a expires 04:00:00Z; clock is 03:04:05Z.
  srv.control.advanceClock(56 * 60 * 1000);
  assert.equal((await get(client, newTok)).status, 401);
});

test('Q03 a client-chosen (fixated) or duplicated Session cookie is never accepted', async (t) => {
  const { srv, client } = await startServer(t);
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  assert.equal((await get(client, 'synthetic_session_owner_a')).status, 401, 'fixture IDs are not cookies');
  assert.equal((await get(client, 'attacker-chosen-value')).status, 401);
  const dup = await client.request('GET', '/api/v1/projects/project_synth_alpha', {
    headers: { Origin: 'https://app.wp01.invalid', Cookie: `__Host-lms_session=${a.cookieValue}; __Host-lms_session=attacker` },
  });
  assert.equal(dup.status, 401);
  assert.equal(dup.body.error.code, 'SESSION_INVALID');
});

test('Q05 __Host- Cookie policy in fake Set-Cookie: HttpOnly, Secure, Path=/, no Domain, SameSite=Lax (syntactic only, NO browser proof)', async (t) => {
  const { srv, client } = await startServer(t);
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  const r = await client.request('POST', '/api/v1/session/renew', { headers: browserHeaders({ cookie: a.cookieValue, csrf: a.csrfToken }) });
  const sc = r.headers['set-cookie'];
  assert.equal(sc.length, 1);
  const parts = sc[0].split('; ');
  assert.ok(parts[0].startsWith('__Host-lms_session='));
  const attrs = parts.slice(1);
  assert.deepEqual(attrs, ['Path=/', 'Secure', 'HttpOnly', 'SameSite=Lax']);
  assert.ok(!/domain=/i.test(sc[0]), 'host-only: no Domain attribute');
  assert.ok(!/samesite=none/i.test(sc[0]));
  assert.equal(r.headers['cache-control'], 'no-store');
});

test('zz request tally for this file stays within the WP-01 5000-request cap', (t) => {
  const n = requestTally();
  t.diagnostic(`WP01_LOCAL_REQUESTS file=session-revocation n=${n}`);
  assert.ok(n <= 5000);
});
