// POC-001 — narrow server-side WebDAV adapter (zero third-party dependencies).
// Credentials live only in this closure. Base URL is fixed at construction and
// is default-deny for anything but loopback during the local phase.
import http from 'node:http';
import https from 'node:https';
import tls from 'node:tls';
import dns from 'node:dns';
import { assertLoopbackHost, isAllowedLoopbackAddress } from './util.mjs';
import { parseMultistatus } from './dav-xml.mjs';

// REMEDIATION-08 (D007-A30) path canonicalisation: every base-path and request-path segment must be a
// plain name. No dot segments, empty segments (`//`), percent-encoding, backslashes, query/fragment
// characters, whitespace or controls — so nothing can be re-interpreted by a decoder or normaliser.
const SAFE_SEGMENT_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const safePath = (p) => typeof p === 'string' && p.startsWith('/') && p.length <= 1024
  && p.slice(1).split('/').every((s) => SAFE_SEGMENT_RE.test(s));
const blocked = (code, msg) => Object.assign(new Error(`${code}: ${msg}`), { code });
// The only keys a caller may pass for local TLS. Anything else (rejectUnauthorized, checkServerIdentity,
// secureOptions, minVersion, pfx, …) is an attempt to weaken or re-route verification and is refused.
const LOCAL_TLS_KEYS = new Set(['ca']);

export const PROPFIND_RESOURCETYPE_BODY = Buffer.from(
  '<?xml version="1.0" encoding="utf-8"?>\n<d:propfind xmlns:d="DAV:"><d:prop><d:resourcetype/></d:prop></d:propfind>\n',
  'utf8',
);
export const PROPFIND_CONTENT_TYPE = 'application/xml; charset=utf-8';

/**
 * Write outcomes (the API must never turn `unknown` into success or failure):
 *   committed            2xx from upstream
 *   precondition_failed  412 — stale revision / already exists; nothing written
 *   rejected             other 4xx — definite, nothing written (401/403/409/423/429...)
 *   not_sent             TCP connection was never established (no request byte could
 *                        have left this process) — definite, nothing written
 *   unknown              any error after the socket connected, timeout, reset, 5xx —
 *                        upstream MAY have committed (REMEDIATION-01 P2-12)
 */
export function createWebDavAdapter({
  baseUrl, username, password, timeoutMs = 2000, deadlineMs = timeoutMs * 3, maxResponseBytes = 4_000_000,
  localTls, budget, lookup = dns.lookup,
}) {
  const base = new URL(baseUrl);
  // REMEDIATION-01 P1-4: an https: URL FAILS CLOSED before any network activity and is never sent as
  // cleartext HTTP. REMEDIATION-08 (D007-A30): the single exception is an EXPLICIT local synthetic TLS
  // test mode — `localTls: { ca }` with a test-only CA — and only towards a loopback host. Without it
  // the R01 behaviour is unchanged. This is NOT a real-upstream TLS transport (ACCESS-02 remains BLOCKED).
  let tlsOptions = null;
  if (base.protocol === 'https:') {
    if (localTls === undefined) {
      const err = new Error('HTTPS_TRANSPORT_NOT_IMPLEMENTED: refusing to send credentials; TLS transport is not part of the local POC');
      err.code = 'HTTPS_TRANSPORT_NOT_IMPLEMENTED';
      throw err;
    }
    if (localTls === null || typeof localTls !== 'object') throw blocked('TLS_CONFIG_REFUSED', 'localTls must be { ca }');
    for (const k of Object.keys(localTls)) if (!LOCAL_TLS_KEYS.has(k)) throw blocked('TLS_CONFIG_REFUSED', `option "${k}" is not permitted (no verification overrides)`);
    if (!(typeof localTls.ca === 'string' || Buffer.isBuffer(localTls.ca)) || !String(localTls.ca).includes('BEGIN CERTIFICATE')) throw blocked('TLS_CONFIG_REFUSED', 'a PEM test CA is required');
    // Only this CA is trusted (Node's public root store is replaced, not extended). Verification and
    // hostname/IP checking are forced on explicitly, so NODE_TLS_REJECT_UNAUTHORIZED=0 cannot weaken them.
    // The loopback host check below still applies: TLS mode never unlocks a non-loopback host.
    tlsOptions = { ca: localTls.ca, rejectUnauthorized: true, checkServerIdentity: tls.checkServerIdentity, minVersion: 'TLSv1.2' };
  }
  if (base.protocol !== 'http:' && base.protocol !== 'https:') throw new Error('unsupported protocol');
  if (base.protocol === 'http:' && localTls !== undefined) throw blocked('TLS_CONFIG_REFUSED', 'localTls given for a non-https URL');
  assertLoopbackHost(base.hostname);
  if (base.username || base.password) throw new Error('credentials must not be embedded in URL');
  // R08 SSRF/origin: the upstream origin is pinned at construction to an explicit loopback host:port.
  // No implicit default port, no query/fragment, no path a normaliser could rewrite (the WHATWG URL
  // parser silently resolves `..` and decodes nothing, so the RAW string is checked as well).
  const portOk = /^[0-9]{1,5}$/.test(base.port) && Number(base.port) >= 1 && Number(base.port) <= 65535;
  if (!portOk) throw blocked('UNSAFE_TARGET', 'explicit upstream port required');
  // The authority must already be canonical: shorthand/obfuscated hosts (127.1, 0x7f.0.0.1, …) that the
  // URL parser would silently rewrite are refused rather than trusted.
  const rawAuthority = (/^[a-z]+:\/\/([^/\\?#]*)/i.exec(String(baseUrl)) ?? [])[1] ?? '';
  const originOk = rawAuthority.toLowerCase() === `${base.hostname}:${base.port}`;
  if (!originOk) throw blocked('UNSAFE_TARGET', 'upstream authority must be a canonical loopback host:port');
  const raw = String(baseUrl);
  const rawPath = raw.replace(/^[a-z]+:\/\/[^/\\]*/i, '');
  const basePathOk = !base.search && !base.hash && !/[?#%\\\s]/.test(raw) && !/(^|[/\\])\.\.?([/\\]|$)/.test(rawPath)
    && (base.pathname === '/' || safePath(base.pathname.replace(/\/$/, '')));
  if (!basePathOk) throw blocked('UNSAFE_TARGET', 'base path must be a canonical plain path');
  const transport = tlsOptions ? https : http;
  const connectHost = base.hostname.replace(/^\[(.*)\]$/, '$1');
  // R08: a host NAME (`localhost`) is resolved here and the result must be an allowed loopback address;
  // otherwise the connection is refused before a socket exists (classified not_sent: no byte left).
  const checkedLookup = (hostname, opts, cb) => {
    const all = !!opts?.all; // Node 22 (autoSelectFamily) asks for all addresses
    lookup(hostname, { ...opts, all: true }, (err, list) => {
      if (err) return cb(err);
      const addrs = Array.isArray(list) ? list : [];
      // Every resolved address must be allowed — one non-loopback answer refuses the name outright.
      if (!addrs.length || !addrs.every((a) => isAllowedLoopbackAddress(a.address))) return cb(blocked('REAL_SERVICE_BLOCKED', 'resolved address is not loopback'));
      return all ? cb(null, addrs) : cb(null, addrs[0].address, addrs[0].family);
    });
  };
  const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
  const basePath = base.pathname.replace(/\/$/, '');

  // REMEDIATION-02 P2-N2: `timeoutMs` is the socket INACTIVITY timeout; `deadlineMs`
  // is an absolute monotonic wall-clock budget for connect + headers + body. A
  // byte-trickling peer can defeat the former but never the latter. Response bodies
  // are bounded by `maxResponseBytes`. Every path settles exactly once.
  function request(method, path, { headers = {}, body } = {}) {
    // R08: canonical plain path only (no dot/empty/encoded segments) — refused before any budget or socket.
    if (!safePath(path)) throw blocked('UNSAFE_TARGET', 'adapter: invalid path');
    // R08 test-only ACCESS-01 budget: admission is decided BEFORE dispatch; a refusal never reaches the
    // network and is reported like an unreachable peer (writes: not_sent, reads: unavailable).
    if (budget) {
      const adm = budget.admitRequest(method === 'DELETE' ? 'cleanup' : 'request');
      if (!adm.ok) return Promise.resolve({ transport: 'error', code: adm.code, connected: false });
    }
    return new Promise((resolve) => {
      let settled = false;
      let connected = false;
      const settle = (v) => {
        if (settled) return;
        settled = true;
        clearTimeout(deadline);
        if (budget && v.transport === 'response') budget.observeStatus(v.status);
        resolve(v);
      };
      const req = transport.request(
        {
          host: connectHost,
          port: base.port,
          method,
          path: encodeURI(basePath + path),
          headers: {
            Authorization: authHeader,
            ...(body !== undefined ? { 'Content-Length': Buffer.byteLength(body) } : {}),
            ...headers,
          },
          agent: false,
          lookup: checkedLookup,
          ...(tlsOptions ?? {}),
        },
        (res) => {
          const chunks = [];
          let n = 0;
          res.on('data', (c) => {
            n += c.length;
            if (n > maxResponseBytes) {
              settle({ transport: 'error', code: 'ERESPONSETOOLARGE', connected: true }); // fail immediately, never return a truncated body
              req.destroy();
              return;
            }
            chunks.push(c);
          });
          res.on('end', () => settle({ transport: 'response', status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
          res.on('error', (e) => settle({ transport: 'error', code: e.code ?? 'ERESPONSE', connected: true }));
          res.on('close', () => { if (!res.complete) settle({ transport: 'error', code: 'ERESPONSEINCOMPLETE', connected: true }); });
        },
      );
      const deadline = setTimeout(() => req.destroy(Object.assign(new Error('deadline'), { code: 'EDEADLINE' })), deadlineMs);
      // `connected` means "an application byte (request line/Authorization) may have reached the peer".
      // Over TLS that is only possible after a VERIFIED handshake: a TCP connect followed by a certificate
      // rejection sent nothing of the request, so it stays not_sent (R08), never Unknown.
      const readyEvent = tlsOptions ? 'secureConnect' : 'connect';
      req.on('socket', (s) => {
        // A socket already destroyed before this event (e.g. a synchronous resolver refusal) never connected.
        if (!tlsOptions && !s.connecting && !s.destroyed) connected = true;
        else if (tlsOptions && s.authorized) connected = true;
        else s.once(readyEvent, () => { connected = true; });
      });
      req.setTimeout(timeoutMs, () => req.destroy(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })));
      req.on('error', (e) => settle({ transport: 'error', code: e.code ?? 'EUNKNOWN', connected }));
      if (body !== undefined) req.write(body);
      req.end();
    });
  }

  function classifyWrite(r) {
    if (r.transport === 'error') {
      // Only "never connected" proves no byte reached the server; the error code alone does not.
      if (!r.connected) return { outcome: 'not_sent', code: r.code };
      return { outcome: 'unknown', code: r.code };
    }
    if (r.status >= 200 && r.status < 300) return { outcome: 'committed', status: r.status, etag: r.headers.etag ?? null };
    if (r.status === 412) return { outcome: 'precondition_failed', status: 412 };
    if (r.status >= 400 && r.status < 500) {
      return { outcome: 'rejected', status: r.status, retryAfter: r.headers['retry-after'] ?? null };
    }
    return { outcome: 'unknown', status: r.status };
  }

  function classifyRead(r) {
    if (r.transport === 'error') return { outcome: 'unavailable', code: r.code };
    if (r.status === 200) return { outcome: 'ok', etag: r.headers.etag ?? null, body: r.body };
    if (r.status === 404) return { outcome: 'not_found' };
    return { outcome: 'error', status: r.status, retryAfter: r.headers['retry-after'] ?? null };
  }

  const adapter = {
    async get(path) { return classifyRead(await request('GET', path)); },
    /** cond: { ifMatch: etag } | { ifNoneMatch: '*' } — unconditional writes are refused. */
    async put(path, bytes, cond) {
      const headers = { 'Content-Type': 'application/json; charset=utf-8' };
      if (cond?.ifMatch) headers['If-Match'] = cond.ifMatch;
      else if (cond?.ifNoneMatch === '*') headers['If-None-Match'] = '*';
      else if (!cond?.unsafeUnconditional) throw new Error('adapter: conditional write required');
      if (budget) {
        if (!safePath(path)) throw blocked('UNSAFE_TARGET', 'adapter: invalid path');
        const adm = budget.admitWrite(path, Buffer.byteLength(bytes)); // file count / size caps, before dispatch
        if (!adm.ok) return { outcome: 'not_sent', code: adm.code };
      }
      return classifyWrite(await request('PUT', path, { headers, body: bytes }));
    },
    async mkcol(path) { return classifyWrite(await request('MKCOL', path)); },
    /**
     * REMEDIATION-02 P2-N1: parsed by namespace URI (DAV:), never by prefix; any
     * structural problem → outcome 'malformed' (callers must fail closed).
     * hrefs are returned relative to the adapter base path; an href outside the
     * base path is reported as foreign (also fail-closed for callers).
     */
    async propfind(path, depth = '1') {
      // REMEDIATION-05 R05-2: explicit minimal request — ONLY DAV:resourcetype. Never an empty
      // (allprop) body, and no fallback to allprop on any error or unexpected response.
      const r = await request('PROPFIND', path, {
        headers: { Depth: depth, 'Content-Type': PROPFIND_CONTENT_TYPE },
        body: PROPFIND_RESOURCETYPE_BODY,
      });
      if (r.transport === 'error') return { outcome: 'unavailable', code: r.code };
      if (r.status === 404) return { outcome: 'not_found' };
      if (r.status !== 207) return { outcome: 'error', status: r.status };
      let entries;
      try { entries = parseMultistatus(r.body); } catch (e) { return { outcome: 'malformed', reason: e.message }; }
      const rel = (h) => (h === basePath || h.startsWith(basePath + '/') ? h.slice(basePath.length) : null);
      const mapped = entries.map((e) => ({ ...e, rel: rel(e.href) }));
      if (mapped.some((e) => e.rel === null)) return { outcome: 'malformed', reason: 'foreign href' };
      if (mapped.some((e) => !e.ok)) return { outcome: 'malformed', reason: 'non-2xx response entry' };
      // REMEDIATION-03 Q1: the same resource listed twice (after decoding and trailing-slash
      // normalisation) is ambiguous — never silently de-duplicated or double-counted.
      const norm = mapped.map((e) => e.rel.replace(/\/$/, '') || '/');
      if (new Set(norm).size !== norm.length) return { outcome: 'malformed', reason: 'duplicate href' };
      return {
        outcome: 'ok',
        // R04-2: collection status comes only from a 2xx propstat (parser); a trailing slash proves nothing.
        entries: mapped.map((e) => ({ path: e.rel.replace(/\/$/, '') || '/', collection: e.collection })),
      };
    },
    /** Protocol-level CRUD proof only (POC-01). Requires If-Match; the safe API never calls it. */
    async remove(path, { ifMatch } = {}) {
      if (!ifMatch) throw new Error('adapter: conditional delete required');
      return classifyWrite(await request('DELETE', path, { headers: { 'If-Match': ifMatch } }));
    },
    toJSON() { return { kind: 'webdav-adapter', baseHost: base.hostname, tls: !!tlsOptions, credentials: '[REDACTED]' }; },
    [Symbol.for('nodejs.util.inspect.custom')]() { return '[WebDavAdapter credentials=REDACTED]'; },
  };
  return Object.freeze(adapter);
}
