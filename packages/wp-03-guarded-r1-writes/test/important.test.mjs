// Q3-04: PROJECT_ASSOCIATION Important — per-association mutability, no implicit link creation,
// archived-Project policy denial, exact boolean typing and independence from global fields.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  startServer, requestTally, importantBody, IMPORTANT_PATH, PAPER_PATH, PROJECT_PAPERS_PATH,
  XFAKE001, GROUP_XFAKE001, XFAKE002, OWNER_SCOPE,
} from '../support/harness.mjs';
import { REVISION_RE } from '../src/model.mjs';
import { ACTION, SCOPE } from '../src/contract.mjs';

const ALPHA = 'project_synth_alpha';
const BETA = 'project_synth_beta';
const GAMMA = 'project_synth_gamma';

function assocSnapshot(ctx, projectId, tuple) {
  return ctx.srv.control.association(projectId, [OWNER_SCOPE, ...tuple]);
}

async function rows(ctx, projectId) {
  const r = await ctx.get(PROJECT_PAPERS_PATH(projectId), ctx.owner);
  assert.equal(r.status, 200);
  return r.body.papers;
}

test('Q3-04 Important toggles only the exact Project association, leaving other Projects and global fields unchanged', async (t) => {
  const ctx = await startServer(t);
  const alphaBefore = await rows(ctx, ALPHA);
  const betaBefore = await rows(ctx, BETA);
  const gammaBefore = await rows(ctx, GAMMA);
  const paperBefore = (await ctx.get(PAPER_PATH(XFAKE001), ctx.owner)).body.paper;
  const targetBefore = assocSnapshot(ctx, ALPHA, XFAKE001);
  assert.equal(targetBefore.important, true);
  const groupBefore = assocSnapshot(ctx, ALPHA, GROUP_XFAKE001);
  const otherAssocBefore = assocSnapshot(ctx, GAMMA, XFAKE002);
  let revision = targetBefore.revision;

  for (const value of [false, true]) {
    const body = importantBody(ctx.runId, value);
    const r = await ctx.call('PATCH', IMPORTANT_PATH(ALPHA, XFAKE001), ctx.owner, { body, ifMatch: `"${revision}"` });
    assert.equal(r.status, 200, String(value));
    assert.equal(r.body.outcome, 'CONFIRMED');
    assert.equal(r.body.outcomeBasis, 'MODEL_ONLY');
    assert.equal(r.body.saved, false);
    assert.equal(r.body.durable, false);
    assert.deepEqual(r.body.resource, {
      kind: 'association', projectId: ALPHA,
      paper: { libraryType: 'user', libraryId: 'fakeLib01', itemKey: 'XFAKE001' },
      important: value, revision: r.body.revision,
    });
    assert.match(r.body.revision, REVISION_RE);
    assert.notEqual(r.body.revision, revision);
    revision = r.body.revision;

    const alphaAfter = await rows(ctx, ALPHA);
    assert.equal(alphaAfter.find((x) => x.itemKey === 'XFAKE001' && x.libraryType === 'user').important, value);
    assert.equal(alphaAfter.find((x) => x.libraryType === 'group').important, groupBefore.important);
    assert.deepEqual((await rows(ctx, BETA)).find((x) => x.itemKey === 'XFAKE001').important, false);
    assert.deepEqual((await rows(ctx, GAMMA)).find((x) => x.itemKey === 'XFAKE001').important, false);
    assert.deepEqual((await rows(ctx, GAMMA)).find((x) => x.itemKey === 'XFAKE002').important, true);
    assert.equal(assocSnapshot(ctx, ALPHA, GROUP_XFAKE001).revision, groupBefore.revision);
    assert.equal(assocSnapshot(ctx, GAMMA, XFAKE002).revision, otherAssocBefore.revision);
    const paperAfter = (await ctx.get(PAPER_PATH(XFAKE001), ctx.owner)).body.paper;
    assert.deepEqual(paperAfter, paperBefore, 'ReadingStatus/note/metadata untouched');
    void betaBefore;
    void gammaBefore;
  }
  assert.equal(ctx.srv.control.stats().dispatches, 2);
  assert.equal(ctx.srv.control.stats().commits, 2);
});

test('Q3-04 a change inside an archived Project is denied with 409 PROJECT_ARCHIVED and no side effect', async (t) => {
  const ctx = await startServer(t);
  const assoc = assocSnapshot(ctx, BETA, XFAKE001);
  const digest = ctx.srv.control.stateDigest();
  const ledger = ctx.srv.control.ledgerSize();
  const body = importantBody(ctx.runId, true);
  const r = await ctx.call('PATCH', IMPORTANT_PATH(BETA, XFAKE001), ctx.owner, { body, ifMatch: `"${assoc.revision}"` });
  assert.equal(r.status, 409);
  assert.equal(r.body.error.code, 'PROJECT_ARCHIVED');
  assert.equal(r.body.outcome, 'CONFLICT');
  assert.equal(r.body.dispatched, false);
  assert.equal(r.body.saved, false);
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.ledgerSize(), ledger);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(assocSnapshot(ctx, BETA, XFAKE001).important, false);
});

test('Q3-04 Important never creates an implicit link for a paper that is not associated', async (t) => {
  const ctx = await startServer(t);
  const before = ctx.srv.control.snapshot().counts;
  // gamma links user/fakeLib01/XFAKE001 and XFAKE002 but never group/fakeLib02/XFAKE001.
  const r = await ctx.call('PATCH', IMPORTANT_PATH(GAMMA, GROUP_XFAKE001), ctx.owner, {
    body: importantBody(ctx.runId, true), ifMatch: '"rev_whatever_000000"',
  });
  assert.equal(r.status, 403);
  assert.equal(r.body.error.code, 'NOT_AVAILABLE');
  assert.equal(r.body.dispatched, false);
  assert.deepEqual(ctx.srv.control.snapshot().counts, before);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.association(GAMMA, [OWNER_SCOPE, ...GROUP_XFAKE001]), null);
});

test('Q3-04 Important requires an exact boolean; bad scope/action/fields and bad ids are rejected', async (t) => {
  const ctx = await startServer(t);
  const revision = assocSnapshot(ctx, ALPHA, XFAKE001).revision;
  const cases = [
    [{ ...importantBody(ctx.runId, 'true') }, 422, 'INVALID_VALUE'],
    [{ ...importantBody(ctx.runId, 1) }, 422, 'INVALID_VALUE'],
    [{ ...importantBody(ctx.runId, null) }, 422, 'INVALID_VALUE'],
    [{ operationId: 'op_important_001', modelRunId: ctx.runId, scope: 'PROJECT_ASSOCIATION', action: 'SET_IMPORTANT' }, 422, 'INVALID_VALUE'],
    [{ ...importantBody(ctx.runId, true), scope: SCOPE.GLOBAL_PAPER }, 400, 'SCOPE_MISMATCH'],
    [{ ...importantBody(ctx.runId, true), action: ACTION.SET_READING_STATUS }, 422, 'UNSUPPORTED_ACTION'],
    [{ ...importantBody(ctx.runId, true), ownerId: 'owner_synth_foreign' }, 400, 'UNKNOWN_FIELD'],
    [{ ...importantBody(ctx.runId, true), revision }, 400, 'UNKNOWN_FIELD'],
  ];
  const digest = ctx.srv.control.stateDigest();
  for (const [body, status, code] of cases) {
    const r = await ctx.call('PATCH', IMPORTANT_PATH(ALPHA, XFAKE001), ctx.owner, { body, ifMatch: `"${revision}"` });
    assert.equal(r.status, status, JSON.stringify(body));
    assert.equal(r.body.error.code, code);
    assert.equal(r.body.dispatched, false);
  }
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q3-04 association revisions are independent of Project and ReadingStatus revisions', async (t) => {
  const ctx = await startServer(t);
  const project = ctx.srv.control.project(ALPHA);
  const paper = ctx.srv.control.paper([OWNER_SCOPE, ...XFAKE001]);
  const assoc = assocSnapshot(ctx, ALPHA, XFAKE001);
  assert.notEqual(assoc.revision, project.revision);
  assert.notEqual(assoc.revision, paper.revision);
  assert.notEqual(project.revision, paper.revision);
  const r = await ctx.call('PATCH', IMPORTANT_PATH(ALPHA, XFAKE001), ctx.owner, {
    body: importantBody(ctx.runId, false), ifMatch: `"${assoc.revision}"`,
  });
  assert.equal(r.status, 200);
  assert.equal(ctx.srv.control.project(ALPHA).revision, project.revision, 'Project revision untouched');
  assert.equal(ctx.srv.control.paper([OWNER_SCOPE, ...XFAKE001]).revision, paper.revision, 'ReadingStatus revision untouched');
  const after = assocSnapshot(ctx, ALPHA, XFAKE001);
  assert.notEqual(after.revision, assoc.revision);
  // The relationship between project revision and status revision is never coupled either.
  const renamed = await ctx.call('PATCH', `/api/v1/projects/${ALPHA}`, ctx.owner, {
    body: { operationId: 'op_rename_indep01', modelRunId: ctx.runId, scope: 'PROJECT', action: ACTION.RENAME, name: 'Alpha independent' },
    ifMatch: `"${project.revision}"`,
  });
  assert.equal(renamed.status, 200);
  assert.equal(ctx.srv.control.paper([OWNER_SCOPE, ...XFAKE001]).revision, paper.revision);
  assert.equal(assocSnapshot(ctx, ALPHA, XFAKE001).revision, after.revision);
});

test('Q3-04 foreign and missing Important targets stay neutral', async (t) => {
  const ctx = await startServer(t);
  const digest = ctx.srv.control.stateDigest();
  const cases = [
    [IMPORTANT_PATH('project_synth_foreign', XFAKE001), ctx.owner],
    [IMPORTANT_PATH(ALPHA, XFAKE001), ctx.foreign],
    [IMPORTANT_PATH('project_synth_missing', XFAKE001), ctx.owner],
    [IMPORTANT_PATH(ALPHA, ['user', 'fakeLib01', 'XFAKE999']), ctx.owner],
  ];
  for (const [path, creds] of cases) {
    const r = await ctx.call('PATCH', path, creds, { body: importantBody(ctx.runId, true), ifMatch: '"rev_whatever_000000"' });
    assert.equal(r.status, 403, path);
    assert.equal(r.body.error.code, 'NOT_AVAILABLE');
    assert.ok(!('revision' in r.body));
  }
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  void XFAKE002;
});

test('zz request tally for this file stays within the 5000-request per-instance budget', (t) => {
  const n = requestTally();
  t.diagnostic(`WP03_LOCAL_REQUESTS file=important n=${n}`);
  assert.ok(n <= 5000);
});
