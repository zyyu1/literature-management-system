// WP-04-R1 global five-field Research Note contract double (D007-A85, LOCAL_SYNTHETIC_ONLY,
// MEMORY_ONLY). Importing this module starts NOTHING. createResearchNoteServer() is inert until
// listen(). 127.0.0.1 with ephemeral port 0 only; fake data only; no persistence; NOT
// production-suitable.
//
// Composition by READ-ONLY import (nothing in WP-01/WP-02/WP-03 is modified):
//   - wp-01 src/store.mjs  -> fake principals, Sessions, revocation/expiry, CSRF primitive, fake clock
//   - wp-01 src/policy.mjs -> limits, path parsing, Denial/OUTCOME, OP_ID_RE, key guard, fingerprint
//   - wp-02 src/catalog.mjs -> canonical paper tuple and frozen-fixture validation gate
// WP-04 has its own model instance (`src/model.mjs`). It does not read or mutate WP-03 state; WP-03
// Project/association/Important/ReadingStatus behaviour is out of scope here.
//
// Routes:
//   GET  /api/v1/health
//   GET  /api/v1/papers/{libraryType}/{libraryId}/{itemKey}/research-note
//   PUT  /api/v1/papers/{libraryType}/{libraryId}/{itemKey}/research-note
//   GET  /api/v1/papers/{libraryType}/{libraryId}/{itemKey}/research-note/export
// No DELETE, PATCH, batch, Project, status, Important, import or provider route exists.
import http from 'node:http';
import { isUtf8 } from 'node:buffer';
import {
  API_VERSION, COOKIE_NAME, LIMITS, LOOPBACK_BIND, SAFE_FETCH_SITES, OUTCOME, OP_ID_RE, Denial,
  hasForbiddenKey, parseTarget,
} from '../../wp-01-synthetic-auth-api/src/policy.mjs';
import { createStore } from '../../wp-01-synthetic-auth-api/src/store.mjs';
import { LIBRARY_TYPES, LIBRARY_ID_RE, ITEM_KEY_RE, NOTE_KEYS } from '../../wp-02-project-paper-read/src/catalog.mjs';
import { parseFrozenFixtures } from './fixtures.mjs';
import { parseStrictJson, StrictJsonError } from './strict-json.mjs';
import { FAULT, RUN_ID_RE, createResearchNoteModel, noteTargetKey } from './model.mjs';
import { buildResearchNoteMarkdown, contentDisposition, exportFilename } from './export.mjs';

const UNSAFE = new Set(['PUT']);
const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);
const ALLOWED_REQUEST_HEADERS = ['content-type', 'x-csrf-token', 'if-match', 'if-none-match'];
const ALLOWED_METHODS = ['GET', 'PUT'];
const ROUTE_FIELDS = Object.freeze(['operationId', 'modelRunId', 'scope', 'fields']);
const UNEXPECTED_CONDITIONAL_HEADERS = Object.freeze(['if-modified-since', 'if-unmodified-since', 'if-range']);
const MAX_FIELD_BYTES = 16 * 1024;
const MAX_TOTAL_FIELD_BYTES = 48 * 1024;

export function createResearchNoteServer(options = {}) {
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
  const model = createResearchNoteModel({ wp01Fixture: wp01, wp02Fixture: wp02 });
  const origins = new Set([wp01.environment.frontendOrigin]);

  const stats = { requests: 0, rejectedOverBudget: 0, responses: 0, denials: 0 };
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

  function sendMarkdown(res, req, status, text, route, extraHeaders = {}) {
    let buf = Buffer.from(text, 'utf8');
    let outStatus = status;
    let headers = { ...extraHeaders };
    if (buf.length > responseBudgetBytes) {
      outStatus = 500;
      headers = {};
      buf = Buffer.from(JSON.stringify(errorBody('RESPONSE_LIMIT')), 'utf8');
    }
    const payloadHeaders = {
      'Content-Type': outStatus === 500 ? 'application/json; charset=utf-8' : 'text/markdown; charset=utf-8',
      'Content-Length': String(buf.length),
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...corsHeaders(req),
      ...headers,
    };
    res.writeHead(outStatus, payloadHeaders);
    res.end(buf);
    stats.responses += 1;
    log(req.method, route, outStatus, outStatus === 500 ? 'RESPONSE_LIMIT' : null);
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
      // DESIGN §3 groups invalid UTF-8 with lone surrogates as 422 INVALID_TEXT for this route.
      if (!isUtf8(raw)) throw new Denial(422, 'INVALID_TEXT');
      try {
        body = parseStrictJson(raw.toString('utf8'));
      } catch (e) {
        // A duplicate five-field key is a schema violation (422) for WP-04, not generic bad JSON.
        if (e instanceof StrictJsonError && e.code === 'DUPLICATE_FIELD') throw new Denial(422, 'DUPLICATE_FIELD');
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
    if (tok === null) throw new Denial(403, 'NOT_AVAILABLE'); // anonymous reads stay neutral
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
    if (k === 5 && s[0] === 'papers' && s[4] === 'research-note') {
      return ['paper.researchNote', { libraryType: s[1], libraryId: s[2], itemKey: s[3] }];
    }
    if (k === 6 && s[0] === 'papers' && s[4] === 'research-note' && s[5] === 'export') {
      return ['paper.researchNote.export', { libraryType: s[1], libraryId: s[2], itemKey: s[3] }];
    }
    return null;
  }

  const METHODS = {
    health: ['GET'],
    'paper.researchNote': ['GET', 'PUT'],
    'paper.researchNote.export': ['GET'],
  };

  function validParams(params) {
    if (params.libraryType !== undefined) {
      if (!LIBRARY_TYPES.has(params.libraryType)) return false;
      if (typeof params.libraryId !== 'string' || !LIBRARY_ID_RE.test(params.libraryId)) return false;
      if (typeof params.itemKey !== 'string' || !ITEM_KEY_RE.test(params.itemKey)) return false;
      if (FORBIDDEN.has(params.libraryId) || FORBIDDEN.has(params.itemKey)) return false;
    }
    return true;
  }

  function validQuery(name, method, query) {
    void name;
    void method;
    return [...query.keys()].length === 0;
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
        stats.denials += 1;
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
  const conflict = (code) => new Denial(409, code, { outcome: OUTCOME.CONFLICT });

  function requireOwner(principal) {
    if (principal.role === 'WORKSPACE_READONLY') throw workspaceReadOnly();
    if (principal.role !== 'OWNER') throw notAvailable();
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

  function validateNoteFields(raw) {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) throw new Denial(422, 'INVALID_FIELDS');
    if (Object.keys(raw).length !== NOTE_KEYS.length) throw new Denial(422, 'INVALID_FIELDS');
    const fields = {};
    let total = 0;
    for (const key of NOTE_KEYS) {
      if (!Object.hasOwn(raw, key)) throw new Denial(422, 'INVALID_FIELDS');
      const value = raw[key];
      if (typeof value !== 'string') throw new Denial(422, 'INVALID_FIELD');
      if (!value.isWellFormed()) throw new Denial(422, 'INVALID_TEXT');
      if (value.includes('\u0000')) throw new Denial(422, 'INVALID_TEXT');
      const bytes = Buffer.byteLength(value, 'utf8');
      if (bytes > MAX_FIELD_BYTES) throw new Denial(413, 'TEXT_TOO_LARGE');
      total += bytes;
      fields[key] = value;
    }
    if (total > MAX_TOTAL_FIELD_BYTES) throw new Denial(413, 'TEXT_TOO_LARGE');
    return fields;
  }

  function parseStrongIfMatch(raw) {
    if (typeof raw !== 'string') return null;
    if (raw === '*' || raw.startsWith('W/') || raw.includes(',')) return null;
    if (raw.length < 3 || raw.length > 130) return null;
    if (raw[0] !== '"' || raw[raw.length - 1] !== '"') return null;
    const inner = raw.slice(1, -1);
    if (inner.length === 0 || !/^[\x21\x23-\x7e\x80-\xff]+$/.test(inner)) return null;
    return raw;
  }

  function checkUnexpectedConditional(req) {
    for (const header of UNEXPECTED_CONDITIONAL_HEADERS) {
      if (req.headers[header] !== undefined) throw new Denial(400, 'UNEXPECTED_CONDITIONAL');
    }
  }

  // Create uses exactly `If-None-Match: *`; update uses exactly one strong quoted opaque tag.
  function preconditionOf(req) {
    const ifNoneMatch = req.headers['if-none-match'];
    const ifMatch = req.headers['if-match'];
    if (ifNoneMatch !== undefined && ifMatch !== undefined) throw new Denial(400, 'UNEXPECTED_CONDITIONAL');
    if (ifNoneMatch !== undefined) {
      if (ifNoneMatch !== '*') throw new Denial(400, 'INVALID_PRECONDITION');
      return { mode: 'create', raw: ifNoneMatch, tag: null };
    }
    if (ifMatch !== undefined) {
      const tag = parseStrongIfMatch(ifMatch);
      if (tag === null) throw new Denial(400, 'INVALID_PRECONDITION');
      return { mode: 'update', raw: ifMatch, tag };
    }
    throw new Denial(428, 'PRECONDITION_REQUIRED', { outcome: OUTCOME.CONFLICT });
  }

  function checkQuarantine(targetKey) {
    if (model.isQuarantined(targetKey)) throw conflict('TARGET_QUARANTINED');
  }

  function fingerprintFor({ principalId, mode, targetKey, scope, fields, precondition }) {
    return model.fingerprintOf({
      fingerprintVersion: 1,
      runId: model.runId,
      principalId,
      route: 'researchNote',
      mode,
      target: targetKey,
      scope: scope === undefined ? null : scope,
      fields,
      precondition: precondition === undefined ? null : precondition,
    });
  }

  function ledgerDecision(principal, operationId, fp) {
    const prior = model.ledgerGet(principal.id, operationId);
    if (!prior) return null;
    if (prior.fingerprint !== fp) throw conflict('OPERATION_ID_REUSE');
    return prior;
  }

  function sendReplay(req, res, name, prior) {
    const body = {
      apiVersion: API_VERSION, operationId: prior.operationId, runId: model.runId,
      outcome: prior.outcome, outcomeBasis: 'MODEL_ONLY', durable: false, saved: false, simulated: true,
      dispatched: false, replayed: true,
      operation: { scope: prior.scope, target: prior.target },
    };
    if (prior.outcome === OUTCOME.CONFIRMED) {
      body.note = prior.resource;
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
    requireOwner(re.principal);
    ctx.revalidate(re.principal);

    const record = {
      operationId: ctx.operationId, principalId: ctx.auth.principal.id, runId: model.runId,
      route: ctx.name, mode: ctx.mode, scope: ctx.scope, targetKey: ctx.targetKey, target: ctx.target,
      payload: { fields: ctx.fields }, precondition: ctx.precondition, fingerprint: ctx.fingerprint,
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
        runId: model.runId, note: resource, revision: resource.revision,
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
        noteStorage: 'MEMORY_ONLY',
        memoryOnly: true,
        durable: false,
        persistence: 'NONE',
        productionSuitable: false,
        r2MutationEnabled: false,
        runId: model.runId,
        fixtureSchemaVersion: wp02.fixtureSchemaVersion,
      }, name);
    },
    'paper.researchNote'(req, res, name, { libraryType, libraryId, itemKey }) {
      const principal = principalOfRead(req);
      const paper = resolvePaper(principal, [libraryType, libraryId, itemKey]);
      const targetKey = noteTargetKey(paper.key);
      const view = model.noteView(paper.key);
      // DESIGN §6: an authorized read of the target resolves an UNKNOWN quarantine.
      model.clearQuarantine(targetKey);
      if (view.exists) {
        return send(res, req, 200, {
          apiVersion: API_VERSION, runId: model.runId, exists: true,
          fields: view.fields, revision: view.revision,
        }, name, null, { ETag: `"${view.revision}"` });
      }
      return send(res, req, 200, {
        apiVersion: API_VERSION, runId: model.runId, exists: false,
      }, name);
    },
    'paper.researchNote.export'(req, res, name, { libraryType, libraryId, itemKey }) {
      const principal = principalOfRead(req);
      // R1 denies export to Workspace with the same neutral 403 as foreign/missing targets.
      if (principal.role !== 'OWNER') throw notAvailable();
      const paper = resolvePaper(principal, [libraryType, libraryId, itemKey]);
      const view = model.noteView(paper.key);
      if (!view.exists) throw new Denial(409, 'NO_SAVED_NOTE', { outcome: OUTCOME.CONFLICT });
      const markdown = buildResearchNoteMarkdown({
        title: paper.title,
        creators: paper.creators,
        year: paper.year,
        doi: paper.doi,
        fields: view.fields,
      });
      const filename = exportFilename(paper.title, paper.itemKey);
      return sendMarkdown(res, req, 200, markdown, name, {
        'Content-Disposition': contentDisposition(filename),
      });
    },
  };
  for (const key of Object.keys(safeHandlers)) {
    const fn = safeHandlers[key];
    safeHandlers[key] = (req, res, name, params, query) => fn(req, res, name, params || {}, query);
  }

  // ---- guarded whole-note write handler ---------------------------------------------------
  const unsafeHandlers = {
    async 'paper.researchNote'(req, res, name, { libraryType, libraryId, itemKey }, { auth, body }) {
      const { principal } = auth;
      requireOwner(principal);
      const paper = resolvePaper(principal, [libraryType, libraryId, itemKey]);
      const b = requireBodyObject(body);
      checkClosed(b, ROUTE_FIELDS);
      const operationId = operationIdOf(b);
      checkModelRun(b);
      if (typeof b.scope !== 'string') throw new Denial(422, 'INVALID_SCOPE');
      const fields = validateNoteFields(b.fields);
      checkUnexpectedConditional(req);
      const pre = preconditionOf(req);
      const target = { libraryType, libraryId, itemKey };
      const targetKey = noteTargetKey(paper.key);
      const fp = fingerprintFor({
        principalId: principal.id, mode: pre.mode, targetKey, scope: b.scope, fields, precondition: pre.raw,
      });
      const prior = ledgerDecision(principal, operationId, fp);
      if (prior) return sendReplay(req, res, name, prior);

      checkScope(b, 'GLOBAL_PAPER');
      checkQuarantine(targetKey);
      if (pre.mode === 'create') {
        if (model.noteRecord(paper.key) !== null) {
          throw new Denial(412, 'NOTE_EXISTS', { outcome: OUTCOME.CONFLICT });
        }
      } else {
        const current = model.noteRecord(paper.key);
        if (current === null) {
          throw new Denial(412, 'STALE_RESOURCE_REVISION', { outcome: OUTCOME.CONFLICT, currentRevision: null });
        }
        if (pre.tag !== `"${current.revision}"`) {
          throw new Denial(412, 'STALE_RESOURCE_REVISION', { outcome: OUTCOME.CONFLICT, currentRevision: current.revision });
        }
      }

      const out = performCommit({
        name, auth, operationId, mode: pre.mode, scope: 'GLOBAL_PAPER', target, targetKey,
        fields, precondition: pre.raw, fingerprint: fp,
        apply: () => model.writeNote(paper.key, fields),
        resourceOf: () => model.noteView(paper.key),
        okStatus: pre.mode === 'create' ? 201 : 200,
        revalidate: (p) => { requireOwner(p); resolvePaper(p, [libraryType, libraryId, itemKey]); },
      });
      return finish(req, res, name, out);
    },
  };

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
      catalogCounts: () => model.catalogCounts(),
      initialNoteTuples: () => model.initialNoteTuples(),
      paper: (tuple) => model.snapshotPaper(tuple),
      note: (tuple) => model.snapshotNote(tuple),
      quarantine: () => model.quarantineSnapshot(),
    },
  };
}
