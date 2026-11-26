// Q3-06: operation identity — exact replay never re-dispatches, changed fingerprint under one
// operationId is rejected, concurrent same-key operations dispatch once, cross-principal reuse stays
// neutral, old runIds/revisions die with the instance, and case-fold identity never matches.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  startServer, requestTally, projectPatchBody, readingStatusBody, createBody,
  PROJECT_PATH, READING_STATUS_PATH, XFAKE001, OWNER_SCOPE,
} from '../support/harness.mjs';
import { ACTION, SCOPE } from '../src/contract.mjs';

const ALPHA = 'project_synth_alpha';
const BETA = 'project_synth_beta';

function alphaRevision(ctx) { return ctx.srv.control.project(ALPHA).revision; }
function statusRevision(ctx) { return ctx.srv.control.paper([OWNER_SCOPE, ...XFAKE001]).revision; }

test('Q3-06 an exact replay of a confirmed operation never re-dispatches and keeps the original revision', async (t) => {
  const ctx = await startServer(t);
  const revision = alphaRevision(ctx);
  const body = projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'Replay target' });
  const first = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, { body, ifMatch: `"${revision}"` });
  assert.equal(first.status, 200);
  const stateAfterFirst = ctx.srv.control.stateDigest();
  const replay = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, { body, ifMatch: `"${revision}"` });
  assert.equal(replay.status, 200);
  assert.equal(replay.body.replayed, true);
  assert.equal(replay.body.dispatched, false);
  assert.equal(replay.body.saved, false);
  assert.equal(replay.body.durable, false);
  assert.equal(replay.body.outcome, 'CONFIRMED');
  assert.equal(replay.body.outcomeBasis, 'MODEL_ONLY');
  assert.equal(replay.body.operationId, body.operationId);
  assert.equal(replay.body.revision, first.body.revision, 'original simulated revision, not current state claim');
  assert.deepEqual(replay.body.resource, first.body.resource);
  assert.equal(ctx.srv.control.stateDigest(), stateAfterFirst);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.stats().commits, 1);
  assert.equal(ctx.srv.control.ledgerSize(), 1);
  const record = ctx.srv.control.snapshot().ledger[0];
  assert.equal(record.operationId, body.operationId);
  assert.equal(record.runId, ctx.runId);
  assert.equal(record.route, 'project');
  assert.equal(record.action, ACTION.RENAME);
  assert.equal(record.scope, SCOPE.PROJECT);
  assert.equal(record.targetKey, `project:${ALPHA}`);
  assert.equal(record.precondition, `"${revision}"`);
  assert.equal(record.outcome, 'CONFIRMED');
  assert.equal(record.committed, true);
  assert.match(record.fingerprint, /^[0-9a-f]{64}$/);
});

test('Q3-06 replay cannot bypass a revoked Session or re-dispatch after revocation', async (t) => {
  const ctx = await startServer(t);
  const revision = alphaRevision(ctx);
  const body = projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'Revoked replay' });
  const first = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, { body, ifMatch: `"${revision}"` });
  assert.equal(first.status, 200);
  const stateAfterFirst = ctx.srv.control.stateDigest();
  ctx.srv.control.revokeByCookie(ctx.owner.cookieValue);
  const replay = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, { body, ifMatch: `"${revision}"` });
  assert.equal(replay.status, 401);
  assert.equal(replay.body.error.code, 'SESSION_REVOKED');
  assert.equal(replay.body.dispatched, false);
  assert.equal(ctx.srv.control.stateDigest(), stateAfterFirst);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.ledgerSize(), 1);
  assert.equal(ctx.srv.control.project(ALPHA).name, 'Revoked replay');
});

test('Q3-06 an exact replay of an UNKNOWN operation stays UNKNOWN, does not dispatch and does not un-quarantine', async (t) => {
  const ctx = await startServer(t);
  const revision = alphaRevision(ctx);
  const body = projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'Unknown target' });
  ctx.srv.control.setNextFault('accepted_not_committed');
  const first = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, { body, ifMatch: `"${revision}"` });
  assert.equal(first.status, 202);
  assert.equal(first.body.outcome, 'UNKNOWN');
  assert.equal(first.body.saved, false);
  const replay = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, { body, ifMatch: `"${revision}"` });
  assert.equal(replay.status, 200);
  assert.equal(replay.body.replayed, true);
  assert.equal(replay.body.dispatched, false);
  assert.equal(replay.body.outcome, 'UNKNOWN');
  assert.equal(replay.body.saved, false);
  assert.equal(replay.body.durable, false);
  assert.ok(!('revision' in replay.body));
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.ledgerSize(), 1);
  assert.equal(ctx.srv.control.quarantine().length, 1);
  assert.equal(ctx.srv.control.project(ALPHA).name, 'Alpha 综述');
});

test('Q3-06 the same operationId with a changed action/target/scope/value/precondition/name is 409 OPERATION_ID_REUSE with no dispatch', async (t) => {
  const ctx = await startServer(t);

  const rename = projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'Original' });
  assert.equal((await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, { body: rename, ifMatch: `"${alphaRevision(ctx)}"` })).status, 200);
  const stateAfterRename = ctx.srv.control.stateDigest();
  const betaRevision = ctx.srv.control.project(BETA).revision;

  const changed = [
    ['action', { ...rename, action: ACTION.ARCHIVE }],
    ['name', { ...rename, name: 'Changed' }],
    ['scope', { ...rename, scope: SCOPE.GLOBAL_PAPER }],
  ];
  for (const [label, body] of changed) {
    const r = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, { body, ifMatch: `"${stateAfterRename}"` });
    assert.equal(r.status, 409, label);
    assert.equal(r.body.error.code, 'OPERATION_ID_REUSE', label);
    assert.equal(r.body.outcome, 'CONFLICT');
    assert.equal(r.body.dispatched, false);
  }
  const changedTarget = await ctx.call('PATCH', PROJECT_PATH(BETA), ctx.owner, {
    body: rename, ifMatch: `"${betaRevision}"`,
  });
  assert.equal(changedTarget.status, 409);
  assert.equal(changedTarget.body.error.code, 'OPERATION_ID_REUSE');
  const changedPrecondition = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, {
    body: rename, ifMatch: `"${stateAfterRename}"`, // a different, syntactically valid tag
  });
  assert.equal(changedPrecondition.status, 409);
  assert.equal(changedPrecondition.body.error.code, 'OPERATION_ID_REUSE');
  assert.equal(ctx.srv.control.stateDigest(), stateAfterRename);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.ledgerSize(), 1);
});

test('Q3-06 changed value under the same operationId is reuse; exact value replay is stable', async (t) => {
  const ctx = await startServer(t);
  const revision = statusRevision(ctx);
  const body = readingStatusBody(ctx.runId, 'Reading');
  const first = await ctx.call('PATCH', READING_STATUS_PATH(XFAKE001), ctx.owner, { body, ifMatch: `"${revision}"` });
  assert.equal(first.status, 200);
  const changed = await ctx.call('PATCH', READING_STATUS_PATH(XFAKE001), ctx.owner, {
    body: { ...body, value: 'Read' }, ifMatch: `"${first.body.revision}"`,
  });
  assert.equal(changed.status, 409);
  assert.equal(changed.body.error.code, 'OPERATION_ID_REUSE');
  const replay = await ctx.call('PATCH', READING_STATUS_PATH(XFAKE001), ctx.owner, { body, ifMatch: `"${revision}"` });
  assert.equal(replay.status, 200);
  assert.equal(replay.body.replayed, true);
  assert.equal(ctx.srv.control.paper([OWNER_SCOPE, ...XFAKE001]).readingStatus, 'Reading');
  assert.equal(ctx.srv.control.stats().dispatches, 1);
});

test('Q3-06 changed create payload under the same operationId is 409 and never creates a second Project', async (t) => {
  const ctx = await startServer(t);
  const body = createBody(ctx.runId, 'project_synth_delta', 'Delta');
  const first = await ctx.call('POST', '/api/v1/projects', ctx.owner, { body, ifNoneMatch: '*' });
  assert.equal(first.status, 201);
  const changed = await ctx.call('POST', '/api/v1/projects', ctx.owner, {
    body: { ...body, projectId: 'project_synth_epsilon' }, ifNoneMatch: '*',
  });
  assert.equal(changed.status, 409);
  assert.equal(changed.body.error.code, 'OPERATION_ID_REUSE');
  assert.equal(ctx.srv.control.snapshot().counts.projects, 5);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
});

test('Q3-06 two concurrent identical operations with one operationId dispatch exactly once', async (t) => {
  const ctx = await startServer(t);
  ctx.srv.control.setGateDelayMs(25);
  const revision = alphaRevision(ctx);
  const body = projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'Concurrent key' });
  const [a, b] = await Promise.all([
    ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, { body, ifMatch: `"${revision}"` }),
    ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.ownerSecond, { body, ifMatch: `"${revision}"` }),
  ]);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.stats().commits, 1);
  assert.equal(ctx.srv.control.ledgerSize(), 1);
  const dispatched = [a, b].filter((r) => r.body.dispatched === true);
  const replay = [a, b].filter((r) => r.body.replayed === true);
  assert.equal(dispatched.length, 1);
  assert.equal(replay.length, 1);
  assert.equal(replay[0].body.saved, false);
  assert.equal(ctx.srv.control.project(ALPHA).name, 'Concurrent key');
});

test('Q3-06 cross-principal operationId reuse is denied neutrally without ledger disclosure', async (t) => {
  const ctx = await startServer(t);
  const revision = alphaRevision(ctx);
  const body = projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'Owner operation' });
  assert.equal((await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, { body, ifMatch: `"${revision}"` })).status, 200);
  const foreignWithUsedId = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.foreign, {
    body: projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'Foreign attempt' }), ifMatch: `"${revision}"`,
  });
  const foreignWithFreshId = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.foreign, {
    body: projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'Foreign attempt' }), ifMatch: `"${revision}"`,
  });
  assert.equal(foreignWithUsedId.status, 403);
  assert.equal(foreignWithUsedId.body.error.code, 'NOT_AVAILABLE');
  assert.deepEqual(foreignWithUsedId.body, foreignWithFreshId.body);
  assert.equal(foreignWithUsedId.headers['content-length'], foreignWithFreshId.headers['content-length']);
  const text = JSON.stringify(foreignWithUsedId.body);
  for (const needle of ['operationId', 'replayed', 'CONFIRMED', 'revision', 'currentRevision']) {
    assert.ok(!text.includes(needle), `leaked ${needle}`);
  }
  assert.equal(ctx.srv.control.ledgerSize(), 1);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
});

test('Q3-06 old-runId replay is rejected on a fresh instance before any dispatch (update and create)', async (t) => {
  const first = await startServer(t);
  const firstRevision = first.srv.control.project(ALPHA).revision;
  const body = projectPatchBody(first.runId, ACTION.RENAME, { name: 'first instance' });
  assert.equal((await first.call('PATCH', PROJECT_PATH(ALPHA), first.owner, { body, ifMatch: `"${firstRevision}"` })).status, 200);
  const oldRunId = first.runId;

  const second = await startServer(t);
  assert.notEqual(second.runId, oldRunId);
  const digest = second.srv.control.stateDigest();
  const staleUpdate = await second.call('PATCH', PROJECT_PATH(ALPHA), second.owner, {
    body: projectPatchBody(oldRunId, ACTION.RENAME, { name: 'old run' }),
    ifMatch: `"${second.srv.control.project(ALPHA).revision}"`,
  });
  assert.equal(staleUpdate.status, 409);
  assert.equal(staleUpdate.body.error.code, 'STALE_MODEL_RUN');
  assert.equal(staleUpdate.body.dispatched, false);
  const staleCreate = await second.call('POST', '/api/v1/projects', second.owner, {
    body: createBody(oldRunId, 'project_synth_delta', 'old run create'), ifNoneMatch: '*',
  });
  assert.equal(staleCreate.status, 409);
  assert.equal(staleCreate.body.error.code, 'STALE_MODEL_RUN');
  const staleRevision = await second.call('PATCH', PROJECT_PATH(ALPHA), second.owner, {
    body: projectPatchBody(second.runId, ACTION.RENAME, { name: 'old revision' }), ifMatch: `"${firstRevision}"`,
  });
  assert.equal(staleRevision.status, 412);
  assert.equal(staleRevision.body.error.code, 'PRECONDITION_FAILED');
  assert.equal(second.srv.control.stateDigest(), digest);
  assert.equal(second.srv.control.stats().dispatches, 0);
  assert.equal(second.srv.control.ledgerSize(), 0);
  assert.equal(second.srv.control.snapshot().counts.projects, 4);
});

test('Q3-06 case-fold identity is never accepted as the same resource (named case-fold assertion)', async (t) => {
  const ctx = await startServer(t);
  const digest = ctx.srv.control.stateDigest();
  const cases = [
    [['user', 'fakeLib01', 'xfake001'], 403, 'NOT_AVAILABLE'],
    [['user', 'FakeLib01', 'XFAKE001'], 403, 'NOT_AVAILABLE'],
    [['USER', 'fakeLib01', 'XFAKE001'], 400, 'INVALID_RESOURCE_ID'],
  ];
  for (const [tuple, status, code] of cases) {
    const r = await ctx.call('PATCH', READING_STATUS_PATH(tuple), ctx.owner, {
      body: readingStatusBody(ctx.runId, 'Read'), ifMatch: `"${statusRevision(ctx)}"`,
    });
    assert.equal(r.status, status, tuple.join('/'));
    assert.equal(r.body.error.code, code);
  }
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.paper([OWNER_SCOPE, ...XFAKE001]).readingStatus, 'Reading');
});
