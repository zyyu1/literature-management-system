// Q2-01 (A6-01) and Q2-02 (A6-02): canonical paper identity is (ownerScope, libraryType, libraryId, itemKey).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCatalog } from '../src/catalog.mjs';
import {
  startServer, loadFixtures, requestTally, PAPER_PATH, XFAKE001, GROUP_XFAKE001, XFAKE002,
} from '../support/harness.mjs';

const ALL = ['project_synth_alpha', 'project_synth_beta', 'project_synth_gamma'];
const sameTuple = (r, t) => r.libraryType === t[0] && r.libraryId === t[1] && r.itemKey === t[2];

test('Q2-01 A6-01 XFAKE001 is ONE canonical paper linked to alpha, beta and gamma', async (t) => {
  const { get, owner, srv, wp02 } = await startServer(t);
  assert.equal(srv.catalog.counts().papers, wp02.expected.canonicalPaperCount);
  const views = [];
  for (const id of ALL) {
    const r = await get(`/api/v1/projects/${id}/papers`, owner.cookieValue);
    assert.equal(r.status, 200);
    const rows = r.body.papers.filter((x) => sameTuple(x, XFAKE001));
    assert.equal(rows.length, 1, `exactly one XFAKE001 row in ${id}`);
    views.push(rows[0]);
  }
  // Global fields are identical through every Project.
  for (const v of views) {
    assert.equal(v.title, 'Synthetic Shared Paper');
    assert.equal(v.readingStatus, 'Reading');
    assert.equal(v.noteState, 'PRESENT');
  }
  const d = await get(PAPER_PATH(XFAKE001), owner.cookieValue);
  assert.equal(d.status, 200);
  assert.deepEqual(d.body.associations.map((a) => a.projectId), ALL);
});

test('Q2-01 A6-01 seeded re-import into gamma creates no second paper and no second link; counts unchanged', async (t) => {
  const { get, owner, srv, wp02 } = await startServer(t, { allowSeedChange: true });
  const attempt = wp02.importAttempts[0];
  assert.equal(attempt.projectId, 'project_synth_gamma');
  assert.deepEqual(attempt.paper, XFAKE001);
  const before = srv.catalog.counts();
  const digest = srv.catalog.stateDigest();
  const res = srv.catalog.seedImport(attempt.projectId, attempt.paper);
  assert.deepEqual(res, { paperCreated: false, associationCreated: false });
  assert.deepEqual(srv.catalog.counts(), before);
  assert.equal(srv.catalog.stateDigest(), digest);
  const g = await get('/api/v1/projects/project_synth_gamma/papers', owner.cookieValue);
  assert.equal(g.body.papers.length, wp02.expected.projectCounts.project_synth_gamma.papers);
  assert.equal(g.body.papers.filter((x) => sameTuple(x, XFAKE001)).length, 1);
  const list = await get('/api/v1/projects?state=all', owner.cookieValue);
  for (const p of list.body.projects) {
    assert.equal(p.paperCount, wp02.expected.projectCounts[p.id].papers, p.id);
    assert.equal(p.importantCount, wp02.expected.projectCounts[p.id].important, p.id);
  }
});

test('Q2-02 A6-02 same itemKey in another library is a DIFFERENT paper with its own status and note', async (t) => {
  const { get, owner } = await startServer(t);
  const a = await get(PAPER_PATH(XFAKE001), owner.cookieValue);
  const b = await get(PAPER_PATH(GROUP_XFAKE001), owner.cookieValue);
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  assert.equal(a.body.paper.itemKey, b.body.paper.itemKey);
  assert.notEqual(a.body.paper.libraryId, b.body.paper.libraryId);
  assert.equal(b.body.paper.title, 'Same Key Other Library');
  assert.equal(b.body.paper.readingStatus, 'To Read');
  assert.equal(b.body.paper.note, null);
  assert.notDeepEqual(a.body.paper.note, b.body.paper.note);
  assert.deepEqual(b.body.associations, [{ projectId: 'project_synth_alpha', archived: false, important: false }]);
});

test('Q2-02 identical title AND DOI never merge: XFAKE002 is distinct from XFAKE001', async (t) => {
  const { get, owner } = await startServer(t);
  const a = (await get(PAPER_PATH(XFAKE001), owner.cookieValue)).body;
  const c = (await get(PAPER_PATH(XFAKE002), owner.cookieValue)).body;
  assert.equal(a.paper.title, c.paper.title);
  assert.equal(a.paper.doi, c.paper.doi);
  assert.deepEqual(a.paper.creators, c.paper.creators);
  assert.equal(c.paper.readingStatus, 'Read');
  assert.equal(a.paper.readingStatus, 'Reading');
  assert.equal(c.paper.note, null);
  assert.notEqual(a.paper.note, null);
  assert.deepEqual(c.associations, [{ projectId: 'project_synth_gamma', archived: false, important: true }]);
  const g = await get('/api/v1/projects/project_synth_gamma/papers', owner.cookieValue);
  assert.equal(g.body.papers.length, 2, 'both same-title papers listed separately in gamma');
});

test('Q2-01/Q2-02 owner sees exactly the expected number of distinct canonical papers across all Projects', async (t) => {
  const { get, owner, wp02 } = await startServer(t);
  const seen = new Set();
  for (const id of ALL) {
    const r = await get(`/api/v1/projects/${id}/papers`, owner.cookieValue);
    for (const x of r.body.papers) seen.add(`${x.libraryType}/${x.libraryId}/${x.itemKey}`);
  }
  assert.equal(seen.size, wp02.expected.ownerVisibleCanonicalPapers);
  assert.deepEqual([...seen].sort(), ['group/fakeLib02/XFAKE001', 'user/fakeLib01/XFAKE001', 'user/fakeLib01/XFAKE002']);
});

test('STOP guard: a duplicated global paper in a (copied) fixture is refused at load', () => {
  const { wp02 } = loadFixtures();
  const dup = structuredClone(wp02);
  dup.papers.push({ ...structuredClone(wp02.papers[0]), title: 'renamed duplicate' });
  assert.throws(() => createCatalog(dup), /STOP: duplicated global paper/);
  const dupLink = structuredClone(wp02);
  dupLink.associations.push(structuredClone(wp02.associations[0]));
  assert.throws(() => createCatalog(dupLink), /STOP: duplicated association/);
  const crossOwner = structuredClone(wp02);
  crossOwner.associations.push({ projectId: 'project_synth_alpha', paper: ['user', 'fakeLibForeign', 'XFOREIGN1'], important: false });
  assert.throws(() => createCatalog(crossOwner), /cross-owner links are impossible/);
});

test('zz request tally for this file stays within the 5000-request cap', (t) => {
  const n = requestTally();
  t.diagnostic(`WP02_LOCAL_REQUESTS file=identity n=${n}`);
  assert.ok(n <= 5000);
});
