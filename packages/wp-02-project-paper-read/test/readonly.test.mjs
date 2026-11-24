// Q2-07 (non-GET half) and Q2-08: R-RO — every non-GET on a WP-02 route is 405, no dispatch, no state change;
// a full state digest before and after all requests is equal.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, browserHeaders, requestTally, PAPER_PATH, XFAKE001 } from '../support/harness.mjs';

const ROUTES = [
  '/api/v1/projects', '/api/v1/projects?state=all', '/api/v1/projects/project_synth_alpha/papers',
  '/api/v1/projects/project_synth_beta/papers', PAPER_PATH(XFAKE001), '/api/v1/papers/user/fakeLib01/XNOPE999',
];
const METHODS = ['POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

test('Q2-07 WORKSPACE_READONLY and Owner: every non-GET on every WP-02 route is 405 (Allow: GET) with no state change', async (t) => {
  const { srv, client, owner, workspace, digestBefore } = await startServer(t);
  for (const who of [workspace, owner]) {
    for (const path of ROUTES) {
      for (const m of METHODS) {
        const r = await client.request(m, path, {
          headers: browserHeaders({ cookie: who.cookieValue, csrf: who.csrfToken, extra: { 'If-Match': '"rev-wp02-alpha-01"' } }),
          body: m === 'HEAD' || m === 'OPTIONS' ? undefined : { important: true, readingStatus: 'Read', note: null, archived: false },
        });
        assert.equal(r.status, 405, `${m} ${path}`);
        assert.equal(r.headers.allow, 'GET');
        if (m !== 'HEAD') assert.equal(r.body.error.code, 'METHOD_NOT_ALLOWED');
      }
    }
  }
  assert.equal(srv.catalog.stateDigest(), digestBefore);
});

test('Q2-07 405 precedes auth: anonymous and foreign non-GET also 405, still no change', async (t) => {
  const { srv, client, digestBefore } = await startServer(t);
  const foreign = srv.sessions.issueFreshSession('user_demo_b');
  for (const cookie of [undefined, foreign.cookieValue]) {
    const r = await client.request('DELETE', '/api/v1/projects/project_synth_alpha/papers', { headers: browserHeaders(cookie ? { cookie } : {}) });
    assert.equal(r.status, 405);
  }
  assert.equal(srv.catalog.stateDigest(), digestBefore);
});

test('Q2-08 state digest is identical before and after a full read sweep (and returned data is a copy)', async (t) => {
  const { srv, get, owner, digestBefore } = await startServer(t);
  const r = await get(PAPER_PATH(XFAKE001), owner.cookieValue);
  r.body.paper.note.limitations = 'tampered by client';
  r.body.associations.length = 0;
  for (const p of ROUTES) await get(p, owner.cookieValue);
  const again = await get(PAPER_PATH(XFAKE001), owner.cookieValue);
  assert.notEqual(again.body.paper.note.limitations, 'tampered by client');
  assert.equal(again.body.associations.length, 3);
  assert.equal(srv.catalog.stateDigest(), digestBefore);
});

test('Q2-08 the digest is sensitive: a different fixture state yields a different digest', async (t) => {
  const base = await startServer(t);
  const copy = structuredClone(base.wp02);
  copy.associations[1].important = true;
  const other = await startServer(t, { wp02: copy });
  assert.notEqual(other.srv.catalog.stateDigest(), base.srv.catalog.stateDigest());
});

test('zz request tally for this file stays within the 5000-request cap', (t) => {
  const n = requestTally();
  t.diagnostic(`WP02_LOCAL_REQUESTS file=readonly n=${n}`);
  assert.ok(n <= 5000);
});
