// REMEDIATION-06 (D007-A26 Option B) regression tests — LOCAL / SYNTHETIC ONLY, TEST-ONLY.
// Pins the R05-2 contract on the HTTP-207 path that previously had no repository coverage
// (P2-R05-1 / QA QM1): when a PROPFIND answered with 207 cannot be parsed (malformed/truncated XML,
// well-formed but unsupported DAV structure, or a non-conforming server answering allprop), the
// adapter fails closed with EXACTLY ONE explicit 114-byte resourcetype-only PROPFIND for that path —
// never a second empty-body / allprop PROPFIND. Assertions inspect the mock's actual requestLog,
// not only the final HTTP 503. Uses only existing mock options (propfindOverride,
// ignorePropSelection); no source or mock change.
import test from 'node:test';
import assert from 'node:assert/strict';
import { startStack, syntheticNote } from './helpers.mjs';
import { parseMultistatus } from '../src/dav-xml.mjs';
import { PROPFIND_RESOURCETYPE_BODY, PROPFIND_CONTENT_TYPE } from '../src/webdav-adapter.mjs';

const EXPECTED_BODY = PROPFIND_RESOURCETYPE_BODY.toString('utf8');
const WRITE_METHODS = ['PUT', 'DELETE', 'MKCOL'];

/** Stored mock state that must be unchanged by a failed export (bytes, ETags, collections, locks). */
const snapshot = (mock) => JSON.stringify({
  files: [...mock.files.entries()].map(([p, f]) => [p, f.etag, Buffer.from(f.bytes).toString('base64')]).sort(),
  collections: [...mock.collections].sort(),
  locks: [...(mock.locks ?? [])].sort(),
});

/** Every PROPFIND sent must be the explicit resourcetype-only request (R05-2), never empty/allprop. */
function assertExplicitPropfind(e, label) {
  assert.equal(e.body, EXPECTED_BODY, `${label}: R06 no bodyless/allprop PROPFIND (body must equal PROPFIND_RESOURCETYPE_BODY)`);
  assert.equal(e.bodyBytes, 114, `${label}: R06 no bodyless/allprop PROPFIND (body must be 114 bytes)`);
  assert.equal(e.contentLength, '114', `${label}: Content-Length`);
  assert.equal(e.contentType, 'application/xml; charset=utf-8', `${label}: Content-Type`);
  assert.equal(e.depth, '1', `${label}: Depth`);
  assert.doesNotMatch(e.body, /allprop|propname|lockdiscovery|current-user-principal/, `${label}: R06 no bodyless/allprop PROPFIND`);
}

/**
 * Run one export against a prepared stack and assert the full fail-closed contract.
 * `failingPath` is the listing whose 207 cannot be used; `expectedPropfinds` are the exact PROPFIND
 * paths (in order) that may be sent after the setup writes — the failing one exactly once.
 */
async function assertFailClosed(s, { label, failingPath, expectedPropfinds }) {
  const from = s.mock.requestLog.length;
  const writesBefore = s.mock.requestLog.filter((e) => WRITE_METHODS.includes(e.method)).length;
  const stateBefore = snapshot(s.mock);
  const ex = await s.client.exportAll();
  const after = s.mock.requestLog.slice(from);
  const pf = after.filter((e) => e.method === 'PROPFIND');
  // HTTP outcome and no bundle
  assert.deepEqual([ex.status, ex.data.outcome], [503, 'export_incomplete'], `${label}: 503 export_incomplete`);
  assert.equal(ex.data.records, undefined, `${label}: no bundle records`);
  assert.equal(ex.data.count, undefined, `${label}: no bundle count`);
  // request-level contract (actual requestLog)
  assert.equal(pf.filter((e) => e.path === failingPath).length, 1, `${label}: R06 exactly one PROPFIND for the failing listing ${failingPath}`);
  assert.deepEqual(pf.map((e) => e.path), expectedPropfinds, `${label}: R06 exactly one PROPFIND per listed path, no retry/fallback`);
  pf.forEach((e, i) => assertExplicitPropfind(e, `${label} PROPFIND #${i + 1} ${e.path}`));
  assert.equal(after.filter((e) => e.method === 'GET').length, 0, `${label}: fail closed before any record GET`);
  assert.equal(after.filter((e) => WRITE_METHODS.includes(e.method)).length, 0, `${label}: zero upstream writes during export`);
  assert.equal(s.mock.requestLog.filter((e) => WRITE_METHODS.includes(e.method)).length, writesBefore, `${label}: write count unchanged`);
  assert.equal(snapshot(s.mock), stateBefore, `${label}: stored state unchanged`);
  return { ex, pf };
}

async function overrideStack(t) {
  let override = null;
  const s = await startStack({ mockOptions: { propfindOverride: (p) => (override ? override(p) : null) } });
  t.after(() => s.stop());
  const n = syntheticNote();
  assert.equal((await s.client.put('notes', n.literatureId, n, '*')).data.outcome, 'saved'); // setup write
  const ns = `/lms-poc/${s.namespace}`;
  return { s, ns, n, setOverride: (fn) => { override = fn; } };
}

const col = (h, extra = '') => `<d:response><d:href>${h}</d:href><d:propstat><d:prop><d:resourcetype><d:collection/></d:resourcetype>${extra}</d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>`;
const file = (h, extra = '') => `<d:response><d:href>${h}</d:href><d:propstat><d:prop><d:resourcetype/>${extra}</d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>`;
const ms = (body) => `<d:multistatus xmlns:d="DAV:">${body}</d:multistatus>`;

test('R06 constants: explicit PROPFIND body is 114 bytes with the expected media type', () => {
  assert.equal(PROPFIND_RESOURCETYPE_BODY.length, 114);
  assert.equal(PROPFIND_CONTENT_TYPE, 'application/xml; charset=utf-8');
});

// ------------------------------------------------------------ (1) HTTP 207 + malformed / truncated XML
test('R06-207 malformed/truncated XML (root and kind listing) → 503, exactly one explicit PROPFIND, no allprop retry', async (t) => {
  const { s, ns, setOverride } = await overrideStack(t);
  const fixtures = {
    truncated: `<d:multistatus xmlns:d="DAV:"><d:response><d:href>${ns}/</d:href><d:propstat>`,
    'not xml': 'this is not xml <<<',
    'mismatched tags': `<d:multistatus xmlns:d="DAV:"><d:response></d:multistatus>`,
  };
  for (const [name, xml] of Object.entries(fixtures)) {
    assert.throws(() => parseMultistatus(xml), /DAV_XML|XML/, `${name}: fixture exercises the parseMultistatus catch path`);
    setOverride((p) => (p === ns ? xml : null));
    await assertFailClosed(s, { label: `root ${name}`, failingPath: ns, expectedPropfinds: [ns] });
    setOverride((p) => (p === `${ns}/notes` ? xml : null));
    await assertFailClosed(s, { label: `notes ${name}`, failingPath: `${ns}/notes`, expectedPropfinds: [ns, `${ns}/notes`] });
  }
  setOverride(null);
  assert.equal((await s.client.exportAll()).data.count, 1, 'override removed: normal export still works');
});

// ------------------------------------------------------------ (2) HTTP 207 + well-formed but unsupported DAV structure
test('R06-207 well-formed but unsupported nested DAV property/href → 503, exactly one explicit PROPFIND, no allprop retry', async (t) => {
  const { s, ns, n, setOverride } = await overrideStack(t);
  const rec = `${ns}/notes/${n.literatureId}.json`;
  const fixtures = {
    'owner with nested href (root)': [ns, ms(`${col(`${ns}/`, '<d:owner><d:href>/principals/x/</d:href></d:owner>')}${col(`${ns}/notes/`)}${col(`${ns}/projects/`)}${col(`${ns}/progress/`)}`)],
    'lockdiscovery with nested href (notes)': [`${ns}/notes`, ms(`${col(`${ns}/notes/`)}${file(rec, `<d:lockdiscovery><d:activelock><d:locktype><d:write/></d:locktype><d:lockscope><d:exclusive/></d:lockscope><d:depth>0</d:depth><d:locktoken><d:href>opaquelocktoken:synthetic-0001</d:href></d:locktoken></d:activelock></d:lockdiscovery>`)}`)],
    'response nested in prop (notes)': [`${ns}/notes`, ms(`${col(`${ns}/notes/`)}${file(rec, `<d:response><d:href>${rec}</d:href></d:response>`)}`)],
  };
  for (const [name, [path, xml]] of Object.entries(fixtures)) {
    assert.throws(() => parseMultistatus(xml), /DAV_XML/, `${name}: fixture exercises the parseMultistatus catch path`);
    setOverride((p) => (p === path ? xml : null));
    await assertFailClosed(s, { label: name, failingPath: path, expectedPropfinds: path === ns ? [ns] : [ns, path] });
  }
});

// ------------------------------------------------------------ (3)/(4) ignorePropSelection: allprop answer with / without locks
for (const withLocks of [true, false]) {
  test(`R06-207 non-conforming server answers allprop to the explicit request (locks=${withLocks}) → 503, exactly one explicit PROPFIND, no retry`, async (t) => {
    const s = await startStack({ mockOptions: { ignorePropSelection: true } });
    t.after(() => s.stop());
    const n = syntheticNote();
    assert.equal((await s.client.put('notes', n.literatureId, n, '*')).data.outcome, 'saved'); // setup write
    const ns = `/lms-poc/${s.namespace}`;
    if (withLocks) { s.mock.locks.add(`${ns}/notes/${n.literatureId}.json`); s.mock.locks.add(`${ns}/notes`); }
    // The root allprop answer already carries current-user-principal (nested DAV:href) → root fails.
    const { pf } = await assertFailClosed(s, { label: `ignorePropSelection locks=${withLocks}`, failingPath: ns, expectedPropfinds: [ns] });
    assert.equal(pf.length, 1);
  });
}

// ------------------------------------------------------------ (5) non-207 errors keep the single explicit request
for (const status of [400, 403, 415, 500]) {
  test(`R06 non-207 ${status} → 503, exactly one explicit PROPFIND (body/length/type/depth), no GET, no writes`, async (t) => {
    const s = await startStack();
    t.after(() => s.stop());
    const n = syntheticNote();
    assert.equal((await s.client.put('notes', n.literatureId, n, '*')).data.outcome, 'saved'); // setup write
    const ns = `/lms-poc/${s.namespace}`;
    s.mock.faults.push({ method: 'PROPFIND', kind: 'status', status });
    await assertFailClosed(s, { label: `status ${status}`, failingPath: ns, expectedPropfinds: [ns] });
  });
}

// ------------------------------------------------------------ adapter-level pin of the catch path
test('R06-207 adapter: malformed 207 returns outcome malformed after exactly one explicit PROPFIND (no second request)', async (t) => {
  const { s, ns, setOverride } = await overrideStack(t);
  setOverride((p) => (p === ns ? '<d:multistatus xmlns:d="DAV:"><d:response>' : null));
  const from = s.mock.requestLog.length;
  const r = await s.adapter.propfind(`/${s.namespace}`, '1');
  assert.equal(r.outcome, 'malformed');
  const sent = s.mock.requestLog.slice(from);
  assert.equal(sent.length, 1, 'R06 exactly one PROPFIND for the failing listing (adapter level, no second request of any method)');
  assertExplicitPropfind(sent[0], 'adapter malformed 207');
});

// ------------------------------------------------------------ (6) valid 207 non-regression
test('R06 non-regression: valid resourcetype-only 207 exports normally with one explicit PROPFIND per listing', async (t) => {
  const { s, ns, n } = await overrideStack(t);
  const from = s.mock.requestLog.length;
  const ex = await s.client.exportAll();
  assert.deepEqual([ex.status, ex.data.count], [200, 1]);
  const pf = s.mock.requestLog.slice(from).filter((e) => e.method === 'PROPFIND');
  assert.deepEqual(pf.map((e) => e.path), [ns, `${ns}/notes`, `${ns}/projects`, `${ns}/progress`]);
  pf.forEach((e) => assertExplicitPropfind(e, `valid ${e.path}`));
  assert.equal(s.mock.requestLog.slice(from).filter((e) => e.method === 'GET' && e.path === `${ns}/notes/${n.literatureId}.json`).length, 1, 'record GET happens only on success');
});
