// Sanity check that the POC tests have teeth: inject known-bad changes into a
// temporary copy of poc/001 and require the relevant suite to FAIL.
import { cp, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MUTANTS = [
  { id: 'M1', desc: 'adapter treats 5xx as committed', file: 'src/webdav-adapter.mjs',
    from: "return { outcome: 'unknown', status: r.status };", to: "return { outcome: 'committed', status: r.status, etag: null };", suite: 'test/poc06-faults.test.mjs' },
  { id: 'M2', desc: 'API forwards writes without If-Match (naive overwrite)', file: 'src/safe-api.mjs',
    from: 'const w = await adapter.put(recPath(namespace, kind, id), bytes, cond);', to: 'const w = await adapter.put(recPath(namespace, kind, id), bytes, { unsafeUnconditional: true });', suite: 'test/poc05-race.test.mjs' },
  { id: 'M3', desc: 'API re-sends an operation whose outcome is Unknown', file: 'src/safe-api.mjs',
    from: "if (prior.verdict === 'unknown') return json(res, 409, { outcome: 'verification_required', operationId: opId });", to: "if (prior.verdict === 'unknown') ledger.delete(key); else", suite: 'test/poc06-faults.test.mjs' },
  { id: 'M4', desc: 'API access log records request headers (session token leak)', file: 'src/safe-api.mjs',
    from: 'log({ m: req.method,', to: 'log({ h: req.headers, m: req.method,', suite: 'test/poc02-security.test.mjs' },
  { id: 'M5', desc: 'restore allowed into the active namespace', file: 'src/safe-api.mjs',
    from: "|| target === namespace) return json(res, 400", to: "&& target !== namespace) return json(res, 400", suite: 'test/poc07-backup.test.mjs' },
  { id: 'M6', desc: 'path id allowlist removed (traversal possible)', file: 'src/note-codec.mjs',
    from: 'export const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;', to: 'export const ID_RE = /^.+$/;', suite: 'test/poc02-security.test.mjs' },
  { id: 'M7', desc: 'P1-1 regression: verify treats unchanged base as terminal not_committed', file: 'src/safe-api.mjs',
    from: "outcome: unchanged ? 'not_yet_observed' : 'indeterminate',", to: "outcome: unchanged ? (ledger.get(ledgerKey(principal, opId)) && (ledger.get(ledgerKey(principal, opId)).verdict = 'not_committed', ledger.get(ledgerKey(principal, opId)).response = { status: 409, body: { outcome: 'not_committed' } }), 'not_committed') : 'indeterminate',", suite: 'test/r01-regressions.test.mjs' },
  { id: 'M8', desc: 'P1-2 regression: ledger reservation moved after the body await', file: 'src/safe-api.mjs',
    from: "    const full = reserve(key, entry);", to: "    await new Promise((r) => setTimeout(r, 50));\n    const full = reserve(key, entry);", suite: 'test/r01-regressions.test.mjs' },
  { id: 'M9', desc: 'P1-3 regression: If-Match syntax validation removed', file: 'src/safe-api.mjs',
    from: "      if (STRONG_ETAG_RE.test(im)) return { cond: { ifMatch: im } };", to: "      if (im !== '*') return { cond: { ifMatch: im } };", suite: 'test/r01-regressions.test.mjs' },
  { id: 'M10', desc: 'P1-4 regression: https accepted and sent over node:http', file: 'src/webdav-adapter.mjs',
    from: "  if (base.protocol === 'https:') {", to: "  if (base.protocol === 'never:') {", suite: 'test/r01-regressions.test.mjs' },
  { id: 'M11', desc: 'P2-5 regression: kind lookup via plain object (prototype keys)', file: 'src/note-codec.mjs',
    from: "export const isKind = (k) => typeof k === 'string' && RECORD_KINDS.has(k);", to: "const KOBJ = { notes: 1, projects: 1, progress: 1 };\nexport const isKind = (k) => typeof k === 'string' && !!KOBJ[k];", suite: 'test/r01-regressions.test.mjs' },
  { id: 'M12', desc: 'P2-7 regression: export skips unrecognized entries silently', file: 'src/safe-api.mjs',
    from: "        if (!m || !isId(m[1]) || x.collection) return { error: 'unrecognized_entry', at: x.path };", to: "        if (!m || !isId(m[1]) || x.collection) continue;", suite: 'test/r01-regressions.test.mjs' },
  { id: 'M13', desc: 'P2-12 regression: refused-after-connect classified as not_sent', file: 'src/webdav-adapter.mjs',
    from: "      if (!r.connected) return { outcome: 'not_sent', code: r.code };", to: "      if (!r.connected || r.code === 'ECONNRESET') return { outcome: 'not_sent', code: r.code };", suite: 'test/r01-regressions.test.mjs' },
  { id: 'M14', desc: "P1-R1 regression: fence terminal without ETag-change guard", file: 'src/safe-api.mjs',
    from: "        if (!isTrustedEtag(w.etag) || w.etag === e.base) {", to: "        if (false) {", suite: 'test/r02-regressions.test.mjs' },
  { id: 'M15', desc: "P2-N1 regression: DAV elements matched by d: prefix instead of namespace URI", file: 'src/dav-xml.mjs',
    from: "const isDav = (n, local) => n && n.qname && n.ns === DAV && n.local === local;", to: "const isDav = (n, local) => n && n.qname === `d:${local}`;", suite: 'test/r02-regressions.test.mjs' },
  { id: 'M16', desc: "P2-N2 regression: absolute deadline effectively disabled", file: 'src/webdav-adapter.mjs',
    from: "{ code: 'EDEADLINE' })), deadlineMs);", to: "{ code: 'EDEADLINE' })), deadlineMs * 1000);", suite: 'test/r02-regressions.test.mjs' },
  { id: 'M17', desc: "P2-N3 regression: tombstones ignored on replay", file: 'src/safe-api.mjs',
    from: "    const prior = ledger.get(key) ?? tombstones.get(key);", to: "    const prior = ledger.get(key);", suite: 'test/r02-regressions.test.mjs' },
  { id: 'M18', desc: "P2-N4 regression: principal id from token array position", file: 'src/safe-api.mjs',
    from: "  const principals = apiTokens.map((token) => ({ token, id: `p_${sha256Hex(Buffer.from(`lms-principal\\u0000${token}`)).slice(0, 24)}` }));", to: "  const principals = apiTokens.map((token, i) => ({ token, id: `p${i}` }));", suite: 'test/r02-regressions.test.mjs' },
  { id: 'M19', desc: "P2-N4 regression: provenance not checked on read", file: 'src/safe-api.mjs',
    from: "    if (!authentic(env)) return { outcome: 'unauthenticated', etag: r.etag };", to: "    // provenance check removed", suite: 'test/r02-regressions.test.mjs' },
  { id: 'M20', desc: "P2-N5 regression: no per-principal quota", file: 'src/safe-api.mjs',
    from: "    if (countFor(p) >= maxPerPrincipal) return 'principal_ledger_full';", to: "    // per-principal quota removed", suite: 'test/r02-regressions.test.mjs' },
  { id: 'M21', desc: "P2-N6 regression: concurrent fences not serialised", file: 'src/safe-api.mjs',
    from: "    if (e.fencing) return json(res, 409, { outcome: 'fence_in_progress', terminal: false, operationId: opId });", to: "    // fence serialisation removed", suite: 'test/r02-regressions.test.mjs' },
  { id: 'M22', desc: "P2-N7 regression: comma allowed in POC If-Match profile", file: 'src/safe-api.mjs',
    from: "export const STRONG_ETAG_RE = /^\"[\\x21\\x23-\\x2b\\x2d-\\x7e]{1,128}\"$/;", to: "export const STRONG_ETAG_RE = /^\"[\\x21\\x23-\\x7e]{1,128}\"$/;", suite: 'test/r02-regressions.test.mjs' },
  { id: 'M23', desc: "P2-N8 regression: weak ETag treated as trusted (W/ stripped)", file: 'src/safe-api.mjs',
    from: "const isTrustedEtag = (t) => typeof t === 'string' && STRONG_ETAG_RE.test(t);", to: "const isTrustedEtag = (t) => typeof t === 'string' && STRONG_ETAG_RE.test(t.replace(/^W\\//, ''));", suite: 'test/r02-regressions.test.mjs' },
  { id: 'M24', desc: "Q1 regression: missing canonical kind collection read as empty", file: 'src/safe-api.mjs',
    from: "    for (const k of KIND_NAMES) if (!seenKinds.has(k)) return { error: 'missing_kind_collection', at: `/${ns}/${k}` };", to: "    // missing-kind check removed", suite: 'test/r03-regressions.test.mjs' },
  { id: 'M25', desc: "Q1 regression: adapter silently accepts duplicate normalized hrefs", file: 'src/webdav-adapter.mjs',
    from: "      if (new Set(norm).size !== norm.length) return { outcome: 'malformed', reason: 'duplicate href' };", to: "      // duplicate-href check removed", suite: 'test/r03-regressions.test.mjs' },
  { id: 'M26', desc: "Q1 regression: response-level status + propstat accepted", file: 'src/dav-xml.mjs',
    from: "    if (direct.length > 0 && propstats.length > 0) throw new DavXmlError('response has both status and propstat');", to: "    // status/propstat conflict check removed", suite: 'test/r03-regressions.test.mjs' },
  { id: 'M27', desc: "Q1 regression: absent namespace exported as empty", file: 'src/safe-api.mjs',
    from: "    if (root.outcome === 'not_found') return { error: 'namespace_absent', at: `/${ns}` };", to: "    if (root.outcome === 'not_found') return { records: [] };", suite: 'test/r03-regressions.test.mjs' },
  { id: 'M28', desc: "Q2 regression: fence trusts PUT-response ETag (no GET read-back)", file: 'src/safe-api.mjs',
    from: "        const rb = await adapter.get(recPath(namespace, e.kind, e.id));", to: "        const rb = { outcome: 'ok', etag: w.etag, body: r.body };", suite: 'test/r03-regressions.test.mjs' },
  { id: 'M29', desc: "Q2 regression: read-back ETag not compared with PUT ETag", file: 'src/safe-api.mjs',
    from: "        if (rb.etag !== w.etag) return notConfirmed('readback_etag_mismatch');", to: "        // PUT/GET ETag equality check removed", suite: 'test/r03-regressions.test.mjs' },
  { id: 'M30', desc: "Q2 regression: read-back bytes not compared with fence payload", file: 'src/safe-api.mjs',
    from: "        if (!rb.body.equals(r.body)) return notConfirmed('readback_bytes_changed');", to: "        // read-back byte comparison removed", suite: 'test/r03-regressions.test.mjs' },
  { id: 'M31', desc: "R04-1 regression: whole-tree structure validation not called (silent-ignore restored)", file: 'src/dav-xml.mjs',
    from: "  validateStructure(root, null); // R04-1: whole-tree hierarchy check \u2014 nothing can be silently skipped", to: "  // structure validation removed", suite: 'test/r04-regressions.test.mjs' },
  { id: 'M32', desc: "R04-1 regression: DAV structural parent rule disabled", file: 'src/dav-xml.mjs',
    from: "    if (!STRUCTURAL_PARENT[davLocal].includes(parentLocal)) throw new DavXmlError(`misplaced DAV:${davLocal} under ${parent ? parent.qname : 'document'}`);", to: "    if (false) throw new DavXmlError(`misplaced DAV:${davLocal} under ${parent ? parent.qname : 'document'}`);", suite: 'test/r04-regressions.test.mjs' },
  { id: 'M33', desc: "R04-1 regression: container child allowlists disabled", file: 'src/dav-xml.mjs',
    from: "      if (c.ns !== DAV || !ALLOWED_CHILDREN[davLocal].has(c.local)) throw new DavXmlError(`unsupported child ${c.qname} in DAV:${davLocal}`);", to: "      if (false) throw new DavXmlError(`unsupported child ${c.qname} in DAV:${davLocal}`);", suite: 'test/r04-regressions.test.mjs' },
  { id: 'M34', desc: "R04-1 regression: foreign response-shaped elements accepted", file: 'src/dav-xml.mjs',
    from: "  if (node.ns !== DAV && RESPONSE_SHAPED.has(node.local)) throw new DavXmlError(`response-shaped element in foreign namespace: ${node.qname}`);", to: "  // foreign response-shaped check removed", suite: 'test/r04-regressions.test.mjs' },
  { id: 'M35', desc: "R04-1 regression: element children allowed inside text-only DAV elements", file: 'src/dav-xml.mjs',
    from: "  if (davLocal && TEXT_ONLY.has(davLocal) && node.children.some((c) => c.qname)) throw new DavXmlError(`DAV:${davLocal} must contain text only`);", to: "  // text-only check removed", suite: 'test/r04-regressions.test.mjs' },
  { id: 'M36', desc: "R04-2 regression: collection marker accepted from any propstat (incl. 404)", file: 'src/dav-xml.mjs',
    from: "    const collection = propstats.filter(is2xx).some((p) => kids(p, 'prop').some((pr) => kids(pr, 'resourcetype').some((rt) => kids(rt, 'collection').length > 0)));", to: "    const collection = propstats.some((p) => kids(p, 'prop').some((pr) => kids(pr, 'resourcetype').some((rt) => kids(rt, 'collection').length > 0)));", suite: 'test/r04-regressions.test.mjs' },
  { id: 'M37', desc: "R04-2 regression: adapter treats trailing-slash href as collection", file: 'src/webdav-adapter.mjs',
    from: "        entries: mapped.map((e) => ({ path: e.rel.replace(/\\/$/, '') || '/', collection: e.collection })),", to: "        entries: mapped.map((e) => ({ path: e.rel.replace(/\\/$/, '') || '/', collection: e.collection || e.rel.endsWith('/') })),", suite: 'test/r04-regressions.test.mjs' },
  { id: 'M38', desc: "R05-1 regression: nesting-depth guard removed", file: 'src/dav-xml.mjs',
    from: "    if (depth > LIMITS.maxDepth) throw new DavXmlError(`resource limit: nesting depth > ${LIMITS.maxDepth}`);", to: "    // depth guard removed", suite: 'test/r05-regressions.test.mjs' },
  { id: 'M39', desc: "R05-1 regression: element-count guard removed", file: 'src/dav-xml.mjs',
    from: "    if (++budget.elements > LIMITS.maxElements) throw new DavXmlError(`resource limit: more than ${LIMITS.maxElements} elements`);", to: "    budget.elements++; // element guard removed", suite: 'test/r05-regressions.test.mjs' },
  { id: 'M40', desc: "R05-1 regression: per-element attribute guard removed", file: 'src/dav-xml.mjs',
    from: "    if (attrs.size + 1 > LIMITS.maxAttrsPerElement) throw new DavXmlError(`resource limit: more than ${LIMITS.maxAttrsPerElement} attributes on one element`);", to: "    // per-element attribute guard removed", suite: 'test/r05-regressions.test.mjs' },
  { id: 'M41', desc: "R05-1 regression: total attribute guard removed", file: 'src/dav-xml.mjs',
    from: "    if (++budget.attributes > LIMITS.maxTotalAttrs) throw new DavXmlError(`resource limit: more than ${LIMITS.maxTotalAttrs} attributes in document`);", to: "    budget.attributes++; // total attribute guard removed", suite: 'test/r05-regressions.test.mjs' },
  { id: 'M42', desc: "R05-1 regression: namespace-declaration guard removed", file: 'src/dav-xml.mjs',
    from: "      if (++budget.nsDecls > LIMITS.maxNsDecls) throw new DavXmlError(`resource limit: more than ${LIMITS.maxNsDecls} namespace declarations`);", to: "      budget.nsDecls++; // namespace guard removed", suite: 'test/r05-regressions.test.mjs' },
  { id: 'M43', desc: "R05-1 regression: per-element namespace Map copy restored", file: 'src/dav-xml.mjs',
    from: "    let ns = parentNs;", to: "    let ns = new Map(parentNs); budget.scopeMaps++;", suite: 'test/r05-regressions.test.mjs' },
  { id: 'M44', desc: "R05-1 regression: multi-colon qname accepted", file: 'src/dav-xml.mjs',
    from: "    if (colon !== t.qname.lastIndexOf(':')) throw new DavXmlError('bad qname (more than one colon)');", to: "    // multi-colon guard removed", suite: 'test/r05-regressions.test.mjs' },
  { id: 'M45', desc: "R05-2 regression: empty-body (allprop) PROPFIND restored", file: 'src/webdav-adapter.mjs',
    from: "        body: PROPFIND_RESOURCETYPE_BODY,", to: "        body: undefined,", suite: 'test/r05-regressions.test.mjs' },
  { id: 'M46', desc: "R05-2 regression: PROPFIND Content-Type header dropped", file: 'src/webdav-adapter.mjs',
    from: "        headers: { Depth: depth, 'Content-Type': PROPFIND_CONTENT_TYPE },", to: "        headers: { Depth: depth },", suite: 'test/r05-regressions.test.mjs' },
  { id: 'M47', desc: "R05-2 regression: allprop fallback after a non-207 PROPFIND", file: 'src/webdav-adapter.mjs',
    from: "      if (r.status !== 207) return { outcome: 'error', status: r.status };", to: "      if (r.status !== 207) { await request('PROPFIND', path, { headers: { Depth: depth } }); return { outcome: 'error', status: r.status }; }", suite: 'test/r05-regressions.test.mjs' },
];

let failures = 0;
for (const m of MUTANTS) {
  const dir = await mkdtemp(join(tmpdir(), `poc001-${m.id}-`));
  await cp(root, dir, { recursive: true, filter: (p) => !p.includes('node_modules') && !p.includes('/evidence/') });
  const f = join(dir, m.file);
  const src = await readFile(f, 'utf8');
  if (!src.includes(m.from)) { console.log(`${m.id} SETUP_ERROR pattern not found`); failures++; continue; }
  await writeFile(f, src.replace(m.from, m.to));
  const r = spawnSync(process.execPath, ['--test', m.suite], { cwd: dir, encoding: 'utf8', timeout: 180_000 });
  const killed = r.status !== 0;
  console.log(`${m.id} ${killed ? 'KILLED' : 'SURVIVED'} (suite exit ${r.status}) — ${m.desc}`);
  if (!killed) failures++;
  await rm(dir, { recursive: true, force: true });
}
console.log(failures ? `MUTATION CHECK: ${failures} problem(s)` : 'MUTATION CHECK: all mutants killed');
process.exit(failures ? 1 : 0);
