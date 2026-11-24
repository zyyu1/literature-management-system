import crypto from 'node:crypto';

export const sha256Hex = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

const LOOPBACK = new Set(['127.0.0.1', '::1', '[::1]', 'localhost']);

/** Default-deny: POC-001 local phase may only talk to / listen on loopback. */
export function assertLoopbackHost(hostname) {
  if (!LOOPBACK.has(hostname)) {
    const err = new Error(`REAL_SERVICE_BLOCKED: non-loopback host refused in POC-001 local phase`);
    err.code = 'REAL_SERVICE_BLOCKED';
    throw err;
  }
}

// REMEDIATION-08 (D007-A30) SSRF: the only socket addresses the adapter may connect to. A name such as
// `localhost` is resolved by the adapter and the RESULT must be one of these; anything else (another
// 127/8 address, 0.0.0.0, a mapped/private/public address) is refused before any socket is opened.
const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1']);
export const isAllowedLoopbackAddress = (addr) => LOOPBACK_ADDRESSES.has(addr);

// REMEDIATION-08 (D007-A30) — TEST-ONLY ACCESS-01 budget arithmetic (synthetic dry run).
// These are ACCESS-01's self-imposed ceilings, not provider quotas and not a production budget.
export const ACCESS01_LIMITS = Object.freeze({
  maxRequests: 100, // in ANY rolling window below, counting auth/probe/PROPFIND/GET/PUT/readback/cleanup
  windowMs: 30 * 60 * 1000,
  maxFiles: 20, // synthetic files created per run
  maxFileBytes: 1024 * 1024, // 1 MiB per file
  maxTotalBytes: 20 * 1024 * 1024, // 20 MiB per run
  maxWriters: 2,
});

/**
 * Admission is decided BEFORE a request is dispatched; a refusal stops the run (no retry, no
 * borrowing). `cleanupReserve` request slots are held back for cleanup (per-file DELETE plus a final
 * verification listing): ordinary requests are refused while only the reserve remains, so a run
 * stops before it can no longer clean up. 401/429 observed from upstream also STOP the run.
 */
export function createRequestBudget({ limits = ACCESS01_LIMITS, cleanupReserve = limits.maxFiles + 1, now = () => Date.now() } = {}) {
  if (!(cleanupReserve >= 0 && cleanupReserve < limits.maxRequests)) throw new Error('budget: cleanupReserve must be < maxRequests');
  const sent = []; // { at, cleanup }
  const files = new Map(); // path -> bytes
  const writers = new Set();
  let totalBytes = 0;
  let stopped = null;
  let cleanupPhase = false; // R09: irreversible; afterwards only own-file conditional DELETEs + ONE verification listing
  const cleaned = new Set(); // own files whose cleanup DELETE was admitted (each at most once)
  let verified = false; // the single final verification PROPFIND was admitted
  const prune = () => { const from = now() - limits.windowMs; while (sent.length && sent[0].at <= from) sent.shift(); };
  const refuse = (code) => { stopped ??= code; return { ok: false, code }; };
  const usage = () => {
    prune();
    const cleanupUsed = sent.filter((s) => s.cleanup).length;
    return { requests: sent.length, cleanupUsed, reserveLeft: Math.max(0, cleanupReserve - cleanupUsed), files: files.size, totalBytes, writers: writers.size, stopped, cleanupPhase, cleaned: cleaned.size, verified };
  };
  const CLEANUP_REFUSED = (code) => ({ ok: false, code }); // cleanup-phase refusal: no STOP, no slot consumed
  /** Unit-arithmetic helper. category: 'request' | 'cleanup'. The adapter never calls this directly. */
  function admitRequest(category = 'request') {
      // R09 (P2-R08-QA-1): ordinary work is never relabelled as cleanup after beginCleanup().
      if (cleanupPhase && category !== 'cleanup') return CLEANUP_REFUSED('CLEANUP_PHASE_ORDINARY_REFUSED');
      // After a STOP only cleanup may continue, and only if the STOP left cleanup possible
      // (not an upstream 401/429 halt and not the hard request cap).
      if (stopped && (category !== 'cleanup' || stopped.startsWith('UPSTREAM_') || stopped === 'BUDGET_REQUESTS')) return { ok: false, code: stopped };
      const u = usage();
      const cap = category === 'cleanup' ? limits.maxRequests : limits.maxRequests - u.reserveLeft;
      if (u.requests + 1 > cap) return refuse(category === 'cleanup' ? 'BUDGET_REQUESTS' : 'BUDGET_CLEANUP_RESERVE');
      sent.push({ at: now(), cleanup: category === 'cleanup' });
      return { ok: true };
  }
  /** A synthetic file write of `bytes` to `path` (re-writes of the same path count bytes, not files). */
  function admitWrite(path, bytes) {
      if (cleanupPhase) return CLEANUP_REFUSED('CLEANUP_PHASE_ORDINARY_REFUSED');
      if (stopped) return { ok: false, code: stopped };
      if (bytes > limits.maxFileBytes) return refuse('BUDGET_FILE_BYTES');
      if (!files.has(path) && files.size + 1 > limits.maxFiles) return refuse('BUDGET_FILES');
      if (totalBytes + bytes > limits.maxTotalBytes) return refuse('BUDGET_TOTAL_BYTES');
      files.set(path, bytes);
      totalBytes += bytes;
      return { ok: true };
  }
  /**
   * R09 single fail-closed admission point used by the adapter for EVERY dispatch, decided from the
   * actual method + canonical path + phase (never from a caller-supplied label).
   * - Ordinary phase: one request slot (outside the cleanup reserve). A PUT then also needs
   *   admitDispatchWrite (file/size caps) before dispatch.
   * - Cleanup phase (after beginCleanup()): only (a) a conditional DELETE of an own synthetic file admitted
   *   earlier by admitWrite, each at most once, and (b) ONE final PROPFIND of the exact parent collection
   *   of an own file. Everything else (PUT, MKCOL, GET, extra/foreign PROPFIND, unconditional, foreign or
   *   collection DELETE) is refused before dispatch without consuming a slot and without a STOP.
   *   Admitted cleanup still obeys the hard cap and any 401/429 / hard-cap STOP.
   */
  function admitDispatch({ method, path, conditional = false }) {
    if (!cleanupPhase) return admitRequest('request');
    // Hard limits dominate the phase rule in the reported reason (both are refusals; nothing is sent):
    // an upstream 401/429 or hard-cap STOP, or an exhausted hard cap, is reported as such.
    if (stopped && (stopped.startsWith('UPSTREAM_') || stopped === 'BUDGET_REQUESTS')) return { ok: false, code: stopped };
    if (usage().requests + 1 > limits.maxRequests) return refuse('BUDGET_REQUESTS');
    if (method === 'DELETE') {
      if (!conditional) return CLEANUP_REFUSED('CLEANUP_UNCONDITIONAL_DELETE');
      if (!files.has(path)) return CLEANUP_REFUSED('CLEANUP_NOT_OWN_FILE');
      if (cleaned.has(path)) return CLEANUP_REFUSED('CLEANUP_DUPLICATE_DELETE');
      if (verified) return CLEANUP_REFUSED('CLEANUP_ALREADY_VERIFIED');
      const r = admitRequest('cleanup');
      if (r.ok) cleaned.add(path);
      return r;
    }
    if (method === 'PROPFIND') {
      if (verified) return CLEANUP_REFUSED('CLEANUP_VERIFICATION_ALREADY_USED');
      if (![...files.keys()].some((f) => f.slice(0, f.lastIndexOf('/')) === path)) return CLEANUP_REFUSED('CLEANUP_VERIFICATION_SCOPE');
      const r = admitRequest('cleanup');
      if (r.ok) verified = true;
      return r;
    }
    return CLEANUP_REFUSED('CLEANUP_PHASE_ORDINARY_REFUSED'); // R09: PUT/MKCOL/GET/... after beginCleanup()
  }
  /**
   * R09 write admission for a PUT whose request slot admitDispatch has JUST granted (same synchronous
   * admission step in the adapter). It is the only gate on file/size caps: on refusal the slot is returned,
   * so a refused write consumes nothing and never reaches the network.
   */
  function admitDispatchWrite(path, bytes) {
    const w = admitWrite(path, bytes);
    if (!w.ok) { sent.pop(); return w; }
    return w;
  }
  return Object.freeze({
    limits,
    cleanupReserve,
    usage,
    admitRequest,
    admitWrite,
    admitDispatch,
    admitDispatchWrite,
    acquireWriter(id) {
      if (stopped) return { ok: false, code: stopped };
      if (!writers.has(id) && writers.size + 1 > limits.maxWriters) return refuse('BUDGET_WRITERS');
      writers.add(id);
      return { ok: true };
    },
    /** Irreversible switch to the cleanup phase (see admitDispatch). There is no way back. */
    beginCleanup() { cleanupPhase = true; },
    /** Own synthetic files admitted for writing (the only DELETE targets cleanup may use). */
    ownFiles() { return [...files.keys()]; },
    /** Upstream 401/429 halts the run rather than retrying. */
    observeStatus(status) { if (status === 401 || status === 429) stopped ??= `UPSTREAM_${status}`; },
    get stopped() { return stopped; },
  });
}

export function timingSafeEqualStr(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export const randomId = (bytes = 16) => crypto.randomBytes(bytes).toString('hex');
