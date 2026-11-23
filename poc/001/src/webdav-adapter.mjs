// POC-001 — narrow server-side WebDAV adapter (zero third-party dependencies).
// Credentials live only in this closure. Base URL is fixed at construction and
// is default-deny for anything but loopback during the local phase.
import http from 'node:http';
import { assertLoopbackHost } from './util.mjs';
import { parseMultistatus } from './dav-xml.mjs';

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
export function createWebDavAdapter({ baseUrl, username, password, timeoutMs = 2000, deadlineMs = timeoutMs * 3, maxResponseBytes = 4_000_000 }) {
  const base = new URL(baseUrl);
  // REMEDIATION-01 P1-4: this adapter only implements plain node:http for the
  // loopback mock. An https: URL must FAIL CLOSED before any network activity;
  // it must never be sent as cleartext HTTP with Basic credentials. A real TLS
  // transport is a separately gated future change (ACCESS-02 preflight).
  if (base.protocol === 'https:') {
    const err = new Error('HTTPS_TRANSPORT_NOT_IMPLEMENTED: refusing to send credentials; TLS transport is not part of the local POC');
    err.code = 'HTTPS_TRANSPORT_NOT_IMPLEMENTED';
    throw err;
  }
  if (base.protocol !== 'http:') throw new Error('unsupported protocol');
  assertLoopbackHost(base.hostname);
  if (base.username || base.password) throw new Error('credentials must not be embedded in URL');
  const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
  const basePath = base.pathname.replace(/\/$/, '');

  // REMEDIATION-02 P2-N2: `timeoutMs` is the socket INACTIVITY timeout; `deadlineMs`
  // is an absolute monotonic wall-clock budget for connect + headers + body. A
  // byte-trickling peer can defeat the former but never the latter. Response bodies
  // are bounded by `maxResponseBytes`. Every path settles exactly once.
  function request(method, path, { headers = {}, body } = {}) {
    if (!path.startsWith('/') || path.includes('..')) throw new Error('adapter: invalid path');
    return new Promise((resolve) => {
      let settled = false;
      let connected = false;
      const settle = (v) => { if (!settled) { settled = true; clearTimeout(deadline); resolve(v); } };
      const req = http.request(
        {
          host: base.hostname,
          port: base.port,
          method,
          path: encodeURI(basePath + path),
          headers: {
            Authorization: authHeader,
            ...(body !== undefined ? { 'Content-Length': Buffer.byteLength(body) } : {}),
            ...headers,
          },
          agent: false,
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
      req.on('socket', (s) => {
        if (!s.connecting) connected = true;
        else s.once('connect', () => { connected = true; });
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
      const r = await request('PROPFIND', path, { headers: { Depth: depth } });
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
        entries: mapped.map((e) => ({ path: e.rel.replace(/\/$/, '') || '/', collection: e.collection || e.rel.endsWith('/') })),
      };
    },
    /** Protocol-level CRUD proof only (POC-01). Requires If-Match; the safe API never calls it. */
    async remove(path, { ifMatch } = {}) {
      if (!ifMatch) throw new Error('adapter: conditional delete required');
      return classifyWrite(await request('DELETE', path, { headers: { 'If-Match': ifMatch } }));
    },
    toJSON() { return { kind: 'webdav-adapter', baseHost: base.hostname, credentials: '[REDACTED]' }; },
    [Symbol.for('nodejs.util.inspect.custom')]() { return '[WebDavAdapter credentials=REDACTED]'; },
  };
  return Object.freeze(adapter);
}
