// POC-001 — minimal loopback "safe API" between browser-like clients and WebDAV.
// Not a production server. Proves boundary/logic only, against a LOCAL MOCK.
import http from 'node:http';
import {
  RECORD_KINDS, ID_RE, encodeEnvelope, decodeEnvelope, renderMarkdown,
} from './note-codec.mjs';
import { assertLoopbackHost, sha256Hex, timingSafeEqualStr } from './util.mjs';

const NS_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const OP_RE = /^[0-9a-f][0-9a-f-]{7,63}$/;
const MAX_BODY = 1_000_000;
const MAX_RESTORE_BODY = 20_000_000;

export function createSafeApi({ adapter, namespace, apiTokens, allowedOrigins = [], host = '127.0.0.1', log = () => {} }) {
  assertLoopbackHost(host);
  if (!NS_RE.test(namespace)) throw new Error('invalid namespace');
  if (!apiTokens?.length) throw new Error('apiTokens required');
  const ledger = new Map(); // operationId -> { kind, id, base, sha256, verdict, response }
  const ensured = new Set();
  let server;

  const recPath = (ns, kind, id) => `/${ns}/${kind}/${id}.json`;

  async function ensureCollections(ns) {
    if (ensured.has(ns)) return true;
    for (const p of [`/${ns}`, ...Object.keys(RECORD_KINDS).map((k) => `/${ns}/${k}`)]) {
      const r = await adapter.mkcol(p);
      if (!(r.outcome === 'committed' || (r.outcome === 'rejected' && r.status === 405))) return false;
    }
    ensured.add(ns);
    return true;
  }

  function authed(req) {
    const h = req.headers.authorization ?? '';
    if (!h.startsWith('Bearer ')) return false;
    const tok = h.slice(7);
    return apiTokens.some((t) => timingSafeEqualStr(t, tok));
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
    try { return { ...r, env: decodeEnvelope(r.body) }; } catch { return { outcome: 'corrupt', etag: r.etag }; }
  }

  async function handleGet(res, kind, id) {
    const r = await readRecord(namespace, kind, id);
    if (r.outcome === 'ok') return json(res, 200, { outcome: 'ok', revision: r.etag, operationId: r.env.operationId, record: r.env.data });
    if (r.outcome === 'not_found') return json(res, 404, { outcome: 'not_found' });
    if (r.outcome === 'corrupt') return json(res, 502, { outcome: 'corrupt_record' });
    return json(res, 503, { outcome: 'unavailable' });
  }

  async function handlePut(req, res, kind, id) {
    if (!(req.headers['content-type'] ?? '').startsWith('application/json')) return json(res, 415, { error: 'json_required' });
    const opId = req.headers['operation-id'];
    if (!opId || !OP_RE.test(opId)) return json(res, 400, { error: 'operation_id_required' });
    const ifMatch = req.headers['if-match'];
    const ifNoneMatch = req.headers['if-none-match'];
    let cond;
    if (ifMatch && ifMatch !== '*') cond = { ifMatch };
    else if (ifNoneMatch === '*') cond = { ifNoneMatch: '*' };
    else return json(res, 428, { error: 'revision_precondition_required' });

    const prior = ledger.get(opId);
    if (prior) {
      if (prior.kind !== kind || prior.id !== id) return json(res, 422, { error: 'operation_id_reused_for_other_target' });
      if (prior.verdict === 'pending') return json(res, 409, { outcome: 'operation_in_progress', operationId: opId });
      if (prior.verdict === 'unknown') return json(res, 409, { outcome: 'verification_required', operationId: opId });
      // Definite verdict already known: replay it, never re-send upstream.
      return json(res, prior.response.status, prior.response.body, { 'Operation-Replayed': 'true' });
    }

    const raw = await readBody(req, MAX_BODY);
    if (raw === null) return json(res, 413, { error: 'body_too_large' });
    let data;
    try { data = JSON.parse(raw.toString('utf8')); } catch { return json(res, 400, { error: 'invalid_json' }); }
    const errs = RECORD_KINDS[kind](id, data);
    if (errs.length) return json(res, 422, { error: 'invalid_record', details: errs });

    if (!(await ensureCollections(namespace))) return json(res, 503, { outcome: 'not_saved', reason: 'storage_unavailable' });
    const bytes = encodeEnvelope({ kind, id, operationId: opId, data });
    const sha = sha256Hex(bytes);
    const entry = { kind, id, base: cond.ifMatch ?? '*', sha256: sha, verdict: 'pending' };
    ledger.set(opId, entry);
    const w = await adapter.put(recPath(namespace, kind, id), bytes, cond);

    const finish = (verdict, status, body) => {
      entry.verdict = verdict;
      entry.response = { status, body };
      return json(res, status, body);
    };

    if (w.outcome === 'committed') {
      const rb = await adapter.get(recPath(namespace, kind, id));
      if (rb.outcome === 'ok' && w.etag && rb.etag === w.etag) {
        if (sha256Hex(rb.body) !== sha) return finish('corrupt', 502, { outcome: 'verification_failed', reason: 'stored_bytes_differ', revision: w.etag });
        return finish('saved', 200, { outcome: 'saved', revision: w.etag, sha256: sha });
      }
      // Upstream acknowledged, but we could not confirm these exact bytes are the latest.
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
  }

  async function handleVerify(res, opId, query) {
    let e = ledger.get(opId);
    if (!e) {
      const kind = query.get('kind'); const id = query.get('id'); const base = query.get('base');
      if (!RECORD_KINDS[kind] || !ID_RE.test(id ?? '') || !base) return json(res, 404, { outcome: 'unknown_operation' });
      e = { kind, id, base, sha256: null, verdict: 'unknown' };
    }
    const r = await readRecord(namespace, e.kind, e.id);
    if (r.outcome === 'unavailable' || r.outcome === 'error') return json(res, 503, { outcome: 'unavailable', operationId: opId });
    let verdict;
    if (r.outcome === 'ok' && r.env.operationId === opId) {
      verdict = e.sha256 && sha256Hex(r.body) !== e.sha256 ? 'verification_failed' : 'committed';
    } else if (e.base === '*' ? r.outcome === 'not_found' : r.etag === e.base) verdict = 'not_committed';
    else verdict = 'indeterminate'; // changed by another writer; cannot prove whether ours landed first
    if (ledger.has(opId) && e.verdict === 'unknown' && verdict !== 'indeterminate') {
      e.verdict = verdict;
      e.response = verdict === 'committed'
        ? { status: 200, body: { outcome: 'saved', revision: r.etag, verifiedAfterUnknown: true } }
        : { status: 409, body: { outcome: verdict, note: 'issue a NEW operation id to retry explicitly' } };
    }
    return json(res, 200, { outcome: verdict, operationId: opId, currentRevision: r.etag ?? null });
  }

  async function listRecords(ns) {
    const out = [];
    for (const kind of Object.keys(RECORD_KINDS)) {
      const p = await adapter.propfind(`/${ns}/${kind}`, '1');
      if (p.outcome === 'not_found') continue;
      if (p.outcome !== 'ok') return null;
      for (const h of p.hrefs) {
        const m = new RegExp(`^/${ns}/${kind}/([a-z0-9-]+)\\.json$`).exec(h);
        if (m) out.push({ kind, id: m[1] });
      }
    }
    return out;
  }

  const manifestSha = (records) => sha256Hex(Buffer.from(records.map((r) => `${r.kind}/${r.id} ${r.sha256}`).sort().join('\n')));

  async function handleExport(res) {
    const list = await listRecords(namespace);
    if (!list) return json(res, 503, { outcome: 'export_incomplete' });
    const records = [];
    for (const { kind, id } of list) {
      const r = await adapter.get(recPath(namespace, kind, id));
      if (r.outcome !== 'ok') return json(res, 503, { outcome: 'export_incomplete', failedAt: `${kind}/${id}` });
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
    if (!/^restore-[a-z0-9-]{1,56}$/.test(target ?? '') || target === namespace) return json(res, 400, { error: 'target_must_be_fresh_restore_namespace' });
    if (bundle?.format !== 'lms.poc001.export/v1' || !Array.isArray(bundle.records)) return json(res, 422, { error: 'invalid_bundle' });
    for (const r of bundle.records) {
      if (!RECORD_KINDS[r.kind] || !ID_RE.test(r.id ?? '') || sha256Hex(Buffer.from(r.bytesBase64 ?? '', 'base64')) !== r.sha256) return json(res, 422, { error: 'bundle_integrity_failed', at: `${r.kind}/${r.id}` });
    }
    if (manifestSha(bundle.records) !== bundle.manifestSha256) return json(res, 422, { error: 'bundle_manifest_mismatch' });
    const exists = await adapter.propfind(`/${target}`, '0');
    if (exists.outcome === 'ok') return json(res, 409, { outcome: 'target_not_fresh' });
    if (exists.outcome !== 'not_found') return json(res, 503, { outcome: 'storage_unavailable' });
    if (!(await ensureCollections(target))) return json(res, 503, { outcome: 'storage_unavailable' });
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
  }

  async function route(req, res) {
    if (!req.url.startsWith('/')) return json(res, 400, { error: 'absolute_form_refused' });
    if (req.headers.origin && !allowedOrigins.includes(req.headers.origin)) return json(res, 403, { error: 'origin_refused' });
    const u = new URL(req.url, 'http://api.invalid');
    if (/%2f|%5c|%2e|\\/i.test(req.url.split('?')[0])) return json(res, 400, { error: 'encoded_path_refused' });
    const seg = u.pathname.split('/').slice(1);
    if (seg[0] !== 'api') return json(res, 404, { error: 'not_found' });
    if (seg[1] === 'health' && seg.length === 2 && req.method === 'GET') return json(res, 200, { outcome: 'ok' });
    if (!authed(req)) return json(res, 401, { error: 'unauthorized' }, { 'WWW-Authenticate': 'Bearer' });
    const isVerify = seg[1] === 'operations' && seg.length === 3 && req.method === 'GET';
    if (!isVerify && [...u.searchParams.keys()].length) return json(res, 400, { error: 'query_parameters_refused' });

    if (seg[1] === 'records' && (seg.length === 4 || seg.length === 5)) {
      const [, , kind, id, sub] = seg;
      if (!Object.hasOwn(RECORD_KINDS, kind)) return json(res, 404, { error: 'unknown_kind' });
      if (!ID_RE.test(id)) return json(res, 400, { error: 'invalid_id' });
      if (sub === 'markdown' && kind === 'notes' && req.method === 'GET') {
        const r = await readRecord(namespace, kind, id);
        if (r.outcome !== 'ok') return json(res, r.outcome === 'not_found' ? 404 : 503, { outcome: r.outcome });
        const md = renderMarkdown(r.env.data);
        res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'no-store', 'X-Revision': r.etag });
        res.end(md);
        return { status: 200, outcome: 'ok' };
      }
      if (sub !== undefined) return json(res, 404, { error: 'not_found' });
      if (req.method === 'GET') return handleGet(res, kind, id);
      if (req.method === 'PUT') return handlePut(req, res, kind, id);
      return json(res, 405, { error: 'method_not_allowed' }, { Allow: 'GET, PUT' });
    }
    if (isVerify) {
      if (!OP_RE.test(seg[2])) return json(res, 400, { error: 'invalid_operation_id' });
      return handleVerify(res, seg[2], u.searchParams);
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
        try { r = await route(req, res); } catch (e) {
          r = json(res, 500, { error: 'internal_error' });
        }
        // Log line deliberately excludes headers, bodies and upstream details.
        log({ m: req.method, path: (req.url ?? '').split('?')[0].slice(0, 200), status: r?.status, outcome: r?.outcome, ms: Date.now() - t0 });
      });
      await new Promise((ok) => server.listen(0, host, ok));
      return { url: `http://${host}:${server.address().port}`, port: server.address().port };
    },
    async stop() { await new Promise((r) => server.close(r)); server.closeAllConnections?.(); },
  };
}
