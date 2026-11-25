// Q3-02: Project create / rename / archive / restore with exact If-None-Match / If-Match guards,
// collision handling, operation replay, two-client CAS, Unicode-preserving names and lifecycle rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  startServer, requestTally, createBody, projectPatchBody, createBody as _createBody,
  PROJECT_PATH, PROJECT_PAPERS_PATH, XFAKE001, XFAKE002, associationBy, projectById, paperByKey,
} from '../support/harness.mjs';
import { REVISION_RE } from '../src/model.mjs';
import { ACTION, SCOPE } from '../src/contract.mjs';

const DELTA = 'project_synth_delta';

async function projectRows(ctx, id) {
  const r = await ctx.get(PROJECT_PAPERS_PATH(id), ctx.owner);
  assert.equal(r.status, 200, `read ${id}`);
  return r.body;
}

test('Q3-02 create an empty active Project with If-None-Match: * and a model-only CONFIRMED outcome', async (t) => {
  const ctx = await startServer(t);
  const body = createBody(ctx.runId, DELTA, 'Δ 合成 Project ✓');
  const before = ctx.srv.control.snapshot();
  const r = await ctx.call('POST', '/api/v1/projects', ctx.owner, { body, ifNoneMatch: '*' });
  assert.equal(r.status, 201);
  assert.equal(r.body.outcome, 'CONFIRMED');
  assert.equal(r.body.outcomeBasis, 'MODEL_ONLY');
  assert.equal(r.body.saved, false);
  assert.equal(r.body.durable, false);
  assert.equal(r.body.simulated, true);
  assert.equal(r.body.dispatched, true);
  assert.equal(r.body.replayed, false);
  assert.equal(r.body.operationId, body.operationId);
  assert.equal(r.body.runId, ctx.runId);
  assert.match(r.body.revision, REVISION_RE);
  assert.deepEqual(r.body.resource, { kind: 'project', id: DELTA, name: 'Δ 合成 Project ✓', archived: false, revision: r.body.revision });
  assert.ok(!JSON.stringify(r.body).includes('owner_synth'));
  const after = ctx.srv.control.snapshot();
  assert.deepEqual(after.counts, { projects: 5, papers: 4, associations: 6 });
  const created = projectById(after, DELTA);
  assert.equal(created.name, 'Δ 合成 Project ✓');
  assert.equal(created.archived, false);
  assert.equal(created.revision, r.body.revision);
  const rows = await projectRows(ctx, DELTA);
  assert.deepEqual(rows.papers, []);
  assert.equal(rows.archived, false);
  const active = await ctx.get('/api/v1/projects?state=active', ctx.owner);
  assert.ok(active.body.projects.some((p) => p.id === DELTA));
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.stats().commits, 1);
  assert.equal(ctx.srv.control.ledgerSize(), 1);
  void before;
});

test('Q3-02 create requires exactly If-None-Match: * and rejects unexpected conditional headers', async (t) => {
  const ctx = await startServer(t);
  const body = createBody(ctx.runId, DELTA, 'Delta');
  const digest = ctx.srv.control.stateDigest();
  const ledger = ctx.srv.control.ledgerSize();
  const cases = [
    [{}, 428, 'PRECONDITION_REQUIRED', 'CONFLICT'],
    [{ ifNoneMatch: '""' }, 400, 'INVALID_PRECONDITION', 'DEFINITE_FAILURE'],
    [{ ifNoneMatch: '"*"' }, 400, 'INVALID_PRECONDITION', 'DEFINITE_FAILURE'],
    [{ ifNoneMatch: '*, *' }, 400, 'INVALID_PRECONDITION', 'DEFINITE_FAILURE'],
    [{ ifNoneMatch: '*', extraHeaders: { 'If-Match': '"x"' } }, 400, 'UNEXPECTED_CONDITIONAL', 'DEFINITE_FAILURE'],
    [{ ifNoneMatch: '*', extraHeaders: { 'If-Unmodified-Since': 'Wed, 01 Jan 2030 00:00:00 GMT' } }, 400, 'UNEXPECTED_CONDITIONAL', 'DEFINITE_FAILURE'],
  ];
  for (const [opts, status, code, outcome] of cases) {
    const r = await ctx.call('POST', '/api/v1/projects', ctx.owner, { body, ...opts });
    assert.equal(r.status, status, `${JSON.stringify(opts)} -> ${status}`);
    assert.equal(r.body.error.code, code);
    assert.equal(r.body.dispatched, false);
    assert.equal(r.body.outcome, outcome);
    assert.equal(r.body.saved, false);
  }
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.ledgerSize(), ledger);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(projectById(ctx.srv.control.snapshot(), DELTA), null);
});

test('Q3-02 create collision is 412 and never overwrites or reuses the existing Project', async (t) => {
  const ctx = await startServer(t);
  const before = projectById(ctx.srv.control.snapshot(), 'project_synth_alpha');
  const body = createBody(ctx.runId, 'project_synth_alpha', 'Overwrite attempt');
  const r = await ctx.call('POST', '/api/v1/projects', ctx.owner, { body, ifNoneMatch: '*' });
  assert.equal(r.status, 412);
  assert.equal(r.body.error.code, 'PROJECT_EXISTS');
  assert.equal(r.body.outcome, 'CONFLICT');
  assert.equal(r.body.dispatched, false);
  const after = projectById(ctx.srv.control.snapshot(), 'project_synth_alpha');
  assert.deepEqual(after, before);
  assert.equal(ctx.srv.control.snapshot().counts.projects, 4);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  // A foreign-owned ID collides byte-identically: the response never reveals ownership.
  const foreignBody = createBody(ctx.runId, 'project_synth_foreign', 'Foreign collision');
  const foreign = await ctx.call('POST', '/api/v1/projects', ctx.owner, { body: foreignBody, ifNoneMatch: '*' });
  assert.equal(foreign.status, 412);
  assert.deepEqual(foreign.body, r.body);
  assert.equal(foreign.headers['content-length'], r.headers['content-length']);
  assert.ok(!JSON.stringify(foreign.body).includes('owner_synth'));
  assert.equal(ctx.srv.control.snapshot().counts.projects, 4);
});

test('Q3-02 repeating the same create operation never duplicates the Project (replay, no dispatch)', async (t) => {
  const ctx = await startServer(t);
  const body = createBody(ctx.runId, DELTA, 'Delta');
  const first = await ctx.call('POST', '/api/v1/projects', ctx.owner, { body, ifNoneMatch: '*' });
  assert.equal(first.status, 201);
  const again = await ctx.call('POST', '/api/v1/projects', ctx.owner, { body, ifNoneMatch: '*' });
  assert.equal(again.status, 200);
  assert.equal(again.body.replayed, true);
  assert.equal(again.body.dispatched, false);
  assert.equal(again.body.saved, false);
  assert.equal(again.body.durable, false);
  assert.equal(again.body.outcome, 'CONFIRMED');
  assert.equal(again.body.outcomeBasis, 'MODEL_ONLY');
  assert.equal(again.body.revision, first.body.revision);
  assert.equal(ctx.srv.control.snapshot().counts.projects, 5);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.stats().commits, 1);
  assert.equal(ctx.srv.control.ledgerSize(), 1);
  // A NEW operationId for an already-created ID is a collision, not a replay.
  const other = await ctx.call('POST', '/api/v1/projects', ctx.owner, { body: createBody(ctx.runId, DELTA, 'Delta'), ifNoneMatch: '*' });
  assert.equal(other.status, 412);
});

test('Q3-02 two same-owner Sessions racing the same create operation commit exactly once', async (t) => {
  const ctx = await startServer(t);
  ctx.srv.control.setGateDelayMs(25);
  const body = createBody(ctx.runId, DELTA, 'Raced Delta');
  const [a, b] = await Promise.all([
    ctx.call('POST', '/api/v1/projects', ctx.owner, { body, ifNoneMatch: '*' }),
    ctx.call('POST', '/api/v1/projects', ctx.ownerSecond, { body, ifNoneMatch: '*' }),
  ]);
  assert.deepEqual([a.status, b.status].sort(), [200, 201]);
  assert.equal(ctx.srv.control.snapshot().counts.projects, 5);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
  assert.equal(ctx.srv.control.stats().commits, 1);
  assert.equal(ctx.srv.control.ledgerSize(), 1);
});

test('Q3-02 two independent creates for the same new ID reject the loser with 412', async (t) => {
  const ctx = await startServer(t);
  ctx.srv.control.setGateDelayMs(25);
  const [a, b] = await Promise.all([
    ctx.call('POST', '/api/v1/projects', ctx.owner, { body: createBody(ctx.runId, DELTA, 'A'), ifNoneMatch: '*' }),
    ctx.call('POST', '/api/v1/projects', ctx.ownerSecond, { body: createBody(ctx.runId, DELTA, 'B'), ifNoneMatch: '*' }),
  ]);
  assert.deepEqual([a.status, b.status].sort(), [201, 412]);
  const loser = a.status === 412 ? a : b;
  assert.equal(loser.body.error.code, 'PROJECT_EXISTS');
  const created = projectById(ctx.srv.control.snapshot(), DELTA);
  const winner = a.status === 201 ? a : b;
  assert.equal(created.name, winner.body.resource.name);
  assert.equal(ctx.srv.control.stats().dispatches, 1);
});

test('Q3-02 rename preserves links, global status, note bytes and Important while changing the revision', async (t) => {
  const ctx = await startServer(t);
  const before = await projectRows(ctx, 'project_synth_alpha');
  const beforePaper = ctx.srv.control.paper(['owner_synth_001', ...XFAKE001]);
  const beforeAssoc = ctx.srv.control.association('project_synth_alpha', ['owner_synth_001', ...XFAKE001]);
  const revision = before.project.revision;
  const body = projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'Alpha 综述 — renamed ✓' });
  const r = await ctx.call('PATCH', PROJECT_PATH('project_synth_alpha'), ctx.owner, { body, ifMatch: `"${revision}"` });
  assert.equal(r.status, 200);
  assert.equal(r.body.outcome, 'CONFIRMED');
  assert.equal(r.body.saved, false);
  assert.match(r.body.revision, REVISION_RE);
  assert.notEqual(r.body.revision, revision);
  assert.equal(r.body.resource.name, 'Alpha 综述 — renamed ✓');
  const after = await projectRows(ctx, 'project_synth_alpha');
  assert.equal(after.project.name, 'Alpha 综述 — renamed ✓');
  assert.deepEqual(after.papers, before.papers, 'every association row is untouched');
  assert.deepEqual(ctx.srv.control.paper(['owner_synth_001', ...XFAKE001]), beforePaper, 'global ReadingStatus/note untouched');
  assert.deepEqual(ctx.srv.control.association('project_synth_alpha', ['owner_synth_001', ...XFAKE001]), beforeAssoc, 'Important untouched');
  // The old revision is now stale; the new one guards the next edit.
  const stale = await ctx.call('PATCH', PROJECT_PATH('project_synth_alpha'), ctx.owner, {
    body: projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'stale edit' }), ifMatch: `"${revision}"`,
  });
  assert.equal(stale.status, 412);
  assert.equal(stale.body.currentRevision, r.body.revision);
});

test('Q3-02 rename and create reject invalid names and forged/unknown body fields (422/400)', async (t) => {
  const ctx = await startServer(t);
  const alpha = projectById(ctx.srv.control.snapshot(), 'project_synth_alpha');
  const badNames = ['', '   ', 'line\nbreak', 'tab\tname', 'nul\u0000name', 'del\u007fchar', 'c1\u0085control', 'ÿ'.repeat(129), '\ud800'];
  for (const name of badNames) {
    const r = await ctx.call('PATCH', PROJECT_PATH('project_synth_alpha'), ctx.owner, {
      body: projectPatchBody(ctx.runId, ACTION.RENAME, { name }), ifMatch: `"${alpha.revision}"`,
    });
    assert.equal(r.status, 422, JSON.stringify(name));
    assert.equal(r.body.error.code, 'INVALID_NAME');
  }
  const tooLong = 'a'.repeat(257);
  const longRes = await ctx.call('POST', '/api/v1/projects', ctx.owner, {
    body: createBody(ctx.runId, DELTA, tooLong), ifNoneMatch: '*',
  });
  assert.equal(longRes.status, 422);
  assert.equal(longRes.body.error.code, 'INVALID_NAME');
  const unknown = await ctx.call('POST', '/api/v1/projects', ctx.owner, {
    body: { ...createBody(ctx.runId, DELTA, 'Delta'), ownerId: 'owner_synth_foreign' }, ifNoneMatch: '*',
  });
  assert.equal(unknown.status, 400);
  assert.equal(unknown.body.error.code, 'UNKNOWN_FIELD');
  for (const field of ['role', 'revision', 'stepUp', 'riskTier', 'fault', 'confirmation', 'value']) {
    const r = await ctx.call('POST', '/api/v1/projects', ctx.owner, {
      body: { ...createBody(ctx.runId, DELTA, 'Delta'), [field]: 'x' }, ifNoneMatch: '*',
    });
    assert.equal(r.status, 400, field);
    assert.equal(r.body.error.code, 'UNKNOWN_FIELD');
  }
  const badScope = await ctx.call('POST', '/api/v1/projects', ctx.owner, {
    body: { ...createBody(ctx.runId, DELTA, 'Delta'), scope: SCOPE.GLOBAL_PAPER }, ifNoneMatch: '*',
  });
  assert.equal(badScope.status, 400);
  assert.equal(badScope.body.error.code, 'SCOPE_MISMATCH');
  const badAction = await ctx.call('POST', '/api/v1/projects', ctx.owner, {
    body: { ...createBody(ctx.runId, DELTA, 'Delta'), action: ACTION.RENAME }, ifNoneMatch: '*',
  });
  assert.equal(badAction.status, 422);
  assert.equal(badAction.body.error.code, 'UNSUPPORTED_ACTION');
  const badRun = await ctx.call('POST', '/api/v1/projects', ctx.owner, {
    body: { ...createBody(ctx.runId, DELTA, 'Delta'), modelRunId: 'run_' + 'a'.repeat(20) }, ifNoneMatch: '*',
  });
  assert.equal(badRun.status, 409);
  assert.equal(badRun.body.error.code, 'STALE_MODEL_RUN');
  assert.equal(ctx.srv.control.snapshot().counts.projects, 4);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q3-02 name bounds: 256 UTF-8 bytes accepted and preserved exactly, surrounding spaces are not trimmed', async (t) => {
  const ctx = await startServer(t);
  const exact = 'é'.repeat(128); // 256 UTF-8 bytes
  assert.equal(Buffer.byteLength(exact, 'utf8'), 256);
  const r = await ctx.call('POST', '/api/v1/projects', ctx.owner, {
    body: createBody(ctx.runId, DELTA, exact), ifNoneMatch: '*',
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.resource.name, exact);
  const padded = '  Padded Name  ';
  const r2 = await ctx.call('POST', '/api/v1/projects', ctx.owner, {
    body: createBody(ctx.runId, 'project_synth_epsilon', padded), ifNoneMatch: '*',
  });
  assert.equal(r2.status, 201);
  assert.equal(r2.body.resource.name, padded);
  const list = await ctx.get('/api/v1/projects?state=all', ctx.owner);
  assert.equal(list.body.projects.filter((p) => p.id === DELTA)[0].name, exact);
  assert.equal(list.body.projects.filter((p) => p.id === 'project_synth_epsilon')[0].name, padded);
});

test('Q3-02 name uniqueness is not enforced', async (t) => {
  const ctx = await startServer(t);
  const r = await ctx.call('POST', '/api/v1/projects', ctx.owner, {
    body: createBody(ctx.runId, DELTA, 'Alpha 综述'), ifNoneMatch: '*',
  });
  assert.equal(r.status, 201);
  assert.equal(ctx.srv.control.snapshot().projects.filter((p) => p.name === 'Alpha 综述').length, 2);
});

test('Q3-02 archive/restore preserve ID, links, Important and note; archived Projects leave the active list', async (t) => {
  const ctx = await startServer(t);
  const beforeRows = await projectRows(ctx, 'project_synth_alpha');
  const beforePaper = ctx.srv.control.paper(['owner_synth_001', ...XFAKE001]);
  const beforeAssoc = ctx.srv.control.association('project_synth_alpha', ['owner_synth_001', ...XFAKE001]);
  let revision = beforeRows.project.revision;

  const archived = await ctx.call('PATCH', PROJECT_PATH('project_synth_alpha'), ctx.owner, {
    body: projectPatchBody(ctx.runId, ACTION.ARCHIVE), ifMatch: `"${revision}"`,
  });
  assert.equal(archived.status, 200);
  assert.equal(archived.body.resource.archived, true);
  assert.notEqual(archived.body.revision, revision);
  revision = archived.body.revision;
  const active = await ctx.get('/api/v1/projects?state=active', ctx.owner);
  assert.ok(!active.body.projects.some((p) => p.id === 'project_synth_alpha'));
  const archivedList = await ctx.get('/api/v1/projects?state=archived', ctx.owner);
  assert.ok(archivedList.body.projects.some((p) => p.id === 'project_synth_alpha'));
  const archivedRows = await projectRows(ctx, 'project_synth_alpha');
  assert.equal(archivedRows.archived, true);
  assert.deepEqual(archivedRows.papers, beforeRows.papers);
  assert.deepEqual(ctx.srv.control.paper(['owner_synth_001', ...XFAKE001]), beforePaper);
  assert.deepEqual(ctx.srv.control.association('project_synth_alpha', ['owner_synth_001', ...XFAKE001]), beforeAssoc);

  const restored = await ctx.call('PATCH', PROJECT_PATH('project_synth_alpha'), ctx.owner, {
    body: projectPatchBody(ctx.runId, ACTION.RESTORE), ifMatch: `"${revision}"`,
  });
  assert.equal(restored.status, 200);
  assert.equal(restored.body.resource.archived, false);
  assert.notEqual(restored.body.revision, revision);
  const after = await projectRows(ctx, 'project_synth_alpha');
  assert.equal(after.project.id, 'project_synth_alpha');
  assert.deepEqual(after.papers, beforeRows.papers);
  assert.deepEqual(ctx.srv.control.paper(['owner_synth_001', ...XFAKE001]), beforePaper);
  const activeAgain = await ctx.get('/api/v1/projects?state=active', ctx.owner);
  assert.ok(activeAgain.body.projects.some((p) => p.id === 'project_synth_alpha'));
});

test('Q3-02 invalid lifecycle transitions are 409 and change nothing', async (t) => {
  const ctx = await startServer(t);
  const beta = projectById(ctx.srv.control.snapshot(), 'project_synth_beta');
  const alpha = projectById(ctx.srv.control.snapshot(), 'project_synth_alpha');
  const digest = ctx.srv.control.stateDigest();
  for (const [id, action, revision] of [
    ['project_synth_beta', ACTION.ARCHIVE, beta.revision],
    ['project_synth_alpha', ACTION.RESTORE, alpha.revision],
  ]) {
    const r = await ctx.call('PATCH', PROJECT_PATH(id), ctx.owner, {
      body: projectPatchBody(ctx.runId, action), ifMatch: `"${revision}"`,
    });
    assert.equal(r.status, 409);
    assert.equal(r.body.error.code, 'INVALID_TRANSITION');
    assert.equal(r.body.outcome, 'CONFLICT');
    assert.equal(r.body.dispatched, false);
    assert.equal(r.body.saved, false);
  }
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
  assert.deepEqual(projectById(ctx.srv.control.snapshot(), 'project_synth_beta'), beta);
});

test('Q3-02 rename on an archived Project is allowed; archive/restore never touch other Projects', async (t) => {
  const ctx = await startServer(t);
  const beta = projectById(ctx.srv.control.snapshot(), 'project_synth_beta');
  const beforeAlpha = projectById(ctx.srv.control.snapshot(), 'project_synth_alpha');
  const gamma = projectById(ctx.srv.control.snapshot(), 'project_synth_gamma');
  const r = await ctx.call('PATCH', PROJECT_PATH('project_synth_beta'), ctx.owner, {
    body: projectPatchBody(ctx.runId, ACTION.RENAME, { name: 'Beta renamed while archived' }),
    ifMatch: `"${beta.revision}"`,
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.resource.archived, true);
  assert.equal(r.body.resource.name, 'Beta renamed while archived');
  assert.deepEqual(projectById(ctx.srv.control.snapshot(), 'project_synth_alpha'), beforeAlpha);
  assert.deepEqual(projectById(ctx.srv.control.snapshot(), 'project_synth_gamma'), gamma);
  const rows = await ctx.get(PROJECT_PAPERS_PATH('project_synth_beta'), ctx.owner);
  assert.equal(rows.body.papers.length, 1);
  assert.equal(rows.body.papers[0].itemKey, 'XFAKE001');
  assert.equal(rows.body.papers[0].important, false);
  void XFAKE002;
  void associationBy;
  void paperByKey;
});

test('zz request tally for this file stays within the 5000-request per-instance budget', (t) => {
  const n = requestTally();
  t.diagnostic(`WP03_LOCAL_REQUESTS file=project-writes n=${n}`);
  assert.ok(n <= 5000);
});
