// Q02 (AUTH-03, AUTH-04): read-only Workspace projection; every mutation/factor/export denied.
// Q07 (STEPUP-01): missing R2 Step-up -> distinct STEP_UP_REQUIRED, never an R2 mutation.
// Permanent Project Delete, All Unlink and real mutations stay DISABLED in WP-01.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixtureCase, startServer, browserHeaders, newOperationId, requestTally } from '../support/harness.mjs';

const ALPHA = '/api/v1/projects/project_synth_alpha';

test('Q02 AUTH-03 Workspace read-only principal gets a SCOPED projection only', async (t) => {
  const { fixture, srv, client } = await startServer(t);
  const c = fixtureCase(fixture, 'AUTH-03');
  assert.equal(c.expect, 'ALLOW_SCOPED_ONLY');
  const w = srv.control.tokenFor('synthetic_session_workspace');
  const r = await client.request('GET', `/api/v1/projects/${c.resource}/projection`, { headers: browserHeaders({ cookie: w.cookieValue }) });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { apiVersion: 'v1', projection: { id: 'project_synth_alpha', archived: false }, readOnly: true });
  assert.equal(r.headers.etag, undefined, 'no revision handle for a read-only projection');
  const full = await client.request('GET', `/api/v1/projects/${c.resource}`, { headers: browserHeaders({ cookie: w.cookieValue }) });
  assert.equal(full.status, 403, 'full Owner representation is out of Workspace scope');
  const foreign = await client.request('GET', '/api/v1/projects/project_synth_foreign/projection', { headers: browserHeaders({ cookie: w.cookieValue }) });
  assert.equal(foreign.status, 403);
  assert.equal(foreign.body.error.code, 'NOT_AVAILABLE');
});

test('Q02 AUTH-04 Workspace mutation is denied with no side effect', async (t) => {
  const { fixture, srv, client } = await startServer(t);
  const c = fixtureCase(fixture, 'AUTH-04');
  assert.equal(c.expect, 'DENY_NO_SIDE_EFFECT');
  const w = srv.control.tokenFor('synthetic_session_workspace');
  const before = srv.control.projectSnapshot(c.resource);
  const r = await client.request('POST', `/api/v1/projects/${c.resource}/mutations`, {
    headers: browserHeaders({ cookie: w.cookieValue, csrf: w.csrfToken, extra: { 'If-Match': `"${before.revision}"` } }),
    body: { operationId: newOperationId(), action: 'SET_ARCHIVED', value: true },
  });
  assert.equal(r.status, 403);
  assert.equal(r.body.error.code, 'WORKSPACE_READ_ONLY');
  assert.equal(r.body.dispatched, false);
  assert.deepEqual(srv.control.projectSnapshot(c.resource), before);
  assert.equal(srv.backend.dispatches, 0);
});

test('Q02 every Workspace mutation, factor and export attempt is denied', async (t) => {
  const { srv, client } = await startServer(t);
  const w = srv.control.tokenFor('synthetic_session_workspace');
  const h = browserHeaders({ cookie: w.cookieValue, csrf: w.csrfToken });
  const attempts = [
    ['DELETE', ALPHA], ['POST', `${ALPHA}/unlink-all`], ['POST', '/api/v1/factors'],
    ['POST', '/api/v1/session/revoke-other'], ['GET', `${ALPHA}/export`],
  ];
  for (const [m, p] of attempts) {
    const r = await client.request(m, p, { headers: h });
    assert.equal(r.status, 403, `${m} ${p}`);
    assert.equal(r.body.error.code, 'WORKSPACE_READ_ONLY', `${m} ${p}`);
  }
  assert.equal(srv.backend.dispatches, 0);
});

test('Q07 STEPUP-01 Owner PROJECT_DELETE without Step-up -> distinct STEP_UP_REQUIRED, no dispatch', async (t) => {
  const { fixture, srv, client } = await startServer(t);
  const c = fixtureCase(fixture, 'STEPUP-01');
  assert.equal(c.expect, 'STEP_UP_REQUIRED_NO_DISPATCH');
  assert.equal(c.operation, 'PROJECT_DELETE');
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  assert.equal(srv.control.projectSnapshot('project_synth_alpha') !== undefined, true);
  const r = await client.request('DELETE', ALPHA, { headers: browserHeaders({ cookie: a.cookieValue, csrf: a.csrfToken }) });
  assert.equal(r.status, 403);
  assert.equal(r.body.error.code, 'STEP_UP_REQUIRED');
  assert.equal(r.body.stepUp, 'REQUIRED');
  assert.equal(r.body.dispatched, false);
  assert.equal(r.body.mutationEnabled, false);
  assert.equal(srv.backend.dispatches, 0);
  assert.ok(srv.control.projectSnapshot('project_synth_alpha'), 'project still exists');
  // Distinct from a generic authorization denial.
  const generic = await client.request('DELETE', '/api/v1/projects/project_synth_foreign', { headers: browserHeaders({ cookie: a.cookieValue, csrf: a.csrfToken }) });
  assert.equal(generic.body.error.code, 'NOT_AVAILABLE');
});

test('Q07 client-asserted Step-up headers are ignored: R2 Delete / All Unlink / revoke-other stay DISABLED', async (t) => {
  const { srv, client } = await startServer(t);
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  const h = browserHeaders({ cookie: a.cookieValue, csrf: a.csrfToken, extra: { 'X-Step-Up': 'fresh', 'X-MFA': '000000' } });
  for (const [m, p] of [['DELETE', ALPHA], ['POST', `${ALPHA}/unlink-all`], ['POST', '/api/v1/session/revoke-other'], ['DELETE', '/api/v1/projects/project_synth_beta']]) {
    const r = await client.request(m, p, { headers: h });
    assert.equal(r.status, 403, `${m} ${p}`);
    assert.equal(r.body.error.code, 'STEP_UP_REQUIRED', `${m} ${p}`);
  }
  assert.equal(srv.backend.dispatches, 0);
  const f = await client.request('POST', '/api/v1/factors', { headers: h });
  assert.equal(f.body.error.code, 'FEATURE_DISABLED', 'no MFA enrollment in WP-01');
  const e = await client.request('GET', `${ALPHA}/export`, { headers: h });
  assert.equal(e.body.error.code, 'FEATURE_DISABLED');
});

test('Q07 Step-up check never precedes authorization: foreign principal gets the neutral denial', async (t) => {
  const { srv, client } = await startServer(t);
  const b = srv.control.issueFreshSession('user_demo_b');
  const r = await client.request('DELETE', ALPHA, { headers: browserHeaders({ cookie: b.cookieValue, csrf: b.csrfToken }) });
  assert.equal(r.status, 403);
  assert.equal(r.body.error.code, 'NOT_AVAILABLE');
});

test('Q07 frozen UI untouched: the package ships no UI, login page or HTML', async () => {
  const fs = await import('node:fs');
  const walk = (u, out = []) => {
    for (const e of fs.readdirSync(u, { withFileTypes: true })) {
      const c = new URL(e.name + (e.isDirectory() ? '/' : ''), u);
      if (e.isDirectory()) walk(c, out); else out.push(c.pathname);
    }
    return out;
  };
  const files = walk(new URL('../', import.meta.url));
  assert.equal(files.filter((p) => /\.(html?|css|jsx|tsx|vue|svelte)$/i.test(p)).length, 0);
});

test('zz request tally for this file stays within the WP-01 5000-request cap', (t) => {
  const n = requestTally();
  t.diagnostic(`WP01_LOCAL_REQUESTS file=scope-workspace n=${n}`);
  assert.ok(n <= 5000);
});
