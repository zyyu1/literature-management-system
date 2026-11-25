// WP-02 synthetic READ-ONLY Project/Paper slice (D007-A56, LOCAL_SYNTHETIC_ONLY).
// Composes the merged WP-01 Session store and policy helpers by READ-ONLY import (WP-01 is not modified).
// Importing this module starts nothing; createProjectPaperReadServer() is inert until listen().
// Loopback 127.0.0.1 with ephemeral port 0 only. Fake data only. NOT production-suitable.
import http from 'node:http';
import { createStore } from '../../wp-01-synthetic-auth-api/src/store.mjs';
import {
  API_VERSION, COOKIE_NAME, LIMITS, LOOPBACK_BIND, Denial, parseTarget,
} from '../../wp-01-synthetic-auth-api/src/policy.mjs';
import { createCatalog, paperKey, LIBRARY_TYPES, LIBRARY_ID_RE, ITEM_KEY_RE } from './catalog.mjs';

const PROJECT_ID_RE = /^[a-z][a-z0-9_]{0,63}$/;
const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);
const STATES = new Set(['active', 'archived', 'all']);

export function createProjectPaperReadServer(options = {}) {
  const { wp01Fixture, wp02Fixture, host = LOOPBACK_BIND, port = 0, requestBudget = LIMITS.maxRequestsPerRun } = options;
  if (host !== LOOPBACK_BIND) throw new Error('UNSAFE_CONFIG: bind host must be 127.0.0.1');
  if (port !== 0) throw new Error('UNSAFE_CONFIG: port must be 0 (ephemeral)');
  if (!Number.isInteger(requestBudget) || requestBudget < 1 || requestBudget > LIMITS.maxRequestsPerRun) {
    throw new Error('UNSAFE_CONFIG: requestBudget must be an integer in 1..5000');
  }
  if (!wp02Fixture || !wp02Fixture.dependsOn || wp02Fixture.dependsOn.wp01Sha256 !== '86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65') {
    throw new Error('UNSAFE_CONFIG: WP-02 fixture must reference the frozen WP-01 fixture');
  }
  const sessions = createStore(wp01Fixture); // WP-01 Session/principal rules, unchanged
  const catalog = createCatalog(wp02Fixture);
  const origins = new Set([wp01Fixture.environment.frontendOrigin]);

  const stats = { requests: 0, rejectedOverBudget: 0, responses: 0 };
  const logs = [];
  const log = (method, route, status, code) => logs.push({ t: sessions.control.nowIso(), method, route, status, code: code || null });

  const server = http.createServer({ maxHeaderSize: 16384 }, (req, res) => {
    try { handle(req, res); } catch {
      if (!res.headersSent) send(res, req, 500, errorBody('INTERNAL'), 'internal', 'INTERNAL'); else res.destroy();
    }
  });
  server.headersTimeout = 5000;
  server.requestTimeout = 10000;
  server.on('connection', (sock) => {
    const ra = sock.remoteAddress;
    if (ra !== '127.0.0.1' && ra !== '::ffff:127.0.0.1') sock.destroy();
  });
  server.on('clientError', (_e, sock) => { sock.destroy(); });

  function errorBody(code) {
    return { apiVersion: API_VERSION, error: { code }, outcome: 'DEFINITE_FAILURE', dispatched: false };
  }

  function send(res, req, status, body, route, code, extra = {}) {
    let buf = Buffer.from(JSON.stringify(body), 'utf8');
    if (buf.length > LIMITS.maxResponseBodyBytes) {
      status = 500; code = 'RESPONSE_LIMIT'; extra = {};
      buf = Buffer.from(JSON.stringify(errorBody('RESPONSE_LIMIT')), 'utf8');
    }
    const h = {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': String(buf.length),
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      Vary: 'Origin',
    };
    const o = req.headers.origin;
    if (typeof o === 'string' && origins.has(o)) {
      h['Access-Control-Allow-Origin'] = o;
      h['Access-Control-Allow-Credentials'] = 'true';
    }
    res.writeHead(status, { ...h, ...extra });
    res.end(buf);
    stats.responses += 1;
    log(req.method, route, status, code);
  }

  // The single neutral denial: FOREIGN, ANONYMOUS, foreign resource and missing resource are indistinguishable.
  const NOT_AVAILABLE = () => new Denial(403, 'NOT_AVAILABLE');

  function principalOf(req) {
    const raw = req.headers.cookie;
    const found = [];
    if (typeof raw === 'string') {
      for (const part of raw.split(';')) {
        const i = part.indexOf('=');
        if (i !== -1 && part.slice(0, i).trim() === COOKIE_NAME) found.push(part.slice(i + 1).trim());
      }
    }
    if (found.length === 0) throw NOT_AVAILABLE(); // ANONYMOUS on WP-02 routes (A56 R-AUTH / Q2-06)
    if (found.length > 1) throw new Denial(401, 'SESSION_INVALID');
    const { principal } = sessions.authenticate(found[0]); // revoked/expired/invalid -> WP-01 401s
    if (principal.role !== 'OWNER' && principal.role !== 'WORKSPACE_READONLY') throw NOT_AVAILABLE();
    return principal;
  }

  function route(segs) {
    if (segs[0] !== 'api' || segs[1] !== API_VERSION) return null;
    const s = segs.slice(2);
    if (s.length === 1 && s[0] === 'health') return ['health', {}];
    if (s.length === 1 && s[0] === 'projects') return ['projects.list', {}];
    if (s.length === 3 && s[0] === 'projects' && s[2] === 'papers') return ['project.papers', { projectId: s[1] }];
    if (s.length === 4 && s[0] === 'papers') return ['paper.detail', { libraryType: s[1], libraryId: s[2], itemKey: s[3] }];
    return null;
  }

  function validParams(p) {
    for (const v of Object.values(p)) if (FORBIDDEN.has(v)) return false;
    if (p.projectId !== undefined && !PROJECT_ID_RE.test(p.projectId)) return false;
    if (p.libraryType !== undefined && !LIBRARY_TYPES.has(p.libraryType)) return false;
    if (p.libraryId !== undefined && !LIBRARY_ID_RE.test(p.libraryId)) return false;
    if (p.itemKey !== undefined && !ITEM_KEY_RE.test(p.itemKey)) return false;
    return true;
  }

  function handle(req, res) {
    stats.requests += 1;
    if (stats.requests > requestBudget) {
      stats.rejectedOverBudget += 1;
      req.resume();
      return send(res, req, 429, errorBody('REQUEST_BUDGET_EXHAUSTED'), 'budget', 'REQUEST_BUDGET_EXHAUSTED', { Connection: 'close' });
    }
    const declared = req.headers['content-length'];
    if (declared !== undefined && Number(declared) > LIMITS.maxRequestBodyBytes) {
      req.resume();
      return send(res, req, 413, errorBody('BODY_TOO_LARGE'), 'limit', 'BODY_TOO_LARGE', { Connection: 'close' });
    }
    req.resume(); // WP-02 never reads request bodies
    const target = parseTarget(req.url);
    if (!target) return send(res, req, 400, errorBody('INVALID_PATH'), 'invalid', 'INVALID_PATH');
    const r = route(target.segs);
    if (!r) return send(res, req, 404, errorBody('NO_ROUTE'), 'none', 'NO_ROUTE');
    const [name, params] = r;
    // R-RO: every non-GET method on a WP-02 route is 405 before any other processing; nothing is dispatched.
    if (req.method !== 'GET') return send(res, req, 405, errorBody('METHOD_NOT_ALLOWED'), name, 'METHOD_NOT_ALLOWED', { Allow: 'GET' });
    const qKeys = [...target.query.keys()];
    if (name === 'projects.list') {
      if (qKeys.some((k) => k !== 'state') || target.query.getAll('state').length > 1) return send(res, req, 400, errorBody('INVALID_QUERY'), name, 'INVALID_QUERY');
    } else if (qKeys.length > 0) {
      return send(res, req, 400, errorBody('INVALID_QUERY'), name, 'INVALID_QUERY');
    }
    if (!validParams(params)) return send(res, req, 400, errorBody('INVALID_RESOURCE_ID'), name, 'INVALID_RESOURCE_ID');
    try {
      return handlers[name](req, res, name, params, target.query);
    } catch (e) {
      if (e instanceof Denial) return send(res, req, e.status, errorBody(e.code), name, e.code);
      throw e;
    }
  }

  const ok = (x) => ({ apiVersion: API_VERSION, ...x });

  const handlers = {
    health(req, res, name) {
      send(res, req, 200, ok({ mode: 'LOCAL_SYNTHETIC_ONLY', provider: 'FAKE_ONLY', readOnly: true, fixtureSchemaVersion: wp02Fixture.fixtureSchemaVersion, productionSuitable: false }), name);
    },
    'projects.list'(req, res, name, _p, query) {
      const state = query.has('state') ? query.get('state') : 'active';
      if (!STATES.has(state)) throw new Denial(400, 'INVALID_QUERY');
      const principal = principalOf(req);
      const list = catalog.readableProjects(principal)
        .filter((pr) => state === 'all' || (state === 'archived' ? pr.archived : !pr.archived))
        .map((pr) => {
          const assoc = catalog.projectAssociations(pr.id);
          return { id: pr.id, name: pr.name, archived: pr.archived, revision: pr.revision, paperCount: assoc.length, importantCount: assoc.filter((a) => a.important).length };
        });
      send(res, req, 200, ok({ state, projects: list }), name);
    },
    'project.papers'(req, res, name, { projectId }) {
      const principal = principalOf(req);
      const pr = catalog.readableProjects(principal).find((x) => x.id === projectId);
      if (!pr) throw NOT_AVAILABLE();
      const rows = catalog.projectAssociations(pr.id).map((a) => {
        const p = catalog.papers.get(a.paperKey);
        return {
          libraryType: p.libraryType, libraryId: p.libraryId, itemKey: p.itemKey,
          title: p.title, creators: p.creators, year: p.year, doi: p.doi,
          readingStatus: p.readingStatus, noteState: p.note ? 'PRESENT' : 'EMPTY', important: a.important,
        };
      });
      send(res, req, 200, ok({ project: { id: pr.id, name: pr.name, archived: pr.archived, revision: pr.revision }, archived: pr.archived, papers: rows }), name);
    },
    'paper.detail'(req, res, name, { libraryType, libraryId, itemKey }) {
      const principal = principalOf(req);
      const pk = paperKey(principal.ownerId, libraryType, libraryId, itemKey);
      const p = catalog.papers.get(pk);
      if (!p) throw NOT_AVAILABLE();
      const readable = new Map(catalog.readableProjects(principal).map((x) => [x.id, x]));
      const associations = catalog.paperAssociations(pk)
        .filter((a) => readable.has(a.projectId))
        .map((a) => ({ projectId: a.projectId, archived: readable.get(a.projectId).archived, important: a.important }));
      send(res, req, 200, ok({
        paper: {
          libraryType: p.libraryType, libraryId: p.libraryId, itemKey: p.itemKey,
          title: p.title, creators: p.creators, year: p.year, doi: p.doi, readingStatus: p.readingStatus, note: p.note,
        },
        associations,
      }), name);
    },
  };

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
    sessions: sessions.control,
    catalog: {
      stateDigest: () => catalog.stateDigest(),
      counts: () => catalog.counts(),
      seedImport: (projectId, tuple) => catalog.seedImport(projectId, tuple),
    },
  };
}
