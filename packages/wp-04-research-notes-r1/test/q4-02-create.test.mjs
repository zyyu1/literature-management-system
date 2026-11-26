// Q4-02: create a whole note only with `If-None-Match: *` on an absent canonical tuple; the second
// create is 412 and never overwrites; the owner is derived from the Session; no client owner/role
// field can forge it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  startServer, requestTally, noteBody, fieldsWith, RESEARCH_NOTE_PATH,
  XFAKE001, XFAKE002, XFOREIGN1, OWNER_SCOPE,
} from '../support/harness.mjs';

function create(ctx, tuple, fields, operationId, extra = {}) {
  return ctx.call('PUT', RESEARCH_NOTE_PATH(tuple), ctx.owner, {
    body: noteBody(ctx.runId, fields, operationId, extra),
    ifNoneMatch: '*',
  });
}

test('Q4-02 create on an absent note with If-None-Match: * commits once and a second create never overwrites', async (t) => {
  const ctx = await startServer(t);
  const fields = fieldsWith({ researchQuestion: 'created question', limitations: 'created limitations' });
  const first = await create(ctx, XFAKE002, fields);
  assert.equal(first.status, 201);
  assert.equal(first.body.outcome, 'CONFIRMED');
  assert.equal(first.body.outcomeBasis, 'MODEL_ONLY');
  assert.equal(first.body.saved, false);
  assert.equal(first.body.durable, false);
  assert.equal(first.body.simulated, true);
  assert.equal(first.body.dispatched, true);
  assert.equal(first.body.replayed, false);
  assert.deepEqual(first.body.note.fields, fields);
  assert.equal(first.body.revision, first.body.note.revision);
  const readBack = await ctx.get(RESEARCH_NOTE_PATH(XFAKE002), ctx.owner);
  assert.equal(readBack.status, 200);
  assert.deepEqual(readBack.body.fields, fields);
  assert.equal(readBack.body.revision, first.body.revision);

  const secondFields = fieldsWith({ researchQuestion: 'must not overwrite' });
  const second = await create(ctx, XFAKE002, secondFields);
  assert.equal(second.status, 412);
  assert.equal(second.body.error.code, 'NOTE_EXISTS');
  assert.equal(second.body.outcome, 'CONFLICT');
  assert.equal(second.body.dispatched, false);
  assert.equal(second.body.saved, false);
  const after = await ctx.get(RESEARCH_NOTE_PATH(XFAKE002), ctx.owner);
  assert.deepEqual(after.body.fields, fields);
  assert.equal(after.body.revision, first.body.revision);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.stats().commits, 1);
  assert.equal(ctx.srv.control.ledgerSize(), 1);
});

test('Q4-02 create requires exactly If-None-Match: *; missing, wrong and extra preconditions fail closed', async (t) => {
  const ctx = await startServer(t);
  const body = noteBody(ctx.runId, fieldsWith({ researchQuestion: 'precondition' }));
  const digest = ctx.srv.control.stateDigest();
  const missing = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE002), ctx.owner, { body });
  assert.equal(missing.status, 428);
  assert.equal(missing.body.error.code, 'PRECONDITION_REQUIRED');
  assert.equal(missing.body.outcome, 'CONFLICT');
  assert.equal(missing.body.dispatched, false);
  const wrong = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE002), ctx.owner, {
    body, ifNoneMatch: '"rev_not_a_create"',
  });
  assert.equal(wrong.status, 400);
  assert.equal(wrong.body.error.code, 'INVALID_PRECONDITION');
  const both = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE002), ctx.owner, {
    body, ifNoneMatch: '*', ifMatch: '"rev_whatever_000000"',
  });
  assert.equal(both.status, 400);
  assert.equal(both.body.error.code, 'UNEXPECTED_CONDITIONAL');
  const updateOnAbsent = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE002), ctx.owner, {
    body, ifMatch: '"rev_whatever_000000"',
  });
  assert.equal(updateOnAbsent.status, 412);
  assert.equal(updateOnAbsent.body.error.code, 'STALE_RESOURCE_REVISION');
  assert.equal(updateOnAbsent.body.currentRevision, null);
  assert.equal(updateOnAbsent.body.dispatched, false);
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
});

test('Q4-02 the owner is derived from the Session: Workspace creates are denied and forged owner fields are rejected', async (t) => {
  const ctx = await startServer(t);
  const fields = fieldsWith({ researchQuestion: 'owner derivation' });
  const digest = ctx.srv.control.stateDigest();
  const workspace = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE002), ctx.workspace, {
    body: noteBody(ctx.runId, fields), ifNoneMatch: '*',
  });
  assert.equal(workspace.status, 403);
  assert.equal(workspace.body.error.code, 'WORKSPACE_READ_ONLY');
  assert.equal(workspace.body.dispatched, false);
  for (const [field, value] of [['ownerId', 'owner_synth_foreign'], ['role', 'OWNER'], ['revision', 'rev_forged'], ['saved', true]]) {
    const forged = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE002), ctx.owner, {
      body: noteBody(ctx.runId, fields, undefined, { [field]: value }), ifNoneMatch: '*',
    });
    assert.equal(forged.status, 400, field);
    assert.equal(forged.body.error.code, 'UNKNOWN_FIELD', field);
  }
  // A FOREIGN_DENIED principal cannot create its own paper's note; the owner cannot create another
  // owner's paper note. Both are neutral and disclose no existence information.
  const foreignOwn = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFOREIGN1), ctx.foreign, {
    body: noteBody(ctx.runId, fields), ifNoneMatch: '*',
  });
  assert.equal(foreignOwn.status, 403);
  assert.equal(foreignOwn.body.error.code, 'NOT_AVAILABLE');
  const ownerForeign = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFOREIGN1), ctx.owner, {
    body: noteBody(ctx.runId, fields), ifNoneMatch: '*',
  });
  assert.equal(ownerForeign.status, 403);
  assert.equal(ownerForeign.body.error.code, 'NOT_AVAILABLE');
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
});

test('Q4-02 create on the already-saved fixture note is 412 and preserves the initial bytes', async (t) => {
  const ctx = await startServer(t);
  const before = ctx.srv.control.note([OWNER_SCOPE, ...XFAKE001]);
  const digest = ctx.srv.control.stateDigest();
  const collision = await create(ctx, XFAKE001, fieldsWith({ researchQuestion: 'overwrite the fixture' }));
  assert.equal(collision.status, 412);
  assert.equal(collision.body.error.code, 'NOTE_EXISTS');
  assert.equal(collision.body.dispatched, false);
  assert.equal(collision.body.saved, false);
  const after = ctx.srv.control.note([OWNER_SCOPE, ...XFAKE001]);
  assert.deepEqual(after, before);
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
});

test('zz request tally for this file stays within the 5000-request per-instance budget', (t) => {
  const n = requestTally();
  t.diagnostic(`WP04_LOCAL_REQUESTS file=q4-02 n=${n}`);
  assert.ok(n <= 5000);
});
