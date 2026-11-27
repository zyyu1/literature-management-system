// P0-STORE Phase 1 - TEST SUPPORT ONLY loopback HTTPS WebDAV mock (DESIGN §3).
//
// This module never leaves the loopback interface: it binds 127.0.0.1:0 only, has no runtime mode
// switch in src/, and is never imported by production code. Eleven personalities are selected per
// test: strong, weak-etag, lost-update, create-overwrite, stale-read, late-ack, unresolvable-ack,
// throttle, server-error, redirect, bad-cert.
//
// TLS material is generated at test time with the host `openssl` CLI into os.tmpdir(): a test CA, a
// correct server certificate (SAN IP:127.0.0.1 + DNS:localhost), a wrong-CA certificate, a
// wrong-CN certificate and an expired certificate. These certificates are TEST-ONLY and are never
// trusted outside these tests; the tests pass the generated CA to the gate explicitly.
//
// The late-ack/unresolvable-ack personalities engage only for the probe's synthetic S-LATE payload,
// so the rest of the L0-L12 run keeps baseline semantics. That is server-side test behaviour keyed
// by request content, not a probe runtime flag.
import crypto from 'node:crypto';
import fs from 'node:fs';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const PERSONALITIES = Object.freeze([
  'strong',
  'weak-etag',
  'lost-update',
  'create-overwrite',
  'stale-read',
  'late-ack',
  'unresolvable-ack',
  'throttle',
  'server-error',
  'redirect',
  'bad-cert',
]);

const MAX_BODY_BYTES = 2 * 1024 * 1024;
const BASIC_USER = 'probe';
const DEFAULT_NAMESPACE_ROOT = '/LMS-P0STORE/';

let certificateCache = null;

function findOpenssl() {
  const candidates = ['D:\\Git\\usr\\bin\\openssl.exe', 'openssl'];
  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ['version'], { encoding: 'utf8', timeout: 15000, windowsHide: true });
    if (!probe.error && probe.status === 0) return candidate;
  }
  throw new Error('MOCK_TLS_UNAVAILABLE: no openssl CLI found at D:\\Git\\usr\\bin\\openssl.exe or on PATH');
}

function openssl(cmd, args, label) {
  const result = spawnSync(cmd, args, { encoding: 'utf8', timeout: 60000, windowsHide: true });
  if (result.error || result.status !== 0) {
    const detail = String(result.stderr || result.stdout || '').trim().split(/\r?\n/).slice(-2).join(' ');
    throw new Error(`MOCK_TLS_UNAVAILABLE: openssl ${label} failed: ${detail.slice(0, 300)}`);
  }
}

function makeCertificates() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p0store-tls-'));
  const opensslPath = findOpenssl();
  const file = (name) => path.join(dir, name);
  const run = (args, label) => openssl(opensslPath, args, label);

  run(['genpkey', '-algorithm', 'RSA', '-pkeyopt', 'rsa_keygen_bits:2048', '-out', file('ca1.key')], 'ca1-key');
  run(['genpkey', '-algorithm', 'RSA', '-pkeyopt', 'rsa_keygen_bits:2048', '-out', file('ca2.key')], 'ca2-key');
  run([
    'req', '-x509', '-new', '-key', file('ca1.key'), '-sha256', '-days', '2',
    '-subj', '/CN=P0STORE TEST ONLY CA 1',
    '-addext', 'basicConstraints=critical,CA:TRUE',
    '-addext', 'keyUsage=critical,keyCertSign,cRLSign',
    '-out', file('ca1.pem'),
  ], 'ca1-cert');
  run([
    'req', '-x509', '-new', '-key', file('ca2.key'), '-sha256', '-days', '2',
    '-subj', '/CN=P0STORE TEST ONLY CA 2 (untrusted)',
    '-addext', 'basicConstraints=critical,CA:TRUE',
    '-addext', 'keyUsage=critical,keyCertSign,cRLSign',
    '-out', file('ca2.pem'),
  ], 'ca2-cert');
  run(['genpkey', '-algorithm', 'RSA', '-pkeyopt', 'rsa_keygen_bits:2048', '-out', file('server.key')], 'server-key');
  run(['req', '-new', '-key', file('server.key'), '-subj', '/CN=127.0.0.1', '-out', file('server.csr')], 'server-csr');
  run(['req', '-new', '-key', file('server.key'), '-subj', '/CN=wrong.invalid', '-out', file('wrongcn.csr')], 'wrong-cn-csr');

  fs.writeFileSync(file('good.ext'), [
    'basicConstraints=critical,CA:FALSE',
    'keyUsage=critical,digitalSignature,keyEncipherment',
    'extendedKeyUsage=serverAuth',
    'subjectAltName=IP:127.0.0.1,DNS:localhost',
    '',
  ].join('\n'));
  fs.writeFileSync(file('wrongcn.ext'), [
    'basicConstraints=critical,CA:FALSE',
    'keyUsage=critical,digitalSignature,keyEncipherment',
    'extendedKeyUsage=serverAuth',
    'subjectAltName=DNS:wrong.invalid',
    '',
  ].join('\n'));

  run([
    'x509', '-req', '-in', file('server.csr'), '-CA', file('ca1.pem'), '-CAkey', file('ca1.key'),
    '-CAcreateserial', '-days', '2', '-sha256', '-extfile', file('good.ext'), '-out', file('good.pem'),
  ], 'good-cert');
  run([
    'x509', '-req', '-in', file('server.csr'), '-CA', file('ca2.pem'), '-CAkey', file('ca2.key'),
    '-CAcreateserial', '-days', '2', '-sha256', '-extfile', file('good.ext'), '-out', file('wrong-ca.pem'),
  ], 'wrong-ca-cert');
  run([
    'x509', '-req', '-in', file('wrongcn.csr'), '-CA', file('ca1.pem'), '-CAkey', file('ca1.key'),
    '-CAcreateserial', '-days', '2', '-sha256',
    '-extfile', file('wrongcn.ext'), '-out', file('wrong-cn.pem'),
  ], 'wrong-cn-cert');
  run([
    'x509', '-req', '-in', file('server.csr'), '-CA', file('ca1.pem'), '-CAkey', file('ca1.key'),
    '-CAcreateserial', '-days', '-1', '-sha256', '-extfile', file('good.ext'), '-out', file('expired.pem'),
  ], 'expired-cert');

  const key = fs.readFileSync(file('server.key'));
  const certFor = (name) => ({ key, cert: fs.readFileSync(file(name)) });
  const caPem = fs.readFileSync(file('ca1.pem'), 'utf8');
  if (!caPem.includes('BEGIN CERTIFICATE')) throw new Error('MOCK_TLS_UNAVAILABLE: generated CA is not PEM');

  const cleanup = () => {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
  };
  process.once('exit', cleanup);
  return {
    dir,
    caPem,
    server: {
      good: certFor('good.pem'),
      'wrong-ca': certFor('wrong-ca.pem'),
      'wrong-cn': certFor('wrong-cn.pem'),
      expired: certFor('expired.pem'),
    },
  };
}

export function getTestCertificates() {
  if (certificateCache === null) certificateCache = makeCertificates();
  return certificateCache;
}

function sha256Hex(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function canonicalEtag(value) {
  return String(value).trim().replace(/^W\//, '');
}

function escapeXml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function normalizePath(raw) {
  if (typeof raw !== 'string') return null;
  const cut = raw.split('?')[0].split('#')[0];
  if (!cut.startsWith('/')) return null;
  if (cut.length > 1024) return null;
  if (cut.includes('\\') || cut.includes('\u0000')) return null;
  if (cut.includes('/../') || cut.endsWith('/..') || cut.includes('/./')) return null;
  return cut;
}

function parentOf(filePath) {
  const trimmed = filePath.endsWith('/') ? filePath.slice(0, -1) : filePath;
  const index = trimmed.lastIndexOf('/');
  if (index < 0) return '/';
  return `${trimmed.slice(0, index)}/`.replace('//', '/');
}

function canonicalCollection(collectionPath) {
  if (collectionPath === '/' || collectionPath === '') return '/';
  return collectionPath.replace(/\/+$/, '');
}

function readBody(req, onDone) {
  const chunks = [];
  let size = 0;
  let finished = false;
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      finished = true;
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', () => {
    if (finished) return;
    finished = true;
    onDone(Buffer.concat(chunks), null);
  });
  req.on('aborted', () => {
    if (finished) return;
    finished = true;
    onDone(Buffer.concat(chunks), 'ABORTED');
  });
  req.on('error', () => {
    if (finished) return;
    finished = true;
    onDone(Buffer.concat(chunks), 'ERROR');
  });
  req.on('close', () => {
    if (finished) return;
    finished = true;
    onDone(Buffer.concat(chunks), 'CLOSED');
  });
}

function isLateProbe(body) {
  if (!Buffer.isBuffer(body) || body.length === 0) return false;
  try {
    const parsed = JSON.parse(body.toString('utf8'));
    return parsed !== null && typeof parsed === 'object' && parsed.synthetic === true && parsed.experiment === 'S-LATE';
  } catch {
    return false;
  }
}

export async function startMock(options = {}) {
  const personality = options.personality === undefined ? 'strong' : options.personality;
  if (!PERSONALITIES.includes(personality)) throw new Error(`MOCK_PERSONALITY_UNKNOWN: ${personality}`);
  const password = options.password === undefined ? `mock-canary-${crypto.randomBytes(8).toString('hex')}` : options.password;
  if (typeof password !== 'string' || password.length === 0) throw new Error('MOCK_PASSWORD_REQUIRED');
  const namespaceRoot = options.namespaceRoot === undefined ? DEFAULT_NAMESPACE_ROOT : options.namespaceRoot;
  if (typeof namespaceRoot !== 'string' || !namespaceRoot.startsWith('/') || !namespaceRoot.endsWith('/')) {
    throw new Error('MOCK_NAMESPACE_ROOT_INVALID');
  }
  const staleReadLagMs = options.staleReadLagMs === undefined ? 1200 : options.staleReadLagMs;
  const redirectLocation = options.redirectLocation === undefined
    ? 'https://redirect.invalid/LMS-P0STORE/redirect-target-XFRD'
    : options.redirectLocation;
  const certKind = (options.tls === 'bad-cert' || (options.tls === undefined && personality === 'bad-cert'))
    ? (options.badCertKind || 'wrong-ca')
    : (options.tls === undefined || options.tls === 'good' ? 'good' : options.tls);
  const material = getTestCertificates().server[certKind];
  if (!material) throw new Error(`MOCK_CERT_KIND_UNKNOWN: ${certKind}`);

  const stats = {
    connections: 0,
    requests: 0,
    responses: 0,
    dropped: 0,
    unauthorized: 0,
    throttled: 0,
    serverErrors: 0,
    redirects: 0,
    authFailures: 0,
    oversized: 0,
    byMethod: {},
    byPath: {},
    requestLog: [],
  };
  const state = {
    personality,
    collections: new Set(['/', canonicalCollection(namespaceRoot)]),
    files: new Map(),
    hidden: new Map(),
    injectUnauthorizedAt: null,
  };

  function etagFor(entry) {
    const tag = `"v${entry.version}-${sha256Hex(entry.body).slice(0, 12)}"`;
    return state.personality === 'weak-etag' ? `W/${tag}` : tag;
  }

  function currentEntry(filePath) {
    return state.files.get(filePath) || null;
  }

  function visibleEntry(filePath) {
    const entry = currentEntry(filePath);
    if (!entry) return null;
    if (state.personality !== 'stale-read') return entry;
    const cutoff = Date.now() - staleReadLagMs;
    for (let i = entry.history.length - 1; i >= 0; i -= 1) {
      if (entry.history[i].at <= cutoff) return entry.history[i].entry;
    }
    // Nothing is old enough to be visible yet. A pre-existing file exposes its immediately previous
    // version (stale by one generation); a brand-new file is still invisible and GET returns 404.
    if (entry.history.length >= 2) return entry.history[entry.history.length - 2].entry;
    return null;
  }

  function ifMatchSatisfied(headerValue, currentEtag) {
    if (state.personality === 'lost-update') return true;
    const values = String(headerValue).split(',').map((value) => value.trim()).filter(Boolean);
    if (values.length === 0) return false;
    return values.some((value) => {
      if (value === '*') return true;
      if (state.personality === 'weak-etag') return canonicalEtag(value) === canonicalEtag(currentEtag);
      return value === currentEtag;
    });
  }

  function ifNoneMatchSatisfied(headerValue, currentEtag) {
    if (state.personality === 'create-overwrite') return true;
    const values = String(headerValue).split(',').map((value) => value.trim()).filter(Boolean);
    return values.some((value) => {
      if (value === '*') return false;
      if (state.personality === 'weak-etag') return canonicalEtag(value) === canonicalEtag(currentEtag);
      return value === currentEtag;
    });
  }

  function respond(res, status, headers = {}, body = null) {
    stats.responses += 1;
    const payload = body === null ? Buffer.alloc(0) : body;
    const finalHeaders = { 'Content-Length': String(payload.length), ...headers };
    res.writeHead(status, finalHeaders);
    if (payload.length > 0) res.end(payload);
    else res.end();
  }

  function davMultistatus(entries) {
    const parts = ['<?xml version="1.0" encoding="utf-8"?>', '<D:multistatus xmlns:D="DAV:">'];
    for (const entry of entries) {
      const collection = entry.collection === true;
      parts.push('<D:response>');
      parts.push(`<D:href>${escapeXml(entry.path)}</D:href>`);
      parts.push('<D:propstat><D:prop>');
      parts.push(`<D:resourcetype>${collection ? '<D:collection/>' : ''}</D:resourcetype>`);
      if (!collection) {
        parts.push(`<D:getetag>${escapeXml(entry.etag)}</D:getetag>`);
        parts.push(`<D:getcontentlength>${entry.length}</D:getcontentlength>`);
      }
      parts.push(`<D:getlastmodified>${new Date(entry.modifiedAt || Date.now()).toUTCString()}</D:getlastmodified>`);
      parts.push('</D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat>');
      parts.push('</D:response>');
    }
    parts.push('</D:multistatus>');
    return Buffer.from(parts.join(''), 'utf8');
  }

  function isCollection(targetPath) {
    const canonical = canonicalCollection(targetPath);
    return canonical === '/' || canonical === canonicalCollection(namespaceRoot) || state.collections.has(canonical);
  }

  function childrenOf(collectionPath) {
    const canonical = canonicalCollection(collectionPath);
    const prefix = canonical === '/' ? '/' : `${canonical}/`;
    const out = [];
    for (const filePath of state.files.keys()) {
      if (!filePath.startsWith(prefix)) continue;
      const remainder = filePath.slice(prefix.length);
      if (remainder.length > 0 && !remainder.includes('/')) out.push(filePath);
    }
    for (const dirPath of state.collections) {
      if (dirPath === '/' || dirPath === canonical) continue;
      if (!dirPath.startsWith(prefix)) continue;
      const remainder = dirPath.slice(prefix.length);
      if (remainder.length > 0 && !remainder.includes('/')) out.push(dirPath);
    }
    return out;
  }

  function handlePut(req, res, targetPath, body, aborted) {
    if (aborted) return;
    // The probe never sends an empty PUT; an aborted-before-body request that still surfaces an
    // 'end' must not create an empty resource.
    if (!Buffer.isBuffer(body) || body.length === 0) {
      respond(res, 400, { 'Content-Type': 'text/plain' });
      return;
    }
    const parent = parentOf(targetPath);
    if (!isCollection(parent)) {
      respond(res, 409, { 'Content-Type': 'text/plain' });
      return;
    }
    if (targetPath.endsWith('/')) { respond(res, 405); return; }
    const entry = currentEntry(targetPath);
    const ifMatch = req.headers['if-match'];
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifMatch !== undefined) {
      if (!entry || !ifMatchSatisfied(ifMatch, entry.etag)) {
        respond(res, 412, entry ? { ETag: entry.etag } : {});
        return;
      }
    } else if (ifNoneMatch !== undefined) {
      if (entry && !ifNoneMatchSatisfied(ifNoneMatch, entry.etag)) {
        respond(res, 412, { ETag: entry.etag });
        return;
      }
    } else {
      respond(res, 428);
      return;
    }
    const previous = entry === null ? null : { body: entry.body, etag: entry.etag };
    const next = {
      body,
      version: entry === null ? 1 : entry.version + 1,
      history: entry === null ? [] : entry.history,
      modifiedAt: Date.now(),
    };
    next.etag = etagFor(next);
    next.history.push({ at: Date.now(), entry: { body: next.body, etag: next.etag, modifiedAt: next.modifiedAt } });
    state.files.set(targetPath, next);
    const late = state.personality === 'late-ack' || state.personality === 'unresolvable-ack';
    if (late && isLateProbe(body) && req.headers['if-match'] !== undefined) {
      if (state.personality === 'unresolvable-ack' && previous !== null) {
        state.hidden.set(targetPath, { body: previous.body, etag: next.etag, remaining: 1 });
      }
      stats.dropped += 1;
      if (res.socket) res.socket.destroy();
      return;
    }
    respond(res, entry === null ? 201 : 204, { ETag: next.etag });
  }

  function handleGet(req, res, targetPath, headOnly) {
    if (isCollection(targetPath)) { respond(res, 405); return; }
    let entry = visibleEntry(targetPath);
    if (entry === null) {
      respond(res, 404);
      return;
    }
    const hidden = state.hidden.get(targetPath);
    if (hidden && hidden.remaining > 0) {
      hidden.remaining -= 1;
      if (hidden.remaining === 0) state.hidden.delete(targetPath);
      entry = { body: hidden.body, etag: hidden.etag, modifiedAt: Date.now() };
    }
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      ETag: entry.etag,
    };
    if (headOnly) respond(res, 200, headers);
    else respond(res, 200, headers, entry.body);
  }

  function handlePropfind(req, res, targetPath, depth) {
    const collection = isCollection(targetPath);
    const entry = currentEntry(targetPath);
    if (!collection && entry === null) { respond(res, 404); return; }
    if (depth !== '0' && depth !== '1') { respond(res, 400); return; }
    if (collection && depth === '1') {
      const entries = [{ path: targetPath.endsWith('/') ? targetPath : `${targetPath}/`, collection: true, modifiedAt: Date.now() }];
      for (const child of childrenOf(targetPath)) {
        if (isCollection(child)) {
          entries.push({ path: child.endsWith('/') ? child : `${child}/`, collection: true, modifiedAt: Date.now() });
        } else {
          const childEntry = currentEntry(child);
          entries.push({
            path: child,
            collection: false,
            etag: childEntry.etag,
            length: childEntry.body.length,
            modifiedAt: childEntry.modifiedAt,
          });
        }
      }
      respond(res, 207, { 'Content-Type': 'application/xml; charset=utf-8', DAV: '1,2' }, davMultistatus(entries));
      return;
    }
    const single = collection
      ? [{ path: targetPath.endsWith('/') ? targetPath : `${targetPath}/`, collection: true, modifiedAt: Date.now() }]
      : [{ path: targetPath, collection: false, etag: entry.etag, length: entry.body.length, modifiedAt: entry.modifiedAt }];
    respond(res, 207, { 'Content-Type': 'application/xml; charset=utf-8', DAV: '1,2' }, davMultistatus(single));
  }

  function handleDelete(req, res, targetPath) {
    if (isCollection(targetPath)) { respond(res, 405); return; }
    const entry = currentEntry(targetPath);
    if (entry === null) { respond(res, 404); return; }
    if (req.headers.depth !== undefined) { respond(res, 400); return; }
    const ifMatch = req.headers['if-match'];
    if (ifMatch === undefined || !ifMatchSatisfied(ifMatch, entry.etag)) {
      respond(res, 412, { ETag: entry.etag });
      return;
    }
    state.files.delete(targetPath);
    respond(res, 204);
  }

  function handleMkcol(req, res, targetPath) {
    if (isCollection(targetPath)) { respond(res, 405); return; }
    const canonical = canonicalCollection(targetPath);
    const parent = parentOf(targetPath);
    if (!isCollection(parent)) { respond(res, 409); return; }
    state.collections.add(canonical);
    respond(res, 201);
  }

  const server = https.createServer({ key: material.key, cert: material.cert, minVersion: 'TLSv1.2' }, (req, res) => {
    stats.requests += 1;
    const method = typeof req.method === 'string' ? req.method : 'UNKNOWN';
    stats.byMethod[method] = (stats.byMethod[method] || 0) + 1;
    const rawPath = req.url;
    const targetPath = normalizePath(rawPath);
    if (targetPath === null) { respond(res, 400); return; }
    stats.byPath[targetPath] = (stats.byPath[targetPath] || 0) + 1;
    stats.requestLog.push({ method, path: targetPath });
    const expectedAuth = `Basic ${Buffer.from(`${BASIC_USER}:${password}`, 'utf8').toString('base64')}`;
    const authorization = req.headers.authorization;
    if (authorization !== expectedAuth) {
      stats.authFailures += 1;
      respond(res, 401, { 'WWW-Authenticate': 'Basic realm="p0store-mock"' });
      return;
    }
    if (state.injectUnauthorizedAt !== null && stats.requests === state.injectUnauthorizedAt) {
      stats.unauthorized += 1;
      respond(res, 401, { 'WWW-Authenticate': 'Basic realm="p0store-mock"' });
      return;
    }
    if (state.personality === 'throttle') {
      stats.throttled += 1;
      respond(res, 429, { 'Retry-After': '60' });
      return;
    }
    if (state.personality === 'server-error') {
      stats.serverErrors += 1;
      respond(res, 500, { 'Content-Type': 'text/plain' }, Buffer.from('synthetic server error'));
      return;
    }
    if (state.personality === 'redirect') {
      stats.redirects += 1;
      respond(res, 302, { Location: redirectLocation });
      return;
    }
    if (method === 'OPTIONS') {
      respond(res, 200, {
        DAV: '1,2', Allow: 'OPTIONS, PROPFIND, GET, HEAD, PUT, MKCOL, DELETE', 'MS-Author-Via': 'DAV',
      });
      return;
    }
    if (method === 'PROPFIND') {
      handlePropfind(req, res, targetPath, req.headers.depth);
      return;
    }
    if (method === 'GET' || method === 'HEAD') {
      handleGet(req, res, targetPath, method === 'HEAD');
      return;
    }
    if (method === 'PUT') {
      readBody(req, (body, abortReason) => handlePut(req, res, targetPath, body, abortReason !== null));
      return;
    }
    if (method === 'DELETE') {
      handleDelete(req, res, targetPath);
      return;
    }
    if (method === 'MKCOL') {
      handleMkcol(req, res, targetPath);
      return;
    }
    respond(res, 405, { Allow: 'OPTIONS, PROPFIND, GET, HEAD, PUT, MKCOL, DELETE' });
  });
  server.on('connection', () => { stats.connections += 1; });
  server.on('tlsClientError', () => { /* handshake failures are counted by the client side */ });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  const port = address.port;
  const caPem = getTestCertificates().caPem;

  const control = {
    personality: () => state.personality,
    setPersonality(value) {
      if (!PERSONALITIES.includes(value)) throw new Error(`MOCK_PERSONALITY_UNKNOWN: ${value}`);
      state.personality = value;
    },
    setInjectUnauthorizedAt(n) {
      if (n !== null && (!Number.isSafeInteger(n) || n < 1)) throw new Error('MOCK_INJECT_INVALID');
      state.injectUnauthorizedAt = n;
    },
    requestCount: () => stats.requests,
    pathRequests: (requestPath) => stats.byPath[requestPath] || 0,
    files: () => [...state.files.keys()],
    fileCount: () => state.files.size,
    collections: () => [...state.collections],
    hasFile: (requestPath) => state.files.has(requestPath),
    fileBody: (requestPath) => {
      const entry = state.files.get(requestPath);
      return entry ? Buffer.from(entry.body) : null;
    },
    fileEtag: (requestPath) => {
      const entry = state.files.get(requestPath);
      return entry ? entry.etag : null;
    },
    seedCollection(collectionPath) {
      state.collections.add(canonicalCollection(collectionPath));
    },
    seedFile(filePath, body) {
      const entry = { body: Buffer.from(body), version: 1, history: [], modifiedAt: Date.now() };
      entry.etag = etagFor(entry);
      entry.history.push({ at: Date.now(), entry: { body: entry.body, etag: entry.etag, modifiedAt: entry.modifiedAt } });
      state.files.set(filePath, entry);
    },
    reset() {
      state.collections = new Set(['/', canonicalCollection(namespaceRoot)]);
      state.files = new Map();
      state.hidden = new Map();
      state.injectUnauthorizedAt = null;
      for (const key of Object.keys(stats)) {
        if (key === 'byMethod' || key === 'byPath') stats[key] = {};
        else if (key === 'requestLog') stats[key] = [];
        else stats[key] = 0;
      }
    },
    stats,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };

  return {
    personality,
    port,
    host: '127.0.0.1',
    namespaceRoot,
    caPem,
    password,
    stats,
    state,
    control,
    // Direct read-only inspection helpers used by the P1-07..P1-10 tests. They are thin aliases of
    // the control object so a test can ask `mock.hasFile(...)` without reaching through `control`.
    requestCount: control.requestCount,
    pathRequests: control.pathRequests,
    files: control.files,
    fileCount: control.fileCount,
    collections: control.collections,
    hasFile: control.hasFile,
    fileBody: control.fileBody,
    fileEtag: control.fileEtag,
    close: control.close,
  };
}

// Test helper: the exact path helpers the probe uses, derived from a plan-like object.
export function mockFileUrl(plan, name) {
  return `https://127.0.0.1:${plan.port}${plan.pathPrefix}${name}`;
}
