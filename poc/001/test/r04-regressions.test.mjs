// REMEDIATION-04 (D007-A23) regression tests — LOCAL MOCK ONLY.
// R04-1 whole-tree DAV hierarchy validation, R04-2 2xx-only collection flag, R04-3 Q5 probes.
// Case ids follow REMEDIATION_04_QA_PLAN.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import { startStack, syntheticNote } from './helpers.mjs';
import { parseMultistatus } from '../src/dav-xml.mjs';
import { decodeEnvelope } from '../src/note-codec.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OK = 'HTTP/1.1 200 OK';
const NF = 'HTTP/1.1 404 Not Found';
const rsp = (href, { col = false, inner = '' } = {}) =>
  `<d:response><d:href>${href}</d:href><d:propstat><d:prop><d:resourcetype>${col ? '<d:collection/>' : ''}</d:resourcetype></d:prop><d:status>${OK}</d:status></d:propstat>${inner}</d:response>`;
const ms = (body, extraNs = '') => `<?xml version="1.0"?><d:multistatus xmlns:d="DAV:"${extraNs}>${body}</d:multistatus>`;
const X = ' xmlns:x="urn:example:foreign"';

async function threeRecordStack(t) {
  let override = null;
  const s = await startStack({ mockOptions: { propfindOverride: (p) => (override ? override(p) : null) } });
  t.after(() => s.stop());
  const n1 = syntheticNote(9000001, undefined, 0);
  const n2 = syntheticNote(9000001, undefined, 1);
  for (const n of [n1, n2]) assert.equal((await s.client.put('notes', n.literatureId, n, '*')).data.outcome, 'saved');
  const proj = { projectId: 'proj-r04', name: 'R04 synthetic', literatureIds: [n1.literatureId] };
  assert.equal((await s.client.put('projects', proj.projectId, proj, '*')).data.outcome, 'saved');
  const ns = `/lms-poc/${s.namespace}`;
  assert.equal((await s.client.exportAll()).data.count, 3, 'baseline: 3 actually stored records');
  return { s, ns, n1, n2, setOverride: (f) => { override = f; } };
}
function sideEffects(s) {
  const writes = s.mock.requestLog.filter((e) => ['PUT', 'DELETE', 'MKCOL', 'MOVE', 'COPY'].includes(e.method)).length;
  return { writes, snapshot: JSON.stringify(s.mock.snapshot()) };
}
async function expectFailClosed(t, s, label, xml) {
  const before = sideEffects(s);
  const ex = await s.client.exportAll();
  t.diagnostic(`${label}: fixture ${xml.length} chars → HTTP ${ex.status} ${JSON.stringify({ outcome: ex.data.outcome, reason: ex.data.reason, detail: ex.data.detail })}`);
  assert.equal(ex.status, 503, label); assert.equal(ex.data.outcome, 'export_incomplete', label);
  assert.equal(ex.data.records, undefined, `${label}: no bundle`); assert.equal(ex.data.count, undefined, `${label}: no count`);
  const after = sideEffects(s);
  assert.equal(after.writes, before.writes, `${label}: zero upstream write effects`);
  assert.equal(after.snapshot, before.snapshot, `${label}: storage unchanged`);
}

// ---------------------------------------------------------------- R04-Q1c-01..04 (QA's four variants)
const HIDDEN = {
  'R04-Q1c-01 foreign wrapper': (ns, a, b) => ms(rsp(`${ns}/notes/`, { col: true }) + rsp(`${ns}/notes/${a}.json`) + `<x:wrap>${rsp(`${ns}/notes/${b}.json`)}</x:wrap>`, X),
  'R04-Q1c-02 response nested in response': (ns, a, b) => ms(rsp(`${ns}/notes/`, { col: true }) + rsp(`${ns}/notes/${a}.json`, { inner: rsp(`${ns}/notes/${b}.json`) })),
  'R04-Q1c-03 response inside responsedescription': (ns, a, b) => ms(rsp(`${ns}/notes/`, { col: true }) + rsp(`${ns}/notes/${a}.json`) + `<d:responsedescription>${rsp(`${ns}/notes/${b}.json`)}</d:responsedescription>`),
  'R04-Q1c-04 foreign-namespace response': (ns, a, b) => ms(rsp(`${ns}/notes/`, { col: true }) + rsp(`${ns}/notes/${a}.json`) + `<x:response><x:href>${ns}/notes/${b}.json</x:href><x:status>${OK}</x:status></x:response>`, X),
};
for (const [label, build] of Object.entries(HIDDEN)) {
  test(`${label}: 3 stored records, one hidden → 503 export_incomplete, no bundle, zero write effects`, async (t) => {
    const { s, ns, n1, n2, setOverride } = await threeRecordStack(t);
    const xml = build(ns, n1.literatureId, n2.literatureId);
    t.diagnostic(`fixture: ${xml}`);
    assert.throws(() => parseMultistatus(xml), /DAV_XML/, 'parser rejects it directly');
    setOverride((p) => (p === `${ns}/notes` ? xml : null));
    await expectFailClosed(t, s, label, xml);
  });
}

// ---------------------------------------------------------------- R04-Q1c-05 misplaced structural elements
const ROOT = (ns) => rsp(`${ns}/`, { col: true });
const MISPLACED = {
  'href inside propstat': (ns) => ms(ROOT(ns).replace('</d:propstat>', `<d:href>${ns}/notes/</d:href></d:propstat>`)),
  'propstat directly under multistatus': (ns) => ms(ROOT(ns) + `<d:propstat><d:prop/><d:status>${OK}</d:status></d:propstat>`),
  'status inside prop': (ns) => ms(ROOT(ns).replace('<d:prop>', `<d:prop><d:status>${OK}</d:status>`)),
  'prop directly under response': (ns) => ms(ROOT(ns).replace('</d:response>', '<d:prop><d:resourcetype/></d:prop></d:response>')),
  'resourcetype directly under propstat': (ns) => ms(ROOT(ns).replace('</d:propstat>', '<d:resourcetype/></d:propstat>')),
  'collection directly under prop': (ns) => ms(ROOT(ns).replace('<d:prop>', '<d:prop><d:collection/>')),
  'multistatus nested in prop': (ns) => ms(ROOT(ns).replace('<d:prop>', '<d:prop><d:multistatus/>')),
  'unknown DAV child of multistatus': (ns) => ms(ROOT(ns) + '<d:sync-token>x</d:sync-token>'),
  'foreign wrapper at root with no response inside': (ns) => ms(ROOT(ns) + '<x:wrap/>', X),
  'foreign child of response': (ns) => ms(ROOT(ns).replace('</d:response>', '<x:extra/></d:response>'), X),
  'foreign child of propstat': (ns) => ms(ROOT(ns).replace('</d:propstat>', '<x:extra/></d:propstat>'), X),
  'foreign response-shaped element hidden inside a property': (ns) => ms(ROOT(ns).replace('<d:prop>', `<d:prop><x:response><x:href>${ns}/notes/</x:href></x:response>`), X),
  'element inside href': (ns) => ms(ROOT(ns).replace(`<d:href>${ns}/</d:href>`, `<d:href>${ns}/<x:b/></d:href>`), X),
  'stray text in multistatus': (ns) => ms(ROOT(ns) + 'hidden text'),
};
test('R04-Q1c-05 misplaced DAV structure anywhere in the tree → parser throws and export fails closed', async (t) => {
  const { s, ns, setOverride } = await threeRecordStack(t);
  for (const [label, build] of Object.entries(MISPLACED)) {
    const xml = build(ns);
    assert.throws(() => parseMultistatus(xml), /DAV_XML/, `parser: ${label}`);
    setOverride((p) => (p === ns ? xml : null));
    await expectFailClosed(t, s, label, xml);
  }
});

// ---------------------------------------------------------------- R04-2 collection status
test('R04-COL-01 collection marker only inside a 404 propstat is NOT a collection → required kind fails closed', async (t) => {
  const { s, ns, setOverride } = await threeRecordStack(t);
  const notesOnly404 = `<d:response><d:href>${ns}/notes/</d:href><d:propstat><d:prop><d:getetag>"e"</d:getetag></d:prop><d:status>${OK}</d:status></d:propstat><d:propstat><d:prop><d:resourcetype><d:collection/></d:resourcetype></d:prop><d:status>${NF}</d:status></d:propstat></d:response>`;
  const xml = ms(ROOT(ns) + notesOnly404 + rsp(`${ns}/projects/`, { col: true }) + rsp(`${ns}/progress/`, { col: true }));
  const parsed = parseMultistatus(xml);
  assert.equal(parsed.find((e) => e.href === `${ns}/notes/`).collection, false, 'parser: 404 marker not promoted');
  setOverride((p) => (p === ns ? xml : null));
  await expectFailClosed(t, s, 'notes collection only via 404 propstat', xml);
});

test('R04-COL-02 2xx collection plus a separate 404 for an unrelated property stays accepted', async (t) => {
  const { s, ns, setOverride } = await threeRecordStack(t);
  const withMissingProp = (href) => `<d:response><d:href>${href}</d:href><d:propstat><d:prop><d:resourcetype><d:collection/></d:resourcetype></d:prop><d:status>${OK}</d:status></d:propstat><d:propstat><d:prop><d:displayname/></d:prop><d:status>${NF}</d:status></d:propstat></d:response>`;
  const xml = ms(withMissingProp(`${ns}/`) + withMissingProp(`${ns}/notes/`) + withMissingProp(`${ns}/projects/`) + withMissingProp(`${ns}/progress/`));
  assert.ok(parseMultistatus(xml).every((e) => e.collection));
  setOverride((p) => (p === ns ? xml : null));
  const ex = await s.client.exportAll();
  assert.deepEqual([ex.status, ex.data.count], [200, 3]);
});

test('R04-COL-03 existing response-status vs propstat conflict check still effective', () => {
  const xml = ms(`<d:response><d:href>/a/</d:href><d:status>${OK}</d:status><d:propstat><d:prop/><d:status>${OK}</d:status></d:propstat></d:response>`);
  assert.throws(() => parseMultistatus(xml), /both status and propstat/);
});

// ---------------------------------------------------------------- R04-POS-01 no over-rejection
test('R04-POS-01 legitimate shapes still accepted: responsedescription text, foreign properties, prefixes, default namespace', async (t) => {
  const { s, ns, setOverride } = await threeRecordStack(t);
  const decorated = ms(`<d:responsedescription>listing ok</d:responsedescription>`
    + `<d:response><d:href>${ns}/</d:href><d:propstat><d:prop><d:resourcetype><d:collection/></d:resourcetype><x:color>blue</x:color><d:getetag>"r"</d:getetag></d:prop><d:status>${OK}</d:status><d:responsedescription>fine</d:responsedescription></d:propstat><d:responsedescription>fine</d:responsedescription></d:response>`
    + rsp(`${ns}/notes/`, { col: true }) + rsp(`${ns}/projects/`, { col: true }) + rsp(`${ns}/progress/`, { col: true }), X);
  setOverride((p) => (p === ns ? decorated : null));
  assert.deepEqual([(await s.client.exportAll()).data.count], [3]);
  for (const [pre, decl] of [['D:', 'xmlns:D="DAV:"'], ['', 'xmlns="DAV:"'], ['q:', 'xmlns:q="DAV:"']]) {
    const xml = ms(rsp(`${ns}/`, { col: true }) + rsp(`${ns}/notes/`, { col: true }) + rsp(`${ns}/projects/`, { col: true }) + rsp(`${ns}/progress/`, { col: true }))
      .replace('xmlns:d="DAV:"', decl).replaceAll('<d:', `<${pre}`).replaceAll('</d:', `</${pre}`);
    setOverride((p) => (p === ns ? xml : null));
    assert.equal((await s.client.exportAll()).data.count, 3, `prefix "${pre || 'default'}"`);
  }
  setOverride(null);
  const ex = await s.client.exportAll();
  const rs = await s.client.restore(ex.data, 'restore-r04-pos');
  assert.deepEqual([rs.data.outcome, rs.data.verified], ['restored', 3]);
});

// ---------------------------------------------------------------- R04-Q5-01 applied-but-unconfirmed fence (INFO, documented P2)
async function fenceStack(t) {
  const s = await startStack({ timeoutMs: 250 });
  t.after(() => s.stop());
  const note = syntheticNote();
  const rev = (await s.client.put('notes', note.literatureId, note, '*')).data.revision;
  return { s, note, rev };
}
const APPLIED_UNCONFIRMED = [
  ['missing PUT ETag', { method: 'PUT', kind: 'strip-etag' }],
  ['weak PUT ETag', { method: 'PUT', kind: 'weaken-etag' }],
  ['dishonest PUT ETag', { method: 'PUT', kind: 'bogus-etag' }],
  ['read-back GET 500', { method: 'GET', kind: 'status', status: 500, skip: 1 }],
  ['read-back GET mismatched ETag', { method: 'GET', kind: 'bogus-etag', skip: 1 }],
  ['apply-then-503', { method: 'PUT', kind: 'commit-then-status', status: 503 }],
  ['apply-then-hang', { method: 'PUT', kind: 'commit-then-hang' }],
];
for (const [label, fault] of APPLIED_UNCONFIRMED) {
  test(`R04-Q5-01 INFO ${label}: fence applied but unconfirmed → indeterminate, non-terminal, quota slot held, no replay`, async (t) => {
    const { s, note, rev } = await fenceStack(t);
    s.mock.faults.push({ method: 'PUT', kind: 'hang' });
    const opId = s.client.newOperationId();
    assert.equal((await s.client.put('notes', note.literatureId, { ...note, question: 'x' }, rev, opId)).data.outcome, 'unknown');
    s.mock.faults.push(fault);
    const f = await s.client.fence(opId);
    assert.equal(f.data.terminal, false); assert.equal(f.data.outcome, 'fence_not_confirmed');
    await sleep(30);
    const v = await s.client.verify(opId);
    assert.deepEqual([v.data.outcome, v.data.terminal], ['indeterminate', false], 'the fence moved the revision without authoritative confirmation');
    assert.equal([...s.api.ledger.values()].find((e) => e.opId === opId).verdict, 'unknown', 'ledger slot still occupied');
    assert.equal((await s.client.put('notes', note.literatureId, { ...note, question: 'x' }, rev, opId)).data.outcome, 'verification_required', 'no replay');
  });
}

test('R04-Q5-01 INFO sibling Unknown operations on the same record are stranded too', async (t) => {
  const { s, note, rev } = await fenceStack(t);
  const ops = [];
  for (let i = 0; i < 2; i++) {
    s.mock.faults.push({ method: 'PUT', kind: 'hang' });
    const op = s.client.newOperationId();
    ops.push(op);
    assert.equal((await s.client.put('notes', note.literatureId, { ...note, question: `s${i}` }, rev, op)).data.outcome, 'unknown');
  }
  s.mock.faults.push({ method: 'PUT', kind: 'strip-etag' });
  assert.equal((await s.client.fence(ops[0])).data.terminal, false);
  for (const op of ops) assert.deepEqual([(await s.client.verify(op)).data.outcome], ['indeterminate']);
  assert.deepEqual([(await s.client.fence(ops[1])).data.outcome], ['indeterminate'], 'sibling can no longer be fenced either');
  assert.ok(decodeEnvelope(s.mock.files.get(`/lms-poc/${s.namespace}/notes/${note.literatureId}.json`).bytes).data.question === note.question, 'content unchanged');
});
