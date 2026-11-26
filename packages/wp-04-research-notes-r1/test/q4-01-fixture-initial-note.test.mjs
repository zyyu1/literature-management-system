// Q4-01: frozen fixture bytes/hashes; the initial note exists only for user/fakeLib01/XFAKE001
// with byte-exact five fields; absent notes have no revision or invented text; runId and note
// revisions are opaque and fresh per instance; the canonical tuple is exact and case-sensitive.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import {
  startServer, requestTally, loadRawFixtures, RESEARCH_NOTE_PATH,
  XFAKE001, GROUP_XFAKE001, XFAKE002, OWNER_SCOPE, WP01_FIXTURE_URL, WP02_FIXTURE_URL, NOTE_KEYS,
} from '../support/harness.mjs';
import { REVISION_RE, RUN_ID_RE } from '../src/model.mjs';

const WP01_SHA = '86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65';
const WP02_SHA = 'c4fc68afb0a1660c109c4af24620ff17279161d8e3b8e02cdf286d3e060bf888';

test('Q4-01 frozen fixture raw bytes and SHA-256 match the design oracle and exactly one initial note exists', async (t) => {
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
  assert.deepEqual(srv.control.snapshot().counts, { papers: 4, notes: 1 });
  assert.deepEqual(srv.control.initialNoteTuples(), [[OWNER_SCOPE, ...XFAKE001]]);
  assert.equal(srv.control.note([OWNER_SCOPE, ...XFAKE001]).exists, true);
  assert.equal(srv.control.note([OWNER_SCOPE, ...XFAKE002]).exists, false);
  assert.equal(srv.control.note([OWNER_SCOPE, ...GROUP_XFAKE001]).exists, false);
  assert.deepEqual(srv.fixtures, fx.verified);
});

test('Q4-01 the initial note is byte-exact for user/fakeLib01/XFAKE001 and absent notes carry no revision or invented text', async (t) => {
  const { get, owner, workspace, wp02 } = await startServer(t);
  const fixtureNote = wp02.papers.find((p) => p.libraryType === 'user' && p.libraryId === 'fakeLib01' && p.itemKey === 'XFAKE001').note;
  const r = await get(RESEARCH_NOTE_PATH(XFAKE001), owner);
  assert.equal(r.status, 200);
  assert.equal(r.body.exists, true);
  assert.deepEqual(r.body.fields, fixtureNote);
  assert.deepEqual(Object.keys(r.body.fields), [...NOTE_KEYS]);
  assert.match(r.body.revision, REVISION_RE);
  assert.equal(r.headers.etag, `"${r.body.revision}"`);
  assert.ok(r.body.fields.limitations.includes('\r\n'), 'fixture CRLF is preserved');
  assert.ok(r.body.fields.limitations.includes('🧪'), 'fixture emoji is preserved');
  assert.ok(r.body.fields.researchQuestion.includes('合成问题'));
  assert.ok(r.body.fields.argumentsAndContent.includes('$E = mc^2$'));
  assert.ok(r.body.fields.argumentsAndContent.includes('\\sum_{i=1}^{n}'));
  for (const tuple of [XFAKE002, GROUP_XFAKE001]) {
    const absent = await get(RESEARCH_NOTE_PATH(tuple), owner);
    assert.equal(absent.status, 200, tuple.join('/'));
    assert.deepEqual(absent.body, { apiVersion: 'v1', runId: absent.body.runId, exists: false });
    assert.ok(!('fields' in absent.body));
    assert.ok(!('revision' in absent.body));
    assert.equal(absent.headers.etag, undefined);
  }
  // The Workspace read principal sees the same global note.
  const ws = await get(RESEARCH_NOTE_PATH(XFAKE001), workspace);
  assert.equal(ws.status, 200);
  assert.deepEqual(ws.body.fields, fixtureNote);
});

test('Q4-01 runId and initial note revisions are opaque and fresh per instance, never fixture literals', async (t) => {
  const a = await startServer(t);
  const b = await startServer(t);
  const noteA = a.srv.control.note([OWNER_SCOPE, ...XFAKE001]);
  const noteB = b.srv.control.note([OWNER_SCOPE, ...XFAKE001]);
  assert.match(a.runId, RUN_ID_RE);
  assert.match(b.runId, RUN_ID_RE);
  assert.notEqual(a.runId, b.runId);
  assert.match(noteA.revision, REVISION_RE);
  assert.match(noteB.revision, REVISION_RE);
  assert.notEqual(noteA.revision, noteB.revision, 'revisions are per-instance, not fixture constants');
  assert.ok(!noteA.revision.startsWith('rev-wp02-'));
  assert.equal(noteA.revision, a.srv.control.note([OWNER_SCOPE, ...XFAKE001]).revision);
  assert.equal(a.runId, a.srv.control.snapshot().runId);
  const health = await a.get('/api/v1/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.runId, a.runId);
  assert.equal(health.body.mode, 'LOCAL_SYNTHETIC_ONLY');
  assert.equal(health.body.productionSuitable, false);
});

test('Q4-01 the canonical tuple is exact and case sensitive; the same itemKey in another library is a different note', async (t) => {
  const { get, owner, srv, wp02 } = await startServer(t);
  const userPaper = wp02.papers.find((p) => p.libraryType === 'user' && p.libraryId === 'fakeLib01' && p.itemKey === 'XFAKE001');
  const groupPaper = wp02.papers.find((p) => p.libraryType === 'group' && p.libraryId === 'fakeLib02' && p.itemKey === 'XFAKE001');
  assert.notEqual(userPaper.title, groupPaper.title);
  const wrongCaseItem = await get(RESEARCH_NOTE_PATH(['user', 'fakeLib01', 'xfake001']), owner);
  assert.equal(wrongCaseItem.status, 403);
  assert.equal(wrongCaseItem.body.error.code, 'NOT_AVAILABLE');
  const wrongCaseLibrary = await get(RESEARCH_NOTE_PATH(['user', 'FakeLib01', 'XFAKE001']), owner);
  assert.equal(wrongCaseLibrary.status, 403);
  const wrongType = await get(RESEARCH_NOTE_PATH(['USER', 'fakeLib01', 'XFAKE001']), owner);
  assert.equal(wrongType.status, 400);
  assert.equal(wrongType.body.error.code, 'INVALID_RESOURCE_ID');
  const group = await get(RESEARCH_NOTE_PATH(GROUP_XFAKE001), owner);
  assert.equal(group.status, 200);
  assert.equal(group.body.exists, false, 'another library with the same itemKey is a different note');
  assert.equal(srv.control.snapshot().counts.notes, 1);
});

test('zz request tally for this file stays within the 5000-request per-instance budget', (t) => {
  const n = requestTally();
  t.diagnostic(`WP04_LOCAL_REQUESTS file=q4-01 n=${n}`);
  assert.ok(n <= 5000);
});
