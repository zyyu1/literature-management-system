// WP-03-R1 guarded routine-write contract double (D007-A65, LOCAL_SYNTHETIC_ONLY, MEMORY_ONLY).
// Importing this module starts NOTHING. createGuardedR1Server() is inert until listen().
// 127.0.0.1 with ephemeral port 0 only; fake data only; no persistence; NOT production-suitable.
//
// Composition by READ-ONLY import (nothing in WP-01/WP-02 is modified):
//   - wp-01 src/store.mjs  -> fake principals, Sessions, revocation/expiry, CSRF primitive, fake clock
//   - wp-01 src/policy.mjs -> limits, path parsing, Denial/OUTCOME, OP_ID_RE, key guard
//   - wp-02 src/catalog.mjs -> canonical paper tuple + frozen-fixture validation gate
// WP-01's fake mutation dispatch and its separate fake Project state are NOT used: this package's
// own model.mjs state is the sole authoritative WP-03 model.
import http from 'node:http';
import { isUtf8 } from 'node:buffer';
import {
  API_VERSION, COOKIE_NAME, LIMITS, LOOPBACK_BIND, SAFE_FETCH_SITES, OUTCOME, OP_ID_RE, Denial,
  hasForbiddenKey, isValidResourceId, parseTarget,
} from '../../wp-01-synthetic-auth-api/src/policy.mjs';
import { createStore } from '../../wp-01-synthetic-auth-api/src/store.mjs';
import { LIBRARY_TYPES, LIBRARY_ID_RE, ITEM_KEY_RE } from '../../wp-02-project-paper-read/src/catalog.mjs';
import { parseFrozenFixtures } from './fixtures.mjs';
import { parseStrictJson, StrictJsonError } from './strict-json.mjs';
import {
  ACTION, ROUTE_ACTIONS, ROUTE_FIELDS, ROUTE_SCOPE, SCOPE, READING_STATUSES,
  checkProjectName, hasUnexpectedConditional, parseCreatePrecondition, parseIfMatch,
} from './contract.mjs';
import {
  FAULT, RUN_ID_RE, associationTargetKey, createGuardedModel, paperTargetKey, projectTargetKey,
} from './model.mjs';

const UNSAFE = new Set(['POST', 'PATCH', 'DELETE', 'PUT']);
const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);
const STATES = new Set(['active', 'archived', 'all']);
const ALLOWED_REQUEST_HEADERS = ['content-type', 'x-csrf-token', 'if-match', 'if-none-match'];
const ALLOWED_METHODS = ['GET', 'POST', 'PATCH', 'DELETE'];

export function createGuardedR1Server(options = {}) {
  const {
    wp01Raw, wp02Raw, host = LOOPBACK_BIND, port = 0,
    requestBudget = LIMITS.maxRequestsPerRun,
    responseBudgetBytes = LIMITS.maxResponseBodyBytes,
    requireFetchMetadata = true,
  } = options;
  if (host !== LOOPBACK_BIND) throw new Error('UNSAFE_CONFIG: bind host must be 127.0.0.1');
  if (port !== 0) throw new Error('UNSAFE_CONFIG: port must be 0 (ephemeral)');
  // Tests may only LOWER the documented ceilings, never raise them.
  if (!Number.isInteger(requestBudget) || requestBudget < 1 || requestBudget > LIMITS.maxRequestsPerRun) {
    throw new Error('UNSAFE_CONFIG: requestBudget must be an integer in 1..5000');
  }
  if (!Number.isInteger(responseBudgetBytes) || responseBudgetBytes < 256 || responseBudgetBytes > LIMITS.maxResponseBodyBytes) {
    throw new Error('UNSAFE_CONFIG: responseBudgetBytes must be an integer in 256..262144');
  }
  if (requireFetchMetadata !== true && requireFetchMetadata !== false) {
    throw new Error('UNSAFE_CONFIG: requireFetchMetadata must be boolean');
  }

  const { wp01, wp02, verified } = parseFrozenFixtures({ wp01Raw, wp02Raw });
  const sessions = createStore(wp01);
  const model = createGuardedModel({ wp01Fixture: wp01, wp02Fixture: wp02 });
  const origins = new Set([wp01.environment.frontendOrigin]);

  const stats = { requests: 0, rejectedOverBudget: 0, responses: 0 };
  const logs = []; // sanitized: route template, status, code only. Never ids/tokens/headers/bodies.
  let gateDelayMs = 0;
  let beforeCommitHook = null;
  let listening = false;

  const log = (method, route, status, code) => logs.push({
    t: sessions.control.nowIso(), method, route, status, code: code || null,
  });

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

  function errorBody(code, extra = {}) {
    return {
      apiVersion: API_VERSION, error: { code }, outcome: OUTCOME.DEFINITE_FAILURE,
      dispatched: false, saved: false, durable: false, simulated: true, ...extra,
    };
  }

  function unknownBody(operationId, errorCode) {
    return {
      apiVersion: API_VERSION, operationId, outcome: OUTCOME.UNKNOWN, outcomeBasis: 'MODEL_ONLY',
      durable: false, saved: false, simulated: true, dispatched: true,
      ...(errorCode ? { error: { code: errorCode } } : {}),
    };
  }

  function send(res, req, status, body, route, code, extraHeaders = {}, opts = {}) {
    let buf = Buffer.from(JSON.stringify(body), 'utf8');
    if (buf.length > responseBudgetBytes) {
      status = 500;
      code = 'RESPONSE_LIMIT';
      extraHeaders = {};
      if (opts.operationId) {
        const compact = unknownBody(opts.operationId, 'RESPONSE_LIMIT');
        if (opts.replayed) {
          compact.outcome = opts.outcome || OUTCOME.UNKNOWN;
          compact.dispatched = false;
          compact.replayed = true;
        }
        buf = Buffer.from(JSON.stringify(compact), 'utf8');
      } else {
        buf = Buffer.from(JSON.stringify(errorBody('RESPONSE_LIMIT')), 'utf8');
      }
    }
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': String(buf.length),
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...(opts.cors === false ? { Vary: 'Origin' } : corsHeaders(req)),
      ...extraHeaders,
    };
    res.writeHead(status, headers);
    res.end(buf);
    stats.responses += 1;
    log(req.method, route, status, code);
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
      let size = 0;
      const chunks = [];
      let done = false;
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

  // Ordered unsafe gate: Origin -> Fetch Metadata -> body/content-type/strict JSON -> Session -> CSRF.
  // Every failure here is pre-dispatch and therefore a definite rejection.
  async function unsafeGate(req) {
    const o = req.headers.origin;
    if (typeof o !== 'string' || !origins.has(o)) throw new Denial(403, 'ORIGIN_DENIED');
    const sfs = req.headers['sec-fetch-site'];
    if (sfs === undefined ? requireFetchMetadata : !SAFE_FETCH_SITES.has(sfs)) {
      throw new Denial(403, 'FETCH_METADATA_DENIED');
    }
    const raw = await readBody(req);
    let body = null;
    if (raw.length > 0) {
      const ct = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      if (ct !== 'application/json') throw new Denial(415, 'UNSUPPORTED_MEDIA_TYPE');
      if (!isUtf8(raw)) throw new Denial(400, 'INVALID_ENCODING');
      try {
        body = parseStrictJson(raw.toString('utf8'));
      } catch (e) {
        if (e instanceof StrictJsonError && e.code === 'DUPLICATE_FIELD') throw new Denial(400, 'DUPLICATE_FIELD');
        throw new Denial(400, 'BAD_JSON');
      }
      if (hasForbiddenKey(body)) throw new Denial(400, 'FORBIDDEN_KEY');
    }
    const tok = readCookie(req);
    if (tok === '\u0000ambiguous') throw new Denial(401, 'SESSION_INVALID');
    const auth = sessions.authenticate(tok);
    sessions.checkCsrf(auth.session, req.headers['x-csrf-token']);
    return { auth, body };
  }

  function principalOfRead(req) {
    const tok = readCookie(req);
    if (tok === null) throw new Denial(403, 'NOT_AVAILABLE'); // anonymous reads stay neutral (WP-02)
    if (tok === '\u0000ambiguous') throw new Denial(401, 'SESSION_INVALID');
    const { principal } = sessions.authenticate(tok);
    if (principal.role !== 'OWNER' && principal.role !== 'WORKSPACE_READONLY') throw new Denial(403, 'NOT_AVAILABLE');
    return principal;
  }

  function route(segs) {
    if (segs[0] !== 'api' || segs[1] !== API_VERSION) return null;
    const s = segs.slice(2);
    const k = s.length;
    if (k === 1 && s[0] === 'health') return ['health', {}];
    if (k === 1 && s[0] === 'projects') return ['projects', {}];
    if (k === 2 && s[0] === 'projects') return ['project', { projectId: s[1] }];
    if (k === 3 && s[0] === 'projects' && s[2] === 'papers') return ['project.papers', { projectId: s[1] }];
    if (k === 6 && s[0] === 'projects' && s[2] === 'papers') {
      return ['project.paper', { projectId: s[1], libraryType: s[3], libraryId: s[4], itemKey: s[5] }];
    }
    if (k === 7 && s[0] === 'projects' && s[2] === 'papers' && s[6] === 'important') {
      return ['project.paper.important', { projectId: s[1], libraryType: s[3], libraryId: s[4], itemKey: s[5] }];
    }
    if (k === 4 && s[0] === 'papers') {
      return ['paper.detail', { libraryType: s[1], libraryId: s[2], itemKey: s[3] }];
    }
    if (k === 5 && s[0] === 'papers' && s[4] === 'reading-status') {
      return ['paper.readingStatus', { libraryType: s[1], libraryId: s[2], itemKey: s[3] }];
    }
    if (k === 5 && s[0] === 'papers' && s[4] === 'unlink-all') {
      return ['paper.unlinkAll', { libraryType: s[1], libraryId: s[2], itemKey: s[3] }];
    }
    return null;
  }

  const METHODS = {
    health: ['GET'],
    projects: ['GET', 'POST'],
    project: ['PATCH', 'DELETE'],
    'project.papers': ['GET'],
    'project.paper': ['DELETE'],
    'project.paper.important': ['PATCH'],
    'paper.detail': ['GET'],
    'paper.readingStatus': ['PATCH'],
    'paper.unlinkAll': ['POST'],
  };

  function validParams(params) {
    if (params.projectId !== undefined) {
      if (FORBIDDEN.has(params.projectId) || !isValidResourceId(params.projectId)) return false;
    }
    if (params.libraryType !== undefined) {
      if (!LIBRARY_TYPES.has(params.libraryType)) return false;
      if (typeof params.libraryId !== 'string' || !LIBRARY_ID_RE.test(params.libraryId)) return false;
      if (typeof params.itemKey !== 'string' || !ITEM_KEY_RE.test(params.itemKey)) return false;
    }
    return true;
  }

  function validQuery(name, method, query) {
    const keys = [...query.keys()];
    if (name === 'projects' && method === 'GET') {
      return keys.every((k) => k === 'state') && query.getAll('state').length <= 1;
    }
    return keys.length === 0;
  }

  async function handle(req, res) {
    stats.requests += 1;
    if (stats.requests > requestBudget) {
      stats.rejectedOverBudget += 1;
      req.resume();
      return send(res, req, 429, errorBody('REQUEST_BUDGET_EXHAUSTED'), 'budget', 'REQUEST_BUDGET_EXHAUSTED', { Connection: 'close' });
    }
    const target = parseTarget(req.url);
    if (!target) { req.resume(); return send(res, req, 400, errorBody('INVALID_PATH'), 'invalid', 'INVALID_PATH'); }
    const r = route(target.segs);
    if (!r) { req.resume(); return send(res, req, 404, errorBody('NO_ROUTE'), 'none', 'NO_ROUTE'); }
    const [name, params] = r;

    if (req.method === 'OPTIONS') { req.resume(); return preflight(req, res, name); }
    // Malformed/forbidden path parameters are rejected before method/query evaluation so a
    // prototype or traversal key can never reach a handler.
    if (!validParams(params)) {
      req.resume();
      return send(res, req, 400, errorBody('INVALID_RESOURCE_ID'), name, 'INVALID_RESOURCE_ID');
    }
    const methods = METHODS[name];
    if (!methods.includes(req.method)) {
      req.resume();
      return send(res, req, 405, errorBody('METHOD_NOT_ALLOWED'), name, 'METHOD_NOT_ALLOWED', { Allow: methods.join(', ') });
    }
    if (!validQuery(name, req.method, target.query)) {
      req.resume();
      return send(res, req, 400, errorBody('INVALID_QUERY'), name, 'INVALID_QUERY');
    }

    try {
      if (UNSAFE.has(req.method)) {
        const gate = await unsafeGate(req);
        if (gateDelayMs > 0) await new Promise((resolve) => { setTimeout(resolve, gateDelayMs); });
        return await unsafeHandlers[name](req, res, name, params, gate);
      }
      req.resume();
      return safeHandlers[name](req, res, name, params, target.query);
    } catch (e) {
      if (e instanceof Denial) {
        stats.denials = (stats.denials || 0) + 1;
        req.resume();
        return send(res, req, e.status, errorBody(e.code, e.extra), name, e.code,
          e.status === 413 ? { Connection: 'close' } : {});
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
    if (!ok) {
      return send(res, req, 403, errorBody('PREFLIGHT_DENIED'), name, 'PREFLIGHT_DENIED', {}, { cors: false });
    }
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

  // ---- shared denial helpers -------------------------------------------------------------
  const notAvailable = () => new Denial(403, 'NOT_AVAILABLE');
  const workspaceReadOnly = () => new Denial(403, 'WORKSPACE_READ_ONLY');
  const stepUpRequired = () => new Denial(403, 'STEP_UP_REQUIRED', { stepUp: 'REQUIRED', mutationEnabled: false });
  const conflict = (code) => new Denial(409, code, { outcome: OUTCOME.CONFLICT });
  const preconditionFailed = (currentRevision) => new Denial(412, 'PRECONDITION_FAILED', {
    outcome: OUTCOME.CONFLICT, currentRevision,
  });

  function requireOwner(principal) {
    if (principal.role === 'WORKSPACE_READONLY') throw workspaceReadOnly();
    if (principal.role !== 'OWNER') throw notAvailable();
  }

  function resolveProject(principal, projectId) {
    const p = model.projectById(projectId);
    if (!p || p.ownerId !== principal.ownerId) throw notAvailable();
    return p;
  }

  function resolvePaper(principal, tuple) {
    const p = model.paperByTuple(principal.ownerId, tuple[0], tuple[1], tuple[2]);
    if (!p) throw notAvailable();
    return p;
  }

  // ---- request-schema helpers ------------------------------------------------------------
  function requireBodyObject(body) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) throw new Denial(400, 'BAD_REQUEST');
    return body;
  }

  function checkClosed(body, allowed) {
    for (const key of Object.keys(body)) {
      if (!allowed.includes(key)) throw new Denial(400, 'UNKNOWN_FIELD');
    }
  }

  function operationIdOf(body) {
    const op = body.operationId;
    if (typeof op !== 'string' || !OP_ID_RE.test(op)) throw new Denial(400, 'INVALID_OPERATION_ID');
    return op;
  }

  function checkModelRun(body) {
    const id = body.modelRunId;
    if (typeof id !== 'string' || !RUN_ID_RE.test(id)) throw new Denial(422, 'INVALID_MODEL_RUN_ID');
    if (id !== model.runId) throw conflict('STALE_MODEL_RUN');
  }

  function checkScope(body, expected) {
    if (typeof body.scope !== 'string') throw new Denial(422, 'INVALID_SCOPE');
    if (body.scope !== expected) throw new Denial(400, 'SCOPE_MISMATCH');
  }

  function checkAction(body, routeKey) {
    const action = body.action;
    if (typeof action !== 'string' || !Object.values(ACTION).includes(action)) throw new Denial(422, 'INVALID_ACTION');
    if (!ROUTE_ACTIONS[routeKey].includes(action)) throw new Denial(422, 'UNSUPPORTED_ACTION');
    return action;
  }

  function checkConditionalHeaders(req, allowed) {
    if (hasUnexpectedConditional(req, allowed)) throw new Denial(400, 'UNEXPECTED_CONDITIONAL');
  }

  function evaluateIfMatch(req, currentRevision) {
    const p = parseIfMatch(req.headers['if-match']);
    if (p.kind === 'missing') throw new Denial(428, 'PRECONDITION_REQUIRED', { outcome: OUTCOME.CONFLICT });
    if (p.kind === 'invalid') throw new Denial(400, 'INVALID_PRECONDITION');
    if (p.tag !== `"${currentRevision}"`) throw preconditionFailed(currentRevision);
  }

  function evaluateCreatePrecondition(req) {
    const p = parseCreatePrecondition(req.headers['if-none-match']);
    if (p.kind === 'missing') throw new Denial(428, 'PRECONDITION_REQUIRED', { outcome: OUTCOME.CONFLICT });
    if (p.kind !== 'star') throw new Denial(400, 'INVALID_PRECONDITION');
  }

  function checkQuarantine(targetKey) {
    if (model.isQuarantined(targetKey)) throw conflict('TARGET_QUARANTINED');
  }

  function payloadFor(routeKey, body) {
    if (routeKey === 'create') {
      return {
        projectId: body.projectId === undefined ? null : body.projectId,
        name: body.name === undefined ? null : body.name,
      };
    }
    if (routeKey === 'project') return { name: body.name === undefined ? null : body.name };
    return { value: body.value === undefined ? null : body.value };
  }

  function fingerprintFor({ principalId, routeKey, scope, action, targetKey, payload, precondition }) {
    return model.fingerprintOf({
      fingerprintVersion: 1,
      runId: model.runId,
      principalId,
      route: routeKey,
      scope: scope === undefined ? null : scope,
      action: action === undefined ? null : action,
      target: targetKey === undefined ? null : targetKey,
      payload,
      precondition: precondition === undefined ? null : precondition,
    });
  }

  function ledgerDecision(principal, operationId, fp) {
    const prior = model.ledgerGet(principal.id, operationId);
    if (!prior) return null;
    if (prior.fingerprint !== fp) throw conflict('OPERATION_ID_REUSE');
    stats.replays += 1;
    return prior;
  }

  function sendReplay(req, res, name, prior) {
    const body = {
      apiVersion: API_VERSION, operationId: prior.operationId, runId: model.runId,
      outcome: prior.outcome, outcomeBasis: 'MODEL_ONLY', durable: false, saved: false, simulated: true,
      dispatched: false, replayed: true,
      operation: { action: prior.action, scope: prior.scope, target: prior.targetKey },
    };
    if (prior.outcome === OUTCOME.CONFIRMED) {
      body.resource = prior.resource;
      body.revision = prior.revision;
    }
    return send(res, req, 200, body, name, 'REPLAY', {}, {
      operationId: prior.operationId, replayed: true, outcome: prior.outcome,
    });
  }

  // ---- one synchronous guarded transition ------------------------------------------------
  // Everything from the Session/authorization revalidation through the ledger write happens with
  // NO await in between: two concurrent writers holding the same revision cannot both commit.
  function performCommit(ctx) {
    const hook = beforeCommitHook;
    beforeCommitHook = null;
    if (typeof hook === 'function') hook(); // TEST-ONLY, synchronous, never reachable over HTTP

    const re = sessions.authenticate(ctx.auth.session.token);
    if (re.principal.id !== ctx.auth.principal.id) throw new Denial(401, 'SESSION_INVALID');
    if (re.principal.role !== 'OWNER') throw new Denial(403, 'NOT_AVAILABLE');
    ctx.revalidate(re.principal);

    const record = {
      operationId: ctx.operationId, principalId: ctx.auth.principal.id, runId: model.runId,
      route: ctx.name, scope: ctx.scope, action: ctx.action, targetKey: ctx.targetKey,
      payload: ctx.payload, precondition: ctx.precondition, fingerprint: ctx.fingerprint,
      outcome: OUTCOME.UNKNOWN, committed: false, revision: null, resource: null,
      httpStatus: 500, fault: null, createdAt: sessions.control.nowIso(),
    };

    const fault = model.takeFault();
    let result;
    try {
      result = model.dispatch(fault, ctx.apply);
    } catch {
      // An unexpected error after dispatch started is NEVER reported as a definite failure.
      record.fault = 'unexpected_error';
      model.ledgerPut(record);
      model.quarantineTarget(ctx.targetKey, ctx.operationId, 'UNEXPECTED_POST_DISPATCH_ERROR');
      stats.unknownOutcomes = (stats.unknownOutcomes || 0) + 1;
      return { status: 500, body: unknownBody(ctx.operationId, 'INTERNAL'), code: 'UNKNOWN', destroy: false, operationId: ctx.operationId };
    }

    if (!result.dispatched) {
      return {
        status: 403,
        body: errorBody('MODEL_REJECTED'),
        code: 'MODEL_REJECTED',
        destroy: false,
        operationId: ctx.operationId,
      };
    }

    record.committed = result.committed;
    record.fault = result.fault;
    if (result.committed) {
      // The simulated model commit really happened. This revision/resource stays internal unless
      // the outcome is CONFIRMED; an UNKNOWN replay never discloses it.
      const committedResource = ctx.resourceOf();
      record.resource = committedResource;
      record.revision = committedResource.revision;
    }
    let outcome = OUTCOME.UNKNOWN;
    let status;
    let code = 'UNKNOWN';
    let destroy = false;
    let body;

    if (result.fault === FAULT.MODEL_ACK) {
      const resource = record.resource;
      outcome = OUTCOME.CONFIRMED;
      status = ctx.okStatus;
      code = 'CONFIRMED';
      body = {
        apiVersion: API_VERSION, operationId: ctx.operationId, outcome, outcomeBasis: 'MODEL_ONLY',
        durable: false, saved: false, simulated: true, dispatched: true, replayed: false,
        runId: model.runId, resource, revision: resource.revision,
      };
    } else if (result.fault === FAULT.ACCEPTED_NOT_COMMITTED) {
      status = 202;
      body = unknownBody(ctx.operationId);
    } else if (result.fault === FAULT.LOST_ACK_AFTER_COMMIT) {
      status = 504;
      body = unknownBody(ctx.operationId);
    } else if (result.fault === FAULT.SOCKET_DROP_AFTER_COMMIT) {
      status = 0;
      destroy = true;
      body = unknownBody(ctx.operationId);
    } else if (result.fault === FAULT.ERROR_AFTER_DISPATCH) {
      status = 500;
      body = unknownBody(ctx.operationId, 'INTERNAL');
    } else {
      throw new Error('unreachable fault state');
    }

    // Response-size failure after a commit is also UNKNOWN, never a fabricated confirmation.
    if (!destroy && Buffer.byteLength(JSON.stringify(body), 'utf8') > responseBudgetBytes) {
      status = 500;
      outcome = OUTCOME.UNKNOWN;
      code = 'RESPONSE_LIMIT';
      body = unknownBody(ctx.operationId, 'RESPONSE_LIMIT');
    }

    record.outcome = outcome;
    record.httpStatus = status;
    model.ledgerPut(record);
    if (outcome === OUTCOME.UNKNOWN) {
      model.quarantineTarget(ctx.targetKey, ctx.operationId, result.fault);
      stats.unknownOutcomes = (stats.unknownOutcomes || 0) + 1;
    }
    return { status, body, code, destroy, operationId: ctx.operationId };
  }

  function finish(req, res, name, out) {
    if (out.destroy) {
      res.destroy();
      log(req.method, name, 0, 'CONNECTION_DROPPED_AFTER_COMMIT');
      return undefined;
    }
    return send(res, req, out.status, out.body, name, out.code, {}, { operationId: out.operationId });
  }

  // ---- safe handlers ---------------------------------------------------------------------
  const safeHandlers = {
    health(req, res, name) {
      send(res, req, 200, {
        apiVersion: API_VERSION,
        mode: 'LOCAL_SYNTHETIC_ONLY',
        provider: 'FAKE_ONLY',
        storage: 'MEMORY_ONLY',
        memoryOnly: true,
        durable: false,
        persistence: 'NONE',
        productionSuitable: false,
        r2MutationEnabled: false,
        runId: model.runId,
        fixtureSchemaVersion: wp02.fixtureSchemaVersion,
      }, name);
    },
    projects(req, res, name, _params, query) {
      const state = query.has('state') ? query.get('state') : 'active';
      if (!STATES.has(state)) throw new Denial(400, 'INVALID_QUERY');
      const principal = principalOfRead(req);
      const projects = model.allProjects()
        .filter((p) => p.ownerId === principal.ownerId)
        .filter((p) => state === 'all' || (state === 'archived' ? p.archived : !p.archived))
        .map((p) => model.projectSummary(p));
      send(res, req, 200, {
        apiVersion: API_VERSION, runId: model.runId, storage: 'MEMORY_ONLY',
        readOnly: false, state, projects,
      }, name);
    },
    'project.papers'(req, res, name, { projectId }) {
      const principal = principalOfRead(req);
      const p = model.projectById(projectId);
      if (!p || p.ownerId !== principal.ownerId) throw notAvailable();
      const papers = model.projectAssociations(p.id).map((a) => model.paperRow(a));
      send(res, req, 200, {
        apiVersion: API_VERSION, runId: model.runId,
        project: model.projectView(p), archived: p.archived, papers,
      }, name);
    },
    'paper.detail'(req, res, name, { libraryType, libraryId, itemKey }) {
      const principal = principalOfRead(req);
      const p = model.paperByTuple(principal.ownerId, libraryType, libraryId, itemKey);
      if (!p) throw notAvailable();
      const readable = new Map(model.allProjects()
        .filter((pr) => pr.ownerId === principal.ownerId)
        .map((pr) => [pr.id, pr]));
      const associations = model.paperAssociations(p.key)
        .filter((a) => readable.has(a.projectId))
        .map((a) => ({
          projectId: a.projectId,
          archived: readable.get(a.projectId).archived,
          important: a.important,
          importantRevision: a.revision,
        }));
      send(res, req, 200, {
        apiVersion: API_VERSION, runId: model.runId,
        paper: { ...model.paperView(p), readingStatusRevision: p.revision },
        associations,
      }, name);
    },
  };
  for (const key of Object.keys(safeHandlers)) {
    const fn = safeHandlers[key];
    safeHandlers[key] = (req, res, name, params, query) => fn(req, res, name, params || {}, query);
  }

  // ---- guarded write handlers ------------------------------------------------------------
  const unsafeHandlers = {
    async projects(req, res, name, _params, { auth, body }) {
      const { principal } = auth;
      requireOwner(principal);
      const b = requireBodyObject(body);
      checkConditionalHeaders(req, ['if-none-match']);
      checkClosed(b, ROUTE_FIELDS.create);
      const operationId = operationIdOf(b);
      checkModelRun(b);
      const payload = payloadFor('create', b);
      const precondition = req.headers['if-none-match'];
      const fp = fingerprintFor({
        principalId: principal.id, routeKey: 'create', scope: b.scope, action: b.action,
        targetKey: null, payload, precondition,
      });
      const prior = ledgerDecision(principal, operationId, fp);
      if (prior) return sendReplay(req, res, name, prior);

      checkScope(b, ROUTE_SCOPE.create);
      const action = checkAction(b, 'create');
      if (typeof b.projectId !== 'string' || FORBIDDEN.has(b.projectId) || !isValidResourceId(b.projectId)) {
        throw new Denial(422, 'INVALID_PROJECT_ID');
      }
      const nameCheck = checkProjectName(b.name);
      if (!nameCheck.ok) throw new Denial(422, nameCheck.code);
      evaluateCreatePrecondition(req);
      const existing = model.projectById(b.projectId);
      if (existing) throw new Denial(412, 'PROJECT_EXISTS', { outcome: OUTCOME.CONFLICT });
      const targetKey = projectTargetKey(b.projectId);
      checkQuarantine(targetKey);

      let created = null;
      const out = performCommit({
        name, auth, operationId, scope: SCOPE.PROJECT, action, payload, precondition, fingerprint: fp, targetKey,
        apply: () => {
          created = model.addProject({ projectId: b.projectId, ownerId: principal.ownerId, name: b.name });
          return created;
        },
        resourceOf: () => model.projectResource(created),
        okStatus: 201,
        revalidate: (p) => { requireOwner(p); },
      });
      return finish(req, res, name, out);
    },

    async project(req, res, name, { projectId }, { auth, body }) {
      if (req.method === 'DELETE') return r2(req, res, name, auth, () => {
        resolveProject(auth.principal, projectId);
        requireOwner(auth.principal);
      });
      const { principal } = auth;
      const project = resolveProject(principal, projectId);
      requireOwner(principal);
      const b = requireBodyObject(body);
      checkConditionalHeaders(req, ['if-match']);
      checkClosed(b, ROUTE_FIELDS.project);
      const operationId = operationIdOf(b);
      checkModelRun(b);
      const payload = payloadFor('project', b);
      const precondition = req.headers['if-match'];
      const targetKey = projectTargetKey(projectId);
      const fp = fingerprintFor({
        principalId: principal.id, routeKey: 'project', scope: b.scope, action: b.action,
        targetKey, payload, precondition,
      });
      const prior = ledgerDecision(principal, operationId, fp);
      if (prior) return sendReplay(req, res, name, prior);

      checkScope(b, ROUTE_SCOPE.project);
      const action = checkAction(b, 'project');
      if (action === ACTION.RENAME) {
        if (b.name === undefined) throw new Denial(422, 'INVALID_NAME');
        const nameCheck = checkProjectName(b.name);
        if (!nameCheck.ok) throw new Denial(422, nameCheck.code);
      } else if (b.name !== undefined) {
        throw new Denial(400, 'UNKNOWN_FIELD');
      }
      checkQuarantine(targetKey);
      evaluateIfMatch(req, project.revision);
      if (action === ACTION.ARCHIVE && project.archived) throw conflict('INVALID_TRANSITION');
      if (action === ACTION.RESTORE && !project.archived) throw conflict('INVALID_TRANSITION');

      let updated = project;
      const out = performCommit({
        name, auth, operationId, scope: SCOPE.PROJECT, action, payload, precondition, fingerprint: fp, targetKey,
        apply: () => {
          updated = action === ACTION.RENAME
            ? model.renameProject(project, b.name)
            : model.setProjectArchived(project, action === ACTION.ARCHIVE);
          return updated;
        },
        resourceOf: () => model.projectResource(updated),
        okStatus: 200,
        revalidate: (p) => { resolveProject(p, projectId); requireOwner(p); },
      });
      return finish(req, res, name, out);
    },

    async 'paper.readingStatus'(req, res, name, { libraryType, libraryId, itemKey }, { auth, body }) {
      const { principal } = auth;
      const paper = resolvePaper(principal, [libraryType, libraryId, itemKey]);
      requireOwner(principal);
      const b = requireBodyObject(body);
      checkConditionalHeaders(req, ['if-match']);
      checkClosed(b, ROUTE_FIELDS.readingStatus);
      const operationId = operationIdOf(b);
      checkModelRun(b);
      const payload = payloadFor('readingStatus', b);
      const precondition = req.headers['if-match'];
      const targetKey = paperTargetKey(paper.key);
      const fp = fingerprintFor({
        principalId: principal.id, routeKey: 'readingStatus', scope: b.scope, action: b.action,
        targetKey, payload, precondition,
      });
      const prior = ledgerDecision(principal, operationId, fp);
      if (prior) return sendReplay(req, res, name, prior);

      checkScope(b, ROUTE_SCOPE.readingStatus);
      const action = checkAction(b, 'readingStatus');
      if (typeof b.value !== 'string' || !READING_STATUSES.includes(b.value)) throw new Denial(422, 'INVALID_VALUE');
      checkQuarantine(targetKey);
      evaluateIfMatch(req, paper.revision);

      let updated = paper;
      const out = performCommit({
        name, auth, operationId, scope: SCOPE.GLOBAL_PAPER, action, payload, precondition, fingerprint: fp, targetKey,
        apply: () => { updated = model.setReadingStatus(paper, b.value); return updated; },
        resourceOf: () => model.paperResource(updated),
        okStatus: 200,
        revalidate: (p) => { resolvePaper(p, [libraryType, libraryId, itemKey]); requireOwner(p); },
      });
      return finish(req, res, name, out);
    },

    async 'project.paper.important'(req, res, name, { projectId, libraryType, libraryId, itemKey }, { auth, body }) {
      const { principal } = auth;
      const project = resolveProject(principal, projectId);
      const paper = resolvePaper(principal, [libraryType, libraryId, itemKey]);
      const association = model.associationOf(projectId, paper.key);
      if (!association) throw notAvailable();
      requireOwner(principal);
      const b = requireBodyObject(body);
      checkConditionalHeaders(req, ['if-match']);
      checkClosed(b, ROUTE_FIELDS.important);
      const operationId = operationIdOf(b);
      checkModelRun(b);
      const payload = payloadFor('important', b);
      const precondition = req.headers['if-match'];
      const targetKey = associationTargetKey(projectId, paper.key);
      const fp = fingerprintFor({
        principalId: principal.id, routeKey: 'important', scope: b.scope, action: b.action,
        targetKey, payload, precondition,
      });
      const prior = ledgerDecision(principal, operationId, fp);
      if (prior) return sendReplay(req, res, name, prior);

      checkScope(b, ROUTE_SCOPE.important);
      const action = checkAction(b, 'important');
      if (typeof b.value !== 'boolean') throw new Denial(422, 'INVALID_VALUE');
      checkQuarantine(targetKey);
      evaluateIfMatch(req, association.revision);
      if (project.archived) throw conflict('PROJECT_ARCHIVED');

      let updated = association;
      const out = performCommit({
        name, auth, operationId, scope: SCOPE.PROJECT_ASSOCIATION, action, payload, precondition, fingerprint: fp, targetKey,
        apply: () => { updated = model.setImportant(association, b.value); return updated; },
        resourceOf: () => model.associationResource(updated),
        okStatus: 200,
        revalidate: (p) => {
          resolveProject(p, projectId);
          resolvePaper(p, [libraryType, libraryId, itemKey]);
          if (!model.associationOf(projectId, paper.key)) throw notAvailable();
          requireOwner(p);
        },
      });
      return finish(req, res, name, out);
    },

    async 'project.paper'(req, res, name, { projectId, libraryType, libraryId, itemKey }, { auth }) {
      return r2(req, res, name, auth, () => {
        resolveProject(auth.principal, projectId);
        const paper = resolvePaper(auth.principal, [libraryType, libraryId, itemKey]);
        if (!model.associationOf(projectId, paper.key)) throw notAvailable();
        requireOwner(auth.principal);
      });
    },

    async 'paper.unlinkAll'(req, res, name, { libraryType, libraryId, itemKey }, { auth }) {
      return r2(req, res, name, auth, () => {
        resolvePaper(auth.principal, [libraryType, libraryId, itemKey]);
        requireOwner(auth.principal);
      });
    },
  };

  // R2 is negative-only in R1: after auth/scope validation a valid Owner target is told to step up
  // and NOTHING is dispatched, deleted, unlinked, recorded or enabled. Body fields are ignored.
  function r2(req, res, name, auth, authorize) {
    authorize();
    void auth;
    void req;
    void res;
    void name;
    throw stepUpRequired();
  }

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
    fixtures: verified,
    control: {
      runId: () => model.runId,
      tokenFor: (fixtureSessionId) => sessions.control.tokenFor(fixtureSessionId),
      issueFreshSession: (principalId) => sessions.control.issueFreshSession(principalId),
      revokeByCookie: (cookieValue) => sessions.control.revokeByCookie(cookieValue),
      revokeFixtureSession: (fixtureSessionId) => sessions.control.revokeFixtureSession(fixtureSessionId),
      advanceClock: (ms) => sessions.control.advanceClock(ms),
      nowIso: () => sessions.control.nowIso(),
      setNextFault: (fault) => model.setNextFault(fault),
      setGateDelayMs: (ms) => {
        if (!Number.isInteger(ms) || ms < 0 || ms > 5000) throw new Error('gate delay must be an integer 0..5000');
        gateDelayMs = ms;
      },
      beforeCommit: (fn) => {
        if (fn !== null && typeof fn !== 'function') throw new Error('beforeCommit requires a function or null');
        beforeCommitHook = fn;
      },
      snapshot: () => model.snapshot(),
      stateDigest: () => model.stateDigest(),
      ledgerDigest: () => model.ledgerDigest(),
      ledgerSize: () => model.ledgerSize(),
      stats: () => model.stats(),
      project: (id) => model.snapshotProject(id),
      paper: (tuple) => model.snapshotPaper(tuple),
      association: (projectId, tuple) => {
        const pk = model.paperByTuple(tuple[0], tuple[1], tuple[2], tuple[3]);
        return pk ? model.snapshotAssociation(projectId, pk.key) : null;
      },
      quarantine: () => model.quarantineSnapshot(),
    },
  };
}
