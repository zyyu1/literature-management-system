// POC-001 — LOCAL MOCK WebDAV server (loopback only, synthetic data only).
// This is a test double. It demonstrates intended client/API logic; it does NOT
// prove that Nutstore (or any real provider) implements the same semantics.
import http from 'node:http';
import { assertLoopbackHost, sha256Hex } from './util.mjs';

/**
 * Fault spec (consumed in FIFO order when it matches):
 *   { method?, pathIncludes?, kind, status?, retryAfter?, times? }
 * kind:
 *   'status'             respond `status` WITHOUT applying the operation
 *   'hang'               never respond, do not apply (client must time out)
 *   'commit-then-drop'   apply the operation, then destroy the socket (lost ack)
 *   'commit-then-status' apply the operation, then respond `status` (e.g. 500)
 *   'commit-then-hang'   apply the operation, then never respond
 *   'corrupt'            store bytes with one byte flipped, respond as success
 */
export function createMockWebDav({ username, password, host = '127.0.0.1' } = {}) {
  assertLoopbackHost(host);
  if (!username || !password) throw new Error('mock requires synthetic credentials');
  const expectedAuth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
  const files = new Map(); // path -> { bytes: Buffer, etag }
  const collections = new Set(['/']);
  const faults = [];
  const requestLog = []; // never contains Authorization values
  const sockets = new Set();
  let generation = 0;
  let credentialsRevoked = false;
  let barrier = null;
  let server;

  const newEtag = (bytes) => `"${sha256Hex(bytes).slice(0, 16)}-${++generation}"`;
  const parentOf = (p) => p.replace(/\/[^/]+\/?$/, '') || '/';

  function normalize(rawUrl) {
    const u = new URL(rawUrl, 'http://mock.invalid');
    const decoded = decodeURIComponent(u.pathname);
    if (decoded.split('/').some((s) => s === '..' || s === '.')) return null;
    return decoded.length > 1 ? decoded.replace(/\/$/, '') : decoded;
  }

  function takeFault(method, path) {
    const i = faults.findIndex(
      (f) => (!f.method || f.method === method) && (!f.pathIncludes || path.includes(f.pathIncludes)),
    );
    if (i < 0) return null;
    const f = faults[i];
    f.times = (f.times ?? 1) - 1;
    if (f.times <= 0) faults.splice(i, 1);
    return f;
  }

  // Applies a mutating operation atomically. Node's event loop runs this whole
  // function without interleaving, so check-and-set here is atomic IN THE MOCK.
  function apply(method, path, headers, body, fault) {
    const existing = files.get(path);
    const ifMatch = headers['if-match'];
    const ifNoneMatch = headers['if-none-match'];
    if (method === 'PUT' || method === 'DELETE') {
      if (ifMatch !== undefined) {
        const ok = ifMatch === '*' ? !!existing : !!existing && ifMatch.split(',').map((s) => s.trim()).includes(existing.etag);
        if (!ok) return { status: 412 };
      }
      if (ifNoneMatch !== undefined && ifNoneMatch.trim() === '*' && existing) return { status: 412 };
    }
    if (method === 'PUT') {
      if (!collections.has(parentOf(path))) return { status: 409 };
      if (collections.has(path)) return { status: 405 };
      let bytes = Buffer.from(body);
      if (fault?.kind === 'corrupt' && bytes.length) {
        bytes = Buffer.from(bytes);
        bytes[bytes.length - 1] ^= 0x01;
      }
      const etag = newEtag(bytes);
      files.set(path, { bytes, etag });
      return { status: existing ? 204 : 201, etag };
    }
    if (method === 'DELETE') {
      if (!existing) return { status: 404 };
      files.delete(path);
      return { status: 204 };
    }
    if (method === 'MKCOL') {
      if (collections.has(path) || files.has(path)) return { status: 405 };
      if (!collections.has(parentOf(path))) return { status: 409 };
      collections.add(path);
      return { status: 201 };
    }
    return { status: 405 };
  }

  function propfind(path, depth) {
    const entries = [];
    const fileEntry = (p, f) =>
      `<d:response><d:href>${encodeURI(p)}</d:href><d:propstat><d:prop><d:getetag>${f.etag.replace(/"/g, '&quot;')}</d:getetag><d:getcontentlength>${f.bytes.length}</d:getcontentlength><d:resourcetype/></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>`;
    const colEntry = (p) =>
      `<d:response><d:href>${encodeURI(p.endsWith('/') ? p : p + '/')}</d:href><d:propstat><d:prop><d:resourcetype><d:collection/></d:resourcetype></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>`;
    if (files.has(path)) entries.push(fileEntry(path, files.get(path)));
    else if (collections.has(path)) {
      entries.push(colEntry(path));
      if (depth !== '0') {
        const prefix = path === '/' ? '/' : path + '/';
        for (const c of collections) if (c !== path && c.startsWith(prefix) && !c.slice(prefix.length).includes('/')) entries.push(colEntry(c));
        for (const [p, f] of files) if (p.startsWith(prefix) && !p.slice(prefix.length).includes('/')) entries.push(fileEntry(p, f));
      }
    } else return null;
    return `<?xml version="1.0" encoding="utf-8"?><d:multistatus xmlns:d="DAV:">${entries.join('')}</d:multistatus>`;
  }

  async function handle(req, res) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks);
    const method = req.method;
    const path = normalize(req.url);
    const authOk = !credentialsRevoked && req.headers.authorization === expectedAuth;
    requestLog.push({
      method,
      path,
      ifMatch: req.headers['if-match'] ?? null,
      ifNoneMatch: req.headers['if-none-match'] ?? null,
      authOk,
      host: req.headers.host,
    });
    if (path === null) return send(res, 400);
    if (!authOk) return send(res, 401, '', { 'WWW-Authenticate': 'Basic realm="mock"' });

    const fault = takeFault(method, path);
    if (fault?.kind === 'status') {
      const h = fault.retryAfter ? { 'Retry-After': String(fault.retryAfter) } : {};
      return send(res, fault.status, '', h);
    }
    if (fault?.kind === 'hang') return; // never answer, nothing applied

    if (method === 'GET' || method === 'HEAD') {
      const f = files.get(path);
      if (!f) return send(res, 404);
      res.writeHead(200, { ETag: f.etag, 'Content-Length': f.bytes.length, 'Content-Type': 'application/octet-stream' });
      return res.end(method === 'HEAD' ? undefined : f.bytes);
    }
    if (method === 'PROPFIND') {
      const xml = propfind(path, req.headers.depth ?? '1');
      if (!xml) return send(res, 404);
      return send(res, 207, xml, { 'Content-Type': 'application/xml; charset=utf-8' });
    }
    if (method === 'OPTIONS') return send(res, 200, '', { DAV: '1', Allow: 'GET,HEAD,PUT,DELETE,MKCOL,PROPFIND,OPTIONS' });

    if (barrier && method === barrier.method && path.includes(barrier.pathIncludes)) {
      // Hold until `count` matching requests are all in flight, then release together.
      const b = barrier;
      b.arrived++;
      if (b.arrived >= b.count) { barrier = null; b.release(); } else await b.promise;
    }
    const result = apply(method, path, req.headers, body, fault);
    if (fault?.kind === 'commit-then-drop') return req.socket.destroy();
    if (fault?.kind === 'commit-then-hang') return;
    if (fault?.kind === 'commit-then-status') return send(res, fault.status ?? 500);
    return send(res, result.status, '', result.etag ? { ETag: result.etag } : {});
  }

  function send(res, status, body = '', headers = {}) {
    res.writeHead(status, { 'Content-Length': Buffer.byteLength(body), ...headers });
    res.end(body);
  }

  return {
    files,
    collections,
    faults,
    requestLog,
    /** Next `count` matching requests are held until all have arrived (forces a real overlap). */
    setBarrier({ method = 'PUT', pathIncludes = '', count = 2 } = {}) {
      let release;
      const promise = new Promise((r) => { release = r; });
      barrier = { method, pathIncludes, count, arrived: 0, promise, release };
      return promise;
    },
    revokeCredentials() { credentialsRevoked = true; },
    restoreCredentials() { credentialsRevoked = false; },
    snapshot() {
      return [...files].map(([p, f]) => ({ path: p, sha256: sha256Hex(f.bytes), etag: f.etag })).sort((a, b) => a.path.localeCompare(b.path));
    },
    async start() {
      server = http.createServer((req, res) => {
        handle(req, res).catch(() => { try { res.destroy(); } catch {} });
      });
      server.on('connection', (s) => { sockets.add(s); s.on('close', () => sockets.delete(s)); });
      await new Promise((r) => server.listen(0, host, r));
      const { port } = server.address();
      return { url: `http://${host}:${port}`, port };
    },
    async stop() {
      for (const s of sockets) s.destroy();
      await new Promise((r) => server.close(r));
    },
  };
}
