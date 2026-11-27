// Q4-07: the A5 outcome matrix for one whole-note write. Model acknowledgement, conflict, injected
// pre-dispatch refusal, 202 accepted-not-committed UNKNOWN, 504 lost-ack-after-commit UNKNOWN, a REAL
// socket drop after the model commit, UNKNOWN quarantine resolved by an authorized read, and a
// conservative UNKNOWN for response-size and unexpected post-dispatch failures — never a fabricated
// DEFINITE_FAILURE, saved:true or durable:true.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  startServer, requestTally, noteBody, fieldsWith, settle, RESEARCH_NOTE_PATH,
  XFAKE001, XFAKE002, OWNER_SCOPE,
} from '../support/harness.mjs';

function revisionOf(ctx) { return ctx.srv.control.note([OWNER_SCOPE, ...XFAKE001]).revision; }

function update(ctx, fields, ifMatch, operationId, creds) {
  return ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), creds || ctx.ownerSecond, {
    body: noteBody(ctx.runId, fields, operationId),
    ifMatch: ifMatch === undefined ? `"${revisionOf(ctx)}"` : ifMatch,
  });
}

function create(ctx, tuple, fields, operationId, creds) {
  return ctx.call('PUT', RESEARCH_NOTE_PATH(tuple), creds || ctx.ownerSecond, {
    body: noteBody(ctx.runId, fields, operationId), ifNoneMatch: '*',
  });
}

test('Q4-07 model acknowledgement is CONFIRMED with MODEL_ONLY basis, saved:false, durable:false and a real new revision', async (t) => {
  const ctx = await startServer(t);
  const revision = revisionOf(ctx);
  const r = await update(ctx, fieldsWith({ researchQuestion: 'acknowledged' }), `"${revision}"`, 'op_fault_ack_0000001');
  assert.equal(r.status, 200);
  assert.equal(r.body.outcome, 'CONFIRMED');
  assert.equal(r.body.outcomeBasis, 'MODEL_ONLY');
  assert.equal(r.body.saved, false);
  assert.equal(r.body.durable, false);
  assert.equal(r.body.simulated, true);
  assert.equal(r.body.dispatched, true);
  assert.notEqual(r.body.revision, revision);
  const readBack = await ctx.get(RESEARCH_NOTE_PATH(XFAKE001), ctx.owner);
  assert.deepEqual(readBack.body.fields, r.body.note.fields);
  assert.equal(readBack.body.revision, r.body.revision);
  const ledger = ctx.srv.control.snapshot().ledger;
  assert.equal(ledger.length, 1);
  assert.equal(ledger[0].outcome, 'CONFIRMED');
  assert.equal(ledger[0].committed, true);
});

test('Q4-07 a conflict (stale 412 / missing 428) is reported with dispatched:false and never fabricates a dispatch', async (t) => {
  const ctx = await startServer(t);
  const stale = await update(ctx, fieldsWith({ researchQuestion: 'stale' }), '"rev_stale_00000000"', 'op_fault_stale_00001');
  assert.equal(stale.status, 412);
  assert.equal(stale.body.outcome, 'CONFLICT');
  assert.equal(stale.body.dispatched, false);
  assert.equal(stale.body.saved, false);
  const missing = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, {
    body: noteBody(ctx.runId, fieldsWith({ researchQuestion: 'missing' }), 'op_fault_missing_0001'),
  });
  assert.equal(missing.status, 428);
  assert.equal(missing.body.outcome, 'CONFLICT');
  assert.equal(missing.body.dispatched, false);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
});

test('Q4-07 an injected pre-dispatch refusal changes nothing and leaves the target usable', async (t) => {
  const ctx = await startServer(t);
  const digest = ctx.srv.control.stateDigest();
  ctx.srv.control.setNextFault('not_dispatched');
  const refused = await create(ctx, XFAKE002, fieldsWith({ researchQuestion: 'refused' }), 'op_fault_refused_0001');
  assert.equal(refused.status, 403);
  assert.equal(refused.body.error.code, 'MODEL_REJECTED');
  assert.equal(refused.body.outcome, 'DEFINITE_FAILURE');
  assert.equal(refused.body.dispatched, false);
  assert.equal(refused.body.saved, false);
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
  assert.equal(ctx.srv.control.quarantine().length, 0);
  const retry = await create(ctx, XFAKE002, fieldsWith({ researchQuestion: 'refused' }), 'op_fault_refused_0001');
  assert.equal(retry.status, 201);
  assert.equal(retry.body.outcome, 'CONFIRMED');
  assert.equal(ctx.srv.control.stats().dispatches, 1);
});

test('Q4-07 202 accepted-not-committed stays UNKNOWN: no state change, no saved flag, target quarantined until read', async (t) => {
  const ctx = await startServer(t);
  const digest = ctx.srv.control.stateDigest();
  ctx.srv.control.setNextFault('accepted_not_committed');
  const r = await create(ctx, XFAKE002, fieldsWith({ researchQuestion: 'not committed' }), 'op_fault_202_0000001');
  assert.equal(r.status, 202);
  assert.equal(r.body.outcome, 'UNKNOWN');
  assert.equal(r.body.dispatched, true);
  assert.equal(r.body.saved, false);
  assert.equal(r.body.durable, false);
  assert.ok(!('revision' in r.body));
  assert.ok(!('note' in r.body));
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.note([OWNER_SCOPE, ...XFAKE002]).exists, false);
  assert.equal(ctx.srv.control.ledgerSize(), 1);
  const record = ctx.srv.control.snapshot().ledger[0];
  assert.equal(record.outcome, 'UNKNOWN');
  assert.equal(record.committed, false);
  assert.equal(ctx.srv.control.quarantine().length, 1);
  assert.equal(ctx.srv.control.stats().commits, 0);

  const blocked = await create(ctx, XFAKE002, fieldsWith({ researchQuestion: 'second attempt' }), 'op_fault_202_second1');
  assert.equal(blocked.status, 409);
  assert.equal(blocked.body.error.code, 'TARGET_QUARANTINED');
  assert.equal(blocked.body.dispatched, false);
  assert.equal((await ctx.get(RESEARCH_NOTE_PATH(XFAKE002), ctx.owner)).body.exists, false);
  assert.equal(ctx.srv.control.quarantine().length, 0, 'an authorized read resolves the quarantine');
  assert.equal((await create(ctx, XFAKE002, fieldsWith({ researchQuestion: 'after read' }), 'op_fault_202_third01')).status, 201);
});

test('Q4-07 504 lost-ack-after-commit stays UNKNOWN while the note state IS committed and readable', async (t) => {
  const ctx = await startServer(t);
  const revision = revisionOf(ctx);
  const fields = fieldsWith({ researchQuestion: 'committed despite 504' });
  ctx.srv.control.setNextFault('lost_ack_after_commit');
  const r = await update(ctx, fields, `"${revision}"`, 'op_fault_504_0000001');
  assert.equal(r.status, 504);
  assert.equal(r.body.outcome, 'UNKNOWN');
  assert.equal(r.body.dispatched, true);
  assert.equal(r.body.saved, false);
  assert.equal(r.body.durable, false);
  assert.ok(!('revision' in r.body));
  assert.equal(ctx.srv.control.quarantine().length, 1, 'UNKNOWN target is quarantined before the resolving read');
  const readBack = await ctx.get(RESEARCH_NOTE_PATH(XFAKE001), ctx.owner);
  assert.deepEqual(readBack.body.fields, fields);
  assert.notEqual(readBack.body.revision, revision);
  assert.equal(ctx.srv.control.quarantine().length, 0, 'authorized read resolves the quarantine');
  const record = ctx.srv.control.snapshot().ledger[0];
  assert.equal(record.outcome, 'UNKNOWN');
  assert.equal(record.committed, true);
  assert.match(record.revision, /^rev_/);
  assert.equal(ctx.srv.control.stats().commits, 1);
});

test('Q4-07 a real socket drop after the model commit leaves the client UNKNOWN and the note committed', async (t) => {
  const ctx = await startServer(t);
  const revision = revisionOf(ctx);
  const fields = fieldsWith({ researchQuestion: 'dropped after commit' });
  ctx.srv.control.setNextFault('socket_drop_after_commit');
  const outcome = await settle(update(ctx, fields, `"${revision}"`, 'op_fault_drop_0000001'));
  assert.equal(outcome.ok, false, 'the client must observe a transport failure, not a fabricated response');
  assert.ok(outcome.error && ['ECONNRESET', 'ECONNABORTED', 'EPIPE'].includes(outcome.error.code), String(outcome.error && outcome.error.code));
  assert.deepEqual(ctx.srv.control.note([OWNER_SCOPE, ...XFAKE001]).fields, fields);
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

test('Q4-07 an unexpected post-dispatch error is conservative UNKNOWN, never a definite failure', async (t) => {
  const ctx = await startServer(t);
  const fields = fieldsWith({ researchQuestion: 'post dispatch error' });
  ctx.srv.control.setNextFault('error_after_dispatch');
  const r = await update(ctx, fields, undefined, 'op_fault_error_000001');
  assert.equal(r.status, 500);
  assert.equal(r.body.outcome, 'UNKNOWN');
  assert.notEqual(r.body.outcome, 'DEFINITE_FAILURE');
  assert.equal(r.body.dispatched, true);
  assert.equal(r.body.saved, false);
  assert.ok(!('revision' in r.body));
  assert.deepEqual(ctx.srv.control.note([OWNER_SCOPE, ...XFAKE001]).fields, fields);
  assert.equal(ctx.srv.control.quarantine().length, 1);
  assert.equal(ctx.srv.control.stats().commits, 1);
});

test('Q4-07 an unresolved-UNKNOWN target is blocked for new writes while unrelated notes still work', async (t) => {
  const ctx = await startServer(t);
  const revision = revisionOf(ctx);
  const unknown = noteBody(ctx.runId, fieldsWith({ researchQuestion: 'unresolved' }), 'op_fault_quarantine_01');
  ctx.srv.control.setNextFault('accepted_not_committed');
  assert.equal((await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.ownerSecond, { body: unknown, ifMatch: `"${revision}"` })).status, 202);
  const dispatches = ctx.srv.control.stats().dispatches;
  const ledger = ctx.srv.control.ledgerSize();
  const blocked = await update(ctx, fieldsWith({ researchQuestion: 'second attempt' }), `"${revision}"`, 'op_fault_quarantine_02');
  assert.equal(blocked.status, 409);
  assert.equal(blocked.body.error.code, 'TARGET_QUARANTINED');
  assert.equal(blocked.body.dispatched, false);
  const replay = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.ownerSecond, { body: unknown, ifMatch: `"${revision}"` });
  assert.equal(replay.status, 200);
  assert.equal(replay.body.replayed, true);
  assert.equal(replay.body.outcome, 'UNKNOWN');
  // Unrelated notes are unaffected.
  assert.equal((await create(ctx, XFAKE002, fieldsWith({ researchQuestion: 'unrelated' }), 'op_fault_unrelated_001')).status, 201);
  assert.equal(ctx.srv.control.stats().dispatches, dispatches + 1);
  assert.equal(ctx.srv.control.ledgerSize(), ledger + 1);
  assert.equal(ctx.srv.control.note([OWNER_SCOPE, ...XFAKE001]).revision, revision, 'quarantined target never changed');
  // The authorized read resolves the target and a new write then succeeds at the same revision.
  assert.equal((await ctx.get(RESEARCH_NOTE_PATH(XFAKE001), ctx.owner)).status, 200);
  const afterRead = await update(ctx, fieldsWith({ researchQuestion: 'after resolve' }), `"${revision}"`, 'op_fault_quarantine_03');
  assert.equal(afterRead.status, 200);
});

test('Q4-07 an oversized confirmed response degrades to conservative UNKNOWN after the commit', async (t) => {
  const ctx = await startServer(t, { server: { responseBudgetBytes: 256 } });
  const r = await create(ctx, XFAKE002, fieldsWith({ researchQuestion: 'too large to confirm' }), 'op_fault_response_001');
  assert.equal(r.status, 500);
  assert.equal(r.body.outcome, 'UNKNOWN');
  assert.equal(r.body.error.code, 'RESPONSE_LIMIT');
  assert.equal(r.body.saved, false);
  assert.equal(r.body.durable, false);
  assert.ok(!('revision' in r.body));
  assert.equal(ctx.srv.control.note([OWNER_SCOPE, ...XFAKE002]).exists, true, 'the model did commit');
  assert.equal(ctx.srv.control.stats().commits, 1);
  const record = ctx.srv.control.snapshot().ledger[0];
  assert.equal(record.outcome, 'UNKNOWN');
  assert.equal(record.committed, true);
  assert.equal(ctx.srv.control.quarantine().length, 1);
  const blocked = await create(ctx, XFAKE002, fieldsWith({ researchQuestion: 'blocked' }), 'op_fault_response_002');
  assert.equal(blocked.status, 409);
  assert.equal(blocked.body.error.code, 'TARGET_QUARANTINED');
});

test('Q4-07 no successful or unknown path ever reports saved:true or durable:true', async (t) => {
  const ctx = await startServer(t);
  const health = await ctx.get('/api/v1/health');
  assert.equal(health.body.durable, false);
  assert.equal(health.body.storage, 'MEMORY_ONLY');
  assert.equal(health.body.productionSuitable, false);
  const replayRevision = revisionOf(ctx);
  const confirmed = await update(ctx, fieldsWith({ researchQuestion: 'no durable save' }), `"${replayRevision}"`, 'op_fault_saved_000001');
  assert.equal(confirmed.body.saved, false);
  assert.equal(confirmed.body.durable, false);
  const replay = await update(ctx, fieldsWith({ researchQuestion: 'no durable save' }), `"${replayRevision}"`, 'op_fault_saved_000001');
  assert.equal(replay.body.replayed, true);
  assert.equal(replay.body.saved, false);
  assert.equal(replay.body.durable, false);
  const conflict = await update(ctx, fieldsWith({ researchQuestion: 'stale' }), '"rev_stale_00000000"', 'op_fault_saved_000002');
  assert.equal(conflict.status, 412);
  assert.equal(conflict.body.saved, false);
  assert.equal(conflict.body.durable, false);
  assert.equal(conflict.body.outcome, 'CONFLICT');
});

test('zz request tally for this file stays within the 5000-request per-instance budget', (t) => {
  const n = requestTally();
  t.diagnostic(`WP04_LOCAL_REQUESTS file=q4-07 n=${n}`);
  assert.ok(n <= 5000);
});
