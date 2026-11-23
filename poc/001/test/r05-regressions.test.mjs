// REMEDIATION-05 (D007-A25) regression tests — LOCAL / SYNTHETIC ONLY.
// R05-1 bounded XML parser (parser-layer boundaries + isolated child-process hostile fixtures),
// R05-2 explicit resourcetype-only PROPFIND (exact request, locked/allprop fixtures, no fallback).
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startStack, syntheticNote } from './helpers.mjs';
import { parseXml, parseMultistatus, LIMITS } from '../src/dav-xml.mjs';
import { PROPFIND_RESOURCETYPE_BODY, PROPFIND_CONTENT_TYPE } from '../src/webdav-adapter.mjs';

const nest = (n) => '<a>'.repeat(n) + '</a>'.repeat(n);
const attrs = (n, p = 'a') => Array.from({ length: n }, (_, i) => `${p}${i}="x"`).join(' ');
const xmlns = (n, o) => Array.from({ length: n }, (_, i) => `xmlns:p${o + i}="urn:${o + i}"`).join(' ');
const ok = (xml) => { const st = {}; parseXml(xml, st); return st; };
const bad = (xml, re) => assert.throws(() => parseXml(xml), (e) => e.code === 'DAV_XML' && re.test(e.message));

// ---------------------------------------------------------------- R05-1 parser-layer boundaries
test('R05-1 limits are the authorized values', () => {
  assert.deepEqual({ ...LIMITS }, { maxDepth: 64, maxElements: 10_000, maxAttrsPerElement: 64, maxTotalAttrs: 10_000, maxNsDecls: 256, maxBytes: 2_000_000 });
});
test('R05-1 depth 64 accepted / 65 rejected', () => {
  assert.equal(ok(nest(64)).maxDepth, 64);
  bad(nest(65), /nesting depth > 64/);
});
test('R05-1 elements 10000 accepted / 10001 rejected', () => {
  assert.equal(ok(`<r>${'<e/>'.repeat(9_999)}</r>`).elements, 10_000);
  bad(`<r>${'<e/>'.repeat(10_000)}</r>`, /more than 10000 elements/);
});
test('R05-1 attributes per element 64 accepted / 65 rejected', () => {
  assert.equal(ok(`<r ${attrs(64)}/>`).attributes, 64);
  bad(`<r ${attrs(65)}/>`, /more than 64 attributes on one element/);
});
test('R05-1 total attributes 10000 accepted / 10001 rejected', () => {
  assert.equal(ok(`<r>${`<e ${attrs(50)}/>`.repeat(200)}</r>`).attributes, 10_000);
  bad(`<r a="1">${`<e ${attrs(50)}/>`.repeat(200)}</r>`, /more than 10000 attributes in document/);
});
test('R05-1 namespace declarations 256 accepted / 257 rejected', () => {
  const four = `<r ${xmlns(64, 0)}><a ${xmlns(64, 64)}><b ${xmlns(64, 128)}><c ${xmlns(64, 192)}/>`;
  assert.equal(ok(`${four}</b></a></r>`).nsDecls, 256);
  bad(`${four}<d xmlns:z="urn:z"/></b></a></r>`, /more than 256 namespace declarations/);
});
test('R05-1 namespace scopes are shared, not copied per element', () => {
  const doc = `<r ${xmlns(64, 0)}><a ${xmlns(64, 64)}><b ${xmlns(64, 128)}><c ${xmlns(64, 192)}>${'<p255:e/>'.repeat(9_996)}</c></b></a></r>`;
  const st = ok(doc);
  assert.equal(st.elements, 10_000); assert.equal(st.nsDecls, 256);
  assert.equal(st.scopeMaps, 5, 'initial scope + one per DECLARING element (4), not one per element (10000)');
});
test('R05-1 existing byte ceiling and DTD/ENTITY refusal preserved; malformed qname refused', () => {
  bad(`<r>${'x'.repeat(2_000_001)}</r>`, /body too large/);
  bad('<!DOCTYPE r [<!ENTITY e "x">]><r/>', /DOCTYPE/);
  bad('<D:response:x xmlns:D="DAV:"/>', /more than one colon/);
  bad('<:a/>', /bad qname/);
});

test('R05-1 historical hostile fixtures in ISOLATED child processes (256 MB heap, OS SIGKILL timeout): fail closed < 2 s, no OOM', () => {
  const script = fileURLToPath(new URL('../scripts/resource-probe.mjs', import.meta.url));
  const r = spawnSync(process.execPath, [script], { encoding: 'utf8', timeout: 180_000 });
  const summary = r.stdout.split('\n').filter((l) => /^(PASS|FAIL|RESOURCE PROBE|resource-probe env)/.test(l));
  for (const l of summary) console.log(`  # ${l}`);
  assert.equal(r.status, 0, r.stdout.slice(-2000));
  const rows = JSON.parse(r.stdout.split('\n').find((l) => l.startsWith('ROWS ')).slice(5));
  const h = rows.filter((x) => x.fixture.startsWith('H1') || x.fixture.startsWith('H2'));
  assert.equal(h.length, 4, 'H1/H2 × parser and API export');
  for (const x of rows) {
    assert.equal(x.exitCode, 0); assert.equal(x.heapLimitHit, false); assert.equal(x.killedByTimeout, false);
    assert.equal(x.report.rejected, true); assert.equal(x.report.partialBundle, false); assert.equal(x.report.upstreamWrites, 0);
    assert.ok(x.wallMs < 2_000, `${x.fixture}/${x.mode} ${x.wallMs} ms`);
  }
});

// ---------------------------------------------------------------- R05-1 full profile integration
test('R05-1 resource-limit violations in a listing → 503 export_incomplete, no bundle, no writes', async (t) => {
  let override = null;
  const s = await startStack({ mockOptions: { propfindOverride: (p) => (override ? override(p) : null) } });
  t.after(() => s.stop());
  const n = syntheticNote();
  await s.client.put('notes', n.literatureId, n, '*');
  const ns = `/lms-poc/${s.namespace}`;
  const writes = () => s.mock.requestLog.filter((e) => ['PUT', 'DELETE', 'MKCOL'].includes(e.method)).length;
  const before = writes();
  const cases = {
    'depth 65 inside a property': `<d:multistatus xmlns:d="DAV:"><d:response><d:href>${ns}/</d:href><d:propstat><d:prop><x:v xmlns:x="urn:x">${nest(62)}</x:v></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response></d:multistatus>`,
    '10001 elements': `<d:multistatus xmlns:d="DAV:">${'<d:responsedescription>x</d:responsedescription>'.repeat(10_000)}</d:multistatus>`,
    '257 xmlns': `<d:multistatus xmlns:d="DAV:"><x:a ${xmlns(64, 0)}><x:b ${xmlns(64, 64)}><x:c ${xmlns(64, 128)}><x:e ${xmlns(64, 192)}/></x:c></x:b></x:a></d:multistatus>`.replaceAll('<x:', '<p0:').replaceAll('</x:', '</p0:'),
  };
  for (const [label, xml] of Object.entries(cases)) {
    override = (p) => (p === ns ? xml : null);
    const ex = await s.client.exportAll();
    assert.deepEqual([ex.status, ex.data.outcome], [503, 'export_incomplete'], label);
    assert.equal(ex.data.records, undefined, label); assert.equal(ex.data.count, undefined, label);
    assert.match(ex.data.detail ?? '', /resource limit/, `${label}: rejected by the resource gate, not incidentally`);
  }
  assert.equal(writes(), before, 'zero upstream write effects');
  override = null;
  assert.equal((await s.client.exportAll()).data.count, 1, 'normal listing still exports');
});

// ---------------------------------------------------------------- R05-2 explicit PROPFIND
async function lockedStack(t, mockOptions = {}) {
  const s = await startStack({ mockOptions });
  t.after(() => s.stop());
  const n1 = syntheticNote(9000001, undefined, 0);
  const n2 = syntheticNote(9000001, undefined, 1);
  for (const n of [n1, n2]) assert.equal((await s.client.put('notes', n.literatureId, n, '*')).data.outcome, 'saved');
  const ns = `/lms-poc/${s.namespace}`;
  // synthetic DAV locks on a record and on its collection
  s.mock.locks.add(`${ns}/notes/${n1.literatureId}.json`); s.mock.locks.add(`${ns}/notes`);
  return { s, ns, n1, n2 };
}

test('R05-2 outbound PROPFIND: exact resourcetype-only body, Content-Type, Content-Length, Depth; never allprop', async (t) => {
  const { s } = await lockedStack(t);
  const from = s.mock.requestLog.length;
  assert.equal((await s.client.exportAll()).data.count, 2);
  const pf = s.mock.requestLog.slice(from).filter((e) => e.method === 'PROPFIND');
  assert.equal(pf.length, 4, 'root + 3 canonical kinds');
  const expected = PROPFIND_RESOURCETYPE_BODY.toString('utf8');
  for (const e of pf) {
    assert.equal(e.body, expected);
    assert.equal(e.bodyBytes, PROPFIND_RESOURCETYPE_BODY.length);
    assert.equal(e.contentLength, String(PROPFIND_RESOURCETYPE_BODY.length));
    assert.equal(e.contentType, 'application/xml; charset=utf-8'); assert.equal(PROPFIND_CONTENT_TYPE, e.contentType);
    assert.equal(e.depth, '1');
    assert.doesNotMatch(e.body, /allprop|lockdiscovery|current-user-principal|propname/);
  }
  assert.match(expected, /^<\?xml version="1\.0" encoding="utf-8"\?>\n<d:propfind xmlns:d="DAV:"><d:prop><d:resourcetype\/><\/d:prop><\/d:propfind>\n$/);
  const depth0 = await s.adapter.propfind(`/${s.namespace}`, '0');
  assert.equal(depth0.outcome, 'ok');
  assert.equal(s.mock.requestLog.at(-1).depth, '0', 'caller-supplied Depth preserved');
});

test('R05-2 locked records on a conforming server: export succeeds with the correct count; restore works', async (t) => {
  const { s, ns, n1 } = await lockedStack(t);
  const ex = await s.client.exportAll();
  assert.deepEqual([ex.status, ex.data.count], [200, 2]);
  const rs = await s.client.restore(ex.data, 'restore-r05-locked');
  assert.deepEqual([rs.data.outcome, rs.data.verified], ['restored', 2]);
  // Why it matters: the SAME server answering an empty-body (allprop) PROPFIND returns legal
  // lockdiscovery/current-user-principal with nested DAV:href, which this POC profile refuses.
  const { port } = new URL(s.dav.url);
  const raw = await fetch(`http://127.0.0.1:${port}${ns}/notes`, { method: 'PROPFIND', headers: { Depth: '1', Authorization: `Basic ${Buffer.from(`${s.secrets.davUser}:${s.secrets.davPass}`).toString('base64')}` } });
  const allprop = await raw.text();
  assert.match(allprop, /lockdiscovery/); assert.match(allprop, new RegExp(n1.literatureId));
  assert.throws(() => parseMultistatus(allprop), /DAV_XML/);
});

test('R05-2 non-conforming server ignoring the requested scope (allprop extras with nested DAV:href) → 503, no bundle', async (t) => {
  for (const withLocks of [true, false]) {
    const s = await startStack({ mockOptions: { ignorePropSelection: true } });
    t.after(() => s.stop());
    const n = syntheticNote();
    await s.client.put('notes', n.literatureId, n, '*');
    if (withLocks) s.mock.locks.add(`/lms-poc/${s.namespace}/notes/${n.literatureId}.json`);
    const ex = await s.client.exportAll();
    assert.deepEqual([ex.status, ex.data.outcome], [503, 'export_incomplete'], `locks=${withLocks} (current-user-principal alone suffices)`);
    assert.equal(ex.data.records, undefined);
  }
});

test('R05-2 nested DAV:href inside an unexpected property → 503 (not silently dropped)', async (t) => {
  let override = null;
  const s = await startStack({ mockOptions: { propfindOverride: (p) => (override ? override(p) : null) } });
  t.after(() => s.stop());
  const n = syntheticNote();
  await s.client.put('notes', n.literatureId, n, '*');
  const ns = `/lms-poc/${s.namespace}`;
  const col = (h, extra = '') => `<d:response><d:href>${h}</d:href><d:propstat><d:prop><d:resourcetype><d:collection/></d:resourcetype>${extra}</d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>`;
  override = (p) => (p === ns ? `<d:multistatus xmlns:d="DAV:">${col(`${ns}/`, '<d:owner><d:href>/principals/x/</d:href></d:owner>')}${col(`${ns}/notes/`)}${col(`${ns}/projects/`)}${col(`${ns}/progress/`)}</d:multistatus>` : null);
  const ex = await s.client.exportAll();
  assert.deepEqual([ex.status, ex.data.outcome], [503, 'export_incomplete']);
});

for (const status of [400, 403, 415, 500]) {
  test(`R05-2 no allprop fallback: PROPFIND answered ${status} → fail closed, exactly one PROPFIND, never an empty body`, async (t) => {
    const s = await startStack();
    t.after(() => s.stop());
    const n = syntheticNote();
    await s.client.put('notes', n.literatureId, n, '*');
    const from = s.mock.requestLog.length;
    s.mock.faults.push({ method: 'PROPFIND', kind: 'status', status });
    const ex = await s.client.exportAll();
    assert.deepEqual([ex.status, ex.data.outcome], [503, 'export_incomplete']);
    const pf = s.mock.requestLog.slice(from).filter((e) => e.method === 'PROPFIND');
    assert.equal(pf.length, 1, 'no retry of any kind');
    assert.ok(pf.every((e) => e.bodyBytes === PROPFIND_RESOURCETYPE_BODY.length));
  });
}

test('R05-2 canonical checks, 0- and 2-record export/restore, and prefixes still work with the explicit request', async (t) => {
  const s0 = await startStack();
  t.after(() => s0.stop());
  for (const p of ['', '/notes', '/projects', '/progress']) s0.mock.collections.add(`/lms-poc/${s0.namespace}${p}`);
  const e0 = await s0.client.exportAll();
  assert.deepEqual([e0.status, e0.data.count], [200, 0]);
  s0.mock.collections.delete(`/lms-poc/${s0.namespace}/progress`);
  assert.equal((await s0.client.exportAll()).data.reason, 'missing_kind_collection');
  for (const xmlStyle of ['D', 'default', 'z']) {
    const { s } = await lockedStack(t, { xmlStyle });
    const ex = await s.client.exportAll();
    assert.equal(ex.data.count, 2, xmlStyle);
    assert.equal((await s.client.restore(ex.data, `restore-r05-${xmlStyle.toLowerCase()}`)).data.verified, 2);
  }
});

test('R05 non-regression: R04 hidden-response protection intact with the new request', async (t) => {
  let override = null;
  const s = await startStack({ mockOptions: { propfindOverride: (p) => (override ? override(p) : null) } });
  t.after(() => s.stop());
  const n = syntheticNote();
  await s.client.put('notes', n.literatureId, n, '*');
  const ns = `/lms-poc/${s.namespace}`;
  const r = (h, col) => `<d:response><d:href>${h}</d:href><d:propstat><d:prop><d:resourcetype>${col ? '<d:collection/>' : ''}</d:resourcetype></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>`;
  override = (p) => (p === `${ns}/notes` ? `<d:multistatus xmlns:d="DAV:" xmlns:x="urn:x">${r(`${ns}/notes/`, true)}<x:wrap>${r(`${ns}/notes/${n.literatureId}.json`)}</x:wrap></d:multistatus>` : null);
  assert.deepEqual([(await s.client.exportAll()).status], [503]);
});
