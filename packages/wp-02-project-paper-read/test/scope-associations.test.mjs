// Q2-04 global vs local (E9-02, U6-L4-01), Q2-05 detail associations, Q2-09 note bytes (R-BYTES).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, requestTally, PAPER_PATH, XFAKE001, XFAKE002, GROUP_XFAKE001 } from '../support/harness.mjs';

const NOTE_KEYS = ['researchQuestion', 'argumentsAndContent', 'theoriesAndMethods', 'contributionsAndInnovations', 'limitations'];
const row = (r, t) => r.body.papers.find((x) => x.libraryType === t[0] && x.libraryId === t[1] && x.itemKey === t[2]);

test('Q2-04 readingStatus and note are GLOBAL: identical through alpha, beta (archived) and gamma', async (t) => {
  const { get, owner } = await startServer(t);
  for (const id of ['project_synth_alpha', 'project_synth_beta', 'project_synth_gamma']) {
    const x = row(await get(`/api/v1/projects/${id}/papers`, owner.cookieValue), XFAKE001);
    assert.equal(x.readingStatus, 'Reading', id);
    assert.equal(x.noteState, 'PRESENT', id);
  }
});

test('Q2-04 important is PROJECT-LOCAL: XFAKE001 important only in alpha', async (t) => {
  const { get, owner } = await startServer(t);
  const imp = {};
  for (const id of ['project_synth_alpha', 'project_synth_beta', 'project_synth_gamma']) {
    imp[id] = row(await get(`/api/v1/projects/${id}/papers`, owner.cookieValue), XFAKE001).important;
  }
  assert.deepEqual(imp, { project_synth_alpha: true, project_synth_beta: false, project_synth_gamma: false });
  const d = await get(PAPER_PATH(XFAKE001), owner.cookieValue);
  assert.deepEqual(d.body.associations.map((a) => [a.projectId, a.important]),
    [['project_synth_alpha', true], ['project_synth_beta', false], ['project_synth_gamma', false]]);
  assert.equal(d.body.paper.important, undefined, 'no paper-level (global) important flag');
  // XFAKE002 is important in gamma; that does not make XFAKE001 important in gamma.
  assert.equal(row(await get('/api/v1/projects/project_synth_gamma/papers', owner.cookieValue), XFAKE002).important, true);
});

test('Q2-04 noteState is EMPTY for papers without a note, PRESENT otherwise', async (t) => {
  const { get, owner } = await startServer(t);
  const a = await get('/api/v1/projects/project_synth_alpha/papers', owner.cookieValue);
  assert.equal(row(a, GROUP_XFAKE001).noteState, 'EMPTY');
  assert.equal(row(a, XFAKE001).noteState, 'PRESENT');
  for (const x of a.body.papers) assert.equal(x.note, undefined, 'list rows carry noteState, not note text');
});

test('Q2-05 detail associations list alpha, beta (archived:true) and gamma only — never the foreign Project', async (t) => {
  const { get, owner } = await startServer(t);
  const d = await get(PAPER_PATH(XFAKE001), owner.cookieValue);
  assert.deepEqual(d.body.associations, [
    { projectId: 'project_synth_alpha', archived: false, important: true },
    { projectId: 'project_synth_beta', archived: true, important: false },
    { projectId: 'project_synth_gamma', archived: false, important: false },
  ]);
  assert.ok(!JSON.stringify(d.body).includes('foreign'));
});

test('Q2-05 archived Project is readable and carries archived:true', async (t) => {
  const { get, owner } = await startServer(t);
  const b = await get('/api/v1/projects/project_synth_beta/papers', owner.cookieValue);
  assert.equal(b.status, 200);
  assert.equal(b.body.archived, true);
  assert.equal(b.body.project.archived, true);
  assert.equal(b.body.papers.length, 1);
});

test('Q2-09 R-BYTES the five note fields are byte-identical to the fixture (no NFC, trim or CRLF rewrite)', async (t) => {
  const { get, owner, wp02, client } = await startServer(t);
  const fx = wp02.papers.find((p) => p.libraryType === 'user' && p.itemKey === 'XFAKE001').note;
  const d = await get(PAPER_PATH(XFAKE001), owner.cookieValue);
  assert.deepEqual(Object.keys(d.body.paper.note), NOTE_KEYS);
  for (const k of NOTE_KEYS) {
    assert.ok(Buffer.from(d.body.paper.note[k], 'utf8').equals(Buffer.from(fx[k], 'utf8')), k);
  }
  assert.ok(fx.limitations.includes('\r\n'));
  assert.ok(d.body.paper.note.limitations.includes('\r\n'), 'CRLF preserved');
  assert.ok(d.body.paper.note.limitations.includes('\u{1F9EA}'), 'emoji preserved');
  assert.ok(d.body.paper.note.argumentsAndContent.includes('$\\sum_{i=1}^{n} x_i$'), 'formula preserved');
  assert.ok(d.body.paper.note.researchQuestion.includes('Ünïcödé'), 'precomposed Unicode preserved');
  assert.notEqual(d.body.paper.note.researchQuestion, d.body.paper.note.researchQuestion.normalize('NFD'));
  // Raw wire bytes: the JSON text carries the escaped CRLF exactly once per occurrence.
  const raw = await new Promise((resolve, reject) => {
    import('node:http').then(({ default: http }) => {
      const req = http.request({ host: '127.0.0.1', port: client.port, path: PAPER_PATH(XFAKE001), method: 'GET', agent: false,
        headers: { Cookie: `__Host-lms_session=${owner.cookieValue}` } }, (res) => {
        const c = []; res.on('data', (x) => c.push(x)); res.on('end', () => resolve(Buffer.concat(c)));
      });
      req.on('error', reject); req.end();
    });
  });
  const expectedFragment = Buffer.from(JSON.stringify(fx.limitations), 'utf8');
  assert.ok(raw.includes(expectedFragment), 'response bytes contain the exact JSON encoding of the fixture text');
});

test('zz request tally for this file stays within the 5000-request cap', (t) => {
  const n = requestTally();
  t.diagnostic(`WP02_LOCAL_REQUESTS file=scope-associations n=${n}`);
  assert.ok(n <= 5000);
});
