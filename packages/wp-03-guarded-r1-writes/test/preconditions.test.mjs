// Q3-05: exact strong If-Match preconditions, 428/400/412 classes, two-client CAS with distinct
// Sessions of the same owner committing exactly once, independent resource revisions and
// Session/authorization revalidation at the synchronous commit boundary.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  startServer, requestTally, projectPatchBody, importantBody, readingStatusBody,
  PROJECT_PATH, IMPORTANT_PATH, READING_STATUS_PATH, XFAKE001, OWNER_SCOPE,
} from '../support/harness.mjs';
import { ACTION } from '../src/contract.mjs';

const ALPHA = 'project_synth_alpha';

function alphaRevision(ctx) { return ctx.srv.control.project(ALPHA).revision; }
function statusRevision(ctx) { return ctx.srv.control.paper([OWNER_SCOPE, ...XFAKE001]).revision; }
function assocRevision(ctx) { return ctx.srv.control.association(ALPHA, [OWNER_SCOPE, ...XFAKE001]).revision; }

test('Q3-05 a stale If-Match is 412 with the authorized current revision and no side effect', async (t) => {
  const ctx = await startServer(t);
  const current = alphaRevision(ctx);
  const digest = ctx.srv.control.stateDigest();
  const body = projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'should not apply' });
  const r = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, { body, ifMatch: '"rev_stale_aaaaaaaa"' });
  assert.equal(r.status, 412);
  assert.equal(r.body.error.code, 'PRECONDITION_FAILED');
  assert.equal(r.body.outcome, 'CONFLICT');
  assert.equal(r.body.dispatched, false);
  assert.equal(r.body.saved, false);
  assert.equal(r.body.currentRevision, current);
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q3-05 missing If-Match is 428 and malformed/weak/multiple/wildcard forms are 400 before dispatch', async (t) => {
  const ctx = await startServer(t);
  const current = alphaRevision(ctx);
  const body = projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'nope' });
  const digest = ctx.srv.control.stateDigest();
  const missing = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, { body });
  assert.equal(missing.status, 428);
  assert.equal(missing.body.error.code, 'PRECONDITION_REQUIRED');
  assert.equal(missing.body.outcome, 'CONFLICT');
  assert.equal(missing.body.dispatched, false);
  const malformed = ['*', 'W/"' + current + '"', 'rev-unquoted', '""', '"a', `"${'a'.repeat(129)}"`, '"a"b"', `"${current}", "${current}"`];
  for (const value of malformed) {
    const r = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, { body, ifMatch: value });
    assert.equal(r.status, 400, value.slice(0, 40));
    assert.equal(r.body.error.code, 'INVALID_PRECONDITION');
    assert.equal(r.body.dispatched, false);
  }
  const unexpected = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, {
    body, ifMatch: `"${current}"`, extraHeaders: { 'If-None-Match': '*' },
  });
  assert.equal(unexpected.status, 400);
  assert.equal(unexpected.body.error.code, 'UNEXPECTED_CONDITIONAL');
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q3-05 duplicate If-Match header lines are rejected as multiple/wildcard-free opaque tags', async (t) => {
  const ctx = await startServer(t);
  const current = alphaRevision(ctx);
  const digest = ctx.srv.control.stateDigest();
  const body = JSON.stringify(projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'dup' }));
  const text = [
    `PATCH /api/v1/projects/${ALPHA} HTTP/1.1`,
    'Host: 127.0.0.1',
    'Origin: https://app.wp01.invalid',
    'Sec-Fetch-Site: same-site',
    'Content-Type: application/json',
    `Cookie: __Host-lms_session=${ctx.owner.cookieValue}`,
    `X-CSRF-Token: ${ctx.owner.csrfToken}`,
    `If-Match: "${current}"`,
    `If-Match: "${current}"`,
    `Content-Length: ${Buffer.byteLength(body)}`,
    'Connection: close',
    '',
    body,
  ].join('\r\n');
  const raw = (await ctx.rawClient.raw(text)).toString('latin1');
  assert.match(raw, /^HTTP\/1\.1 400 /);
  assert.match(raw, /INVALID_PRECONDITION/);
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q3-05 two independent clients presenting the same revision: exactly one commit, the other 412', async (t) => {
  const ctx = await startServer(t);
  const current = alphaRevision(ctx);
  const a = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, {
    body: projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'Winner A' }), ifMatch: `"${current}"`,
  });
  const b = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.ownerSecond, {
    body: projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'Winner B' }), ifMatch: `"${current}"`,
  });
  const statuses = [a.status, b.status].sort();
  assert.deepEqual(statuses, [200, 412], 'exactly one commit');
  const winner = a.status === 200 ? a : b;
  const loser = a.status === 412 ? a : b;
  assert.equal(loser.body.error.code, 'PRECONDITION_FAILED');
  assert.equal(loser.body.currentRevision, winner.body.revision);
  const project = ctx.srv.control.project(ALPHA);
  assert.equal(project.revision, winner.body.revision);
  assert.equal(project.name, winner.body.resource.name);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.stats().commits, 1);
  assert.equal(ctx.srv.control.ledgerSize(), 1);
});

test('Q3-05 two truly concurrent writers at one revision commit exactly once under overlap', async (t) => {
  const ctx = await startServer(t);
  ctx.srv.control.setGateDelayMs(25);
  const current = alphaRevision(ctx);
  const [a, b] = await Promise.all([
    ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, {
      body: projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'Concurrent A' }), ifMatch: `"${current}"`,
    }),
    ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.ownerSecond, {
      body: projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'Concurrent B' }), ifMatch: `"${current}"`,
    }),
  ]);
  assert.deepEqual([a.status, b.status].sort(), [200, 412]);
  const project = ctx.srv.control.project(ALPHA);
  const winner = a.status === 200 ? a : b;
  assert.equal(project.revision, winner.body.revision);
  assert.equal(project.name, winner.body.resource.name);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.stats().commits, 1);
});

test('Q3-05 resource-specific revisions are independent and not cross-coupled', async (t) => {
  const ctx = await startServer(t);
  const p = alphaRevision(ctx);
  const s = statusRevision(ctx);
  const a = assocRevision(ctx);
  assert.equal(new Set([p, s, a]).size, 3);
  // A Project revision cannot satisfy the global-status precondition.
  const wrongStatus = await ctx.call('PATCH', READING_STATUS_PATH(XFAKE001), ctx.owner, {
    body: readingStatusBody(ctx.runId, 'Read'), ifMatch: `"${p}"`,
  });
  assert.equal(wrongStatus.status, 412);
  assert.equal(wrongStatus.body.currentRevision, s);
  // A ReadingStatus revision cannot satisfy the association precondition.
  const wrongAssoc = await ctx.call('PATCH', IMPORTANT_PATH(ALPHA, XFAKE001), ctx.owner, {
    body: importantBody(ctx.runId, false), ifMatch: `"${s}"`,
  });
  assert.equal(wrongAssoc.status, 412);
  assert.equal(wrongAssoc.body.currentRevision, a);
  // An Important revision cannot satisfy the Project precondition.
  const wrongProject = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, {
    body: projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'nope' }), ifMatch: `"${a}"`,
  });
  assert.equal(wrongProject.status, 412);
  assert.equal(wrongProject.body.currentRevision, p);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  // Changing the global status moves only the status revision.
  const ok = await ctx.call('PATCH', READING_STATUS_PATH(XFAKE001), ctx.owner, {
    body: readingStatusBody(ctx.runId, 'Read'), ifMatch: `"${s}"`,
  });
  assert.equal(ok.status, 200);
  assert.equal(alphaRevision(ctx), p);
  assert.equal(assocRevision(ctx), a);
  assert.notEqual(statusRevision(ctx), s);
});

test('Q3-05 Session revocation is revalidated at the commit boundary: 401, no dispatch, no ledger entry', async (t) => {
  const ctx = await startServer(t);
  const current = alphaRevision(ctx);
  const body = projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'revoked at commit' });
  ctx.srv.control.beforeCommit(() => ctx.srv.control.revokeByCookie(ctx.owner.cookieValue));
  const r = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, { body, ifMatch: `"${current}"` });
  assert.equal(r.status, 401);
  assert.equal(r.body.error.code, 'SESSION_REVOKED');
  assert.equal(r.body.dispatched, false);
  assert.equal(ctx.srv.control.project(ALPHA).revision, current);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
  // The same operation is safely retried from a valid second Session (nothing was dispatched).
  const retry = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.ownerSecond, { body, ifMatch: `"${current}"` });
  assert.equal(retry.status, 200);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.ledgerSize(), 1);
});

test('Q3-05 Session expiry is revalidated at the commit boundary: 401 SESSION_EXPIRED, no dispatch', async (t) => {
  const ctx = await startServer(t);
  const current = alphaRevision(ctx);
  ctx.srv.control.beforeCommit(() => ctx.srv.control.advanceClock(2 * 3600 * 1000));
  const r = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, {
    body: projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'expired at commit' }), ifMatch: `"${current}"`,
  });
  assert.equal(r.status, 401);
  assert.equal(r.body.error.code, 'SESSION_EXPIRED');
  assert.equal(ctx.srv.control.project(ALPHA).revision, current);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
});

test('zz request tally for this file stays within the 5000-request per-instance budget', (t) => {
  const n = requestTally();
  t.diagnostic(`WP03_LOCAL_REQUESTS file=preconditions n=${n}`);
  assert.ok(n <= 5000);
});
