// Q4-09: scope isolation. One global note per canonical tuple: the same title/DOI, the same itemKey
// in another library and a foreign owner's paper are different notes. Writing one note never changes
// Projects, associations, Important, Reading Status, metadata or another note (no cascade), and the
// note is identical through every Project context because the route carries no Project.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  startServer, requestTally, noteBody, fieldsWith, RESEARCH_NOTE_PATH,
  XFAKE001, GROUP_XFAKE001, XFAKE002, XFOREIGN1, OWNER_SCOPE,
} from '../support/harness.mjs';

function view(ctx, tuple) { return ctx.srv.control.note([OWNER_SCOPE, ...tuple]); }

function update(ctx, tuple, fields, operationId) {
  const revision = view(ctx, tuple).revision;
  return ctx.call('PUT', RESEARCH_NOTE_PATH(tuple), ctx.owner, {
    body: noteBody(ctx.runId, fields, operationId), ifMatch: `"${revision}"`,
  });
}

function create(ctx, tuple, fields, operationId) {
  return ctx.call('PUT', RESEARCH_NOTE_PATH(tuple), ctx.owner, {
    body: noteBody(ctx.runId, fields, operationId), ifNoneMatch: '*',
  });
}

function metadataOf(snapshot) {
  return snapshot.papers.map((p) => ({
    key: p.key, ownerScope: p.ownerScope, libraryType: p.libraryType, libraryId: p.libraryId,
    itemKey: p.itemKey, title: p.title, creators: p.creators, year: p.year, doi: p.doi,
    readingStatus: p.readingStatus,
  }));
}

test('Q4-09 writing user/fakeLib01/XFAKE001 never changes XFAKE002, group/fakeLib02/XFAKE001 or the foreign paper', async (t) => {
  const ctx = await startServer(t);
  const before = ctx.srv.control.snapshot();
  const updated = await update(ctx, XFAKE001, fieldsWith({ researchQuestion: 'scope isolation' }), 'op_scope_isolate_0001');
  assert.equal(updated.status, 200);
  const after = ctx.srv.control.snapshot();
  assert.equal(view(ctx, XFAKE002).exists, false);
  assert.equal(view(ctx, GROUP_XFAKE001).exists, false);
  const foreignKey = [ctx.wp02.papers.find((p) => p.itemKey === 'XFOREIGN1').ownerId, ...XFOREIGN1].join('\u0000');
  const foreignBefore = before.papers.find((p) => p.key === foreignKey);
  const foreignAfter = after.papers.find((p) => p.key === foreignKey);
  assert.deepEqual(foreignAfter.note, foreignBefore.note);
  assert.equal(foreignAfter.note, null);
  // Creating another note leaves the first note's revision and bytes untouched.
  const revisionAfterUpdate = view(ctx, XFAKE001).revision;
  assert.equal((await create(ctx, XFAKE002, fieldsWith({ researchQuestion: 'second note' }), 'op_scope_isolate_0002')).status, 201);
  assert.equal(view(ctx, XFAKE001).revision, revisionAfterUpdate);
  assert.deepEqual(view(ctx, XFAKE001).fields, fieldsWith({ researchQuestion: 'scope isolation' }));
  assert.equal(view(ctx, GROUP_XFAKE001).exists, false);
});

test('Q4-09 identical title AND DOI and the same itemKey in another library are distinct notes', async (t) => {
  const ctx = await startServer(t);
  const x1 = ctx.wp02.papers.find((p) => p.libraryType === 'user' && p.libraryId === 'fakeLib01' && p.itemKey === 'XFAKE001');
  const x2 = ctx.wp02.papers.find((p) => p.libraryType === 'user' && p.libraryId === 'fakeLib01' && p.itemKey === 'XFAKE002');
  assert.equal(x1.title, x2.title);
  assert.equal(x1.doi, x2.doi);
  const fields = fieldsWith({ researchQuestion: 'only XFAKE001' });
  assert.equal((await update(ctx, XFAKE001, fields, 'op_scope_same_title_01')).status, 200);
  assert.equal(view(ctx, XFAKE002).exists, false);
  const groupFields = fieldsWith({ researchQuestion: 'only group XFAKE001' });
  assert.equal((await create(ctx, GROUP_XFAKE001, groupFields, 'op_scope_group_00001')).status, 201);
  assert.deepEqual(view(ctx, XFAKE001).fields, fields);
  assert.deepEqual(view(ctx, GROUP_XFAKE001).fields, groupFields);
  assert.notEqual(view(ctx, XFAKE001).revision, view(ctx, GROUP_XFAKE001).revision);
});

test('Q4-09 writing a note causes no cascade to metadata, Reading Status, Projects or associations', async (t) => {
  const ctx = await startServer(t);
  const before = ctx.srv.control.snapshot();
  assert.deepEqual(before.catalog, { projects: 4, papers: 4, associations: 6 });
  assert.equal((await update(ctx, XFAKE001, fieldsWith({ researchQuestion: 'no cascade' }), 'op_scope_no_cascade_01')).status, 200);
  assert.equal((await create(ctx, XFAKE002, fieldsWith({ researchQuestion: 'no cascade 2' }), 'op_scope_no_cascade_02')).status, 201);
  const after = ctx.srv.control.snapshot();
  assert.deepEqual(after.catalog, before.catalog);
  assert.deepEqual(metadataOf(after), metadataOf(before), 'all paper metadata and Reading Status are untouched');
  assert.equal(ctx.srv.control.catalogCounts().projects, 4);
  assert.equal(ctx.srv.control.catalogCounts().associations, 6);
  // WP-04 has no Project/association/status/Important/import route at all.
  for (const path of ['/api/v1/projects', '/api/v1/projects/project_synth_alpha/papers', '/api/v1/papers/user/fakeLib01/XFAKE001']) {
    const r = await ctx.get(path, ctx.owner);
    assert.equal(r.status, 404, path);
  }
});

test('Q4-09 the note is Project-independent: the same URL and bytes for every Session, and no Project parameter', async (t) => {
  const ctx = await startServer(t);
  const first = await ctx.get(RESEARCH_NOTE_PATH(XFAKE001), ctx.owner);
  const second = await ctx.get(RESEARCH_NOTE_PATH(XFAKE001), ctx.ownerSecond);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.deepEqual(first.rawBody, second.rawBody);
  assert.equal(first.headers.etag, second.headers.etag);
  const withQuery = await ctx.get(`${RESEARCH_NOTE_PATH(XFAKE001)}?project=project_synth_alpha`, ctx.owner);
  assert.equal(withQuery.status, 400);
  assert.equal(withQuery.body.error.code, 'INVALID_QUERY');
  for (const id of ['project_synth_alpha', 'project_synth_gamma']) {
    const projectRoute = await ctx.get(`/api/v1/projects/${id}/papers/user/fakeLib01/XFAKE001/research-note`, ctx.owner);
    assert.equal(projectRoute.status, 404, id);
  }
});

test('Q4-09 the foreign paper and its note remain untouched and are never visible to the owner', async (t) => {
  const ctx = await startServer(t);
  const foreignKey = [ctx.wp02.papers.find((p) => p.itemKey === 'XFOREIGN1').ownerId, ...XFOREIGN1].join('\u0000');
  const before = ctx.srv.control.snapshot().papers.find((p) => p.key === foreignKey);
  assert.ok(before, 'the foreign paper exists in its own owner scope');
  assert.equal(before.note, null);
  const denied = await ctx.get(RESEARCH_NOTE_PATH(XFOREIGN1), ctx.owner);
  assert.equal(denied.status, 403);
  assert.equal(denied.body.error.code, 'NOT_AVAILABLE');
  assert.equal((await update(ctx, XFAKE001, fieldsWith({ researchQuestion: 'still isolated' }), 'op_scope_foreign_0001')).status, 200);
  const after = ctx.srv.control.snapshot().papers.find((p) => p.key === foreignKey);
  assert.deepEqual(after, before);
});

test('zz request tally for this file stays within the 5000-request per-instance budget', (t) => {
  const n = requestTally();
  t.diagnostic(`WP04_LOCAL_REQUESTS file=q4-09 n=${n}`);
  assert.ok(n <= 5000);
});
