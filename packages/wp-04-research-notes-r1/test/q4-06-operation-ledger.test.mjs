// Q4-06: operation identity. An exact replay never dispatches twice; a changed fingerprint under the
// same principal + operationId is 409 OPERATION_ID_REUSE; concurrent same-key operations dispatch
// once; cross-principal reuse is neutral and discloses nothing; old runIds/revisions die with the
// instance; case-fold identity never matches.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  startServer, requestTally, noteBody, fieldsWith, RESEARCH_NOTE_PATH,
  XFAKE001, XFAKE002, GROUP_XFAKE001, OWNER_SCOPE,
} from '../support/harness.mjs';

function revisionOf(ctx) { return ctx.srv.control.note([OWNER_SCOPE, ...XFAKE001]).revision; }

function updateBody(ctx, fields, operationId) {
  return noteBody(ctx.runId, fields, operationId);
}

test('Q4-06 an exact replay of a confirmed update never re-dispatches and keeps the original revision', async (t) => {
  const ctx = await startServer(t);
  const revision = revisionOf(ctx);
  const body = updateBody(ctx, fieldsWith({ researchQuestion: 'replay target' }), 'op_replay_update_001');
  const first = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, { body, ifMatch: `"${revision}"` });
  assert.equal(first.status, 200);
  const stateAfterFirst = ctx.srv.control.stateDigest();
  const replay = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, { body, ifMatch: `"${revision}"` });
  assert.equal(replay.status, 200);
  assert.equal(replay.body.replayed, true);
  assert.equal(replay.body.dispatched, false);
  assert.equal(replay.body.saved, false);
  assert.equal(replay.body.durable, false);
  assert.equal(replay.body.outcome, 'CONFIRMED');
  assert.equal(replay.body.outcomeBasis, 'MODEL_ONLY');
  assert.equal(replay.body.operationId, body.operationId);
  assert.equal(replay.body.revision, first.body.revision);
  assert.deepEqual(replay.body.note, first.body.note);
  assert.equal(ctx.srv.control.stateDigest(), stateAfterFirst);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.stats().commits, 1);
  assert.equal(ctx.srv.control.ledgerSize(), 1);
  const record = ctx.srv.control.snapshot().ledger[0];
  assert.equal(record.route, 'paper.researchNote');
  assert.equal(record.mode, 'update');
  assert.equal(record.scope, 'GLOBAL_PAPER');
  assert.equal(record.targetKey, `note:${[OWNER_SCOPE, ...XFAKE001].join('\u0000')}`);
  assert.equal(record.precondition, `"${revision}"`);
  assert.match(record.fingerprint, /^[0-9a-f]{64}$/);
});

test('Q4-06 an exact create replay returns 200 replayed and never creates twice', async (t) => {
  const ctx = await startServer(t);
  const body = updateBody(ctx, fieldsWith({ researchQuestion: 'create replay' }), 'op_replay_create_001');
  const first = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE002), ctx.owner, { body, ifNoneMatch: '*' });
  assert.equal(first.status, 201);
  const stateAfterFirst = ctx.srv.control.stateDigest();
  const replay = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE002), ctx.owner, { body, ifNoneMatch: '*' });
  assert.equal(replay.status, 200);
  assert.equal(replay.body.replayed, true);
  assert.equal(replay.body.dispatched, false);
  assert.equal(replay.body.revision, first.body.revision);
  assert.deepEqual(replay.body.note, first.body.note);
  assert.equal(ctx.srv.control.stateDigest(), stateAfterFirst);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.snapshot().counts.notes, 2);
});

test('Q4-06 replay cannot bypass a revoked Session and never re-dispatches after revocation', async (t) => {
  const ctx = await startServer(t);
  const revision = revisionOf(ctx);
  const body = updateBody(ctx, fieldsWith({ researchQuestion: 'revoked replay' }), 'op_revoked_replay_01');
  const first = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, { body, ifMatch: `"${revision}"` });
  assert.equal(first.status, 200);
  const stateAfterFirst = ctx.srv.control.stateDigest();
  ctx.srv.control.revokeByCookie(ctx.owner.cookieValue);
  const replay = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, { body, ifMatch: `"${revision}"` });
  assert.equal(replay.status, 401);
  assert.equal(replay.body.error.code, 'SESSION_REVOKED');
  assert.equal(replay.body.dispatched, false);
  assert.equal(ctx.srv.control.stateDigest(), stateAfterFirst);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.ledgerSize(), 1);
});

test('Q4-06 an exact replay of an UNKNOWN operation stays UNKNOWN, does not dispatch and keeps the target quarantined', async (t) => {
  const ctx = await startServer(t);
  const revision = revisionOf(ctx);
  const body = updateBody(ctx, fieldsWith({ researchQuestion: 'unknown replay' }), 'op_unknown_replay_001');
  ctx.srv.control.setNextFault('accepted_not_committed');
  const first = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, { body, ifMatch: `"${revision}"` });
  assert.equal(first.status, 202);
  assert.equal(first.body.outcome, 'UNKNOWN');
  assert.equal(first.body.saved, false);
  const replay = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, { body, ifMatch: `"${revision}"` });
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
  assert.equal(revisionOf(ctx), revision);
});

test('Q4-06 a changed field set, tuple, precondition or scope under one operationId is 409 OPERATION_ID_REUSE with no dispatch', async (t) => {
  const ctx = await startServer(t);
  const original = updateBody(ctx, fieldsWith({ researchQuestion: 'original' }), 'op_reuse_original_001');
  const first = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, { body: original, ifMatch: `"${revisionOf(ctx)}"` });
  assert.equal(first.status, 200);
  const newRevision = first.body.revision;
  const stateAfter = ctx.srv.control.stateDigest();

  const changed = [
    ['fields', updateBody(ctx, fieldsWith({ researchQuestion: 'changed' }), original.operationId), RESEARCH_NOTE_PATH(XFAKE001), `"${newRevision}"`],
    ['precondition', original, RESEARCH_NOTE_PATH(XFAKE001), `"${newRevision}"`],
    ['scope', { ...original, scope: 'PROJECT' }, RESEARCH_NOTE_PATH(XFAKE001), `"${newRevision}"`],
    ['tuple', original, RESEARCH_NOTE_PATH(GROUP_XFAKE001), undefined],
  ];
  for (const [label, body, path, ifMatch] of changed) {
    const opts = ifMatch === undefined ? { ifNoneMatch: '*' } : { ifMatch };
    const r = await ctx.call('PUT', path, ctx.owner, { body, ...opts });
    assert.equal(r.status, 409, label);
    assert.equal(r.body.error.code, 'OPERATION_ID_REUSE', label);
    assert.equal(r.body.outcome, 'CONFLICT', label);
    assert.equal(r.body.dispatched, false, label);
  }
  assert.equal(ctx.srv.control.stateDigest(), stateAfter, 'no changed operation applied');
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.ledgerSize(), 1);
});

test('Q4-06 two concurrent identical operations with one operationId dispatch exactly once', async (t) => {
  const ctx = await startServer(t);
  ctx.srv.control.setGateDelayMs(25);
  const revision = revisionOf(ctx);
  const body = updateBody(ctx, fieldsWith({ researchQuestion: 'concurrent key' }), 'op_concurrent_key_01');
  const [a, b] = await Promise.all([
    ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, { body, ifMatch: `"${revision}"` }),
    ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.ownerSecond, { body, ifMatch: `"${revision}"` }),
  ]);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.stats().commits, 1);
  assert.equal(ctx.srv.control.ledgerSize(), 1);
  const dispatched = [a, b].filter((r) => r.body.dispatched === true);
  const replay = [a, b].filter((r) => r.body.replayed === true);
  assert.equal(dispatched.length, 1);
  assert.equal(replay.length, 1);
  assert.equal(replay[0].body.saved, false);
  assert.deepEqual(ctx.srv.control.note([OWNER_SCOPE, ...XFAKE001]).fields, body.fields);
});

test('Q4-06 cross-principal operationId reuse is denied neutrally without ledger or revision disclosure', async (t) => {
  const ctx = await startServer(t);
  const revision = revisionOf(ctx);
  const body = updateBody(ctx, fieldsWith({ researchQuestion: 'owner operation' }), 'op_cross_principal_01');
  assert.equal((await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, { body, ifMatch: `"${revision}"` })).status, 200);
  const foreignWithUsedId = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.foreign, {
    body: updateBody(ctx, fieldsWith({ researchQuestion: 'foreign attempt' }), body.operationId),
    ifMatch: `"${revision}"`,
  });
  const foreignWithFreshId = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.foreign, {
    body: updateBody(ctx, fieldsWith({ researchQuestion: 'foreign attempt' }), 'op_cross_principal_02'),
    ifMatch: `"${revision}"`,
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

test('Q4-06 old runIds and old revisions are rejected on a fresh instance before any dispatch', async (t) => {
  const first = await startServer(t);
  const firstRevision = revisionOf(first);
  const body = updateBody(first, fieldsWith({ researchQuestion: 'first instance' }), 'op_old_run_body_001');
  assert.equal((await first.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), first.owner, { body, ifMatch: `"${firstRevision}"` })).status, 200);
  const oldRunId = first.runId;
  const oldOperation = updateBody(first, fieldsWith({ researchQuestion: 'old run' }), 'op_old_run_replay_01');

  const second = await startServer(t);
  assert.notEqual(second.runId, oldRunId);
  const digest = second.srv.control.stateDigest();
  const staleUpdate = await second.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), second.owner, {
    body: { ...oldOperation, modelRunId: oldRunId }, ifMatch: `"${revisionOf(second)}"`,
  });
  assert.equal(staleUpdate.status, 409);
  assert.equal(staleUpdate.body.error.code, 'STALE_MODEL_RUN');
  assert.equal(staleUpdate.body.dispatched, false);
  const staleCreate = await second.call('PUT', RESEARCH_NOTE_PATH(XFAKE002), second.owner, {
    body: { ...updateBody(second, fieldsWith({ researchQuestion: 'old create' }), 'op_old_run_create_01'), modelRunId: oldRunId },
    ifNoneMatch: '*',
  });
  assert.equal(staleCreate.status, 409);
  assert.equal(staleCreate.body.error.code, 'STALE_MODEL_RUN');
  const staleRevision = await second.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), second.owner, {
    body: updateBody(second, fieldsWith({ researchQuestion: 'old revision' }), 'op_old_revision_00001'),
    ifMatch: `"${firstRevision}"`,
  });
  assert.equal(staleRevision.status, 412);
  assert.equal(staleRevision.body.error.code, 'STALE_RESOURCE_REVISION');
  assert.equal(second.srv.control.stateDigest(), digest);
  assert.equal(second.srv.control.stats().dispatches, 0);
  assert.equal(second.srv.control.ledgerSize(), 0);
});

test('Q4-06 case-fold identity is never accepted as the same note (named case-fold assertion)', async (t) => {
  const ctx = await startServer(t);
  const revision = revisionOf(ctx);
  const digest = ctx.srv.control.stateDigest();
  const cases = [
    [['user', 'fakeLib01', 'xfake001'], 403, 'NOT_AVAILABLE'],
    [['user', 'FakeLib01', 'XFAKE001'], 403, 'NOT_AVAILABLE'],
    [['USER', 'fakeLib01', 'XFAKE001'], 400, 'INVALID_RESOURCE_ID'],
  ];
  for (const [tuple, status, code] of cases) {
    const r = await ctx.call('PUT', RESEARCH_NOTE_PATH(tuple), ctx.owner, {
      body: noteBody(ctx.runId, fieldsWith({ researchQuestion: 'case fold' }), 'op_case_fold_000001'),
      ifMatch: `"${revision}"`,
    });
    assert.equal(r.status, status, tuple.join('/'));
    assert.equal(r.body.error.code, code);
    assert.equal(r.body.dispatched, false);
  }
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('zz request tally for this file stays within the 5000-request per-instance budget', (t) => {
  const n = requestTally();
  t.diagnostic(`WP04_LOCAL_REQUESTS file=q4-06 n=${n}`);
  assert.ok(n <= 5000);
});
