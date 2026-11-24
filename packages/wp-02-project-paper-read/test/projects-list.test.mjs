// Q2-03: state=active|archived|all filters equal the fixture `expected` lists; counts equal expected.projectCounts;
// the foreign Project never appears.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, requestTally } from '../support/harness.mjs';

const ids = (r) => r.body.projects.map((p) => p.id);

test('Q2-03 default and state=active return exactly expected.activeProjects', async (t) => {
  const { get, owner, wp02 } = await startServer(t);
  const def = await get('/api/v1/projects', owner.cookieValue);
  const act = await get('/api/v1/projects?state=active', owner.cookieValue);
  assert.equal(def.status, 200);
  assert.equal(def.body.state, 'active');
  assert.deepEqual(ids(def), wp02.expected.activeProjects);
  assert.deepEqual(ids(act), wp02.expected.activeProjects);
  assert.deepEqual(def.body, act.body);
});

test('Q2-03 state=archived returns exactly expected.archivedProjects (archived:true)', async (t) => {
  const { get, owner, wp02 } = await startServer(t);
  const r = await get('/api/v1/projects?state=archived', owner.cookieValue);
  assert.deepEqual(ids(r), wp02.expected.archivedProjects);
  assert.ok(r.body.projects.every((p) => p.archived === true));
});

test('Q2-03 state=all is the union; counts equal expected.projectCounts; no foreign Project', async (t) => {
  const { get, owner, wp02 } = await startServer(t);
  const r = await get('/api/v1/projects?state=all', owner.cookieValue);
  assert.deepEqual(ids(r).sort(), [...wp02.expected.activeProjects, ...wp02.expected.archivedProjects].sort());
  assert.ok(!ids(r).includes('project_synth_foreign'));
  for (const p of r.body.projects) {
    const exp = wp02.expected.projectCounts[p.id];
    assert.equal(p.paperCount, exp.papers, `${p.id} papers`);
    assert.equal(p.importantCount, exp.important, `${p.id} important`);
    const fx = wp02.projects.find((x) => x.id === p.id);
    assert.deepEqual({ id: p.id, name: p.name, archived: p.archived, revision: p.revision },
      { id: fx.id, name: fx.name, archived: fx.archived, revision: fx.revision });
  }
  assert.deepEqual(Object.keys(r.body.projects[0]).sort(), ['archived', 'id', 'importantCount', 'name', 'paperCount', 'revision']);
});

test('Q2-03 the foreign Project never appears in any state and no owner id is exposed', async (t) => {
  const { get, owner, workspace } = await startServer(t);
  for (const c of [owner.cookieValue, workspace.cookieValue]) {
    for (const s of ['active', 'archived', 'all']) {
      const r = await get(`/api/v1/projects?state=${s}`, c);
      assert.equal(r.status, 200);
      const text = JSON.stringify(r.body);
      assert.ok(!text.includes('foreign'), `${s}: foreign leaked`);
      assert.ok(!text.includes('owner_synth'), `${s}: owner id leaked`);
    }
  }
});

test('Q2-03 invalid, repeated or unknown query parameters are rejected (400), not silently defaulted', async (t) => {
  const { get, owner } = await startServer(t);
  for (const q of ['?state=ALL', '?state=', '?state=deleted', '?state=all&state=active', '?archived=true', '?state=all&x=1']) {
    const r = await get(`/api/v1/projects${q}`, owner.cookieValue);
    assert.equal(r.status, 400, q);
    assert.equal(r.body.error.code, 'INVALID_QUERY');
  }
});

test('zz request tally for this file stays within the 5000-request cap', (t) => {
  const n = requestTally();
  t.diagnostic(`WP02_LOCAL_REQUESTS file=projects-list n=${n}`);
  assert.ok(n <= 5000);
});
