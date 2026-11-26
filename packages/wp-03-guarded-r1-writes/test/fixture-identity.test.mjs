// Q3-01: initial frozen-fixture state, per-instance runId, derived opaque revisions, 4/4/6 counts,
// owner scope, canonical case-sensitive tuple, cross-library identity, identical title/DOI never merge.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import {
  startServer, requestTally, PAPER_PATH, PROJECT_PATH, PROJECT_PAPERS_PATH, XFAKE001, GROUP_XFAKE001, XFAKE002,
  XFOREIGN1, OWNER_SCOPE, FOREIGN_SCOPE, WP01_FIXTURE_URL, WP02_FIXTURE_URL, loadRawFixtures,
} from '../support/harness.mjs';
import { REVISION_RE, RUN_ID_RE } from '../src/model.mjs';

const WP01_SHA = '86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65';
const WP02_SHA = 'c4fc68afb0a1660c109c4af24620ff17279161d8e3b8e02cdf286d3e060bf888';

test('Q3-01 frozen fixture raw bytes and SHA-256 match the design oracle; model counts are 4/4/6', async (t) => {
  const raw01 = fs.readFileSync(WP01_FIXTURE_URL);
  const raw02 = fs.readFileSync(WP02_FIXTURE_URL);
  assert.equal(raw01.length, 4573);
  assert.equal(raw02.length, 4989);
  assert.equal(createHash('sha256').update(raw01).digest('hex'), WP01_SHA);
  assert.equal(createHash('sha256').update(raw02).digest('hex'), WP02_SHA);
  const fx = loadRawFixtures();
  assert.deepEqual(fx.verified.wp01, { bytes: 4573, sha256: WP01_SHA });
  assert.deepEqual(fx.verified.wp02, { bytes: 4989, sha256: WP02_SHA });
  const { srv } = await startServer(t);
  assert.deepEqual(srv.control.snapshot().counts, { projects: 4, papers: 4, associations: 6 });
  assert.deepEqual(srv.fixtures, fx.verified);
});

test('Q3-01 one runId per instance and a distinct opaque derived revision per Project, ReadingStatus and Important', async (t) => {
  const a = await startServer(t);
  const b = await startServer(t);
  const sa = a.srv.control.snapshot();
  const sb = b.srv.control.snapshot();
  assert.match(sa.runId, RUN_ID_RE);
  assert.match(sb.runId, RUN_ID_RE);
  assert.notEqual(sa.runId, sb.runId);
  assert.equal(a.runId, sa.runId);
  const health = await a.get('/api/v1/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.runId, sa.runId);
  const revisions = [
    ...sa.projects.map((p) => p.revision),
    ...sa.papers.map((p) => p.revision),
    ...sa.associations.map((x) => x.revision),
  ];
  assert.equal(revisions.length, 14);
  for (const r of revisions) assert.match(r, REVISION_RE, r);
  assert.equal(new Set(revisions).size, 14, 'every resource revision is distinct');
  // Revisions are derived from the per-instance runId, never the fixture revision literals.
  for (const p of sa.projects) assert.ok(!p.revision.startsWith('rev-wp02-'));
  assert.notDeepEqual(
    { revisions: sa.projects.map((p) => p.revision) },
    { revisions: sb.projects.map((p) => p.revision) },
  );
});

test('Q3-01 owner projections match the frozen fixture: 3 Projects, 3 distinct papers, expected counts', async (t) => {
  const { get, owner, wp02 } = await startServer(t);
  const all = await get('/api/v1/projects?state=all', owner);
  assert.equal(all.status, 200);
  const ids = all.body.projects.map((p) => p.id);
  assert.deepEqual(ids.sort(), wp02.expected.activeProjects.concat(wp02.expected.archivedProjects).sort());
  assert.ok(!ids.includes('project_synth_foreign'));
  assert.equal(ids.length, 3);
  for (const p of all.body.projects) {
    const exp = wp02.expected.projectCounts[p.id];
    assert.equal(p.paperCount, exp.papers, p.id);
    assert.equal(p.importantCount, exp.important, p.id);
    assert.match(p.revision, REVISION_RE);
  }
  const alpha = await get(PROJECT_PAPERS_PATH('project_synth_alpha'), owner);
  const gamma = await get(PROJECT_PAPERS_PATH('project_synth_gamma'), owner);
  assert.equal(alpha.status, 200);
  assert.equal(gamma.status, 200);
  const identities = new Set([...alpha.body.papers, ...gamma.body.papers].map((p) => `${p.libraryType}/${p.libraryId}/${p.itemKey}`));
  assert.equal(identities.size, 3, 'owner sees exactly 3 distinct canonical papers');
  assert.ok(identities.has('user/fakeLib01/XFAKE001'));
  assert.ok(identities.has('group/fakeLib02/XFAKE001'));
  assert.ok(identities.has('user/fakeLib01/XFAKE002'));
  assert.ok(!identities.has('user/fakeLibForeign/XFOREIGN1'));
});

test('Q3-01 project papers preserve metadata, global status, note bytes and project-local Important', async (t) => {
  const { get, owner, wp02 } = await startServer(t);
  for (const [projectId, expectedRows, expectedImportant] of [
    ['project_synth_alpha', 2, { 'user/fakeLib01/XFAKE001': true, 'group/fakeLib02/XFAKE001': false }],
    ['project_synth_beta', 1, { 'user/fakeLib01/XFAKE001': false }],
    ['project_synth_gamma', 2, { 'user/fakeLib01/XFAKE001': false, 'user/fakeLib01/XFAKE002': true }],
  ]) {
    const r = await get(PROJECT_PAPERS_PATH(projectId), owner);
    assert.equal(r.status, 200, projectId);
    assert.equal(r.body.papers.length, expectedRows, projectId);
    for (const row of r.body.papers) {
      const id = `${row.libraryType}/${row.libraryId}/${row.itemKey}`;
      assert.equal(row.important, expectedImportant[id], `${projectId} ${id} important`);
      const fx = wp02.papers.find((p) => `${p.libraryType}/${p.libraryId}/${p.itemKey}` === id);
      assert.equal(row.title, fx.title);
      assert.deepEqual(row.creators, fx.creators);
      assert.equal(row.year, fx.year);
      assert.equal(row.doi, fx.doi);
      assert.equal(row.readingStatus, fx.readingStatus);
      assert.equal(row.noteState, fx.note ? 'PRESENT' : 'EMPTY');
      assert.match(row.readingStatusRevision, REVISION_RE);
      assert.match(row.importantRevision, REVISION_RE);
      assert.notEqual(row.readingStatusRevision, row.importantRevision);
    }
  }
});

test('Q3-01 paper detail exposes exact note bytes (CRLF, emoji, CJK) and only readable associations', async (t) => {
  const { get, owner, wp02 } = await startServer(t);
  const r = await get(PAPER_PATH(XFAKE001), owner);
  assert.equal(r.status, 200);
  const fx = wp02.papers.find((p) => p.libraryType === 'user' && p.itemKey === 'XFAKE001');
  assert.deepEqual(r.body.paper.note, fx.note);
  assert.equal(r.body.paper.note.limitations, fx.note.limitations);
  assert.ok(r.body.paper.note.limitations.includes('\r\n'));
  assert.ok(r.body.paper.note.limitations.includes('🧪'));
  assert.ok(r.body.paper.note.researchQuestion.includes('合成问题'));
  assert.equal(r.body.paper.readingStatus, 'Reading');
  assert.match(r.body.paper.readingStatusRevision, REVISION_RE);
  assert.deepEqual(r.body.associations.map((a) => a.projectId).sort(),
    ['project_synth_alpha', 'project_synth_beta', 'project_synth_gamma']);
  for (const a of r.body.associations) assert.match(a.importantRevision, REVISION_RE);
  const group = await get(PAPER_PATH(GROUP_XFAKE001), owner);
  assert.equal(group.status, 200);
  assert.equal(group.body.paper.note, null);
  assert.equal(group.body.paper.readingStatus, 'To Read');
  assert.equal(group.body.paper.title, 'Same Key Other Library');
  assert.deepEqual(group.body.associations.map((a) => a.projectId), ['project_synth_alpha']);
});

test('Q3-01 canonical tuple is exact and case sensitive; cross-library keys never merge', async (t) => {
  const { get, call, owner, runId, srv } = await startServer(t);
  const wrongCase = ['user', 'fakeLib01', 'xfake001'];
  const miss = await get(PAPER_PATH(wrongCase), owner);
  assert.equal(miss.status, 403);
  assert.equal(miss.body.error.code, 'NOT_AVAILABLE');
  const patch = await call('PATCH', `${PAPER_PATH(wrongCase)}/reading-status`, owner, {
    ifMatch: '"rev_does_not_matter"',
    body: { operationId: 'op_casefold_0001', modelRunId: runId, scope: 'GLOBAL_PAPER', action: 'SET_READING_STATUS', value: 'Read' },
  });
  assert.equal(patch.status, 403);
  assert.equal(patch.body.error.code, 'NOT_AVAILABLE');
  assert.equal(srv.control.stats().dispatches, 0);
  const userPaper = srv.control.paper([OWNER_SCOPE, ...XFAKE001]);
  const groupPaper = srv.control.paper([OWNER_SCOPE, ...GROUP_XFAKE001]);
  assert.notEqual(userPaper.key, groupPaper.key);
  assert.notEqual(userPaper.title, groupPaper.title);
  assert.equal(userPaper.title, 'Synthetic Shared Paper');
  assert.equal(groupPaper.title, 'Same Key Other Library');
});

test('Q3-01 identical title AND DOI never merge canonical papers', async (t) => {
  const { srv, wp02 } = await startServer(t);
  const fx1 = wp02.papers.find((p) => p.itemKey === 'XFAKE001' && p.libraryType === 'user');
  const fx2 = wp02.papers.find((p) => p.itemKey === 'XFAKE002' && p.libraryType === 'user');
  assert.equal(fx1.title, fx2.title);
  assert.equal(fx1.doi, fx2.doi);
  const p1 = srv.control.paper([OWNER_SCOPE, ...XFAKE001]);
  const p2 = srv.control.paper([OWNER_SCOPE, ...XFAKE002]);
  assert.notEqual(p1.key, p2.key);
  assert.equal(p1.readingStatus, 'Reading');
  assert.equal(p2.readingStatus, 'Read');
  assert.equal(srv.control.snapshot().papers.length, 4);
});

test('Q3-01 foreign-owner Project and paper are not visible through the owner scope', async (t) => {
  const { get, owner, srv } = await startServer(t);
  const project = await get(PROJECT_PAPERS_PATH('project_synth_foreign'), owner);
  assert.equal(project.status, 403);
  assert.equal(project.body.error.code, 'NOT_AVAILABLE');
  const foreignProjectGet = await get(PROJECT_PATH('project_synth_foreign'), owner);
  assert.equal(foreignProjectGet.status, 405, 'no single-Project GET exists in WP-03-R1');
  const paper = await get(PAPER_PATH(XFOREIGN1), owner);
  assert.equal(paper.status, 403);
  assert.equal(paper.body.error.code, 'NOT_AVAILABLE');
  const list = await get('/api/v1/projects?state=all', owner);
  assert.ok(!JSON.stringify(list.body).includes('project_synth_foreign'));
  assert.ok(!JSON.stringify(list.body).includes('owner_synth_foreign'));
  // The foreign records still exist, untouched, in the one WP-03 model.
  assert.equal(srv.control.snapshot().projects.filter((p) => p.ownerId === 'owner_synth_foreign').length, 1);
  const foreignKey = [FOREIGN_SCOPE, ...XFOREIGN1].join('\u0000');
  assert.ok(srv.control.snapshot().papers.some((p) => p.key === foreignKey), 'foreign paper exists in its own owner scope');
});

test('zz request tally for this file stays within the 5000-request per-instance budget', (t) => {
  const n = requestTally();
  t.diagnostic(`WP03_LOCAL_REQUESTS file=fixture-identity n=${n}`);
  assert.ok(n <= 5000);
});
