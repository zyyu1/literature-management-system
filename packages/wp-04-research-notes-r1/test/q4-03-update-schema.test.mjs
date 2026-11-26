// Q4-03: whole-note update with the current revision creates a new opaque revision and replaces
// all five fields together. Missing, extra, duplicate, null and non-string field keys are 422 with
// no partial write; the top-level request schema is closed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  startServer, requestTally, noteBody, fieldsWith, emptyNoteFields, RESEARCH_NOTE_PATH,
  XFAKE001, NOTE_KEYS, OWNER_SCOPE,
} from '../support/harness.mjs';
import { REVISION_RE } from '../src/model.mjs';

function revisionOf(ctx) { return ctx.srv.control.note([OWNER_SCOPE, ...XFAKE001]).revision; }

function update(ctx, fields, operationId, ifMatch = `"${revisionOf(ctx)}"`) {
  return ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, {
    body: noteBody(ctx.runId, fields, operationId), ifMatch,
  });
}

test('Q4-03 whole-note update with the current revision replaces all five fields and returns a new opaque revision', async (t) => {
  const ctx = await startServer(t);
  const oldRevision = revisionOf(ctx);
  const fields = {
    researchQuestion: 'new question',
    argumentsAndContent: 'new arguments',
    theoriesAndMethods: 'new methods',
    contributionsAndInnovations: 'new contributions',
    limitations: 'new limitations',
  };
  const r = await update(ctx, fields);
  assert.equal(r.status, 200);
  assert.equal(r.body.outcome, 'CONFIRMED');
  assert.equal(r.body.outcomeBasis, 'MODEL_ONLY');
  assert.equal(r.body.saved, false);
  assert.equal(r.body.durable, false);
  assert.equal(r.body.dispatched, true);
  assert.deepEqual(r.body.note.fields, fields);
  assert.notEqual(r.body.revision, oldRevision);
  assert.match(r.body.revision, REVISION_RE);
  assert.equal(r.body.revision, r.body.note.revision);
  const readBack = await ctx.get(RESEARCH_NOTE_PATH(XFAKE001), ctx.owner);
  assert.deepEqual(readBack.body.fields, fields);
  assert.equal(readBack.body.revision, r.body.revision);
  assert.equal(revisionOf(ctx), r.body.revision);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.stats().commits, 1);
  assert.equal(ctx.srv.control.ledgerSize(), 1);
});

test('Q4-03 missing, extra, null, non-string and duplicate five-field keys are 422 with no partial write', async (t) => {
  const ctx = await startServer(t);
  const ifMatch = `"${revisionOf(ctx)}"`;
  const baseline = fieldsWith({ researchQuestion: 'baseline' });
  const digest = ctx.srv.control.stateDigest();
  const ledger = ctx.srv.control.ledgerSize();

  const missing = {};
  for (const key of NOTE_KEYS.slice(0, -1)) missing[key] = baseline[key];
  const cases = [
    [noteBody(ctx.runId, missing), 422, 'INVALID_FIELDS', 'missing field'],
    [noteBody(ctx.runId, { ...baseline, sixthField: 'x' }), 422, 'INVALID_FIELDS', 'extra field'],
    [noteBody(ctx.runId, { ...baseline, limitations: null }), 422, 'INVALID_FIELD', 'null field'],
    [noteBody(ctx.runId, { ...baseline, limitations: 42 }), 422, 'INVALID_FIELD', 'non-string field'],
  ];
  for (const [body, status, code, label] of cases) {
    const r = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, { body, ifMatch });
    assert.equal(r.status, status, label);
    assert.equal(r.body.error.code, code, label);
    assert.equal(r.body.dispatched, false, label);
  }

  // Duplicate five-field keys are rejected by the strict parser as a 422 schema violation.
  const op = 'op_' + 'd'.repeat(12);
  const duplicateRaw = `{"operationId":"${op}","modelRunId":"${ctx.runId}","scope":"GLOBAL_PAPER","fields":{"researchQuestion":"a","researchQuestion":"b","argumentsAndContent":"","theoriesAndMethods":"","contributionsAndInnovations":"","limitations":""}}`;
  const duplicate = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, {
    rawBody: Buffer.from(duplicateRaw), ifMatch,
  });
  assert.equal(duplicate.status, 422);
  assert.equal(duplicate.body.error.code, 'DUPLICATE_FIELD');
  assert.equal(duplicate.body.dispatched, false);

  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.ledgerSize(), ledger);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q4-03 the top-level schema is closed and exact: scope mismatch, extra keys and non-object fields are rejected before dispatch', async (t) => {
  const ctx = await startServer(t);
  const ifMatch = `"${revisionOf(ctx)}"`;
  const fields = fieldsWith({ researchQuestion: 'schema' });
  const digest = ctx.srv.control.stateDigest();
  const probes = [
    [{ ...noteBody(ctx.runId, fields), scope: 'PROJECT' }, 400, 'SCOPE_MISMATCH'],
    [{ ...noteBody(ctx.runId, fields), action: 'SET' }, 400, 'UNKNOWN_FIELD'],
    [{ ...noteBody(ctx.runId, fields), ownerId: 'owner_synth_foreign' }, 400, 'UNKNOWN_FIELD'],
    [{ ...noteBody(ctx.runId, fields), fields: 'not-an-object' }, 422, 'INVALID_FIELDS'],
    [{ ...noteBody(ctx.runId, fields), fields: ['x'] }, 422, 'INVALID_FIELDS'],
    [{ ...noteBody(ctx.runId, fields), scope: 42 }, 422, 'INVALID_SCOPE'],
    [{ ...noteBody(ctx.runId, fields), operationId: 'bad' }, 400, 'INVALID_OPERATION_ID'],
    [{ ...noteBody(ctx.runId, fields), modelRunId: 'not-a-run' }, 422, 'INVALID_MODEL_RUN_ID'],
    [{ ...noteBody(ctx.runId, fields), modelRunId: 'run_' + 'a'.repeat(20) }, 409, 'STALE_MODEL_RUN'],
  ];
  for (const [body, status, code] of probes) {
    const r = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, { body, ifMatch });
    assert.equal(r.status, status, code);
    assert.equal(r.body.error.code, code);
    assert.equal(r.body.dispatched, false);
  }
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q4-03 all five empty strings are an allowed whole-note value and remain an existing note', async (t) => {
  const ctx = await startServer(t);
  const r = await update(ctx, emptyNoteFields());
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.note.fields, emptyNoteFields());
  const readBack = await ctx.get(RESEARCH_NOTE_PATH(XFAKE001), ctx.owner);
  assert.equal(readBack.body.exists, true);
  assert.deepEqual(readBack.body.fields, emptyNoteFields());
  assert.equal(ctx.srv.control.snapshot().counts.notes, 1);
});

test('zz request tally for this file stays within the 5000-request per-instance budget', (t) => {
  const n = requestTally();
  t.diagnostic(`WP04_LOCAL_REQUESTS file=q4-03 n=${n}`);
  assert.ok(n <= 5000);
});
