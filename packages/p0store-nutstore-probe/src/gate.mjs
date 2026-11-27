// P0-STORE Phase 1 - the only network path (A90 §3 Phase 1, §5; DESIGN §2).
//
// Every request must pass this single gate before a socket can exist. The gate enforces the pinned
// HTTPS origin and run-namespace prefix from the frozen plan, the canonical path rules, the verb
// allowlist with per-verb shape checks, the write/delete allowlist from the plan's file manifest,
// conditional-write requirements, the rolling 30-minute budget with 12 pre-reserved cleanup slots,
// the file/size/writer caps, strict TLS verification (system roots or a pinned CA) and the
// credential. Validation happens synchronously before the transport is invoked, so a refused request
// provably produces zero egress; `gate.stats.egress` counts transport invocations for tests.
//
// TEST-ONLY HOOK: `createGate({ ..., transport })` replaces the transport only when
// `allowTestHooks: true` is also supplied. Production callers never pass either. The same hook lets
// tests count sockets and inject canned responses without changing any production decision above it.
import crypto from 'node:crypto';
import fs from 'node:fs';
import https from 'node:https';
import net from 'node:net';
import { Secret } from './secret.mjs';

export const MAX_RESPONSE_BYTES = 4 * 1024 * 1024;
export const DEFAULT_TIMEOUT_MS = 15000;

export class GateRefusal extends Error {
  constructor(code, detail) {
    super(detail === undefined ? code : `${code}: ${detail}`);
    this.name = 'GateRefusal';
    this.code = code;
    this.detail = detail === undefined ? null : detail;
  }
}

export class BudgetRefusal extends Error {
  constructor(code, detail) {
    super(detail === undefined ? code : `${code}: ${detail}`);
    this.name = 'BudgetRefusal';
    this.code = code;
    this.detail = detail === undefined ? null : detail;
  }
}

function refuse(code, detail) {
  throw new GateRefusal(code, detail);
}

function sha256Hex(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function validatorHashPrefix(etag) {
  if (typeof etag !== 'string' || etag.length === 0) return null;
  return sha256Hex(Buffer.from(etag, 'utf8')).slice(0, 12);
}

// Rolling-window budget. `entries` keeps one record per acquisition; pruning uses the injected
// clock so the 30-minute window is testable without waiting. A normal request may never consume one
// of the reserved cleanup slots; a cleanup request may never exceed them.
export class Budget {
  #maxRequests;

  #reservedCleanup;

  #windowMs;

  #clock;

  #entries = [];

  constructor({ maxRequests, reservedCleanup, windowMs, clock = () => Date.now() }) {
    if (!Number.isSafeInteger(maxRequests) || maxRequests < 1) throw new BudgetRefusal('BUDGET_CONFIG_INVALID', 'maxRequests');
    if (!Number.isSafeInteger(reservedCleanup) || reservedCleanup < 0 || reservedCleanup >= maxRequests) {
      throw new BudgetRefusal('BUDGET_CONFIG_INVALID', 'reservedCleanup');
    }
    if (!Number.isSafeInteger(windowMs) || windowMs < 1) throw new BudgetRefusal('BUDGET_CONFIG_INVALID', 'windowMs');
    if (typeof clock !== 'function') throw new BudgetRefusal('BUDGET_CONFIG_INVALID', 'clock');
    this.#maxRequests = maxRequests;
    this.#reservedCleanup = reservedCleanup;
    this.#windowMs = windowMs;
    this.#clock = clock;
  }

  #prune(now) {
    const cutoff = now - this.#windowMs;
    while (this.#entries.length > 0 && this.#entries[0].at <= cutoff) this.#entries.shift();
  }

  #counts() {
    let normal = 0;
    let cleanup = 0;
    for (const entry of this.#entries) {
      if (entry.kind === 'cleanup') cleanup += entry.count;
      else normal += entry.count;
    }
    return { normal, cleanup, total: normal + cleanup };
  }

  get maxRequests() { return this.#maxRequests; }

  get reservedCleanup() { return this.#reservedCleanup; }

  get windowMs() { return this.#windowMs; }

  snapshot() {
    const now = this.#clock();
    this.#prune(now);
    const counts = this.#counts();
    return {
      normal: counts.normal,
      cleanup: counts.cleanup,
      total: counts.total,
      maxRequests: this.#maxRequests,
      reservedCleanup: this.#reservedCleanup,
      nonReservedCeiling: this.#maxRequests - this.#reservedCleanup,
      windowMs: this.#windowMs,
    };
  }

  tryAcquire(kind) {
    if (kind !== 'normal' && kind !== 'cleanup') throw new BudgetRefusal('BUDGET_KIND_INVALID', String(kind));
    const now = this.#clock();
    this.#prune(now);
    const counts = this.#counts();
    const nonReservedCeiling = this.#maxRequests - this.#reservedCleanup;
    if (kind === 'normal') {
      if (counts.normal >= nonReservedCeiling) {
        throw new BudgetRefusal('BUDGET_NORMAL_EXHAUSTED', `${counts.normal}/${nonReservedCeiling} non-reserved requests used`);
      }
      if (counts.total >= this.#maxRequests) {
        throw new BudgetRefusal('BUDGET_TOTAL_EXHAUSTED', `${counts.total}/${this.#maxRequests} requests used`);
      }
    } else {
      if (counts.cleanup >= this.#reservedCleanup) {
        throw new BudgetRefusal('BUDGET_CLEANUP_RESERVE_EXHAUSTED', `${counts.cleanup}/${this.#reservedCleanup} cleanup slots used`);
      }
      if (counts.total >= this.#maxRequests) {
        throw new BudgetRefusal('BUDGET_TOTAL_EXHAUSTED', `${counts.total}/${this.#maxRequests} requests used`);
      }
    }
    this.#entries.push({ at: now, kind, count: 1 });
    return true;
  }

  // Charges a whole two-writer round to the parent up front and returns the per-writer half of it.
  // The parent remains the single budget authority across the two L6 writer processes: the sum of
  // the two writer allowances (2 x floor(tokens/2)) can never exceed what the parent paid for.
  delegate(tokens) {
    if (!Number.isSafeInteger(tokens) || tokens < 1) throw new BudgetRefusal('BUDGET_DELEGATION_INVALID', String(tokens));
    const now = this.#clock();
    this.#prune(now);
    const counts = this.#counts();
    const nonReservedCeiling = this.#maxRequests - this.#reservedCleanup;
    if (counts.normal + tokens > nonReservedCeiling) {
      throw new BudgetRefusal('BUDGET_NORMAL_EXHAUSTED', `${counts.normal}+${tokens} > ${nonReservedCeiling}`);
    }
    if (counts.total + tokens > this.#maxRequests) {
      throw new BudgetRefusal('BUDGET_TOTAL_EXHAUSTED', `${counts.total}+${tokens} > ${this.#maxRequests}`);
    }
    this.#entries.push({ at: now, kind: 'normal', count: tokens });
    // A two-writer round splits the charged allowance evenly; each writer handle enforces its half
    // (floor, so the two handles can never together exceed what the parent was charged).
    let remaining = Math.floor(tokens / 2);
    const total = remaining;
    return Object.freeze({
      maxRequests: total,
      reservedCleanup: 0,
      windowMs: this.#windowMs,
      snapshot: () => ({
        normal: total - remaining,
        cleanup: 0,
        total: total - remaining,
        maxRequests: total,
        reservedCleanup: 0,
        nonReservedCeiling: total,
        windowMs: this.#windowMs,
      }),
      tryAcquire: (kind) => {
        if (kind !== 'normal' && kind !== 'cleanup') throw new BudgetRefusal('BUDGET_KIND_INVALID', String(kind));
        if (remaining <= 0) throw new BudgetRefusal('BUDGET_DELEGATION_EXCEEDED', `${total} delegated requests used`);
        remaining -= 1;
        return true;
      },
    });
  }
}

// Canonical request path. Reasons are deliberately distinct and ordered so every negative has its
// own dedicated code rather than a shared "bad path" or a later count mismatch.
export function canonicalizeRequestPath(rawPath) {
  if (typeof rawPath !== 'string') refuse('PATH_NOT_STRING');
  if (rawPath.length === 0) refuse('PATH_EMPTY');
  if (rawPath.length > 1024) refuse('PATH_TOO_LONG');
  if (/[\u0000-\u001f\u007f-\u009f]/.test(rawPath)) refuse('PATH_CONTROL_BYTE');
  if (rawPath.includes('\\')) refuse('PATH_BACKSLASH');
  if (rawPath.includes('?') || rawPath.includes('#')) refuse('PATH_QUERY_OR_FRAGMENT');
  if (/%25/i.test(rawPath)) refuse('PATH_DOUBLE_ENCODED');
  if (/%2f|%5c/i.test(rawPath)) refuse('PATH_ENCODED_SEPARATOR');
  if (/%2e/i.test(rawPath)) refuse('PATH_ENCODED_DOT');
  if (rawPath.includes('%')) refuse('PATH_BAD_ENCODING');
  if (rawPath.startsWith('//')) refuse('PATH_ABSOLUTE_FORM');
  if (!rawPath.startsWith('/')) refuse('PATH_NOT_ABSOLUTE');
  if (rawPath.includes('//')) refuse('PATH_EMPTY_SEGMENT');
  if (!/^\/[A-Za-z0-9._~/-]*$/.test(rawPath)) refuse('PATH_ILLEGAL_CHAR');
  for (const segment of rawPath.slice(1).split('/')) {
    if (segment === '.' || segment === '..') refuse('PATH_DOT_SEGMENT');
  }
  return rawPath;
}

const REQUEST_KEYS = Object.freeze([
  'method', 'path', 'fileId', 'target', 'body', 'depth', 'ifMatch', 'ifNoneMatch',
  'auth', 'writerId', 'abort', 'timeoutMs', 'cleanup',
]);
function checkConditionalHeader(value, name) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 256) refuse('CONDITION_INVALID', name);
  if (/[\u0000-\u001f\u007f]/.test(value)) refuse('CONDITION_HEADER_INJECTION', name);
  return value;
}

function resolveCa(plan, ca) {
  let material = ca;
  if (material === null || material === undefined) {
    if (plan.pinnedCaFile === null) return undefined;
    try {
      material = fs.readFileSync(plan.pinnedCaFile);
    } catch (error) {
      refuse('GATE_CA_UNREADABLE', error instanceof Error ? error.message : String(error));
    }
  }
  const buffer = Buffer.isBuffer(material) ? material : Buffer.from(String(material), 'utf8');
  if (buffer.length === 0 || !buffer.toString('utf8').includes('BEGIN CERTIFICATE')) {
    refuse('GATE_CA_INVALID');
  }
  return buffer;
}

export function httpsTransport(options) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve({
        status: value.status === undefined ? null : value.status,
        headers: value.headers || {},
        body: value.body || Buffer.alloc(0),
        aborted: value.aborted === true,
        redirect: value.redirect === true,
        error: value.error || null,
        durationMs: Date.now() - startedAt,
      });
    };
    const headers = { ...options.headers };
    const requestOptions = {
      host: options.host,
      port: options.port,
      path: options.path,
      method: options.method,
      headers,
      ca: options.ca === undefined ? undefined : options.ca,
      rejectUnauthorized: true,
      agent: false,
      timeout: options.timeoutMs,
    };
    if (net.isIP(options.host) === 0) requestOptions.servername = options.host;
    let req;
    try {
      req = https.request(requestOptions, (res) => {
        const chunks = [];
        let size = 0;
        res.on('data', (chunk) => {
          size += chunk.length;
          if (size > MAX_RESPONSE_BYTES) {
            req.destroy(Object.assign(new Error('RESPONSE_TOO_LARGE'), { code: 'RESPONSE_TOO_LARGE' }));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => finish({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks),
          aborted: false,
          redirect: res.statusCode >= 300 && res.statusCode < 400,
        }));
        res.on('error', (error) => finish({ aborted: true, error }));
      });
    } catch (error) {
      finish({ error });
      return;
    }
    req.on('timeout', () => {
      req.destroy(Object.assign(new Error('REQUEST_TIMEOUT'), { code: 'REQUEST_TIMEOUT' }));
    });
    req.on('error', (error) => finish({ aborted: options.abortMode !== undefined && options.abortMode !== null, error }));
    if (options.abortMode === 'before-body') {
      req.on('socket', () => {
        req.flushHeaders();
        setImmediate(() => {
          req.destroy(Object.assign(new Error('ABORTED_BEFORE_BODY'), { code: 'ABORTED_BEFORE_BODY' }));
        });
      });
      return;
    }
    if (options.abortMode === 'after-body') {
      req.on('finish', () => {
        setTimeout(() => {
          req.destroy(Object.assign(new Error('ABORTED_AFTER_BODY'), { code: 'ABORTED_AFTER_BODY' }));
        }, options.abortDelayMs || 0);
      });
    }
    if (options.body !== null && options.body !== undefined) req.write(options.body);
    req.end();
  });
}

export function createGate(options = {}) {
  const { plan, secret = null, ca = null } = options;
  if (!plan || typeof plan !== 'object' || !Array.isArray(plan.files) || !Array.isArray(plan.steps)) {
    refuse('GATE_PLAN_REQUIRED');
  }
  if (secret !== null && !(secret instanceof Secret)) refuse('GATE_SECRET_INVALID');
  const allowTestHooks = options.allowTestHooks === true;
  if (options.transport !== undefined && !allowTestHooks) refuse('GATE_TEST_HOOK_NOT_AUTHORIZED', 'transport');
  const transport = options.transport === undefined ? httpsTransport : options.transport;
  if (typeof transport !== 'function') refuse('GATE_TRANSPORT_INVALID');
  const budget = options.budget === undefined
    ? new Budget({
      maxRequests: plan.budget.maxRequests,
      reservedCleanup: plan.budget.reservedCleanup,
      windowMs: plan.budget.windowMs,
    })
    : options.budget;
  if (typeof budget.tryAcquire !== 'function') refuse('GATE_BUDGET_INVALID');
  const caMaterial = resolveCa(plan, ca);

  const pinned = Object.freeze({
    protocol: 'https:',
    host: plan.host,
    port: plan.port,
    prefix: plan.pathPrefix,
    runDirectory: plan.runDirectory,
    probeParent: plan.probeParent,
  });
  const fileById = new Map(plan.files.map((file) => [file.id, file]));
  const fileByPath = new Map(plan.files.map((file) => [plan.pathPrefix + file.name, file]));

  const state = {
    mkcolDone: false,
    created: new Map(), // concrete path -> { fileId, bytes, etag }
    committedBytes: 0,
    writers: new Set(),
  };
  const stats = {
    attempts: 0,
    egress: 0,
    responses: 0,
    refusals: 0,
    aborted: 0,
    redirects: 0,
    bytesSent: 0,
  };

  function pinnedRole(path) {
    if (path === pinned.runDirectory) return 'run-directory';
    if (path === pinned.probeParent) return 'probe-parent';
    if (path.startsWith(pinned.prefix)) return 'file-path';
    refuse('PATH_OUTSIDE_PREFIX', path);
    return null;
  }

  function resolvePath(request) {
    if (request.fileId !== undefined && request.fileId !== null) {
      const file = fileById.get(request.fileId);
      if (!file) refuse('FILE_NOT_IN_PLAN', String(request.fileId));
      const expected = `${pinned.prefix}${file.name}`;
      if (request.path !== undefined && request.path !== null && request.path !== expected) {
        refuse('FILE_PATH_MISMATCH', String(request.path));
      }
      return { path: expected, file, template: file.template, syntheticId: file.id };
    }
    if (request.target !== undefined && request.target !== null) {
      if (request.target === 'run-directory') {
        return { path: pinned.runDirectory, file: null, template: '{run-directory}', syntheticId: 'run-directory' };
      }
      if (request.target === 'probe-parent') {
        return { path: pinned.probeParent, file: null, template: '{probe-parent}', syntheticId: 'probe-parent' };
      }
      refuse('TARGET_INVALID', String(request.target));
    }
    if (typeof request.path !== 'string') refuse('PATH_REQUIRED');
    return { path: request.path, file: fileByPath.get(request.path) || null, template: '{unnamed-path}', syntheticId: null };
  }

  function assertHeaders(request) {
    if (request.ifMatch !== undefined && request.ifMatch !== null) checkConditionalHeader(request.ifMatch, 'If-Match');
    if (request.ifNoneMatch !== undefined && request.ifNoneMatch !== null) checkConditionalHeader(request.ifNoneMatch, 'If-None-Match');
    if (request.writerId !== undefined && request.writerId !== null) {
      if (!Number.isSafeInteger(request.writerId) || request.writerId < 1 || request.writerId > plan.limits.maxWriters) {
        refuse('WRITER_CAP_EXCEEDED', String(request.writerId));
      }
    }
    if (request.abort !== undefined && request.abort !== null) {
      if (request.abort !== 'before-body' && request.abort !== 'after-body') refuse('ABORT_MODE_INVALID', String(request.abort));
      if (request.method !== 'PUT') refuse('ABORT_NOT_ALLOWED', request.method);
    }
    if (request.timeoutMs !== undefined && request.timeoutMs !== null) {
      if (!Number.isSafeInteger(request.timeoutMs) || request.timeoutMs < 100 || request.timeoutMs > 60000) {
        refuse('TIMEOUT_INVALID', String(request.timeoutMs));
      }
    }
    // `cleanup: true` marks a post-abort / L12 cleanup DELETE so it draws from the 12 pre-reserved
    // cleanup slots. A DELETE without the flag is an experiment (for example L7's stale conditional
    // DELETE) and draws from the normal budget like every other experiment request.
    if (request.cleanup !== undefined && request.cleanup !== null) {
      if (request.cleanup !== true) refuse('CLEANUP_FLAG_INVALID', String(request.cleanup));
      if (request.method !== 'DELETE') refuse('CLEANUP_FLAG_INVALID', request.method);
    }
  }

  function assertBody(request, file) {
    if (request.body === null || request.body === undefined) refuse('BODY_REQUIRED', request.method);
    if (!Buffer.isBuffer(request.body)) refuse('BODY_NOT_BUFFER', request.method);
    if (request.body.length === 0) refuse('BODY_EMPTY', request.method);
    if (request.body.length > plan.limits.maxFileBytes) refuse('FILE_SIZE_CAP_EXCEEDED', `${request.body.length} > ${plan.limits.maxFileBytes}`);
    if (file && request.body.length > file.maxBytes) refuse('FILE_PLAN_BYTES_EXCEEDED', `${request.body.length} > ${file.maxBytes}`);
  }

  function assertNoBody(request) {
    if (request.body !== undefined && request.body !== null) refuse('BODY_NOT_ALLOWED', request.method);
  }

  function assertVerbShape(request, resolved) {
    const { method } = request;
    switch (method) {
      case 'PROPFIND': {
        if (request.depth !== '0' && request.depth !== '1') refuse('PROPFIND_DEPTH_INVALID', String(request.depth));
        assertNoBody(request);
        if (request.ifMatch !== undefined && request.ifMatch !== null) refuse('CONDITION_NOT_ALLOWED', 'PROPFIND If-Match');
        if (request.ifNoneMatch !== undefined && request.ifNoneMatch !== null) refuse('CONDITION_NOT_ALLOWED', 'PROPFIND If-None-Match');
        if (resolved.path === pinned.probeParent && request.depth !== '0') refuse('PROPFIND_PARENT_DEPTH_INVALID');
        return;
      }
      case 'GET':
      case 'HEAD': {
        if (request.depth !== undefined && request.depth !== null) refuse('DEPTH_NOT_ALLOWED', method);
        assertNoBody(request);
        if (request.ifMatch !== undefined && request.ifMatch !== null) refuse('CONDITION_NOT_ALLOWED', `${method} If-Match`);
        if (request.ifNoneMatch !== undefined && request.ifNoneMatch !== null) refuse('CONDITION_NOT_ALLOWED', `${method} If-None-Match`);
        if (!resolved.file && resolved.path !== pinned.runDirectory) refuse('FILE_NOT_IN_PLAN', resolved.path);
        return;
      }
      case 'PUT': {
        if (request.fileId === undefined || request.fileId === null) refuse('FILE_ID_REQUIRED', 'PUT');
        if (!resolved.file) refuse('FILE_NOT_IN_PLAN', resolved.path);
        if (request.depth !== undefined && request.depth !== null) refuse('DEPTH_NOT_ALLOWED', 'PUT');
        assertBody(request, resolved.file);
        const hasMatch = request.ifMatch !== undefined && request.ifMatch !== null;
        const hasNoneMatch = request.ifNoneMatch !== undefined && request.ifNoneMatch !== null;
        if (hasMatch && hasNoneMatch) refuse('PUT_MULTIPLE_CONDITIONS');
        if (!hasMatch && !hasNoneMatch) refuse('PUT_CONDITION_REQUIRED');
        return;
      }
      case 'MKCOL': {
        if (request.path !== undefined && request.path !== null && request.path !== pinned.runDirectory) {
          refuse('MKCOL_NOT_RUN_DIRECTORY', String(request.path));
        }
        if (resolved.path !== pinned.runDirectory) refuse('MKCOL_NOT_RUN_DIRECTORY', resolved.path);
        if (state.mkcolDone) refuse('MKCOL_ALREADY_DONE');
        assertNoBody(request);
        if (request.depth !== undefined && request.depth !== null) refuse('DEPTH_NOT_ALLOWED', 'MKCOL');
        if (request.ifMatch !== undefined && request.ifMatch !== null) refuse('CONDITION_NOT_ALLOWED', 'MKCOL If-Match');
        if (request.ifNoneMatch !== undefined && request.ifNoneMatch !== null) refuse('CONDITION_NOT_ALLOWED', 'MKCOL If-None-Match');
        return;
      }
      case 'DELETE': {
        if (resolved.path === pinned.runDirectory || resolved.path === pinned.probeParent || !resolved.file) {
          refuse('DELETE_NOT_PERMITTED_PATH', resolved.path);
        }
        if (request.fileId === undefined || request.fileId === null) refuse('FILE_ID_REQUIRED', 'DELETE');
        if (resolved.path.endsWith('/')) refuse('DELETE_NOT_PERMITTED_PATH', resolved.path);
        if (request.depth !== undefined && request.depth !== null) refuse('DELETE_DEPTH_FORBIDDEN');
        assertNoBody(request);
        if (request.ifMatch === undefined || request.ifMatch === null) refuse('DELETE_CONDITION_REQUIRED');
        if (request.ifNoneMatch !== undefined && request.ifNoneMatch !== null) refuse('CONDITION_NOT_ALLOWED', 'DELETE If-None-Match');
        if (!state.created.has(resolved.path)) refuse('DELETE_UNKNOWN_FILE', resolved.path);
        return;
      }
      case 'OPTIONS': {
        if (resolved.path !== pinned.probeParent && resolved.path !== pinned.runDirectory) {
          refuse('OPTIONS_PATH_INVALID', resolved.path);
        }
        assertNoBody(request);
        if (request.depth !== undefined && request.depth !== null) refuse('DEPTH_NOT_ALLOWED', 'OPTIONS');
        if (request.ifMatch !== undefined && request.ifMatch !== null) refuse('CONDITION_NOT_ALLOWED', 'OPTIONS If-Match');
        if (request.ifNoneMatch !== undefined && request.ifNoneMatch !== null) refuse('CONDITION_NOT_ALLOWED', 'OPTIONS If-None-Match');
        return;
      }
      default:
        refuse('METHOD_NOT_ALLOWED', String(method));
    }
  }

  function assertCaps(request, resolved, method) {
    if (method !== 'PUT') return;
    const already = state.created.has(resolved.path);
    if (!already && state.created.size >= plan.limits.maxFiles) {
      refuse('FILE_CAP_EXCEEDED', `${state.created.size}/${plan.limits.maxFiles}`);
    }
    const previous = already ? state.created.get(resolved.path).bytes : 0;
    if (state.committedBytes - previous + request.body.length > plan.limits.maxTotalBytes) {
      refuse('TOTAL_SIZE_CAP_EXCEEDED', `${state.committedBytes - previous + request.body.length} > ${plan.limits.maxTotalBytes}`);
    }
  }

  function buildHeaders(request) {
    const headers = { 'User-Agent': 'p0store-probe/0.1 (local-mock-only)' };
    if (request.auth !== false) {
      if (!(secret instanceof Secret)) refuse('SECRET_MISSING');
      headers.Authorization = secret.authorizationHeader();
    }
    if (request.depth !== undefined && request.depth !== null) headers.Depth = request.depth;
    if (request.ifMatch !== undefined && request.ifMatch !== null) headers['If-Match'] = request.ifMatch;
    if (request.ifNoneMatch !== undefined && request.ifNoneMatch !== null) headers['If-None-Match'] = request.ifNoneMatch;
    if (request.body !== undefined && request.body !== null) {
      headers['Content-Type'] = 'application/json; charset=utf-8';
      headers['Content-Length'] = String(request.body.length);
    }
    return headers;
  }

  async function request(requestOptions = {}) {
    stats.attempts += 1;
    if (requestOptions === null || typeof requestOptions !== 'object' || Array.isArray(requestOptions)) {
      refuse('REQUEST_NOT_OBJECT');
    }
    try {
      for (const key of Object.keys(requestOptions)) {
        if (!REQUEST_KEYS.includes(key)) refuse('UNKNOWN_REQUEST_FIELD', key);
      }
      const method = requestOptions.method;
      if (typeof method !== 'string' || method !== method.toUpperCase()) refuse('METHOD_INVALID', String(method));
      if (!['PROPFIND', 'GET', 'HEAD', 'PUT', 'OPTIONS', 'MKCOL', 'DELETE'].includes(method)) {
        refuse('METHOD_NOT_ALLOWED', String(method));
      }
      assertHeaders({ ...requestOptions, method });
      const resolved = resolvePath({ ...requestOptions, method });
      const canonical = canonicalizeRequestPath(resolved.path);
      pinnedRole(canonical);
      assertVerbShape({ ...requestOptions, method }, { ...resolved, path: canonical });
      assertCaps(requestOptions, resolved, method);
      const headers = buildHeaders({ ...requestOptions, method });
      const timeoutMs = requestOptions.timeoutMs === undefined || requestOptions.timeoutMs === null
        ? DEFAULT_TIMEOUT_MS
        : requestOptions.timeoutMs;
      const kind = method === 'DELETE' && requestOptions.cleanup === true ? 'cleanup' : 'normal';
      budget.tryAcquire(kind);
      const hostPart = net.isIP(pinned.host) === 6 ? `[${pinned.host}]` : pinned.host;
      const url = new URL(`${pinned.protocol}//${hostPart}:${pinned.port}${canonical}`);
      const urlPort = url.port === '' ? 443 : Number(url.port);
      if (url.protocol !== pinned.protocol || url.hostname !== pinned.host
        || urlPort !== pinned.port || url.pathname !== canonical) {
        refuse('HOST_PIN_MISMATCH', url.origin);
      }
      stats.egress += 1;
      if (requestOptions.body) stats.bytesSent += requestOptions.body.length;
      let result;
      try {
        result = await transport({
          host: pinned.host,
          port: pinned.port,
          path: canonical,
          method,
          headers,
          body: requestOptions.body === undefined ? null : requestOptions.body,
          ca: caMaterial,
          timeoutMs,
          abortMode: requestOptions.abort === undefined ? null : requestOptions.abort,
          abortDelayMs: plan.timing.abortAfterBodyDelayMs,
        });
      } catch (error) {
        result = {
          status: null,
          headers: {},
          body: Buffer.alloc(0),
          aborted: false,
          redirect: false,
          error,
          durationMs: 0,
        };
      }
      stats.responses += 1;
      if (result.aborted) stats.aborted += 1;
      if (result.redirect) stats.redirects += 1;
      const etag = typeof result.headers.etag === 'string' ? result.headers.etag : null;
      if (method === 'MKCOL' && result.status !== null && result.status >= 200 && result.status < 300) {
        state.mkcolDone = true;
      }
      if (method === 'PUT' && result.status !== null && result.status >= 200 && result.status < 300) {
        const previous = state.created.get(canonical);
        if (previous) state.committedBytes -= previous.bytes;
        state.created.set(canonical, { fileId: resolved.file ? resolved.file.id : null, bytes: requestOptions.body.length, etag });
        state.committedBytes += requestOptions.body.length;
      }
      if (method === 'DELETE' && result.status !== null && (result.status === 204 || result.status === 200 || result.status === 404)) {
        const previous = state.created.get(canonical);
        if (previous) {
          state.created.delete(canonical);
          state.committedBytes -= previous.bytes;
        }
      }
      const body = Buffer.isBuffer(result.body) ? result.body : Buffer.alloc(0);
      return {
        method,
        path: canonical,
        pathTemplate: resolved.template,
        syntheticId: resolved.syntheticId,
        status: result.status,
        headers: result.headers,
        etag,
        validatorHashPrefix: validatorHashPrefix(etag),
        body,
        bodySha256: sha256Hex(body),
        bytesSent: requestOptions.body ? requestOptions.body.length : 0,
        aborted: result.aborted === true,
        redirect: result.redirect === true,
        error: result.error || null,
        durationMs: result.durationMs,
        budget: budget.snapshot(),
      };
    } catch (error) {
      stats.refusals += 1;
      throw error;
    }
  }

  return Object.freeze({
    request,
    stats,
    pinned,
    budget,
    registerWriter(writerId) {
      if (!Number.isSafeInteger(writerId) || writerId < 1 || writerId > plan.limits.maxWriters) {
        refuse('WRITER_CAP_EXCEEDED', String(writerId));
      }
      if (state.writers.has(writerId)) refuse('WRITER_ALREADY_REGISTERED', String(writerId));
      if (state.writers.size >= plan.limits.maxWriters) refuse('WRITER_CAP_EXCEEDED', 'concurrent writer cap');
      state.writers.add(writerId);
      return writerId;
    },
    releaseWriter(writerId) {
      state.writers.delete(writerId);
    },
    knownFiles() {
      return [...state.created.entries()].map(([filePath, value]) => ({
        path: filePath,
        fileId: value.fileId,
        bytes: value.bytes,
        etag: value.etag,
      }));
    },
    committedBytes() {
      return state.committedBytes;
    },
    mkcolDone() {
      return state.mkcolDone;
    },
    caPinned() {
      return caMaterial !== undefined;
    },
  });
}
