// Q4-04: exact strong whole-note If-Match preconditions (428/400/412), two-client and truly
// concurrent CAS with distinct Sessions of the same owner committing exactly once, one create race,
// and Session/authorization revalidation at the synchronous commit boundary.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  startServer, requestTally, noteBody, fieldsWith, RESEARCH_NOTE_PATH,
  XFAKE001, XFAKE002, OWNER_SCOPE,
} from '../support/harness.mjs';

function revisionOf(ctx) { return ctx.srv.control.note([OWNER_SCOPE, ...XFAKE001]).revision; }

function update(ctx, fields, opts = {}) {
  return ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), opts.creds || ctx.owner, {
    body: noteBody(ctx.runId, fields, opts.operationId),
    ifMatch: opts.ifMatch === undefined ? `"${revisionOf(ctx)}"` : opts.ifMatch,
    extraHeaders: opts.extraHeaders,
  });
}

test('Q4-04 a stale If-Match is 412 STALE_RESOURCE_REVISION with the authorized current revision and no side effect', async (t) => {
  const ctx = await startServer(t);
  const current = revisionOf(ctx);
  const digest = ctx.srv.control.stateDigest();
  const r = await update(ctx, fieldsWith({ researchQuestion: 'stale' }), { ifMatch: '"rev_stale_aaaaaaaa"' });
  assert.equal(r.status, 412);
  assert.equal(r.body.error.code, 'STALE_RESOURCE_REVISION');
  assert.equal(r.body.outcome, 'CONFLICT');
  assert.equal(r.body.dispatched, false);
  assert.equal(r.body.saved, false);
  assert.equal(r.body.currentRevision, current);
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q4-04 missing If-Match is 428 and weak/wildcard/multiple/malformed forms are 400 before dispatch', async (t) => {
  const ctx = await startServer(t);
  const current = revisionOf(ctx);
  const digest = ctx.srv.control.stateDigest();
  const missing = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, {
    body: noteBody(ctx.runId, fieldsWith({ researchQuestion: 'missing' })),
  });
  assert.equal(missing.status, 428);
  assert.equal(missing.body.error.code, 'PRECONDITION_REQUIRED');
  assert.equal(missing.body.outcome, 'CONFLICT');
  assert.equal(missing.body.dispatched, false);
  const malformed = [
    '*', `W/"${current}"`, 'rev-unquoted', '""', '"a', `"${'a'.repeat(129)}"`, '"a"b"',
    `"${current}", "${current}"`,
  ];
  for (const value of malformed) {
    const r = await update(ctx, fieldsWith({ researchQuestion: 'malformed' }), { ifMatch: value });
    assert.equal(r.status, 400, value.slice(0, 40));
    assert.equal(r.body.error.code, 'INVALID_PRECONDITION');
    assert.equal(r.body.dispatched, false);
  }
  const unexpected = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, {
    body: noteBody(ctx.runId, fieldsWith({ researchQuestion: 'unexpected' })),
    ifMatch: `"${current}"`, extraHeaders: { 'If-None-Match': '*' },
  });
  assert.equal(unexpected.status, 400);
  assert.equal(unexpected.body.error.code, 'UNEXPECTED_CONDITIONAL');
  const unknownConditional = await update(ctx, fieldsWith({ researchQuestion: 'ims' }), {
    ifMatch: `"${current}"`, extraHeaders: { 'If-Modified-Since': 'Wed, 21 Oct 2015 07:28:00 GMT' },
  });
  assert.equal(unknownConditional.status, 400);
  assert.equal(unknownConditional.body.error.code, 'UNEXPECTED_CONDITIONAL');
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q4-04 two clients with the same revision commit exactly once; the loser receives the winner revision', async (t) => {
  const ctx = await startServer(t);
  const current = revisionOf(ctx);
  const a = await update(ctx, fieldsWith({ researchQuestion: 'winner A' }), {
    creds: ctx.owner, operationId: 'op_winner_a_0001', ifMatch: `"${current}"`,
  });
  const b = await update(ctx, fieldsWith({ researchQuestion: 'winner B' }), {
    creds: ctx.ownerSecond, operationId: 'op_winner_b_0001', ifMatch: `"${current}"`,
  });
  assert.deepEqual([a.status, b.status].sort(), [200, 412], 'exactly one commit');
  const winner = a.status === 200 ? a : b;
  const loser = a.status === 412 ? a : b;
  assert.equal(loser.body.error.code, 'STALE_RESOURCE_REVISION');
  assert.equal(loser.body.currentRevision, winner.body.revision);
  const view = ctx.srv.control.note([OWNER_SCOPE, ...XFAKE001]);
  assert.equal(view.revision, winner.body.revision);
  assert.deepEqual(view.fields, winner.body.note.fields);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.stats().commits, 1);
  assert.equal(ctx.srv.control.ledgerSize(), 1);
});

test('Q4-04 two truly concurrent writers at one revision commit exactly once under overlap', async (t) => {
  const ctx = await startServer(t);
  ctx.srv.control.setGateDelayMs(25);
  const current = revisionOf(ctx);
  const [a, b] = await Promise.all([
    update(ctx, fieldsWith({ researchQuestion: 'concurrent A' }), {
      creds: ctx.owner, operationId: 'op_concurrent_a_01', ifMatch: `"${current}"`,
    }),
    update(ctx, fieldsWith({ researchQuestion: 'concurrent B' }), {
      creds: ctx.ownerSecond, operationId: 'op_concurrent_b_01', ifMatch: `"${current}"`,
    }),
  ]);
  assert.deepEqual([a.status, b.status].sort(), [200, 412]);
  const winner = a.status === 200 ? a : b;
  assert.equal(ctx.srv.control.note([OWNER_SCOPE, ...XFAKE001]).revision, winner.body.revision);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.stats().commits, 1);
});

test('Q4-04 update on an absent note is 412 with no current revision and no dispatch', async (t) => {
  const ctx = await startServer(t);
  const digest = ctx.srv.control.stateDigest();
  const r = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE002), ctx.owner, {
    body: noteBody(ctx.runId, fieldsWith({ researchQuestion: 'absent update' })),
    ifMatch: '"rev_absent_aaaaaaaa"',
  });
  assert.equal(r.status, 412);
  assert.equal(r.body.error.code, 'STALE_RESOURCE_REVISION');
  assert.equal(r.body.outcome, 'CONFLICT');
  assert.equal(r.body.currentRevision, null);
  assert.equal(r.body.dispatched, false);
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q4-04 Session revocation and expiry are revalidated at the synchronous commit boundary', async (t) => {
  const ctx = await startServer(t);
  const current = revisionOf(ctx);
  const body = noteBody(ctx.runId, fieldsWith({ researchQuestion: 'revoked at commit' }), 'op_revoked_at_commit_01');
  ctx.srv.control.beforeCommit(() => ctx.srv.control.revokeByCookie(ctx.owner.cookieValue));
  const revoked = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, { body, ifMatch: `"${current}"` });
  assert.equal(revoked.status, 401);
  assert.equal(revoked.body.error.code, 'SESSION_REVOKED');
  assert.equal(revoked.body.dispatched, false);
  assert.equal(revisionOf(ctx), current);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
  // Nothing was dispatched, so the same operation can be safely retried from a second Session.
  const retry = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.ownerSecond, { body, ifMatch: `"${current}"` });
  assert.equal(retry.status, 200);
  assert.equal(ctx.srv.control.stats().dispatches, 1);

  const expiring = await startServer(t);
  expiring.srv.control.beforeCommit(() => expiring.srv.control.advanceClock(2 * 3600 * 1000));
  const expired = await expiring.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), expiring.owner, {
    body: noteBody(expiring.runId, fieldsWith({ researchQuestion: 'expired at commit' })),
    ifMatch: `"${expiring.srv.control.note([OWNER_SCOPE, ...XFAKE001]).revision}"`,
  });
  assert.equal(expired.status, 401);
  assert.equal(expired.body.error.code, 'SESSION_EXPIRED');
  assert.equal(expiring.srv.control.stats().dispatches, 0);
  assert.equal(expiring.srv.control.ledgerSize(), 0);
});

test('Q4-04 two creates with the same absent target commit exactly once', async (t) => {
  const ctx = await startServer(t);
  ctx.srv.control.setGateDelayMs(25);
  const aFields = fieldsWith({ researchQuestion: 'create race A' });
  const bFields = fieldsWith({ researchQuestion: 'create race B' });
  const [a, b] = await Promise.all([
    ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE002), ctx.owner, {
      body: noteBody(ctx.runId, aFields, 'op_create_race_a_001'), ifNoneMatch: '*',
    }),
    ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE002), ctx.ownerSecond, {
      body: noteBody(ctx.runId, bFields, 'op_create_race_b_001'), ifNoneMatch: '*',
    }),
  ]);
  assert.deepEqual([a.status, b.status].sort(), [201, 412]);
  const winner = a.status === 201 ? a : b;
  const loser = a.status === 412 ? a : b;
  assert.equal(loser.body.error.code, 'NOTE_EXISTS');
  assert.equal(loser.body.dispatched, false);
  const view = ctx.srv.control.note([OWNER_SCOPE, ...XFAKE002]);
  assert.deepEqual(view.fields, winner.body.note.fields);
  assert.equal(view.revision, winner.body.revision);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.stats().commits, 1);
});

test('zz request tally for this file stays within the 5000-request per-instance budget', (t) => {
  const n = requestTally();
  t.diagnostic(`WP04_LOCAL_REQUESTS file=q4-04 n=${n}`);
  assert.ok(n <= 5000);
});
