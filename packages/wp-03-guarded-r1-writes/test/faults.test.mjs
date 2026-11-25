// Q3-07: the A5 outcome matrix. Model acknowledgement, stale/authorized conflict, injected
// pre-dispatch refusal, 202 not-committed, 504 lost-ack-after-commit, a REAL socket drop after the
// model commit, quarantine of an unresolved target, and a conservative UNKNOWN for response-size
// and unexpected post-dispatch failures — never a fabricated DEFINITE_FAILURE or saved:true.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  startServer, requestTally, projectPatchBody, readingStatusBody, settle,
  PROJECT_PATH, READING_STATUS_PATH, PROJECT_PAPERS_PATH, XFAKE001, OWNER_SCOPE,
} from '../support/harness.mjs';
import { ACTION, SCOPE } from '../src/contract.mjs';

const ALPHA = 'project_synth_alpha';
const GAMMA = 'project_synth_gamma';

function alphaRevision(ctx) { return ctx.srv.control.project(ALPHA).revision; }
function gammaRevision(ctx) { return ctx.srv.control.project(GAMMA).revision; }

async function rename(ctx, projectId, name, revision, operationId) {
  const body = projectPatchBody(ctx.runId, ACTION.RENAME, { name }, operationId);
  return ctx.call('PATCH', PROJECT_PATH(projectId), ctx.ownerSecond, { body, ifMatch: `"${revision}"` });
}

test('Q3-07 model acknowledgement is CONFIRMED with MODEL_ONLY basis, saved:false, durable:false and a real new revision', async (t) => {
  const ctx = await startServer(t);
  const revision = alphaRevision(ctx);
  const r = await rename(ctx, ALPHA, 'Acknowledged', revision);
  assert.equal(r.status, 200);
  assert.equal(r.body.outcome, 'CONFIRMED');
  assert.equal(r.body.outcomeBasis, 'MODEL_ONLY');
  assert.equal(r.body.saved, false);
  assert.equal(r.body.durable, false);
  assert.equal(r.body.simulated, true);
  assert.equal(r.body.dispatched, true);
  assert.notEqual(r.body.revision, revision);
  const readBack = await ctx.get(PROJECT_PAPERS_PATH(ALPHA), ctx.owner);
  assert.equal(readBack.body.project.name, 'Acknowledged');
  assert.equal(readBack.body.project.revision, r.body.revision);
  const ledger = ctx.srv.control.snapshot().ledger;
  assert.equal(ledger.length, 1);
  assert.equal(ledger[0].outcome, 'CONFIRMED');
  assert.equal(ledger[0].committed, true);
});

test('Q3-07 a stale conditional is a CONFLICT with dispatched:false, never a fabricated dispatch', async (t) => {
  const ctx = await startServer(t);
  const r = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, {
    body: projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'nope' }), ifMatch: '"rev_stale_00000000"',
  });
  assert.equal(r.status, 412);
  assert.equal(r.body.outcome, 'CONFLICT');
  assert.equal(r.body.dispatched, false);
  assert.equal(r.body.saved, false);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
});

test('Q3-07 an injected pre-dispatch refusal changes nothing and leaves the target usable', async (t) => {
  const ctx = await startServer(t);
  const revision = alphaRevision(ctx);
  const digest = ctx.srv.control.stateDigest();
  ctx.srv.control.setNextFault('not_dispatched');
  const refused = await rename(ctx, ALPHA, 'Refused', revision);
  assert.equal(refused.status, 403);
  assert.equal(refused.body.error.code, 'MODEL_REJECTED');
  assert.equal(refused.body.outcome, 'DEFINITE_FAILURE');
  assert.equal(refused.body.dispatched, false);
  assert.equal(refused.body.saved, false);
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
  assert.equal(ctx.srv.control.quarantine().length, 0);
  const retry = await rename(ctx, ALPHA, 'Refused', revision);
  assert.equal(retry.status, 200);
  assert.equal(retry.body.outcome, 'CONFIRMED');
  assert.equal(ctx.srv.control.stats().dispatches, 1);
});

test('Q3-07 202 accepted-not-committed stays UNKNOWN: no state change, no saved flag, target quarantined', async (t) => {
  const ctx = await startServer(t);
  const revision = alphaRevision(ctx);
  const digest = ctx.srv.control.stateDigest();
  const body = projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'Not committed' });
  ctx.srv.control.setNextFault('accepted_not_committed');
  const r = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.ownerSecond, { body, ifMatch: `"${revision}"` });
  assert.equal(r.status, 202);
  assert.equal(r.body.outcome, 'UNKNOWN');
  assert.equal(r.body.dispatched, true);
  assert.equal(r.body.saved, false);
  assert.equal(r.body.durable, false);
  assert.ok(!('revision' in r.body));
  assert.ok(!('resource' in r.body));
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.project(ALPHA).name, 'Alpha 综述');
  assert.equal(ctx.srv.control.ledgerSize(), 1);
  const record = ctx.srv.control.snapshot().ledger[0];
  assert.equal(record.outcome, 'UNKNOWN');
  assert.equal(record.committed, false);
  assert.equal(ctx.srv.control.quarantine().length, 1);
  assert.equal(ctx.srv.control.stats().commits, 0);
});

test('Q3-07 504 lost-ack-after-commit stays UNKNOWN while the model state IS committed and readable', async (t) => {
  const ctx = await startServer(t);
  const revision = alphaRevision(ctx);
  const body = projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'Committed despite 504' });
  ctx.srv.control.setNextFault('lost_ack_after_commit');
  const r = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.ownerSecond, { body, ifMatch: `"${revision}"` });
  assert.equal(r.status, 504);
  assert.equal(r.body.outcome, 'UNKNOWN');
  assert.equal(r.body.dispatched, true);
  assert.equal(r.body.saved, false);
  assert.equal(r.body.durable, false);
  assert.ok(!('revision' in r.body));
  // Authorized reads confirm the actual simulated model state; the client stays UNKNOWN.
  const readBack = await ctx.get(PROJECT_PAPERS_PATH(ALPHA), ctx.owner);
  assert.equal(readBack.body.project.name, 'Committed despite 504');
  assert.notEqual(readBack.body.project.revision, revision);
  const record = ctx.srv.control.snapshot().ledger[0];
  assert.equal(record.outcome, 'UNKNOWN');
  assert.equal(record.committed, true);
  assert.match(record.revision, /^rev_/);
  assert.equal(ctx.srv.control.quarantine().length, 1);
  assert.equal(ctx.srv.control.stats().commits, 1);
});

test('Q3-07 a real socket drop after the model commit leaves the client UNKNOWN and the state committed', async (t) => {
  const ctx = await startServer(t);
  const revision = alphaRevision(ctx);
  const body = projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'Dropped after commit' });
  ctx.srv.control.setNextFault('socket_drop_after_commit');
  const outcome = await settle(ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.ownerSecond, { body, ifMatch: `"${revision}"` }));
  assert.equal(outcome.ok, false, 'the client must observe a transport failure, not a fabricated response');
  assert.ok(outcome.error && ['ECONNRESET', 'ECONNABORTED', 'EPIPE'].includes(outcome.error.code), String(outcome.error && outcome.error.code));
  // No response was fabricated for the dropped connection.
  assert.equal(ctx.srv.control.project(ALPHA).name, 'Dropped after commit');
  assert.equal(ctx.srv.control.ledgerSize(), 1);
  const record = ctx.srv.control.snapshot().ledger[0];
  assert.equal(record.outcome, 'UNKNOWN');
  assert.equal(record.committed, true);
  assert.equal(record.httpStatus, 0);
  assert.equal(ctx.srv.control.quarantine().length, 1);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.stats().commits, 1);
  const log = ctx.srv.logs.find((e) => e.code === 'CONNECTION_DROPPED_AFTER_COMMIT');
  assert.ok(log, 'the drop is recorded as a sanitized log entry');
  assert.deepEqual(Object.keys(log).sort(), ['code', 'method', 'route', 'status', 't']);
});

test('Q3-07 an unexpected post-dispatch error is conservative UNKNOWN, never a definite failure', async (t) => {
  const ctx = await startServer(t);
  const revision = alphaRevision(ctx);
  const body = projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'Post dispatch error' });
  ctx.srv.control.setNextFault('error_after_dispatch');
  const r = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.ownerSecond, { body, ifMatch: `"${revision}"` });
  assert.equal(r.status, 500);
  assert.equal(r.body.outcome, 'UNKNOWN');
  assert.notEqual(r.body.outcome, 'DEFINITE_FAILURE');
  assert.equal(r.body.dispatched, true);
  assert.equal(r.body.saved, false);
  assert.ok(!('revision' in r.body));
  assert.equal(ctx.srv.control.project(ALPHA).name, 'Post dispatch error');
  assert.equal(ctx.srv.control.quarantine().length, 1);
  assert.equal(ctx.srv.control.stats().commits, 1);
});

test('Q3-07 an unresolved-UNKNOWN target is blocked for new operations while unrelated targets still work', async (t) => {
  const ctx = await startServer(t);
  const revision = alphaRevision(ctx);
  const unknown = projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'Unresolved' });
  ctx.srv.control.setNextFault('accepted_not_committed');
  assert.equal((await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.ownerSecond, { body: unknown, ifMatch: `"${revision}"` })).status, 202);
  const dispatches = ctx.srv.control.stats().dispatches;
  const ledger = ctx.srv.control.ledgerSize();
  // A NEW operation on the unresolved target is refused.
  const blocked = await rename(ctx, ALPHA, 'Second attempt', revision);
  assert.equal(blocked.status, 409);
  assert.equal(blocked.body.error.code, 'TARGET_QUARANTINED');
  assert.equal(blocked.body.dispatched, false);
  // The SAME operation is a replay, not a second dispatch.
  const replay = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.ownerSecond, { body: unknown, ifMatch: `"${revision}"` });
  assert.equal(replay.status, 200);
  assert.equal(replay.body.replayed, true);
  assert.equal(replay.body.dispatched, false);
  assert.equal(replay.body.outcome, 'UNKNOWN');
  // Unrelated targets operate normally: another Project, the global paper, another association.
  assert.equal((await rename(ctx, GAMMA, 'Gamma still works', gammaRevision(ctx))).status, 200);
  const paperRevision = ctx.srv.control.paper([OWNER_SCOPE, ...XFAKE001]).revision;
  const status = await ctx.call('PATCH', READING_STATUS_PATH(XFAKE001), ctx.ownerSecond, {
    body: readingStatusBody(ctx.runId, 'Read'), ifMatch: `"${paperRevision}"`,
  });
  assert.equal(status.status, 200);
  assert.equal(ctx.srv.control.project(ALPHA).name, 'Alpha 综述', 'quarantined target never changed');
  assert.equal(ctx.srv.control.stats().dispatches, dispatches + 2);
  assert.equal(ctx.srv.control.ledgerSize(), ledger + 2);
});

test('Q3-07 an oversized confirmed response degrades to conservative UNKNOWN after the commit', async (t) => {
  const ctx = await startServer(t, { server: { responseBudgetBytes: 256 } });
  const revision = alphaRevision(ctx);
  const body = projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'Too large to confirm' });
  const r = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.ownerSecond, { body, ifMatch: `"${revision}"` });
  assert.equal(r.status, 500);
  assert.equal(r.body.outcome, 'UNKNOWN');
  assert.equal(r.body.error.code, 'RESPONSE_LIMIT');
  assert.equal(r.body.saved, false);
  assert.equal(r.body.durable, false);
  assert.ok(!('revision' in r.body));
  // The model did commit; the client is told nothing definite.
  assert.equal(ctx.srv.control.project(ALPHA).name, 'Too large to confirm');
  assert.equal(ctx.srv.control.stats().commits, 1);
  const record = ctx.srv.control.snapshot().ledger[0];
  assert.equal(record.outcome, 'UNKNOWN');
  assert.equal(record.committed, true);
  assert.equal(ctx.srv.control.quarantine().length, 1);
  // A subsequent new operation on the unresolved target is refused without another dispatch.
  const blocked = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.ownerSecond, {
    body: projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'blocked' }), ifMatch: `"${revision}"`,
  });
  assert.equal(blocked.status, 409);
  assert.equal(blocked.body.error.code, 'TARGET_QUARANTINED');
});

test('Q3-07 no successful path ever reports saved:true or durable:true', async (t) => {
  const ctx = await startServer(t);
  const health = await ctx.get('/api/v1/health');
  assert.equal(health.body.durable, false);
  assert.equal(health.body.storage, 'MEMORY_ONLY');
  assert.equal(health.body.productionSuitable, false);
  const revision = alphaRevision(ctx);
  const body = projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'No durable save' });
  const confirmed = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.ownerSecond, { body, ifMatch: `"${revision}"` });
  assert.equal(confirmed.body.saved, false);
  assert.equal(confirmed.body.durable, false);
  const replay = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.ownerSecond, { body, ifMatch: `"${revision}"` });
  assert.equal(replay.body.replayed, true);
  assert.equal(replay.body.saved, false);
  assert.equal(replay.body.durable, false);
  const conflict = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.ownerSecond, {
    body: projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'stale' }), ifMatch: '"rev_stale_00000000"',
  });
  assert.equal(conflict.status, 412);
  assert.equal(conflict.body.saved, false);
  assert.equal(conflict.body.durable, false);
  assert.equal(conflict.body.outcome, 'CONFLICT');
});

test('zz request tally for this file stays within the 5000-request per-instance budget', (t) => {
  const n = requestTally();
  t.diagnostic(`WP03_LOCAL_REQUESTS file=faults n=${n}`);
  assert.ok(n <= 5000);
});
