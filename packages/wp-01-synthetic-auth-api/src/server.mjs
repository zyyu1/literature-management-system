// WP-01 synthetic Auth/Session/safe-API contract double (D007-A21, LOCAL_SYNTHETIC_ONLY).
// Importing this module starts nothing. createSyntheticAuthServer() is inert until listen().
// Loopback 127.0.0.1 with ephemeral port 0 only. Fake data only. NOT production-suitable.
import http from 'node:http';
import {
  API_VERSION, COOKIE_NAME, COOKIE_ATTRS, LIMITS, LOOPBACK_BIND, SAFE_FETCH_SITES,
  OUTCOME, OP_ID_RE, Denial, isValidResourceId, hasForbiddenKey, parseTarget,
} from './policy.mjs';
import { createStore } from './store.mjs';

const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const ALLOWED_REQUEST_HEADERS = ['content-type', 'x-csrf-token', 'if-match', 'idempotency-key'];
const ALLOWED_METHODS = ['GET', 'POST', 'DELETE'];

export function createSyntheticAuthServer(options = {}) {
  const { fixture, host = LOOPBACK_BIND, port = 0, allowedOrigins, requireFetchMetadata = true, requestBudget = LIMITS.maxRequestsPerRun } = options;
  // Fail closed on unsafe config before anything is created.
  if (host !== LOOPBACK_BIND) throw new Error('UNSAFE_CONFIG: bind host must be 127.0.0.1');
  if (port !== 0) throw new Error('UNSAFE_CONFIG: port must be 0 (ephemeral)');
  // Tests may only LOWER the request budget; the WP-01 ceiling is 5000 per documented run.
  if (!Number.isInteger(requestBudget) || requestBudget < 1 || requestBudget > LIMITS.maxRequestsPerRun) {
    throw new Error('UNSAFE_CONFIG: requestBudget must be an integer in 1..5000');
  }
  if (requireFetchMetadata !== true && requireFetchMetadata !== false) throw new Error('UNSAFE_CONFIG: requireFetchMetadata must be boolean');
  const store = createStore(fixture);
  const origins = new Set(allowedOrigins || [fixture.environment.frontendOrigin]);
  for (const o of origins) {
    if (typeof o !== 'string' || o === '*' || o === 'null' || !/^https:\/\/[a-z0-9.-]+(:\d+)?$/.test(o)) {
      throw new Error('UNSAFE_CONFIG: origin allowlist must be exact https origins');
    }
  }

  const stats = { requests: 0, rejectedOverBudget: 0, responses: 0 };
  const logs = []; // sanitized: route template, status, code only. Never headers/bodies/tokens.
  const log = (method, route, status, code) => logs.push({ t: new Date(store.now()).toISOString(), method, route, status, code: code || null });

  const server = http.createServer({ maxHeaderSize: 16384 }, (req, res) => {
    handle(req, res).catch(() => {
      if (!res.headersSent) send(res, req, 500, errorBody('INTERNAL'), 'internal', 'INTERNAL');
      else res.destroy();
    });
  });
  server.headersTimeout = 5000;
  server.requestTimeout = 10000;
  server.on('connection', (sock) => {
    const ra = sock.remoteAddress;
    if (ra !== '127.0.0.1' && ra !== '::ffff:127.0.0.1') sock.destroy();
  });
  server.on('clientError', (_e, sock) => { sock.destroy(); });

  function corsHeaders(req) {
    const h = { Vary: 'Origin' };
    const o = req.headers.origin;
    if (typeof o === 'string' && origins.has(o)) {
      h['Access-Control-Allow-Origin'] = o;
      h['Access-Control-Allow-Credentials'] = 'true';
    }
    return h;
  }

  function send(res, req, status, body, route, code, extraHeaders = {}, withCors = true) {
    let buf = Buffer.from(JSON.stringify(body), 'utf8');
    if (buf.length > LIMITS.maxResponseBodyBytes) {
      status = 500; code = 'RESPONSE_LIMIT';
      buf = Buffer.from(JSON.stringify(errorBody('RESPONSE_LIMIT')), 'utf8');
      extraHeaders = {};
    }
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': String(buf.length),
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...(withCors ? corsHeaders(req) : { Vary: 'Origin' }),
      ...extraHeaders,
    });
    res.end(buf);
    stats.responses += 1;
    log(req.method, route, status, code);
  }

  function errorBody(code, extra = {}) {
    return { apiVersion: API_VERSION, error: { code }, outcome: OUTCOME.DEFINITE_FAILURE, dispatched: false, ...extra };
  }

  function readCookie(req) {
    const raw = req.headers.cookie;
    if (typeof raw !== 'string') return null;
    const found = [];
    for (const part of raw.split(';')) {
      const i = part.indexOf('=');
      if (i === -1) continue;
      if (part.slice(0, i).trim() === COOKIE_NAME) found.push(part.slice(i + 1).trim());
    }
    if (found.length !== 1) return found.length === 0 ? null : '\u0000ambiguous';
    return found[0];
  }

  function readBody(req) {
    return new Promise((resolve, reject) => {
      const declared = req.headers['content-length'];
      if (declared !== undefined && Number(declared) > LIMITS.maxRequestBodyBytes) {
        reject(new Denial(413, 'BODY_TOO_LARGE'));
        return;
      }
      let size = 0; const chunks = []; let done = false;
      req.on('data', (c) => {
        if (done) return;
        size += c.length;
        if (size > LIMITS.maxRequestBodyBytes) { done = true; reject(new Denial(413, 'BODY_TOO_LARGE')); return; }
        chunks.push(c);
      });
      req.on('end', () => { if (!done) { done = true; resolve(Buffer.concat(chunks)); } });
      req.on('error', () => { if (!done) { done = true; reject(new Denial(400, 'BAD_REQUEST')); } });
    });
  }

  // Ordered pre-dispatch gate for unsafe methods: Origin -> Fetch Metadata -> content type/body ->
  // Session -> CSRF. Every failure is a DEFINITE_FAILURE before any dispatch.
  async function unsafeGate(req) {
    const o = req.headers.origin;
    if (typeof o !== 'string' || !origins.has(o)) throw new Denial(403, 'ORIGIN_DENIED');
    const sfs = req.headers['sec-fetch-site'];
    if (sfs === undefined ? requireFetchMetadata : !SAFE_FETCH_SITES.has(sfs)) throw new Denial(403, 'FETCH_METADATA_DENIED');
    const raw = await readBody(req);
    let body = null;
    if (raw.length > 0) {
      const ct = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      if (ct !== 'application/json') throw new Denial(415, 'UNSUPPORTED_MEDIA_TYPE');
      try { body = JSON.parse(raw.toString('utf8')); } catch { throw new Denial(400, 'BAD_JSON'); }
      if (hasForbiddenKey(body)) throw new Denial(400, 'FORBIDDEN_KEY');
    }
    const auth = sessionGate(req);
    store.checkCsrf(auth.session, req.headers['x-csrf-token']);
    return { auth, body };
  }

  function sessionGate(req) {
    const tok = readCookie(req);
    if (tok === '\u0000ambiguous') throw new Denial(401, 'SESSION_INVALID');
    return store.authenticate(tok);
  }

  function route(method, segs) {
    // Returns [templateName, params] or null. Only /api/v1/... exists.
    if (segs[0] !== 'api' || segs[1] !== API_VERSION) return null;
    const s = segs.slice(2);
    const k = s.length;
    if (k === 1 && s[0] === 'health') return ['health', {}];
    if (k === 2 && s[0] === 'session' && s[1] === 'csrf') return ['session.csrf', {}];
    if (k === 2 && s[0] === 'session' && s[1] === 'renew') return ['session.renew', {}];
    if (k === 2 && s[0] === 'session' && s[1] === 'logout') return ['session.logout', {}];
    if (k === 2 && s[0] === 'session' && s[1] === 'revoke-other') return ['session.revokeOther', {}];
    if (k === 1 && s[0] === 'factors') return ['factors', {}];
    if (k === 1 && s[0] === 'redirect') return ['redirect', {}];
    if (k === 2 && s[0] === 'operations') return ['operation', { opId: s[1] }];
    if (s[0] === 'projects' && (k === 2 || k === 3)) {
      const sub = k === 3 ? s[2] : '';
      const map = { '': 'project', projection: 'project.projection', mutations: 'project.mutations', 'unlink-all': 'project.unlinkAll', export: 'project.export' };
      if (!Object.hasOwn(map, sub)) return null;
      return [map[sub], { id: s[1] }];
    }
    return null;
  }

  const METHODS = {
    health: ['GET'], 'session.csrf': ['GET'], 'session.renew': ['POST'], 'session.logout': ['POST'],
    'session.revokeOther': ['POST'], factors: ['POST'], redirect: ['GET'], operation: ['GET'],
    project: ['GET', 'DELETE'], 'project.projection': ['GET'], 'project.mutations': ['POST'],
    'project.unlinkAll': ['POST'], 'project.export': ['GET'],
  };

  async function handle(req, res) {
    stats.requests += 1;
    if (stats.requests > requestBudget) {
      stats.rejectedOverBudget += 1;
      send(res, req, 429, errorBody('REQUEST_BUDGET_EXHAUSTED'), 'budget', 'REQUEST_BUDGET_EXHAUSTED', { Connection: 'close' });
      req.resume();
      return;
    }
    const target = parseTarget(req.url);
    if (!target) { req.resume(); return send(res, req, 400, errorBody('INVALID_PATH'), 'invalid', 'INVALID_PATH'); }
    const r = route(req.method, target.segs);
    if (!r) { req.resume(); return send(res, req, 404, errorBody('NO_ROUTE'), 'none', 'NO_ROUTE'); }
    const [name, params] = r;

    if (req.method === 'OPTIONS') { req.resume(); return preflight(req, res, name); }
    if (!METHODS[name].includes(req.method)) { req.resume(); return send(res, req, 405, errorBody('METHOD_NOT_ALLOWED'), name, 'METHOD_NOT_ALLOWED', { Allow: METHODS[name].join(', ') }); }
    if (params.id !== undefined && !isValidResourceId(params.id)) { req.resume(); return send(res, req, 400, errorBody('INVALID_RESOURCE_ID'), name, 'INVALID_RESOURCE_ID'); }
    if (params.opId !== undefined && !OP_ID_RE.test(params.opId)) { req.resume(); return send(res, req, 400, errorBody('INVALID_OPERATION_ID'), name, 'INVALID_OPERATION_ID'); }

    try {
      if (UNSAFE.has(req.method)) {
        const { auth, body } = await unsafeGate(req);
        return await unsafeHandlers[name](req, res, name, params, auth, body);
      }
      req.resume();
      return safeHandlers[name](req, res, name, params);
    } catch (e) {
      if (e instanceof Denial) {
        req.resume();
        return send(res, req, e.status, errorBody(e.code, e.extra), name, e.code, e.status === 413 ? { Connection: 'close' } : {});
      }
      throw e;
    }
  }

  function preflight(req, res, name) {
    const o = req.headers.origin;
    const m = String(req.headers['access-control-request-method'] || '');
    const hdrs = String(req.headers['access-control-request-headers'] || '')
      .split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
    const ok = typeof o === 'string' && origins.has(o) && METHODS[name].includes(m)
      && hdrs.every((h) => ALLOWED_REQUEST_HEADERS.includes(h));
    if (!ok) return send(res, req, 403, errorBody('PREFLIGHT_DENIED'), name, 'PREFLIGHT_DENIED', {}, false);
    res.writeHead(204, {
      ...corsHeaders(req),
      'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
      'Access-Control-Allow-Headers': ALLOWED_REQUEST_HEADERS.join(', '),
      'Access-Control-Max-Age': '600',
      'Cache-Control': 'no-store',
    });
    res.end();
    stats.responses += 1;
    log('OPTIONS', name, 204, null);
  }

  const ok = (extra) => ({ apiVersion: API_VERSION, ...extra });

  const safeHandlers = {
    health(req, res, name) {
      send(res, req, 200, ok({ mode: 'LOCAL_SYNTHETIC_ONLY', provider: 'FAKE_ONLY', fixtureSchemaVersion: fixture.fixtureSchemaVersion, seed: fixture.seed, productionSuitable: false }), name);
    },
    'session.csrf'(req, res, name) {
      const { session } = sessionGate(req);
      send(res, req, 200, ok({ csrfToken: session.csrf }), name);
    },
    project(req, res, name, { id }) {
      const { principal } = sessionGate(req);
      const p = store.authorizeProject(principal, id, 'owner-read');
      send(res, req, 200, ok({ project: { id: p.id, archived: p.archived, revision: p.revision } }), name, null, { ETag: `"${p.revision}"` });
    },
    'project.projection'(req, res, name, { id }) {
      const { principal } = sessionGate(req);
      const p = store.authorizeProject(principal, id, 'projection');
      // Scoped read-only projection: no owner id, no revision/ETag, no other projects.
      send(res, req, 200, ok({ projection: { id: p.id, archived: p.archived }, readOnly: true }), name);
    },
    'project.export'(req, res, name, { id }) {
      const { principal } = sessionGate(req);
      store.authorizeProject(principal, id, 'export'); // workspace -> WORKSPACE_READ_ONLY; foreign -> NOT_AVAILABLE
      throw new Denial(403, 'FEATURE_DISABLED');
    },
    operation(req, res, name, { opId }) {
      const { principal } = sessionGate(req);
      const rec = store.ledgerGet(principal.id, opId);
      if (!rec) throw new Denial(403, 'NOT_AVAILABLE');
      send(res, req, 200, ok({ operation: publicOp(rec), ledger: 'EPHEMERAL_TEST_ONLY', authoritative: false }), name);
    },
    redirect(req, res, name) {
      // Never redirect to anything but an exact allowlisted frontend origin path; never fetch it.
      const to = new URLSearchParams(req.url.split('?')[1] || '').get('to');
      let u = null;
      try { u = to ? new URL(to) : null; } catch { u = null; }
      if (!u || !origins.has(u.origin) || u.username || u.password) throw new Denial(400, 'DENY_OUTBOUND');
      send(res, req, 303, ok({ location: u.origin + u.pathname }), name, null, { Location: u.origin + u.pathname });
    },
  };
  for (const k of Object.keys(safeHandlers)) {
    const f = safeHandlers[k];
    safeHandlers[k] = (req, res, name, params) => {
      try { return f(req, res, name, params || {}); } catch (e) {
        if (e instanceof Denial) return send(res, req, e.status, errorBody(e.code, e.extra), name, e.code);
        throw e;
      }
    };
  }

  const R2 = new Set(['project', 'project.unlinkAll', 'session.revokeOther']);

  const unsafeHandlers = {
    async 'session.renew'(req, res, name, _p, { session }) {
      const next = store.rotate(session);
      send(res, req, 200, ok({ csrfToken: next.csrf, renewed: true, absoluteExpiryExtended: false }), name, null,
        { 'Set-Cookie': `${COOKIE_NAME}=${next.token}; ${COOKIE_ATTRS}` });
    },
    async 'session.logout'(req, res, name, _p, { session }) {
      store.revoke(session);
      send(res, req, 200, ok({ loggedOut: true }), name, null, { 'Set-Cookie': `${COOKIE_NAME}=; ${COOKIE_ATTRS}; Max-Age=0` });
    },
    async 'session.revokeOther'(req, res, name, _p, { principal }) {
      if (principal.role === 'WORKSPACE_READONLY') throw new Denial(403, 'WORKSPACE_READ_ONLY');
      if (principal.role !== 'OWNER') throw new Denial(403, 'NOT_AVAILABLE');
      throw stepUp();
    },
    async factors(req, res, name, _p, { principal }) {
      if (principal.role === 'WORKSPACE_READONLY') throw new Denial(403, 'WORKSPACE_READ_ONLY');
      throw new Denial(403, 'FEATURE_DISABLED'); // no MFA enrollment exists in WP-01
    },
    async project(req, res, name, { id }, { principal }) { // DELETE: permanent Project delete stays DISABLED
      store.authorizeProject(principal, id, 'r2');
      throw stepUp();
    },
    async 'project.unlinkAll'(req, res, name, { id }, { principal }) {
      store.authorizeProject(principal, id, 'r2');
      throw stepUp();
    },
    async 'project.mutations'(req, res, name, { id }, { principal }, body) {
      const proj = store.authorizeProject(principal, id, 'write');
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Denial(400, 'BAD_REQUEST');
      const { operationId, action, value } = body;
      if (typeof operationId !== 'string' || !OP_ID_RE.test(operationId)) throw new Denial(400, 'INVALID_OPERATION_ID');
      if (action !== 'SET_ARCHIVED' || typeof value !== 'boolean') throw new Denial(422, 'UNSUPPORTED_ACTION');
      const ifMatch = req.headers['if-match'];
      const fp = store.fingerprint({ projectId: proj.id, action, value, ifMatch: ifMatch || null });
      const prior = store.ledgerGet(principal.id, operationId);
      if (prior) {
        // Never a second dispatch for a reused operationId (no blind replay, no durable dedupe claim).
        if (prior.fingerprint !== fp) throw new Denial(409, 'OPERATION_FINGERPRINT_MISMATCH');
        return send(res, req, 409, {
          apiVersion: API_VERSION, error: { code: 'OPERATION_ID_REUSED' }, outcome: prior.outcome,
          dispatched: false, operation: publicOp(prior), ledger: 'EPHEMERAL_TEST_ONLY', authoritative: false, saved: false,
        }, name, 'OPERATION_ID_REUSED');
      }
      if (ifMatch === undefined) throw new Denial(428, 'PRECONDITION_REQUIRED', { outcome: OUTCOME.CONFLICT });
      if (ifMatch !== `"${proj.revision}"`) throw new Denial(412, 'PRECONDITION_FAILED', { outcome: OUTCOME.CONFLICT });

      const expectedRevision = proj.revision;
      const { sim, committed, drop, dispatched } = store.dispatch(proj, { action, value });
      const rec = {
        operationId, principalId: principal.id, projectId: proj.id, action, value, expectedRevision,
        fingerprint: fp, outcome: sim.outcome, transportStatus: sim.transportStatus, createdAt: new Date(store.now()).toISOString(),
      };
      store.ledgerPut(principal.id, operationId, rec);
      if (drop) { res.destroy(); log(req.method, name, 0, 'CONNECTION_DROPPED_AFTER_DISPATCH'); return; }
      const saved = sim.outcome === OUTCOME.CONFIRMED && sim.authoritative === true && committed;
      const respBody = {
        apiVersion: API_VERSION, operationId, outcome: sim.outcome, authoritative: sim.authoritative,
        saved, dispatched, scenario: sim.scenario,
      };
      if (saved) respBody.revision = proj.revision;
      else respBody.operation = publicOp(rec);
      send(res, req, sim.transportStatus, respBody, name, sim.outcome, saved ? { ETag: `"${proj.revision}"` } : {});
    },
  };

  function stepUp() { return new Denial(403, 'STEP_UP_REQUIRED', { stepUp: 'REQUIRED', mutationEnabled: false }); }

  function publicOp(rec) {
    return {
      operationId: rec.operationId, projectId: rec.projectId, action: rec.action, value: rec.value,
      expectedRevision: rec.expectedRevision, outcome: rec.outcome, createdAt: rec.createdAt,
    };
  }

  let listening = false;
  return {
    async listen() {
      if (listening) throw new Error('already listening');
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen({ host, port, exclusive: true }, () => { server.off('error', reject); resolve(); });
      });
      const a = server.address();
      if (!a || a.address !== LOOPBACK_BIND) { server.close(); throw new Error('UNSAFE_CONFIG: not bound to loopback'); }
      listening = true;
      return { host: a.address, port: a.port, baseUrl: `http://127.0.0.1:${a.port}` };
    },
    async close() {
      if (!listening) return;
      listening = false;
      server.closeAllConnections?.();
      await new Promise((resolve) => server.close(() => resolve()));
    },
    address: () => server.address(),
    stats,
    logs,
    backend: store.backend,
    control: store.control,
  };
}
