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
 *   'hold'               keep the request un-applied until release(holdId); THEN apply
 *                        it normally (late commit after the client already gave up)
 *   'strip-etag'         apply normally but omit the ETag response header
 *   'corrupt-read'       GET returns the stored bytes with one middle byte flipped
 *   'bogus-etag'         PUT: apply normally but answer with a strong ETag GET will not return
 *                        (a dishonest PUT response); GET: answer with a strong ETag ≠ stored
 *   'trickle'            send valid headers, then one body byte every 100ms (never completes)
 *   'weaken-etag'        GET or PUT: answer with W/<stored etag>
 *   'stale-body'         GET: serve the previous version's bytes under the current ETag
 *   any fault may carry `skip: n` to let the first n matching requests through untouched
 */
/**
 * Options (REMEDIATION-02):
 *   etagMode   'generation'   (default) new strong ETag on every write, even identical bytes
 *              'content-hash' RFC-legal strong ETag derived from content only: identical bytes
 *                             keep the SAME ETag (the case behind QA finding P1-R1)
 *              'weak'         weak validators W/"…" (P2-N8 negative fixture). Per RFC 9110 strong
 *                             comparison, a weak tag never satisfies If-Match.
 *   xmlStyle   'd' | 'D' | 'default' | 'z' — namespace prefix style for PROPFIND bodies
 *   propfindOverride(path) → string | null — raw XML to return instead (malformed fixtures)
 *   ignorePropSelection  (REMEDIATION-05) behave like a NON-conforming server: answer every
 *                        PROPFIND as allprop, even when only DAV:resourcetype was requested
 * PROPFIND (REMEDIATION-05 R05-2): an empty body or <allprop/> yields allprop-style entries
 * (getetag, getcontentlength, resourcetype, current-user-principal and — for paths in `locks` —
 * lockdiscovery; the last two legally contain nested DAV:href). A <prop> request returns only the
 * requested supported properties. The raw request (headers + body) is kept in `requestLog`.
 */
export function createMockWebDav({ username, password, host = '127.0.0.1', etagMode = 'generation', xmlStyle = 'd', propfindOverride = null, ignorePropSelection = false } = {}) {
  const locks = new Set(); // synthetic DAV locks (paths) — only visible through allprop/lockdiscovery
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
  const holds = new Map(); // holdId -> release fn
  let server;

  const newEtag = (bytes) => {
    if (etagMode === 'content-hash') return `"${sha256Hex(bytes).slice(0, 32)}"`;
    if (etagMode === 'weak') return `W/"${sha256Hex(bytes).slice(0, 16)}-${++generation}"`;
    return `"${sha256Hex(bytes).slice(0, 16)}-${++generation}"`;
  };
  // Strong comparison (RFC 9110 §8.8.3.2): weak tags never match.
  const strongMatch = (header, etag) => !etag.startsWith('W/') && header.split(',').map((x) => x.trim()).some((t) => !t.startsWith('W/') && t === etag);
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
    if (f.skip > 0) { f.skip--; return null; } // REMEDIATION-03: target the Nth matching request
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
        const ok = ifMatch === '*' ? !!existing : !!existing && strongMatch(ifMatch, existing.etag);
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
      files.set(path, { bytes, etag, prev: existing && !existing.bytes.equals(bytes) ? existing.bytes : (existing?.prev ?? null) }); // last DIFFERENT content
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

  /** Which properties a PROPFIND body asks for: 'allprop' or a Set of DAV local names. */
  function requestedProps(body) {
    const text = body.toString('utf8');
    if (!text.trim() || /<(?:[\w-]+:)?allprop\b/.test(text)) return 'allprop';
    const prop = /<(?:[\w-]+:)?prop\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?prop>/.exec(text);
    return new Set(prop ? [...prop[1].matchAll(/<(?:[\w-]+:)?([\w-]+)\s*\/>/g)].map((m) => m[1]) : []);
  }

  function propfind(path, depth, wanted = 'allprop') {
    const [p, decl] = { d: ['d:', 'xmlns:d="DAV:"'], D: ['D:', 'xmlns:D="DAV:"'], z: ['z:', 'xmlns:z="DAV:"'], default: ['', 'xmlns="DAV:"'] }[xmlStyle];
    const el = (name, inner) => `<${p}${name}>${inner}</${p}${name}>`;
    const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const all = wanted === 'allprop';
    const want = (n) => all || wanted.has(n);
    const extras = (rp) => (all
      ? el('current-user-principal', el('href', '/principals/synthetic-user/'))
        + (locks.has(rp) ? el('lockdiscovery', el('activelock', `${el('locktype', `<${p}write/>`)}${el('lockscope', `<${p}exclusive/>`)}${el('depth', '0')}${el('locktoken', el('href', 'opaquelocktoken:synthetic-0001'))}${el('lockroot', el('href', esc(encodeURI(rp))))}`)) : '')
      : '');
    const entries = [];
    const fileEntry = (fp, f) => el('response', el('href', esc(encodeURI(fp))) + el('propstat', el('prop', (want('getetag') ? el('getetag', esc(f.etag)) : '') + (want('getcontentlength') ? el('getcontentlength', String(f.bytes.length)) : '') + (want('resourcetype') ? `<${p}resourcetype/>` : '') + extras(fp)) + el('status', 'HTTP/1.1 200 OK')));
    const colEntry = (cp) => el('response', el('href', esc(encodeURI(cp.endsWith('/') ? cp : cp + '/'))) + el('propstat', el('prop', (want('resourcetype') ? el('resourcetype', `<${p}collection/>`) : '') + extras(cp)) + el('status', 'HTTP/1.1 200 OK')));
    if (files.has(path)) entries.push(fileEntry(path, files.get(path)));
    else if (collections.has(path)) {
      entries.push(colEntry(path));
      if (depth !== '0') {
        const prefix = path === '/' ? '/' : path + '/';
        for (const c of collections) if (c !== path && c.startsWith(prefix) && !c.slice(prefix.length).includes('/')) entries.push(colEntry(c));
        for (const [fp, f] of files) if (fp.startsWith(prefix) && !fp.slice(prefix.length).includes('/')) entries.push(fileEntry(fp, f));
      }
    } else return null;
    return `<?xml version="1.0" encoding="utf-8"?><${p}multistatus ${decl}>${entries.join('')}</${p}multistatus>`;
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
      ...(method === 'PROPFIND' ? {
        depth: req.headers.depth ?? null,
        contentType: req.headers['content-type'] ?? null,
        contentLength: req.headers['content-length'] ?? null,
        bodyBytes: body.length,
        body: body.subarray(0, 4096).toString('utf8'),
      } : {}),
    });
    if (path === null) return send(res, 400);
    if (!authOk) return send(res, 401, '', { 'WWW-Authenticate': 'Basic realm="mock"' });

    const fault = takeFault(method, path);
    if (fault?.kind === 'status') {
      const h = fault.retryAfter ? { 'Retry-After': String(fault.retryAfter) } : {};
      return send(res, fault.status, '', h);
    }
    if (fault?.kind === 'hang') return; // never answer, nothing applied
    if (fault?.kind === 'hold') {
      await new Promise((r) => holds.set(fault.holdId, r));
      holds.delete(fault.holdId);
    }

    if (method === 'GET' || method === 'HEAD') {
      const f = files.get(path);
      if (!f) return send(res, 404);
      if (fault?.kind === 'trickle') return trickle(res, { status: 200, etag: f.etag });
      let etag = f.etag;
      if (fault?.kind === 'bogus-etag') etag = '"bogus-get-0"';
      if (fault?.kind === 'weaken-etag') etag = `W/${f.etag}`;
      let out = f.bytes;
      if (fault?.kind === 'corrupt-read' && out.length > 2) { out = Buffer.from(out); out[out.length >> 1] ^= 0x01; }
      if (fault?.kind === 'stale-body' && f.prev) out = f.prev; // valid older bytes served under the CURRENT ETag
      res.writeHead(200, { ETag: etag, 'Content-Length': out.length, 'Content-Type': 'application/octet-stream' });
      return res.end(method === 'HEAD' ? undefined : out);
    }
    if (method === 'PROPFIND') {
      const override = propfindOverride?.(path);
      if (override != null) return send(res, 207, override, { 'Content-Type': 'application/xml; charset=utf-8' });
      const xml = propfind(path, req.headers.depth ?? '1', ignorePropSelection ? 'allprop' : requestedProps(body));
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
    if (fault?.kind === 'trickle') return trickle(res, result);
    if (res.destroyed || res.socket?.destroyed) return; // client gave up (e.g. late 'hold' release)
    let etagHeader = result.etag && fault?.kind !== 'strip-etag' ? { ETag: result.etag } : {};
    if (fault?.kind === 'bogus-etag' && result.etag) etagHeader = { ETag: '"bogus-0"' }; // differs from what GET will return
    if (fault?.kind === 'weaken-etag' && result.etag) etagHeader = { ETag: `W/${result.etag}` };
    return send(res, result.status, '', etagHeader);
  }

  // Byte-trickle: valid headers, then one body byte every `intervalMs` (defeats an inactivity timeout).
  function trickle(res, result) {
    res.writeHead(result.status === 405 ? 405 : 200, { 'Content-Length': 1_000_000, ...(result.etag ? { ETag: result.etag } : {}) });
    const iv = setInterval(() => { if (res.destroyed) return clearInterval(iv); res.write('x'); }, 100);
    res.on('close', () => clearInterval(iv));
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
    /** Resolves once the held request is waiting; release() then applies it (late commit). */
    async waitHeld(holdId) { while (!holds.has(holdId)) await new Promise((r) => setTimeout(r, 5)); },
    release(holdId) { const r = holds.get(holdId); if (!r) throw new Error(`no held request ${holdId}`); r(); },
    locks,
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
