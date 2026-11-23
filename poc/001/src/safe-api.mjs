// POC-001 — minimal loopback "safe API" between browser-like clients and WebDAV.
// Not a production server. Proves boundary/logic only, against a LOCAL MOCK.
//
// REMEDIATION-01 changes (see poc/001/README.md "Remediation 01"):
//  P1-1  verify never turns "ETag still equals base" into a terminal not_committed;
//        only an explicit FENCE write (re-PUT of the current bytes with If-Match:base,
//        which makes any still-in-flight If-Match:base request impossible to commit
//        under atomic CAS) yields a terminal, fenced not_committed.
//  P1-2  Operation-Id reserved synchronously before the first await; payload/target
//        fingerprint enforced; exceptions never strand an entry as pending.
//  P1-3  If-Match must be exactly one strong entity-tag; If-None-Match only "*";
//        both together refused — all before any upstream request.
//  P2-5  kind lookups via Map only; P2-6 strict envelope validation on restore;
//  P2-7  export fails closed on unrecognized entries; P2-8 ledger scoped per
//        principal, bounded, write tags bound to principal; P2-9 restore target
//        acquired via MKCOL (atomic at the storage) + in-process lock.
//
// The ledger is PROCESS MEMORY ONLY: no durable or cross-instance idempotency.
import http from 'node:http';
import {
  isKind, isId, validatorFor, KIND_NAMES, encodeEnvelope, decodeEnvelope, renderMarkdown,
} from './note-codec.mjs';
import { assertLoopbackHost, sha256Hex, timingSafeEqualStr } from './util.mjs';

const NS_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const OP_RE = /^[0-9a-f][0-9a-f-]{7,63}$/;
// Exactly one strong entity-tag: DQUOTE *etagc DQUOTE, etagc = %x21 / %x23-7E (RFC 9110), bounded.
export const STRONG_ETAG_RE = /^"[\x21\x23-\x7e]{1,128}"$/;
const MAX_BODY = 1_000_000;
const MAX_RESTORE_BODY = 20_000_000;
const TERMINAL = new Set(['saved', 'not_saved', 'conflict', 'committed_unverified', 'verification_failed', 'not_committed']);

export function createSafeApi({
  adapter, namespace, apiTokens, allowedOrigins = [], host = '127.0.0.1', log = () => {}, maxLedgerEntries = 10_000,
}) {
  assertLoopbackHost(host);
  if (!NS_RE.test(namespace)) throw new Error('invalid namespace');
  if (!apiTokens?.length) throw new Error('apiTokens required');
  const principals = apiTokens.map((token, i) => ({ token, id: `p${i}` }));
  const ledger = new Map(); // `${principal}\0${opId}` -> entry
  const ensured = new Set();
  const restoring = new Set();
  let server;

  const recPath = (ns, kind, id) => `/${ns}/${kind}/${id}.json`;
  const ledgerKey = (p, op) => `${p}\u0000${op}`;
  /** Write tag stored in the record: binds an Operation-Id to the principal that issued it. */
  const writeTag = (p, op) => sha256Hex(Buffer.from(`${p}\u0000${op}`)).slice(0, 32);

  function reserve(key, entry) {
    if (ledger.size >= maxLedgerEntries) {
      for (const [k, e] of ledger) {
        if (TERMINAL.has(e.verdict)) { ledger.delete(k); if (ledger.size < maxLedgerEntries) break; }
      }
    }
    if (ledger.size >= maxLedgerEntries) return false; // fail closed: never evict pending/unknown
    ledger.set(key, entry);
    return true;
  }

  async function ensureCollections(ns) {
    if (ensured.has(ns)) return true;
    for (const p of [`/${ns}`, ...KIND_NAMES.map((k) => `/${ns}/${k}`)]) {
      const r = await adapter.mkcol(p);
      if (!(r.outcome === 'committed' || (r.outcome === 'rejected' && r.status === 405))) return false;
    }
    ensured.add(ns);
    return true;
  }

  function principalOf(req) {
    const h = req.headers.authorization ?? '';
    if (!h.startsWith('Bearer ')) return null;
    const tok = h.slice(7);
    let found = null;
    for (const p of principals) if (timingSafeEqualStr(p.token, tok)) found = p.id;
    return found;
  }

  async function readBody(req, limit) {
    const chunks = [];
    let n = 0;
    for await (const c of req) {
      n += c.length;
      if (n > limit) return null;
      chunks.push(c);
    }
    return Buffer.concat(chunks);
  }

  const json = (res, status, obj, headers = {}) => {
    const body = JSON.stringify(obj);
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers });
    res.end(body);
    return { status, outcome: obj.outcome ?? obj.error ?? null };
  };

  async function readRecord(ns, kind, id) {
    const r = await adapter.get(recPath(ns, kind, id));
    if (r.outcome !== 'ok') return r;
    try { return { ...r, env: decodeEnvelope(r.body, { kind, id }) }; } catch { return { outcome: 'corrupt', etag: r.etag }; }
  }

  async function handleGet(res, kind, id) {
    const r = await readRecord(namespace, kind, id);
    if (r.outcome === 'ok') return json(res, 200, { outcome: 'ok', revision: r.etag, writeTag: r.env.operationId, record: r.env.data });
    if (r.outcome === 'not_found') return json(res, 404, { outcome: 'not_found' });
    if (r.outcome === 'corrupt') return json(res, 502, { outcome: 'corrupt_record' });
    return json(res, 503, { outcome: 'unavailable' });
  }

  function parseCondition(req) {
    const im = req.headers['if-match'];
    const inm = req.headers['if-none-match'];
    if (im !== undefined && inm !== undefined) return { error: [400, 'conflicting_preconditions'] };
    if (im !== undefined) return STRONG_ETAG_RE.test(im) ? { cond: { ifMatch: im } } : { error: [400, 'invalid_if_match'] };
    if (inm !== undefined) return inm === '*' ? { cond: { ifNoneMatch: '*' } } : { error: [400, 'invalid_if_none_match'] };
    return { error: [428, 'revision_precondition_required'] };
  }

  async function handlePut(req, res, principal, kind, id) {
    if (!(req.headers['content-type'] ?? '').startsWith('application/json')) return json(res, 415, { error: 'json_required' });
    const opId = req.headers['operation-id'];
    if (typeof opId !== 'string' || !OP_RE.test(opId)) return json(res, 400, { error: 'operation_id_required' });
    const pc = parseCondition(req);
    if (pc.error) return json(res, pc.error[0], { error: pc.error[1] });
    const cond = pc.cond;
    const base = cond.ifMatch ?? '*';
    const key = ledgerKey(principal, opId);

    const prior = ledger.get(key);
    if (prior) {
      if (prior.kind !== kind || prior.id !== id || prior.base !== base) return json(res, 422, { error: 'operation_id_reused_for_other_target' });
      if (prior.verdict === 'pending') return json(res, 409, { outcome: 'operation_in_progress', operationId: opId });
      const raw = await readBody(req, MAX_BODY);
      if (raw === null || sha256Hex(raw) !== prior.fingerprint) return json(res, 422, { error: 'operation_id_reused_with_different_payload' });
      if (prior.verdict === 'unknown') return json(res, 409, { outcome: 'verification_required', operationId: opId });
      return json(res, prior.response.status, prior.response.body, { 'Operation-Replayed': 'true' });
    }

    // P1-2: synchronous reservation BEFORE the first await.
    const entry = { principal, opId, kind, id, base, fingerprint: null, sha256: null, verdict: 'pending', sentUpstream: false, fenced: false, at: Date.now() };
    if (!reserve(key, entry)) return json(res, 503, { outcome: 'not_saved', reason: 'operation_ledger_full' });
    const release = (status, body) => { ledger.delete(key); return json(res, status, body); };
    const finish = (verdict, status, body) => {
      entry.verdict = verdict;
      entry.response = { status, body };
      return json(res, status, body);
    };

    try {
      const raw = await readBody(req, MAX_BODY);
      if (raw === null) return release(413, { error: 'body_too_large' });
      let data;
      try { data = JSON.parse(raw.toString('utf8')); } catch { return release(400, { error: 'invalid_json' }); }
      const errs = validatorFor(kind)(id, data);
      if (errs.length) return release(422, { error: 'invalid_record', details: errs });
      entry.fingerprint = sha256Hex(raw);

      if (!(await ensureCollections(namespace))) return release(503, { outcome: 'not_saved', reason: 'storage_unavailable' });
      const bytes = encodeEnvelope({ kind, id, operationId: writeTag(principal, opId), data });
      entry.sha256 = sha256Hex(bytes);
      entry.sentUpstream = true;
      const w = await adapter.put(recPath(namespace, kind, id), bytes, cond);

      if (w.outcome === 'committed') {
        const rb = await adapter.get(recPath(namespace, kind, id));
        if (rb.outcome === 'ok' && w.etag && rb.etag === w.etag) {
          if (sha256Hex(rb.body) !== entry.sha256) return finish('verification_failed', 502, { outcome: 'verification_failed', reason: 'stored_bytes_differ', revision: w.etag });
          return finish('saved', 200, { outcome: 'saved', revision: w.etag, sha256: entry.sha256 });
        }
        return finish('committed_unverified', 202, { outcome: 'committed_unverified', revision: w.etag ?? null });
      }
      if (w.outcome === 'precondition_failed') {
        const cur = await readRecord(namespace, kind, id);
        return finish('conflict', 412, {
          outcome: 'conflict',
          currentRevision: cur.outcome === 'ok' ? cur.etag : null,
          currentRecord: cur.outcome === 'ok' ? cur.env.data : null,
        });
      }
      if (w.outcome === 'rejected') {
        const map = { 401: [502, 'upstream_auth'], 403: [502, 'upstream_forbidden'], 409: [502, 'upstream_conflict'], 423: [423, 'locked'], 429: [503, 'rate_limited'] };
        const [status, reason] = map[w.status] ?? [502, 'upstream_rejected'];
        return finish('not_saved', status, { outcome: 'not_saved', reason, retryAfter: w.retryAfter ?? null });
      }
      if (w.outcome === 'not_sent') return finish('not_saved', 503, { outcome: 'not_saved', reason: 'offline' });
      entry.verdict = 'unknown';
      return json(res, 504, { outcome: 'unknown', operationId: opId, verify: `/api/operations/${opId}` });
    } catch (e) {
      // P2-8: never strand an entry as pending.
      if (entry.verdict === 'pending') {
        if (entry.sentUpstream) entry.verdict = 'unknown';
        else ledger.delete(key);
      }
      throw e;
    }
  }

  /** Observe only. Terminal verdicts come from the ledger, from finding OUR write tag, or from a fence. */
  async function handleVerify(res, principal, opId, query) {
    let e = ledger.get(ledgerKey(principal, opId));
    let ephemeral = false;
    if (!e) {
      // After an API restart the in-memory ledger is gone: caller must restate the target. Never terminal.
      const kind = query.get('kind'); const id = query.get('id'); const base = query.get('base');
      if (!isKind(kind) || !isId(id) || !(base === '*' || STRONG_ETAG_RE.test(base ?? ''))) return json(res, 404, { outcome: 'unknown_operation' });
      e = { kind, id, base, verdict: 'unknown' };
      ephemeral = true;
    }
    if (e.verdict === 'pending') return json(res, 200, { outcome: 'in_progress', operationId: opId });
    if (TERMINAL.has(e.verdict)) return json(res, 200, { outcome: e.verdict === 'saved' ? 'committed' : e.verdict, terminal: true, fenced: e.fenced, operationId: opId });

    const r = await readRecord(namespace, e.kind, e.id);
    if (r.outcome === 'unavailable' || r.outcome === 'error') return json(res, 503, { outcome: 'unavailable', operationId: opId });
    if (r.outcome === 'corrupt') return json(res, 502, { outcome: 'corrupt_record', operationId: opId });
    if (r.outcome === 'ok' && r.env.operationId === writeTag(principal, opId)) {
      const ok = !e.sha256 || sha256Hex(r.body) === e.sha256;
      const verdict = ok ? 'saved' : 'verification_failed';
      if (!ephemeral) {
        e.verdict = verdict;
        e.response = ok ? { status: 200, body: { outcome: 'saved', revision: r.etag, verifiedAfterUnknown: true } } : { status: 502, body: { outcome: 'verification_failed' } };
      }
      return json(res, 200, { outcome: ok ? 'committed' : 'verification_failed', terminal: !ephemeral, operationId: opId, currentRevision: r.etag });
    }
    const unchanged = e.base === '*' ? r.outcome === 'not_found' : r.etag === e.base;
    // P1-1: unchanged base is NOT proof of failure — the original request may still commit later.
    return json(res, 200, {
      outcome: unchanged ? 'not_yet_observed' : 'indeterminate',
      terminal: false,
      operationId: opId,
      currentRevision: r.etag ?? null,
      next: unchanged && e.base !== '*' && !ephemeral ? `POST /api/operations/${opId}/fence` : null,
    });
  }

  /**
   * Fence: rewrite the CURRENT bytes with If-Match:<base>. If that commits, any still in-flight
   * request carrying If-Match:<base> can no longer commit (given atomic CAS at the storage), so
   * the operation is terminally not_committed. Changes the record ETag, not its content.
   */
  async function handleFence(res, principal, opId) {
    const e = ledger.get(ledgerKey(principal, opId));
    if (!e) return json(res, 404, { outcome: 'unknown_operation', note: 'fence requires the in-process ledger entry' });
    if (e.verdict !== 'unknown') return json(res, 409, { outcome: 'not_fenceable', verdict: e.verdict });
    if (e.base === '*') return json(res, 422, { outcome: 'fence_unsupported_for_create', note: 'create-only operations stay unknown until observed; see README' });
    const tag = writeTag(principal, opId);
    const r = await readRecord(namespace, e.kind, e.id);
    if (r.outcome !== 'ok') return json(res, r.outcome === 'corrupt' ? 502 : 503, { outcome: r.outcome === 'corrupt' ? 'corrupt_record' : 'unavailable' });
    const landed = (env) => env.operationId === tag;
    const markCommitted = (etag) => {
      e.verdict = 'saved';
      e.response = { status: 200, body: { outcome: 'saved', revision: etag, verifiedAfterUnknown: true } };
      return json(res, 200, { outcome: 'committed', terminal: true, operationId: opId, currentRevision: etag });
    };
    if (landed(r.env)) return markCommitted(r.etag);
    if (r.etag !== e.base) return json(res, 200, { outcome: 'indeterminate', terminal: false, operationId: opId, currentRevision: r.etag });
    const w = await adapter.put(recPath(namespace, e.kind, e.id), r.body, { ifMatch: e.base });
    if (w.outcome === 'committed') {
      e.verdict = 'not_committed';
      e.fenced = true;
      e.response = { status: 409, body: { outcome: 'not_committed', fenced: true, note: 'issue a NEW operation id to retry explicitly' } };
      return json(res, 200, { outcome: 'not_committed', terminal: true, fenced: true, operationId: opId, currentRevision: w.etag ?? null });
    }
    if (w.outcome === 'precondition_failed') {
      const again = await readRecord(namespace, e.kind, e.id);
      if (again.outcome === 'ok' && landed(again.env)) return markCommitted(again.etag);
      return json(res, 200, { outcome: 'indeterminate', terminal: false, operationId: opId });
    }
    return json(res, 200, { outcome: 'fence_not_confirmed', terminal: false, operationId: opId, fenceOutcome: w.outcome });
  }

  async function listRecords(ns) {
    const root = await adapter.propfind(`/${ns}`, '1');
    if (root.outcome === 'not_found') return { records: [] };
    if (root.outcome !== 'ok') return { error: 'storage_unavailable' };
    const kinds = [];
    for (const h of root.hrefs) {
      const clean = h.replace(/\/$/, '');
      if (clean === `/${ns}`) continue;
      const m = new RegExp(`^/${ns}/([^/]+)$`).exec(clean);
      if (!m || !isKind(m[1]) || !root.collections.includes(clean)) return { error: 'unrecognized_entry', at: clean };
      kinds.push(m[1]);
    }
    const out = [];
    for (const kind of kinds) {
      const p = await adapter.propfind(`/${ns}/${kind}`, '1');
      if (p.outcome !== 'ok') return { error: 'storage_unavailable' };
      for (const h of p.hrefs) {
        const clean = h.replace(/\/$/, '');
        if (clean === `/${ns}/${kind}`) continue;
        const m = new RegExp(`^/${ns}/${kind}/([^/]+)\\.json$`).exec(clean);
        if (!m || !isId(m[1]) || p.collections.includes(clean)) return { error: 'unrecognized_entry', at: clean };
        out.push({ kind, id: m[1] });
      }
    }
    return { records: out };
  }

  const manifestSha = (records) => sha256Hex(Buffer.from(records.map((r) => `${r.kind}/${r.id} ${r.sha256}`).sort().join('\n')));

  async function handleExport(res) {
    const list = await listRecords(namespace);
    if (list.error) return json(res, 503, { outcome: 'export_incomplete', reason: list.error, at: list.at ?? null });
    const records = [];
    for (const { kind, id } of list.records) {
      const r = await adapter.get(recPath(namespace, kind, id));
      if (r.outcome !== 'ok') return json(res, 503, { outcome: 'export_incomplete', reason: 'read_failed', at: `${kind}/${id}` });
      try { decodeEnvelope(r.body, { kind, id }); } catch { return json(res, 503, { outcome: 'export_incomplete', reason: 'invalid_record', at: `${kind}/${id}` }); }
      records.push({ kind, id, revision: r.etag, sha256: sha256Hex(r.body), bytesBase64: r.body.toString('base64') });
    }
    records.sort((a, b) => `${a.kind}/${a.id}`.localeCompare(`${b.kind}/${b.id}`));
    return json(res, 200, { outcome: 'ok', format: 'lms.poc001.export/v1', namespace, count: records.length, manifestSha256: manifestSha(records), records });
  }

  async function handleRestore(req, res) {
    const raw = await readBody(req, MAX_RESTORE_BODY);
    if (raw === null) return json(res, 413, { error: 'body_too_large' });
    let body;
    try { body = JSON.parse(raw.toString('utf8')); } catch { return json(res, 400, { error: 'invalid_json' }); }
    const target = body?.targetNamespace;
    const bundle = body?.bundle;
    if (typeof target !== 'string' || !/^restore-[a-z0-9-]{1,56}$/.test(target) || target === namespace) return json(res, 400, { error: 'target_must_be_fresh_restore_namespace' });
    if (bundle?.format !== 'lms.poc001.export/v1' || !Array.isArray(bundle.records)) return json(res, 422, { error: 'invalid_bundle' });
    const seen = new Set();
    for (const r of bundle.records) {
      const at = `${r?.kind}/${r?.id}`;
      if (!isKind(r?.kind) || !isId(r?.id) || typeof r.bytesBase64 !== 'string' || typeof r.sha256 !== 'string') return json(res, 422, { error: 'bundle_record_invalid', at });
      if (seen.has(at)) return json(res, 422, { error: 'bundle_duplicate_record', at });
      seen.add(at);
      const bytes = Buffer.from(r.bytesBase64, 'base64');
      if (sha256Hex(bytes) !== r.sha256) return json(res, 422, { error: 'bundle_integrity_failed', at });
      // P2-6: the bytes must be a valid envelope for exactly this kind/id, not merely self-hashed.
      try { decodeEnvelope(bytes, { kind: r.kind, id: r.id }); } catch { return json(res, 422, { error: 'bundle_record_invalid', at }); }
    }
    if (manifestSha(bundle.records) !== bundle.manifestSha256) return json(res, 422, { error: 'bundle_manifest_mismatch' });

    // P2-9: in-process lock (synchronous) + storage-level acquisition via MKCOL of the target root.
    if (restoring.has(target)) return json(res, 409, { outcome: 'restore_in_progress' });
    restoring.add(target);
    try {
      const acquire = await adapter.mkcol(`/${target}`);
      if (acquire.outcome === 'rejected' && acquire.status === 405) return json(res, 409, { outcome: 'target_not_fresh' });
      if (acquire.outcome !== 'committed') return json(res, 503, { outcome: 'storage_unavailable', acquire: acquire.outcome });
      for (const k of KIND_NAMES) {
        const m = await adapter.mkcol(`/${target}/${k}`);
        if (m.outcome !== 'committed') return json(res, 502, { outcome: 'restore_incomplete', reason: 'collection_setup_failed', at: k });
      }
      const report = { written: 0, verified: 0, failures: [] };
      for (const r of bundle.records) {
        const bytes = Buffer.from(r.bytesBase64, 'base64');
        const w = await adapter.put(recPath(target, r.kind, r.id), bytes, { ifNoneMatch: '*' });
        if (w.outcome !== 'committed') { report.failures.push({ at: `${r.kind}/${r.id}`, outcome: w.outcome }); continue; }
        report.written++;
        const rb = await adapter.get(recPath(target, r.kind, r.id));
        if (rb.outcome === 'ok' && sha256Hex(rb.body) === r.sha256) report.verified++;
        else report.failures.push({ at: `${r.kind}/${r.id}`, outcome: 'readback_mismatch' });
      }
      const ok = report.failures.length === 0 && report.verified === bundle.records.length;
      return json(res, ok ? 200 : 502, { outcome: ok ? 'restored' : 'restore_incomplete', targetNamespace: target, expected: bundle.records.length, ...report });
    } finally {
      restoring.delete(target);
    }
  }

  async function route(req, res) {
    if (!req.url.startsWith('/')) return json(res, 400, { error: 'absolute_form_refused' });
    if (req.headers.origin && !allowedOrigins.includes(req.headers.origin)) return json(res, 403, { error: 'origin_refused' });
    const u = new URL(req.url, 'http://api.invalid');
    if (/%2f|%5c|%2e|\\/i.test(req.url.split('?')[0])) return json(res, 400, { error: 'encoded_path_refused' });
    const seg = u.pathname.split('/').slice(1);
    if (seg[0] !== 'api') return json(res, 404, { error: 'not_found' });
    if (seg[1] === 'health' && seg.length === 2 && req.method === 'GET') return json(res, 200, { outcome: 'ok' });
    const principal = principalOf(req);
    if (!principal) return json(res, 401, { error: 'unauthorized' }, { 'WWW-Authenticate': 'Bearer' });
    const isVerify = seg[1] === 'operations' && seg.length === 3 && req.method === 'GET';
    if (!isVerify && [...u.searchParams.keys()].length) return json(res, 400, { error: 'query_parameters_refused' });

    if (seg[1] === 'records' && (seg.length === 4 || seg.length === 5)) {
      const [, , kind, id, sub] = seg;
      if (!isKind(kind)) return json(res, 404, { error: 'unknown_kind' });
      if (!isId(id)) return json(res, 400, { error: 'invalid_id' });
      if (sub === 'markdown' && kind === 'notes' && req.method === 'GET') {
        const r = await readRecord(namespace, kind, id);
        if (r.outcome !== 'ok') return json(res, r.outcome === 'not_found' ? 404 : r.outcome === 'corrupt' ? 502 : 503, { outcome: r.outcome });
        const md = renderMarkdown(r.env.data);
        res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'no-store', 'X-Revision': r.etag });
        res.end(md);
        return { status: 200, outcome: 'ok' };
      }
      if (sub !== undefined) return json(res, 404, { error: 'not_found' });
      if (req.method === 'GET') return handleGet(res, kind, id);
      if (req.method === 'PUT') return handlePut(req, res, principal, kind, id);
      return json(res, 405, { error: 'method_not_allowed' }, { Allow: 'GET, PUT' });
    }
    if (seg[1] === 'operations' && (seg.length === 3 || seg.length === 4)) {
      if (!OP_RE.test(seg[2])) return json(res, 400, { error: 'invalid_operation_id' });
      if (isVerify) return handleVerify(res, principal, seg[2], u.searchParams);
      if (seg[3] === 'fence' && req.method === 'POST') return handleFence(res, principal, seg[2]);
      return json(res, 405, { error: 'method_not_allowed' });
    }
    if (seg[1] === 'export' && seg.length === 2 && req.method === 'GET') return handleExport(res);
    if (seg[1] === 'restore' && seg.length === 2 && req.method === 'POST') return handleRestore(req, res);
    return json(res, 404, { error: 'not_found' });
  }

  return {
    ledger,
    async start() {
      server = http.createServer(async (req, res) => {
        const t0 = Date.now();
        let r;
        try { r = await route(req, res); } catch {
          r = res.headersSent ? { status: res.statusCode, outcome: 'internal_error' } : json(res, 500, { error: 'internal_error' });
        }
        // Log line deliberately excludes headers, bodies and upstream details.
        log({ m: req.method, path: (req.url ?? '').split('?')[0].slice(0, 200), status: r?.status, outcome: r?.outcome, ms: Date.now() - t0 });
      });
      await new Promise((ok) => server.listen(0, host, ok));
      return { url: `http://${host}:${server.address().port}`, port: server.address().port };
    },
    async stop() { server.closeAllConnections?.(); await new Promise((r) => server.close(r)); },
  };
}
