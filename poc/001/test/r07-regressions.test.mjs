// REMEDIATION-07 (D007-A27 Option B) regression tests — LOCAL / SYNTHETIC ONLY, TEST-ONLY.
// P2-R06-1 / F-1: pins the three POST-PARSE malformed-207 branches of adapter `propfind()`:
//   R07-FH-01     foreign href outside the adapter base       → { outcome:'malformed', reason:'foreign href' }
//   R07-STATUS-02 non-2xx response entry                      → { outcome:'malformed', reason:'non-2xx response entry' }
//   R07-DUP-03    duplicate normalized href (trailing slash)  → { outcome:'malformed', reason:'duplicate href' }
// Every fixture is well-formed and PARSES (parseMultistatus does not throw), so the adapter reaches the
// intended branch — never the XML catch path covered by R06. Each scenario runs on the root listing and on
// a kind listing and asserts, from the mock's actual requestLog after the setup write: exactly ONE explicit
// 114-byte resourcetype-only PROPFIND for the failing path (and the exact PROPFIND path sequence), no
// bodyless/allprop/Depth-0/duplicate retry, 503 export_incomplete, no bundle, no GET, no writes and an
// unchanged mock store. Uses only existing mock options (propfindOverride); no source or mock change.
import test from 'node:test';
import assert from 'node:assert/strict';
import { startStack, syntheticNote } from './helpers.mjs';
import { parseMultistatus } from '../src/dav-xml.mjs';
import { PROPFIND_RESOURCETYPE_BODY } from '../src/webdav-adapter.mjs';

const EXPECTED_BODY = PROPFIND_RESOURCETYPE_BODY.toString('utf8');
const WRITE_METHODS = ['PUT', 'DELETE', 'MKCOL'];
const OK = '<d:status>HTTP/1.1 200 OK</d:status>';

const snapshot = (mock) => JSON.stringify({
  files: [...mock.files.entries()].map(([p, f]) => [p, f.etag, Buffer.from(f.bytes).toString('base64')]).sort(),
  collections: [...mock.collections].sort(),
  locks: [...(mock.locks ?? [])].sort(),
});

/** Explicit request contract for every PROPFIND; `id` makes the failing case identifiable in mutation output. */
function assertExplicitPropfind(id, e, label, depth = '1') {
  assert.equal(e.body, EXPECTED_BODY, `${id} ${label}: no bodyless/allprop PROPFIND (body must equal PROPFIND_RESOURCETYPE_BODY)`);
  assert.equal(e.bodyBytes, 114, `${id} ${label}: no bodyless/allprop PROPFIND (114 bytes)`);
  assert.equal(e.contentLength, '114', `${id} ${label}: Content-Length`);
  assert.equal(e.contentType, 'application/xml; charset=utf-8', `${id} ${label}: Content-Type`);
  assert.equal(e.depth, depth, `${id} ${label}: Depth`);
  assert.doesNotMatch(e.body, /allprop|propname/, `${id} ${label}: no allprop PROPFIND`);
}

// ---- multistatus builders (valid DAV structure) --------------------------------------------------
const resp = (href, inner) => `<d:response><d:href>${href}</d:href>${inner}</d:response>`;
const colOk = (href) => resp(href, `<d:propstat><d:prop><d:resourcetype><d:collection/></d:resourcetype></d:prop>${OK}</d:propstat>`);
const fileOk = (href) => resp(href, `<d:propstat><d:prop><d:resourcetype/></d:prop>${OK}</d:propstat>`);
const ms = (...responses) => `<d:multistatus xmlns:d="DAV:">${responses.join('')}</d:multistatus>`;
const rootListing = (ns, ...extra) => ms(colOk(`${ns}/`), colOk(`${ns}/notes/`), colOk(`${ns}/projects/`), colOk(`${ns}/progress/`), ...extra);
const notesListing = (ns, rec, ...extra) => ms(colOk(`${ns}/notes/`), fileOk(rec), ...extra);

/** Fixtures per branch: [label, listing ('root' | 'notes'), xml builder]. All must parse; reason must match exactly. */
const CASES = {
  'R07-FH-01': {
    reason: 'foreign href',
    fixtures: [
      ['root: response href outside base path', 'root', (ns) => rootListing(ns, colOk('/other-base/notes/'))],
      ['root: prefix look-alike /lms-poc-x (not under /lms-poc/)', 'root', (ns) => rootListing(ns, colOk(ns.replace('/lms-poc/', '/lms-poc-x/') + '/'))],
      ['notes: record href outside base path', 'notes', (ns, rec) => notesListing(ns, rec, fileOk('/elsewhere/notes/x.json'))],
    ],
  },
  'R07-STATUS-02': {
    reason: 'non-2xx response entry',
    fixtures: [
      ['root: kind entry with response-level 404', 'root', (ns) => ms(colOk(`${ns}/`), colOk(`${ns}/notes/`), colOk(`${ns}/projects/`), resp(`${ns}/progress/`, '<d:status>HTTP/1.1 404 Not Found</d:status>'))],
      ['notes: record entry whose only propstat is 403', 'notes', (ns, rec) => ms(colOk(`${ns}/notes/`), resp(rec, '<d:propstat><d:prop><d:resourcetype/></d:prop><d:status>HTTP/1.1 403 Forbidden</d:status></d:propstat>'))],
      ['notes: extra entry with response-level 500', 'notes', (ns, rec) => notesListing(ns, rec, resp(`${ns}/notes/other.json`, '<d:status>HTTP/1.1 500 Internal Server Error</d:status>'))],
    ],
  },
  'R07-DUP-03': {
    reason: 'duplicate href',
    fixtures: [
      ['root: kind collection listed with and without trailing slash', 'root', (ns) => rootListing(ns, colOk(`${ns}/notes`))],
      ['root: self entry listed twice (/ns and /ns/)', 'root', (ns) => rootListing(ns, colOk(ns))],
      ['notes: record listed twice (plain and percent-encoded)', 'notes', (ns, rec) => notesListing(ns, rec, fileOk(rec.replace(/\.json$/, '%2Ejson')))],
      ['notes: self entry with and without trailing slash', 'notes', (ns, rec) => notesListing(ns, rec, colOk(`${ns}/notes`))],
    ],
  },
};

async function stackWithOverride(t) {
  let override = null;
  const s = await startStack({ mockOptions: { propfindOverride: (p) => (override ? override(p) : null) } });
  t.after(() => s.stop());
  const n = syntheticNote();
  assert.equal((await s.client.put('notes', n.literatureId, n, '*')).data.outcome, 'saved'); // setup write
  const ns = `/lms-poc/${s.namespace}`;
  return { s, ns, rec: `${ns}/notes/${n.literatureId}.json`, setOverride: (fn) => { override = fn; } };
}

for (const [id, { reason, fixtures }] of Object.entries(CASES)) {
  test(`${id} post-parse branch "${reason}" (root and kind listing) → 503, exactly one explicit PROPFIND, no fallback`, async (t) => {
    const { s, ns, rec, setOverride } = await stackWithOverride(t);
    for (const [label, listing, build] of fixtures) {
      const failingPath = listing === 'root' ? ns : `${ns}/notes`;
      const xml = build(ns, rec);
      // (a) the fixture is valid, parseable DAV XML: it cannot reach the R06 catch path
      assert.doesNotThrow(() => parseMultistatus(xml), `${id} ${label}: fixture must parse`);
      setOverride((p) => (p === failingPath ? xml : null));
      // (b) adapter-level control: the intended post-parse branch, after exactly one explicit request
      const fromA = s.mock.requestLog.length;
      const direct = await s.adapter.propfind(failingPath.replace('/lms-poc', ''), '1');
      assert.deepEqual(direct, { outcome: 'malformed', reason }, `${id} ${label}: adapter branch`);
      const sentA = s.mock.requestLog.slice(fromA);
      assert.equal(sentA.length, 1, `${id} exactly one PROPFIND for the failing listing (adapter level, ${label}; no second request of any method)`);
      assertExplicitPropfind(id, sentA[0], `adapter ${label}`);
      // (c) API export: full fail-closed contract
      const from = s.mock.requestLog.length;
      const writesBefore = s.mock.requestLog.filter((e) => WRITE_METHODS.includes(e.method)).length;
      const stateBefore = snapshot(s.mock);
      const ex = await s.client.exportAll();
      const after = s.mock.requestLog.slice(from);
      const pf = after.filter((e) => e.method === 'PROPFIND');
      assert.deepEqual([ex.status, ex.data.outcome], [503, 'export_incomplete'], `${id} ${label}: 503 export_incomplete`);
      assert.equal(ex.data.records, undefined, `${id} ${label}: no bundle records`);
      assert.equal(ex.data.count, undefined, `${id} ${label}: no bundle count`);
      assert.equal(pf.filter((e) => e.path === failingPath).length, 1, `${id} exactly one PROPFIND for the failing listing ${listing} (${label})`);
      assert.deepEqual(pf.map((e) => e.path), listing === 'root' ? [ns] : [ns, `${ns}/notes`], `${id} exactly one PROPFIND per listed path, no retry/fallback (${label})`);
      pf.forEach((e, i) => assertExplicitPropfind(id, e, `export PROPFIND #${i + 1} ${label}`));
      assert.equal(after.filter((e) => e.method === 'GET').length, 0, `${id} ${label}: 0 GET`);
      assert.equal(after.filter((e) => WRITE_METHODS.includes(e.method)).length, 0, `${id} ${label}: 0 PUT/MKCOL/DELETE`);
      assert.equal(s.mock.requestLog.filter((e) => WRITE_METHODS.includes(e.method)).length, writesBefore, `${id} ${label}: write count unchanged`);
      assert.equal(snapshot(s.mock), stateBefore, `${id} ${label}: files/ETags/collections/locks unchanged`);
    }
    setOverride(null);
    assert.equal((await s.client.exportAll()).data.count, 1, `${id}: override removed, normal export works`);
  });
}

test('R07 positive control: valid parsed 207 listings (same builders, no bad entry) export normally with one explicit PROPFIND per path', async (t) => {
  const { s, ns, rec, setOverride } = await stackWithOverride(t);
  // the same builders without the offending entry are accepted: proves the negatives fail only on their branch
  const root = rootListing(ns), notes = notesListing(ns, rec);
  setOverride((p) => (p === ns ? root : p === `${ns}/notes` ? notes : null));
  assert.deepEqual(await s.adapter.propfind(`/${s.namespace}`, '1').then((r) => r.outcome), 'ok');
  assert.deepEqual(await s.adapter.propfind(`/${s.namespace}/notes`, '1').then((r) => r.outcome), 'ok');
  const from = s.mock.requestLog.length;
  const ex = await s.client.exportAll();
  assert.deepEqual([ex.status, ex.data.count], [200, 1]);
  const pf = s.mock.requestLog.slice(from).filter((e) => e.method === 'PROPFIND');
  assert.deepEqual(pf.map((e) => e.path), [ns, `${ns}/notes`, `${ns}/projects`, `${ns}/progress`]);
  pf.forEach((e) => assertExplicitPropfind('R07-CONTROL', e, e.path));
  assert.equal(s.mock.requestLog.slice(from).filter((e) => e.method === 'GET').length, 1, 'record GET only on success');
});
