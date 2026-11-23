// POC-001 — narrow server-side WebDAV adapter (zero third-party dependencies).
// Credentials live only in this closure. Base URL is fixed at construction and
// is default-deny for anything but loopback during the local phase.
import http from 'node:http';
import { assertLoopbackHost } from './util.mjs';

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
export function createWebDavAdapter({ baseUrl, username, password, timeoutMs = 2000 }) {
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

  function request(method, path, { headers = {}, body } = {}) {
    if (!path.startsWith('/') || path.includes('..')) throw new Error('adapter: invalid path');
    return new Promise((resolve) => {
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
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => resolve({ transport: 'response', status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
          res.on('error', (e) => resolve({ transport: 'error', code: e.code ?? 'ERESPONSE', connected: true }));
        },
      );
      let connected = false;
      req.on('socket', (s) => {
        if (!s.connecting) connected = true;
        else s.once('connect', () => { connected = true; });
      });
      req.setTimeout(timeoutMs, () => req.destroy(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })));
      req.on('error', (e) => resolve({ transport: 'error', code: e.code ?? 'EUNKNOWN', connected }));
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
    async propfind(path, depth = '1') {
      const r = await request('PROPFIND', path, { headers: { Depth: depth } });
      if (r.transport === 'error') return { outcome: 'unavailable', code: r.code };
      if (r.status === 404) return { outcome: 'not_found' };
      if (r.status !== 207) return { outcome: 'error', status: r.status };
      const xml = r.body.toString('utf8');
      const hrefs = [...xml.matchAll(/<d:href>([^<]+)<\/d:href>/g)].map((m) => decodeURI(m[1]));
      return {
        outcome: 'ok',
        hrefs: hrefs.map((h) => (h.startsWith(basePath) ? h.slice(basePath.length) : h)),
        collections: hrefs.filter((h) => h.endsWith('/')).map((h) => (h.startsWith(basePath) ? h.slice(basePath.length) : h).replace(/\/$/, '')),
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
