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
// REMEDIATION-02 changes:
//  P1-R1 fence is terminal ONLY if its PUT returned a trusted strong ETag that differs
//        from base; unchanged/missing/weak/ambiguous → fence_not_confirmed (non-terminal).
//  P2-N3 evicted terminal ledger entries leave bounded per-principal TOMBSTONES; a replay
//        of a tombstoned Operation-Id is refused (operation_expired), never re-dispatched.
//        Beyond the tombstone window or after a restart this protection is UNSUPPORTED.
//  P2-N4 principal id derived from the token (stable across instances / token order);
//        write tag + record provenance are HMACs under a server-held synthetic key;
//        active namespace may not be restore-*.
//  P2-N5 per-principal ledger quota + global bound; one principal cannot starve others.
//  P2-N6 fence serialised per operation; deleted record → record_missing (non-terminal).
//  P2-N7 POC If-Match profile: single strong ETag WITHOUT commas (restricted subset of
//        RFC 9110, which does allow commas inside a quoted tag); weak tags → explicit 400.
//
// The ledger is PROCESS MEMORY ONLY: no durable or cross-instance idempotency.
import http from 'node:http';
import crypto from 'node:crypto';
import {
  isKind, isId, validatorFor, KIND_NAMES, encodeEnvelope, decodeEnvelope, renderMarkdown, dataDigest,
} from './note-codec.mjs';
import { assertLoopbackHost, sha256Hex, timingSafeEqualStr } from './util.mjs';

const NS_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const OP_RE = /^[0-9a-f][0-9a-f-]{7,63}$/;
// RFC 9110 strong entity-tag: DQUOTE *etagc DQUOTE, etagc = %x21 / %x23-7E (bounded here).
export const RFC_STRONG_ETAG_RE = /^"[\x21\x23-\x7e]{1,128}"$/;
// POC profile (P2-N7): the same, minus ',' (%x2C), so a value can never be read as a list.
export const STRONG_ETAG_RE = /^"[\x21\x23-\x2b\x2d-\x7e]{1,128}"$/;
const isTrustedEtag = (t) => typeof t === 'string' && STRONG_ETAG_RE.test(t);
const MAX_BODY = 1_000_000;
const MAX_RESTORE_BODY = 20_000_000;
const TERMINAL = new Set(['saved', 'not_saved', 'conflict', 'committed_unverified', 'verification_failed', 'not_committed']);

export function createSafeApi({
  adapter, namespace, apiTokens, provenanceKey, allowedOrigins = [], host = '127.0.0.1', log = () => {},
  maxPerPrincipal = 1_000, maxLedgerEntries, maxTombstonesPerPrincipal,
}) {
  assertLoopbackHost(host);
  if (!NS_RE.test(namespace)) throw new Error('invalid namespace');
  if (namespace.startsWith('restore-')) throw new Error('active namespace may not use the reserved restore- prefix');
  if (!apiTokens?.length) throw new Error('apiTokens required');
  if (typeof provenanceKey !== 'string' || provenanceKey.length < 32) throw new Error('provenanceKey (>= 32 chars, server-held) required');
  // P2-N4: stable principal id derived from the token itself (not its array position).
  const principals = apiTokens.map((token) => ({ token, id: `p_${sha256Hex(Buffer.from(`lms-principal\u0000${token}`)).slice(0, 24)}` }));
  const globalMax = maxLedgerEntries ?? maxPerPrincipal * principals.length;
  const tombMax = maxTombstonesPerPrincipal ?? maxPerPrincipal * 4;
  const ledger = new Map(); // `${principal}\0${opId}` -> entry
  const tombstones = new Map(); // same key -> { principal, kind, id, base, fingerprint, verdict, at }
  const ensured = new Set();
  const restoring = new Set();
  let server;

  const recPath = (ns, kind, id) => `/${ns}/${kind}/${id}.json`;
  const ledgerKey = (p, op) => `${p}\u0000${op}`;
  const hmac = (msg) => crypto.createHmac('sha256', provenanceKey).update(msg).digest('hex');
  /** Write tag: HMAC over principal, operation, target, base revision and data digest. */
  const writeTag = (p, op, kind, id, base, dataSha) => hmac(`tag\u0000${p}\u0000${op}\u0000${kind}\u0000${id}\u0000${base}\u0000${dataSha}`).slice(0, 32);
  /** Record provenance: authenticates that this API (key holder) produced the envelope. */
  const provenanceOf = (kind, id, operationId, dataSha) => hmac(`prov\u0000${kind}\u0000${id}\u0000${operationId}\u0000${dataSha}`);
  const authentic = (env) => typeof env.provenance === 'string'
    && timingSafeEqualStr(env.provenance, provenanceOf(env.kind, env.id, env.operationId, env.dataSha256));
  const ourWrite = (env, p, op, e) => env.operationId === writeTag(p, op, e.kind, e.id, e.base, env.dataSha256);

  const countFor = (p) => { let n = 0; for (const e of ledger.values()) if (e.principal === p) n++; return n; };
  function entomb(key, e) {
    ledger.delete(key);
    tombstones.set(key, { principal: e.principal, kind: e.kind, id: e.id, base: e.base, fingerprint: e.fingerprint, verdict: e.verdict, at: Date.now() });
    let n = 0;
    for (const t of tombstones.values()) if (t.principal === e.principal) n++;
    if (n > tombMax) { // protection window ends for this principal's oldest tombstone (documented)
      for (const [k, t] of tombstones) if (t.principal === e.principal) { tombstones.delete(k); break; }
    }
  }
  function evictTerminal(predicate, untilFn) {
    for (const [k, e] of ledger) {
      if (untilFn()) return;
      if (TERMINAL.has(e.verdict) && predicate(e)) entomb(k, e);
    }
  }
  /** P2-N5: per-principal quota first, then global bound. Never evicts pending/unknown. */
  function reserve(key, entry) {
    const p = entry.principal;
    if (countFor(p) >= maxPerPrincipal) evictTerminal((e) => e.principal === p, () => countFor(p) < maxPerPrincipal);
    if (countFor(p) >= maxPerPrincipal) return 'principal_ledger_full';
    if (ledger.size >= globalMax) evictTerminal(() => true, () => ledger.size < globalMax);
    if (ledger.size >= globalMax) return 'operation_ledger_full';
    tombstones.delete(key);
    ledger.set(key, entry);
    return null;
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
    let env;
    try { env = decodeEnvelope(r.body, { kind, id }); } catch { return { outcome: 'corrupt', etag: r.etag }; }
    if (!authentic(env)) return { outcome: 'unauthenticated', etag: r.etag };
    return { ...r, env };
  }

  async function handleGet(res, kind, id) {
    const r = await readRecord(namespace, kind, id);
    if (r.outcome === 'ok') return json(res, 200, { outcome: 'ok', revision: r.etag, revisionStrong: isTrustedEtag(r.etag), record: r.env.data });
    if (r.outcome === 'not_found') return json(res, 404, { outcome: 'not_found' });
    if (r.outcome === 'corrupt') return json(res, 502, { outcome: 'corrupt_record' });
    if (r.outcome === 'unauthenticated') return json(res, 502, { outcome: 'unauthenticated_record' });
    return json(res, 503, { outcome: 'unavailable' });
  }

  function parseCondition(req) {
    const im = req.headers['if-match'];
    const inm = req.headers['if-none-match'];
    if (im !== undefined && inm !== undefined) return { error: [400, 'conflicting_preconditions'] };
    if (im !== undefined) {
      if (STRONG_ETAG_RE.test(im)) return { cond: { ifMatch: im } };
      if (/^W\/"[\x21\x23-\x7e]{1,128}"$/.test(im)) return { error: [400, 'unsupported_weak_etag'] }; // P2-N8: never strip W/
      if (RFC_STRONG_ETAG_RE.test(im)) return { error: [400, 'if_match_outside_poc_profile'] }; // P2-N7: RFC-legal comma, refused by profile
      return { error: [400, 'invalid_if_match'] };
    }
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

    const prior = ledger.get(key) ?? tombstones.get(key);
    if (prior) {
      if (prior.kind !== kind || prior.id !== id || prior.base !== base) return json(res, 422, { error: 'operation_id_reused_for_other_target' });
      if (prior.verdict === 'pending') return json(res, 409, { outcome: 'operation_in_progress', operationId: opId });
      const raw = await readBody(req, MAX_BODY);
      if (raw === null || sha256Hex(raw) !== prior.fingerprint) return json(res, 422, { error: 'operation_id_reused_with_different_payload' });
      if (prior.verdict === 'unknown') return json(res, 409, { outcome: 'verification_required', operationId: opId });
      if (!ledger.has(key)) {
        // P2-N3: evicted but remembered — never re-dispatch; report what is known, not a fresh verdict.
        return json(res, 409, { outcome: 'operation_expired', operationId: opId, priorVerdict: prior.verdict, note: 'operation id already used; issue a NEW operation id to write again' });
      }
      return json(res, prior.response.status, prior.response.body, { 'Operation-Replayed': 'true' });
    }

    // P1-2: synchronous reservation BEFORE the first await.
    const entry = { principal, opId, kind, id, base, fingerprint: null, sha256: null, verdict: 'pending', sentUpstream: false, fenced: false, fencing: false, at: Date.now() };
    const full = reserve(key, entry);
    if (full) return json(res, 503, { outcome: 'not_saved', reason: full }); // before any dispatch: definite
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
      const dSha = dataDigest(data);
      const tag = writeTag(principal, opId, kind, id, base, dSha);
      const bytes = encodeEnvelope({ kind, id, operationId: tag, data, provenance: provenanceOf(kind, id, tag, dSha) });
      entry.sha256 = sha256Hex(bytes);
      entry.sentUpstream = true;
      const w = await adapter.put(recPath(namespace, kind, id), bytes, cond);

      if (w.outcome === 'committed') {
        const rb = await adapter.get(recPath(namespace, kind, id));
        if (rb.outcome === 'ok' && isTrustedEtag(w.etag) && rb.etag === w.etag) {
          if (sha256Hex(rb.body) !== entry.sha256) return finish('verification_failed', 502, { outcome: 'verification_failed', reason: 'stored_bytes_differ', revision: w.etag });
          return finish('saved', 200, { outcome: 'saved', revision: w.etag, sha256: entry.sha256 });
        }
        const reason = !w.etag ? 'no_etag' : !isTrustedEtag(w.etag) ? 'untrusted_etag' : 'readback_mismatch';
        return finish('committed_unverified', 202, { outcome: 'committed_unverified', reason, revision: w.etag ?? null });
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

  /** Observe only. Terminal verdicts come from the ledger, from finding OUR write tag, or from a confirmed fence. */
  async function handleVerify(res, principal, opId, query) {
    const key = ledgerKey(principal, opId);
    let e = ledger.get(key);
    let ephemeral = false;
    if (!e && tombstones.has(key)) {
      const t = tombstones.get(key);
      return json(res, 200, { outcome: t.verdict === 'saved' ? 'committed' : t.verdict, terminal: true, expired: true, operationId: opId });
    }
    if (!e) {
      // After an API restart (or beyond the tombstone window) the caller must restate the target. Never terminal.
      const kind = query.get('kind'); const id = query.get('id'); const base = query.get('base');
      if (!isKind(kind) || !isId(id) || !(base === '*' || STRONG_ETAG_RE.test(base ?? ''))) return json(res, 404, { outcome: 'unknown_operation' });
      e = { kind, id, base, verdict: 'unknown' };
      ephemeral = true;
    }
    if (e.verdict === 'pending') return json(res, 200, { outcome: 'in_progress', terminal: false, operationId: opId });
    if (TERMINAL.has(e.verdict)) return json(res, 200, { outcome: e.verdict === 'saved' ? 'committed' : e.verdict, terminal: true, fenced: e.fenced, operationId: opId });

    const r = await readRecord(namespace, e.kind, e.id);
    if (r.outcome === 'unavailable' || r.outcome === 'error') return json(res, 503, { outcome: 'unavailable', terminal: false, operationId: opId });
    if (r.outcome === 'corrupt' || r.outcome === 'unauthenticated') return json(res, 502, { outcome: `${r.outcome}_record`, terminal: false, operationId: opId });
    if (r.outcome === 'ok' && ourWrite(r.env, principal, opId, e)) {
      const ok = !e.sha256 || sha256Hex(r.body) === e.sha256;
      const verdict = ok ? 'saved' : 'verification_failed';
      if (!ephemeral) {
        e.verdict = verdict;
        e.response = ok ? { status: 200, body: { outcome: 'saved', revision: r.etag, verifiedAfterUnknown: true } } : { status: 502, body: { outcome: 'verification_failed' } };
      }
      return json(res, 200, { outcome: ok ? 'committed' : 'verification_failed', terminal: !ephemeral, operationId: opId, currentRevision: r.etag });
    }
    if (r.outcome === 'not_found' && e.base !== '*') return json(res, 200, { outcome: 'record_missing', terminal: false, operationId: opId });
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
   * Fence: rewrite the CURRENT bytes with If-Match:<base>. It may make the operation terminally
   * not_committed ONLY if the fence PUT itself committed AND returned a trusted strong ETag that
   * differs from <base> (REMEDIATION-02 P1-R1): only then can a still in-flight request carrying
   * If-Match:<base> no longer match (given atomic strong comparison at the storage). With a
   * content-hash ETag, identical bytes keep the same tag, so the fence proves nothing and the
   * operation stays Unknown. Serialised per operation (P2-N6). Side effect when it does commit:
   * a new ETag, so other clients' cached revision becomes stale.
   */
  async function handleFence(res, principal, opId) {
    const e = ledger.get(ledgerKey(principal, opId));
    if (!e) return json(res, 404, { outcome: 'unknown_operation', note: 'fence requires the in-process ledger entry' });
    if (e.verdict !== 'unknown') return json(res, 409, { outcome: 'not_fenceable', verdict: e.verdict });
    if (e.base === '*') return json(res, 422, { outcome: 'fence_unsupported_for_create', terminal: false, note: 'create-only operations stay unknown until observed; see README' });
    if (e.fencing) return json(res, 409, { outcome: 'fence_in_progress', terminal: false, operationId: opId });
    e.fencing = true;
    try {
      const r = await readRecord(namespace, e.kind, e.id);
      if (r.outcome === 'not_found') return json(res, 200, { outcome: 'record_missing', terminal: false, operationId: opId });
      if (r.outcome === 'corrupt' || r.outcome === 'unauthenticated') return json(res, 502, { outcome: `${r.outcome}_record`, terminal: false });
      if (r.outcome !== 'ok') return json(res, 503, { outcome: 'unavailable', terminal: false, operationId: opId });
      const markCommitted = (etag) => {
        e.verdict = 'saved';
        e.response = { status: 200, body: { outcome: 'saved', revision: etag, verifiedAfterUnknown: true } };
        return json(res, 200, { outcome: 'committed', terminal: true, operationId: opId, currentRevision: etag });
      };
      if (ourWrite(r.env, principal, opId, e)) return markCommitted(r.etag);
      if (r.etag !== e.base) return json(res, 200, { outcome: 'indeterminate', terminal: false, operationId: opId, currentRevision: r.etag });
      const w = await adapter.put(recPath(namespace, e.kind, e.id), r.body, { ifMatch: e.base });
      if (w.outcome === 'committed') {
        if (!isTrustedEtag(w.etag) || w.etag === e.base) {
          const reason = !w.etag ? 'no_etag' : !isTrustedEtag(w.etag) ? 'untrusted_etag' : 'etag_unchanged';
          return json(res, 200, { outcome: 'fence_not_confirmed', reason, terminal: false, operationId: opId });
        }
        // REMEDIATION-03 Q2: never trust the PUT-response ETag alone. A fresh GET of the same path
        // must return a trusted strong ETag EXACTLY equal to the fence PUT's, still different from
        // base, the identical fence bytes, a valid authenticated envelope for this target, and no
        // trace of our own write. Anything else stays NON-terminal (original Unknown retained).
        // This read-back is necessary, not sufficient: it is NOT a proof of provider atomic CAS.
        const rb = await adapter.get(recPath(namespace, e.kind, e.id));
        const notConfirmed = (reason) => json(res, 200, { outcome: 'fence_not_confirmed', reason, terminal: false, operationId: opId });
        if (rb.outcome === 'not_found') return json(res, 200, { outcome: 'record_missing', terminal: false, operationId: opId });
        if (rb.outcome !== 'ok') return notConfirmed(`readback_${rb.outcome}`);
        let rbEnv;
        try { rbEnv = decodeEnvelope(rb.body, { kind: e.kind, id: e.id }); } catch { return notConfirmed('readback_invalid_envelope'); }
        if (!authentic(rbEnv)) return notConfirmed('readback_unauthenticated');
        if (ourWrite(rbEnv, principal, opId, e)) return markCommitted(rb.etag);
        if (!isTrustedEtag(rb.etag)) return notConfirmed('readback_untrusted_etag');
        if (rb.etag !== w.etag) return notConfirmed('readback_etag_mismatch');
        if (rb.etag === e.base) return notConfirmed('readback_etag_unchanged');
        if (!rb.body.equals(r.body)) return notConfirmed('readback_bytes_changed');
        e.verdict = 'not_committed';
        e.fenced = true;
        e.response = { status: 409, body: { outcome: 'not_committed', fenced: true, note: 'issue a NEW operation id to retry explicitly' } };
        return json(res, 200, { outcome: 'not_committed', terminal: true, fenced: true, operationId: opId, currentRevision: rb.etag });
      }
      if (w.outcome === 'precondition_failed') {
        const again = await readRecord(namespace, e.kind, e.id);
        if (again.outcome === 'ok' && ourWrite(again.env, principal, opId, e)) return markCommitted(again.etag);
        return json(res, 200, { outcome: 'indeterminate', terminal: false, operationId: opId });
      }
      return json(res, 200, { outcome: 'fence_not_confirmed', reason: `fence_${w.outcome}`, terminal: false, operationId: opId });
    } finally {
      e.fencing = false;
    }
  }

  /**
   * P2-N1 + REMEDIATION-03 Q1: fail closed unless the listing is complete and unambiguous
   * under the POC profile: the namespace root exists with its self entry, contains EXACTLY one
   * collection for each canonical kind (notes/projects/progress — a missing kind is never read
   * as "empty"), nothing else, and every kind listing has its self entry and only well-named,
   * non-collection record files. Duplicate hrefs and response/propstat conflicts are rejected
   * by the adapter/parser. This does NOT prove a real provider listed every record or that the
   * listing is a consistent multi-file snapshot (UNSUPPORTED: provider integrity dependency).
   */
  async function listRecords(ns) {
    const root = await adapter.propfind(`/${ns}`, '1');
    if (root.outcome === 'not_found') return { error: 'namespace_absent', at: `/${ns}` };
    if (root.outcome === 'malformed') return { error: 'malformed_listing', at: `/${ns}`, detail: root.reason };
    if (root.outcome !== 'ok') return { error: 'storage_unavailable' };
    const selfRoot = root.entries.filter((x) => x.path === `/${ns}`);
    if (selfRoot.length !== 1 || !selfRoot[0].collection) return { error: 'malformed_listing', at: `/${ns}`, detail: 'root self entry' };
    const seenKinds = new Set();
    for (const x of root.entries) {
      if (x.path === `/${ns}`) continue;
      const m = new RegExp(`^/${ns}/([^/]+)$`).exec(x.path);
      if (!m || !isKind(m[1]) || !x.collection) return { error: 'unrecognized_entry', at: x.path };
      if (seenKinds.has(m[1])) return { error: 'malformed_listing', at: x.path, detail: 'duplicate kind collection' };
      seenKinds.add(m[1]);
    }
    for (const k of KIND_NAMES) if (!seenKinds.has(k)) return { error: 'missing_kind_collection', at: `/${ns}/${k}` };
    const out = [];
    for (const kind of KIND_NAMES) {
      const p = await adapter.propfind(`/${ns}/${kind}`, '1');
      if (p.outcome === 'malformed') return { error: 'malformed_listing', at: `/${ns}/${kind}`, detail: p.reason };
      if (p.outcome !== 'ok') return { error: p.outcome === 'not_found' ? 'missing_kind_collection' : 'storage_unavailable', at: `/${ns}/${kind}` };
      const selfKind = p.entries.filter((x) => x.path === `/${ns}/${kind}`);
      if (selfKind.length !== 1 || !selfKind[0].collection) return { error: 'malformed_listing', at: `/${ns}/${kind}`, detail: 'kind self entry' };
      for (const x of p.entries) {
        if (x.path === `/${ns}/${kind}`) continue;
        const m = new RegExp(`^/${ns}/${kind}/([^/]+)\\.json$`).exec(x.path);
        if (!m || !isId(m[1]) || x.collection) return { error: 'unrecognized_entry', at: x.path };
        out.push({ kind, id: m[1] });
      }
    }
    const ids = out.map((r) => `${r.kind}/${r.id}`);
    if (new Set(ids).size !== ids.length) return { error: 'malformed_listing', detail: 'duplicate record' };
    return { records: out };
  }

  const manifestSha = (records) => sha256Hex(Buffer.from(records.map((r) => `${r.kind}/${r.id} ${r.sha256}`).sort().join('\n')));

  async function handleExport(res) {
    const list = await listRecords(namespace);
    if (list.error) return json(res, 503, { outcome: 'export_incomplete', reason: list.error, at: list.at ?? null, detail: list.detail ?? null });
    const records = [];
    for (const { kind, id } of list.records) {
      const r = await adapter.get(recPath(namespace, kind, id));
      if (r.outcome !== 'ok') return json(res, 503, { outcome: 'export_incomplete', reason: 'read_failed', at: `${kind}/${id}` });
      let env;
      try { env = decodeEnvelope(r.body, { kind, id }); } catch { return json(res, 503, { outcome: 'export_incomplete', reason: 'invalid_record', at: `${kind}/${id}` }); }
      if (!authentic(env)) return json(res, 503, { outcome: 'export_incomplete', reason: 'unauthenticated_record', at: `${kind}/${id}` });
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
      let env;
      try { env = decodeEnvelope(bytes, { kind: r.kind, id: r.id }); } catch { return json(res, 422, { error: 'bundle_record_invalid', at }); }
      // P2-N4: only envelopes produced under THIS server's provenance key may be restored.
      if (!authentic(env)) return json(res, 422, { error: 'bundle_record_unauthenticated', at });
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
        if (r.outcome !== 'ok') return json(res, r.outcome === 'not_found' ? 404 : (r.outcome === 'corrupt' || r.outcome === 'unauthenticated') ? 502 : 503, { outcome: r.outcome });
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
    tombstones,
    principalIdFor: (token) => principals.find((p) => p.token === token)?.id ?? null,
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
