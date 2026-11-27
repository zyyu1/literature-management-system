// P0-STORE Phase 1 - strict frozen-plan loader (A90 §4, DESIGN §2).
//
// The run plan is the frozen, closed-schema description of the L0-L12 experiments: exact step ids,
// methods, synthetic target ids, expected oracle names, request estimates, the pinned host/port/path
// prefix, the file manifest (which is also the only write/delete allowlist), the rolling budget, the
// self-imposed caps and the timing schedule. Every field is validated; unknown/missing fields, extra,
// duplicate, missing or reordered steps, forbidden verbs, budgets above the A90 §2/§4 ceilings and
// non-loopback hosts in test mode are rejected with a dedicated reason code. No network, no I/O
// beyond reading the plan file.
import fs from 'node:fs';
import net from 'node:net';

export const PLAN_SCHEMA_VERSION = 1;
export const BUDGET_WINDOW_MS = 1800000;
export const MAX_REQUESTS = 100;
export const MIN_RESERVED_CLEANUP = 12;
export const MAX_FILES = 20;
export const MAX_FILE_BYTES = 1048576;
export const MAX_TOTAL_BYTES = 20971520;
export const MAX_WRITERS = 2;

export const STEP_IDS = Object.freeze([
  'L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10', 'L11', 'L12',
]);

// Frozen step semantics. `oracle` names the exact A90 §4 pass oracle; `methods` is the complete set
// of verbs the step may use; `maxRequests` is the A90 §4 estimate (or one above it where the row
// distinguishes a network request from a local refusal).
export const STEP_SPEC = Object.freeze({
  L0: Object.freeze({ oracle: 'L0_TLS_AUTH', methods: Object.freeze(['OPTIONS', 'PROPFIND']), maxRequests: 3 }),
  L1: Object.freeze({ oracle: 'L1_MKCOL_SHAPE', methods: Object.freeze(['MKCOL', 'PROPFIND']), maxRequests: 2 }),
  L2: Object.freeze({ oracle: 'L2_CREATE_ONLY', methods: Object.freeze(['PUT', 'GET', 'PROPFIND']), maxRequests: 4 }),
  L3: Object.freeze({ oracle: 'L3_ETAG_CONSISTENCY', methods: Object.freeze(['PUT', 'GET', 'PROPFIND', 'HEAD']), maxRequests: 7 }),
  L4: Object.freeze({ oracle: 'L4_IDENTICAL_REWRITE', methods: Object.freeze(['PUT', 'GET']), maxRequests: 3 }),
  L5: Object.freeze({ oracle: 'L5_CONDITIONAL_UPDATE', methods: Object.freeze(['PUT', 'GET', 'PROPFIND']), maxRequests: 5 }),
  L6: Object.freeze({ oracle: 'L6_CROSS_PROCESS_RACE', methods: Object.freeze(['GET', 'PUT']), maxRequests: 25 }),
  L7: Object.freeze({ oracle: 'L7_INVALID_AND_STALE', methods: Object.freeze(['PUT', 'DELETE', 'GET']), maxRequests: 5 }),
  L8: Object.freeze({ oracle: 'L8_LATE_ACK', methods: Object.freeze(['PUT', 'GET', 'PROPFIND']), maxRequests: 9 }),
  L9: Object.freeze({ oracle: 'L9_ERROR_SEMANTICS', methods: Object.freeze(['PUT', 'GET']), maxRequests: 4 }),
  L10: Object.freeze({ oracle: 'L10_MULTI_PARTIAL', methods: Object.freeze(['PUT', 'GET', 'PROPFIND']), maxRequests: 6 }),
  L11: Object.freeze({ oracle: 'L11_BACKUP_HASHES', methods: Object.freeze(['GET', 'PUT']), maxRequests: 8 }),
  L12: Object.freeze({ oracle: 'L12_CLEANUP', methods: Object.freeze(['DELETE', 'PROPFIND']), maxRequests: 8 }),
});

export const ALLOWED_VERBS = Object.freeze(['PROPFIND', 'GET', 'HEAD', 'PUT', 'OPTIONS', 'MKCOL', 'DELETE']);
export const FORBIDDEN_VERBS = Object.freeze(['PATCH', 'POST', 'TRACE', 'CONNECT']);
export const LOOPBACK_HOSTS = Object.freeze(['127.0.0.1', '::1', 'localhost']);

const PLAN_KEYS = Object.freeze([
  'schemaVersion', 'planId', 'mode', 'protocol', 'host', 'port', 'runId', 'probeParent',
  'pathPrefix', 'runDirectory', 'credentialEnvVar', 'pinnedCaFile', 'accessApprovalId',
  'budget', 'limits', 'timing', 'files', 'steps',
]);
const BUDGET_KEYS = Object.freeze(['maxRequests', 'reservedCleanup', 'windowMs']);
const LIMIT_KEYS = Object.freeze(['maxFiles', 'maxFileBytes', 'maxTotalBytes', 'maxWriters']);
const TIMING_KEYS = Object.freeze(['readAfterWriteMs', 'abortAfterBodyDelayMs']);
const FILE_KEYS = Object.freeze(['id', 'name', 'maxBytes', 'template']);
const STEP_KEYS = Object.freeze(['id', 'methods', 'target', 'oracle', 'requests', 'cleanupRequests']);

const RUN_ID_RE = /^[A-Za-z0-9][A-Za-z0-9-]{2,63}$/;
const PLAN_ID_RE = /^[a-z0-9][a-z0-9-]{2,63}$/;
const TARGET_RE = /^[a-z0-9][a-z0-9-]{2,63}$/;
const ENV_RE = /^[A-Z][A-Z0-9_]{2,63}$/;
const APPROVAL_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{7,127}$/;
const FILE_ID_RE = /^[A-Z][A-Z0-9]{1,15}$/;
const SAFE_PATH_RE = /^\/[A-Za-z0-9._~/-]*$/;
const SAFE_NAME_RE = /^(?:[A-Za-z0-9._~-]+\/)?[A-Za-z0-9._~-]+$/;
const HOSTNAME_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$/;

export class PlanError extends Error {
  constructor(code, detail) {
    super(detail === undefined ? code : `${code}: ${detail}`);
    this.name = 'PlanError';
    this.code = code;
    this.detail = detail === undefined ? null : detail;
  }
}

function fail(code, detail) {
  throw new PlanError(code, detail);
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function closedObject(value, keys, where) {
  if (!isPlainObject(value)) fail('PLAN_NOT_OBJECT', where);
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) fail('UNKNOWN_FIELD', `${where}.${key}`);
  }
  for (const key of keys) {
    if (!Object.hasOwn(value, key)) fail('MISSING_FIELD', `${where}.${key}`);
  }
}

function requireInteger(value, min, max, code, where) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    fail(code, `${where}=${String(value)}`);
  }
  return value;
}

function isLoopbackHost(host) {
  return LOOPBACK_HOSTS.includes(host);
}

// Canonical absolute HTTP path used for pinning. Plan paths may never contain percent-encoding,
// backslashes, control bytes, empty, dot or dot-dot segments, query/fragment characters or
// non-allowlisted characters. The gate applies the same rules to every live request path.
export function assertPlanPath(value, code, where) {
  if (typeof value !== 'string' || value.length === 0) fail(code, `${where} is not a non-empty string`);
  if (value.length > 512) fail(code, `${where} is longer than 512 bytes`);
  if (!value.startsWith('/')) fail(code, `${where} is not absolute`);
  if (!SAFE_PATH_RE.test(value)) fail(code, `${where} has a forbidden character`);
  if (value.includes('//')) fail(code, `${where} has an empty segment`);
  for (const segment of value.slice(1).split('/')) {
    if (segment === '') continue;
    if (segment === '.' || segment === '..') fail(code, `${where} has a dot segment`);
  }
  return value;
}

// Renders a trace path template: only {runId} and {fileId} placeholders are recognised, and the
// rendered result must equal the concrete path. This keeps trace lines free of concrete identifiers.
export function renderPathTemplate(template, runId, fileId) {
  return template.split('{runId}').join(runId).split('{fileId}').join(fileId);
}

function validateHost(value, allowNonLoopback) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 253) fail('INVALID_HOST', 'host');
  const host = value.toLowerCase();
  if (host !== value) fail('INVALID_HOST', 'host must be lower-case');
  if (net.isIP(host) === 0 && !HOSTNAME_RE.test(host)) fail('INVALID_HOST', 'host is not an IP or hostname');
  if (!isLoopbackHost(host) && allowNonLoopback !== true) fail('NON_LOOPBACK_HOST', host);
  return host;
}

function validateBudget(budget) {
  closedObject(budget, BUDGET_KEYS, 'budget');
  requireInteger(budget.maxRequests, 1, 100, 'BUDGET_MAX_OVER_CAP', 'budget.maxRequests');
  if (budget.maxRequests > MAX_REQUESTS) fail('BUDGET_MAX_OVER_CAP', String(budget.maxRequests));
  if (!Number.isSafeInteger(budget.reservedCleanup) || budget.reservedCleanup < MIN_RESERVED_CLEANUP) {
    fail('BUDGET_CLEANUP_RESERVE_MISSING', String(budget.reservedCleanup));
  }
  if (budget.reservedCleanup >= budget.maxRequests) {
    fail('BUDGET_CLEANUP_RESERVE_MISSING', 'reserved cleanup slots leave no normal request budget');
  }
  if (budget.windowMs !== BUDGET_WINDOW_MS) fail('BUDGET_WINDOW_INVALID', String(budget.windowMs));
}

function validateLimits(limits) {
  closedObject(limits, LIMIT_KEYS, 'limits');
  requireInteger(limits.maxFiles, 1, MAX_FILES, 'FILE_CAP_OVER', 'limits.maxFiles');
  requireInteger(limits.maxFileBytes, 1, MAX_FILE_BYTES, 'FILE_SIZE_CAP_OVER', 'limits.maxFileBytes');
  requireInteger(limits.maxTotalBytes, 1, MAX_TOTAL_BYTES, 'TOTAL_SIZE_CAP_OVER', 'limits.maxTotalBytes');
  requireInteger(limits.maxWriters, 1, MAX_WRITERS, 'WRITER_CAP_OVER', 'limits.maxWriters');
}

function validateTiming(timing) {
  closedObject(timing, TIMING_KEYS, 'timing');
  const { readAfterWriteMs, abortAfterBodyDelayMs } = timing;
  if (!Array.isArray(readAfterWriteMs) || readAfterWriteMs.length !== 3) {
    fail('INVALID_READ_AFTER_WRITE', 'timing.readAfterWriteMs must be three integers');
  }
  readAfterWriteMs.forEach((value, index) => {
    requireInteger(value, 0, 60000, 'INVALID_READ_AFTER_WRITE', `timing.readAfterWriteMs[${index}]`);
    if (index === 0 && value !== 0) fail('INVALID_READ_AFTER_WRITE', 'the first read-after-write probe must be immediate (0 ms)');
    if (index > 0 && value <= readAfterWriteMs[index - 1]) {
      fail('INVALID_READ_AFTER_WRITE', 'read-after-write probes must be strictly increasing');
    }
  });
  requireInteger(abortAfterBodyDelayMs, 0, 5000, 'INVALID_ABORT_DELAY', 'timing.abortAfterBodyDelayMs');
}

function validateFiles(files, plan) {
  if (!Array.isArray(files)) fail('INVALID_FILES', 'files must be an array');
  if (files.length > plan.limits.maxFiles) fail('FILE_CAP_OVER', `${files.length} > ${plan.limits.maxFiles}`);
  const ids = new Set();
  const names = new Set();
  let total = 0;
  files.forEach((file, index) => {
    const where = `files[${index}]`;
    closedObject(file, FILE_KEYS, where);
    if (typeof file.id !== 'string' || !FILE_ID_RE.test(file.id)) fail('FILE_DUPLICATE_ID', `${where}.id`);
    if (ids.has(file.id)) fail('FILE_DUPLICATE_ID', file.id);
    ids.add(file.id);
    if (typeof file.name !== 'string' || !SAFE_NAME_RE.test(file.name) || file.name.includes('..') || file.name.startsWith('/')) {
      fail('FILE_INVALID_NAME', `${where}.name`);
    }
    if (file.name.length > 256) fail('FILE_INVALID_NAME', 'name is longer than 256 bytes');
    for (const segment of file.name.split('/')) {
      if (segment === '' || segment === '.' || segment === '..') fail('FILE_INVALID_NAME', file.name);
    }
    if (names.has(file.name)) fail('FILE_DUPLICATE_NAME', file.name);
    names.add(file.name);
    requireInteger(file.maxBytes, 1, plan.limits.maxFileBytes, 'FILE_SIZE_CAP_OVER', `${where}.maxBytes`);
    if (typeof file.template !== 'string' || file.template.length === 0 || file.template.length > 512) {
      fail('FILE_INVALID_TEMPLATE', `${where}.template`);
    }
    if (!file.template.includes('{runId}') || !file.template.includes('{fileId}')) {
      fail('FILE_INVALID_TEMPLATE', `${where}.template must contain {runId} and {fileId}`);
    }
    const rendered = renderPathTemplate(file.template, plan.runId, file.id);
    assertPlanPath(rendered, 'FILE_INVALID_TEMPLATE', `${where}.template`);
    if (rendered !== plan.pathPrefix + file.name) {
      fail('FILE_TEMPLATE_MISMATCH', `${where}.template renders ${rendered}`);
    }
    total += file.maxBytes;
  });
  if (total > plan.limits.maxTotalBytes) fail('TOTAL_SIZE_CAP_OVER', `${total} > ${plan.limits.maxTotalBytes}`);
}

function validateSteps(steps) {
  if (!Array.isArray(steps)) fail('STEPS_NOT_ARRAY', 'steps');
  const rawIds = [];
  for (const [index, step] of steps.entries()) {
    if (!isPlainObject(step)) fail('STEP_NOT_OBJECT', `steps[${index}]`);
    if (typeof step.id !== 'string') fail('STEP_ID_INVALID', `steps[${index}].id`);
    rawIds.push(step.id);
  }
  for (const id of rawIds) {
    if (!STEP_IDS.includes(id)) fail('STEP_EXTRA', id);
  }
  const seen = new Set();
  for (const id of rawIds) {
    if (seen.has(id)) fail('STEP_DUPLICATE', id);
    seen.add(id);
  }
  for (const id of STEP_IDS) {
    if (!seen.has(id)) fail('STEP_MISSING', id);
  }
  rawIds.forEach((id, index) => {
    if (id !== STEP_IDS[index]) fail('STEP_ORDER', `steps[${index}] is ${id}, expected ${STEP_IDS[index]}`);
  });
  if (rawIds.length !== STEP_IDS.length) fail('STEP_COUNT', String(rawIds.length));

  steps.forEach((step, index) => {
    const where = `steps[${index}]`;
    const id = step.id;
    closedObject(step, STEP_KEYS, where);
    const spec = STEP_SPEC[id];
    if (!Array.isArray(step.methods) || step.methods.length === 0) fail('STEP_METHODS', `${where}.methods`);
    const methods = new Set();
    for (const method of step.methods) {
      if (typeof method !== 'string' || method !== method.toUpperCase()) fail('STEP_METHODS', `${where}.methods`);
      if (FORBIDDEN_VERBS.includes(method) || !ALLOWED_VERBS.includes(method)) fail('FORBIDDEN_VERB', method);
      if (!spec.methods.includes(method)) fail('STEP_METHOD_NOT_ALLOWED', `${id}:${method}`);
      if (methods.has(method)) fail('STEP_METHODS', `${where}.methods duplicate ${method}`);
      methods.add(method);
    }
    if (step.oracle !== spec.oracle) fail('STEP_ORACLE_MISMATCH', `${id}:${String(step.oracle)}`);
    if (typeof step.target !== 'string' || !TARGET_RE.test(step.target)) fail('STEP_TARGET_INVALID', `${where}.target`);
    requireInteger(step.requests, 1, 1000, 'STEP_REQUESTS_INVALID', `${id}:${String(step.requests)}`);
    requireInteger(step.cleanupRequests, 0, step.requests, 'STEP_CLEANUP_INVALID', `${where}.cleanupRequests`);
    if (step.cleanupRequests > 0 && !methods.has('DELETE')) {
      fail('STEP_CLEANUP_WITHOUT_DELETE', `${id}: cleanup requests require the DELETE verb`);
    }
  });
}

export function planTotals(plan) {
  let requests = 0;
  let cleanupRequests = 0;
  for (const step of plan.steps) {
    requests += step.requests;
    cleanupRequests += step.cleanupRequests;
  }
  return {
    requests,
    cleanupRequests,
    normalRequests: requests - cleanupRequests,
    nonReservedCeiling: plan.budget.maxRequests - plan.budget.reservedCleanup,
  };
}

function deepFreeze(value) {
  if (Array.isArray(value)) {
    for (const item of value) deepFreeze(item);
    Object.freeze(value);
    return value;
  }
  if (value !== null && typeof value === 'object') {
    for (const key of Object.keys(value)) deepFreeze(value[key]);
    Object.freeze(value);
  }
  return value;
}

// Validates a parsed plan object. `allowNonLoopback` is false in Phase 1 test/mock mode, so a plan
// naming anything other than 127.0.0.1 / ::1 / localhost is always rejected before a gate exists.
export function validatePlan(value, options = {}) {
  const allowNonLoopback = options.allowNonLoopback === true;
  closedObject(value, PLAN_KEYS, 'plan');
  if (value.schemaVersion !== PLAN_SCHEMA_VERSION) fail('UNSUPPORTED_SCHEMA_VERSION', String(value.schemaVersion));
  if (typeof value.planId !== 'string' || !PLAN_ID_RE.test(value.planId)) fail('INVALID_PLAN_ID', String(value.planId));
  if (value.mode !== 'local-mock' && value.mode !== 'live') fail('INVALID_MODE', String(value.mode));
  if (value.protocol !== 'https:') fail('NON_HTTPS_PLAN', String(value.protocol));
  const host = validateHost(value.host, allowNonLoopback);
  requireInteger(value.port, 1, 65535, 'INVALID_PORT', 'port');
  if (typeof value.runId !== 'string' || !RUN_ID_RE.test(value.runId)) fail('INVALID_RUN_ID', String(value.runId));
  assertPlanPath(value.probeParent, 'INVALID_PROBE_PARENT', 'probeParent');
  if (!value.probeParent.endsWith('/') || value.probeParent === '/') {
    fail('INVALID_PROBE_PARENT', 'probeParent must be a non-root collection path ending in /');
  }
  if (typeof value.pathPrefix !== 'string') fail('INVALID_PATH_PREFIX', 'pathPrefix');
  if (typeof value.runDirectory !== 'string') fail('INVALID_RUN_DIRECTORY', 'runDirectory');
  if (value.pathPrefix !== `${value.probeParent}${value.runId}/`) {
    fail('PATH_PREFIX_MISMATCH', value.pathPrefix);
  }
  if (value.runDirectory !== `${value.probeParent}${value.runId}`) {
    fail('RUN_DIRECTORY_MISMATCH', value.runDirectory);
  }
  assertPlanPath(value.pathPrefix, 'INVALID_PATH_PREFIX', 'pathPrefix');
  assertPlanPath(value.runDirectory, 'INVALID_RUN_DIRECTORY', 'runDirectory');
  if (!value.pathPrefix.endsWith('/')) fail('INVALID_PATH_PREFIX', 'pathPrefix must end in /');
  if (typeof value.credentialEnvVar !== 'string' || !ENV_RE.test(value.credentialEnvVar)) {
    fail('INVALID_CREDENTIAL_ENV', String(value.credentialEnvVar));
  }
  if (value.pinnedCaFile !== null && (typeof value.pinnedCaFile !== 'string' || value.pinnedCaFile.length === 0)) {
    fail('INVALID_PINNED_CA_FILE', String(value.pinnedCaFile));
  }
  if (value.accessApprovalId !== null
    && (typeof value.accessApprovalId !== 'string' || !APPROVAL_RE.test(value.accessApprovalId))) {
    fail('INVALID_ACCESS_APPROVAL_ID', String(value.accessApprovalId));
  }
  validateBudget(value.budget);
  validateLimits(value.limits);
  validateTiming(value.timing);
  validateFiles(value.files, value);
  validateSteps(value.steps);

  const totals = planTotals(value);
  if (totals.requests >= MAX_REQUESTS) fail('BUDGET_PLANNED_AT_CAP', String(totals.requests));
  if (totals.normalRequests > totals.nonReservedCeiling) {
    fail('BUDGET_PLANNED_OVER_NONRESERVED', `${totals.normalRequests} > ${totals.nonReservedCeiling}`);
  }
  if (totals.cleanupRequests > value.budget.reservedCleanup) {
    fail('BUDGET_PLANNED_OVER_CLEANUP_RESERVE', `${totals.cleanupRequests} > ${value.budget.reservedCleanup}`);
  }
  for (const step of value.steps) {
    if (step.requests > STEP_SPEC[step.id].maxRequests) {
      fail('STEP_REQUEST_OVER', `${step.id}:${step.requests}`);
    }
  }

  const normalized = structuredClone(value);
  normalized.host = host;
  return deepFreeze(normalized);
}

export function parsePlanJson(text, options = {}) {
  if (typeof text !== 'string') fail('PLAN_JSON_INVALID', 'plan text must be a string');
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    fail('PLAN_JSON_INVALID', error instanceof Error ? error.message : String(error));
  }
  return validatePlan(parsed, options);
}

export function loadPlanFile(filePath, options = {}) {
  let text;
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) fail('PLAN_FILE_NOT_FILE', filePath);
    if (stat.size > 128 * 1024) fail('PLAN_FILE_TOO_LARGE', String(stat.size));
    text = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    if (error instanceof PlanError) throw error;
    fail('PLAN_FILE_UNREADABLE', error instanceof Error ? error.message : String(error));
  }
  return parsePlanJson(text, options);
}

export { isLoopbackHost };
