// Q3-03: GLOBAL_PAPER ReadingStatus — all three enum values, global propagation to every linked
// Project (including archived reads), exact note bytes and Important untouched, invalid/foreign/case.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  startServer, requestTally, readingStatusBody, READING_STATUS_PATH, PAPER_PATH, PROJECT_PAPERS_PATH,
  XFAKE001, GROUP_XFAKE001, XFAKE002, XFOREIGN1,
} from '../support/harness.mjs';
import { REVISION_RE } from '../src/model.mjs';
import { ACTION, SCOPE } from '../src/contract.mjs';

const ALPHA = 'project_synth_alpha';
const BETA = 'project_synth_beta';
const GAMMA = 'project_synth_gamma';

async function paperStatus(ctx, tuple) {
  const r = await ctx.get(PAPER_PATH(tuple), ctx.owner);
  assert.equal(r.status, 200);
  return r.body;
}

async function rowsFor(ctx, projectId) {
  const r = await ctx.get(PROJECT_PAPERS_PATH(projectId), ctx.owner);
  assert.equal(r.status, 200);
  return r.body.papers;
}

function statusRevisionOf(rows, tuple) {
  const row = rows.find((x) => x.libraryType === tuple[0] && x.libraryId === tuple[1] && x.itemKey === tuple[2]);
  return row ? row.readingStatusRevision : null;
}

test('Q3-03 each ReadingStatus enum value is a global confirmed change reflected in every linked Project', async (t) => {
  const ctx = await startServer(t);
  const beforePaper = await paperStatus(ctx, XFAKE001);
  const noteBytes = beforePaper.paper.note;
  const beforeAlpha = await rowsFor(ctx, ALPHA);
  const beforeBeta = await rowsFor(ctx, BETA);
  const beforeGamma = await rowsFor(ctx, GAMMA);
  const otherBefore = await paperStatus(ctx, XFAKE002);
  let revision = beforePaper.paper.readingStatusRevision;

  for (const value of ['To Read', 'Reading', 'Read']) {
    const body = readingStatusBody(ctx.runId, value);
    const r = await ctx.call('PATCH', READING_STATUS_PATH(XFAKE001), ctx.owner, {
      body, ifMatch: `"${revision}"`,
    });
    assert.equal(r.status, 200, value);
    assert.equal(r.body.outcome, 'CONFIRMED');
    assert.equal(r.body.outcomeBasis, 'MODEL_ONLY');
    assert.equal(r.body.saved, false);
    assert.equal(r.body.durable, false);
    assert.equal(r.body.simulated, true);
    assert.deepEqual(r.body.resource, {
      kind: 'paper', libraryType: 'user', libraryId: 'fakeLib01', itemKey: 'XFAKE001',
      readingStatus: value, revision: r.body.revision,
    });
    assert.match(r.body.revision, REVISION_RE);
    assert.notEqual(r.body.revision, revision);
    revision = r.body.revision;

    const detail = await paperStatus(ctx, XFAKE001);
    assert.equal(detail.paper.readingStatus, value);
    assert.equal(detail.paper.readingStatusRevision, revision);
    assert.deepEqual(detail.paper.note, noteBytes, 'note bytes are preserved exactly');
    for (const [projectId, before] of [[ALPHA, beforeAlpha], [BETA, beforeBeta], [GAMMA, beforeGamma]]) {
      const rows = await rowsFor(ctx, projectId);
      const row = rows.find((x) => x.itemKey === 'XFAKE001' && x.libraryType === 'user');
      assert.equal(row.readingStatus, value, `${projectId} refresh sees ${value}`);
      assert.equal(row.readingStatusRevision, revision);
      assert.equal(row.important, before.find((x) => x.itemKey === 'XFAKE001' && x.libraryType === 'user').important);
      assert.equal(row.noteState, 'PRESENT');
      const groupRow = rows.find((x) => x.libraryType === 'group');
      if (groupRow) assert.equal(groupRow.readingStatus, 'To Read', 'the other canonical paper is unchanged');
      const x2Row = rows.find((x) => x.itemKey === 'XFAKE002');
      if (x2Row) assert.equal(x2Row.readingStatus, 'Read');
    }
    const otherAfter = await paperStatus(ctx, XFAKE002);
    assert.deepEqual(otherAfter.paper, otherBefore.paper);
    // Important revisions never move on a global ReadingStatus write.
    const alphaRows = await rowsFor(ctx, ALPHA);
    const afterImportant = alphaRows.filter((x) => x.itemKey === 'XFAKE001').map((x) => x.importantRevision);
    const beforeImportant = beforeAlpha.filter((x) => x.itemKey === 'XFAKE001').map((x) => x.importantRevision);
    assert.deepEqual(afterImportant, beforeImportant);
  }
  assert.equal(ctx.srv.control.stats().dispatches, 3);
  assert.equal(ctx.srv.control.stats().commits, 3);
});

test('Q3-03 the group-library paper has its own global ReadingStatus and never merges with the user-library paper', async (t) => {
  const ctx = await startServer(t);
  const user = await paperStatus(ctx, XFAKE001);
  const group = await paperStatus(ctx, GROUP_XFAKE001);
  assert.equal(group.paper.readingStatus, 'To Read');
  assert.notEqual(group.paper.readingStatusRevision, user.paper.readingStatusRevision);
  const r = await ctx.call('PATCH', READING_STATUS_PATH(GROUP_XFAKE001), ctx.owner, {
    body: readingStatusBody(ctx.runId, 'Read'), ifMatch: `"${group.paper.readingStatusRevision}"`,
  });
  assert.equal(r.status, 200);
  const userAfter = await paperStatus(ctx, XFAKE001);
  assert.equal(userAfter.paper.readingStatus, 'Reading', 'user XFAKE001 is unchanged');
  const groupAfter = await paperStatus(ctx, GROUP_XFAKE001);
  assert.equal(groupAfter.paper.readingStatus, 'Read');
});

test('Q3-03 invalid enum, wrong type, missing value, bad scope/action and unknown fields are rejected before dispatch', async (t) => {
  const ctx = await startServer(t);
  const revision = (await paperStatus(ctx, XFAKE001)).paper.readingStatusRevision;
  const cases = [
    [{ ...readingStatusBody(ctx.runId, 'to read') }, 422, 'INVALID_VALUE'],
    [{ ...readingStatusBody(ctx.runId, 'PENDING') }, 422, 'INVALID_VALUE'],
    [{ ...readingStatusBody(ctx.runId, 1) }, 422, 'INVALID_VALUE'],
    [{ ...readingStatusBody(ctx.runId, null) }, 422, 'INVALID_VALUE'],
    [{ operationId: 'op_reading_0001', modelRunId: ctx.runId, scope: 'GLOBAL_PAPER', action: 'SET_READING_STATUS' }, 422, 'INVALID_VALUE'],
    [{ ...readingStatusBody(ctx.runId, 'Read'), scope: SCOPE.PROJECT }, 400, 'SCOPE_MISMATCH'],
    [{ ...readingStatusBody(ctx.runId, 'Read'), action: ACTION.SET_IMPORTANT }, 422, 'UNSUPPORTED_ACTION'],
    [{ ...readingStatusBody(ctx.runId, 'Read'), projectId: 'project_synth_alpha' }, 400, 'UNKNOWN_FIELD'],
    [{ ...readingStatusBody(ctx.runId, 'Read'), revision }, 400, 'UNKNOWN_FIELD'],
  ];
  const digest = ctx.srv.control.stateDigest();
  for (const [body, status, code] of cases) {
    const r = await ctx.call('PATCH', READING_STATUS_PATH(XFAKE001), ctx.owner, { body, ifMatch: `"${revision}"` });
    assert.equal(r.status, status, JSON.stringify(body));
    assert.equal(r.body.error.code, code);
  }
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
});

test('Q3-03 foreign, missing and case-variant papers are neutral denials with zero state change', async (t) => {
  const ctx = await startServer(t);
  const digest = ctx.srv.control.stateDigest();
  const body = readingStatusBody(ctx.runId, 'Read');
  const targets = [
    [XFOREIGN1, ctx.owner],
    [XFAKE001, ctx.foreign],
    [['user', 'fakeLib01', 'xfake001'], ctx.owner],
    [['user', 'fakeLib01', 'XFAKE00'], ctx.owner],
  ];
  for (const [tuple, creds] of targets) {
    const r = await ctx.call('PATCH', READING_STATUS_PATH(tuple), creds, { body, ifMatch: '"rev_whatever_000000"' });
    assert.equal(r.status, 403, tuple.join('/'));
    assert.equal(r.body.error.code, 'NOT_AVAILABLE');
    assert.equal(r.body.dispatched, false);
    assert.ok(!('revision' in r.body));
    assert.ok(!('currentRevision' in r.body));
  }
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
});

test('Q3-03 a global status change preserves the exact note bytes of the same paper and never touches Important', async (t) => {
  const ctx = await startServer(t);
  const before = await paperStatus(ctx, XFAKE001);
  const assocBefore = ctx.srv.control.snapshot().associations.map((a) => [a.projectId, a.paperKey, a.important, a.revision]);
  const r = await ctx.call('PATCH', READING_STATUS_PATH(XFAKE001), ctx.owner, {
    body: readingStatusBody(ctx.runId, 'Read'), ifMatch: `"${before.paper.readingStatusRevision}"`,
  });
  assert.equal(r.status, 200);
  const after = await paperStatus(ctx, XFAKE001);
  assert.equal(after.paper.readingStatus, 'Read');
  assert.deepEqual(after.paper.note, before.paper.note);
  assert.equal(after.paper.title, before.paper.title);
  assert.deepEqual(after.paper.creators, before.paper.creators);
  assert.equal(after.paper.doi, before.paper.doi);
  const assocAfter = ctx.srv.control.snapshot().associations.map((a) => [a.projectId, a.paperKey, a.important, a.revision]);
  assert.deepEqual(assocAfter, assocBefore);
  assert.equal(ctx.srv.control.snapshot().counts.associations, 6);
  void XFAKE002;
});

test('zz request tally for this file stays within the 5000-request per-instance budget', (t) => {
  const n = requestTally();
  t.diagnostic(`WP03_LOCAL_REQUESTS file=reading-status n=${n}`);
  assert.ok(n <= 5000);
});
