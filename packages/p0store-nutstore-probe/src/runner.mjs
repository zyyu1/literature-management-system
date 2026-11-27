// P0-STORE Phase 1 runner, plus the R3 live-readiness authorization path. L6 is a real cross-process
// race: two separate OS child processes are spawned per round, synchronised by files in a private
// temp directory, and both PIDs are recorded. L8 sends the body and destroys the socket, then resolves
// the outcome only by authoritative GET/PROPFIND; it never retries. Live mode is reachable only when
// all seven R3 checks pass before any secret read, gate, socket or child; there is no build-time
// waiver, environment opt-in or self-authorization in the committed plan.
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  loadPlanFile, validatePlan, planTotals,
  LIVE_HOST, LIVE_PORT, LIVE_PROBE_PARENT, LIVE_PATH_PREFIX_TEMPLATE,
  LIVE_RUN_DIRECTORY_TEMPLATE, LIVE_CREDENTIAL_ENV,
} from './plan.mjs';
import { createGate, Budget, GateRefusal, BudgetRefusal } from './gate.mjs';
import { loadSecret, loadCredentialUser } from './secret.mjs';
import { createTrace } from './trace.mjs';
import { evaluateStep, isNoGo, NO_GO_REASONS } from './oracle.mjs';
import { computeVerdict } from './verdict.mjs';

export const PHASE1_LOCAL_MOCK_ONLY = 'LOCAL_MOCK_ONLY';
export const PHASE3_LIVE_READINESS = 'P0_STORE_PHASE3_LIVE_READINESS';
// Legacy compatibility export for the frozen harness. R3 live gating no longer consults this constant;
// the seven run-time checks below replace it.
export const PHASE1_LIVE_ENABLED = false;
export const RACE_ROUNDS = 5;
export const LATE_ACK_ROUNDS = 3;
export const DEFAULT_BARRIER_TIMEOUT_MS = 20000;
const LIVE_APPROVAL_RE = /^P0STORE-ACCESS-02-\d{8}-[A-Za-z0-9]{4,16}$/;
const SELF_PATH = fileURLToPath(import.meta.url);

const TLS_ERROR_CODES = new Set([
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'CERT_HAS_EXPIRED',
  'CERT_NOT_YET_VALID',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'CERT_UNTRUSTED',
  'ERR_INVALID_CA',
]);

function sha256Hex(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function sleep(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

function syntheticBody(fileId, experiment, variant) {
  return Buffer.from(`${JSON.stringify({
    synthetic: true,
    localMockOnly: true,
    fileId,
    experiment,
    variant,
    note: 'P0-STORE synthetic probe fixture; fake ids only',
  })}\n`, 'utf8');
}

function is2xx(status) {
  return Number.isInteger(status) && status >= 200 && status < 300;
}

function isTlsError(error) {
  if (!error) return false;
  const code = typeof error.code === 'string' ? error.code : '';
  if (TLS_ERROR_CODES.has(code) || code.startsWith('ERR_TLS')) return true;
  const message = typeof error.message === 'string' ? error.message : '';
  return /certificate|self[- ]signed|altname|issuer|handshake/i.test(message);
}

// R3 live authorization. Every check is ordered exactly as the binding handoff requires, and none of
// checks 1-4 may touch the credential environment: the value is read only at check 5. The function is
// pure and is called before any secret load, gate, socket or child process exists.
export function authorizeLiveRun({
  plan, live, accessApprovalId = null, env = process.env,
  runtime = { version: process.version, arch: process.arch },
}) {
  if (live !== true) return { ok: false, reason: 'LIVE_FLAG_REQUIRED' };
  if (!plan || plan.mode !== 'live') return { ok: false, reason: 'LIVE_PLAN_MODE_REQUIRED' };
  if (plan.protocol !== 'https:') return { ok: false, reason: 'LIVE_PROTOCOL_MISMATCH' };
  if (plan.host !== LIVE_HOST) return { ok: false, reason: 'LIVE_HOST_MISMATCH' };
  if (plan.port !== LIVE_PORT) return { ok: false, reason: 'LIVE_PORT_MISMATCH' };
  if (plan.probeParent !== LIVE_PROBE_PARENT) return { ok: false, reason: 'LIVE_PROBE_PARENT_MISMATCH' };
  if (plan.pathPrefix !== LIVE_PATH_PREFIX_TEMPLATE) return { ok: false, reason: 'LIVE_PATH_PREFIX_MISMATCH' };
  if (plan.runDirectory !== LIVE_RUN_DIRECTORY_TEMPLATE) return { ok: false, reason: 'LIVE_RUN_DIRECTORY_MISMATCH' };
  if (plan.pinnedCaFile !== null) return { ok: false, reason: 'LIVE_PINNED_CA_FORBIDDEN' };
  if (plan.credentialEnvVar !== LIVE_CREDENTIAL_ENV) return { ok: false, reason: 'LIVE_CREDENTIAL_ENV_MISMATCH' };
  if (plan.accessApprovalId !== null) return { ok: false, reason: 'LIVE_PLAN_SELF_AUTHORIZED' };

  if (accessApprovalId === null || accessApprovalId === undefined) {
    return { ok: false, reason: 'LIVE_APPROVAL_REQUIRED' };
  }
  if (typeof accessApprovalId !== 'string' || !LIVE_APPROVAL_RE.test(accessApprovalId)) {
    return { ok: false, reason: 'LIVE_APPROVAL_INVALID' };
  }
  if (plan.runId !== null) return { ok: false, reason: 'LIVE_RUN_ID_SUPPLIED' };

  // R4: validate the user name immediately before the password. This is the first credential
  // environment read; the password is not touched when the user is missing or malformed.
  let user;
  try {
    user = loadCredentialUser(plan, env);
  } catch (error) {
    return { ok: false, reason: error && error.code ? error.code : 'CREDENTIAL_USER_MALFORMED' };
  }

  // Check 5 is the first and only place the password value may be read.
  const value = env === null || typeof env !== 'object' ? undefined : env[plan.credentialEnvVar];
  if (typeof value !== 'string' || value.length === 0) {
    return { ok: false, reason: 'LIVE_CREDENTIAL_MISSING' };
  }

  // Check 6: exact runtime pin; `runtime` is test-stubbable, never environment-selectable.
  if (runtime === null || typeof runtime !== 'object'
    || runtime.version !== 'v22.23.5' || runtime.arch !== 'x64') {
    return { ok: false, reason: 'NODE_RUNTIME_MISMATCH' };
  }
  return { ok: true, reason: null, user };
}

function resolveLivePlan(plan, runId) {
  const resolved = structuredClone(plan);
  resolved.runId = runId;
  resolved.pathPrefix = plan.pathPrefix.split('{runId}').join(runId);
  resolved.runDirectory = plan.runDirectory.split('{runId}').join(runId);
  return resolved;
}

function buildPreflight(plan, runId, approvalId, runtime, user) {
  return {
    host: plan.host,
    port: plan.port,
    pathPrefix: plan.pathPrefix,
    runId,
    approvalId,
    // Personal data never appears here; only a redacted label and the character count.
    user: '<redacted>',
    userChars: user.length,
    budget: {
      maxRequests: plan.budget.maxRequests,
      reservedCleanup: plan.budget.reservedCleanup,
      windowMs: plan.budget.windowMs,
    },
    limits: {
      maxFiles: plan.limits.maxFiles,
      maxFileBytes: plan.limits.maxFileBytes,
      maxTotalBytes: plan.limits.maxTotalBytes,
      maxWriters: plan.limits.maxWriters,
    },
    node: runtime.version,
    arch: runtime.arch,
  };
}

function formatPreflight(preflight) {
  return [
    'P0STORE_PREFLIGHT',
    `host=${preflight.host}`,
    `port=${preflight.port}`,
    `prefix=${preflight.pathPrefix}`,
    `runId=${preflight.runId}`,
    `approvalId=${preflight.approvalId}`,
    `user=<redacted, ${preflight.userChars} chars>`,
    `budget.maxRequests=${preflight.budget.maxRequests}`,
    `budget.reservedCleanup=${preflight.budget.reservedCleanup}`,
    `limits.maxFiles=${preflight.limits.maxFiles}`,
    `limits.maxFileBytes=${preflight.limits.maxFileBytes}`,
    `limits.maxTotalBytes=${preflight.limits.maxTotalBytes}`,
    `limits.maxWriters=${preflight.limits.maxWriters}`,
    `node=${preflight.node}`,
    `arch=${preflight.arch}`,
  ].join(' ');
}

function refusal(error) {
  const code = error && typeof error.code === 'string' ? error.code : 'REFUSED';
  const message = error instanceof Error ? error.message : String(error);
  return {
    ok: false,
    refused: true,
    code,
    message,
    planId: null,
    verdict: null,
    stop: null,
    steps: [],
    cleanup: [],
    quarantine: [],
    gateStats: null,
    budget: null,
    trace: [],
    runId: null,
    preflight: null,
  };
}

function parseHrefs(xml) {
  const hrefs = [];
  const pattern = /<[A-Za-z0-9]*:?href>([^<]*)<\/[A-Za-z0-9]*:?href>/g;
  let match = pattern.exec(xml);
  while (match !== null) {
    hrefs.push(match[1]);
    match = pattern.exec(xml);
  }
  return hrefs;
}

// WebDAV Depth:1 includes the collection itself; the experiment's "namespace empty" oracle counts
// only children, so the run-directory self href is removed explicitly.
function childHrefs(hrefs, runDirectory) {
  const self = runDirectory.endsWith('/') ? runDirectory : `${runDirectory}/`;
  return hrefs.filter((href) => href !== runDirectory && href !== self);
}

// A PROPFIND validator is carried in the multistatus body (`<D:getetag>`), not as a response header
// on real servers. Parse the first one and unescape the XML text before comparing it with PUT/GET.
function parsePropfindEtag(xml) {
  const match = /<(?:[A-Za-z0-9]*:)?getetag>([^<]*)<\/(?:[A-Za-z0-9]*:)?getetag>/i.exec(xml);
  if (!match) return null;
  return match[1]
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

export async function runProbe(options = {}) {
  const live = options.live === true;
  const env = options.env === undefined ? process.env : options.env;
  const traceFilePath = options.traceFilePath === undefined ? null : options.traceFilePath;
  const accessApprovalId = options.accessApprovalId === undefined ? null : options.accessApprovalId;
  const ca = options.ca === undefined ? null : options.ca;
  const transport = options.transport;
  const allowTestHooks = options.allowTestHooks === true;
  const runtime = options.runtime === undefined
    ? { version: process.version, arch: process.arch }
    : {
      version: options.runtime === null || typeof options.runtime !== 'object' ? undefined : options.runtime.version,
      arch: options.runtime === null || typeof options.runtime !== 'object' ? undefined : options.runtime.arch,
    };

  let plan;
  try {
    plan = validatePlan(options.plan, { allowNonLoopback: live });
  } catch (error) {
    return refusal(error);
  }

  // A live plan without --live is refused, and a local-mock plan with --live is refused, before the
  // credential is read. All seven R3 checks plus the R4 user check live in authorizeLiveRun.
  let liveUser = null;
  if (plan.mode === 'live' || live) {
    const authorization = authorizeLiveRun({
      plan, live, accessApprovalId, env, runtime,
    });
    if (!authorization.ok) {
      return { ...refusal(Object.assign(new Error(authorization.reason), { code: authorization.reason })), planId: plan.planId };
    }
    liveUser = authorization.user;
  }

  let runId = null;
  let preflight = null;
  if (plan.mode === 'live') {
    runId = crypto.randomBytes(16).toString('hex');
    plan = resolveLivePlan(plan, runId);
    preflight = buildPreflight(plan, runId, accessApprovalId, runtime, liveUser);
    if (typeof options.onPreflight === 'function') options.onPreflight(formatPreflight(preflight));
  }

  let secret;
  try {
    secret = loadSecret(plan, env, plan.mode === 'live' ? liveUser : undefined);
  } catch (error) {
    return { ...refusal(error), planId: plan.planId };
  }

  let gate;
  try {
    gate = createGate({ plan, secret, ca, transport, allowTestHooks });
  } catch (error) {
    return { ...refusal(error), planId: plan.planId };
  }

  const trace = createTrace({ filePath: traceFilePath, secret });
  const tracePhase = plan.mode === 'live'
    ? `${PHASE3_LIVE_READINESS} approval=${accessApprovalId}`
    : PHASE1_LOCAL_MOCK_ONLY;
  trace.record({ type: 'run', planId: plan.planId, mode: live ? 'live' : 'local-mock', phase: tracePhase });
  // The L6 writer children inherit the environment, so an explicit env object passed to runProbe is
  // merged over the current process environment for them. The credential is never written to a file.
  const childEnv = { ...process.env, ...(env !== null && typeof env === 'object' ? env : {}) };
  delete childEnv.NODE_TEST_CONTEXT;

  const ctx = {
    plan,
    gate,
    trace,
    secret,
    ca,
    live,
    skipCleanup: false,
    files: new Map(plan.files.map((file) => [file.id, {
      id: file.id,
      name: file.name,
      path: `${plan.pathPrefix}${file.name}`,
      template: file.template,
      created: false,
      certain: true,
      etag: null,
      body: null,
      sha256: null,
    }])),
    current: null, // authoritative state of file XFA (body, etag, sha256)
    previous: null,
    staleEtag: null,
    stop: null,
    seq: 0,
    steps: [],
    cleanup: [],
    quarantine: [],
    cleanupAttempted: false,
    raceRounds: null,
  };

  function stop(rule, stepId, detail = null) {
    if (ctx.stop !== null) return;
    ctx.stop = { rule, step: stepId, detail };
    trace.record({ type: 'stop', rule, step: stepId === null ? undefined : stepId, detail: detail === undefined ? undefined : detail });
  }

  function recordRequest(stepId, result) {
    ctx.seq += 1;
    const status = Number.isInteger(result.status) ? result.status : null;
    trace.record({
      type: 'request',
      step: stepId,
      seq: ctx.seq,
      method: result.method,
      pathTemplate: result.pathTemplate,
      syntheticId: result.syntheticId === null ? undefined : result.syntheticId,
      status,
      validatorHashPrefix: result.validatorHashPrefix,
      bodySha256: status === null ? null : result.bodySha256,
      bytesSent: result.bytesSent,
      aborted: result.aborted,
      redirect: result.redirect,
      durationMs: result.durationMs,
      budget: {
        normal: result.budget.normal,
        cleanup: result.budget.cleanup,
        total: result.budget.total,
        maxRequests: result.budget.maxRequests,
        reservedCleanup: result.budget.reservedCleanup,
        nonReservedCeiling: result.budget.nonReservedCeiling,
      },
    });
  }

  function classify(stepId, result, expectedStatuses) {
    if (ctx.stop !== null) return;
    // Intentional socket destruction (L8, L10) surfaces as a transport error; it is a recorded
    // experiment outcome, never a STOP, and the caller resolves it by authoritative read.
    if (result.aborted === true) return;
    if (result.redirect) {
      stop('REDIRECT', stepId);
      return;
    }
    if (result.error) {
      stop(isTlsError(result.error) ? 'TLS_OR_HOST' : 'SERVER_ERROR', stepId,
        typeof result.error.code === 'string' ? result.error.code : null);
      return;
    }
    // R4 live authentication failure: the first 401/403 ends the run immediately, with the existing
    // rule name (no UNEXPECTED_403 rule exists) and no cleanup request. This check precedes the
    // expected-status allowance because L0 intentionally probes unauthenticated 401s.
    if (ctx.live === true && (result.status === 401 || result.status === 403)) {
      ctx.skipCleanup = true;
      stop('UNEXPECTED_401', stepId);
      return;
    }
    if (expectedStatuses.includes(result.status)) return;
    if (result.status === 401) { stop('UNEXPECTED_401', stepId); return; }
    if (result.status === 429) { stop('THROTTLE', stepId); return; }
    if (Number.isInteger(result.status) && result.status >= 500) { stop('SERVER_ERROR', stepId); return; }
  }

  async function send(stepId, request, expectedStatuses = []) {
    let result;
    try {
      result = await gate.request(request);
    } catch (error) {
      if (error instanceof GateRefusal) {
        trace.record({
          type: 'refusal',
          step: stepId,
          method: String(request.method),
          code: error.code,
        });
      }
      throw error;
    }
    recordRequest(stepId, result);
    classify(stepId, result, expectedStatuses);
    return result;
  }

  function updateFileState(fileId, result, body, { certain = true } = {}) {
    const file = ctx.files.get(fileId);
    if (fileId === 'XFA') ctx.previous = ctx.current;
    file.created = true;
    file.etag = result.etag;
    file.body = body;
    file.sha256 = sha256Hex(body);
    file.certain = file.certain && certain;
    if (fileId === 'XFA') {
      ctx.current = { body, etag: result.etag, sha256: file.sha256, certain: file.certain };
      if (ctx.staleEtag === null && result.etag !== null) ctx.staleEtag = result.etag;
    }
  }

  async function executeStep(stepId, fn) {
    const startedAt = Date.now();
    let observation = null;
    try {
      observation = await fn();
    } catch (error) {
      if (error instanceof GateRefusal || error instanceof BudgetRefusal) {
        stop('LOCAL_REFUSAL', stepId, error.code);
      } else {
        throw error;
      }
    }
    const durationMs = Date.now() - startedAt;
    if (ctx.stop !== null && observation === null) {
      ctx.steps.push({
        step: stepId,
        status: 'UNRESOLVABLE',
        reason: `STOP_${ctx.stop.rule}`,
        anomalies: [],
        evidence: { stopped: true, durationMs },
      });
      trace.record({
        type: 'step', step: stepId, status: 'UNRESOLVABLE', reason: `STOP_${ctx.stop.rule}`,
      });
      return;
    }
    const result = evaluateStep(stepId, observation);
    result.evidence = { ...result.evidence, durationMs };
    ctx.steps.push(result);
    trace.record({
      type: 'step',
      step: stepId,
      status: result.status,
      reason: result.reason === null ? undefined : result.reason,
      anomalies: result.anomalies,
    });
    if (isNoGo(result)) {
      stop(result.reason === NO_GO_REASONS.CREATE_OVERWRITE ? 'CREATE_OVERWRITE' : 'LOST_UPDATE', stepId, result.reason);
    }
  }

  // ---- L0: TLS/host identity and unauthenticated behaviour --------------------------------
  async function stepL0() {
    const options = await send('L0', { method: 'OPTIONS', target: 'probe-parent', auth: false }, [401]);
    if (ctx.stop) return null;
    const unauth = await send('L0', { method: 'PROPFIND', target: 'probe-parent', depth: '0', auth: false }, [401]);
    if (ctx.stop) return null;
    const auth = await send('L0', { method: 'PROPFIND', target: 'probe-parent', depth: '0' }, [207]);
    if (ctx.stop) return null;
    return {
      optionsUnauth: { status: options.status, dav: options.headers.dav || null, redirect: options.redirect },
      propfindUnauth: { status: unauth.status, redirect: unauth.redirect },
      propfindAuth: { status: auth.status, dav: auth.headers.dav || null, redirect: auth.redirect },
      tlsError: false,
    };
  }

  // ---- L1: MKCOL run directory and PROPFIND shape ----------------------------------------
  async function stepL1() {
    const mkcol = await send('L1', { method: 'MKCOL', target: 'run-directory' }, [201, 200]);
    if (ctx.stop) return null;
    const propfind = await send('L1', { method: 'PROPFIND', target: 'run-directory', depth: '1' }, [207]);
    if (ctx.stop) return null;
    const body = propfind.body.toString('utf8');
    const hrefs = parseHrefs(body);
    const shape = {
      collection: /<[A-Za-z0-9]*:?collection\b/.test(body),
      resourcetype: /<[A-Za-z0-9]*:?resourcetype\b/.test(body),
      getlastmodified: /<[A-Za-z0-9]*:?getlastmodified\b/.test(body),
    };
    return {
      mkcol: { status: mkcol.status, redirect: mkcol.redirect },
      propfind: { status: propfind.status, collection: shape.collection, shape, hrefs: hrefs.length, redirect: propfind.redirect },
    };
  }

  // ---- L2: S-CREATE ----------------------------------------------------------------------
  async function stepL2() {
    const body1 = syntheticBody('XFA', 'S-CREATE', 'first');
    const body2 = syntheticBody('XFA', 'S-CREATE', 'second');
    const create1 = await send('L2', { method: 'PUT', fileId: 'XFA', ifNoneMatch: '*', body: body1 }, [201, 200]);
    if (ctx.stop) return null;
    if (is2xx(create1.status)) updateFileState('XFA', create1, body1);
    const create2 = await send('L2', { method: 'PUT', fileId: 'XFA', ifNoneMatch: '*', body: body2 }, [412, 409]);
    if (ctx.stop) return null;
    if (is2xx(create2.status)) {
      // A server that overwrote on create-only is a NO-GO; record the overwriting state so the
      // abort cleanup can still delete the acknowledged (overwritten) object.
      updateFileState('XFA', create2, body2);
    }
    const get = await send('L2', { method: 'GET', fileId: 'XFA' }, [200, 404]);
    const propfind = await send('L2', { method: 'PROPFIND', fileId: 'XFA', depth: '0' }, [207, 404]);
    const propfindEtag = propfind.etag !== null ? propfind.etag : parsePropfindEtag(propfind.body.toString('utf8'));
    return {
      create1: { status: create1.status, etag: create1.etag, redirect: create1.redirect },
      create2: { status: create2.status, redirect: create2.redirect },
      get: { status: get.status, bodySha256: get.bodySha256, etag: get.etag, redirect: get.redirect },
      propfind: { status: propfind.status, etag: propfindEtag },
      firstBodySha256: sha256Hex(body1),
      secondBodySha256: sha256Hex(body2),
      preBodySha256: null,
    };
  }

  // ---- L3: S-ETAG ------------------------------------------------------------------------
  async function stepL3() {
    if (!ctx.current || ctx.current.etag === null) {
      return { missingPrerequisite: 'XFA' };
    }
    const body = syntheticBody('XFA', 'S-ETAG', 'update');
    const put = await send('L3', { method: 'PUT', fileId: 'XFA', ifMatch: ctx.current.etag, body }, [200, 201, 204]);
    if (ctx.stop) return null;
    if (!is2xx(put.status)) {
      return { put: { status: put.status, etag: put.etag, redirect: put.redirect }, reads: [] };
    }
    updateFileState('XFA', put, body);
    const reads = [];
    const t0 = Date.now();
    for (const delay of plan.timing.readAfterWriteMs) {
      const wait = delay - (Date.now() - t0);
      if (wait > 0) await sleep(wait);
      const read = await send('L3', { method: 'GET', fileId: 'XFA' }, [200]);
      if (ctx.stop) return null;
      reads.push({ atMs: Date.now() - t0, status: read.status, etag: read.etag, bodySha256: read.bodySha256 });
    }
    const propfind = await send('L3', { method: 'PROPFIND', fileId: 'XFA', depth: '0' }, [207]);
    const head = await send('L3', { method: 'HEAD', fileId: 'XFA' }, [200]);
    const finalRead = await send('L3', { method: 'GET', fileId: 'XFA' }, [200]);
    if (ctx.stop) return null;
    const propfindEtag = propfind.etag !== null ? propfind.etag : parsePropfindEtag(propfind.body.toString('utf8'));
    return {
      put: { status: put.status, etag: put.etag, redirect: put.redirect },
      reads,
      propfind: { etag: propfindEtag, status: propfind.status },
      head: { etag: head.etag, status: head.status },
      finalRead: { etag: finalRead.etag, status: finalRead.status, bodySha256: finalRead.bodySha256 },
      bodySha256: sha256Hex(body),
    };
  }

  // ---- L4: identical-byte rewrite --------------------------------------------------------
  async function stepL4() {
    if (!ctx.current || ctx.current.etag === null) return { missingPrerequisite: 'XFA' };
    const priorEtag = ctx.current.etag;
    const priorBody = ctx.current.body;
    const priorBodySha256 = ctx.current.sha256;
    const put = await send('L4', { method: 'PUT', fileId: 'XFA', ifMatch: priorEtag, body: priorBody }, [200, 201, 204]);
    if (ctx.stop) return null;
    if (is2xx(put.status)) updateFileState('XFA', put, priorBody);
    const get = await send('L4', { method: 'GET', fileId: 'XFA' }, [200]);
    const head = await send('L4', { method: 'HEAD', fileId: 'XFA' }, [200]);
    if (ctx.stop) return null;
    return {
      put: { status: put.status, etag: put.etag, redirect: put.redirect },
      get: { status: get.status, bodySha256: get.bodySha256, etag: get.etag },
      head: { status: head.status, etag: head.etag },
      priorEtag,
      priorBodySha256,
    };
  }

  // ---- L5: conditional update / stale rejection -----------------------------------------
  async function stepL5() {
    if (!ctx.current || ctx.current.etag === null) return { missingPrerequisite: 'XFA' };
    const preEtag = ctx.current.etag;
    const preBodySha256 = ctx.current.sha256;
    const body = syntheticBody('XFA', 'S-CAS', 'winner');
    const staleBody = syntheticBody('XFA', 'S-CAS', 'stale');
    const update = await send('L5', { method: 'PUT', fileId: 'XFA', ifMatch: preEtag, body }, [200, 201, 204]);
    if (ctx.stop) return null;
    if (is2xx(update.status)) updateFileState('XFA', update, body);
    const stale = await send('L5', { method: 'PUT', fileId: 'XFA', ifMatch: preEtag, body: staleBody }, [412, 409]);
    if (ctx.stop) return null;
    const get = await send('L5', { method: 'GET', fileId: 'XFA' }, [200]);
    const propfind = await send('L5', { method: 'PROPFIND', fileId: 'XFA', depth: '0' }, [207]);
    const head = await send('L5', { method: 'HEAD', fileId: 'XFA' }, [200]);
    if (ctx.stop) return null;
    const propfindEtag = propfind.etag !== null ? propfind.etag : parsePropfindEtag(propfind.body.toString('utf8'));
    return {
      update: { status: update.status, etag: update.etag, redirect: update.redirect },
      stale: { status: stale.status, redirect: stale.redirect },
      get: { status: get.status, bodySha256: get.bodySha256, etag: get.etag },
      propfind: { status: propfind.status, etag: propfindEtag },
      head: { status: head.status, etag: head.etag },
      expectedBodySha256: sha256Hex(body),
      preBodySha256,
      preEtag,
    };
  }

  // ---- L6: cross-process race -------------------------------------------------------------
  async function stepL6() {
    if (!ctx.current || ctx.current.etag === null) return { rounds: [] };
    const rounds = [];
    for (let round = 1; round <= RACE_ROUNDS; round += 1) {
      if (ctx.stop !== null) break;
      const pre = ctx.current;
      const bodyA = syntheticBody('XFA', 'S-CAS-RACE', `round-${round}-writer-1`);
      const bodyB = syntheticBody('XFA', 'S-CAS-RACE', `round-${round}-writer-2`);
      const barrierDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p0store-race-'));
      let childA;
      let childB;
      try {
        const common = {
          plan,
          fileId: 'XFA',
          ifMatch: pre.etag,
          budgetTokens: 2,
          timeoutMs: DEFAULT_BARRIER_TIMEOUT_MS,
          barrierDir,
        };
        if (ctx.ca !== null) {
          fs.writeFileSync(path.join(barrierDir, 'ca.pem'), Buffer.isBuffer(ctx.ca) ? ctx.ca : Buffer.from(String(ctx.ca)));
        }
        const configA = path.join(barrierDir, 'writer-1.json');
        const configB = path.join(barrierDir, 'writer-2.json');
        fs.writeFileSync(configA, JSON.stringify({
          ...common, writerId: 1, bodyBase64: bodyA.toString('base64'),
          readyPath: path.join(barrierDir, 'ready-1.json'),
          goPath: path.join(barrierDir, 'go-1'),
          resultPath: path.join(barrierDir, 'result-1.json'),
        }));
        fs.writeFileSync(configB, JSON.stringify({
          ...common, writerId: 2, bodyBase64: bodyB.toString('base64'),
          readyPath: path.join(barrierDir, 'ready-2.json'),
          goPath: path.join(barrierDir, 'go-2'),
          resultPath: path.join(barrierDir, 'result-2.json'),
        }));
        gate.budget.delegate(4);
        childA = spawn(process.execPath, [SELF_PATH, 'race-writer', configA], {
          stdio: 'ignore', windowsHide: true, env: childEnv,
        });
        childB = spawn(process.execPath, [SELF_PATH, 'race-writer', configB], {
          stdio: 'ignore', windowsHide: true, env: childEnv,
        });
        const ready = await Promise.all([
          waitForFileOrExit(path.join(barrierDir, 'ready-1.json'), childA),
          waitForFileOrExit(path.join(barrierDir, 'ready-2.json'), childB),
        ]);
        if (!ready[0] || !ready[1]) {
          stop('RACE_BARRIER', 'L6', 'WRITER_NOT_READY');
          break;
        }
        fs.writeFileSync(path.join(barrierDir, 'go-1'), 'go');
        fs.writeFileSync(path.join(barrierDir, 'go-2'), 'go');
        const exits = await Promise.all([waitForExit(childA), waitForExit(childB)]);
        if (!exits[0].ok || !exits[1].ok) {
          stop('RACE_BARRIER', 'L6', 'WRITER_EXIT');
          break;
        }
        const resultA = JSON.parse(fs.readFileSync(path.join(barrierDir, 'result-1.json'), 'utf8'));
        const resultB = JSON.parse(fs.readFileSync(path.join(barrierDir, 'result-2.json'), 'utf8'));
        const verify = await send('L6', { method: 'GET', fileId: 'XFA' }, [200]);
        if (ctx.stop) break;
        const statuses = [resultA.putStatus, resultB.putStatus];
        const bodySha256 = [sha256Hex(bodyA), sha256Hex(bodyB)];
        const etags = [resultA.putEtag || null, resultB.putEtag || null];
        const winners = statuses.filter((status) => is2xx(status)).length;
        let winnerIndex = statuses.findIndex((status) => is2xx(status));
        let confirmed = 0;
        let stale = false;
        if (winners === 1) {
          const winnerBody = bodySha256[winnerIndex];
          const winnerEtag = etags[winnerIndex];
          if (verify.bodySha256 === winnerBody && (winnerEtag === null || verify.etag === winnerEtag)) {
            confirmed = 1;
            ctx.current = {
              body: winnerIndex === 0 ? bodyA : bodyB,
              etag: winnerEtag,
              sha256: winnerBody,
              certain: true,
            };
            const winnerFile = ctx.files.get('XFA');
            winnerFile.created = true;
            winnerFile.etag = winnerEtag;
            winnerFile.body = ctx.current.body;
            winnerFile.sha256 = winnerBody;
          } else if (verify.bodySha256 === pre.sha256) {
            stale = true;
            ctx.current = { ...pre, certain: pre.certain && true };
          } else if (verify.bodySha256 === bodySha256[1 - winnerIndex]) {
            ctx.current = { ...pre, certain: false };
            ctx.files.get('XFA').certain = false;
          } else {
            ctx.current = { ...pre, certain: false };
            ctx.files.get('XFA').certain = false;
          }
        }
        rounds.push({
          round,
          barrier: 'file',
          pids: [childA.pid, childB.pid],
          resultPids: [resultA.pid, resultB.pid],
          writerIds: [resultA.writerId, resultB.writerId],
          readEtags: [resultA.getEtag || null, resultB.getEtag || null],
          statuses,
          bodySha256,
          etags,
          winnerIndex,
          finalSha256: verify.bodySha256,
          finalEtag: verify.etag,
          preEtag: pre.etag,
          preSha256: pre.sha256,
          confirmed: confirmed === 1,
          staleVerify: stale,
        });
        if (winners === 2) {
          stop('LOST_UPDATE', 'L6', NO_GO_REASONS.ROUND_LOST_UPDATE);
          break;
        }
      } finally {
        if (childA && childA.exitCode === null) childA.kill();
        if (childB && childB.exitCode === null) childB.kill();
        fs.rmSync(barrierDir, { recursive: true, force: true });
      }
    }
    ctx.raceRounds = rounds;
    return { rounds };
  }

  // ---- L7: invalid validators and stale conditional DELETE ------------------------------
  async function stepL7() {
    if (!ctx.current || ctx.current.etag === null) return { missingPrerequisite: 'XFA' };
    const expectedSha = ctx.current.sha256;
    const preBodySha256 = ctx.previous ? ctx.previous.sha256 : null;
    const staleEtag = ctx.staleEtag !== null && ctx.staleEtag !== ctx.current.etag
      ? ctx.staleEtag
      : '"p0store-stale-XF7"';
    const weak = await send('L7', {
      method: 'PUT', fileId: 'XFA', ifMatch: 'W/"weak-XF7"', body: syntheticBody('XFA', 'S-ERR', 'weak'),
    }, [400, 412, 428]);
    if (ctx.stop) return null;
    const garbage = await send('L7', {
      method: 'PUT', fileId: 'XFA', ifMatch: 'garbage-XF7', body: syntheticBody('XFA', 'S-ERR', 'garbage'),
    }, [400, 412, 428]);
    if (ctx.stop) return null;
    const missingTarget = await send('L7', {
      method: 'PUT', fileId: 'XFZ', ifMatch: '"missing-XF7"', body: syntheticBody('XFZ', 'S-ERR', 'missing'),
    }, [404, 412]);
    if (ctx.stop) return null;
    const staleDelete = await send('L7', {
      method: 'DELETE', fileId: 'XFA', ifMatch: staleEtag,
    }, [412, 409]);
    if (ctx.stop) return null;
    const get = await send('L7', { method: 'GET', fileId: 'XFA' }, [200, 404]);
    if (ctx.stop) return null;
    return {
      weak: { status: weak.status, redirect: weak.redirect },
      garbage: { status: garbage.status, redirect: garbage.redirect },
      missingTarget: { status: missingTarget.status },
      staleDelete: { status: staleDelete.status, redirect: staleDelete.redirect },
      get: { status: get.status, bodySha256: get.bodySha256, etag: get.etag },
      expectedBodySha256: expectedSha,
      preBodySha256,
    };
  }

  // ---- L8: S-LATE, socket destroyed after the body is sent ------------------------------
  async function stepL8() {
    if (!ctx.current || ctx.current.etag === null) return { rounds: [] };
    const rounds = [];
    for (let round = 1; round <= LATE_ACK_ROUNDS; round += 1) {
      if (ctx.stop !== null) break;
      const pre = ctx.current;
      const body = syntheticBody('XFA', 'S-LATE', `round-${round}`);
      let attempt;
      try {
        attempt = await gate.request({
          method: 'PUT', fileId: 'XFA', ifMatch: pre.etag, body, abort: 'after-body',
        });
        recordRequest('L8', attempt);
        // Intentional socket destruction is the experiment, not a transport fault: the outcome is
        // resolved from authoritative state below and never classified as a STOP here.
      } catch (error) {
        if (error instanceof GateRefusal) {
          stop('LOCAL_REFUSAL', 'L8', error.code);
          break;
        }
        throw error;
      }
      if (ctx.stop) break;
      const get = await send('L8', { method: 'GET', fileId: 'XFA' }, [200, 404]);
      if (ctx.stop) break;
      const propfind = await send('L8', { method: 'PROPFIND', fileId: 'XFA', depth: '0' }, [207, 404]);
      if (ctx.stop) break;
      const propfindEtag = propfind.etag !== null ? propfind.etag : parsePropfindEtag(propfind.body.toString('utf8'));
      let resolution = 'UNRESOLVABLE';
      if (is2xx(attempt.status)) {
        resolution = 'COMMITTED';
        updateFileState('XFA', attempt, body);
      } else if (attempt.status === 412 || attempt.status === 409) {
        resolution = 'NOT_COMMITTED';
      } else if (get.status === 200 && get.bodySha256 === sha256Hex(body)
        && propfindEtag !== null && get.etag === propfindEtag && get.etag !== pre.etag) {
        resolution = 'COMMITTED';
        ctx.previous = ctx.current;
        ctx.current = { body, etag: get.etag, sha256: sha256Hex(body), certain: pre.certain };
        const file = ctx.files.get('XFA');
        file.created = true;
        file.etag = get.etag;
        file.body = body;
        file.sha256 = sha256Hex(body);
      } else if (get.status === 200 && get.bodySha256 === pre.sha256
        && get.etag === pre.etag && propfindEtag === pre.etag) {
        resolution = 'NOT_COMMITTED';
      } else {
        ctx.current = { ...pre, certain: false };
        ctx.files.get('XFA').certain = false;
      }
      rounds.push({
        round,
        attempted: true,
        aborted: attempt.aborted === true,
        responseStatus: attempt.status,
        getStatus: get.status,
        getSha256: get.bodySha256,
        getEtag: get.etag,
        propfindEtag,
        attemptedSha256: sha256Hex(body),
        preSha256: pre.sha256,
        preEtag: pre.etag,
        resolution,
      });
    }
    return { rounds };
  }

  // ---- L9: error semantics and local refusals -------------------------------------------
  async function stepL9() {
    const missingCollection = await send('L9', {
      method: 'PUT', fileId: 'XFM', ifNoneMatch: '*', body: syntheticBody('XFM', 'S-ERR', 'missing-collection'),
    }, [409]);
    if (ctx.stop) return null;
    const missingFile = await send('L9', { method: 'GET', fileId: 'XFZ' }, [404]);
    if (ctx.stop) return null;

    const egressBefore = gate.stats.egress;
    let oversized;
    try {
      await gate.request({
        method: 'PUT', fileId: 'XFA', ifNoneMatch: '*', body: Buffer.alloc(plan.limits.maxFileBytes + 1, 0x61),
      });
      oversized = { refusedCode: null, egress: gate.stats.egress - egressBefore };
    } catch (error) {
      if (!(error instanceof GateRefusal)) throw error;
      oversized = { refusedCode: error.code, egress: gate.stats.egress - egressBefore };
      trace.record({ type: 'refusal', step: 'L9', method: 'PUT', code: error.code });
    }

    const egressBeforeOutside = gate.stats.egress;
    let outside;
    try {
      await gate.request({
        method: 'GET', path: `${plan.probeParent}other-run-fake-XF/absent-XFZ.json`, auth: false,
      });
      outside = { refusedCode: null, egress: gate.stats.egress - egressBeforeOutside };
    } catch (error) {
      if (!(error instanceof GateRefusal)) throw error;
      outside = { refusedCode: error.code, egress: gate.stats.egress - egressBeforeOutside };
      trace.record({ type: 'refusal', step: 'L9', method: 'GET', code: error.code });
    }

    return {
      missingCollection: { status: missingCollection.status, redirect: missingCollection.redirect },
      missingFile: { status: missingFile.status },
      oversized,
      outside,
    };
  }

  // ---- L10: S-MULTI partial state --------------------------------------------------------
  async function stepL10() {
    const journalBody = syntheticBody('XFJ', 'S-MULTI', 'journal');
    const dataBody = syntheticBody('XFD', 'S-MULTI', 'data');
    const journalPut = await send('L10', { method: 'PUT', fileId: 'XFJ', ifNoneMatch: '*', body: journalBody }, [201, 200]);
    if (ctx.stop) return null;
    if (is2xx(journalPut.status)) updateFileState('XFJ', journalPut, journalBody);
    let aborted;
    try {
      aborted = await gate.request({
        method: 'PUT', fileId: 'XFD', ifNoneMatch: '*', body: dataBody, abort: 'before-body',
      });
      recordRequest('L10', aborted);
      // This deliberate abort is the partial-state experiment; it is never a STOP source.
    } catch (error) {
      if (error instanceof GateRefusal) {
        stop('LOCAL_REFUSAL', 'L10', error.code);
        return null;
      }
      throw error;
    }
    if (ctx.stop) return null;
    const getJournal = await send('L10', { method: 'GET', fileId: 'XFJ' }, [200]);
    if (ctx.stop) return null;
    const getData = await send('L10', { method: 'GET', fileId: 'XFD' }, [200, 404]);
    if (ctx.stop) return null;
    const dataPut = await send('L10', { method: 'PUT', fileId: 'XFD', ifNoneMatch: '*', body: dataBody }, [201, 200, 412]);
    if (ctx.stop) return null;
    if (is2xx(dataPut.status)) updateFileState('XFD', dataPut, dataBody);
    const propfind = await send('L10', { method: 'PROPFIND', target: 'run-directory', depth: '1' }, [207]);
    if (ctx.stop) return null;
    const hrefs = parseHrefs(propfind.body.toString('utf8'));
    const journalName = plan.files.find((file) => file.id === 'XFJ').name;
    const dataName = plan.files.find((file) => file.id === 'XFD').name;
    return {
      journalPut: { status: journalPut.status, redirect: journalPut.redirect },
      abortedPut: { aborted: aborted.aborted === true, status: aborted.status },
      getJournal: { status: getJournal.status },
      getData: { status: getData.status, bodySha256: getData.bodySha256 },
      dataPut: { status: dataPut.status },
      propfind: {
        status: propfind.status,
        count: childHrefs(hrefs, plan.runDirectory).length,
        hasJournal: hrefs.some((href) => href.endsWith(journalName)),
        hasData: hrefs.some((href) => href.endsWith(dataName)),
      },
    };
  }

  // ---- L11: S-BACKUP export/restore into fresh names ------------------------------------
  async function stepL11() {
    const sources = [];
    for (const fileId of ['XFA', 'XFJ', 'XFD']) {
      const read = await send('L11', { method: 'GET', fileId }, [200]);
      if (ctx.stop) return null;
      sources.push({ id: fileId, status: read.status, sha256: read.bodySha256, body: read.body });
    }
    if (sources.some((source) => source.status !== 200)) {
      return { sources: sources.map(({ body, ...rest }) => rest), restores: [], readbacks: [] };
    }
    const restores = [];
    const targets = [['XFR1', 'XFA'], ['XFR2', 'XFJ'], ['XFR3', 'XFD']];
    for (const [targetId, sourceId] of targets) {
      const source = sources.find((entry) => entry.id === sourceId);
      const put = await send('L11', {
        method: 'PUT', fileId: targetId, ifNoneMatch: '*', body: source.body,
      }, [201, 200]);
      if (ctx.stop) return null;
      if (is2xx(put.status)) updateFileState(targetId, put, source.body);
      restores.push({ id: targetId, sourceId, status: put.status });
    }
    const readbacks = [];
    for (const [targetId, sourceId] of [['XFR1', 'XFA'], ['XFR2', 'XFJ']]) {
      const read = await send('L11', { method: 'GET', fileId: targetId }, [200]);
      if (ctx.stop) return null;
      readbacks.push({ id: targetId, sourceId, status: read.status, sha256: read.bodySha256 });
    }
    return {
      sources: sources.map(({ body, ...rest }) => rest),
      restores,
      readbacks,
    };
  }

  // ---- cleanup ---------------------------------------------------------------------------
  function latestEtagFor(file) {
    const known = gate.knownFiles().find((entry) => entry.fileId === file.id);
    if (file.etag !== null) return file.etag;
    if (known && known.etag !== null) return known.etag;
    return null;
  }

  async function cleanupCertainFiles(stepId) {
    const created = [...ctx.files.values()].filter((file) => file.created);
    for (const file of created) {
      if (!file.certain) {
        ctx.quarantine.push({ fileId: file.id, reason: 'IDENTITY_UNCERTAIN' });
        trace.record({ type: 'quarantine', fileId: file.id, reason: 'IDENTITY_UNCERTAIN' });
        ctx.cleanup.push({ fileId: file.id, action: 'NONE', status: null, identity: 'UNCERTAIN', result: 'QUARANTINED' });
        trace.record({
          type: 'cleanup', fileId: file.id, action: 'NONE', status: null,
          identity: 'UNCERTAIN', result: 'QUARANTINED',
        });
        continue;
      }
      const etag = latestEtagFor(file);
      if (etag === null) {
        ctx.quarantine.push({ fileId: file.id, reason: 'NO_AUTHORITATIVE_VALIDATOR' });
        trace.record({ type: 'quarantine', fileId: file.id, reason: 'NO_AUTHORITATIVE_VALIDATOR' });
        continue;
      }
      let status = null;
      let result = 'FAILED';
      let identity = 'CERTAIN';
      try {
        const response = await gate.request({
          method: 'DELETE', fileId: file.id, ifMatch: etag, cleanup: true,
        });
        recordRequest(stepId, response);
        status = response.status;
        if (ctx.live === true && (response.status === 401 || response.status === 403)) {
          // A live auth rejection during cleanup is the first rejection in that phase: stop, record
          // the failed delete, and send no further cleanup request.
          ctx.skipCleanup = true;
          stop('UNEXPECTED_401', stepId);
          ctx.cleanup.push({ fileId: file.id, action: 'DELETE', status, identity, result: 'FAILED' });
          trace.record({
            type: 'cleanup', fileId: file.id, action: 'DELETE', status, identity, result: 'FAILED',
          });
          break;
        }
        if (response.status === 204 || response.status === 200 || response.status === 404) {
          result = 'DELETED';
          file.created = false;
        } else {
          result = 'FAILED';
          ctx.quarantine.push({ fileId: file.id, reason: `DELETE_STATUS_${response.status}` });
          trace.record({ type: 'quarantine', fileId: file.id, reason: `DELETE_STATUS_${response.status}` });
        }
      } catch (error) {
        result = 'REFUSED';
        identity = 'CERTAIN';
        ctx.quarantine.push({ fileId: file.id, reason: error && error.code ? error.code : 'DELETE_REFUSED' });
        trace.record({ type: 'quarantine', fileId: file.id, reason: error && error.code ? error.code : 'DELETE_REFUSED' });
        trace.record({ type: 'refusal', step: stepId, method: 'DELETE', code: error && error.code ? error.code : 'DELETE_REFUSED' });
      }
      ctx.cleanup.push({ fileId: file.id, action: 'DELETE', status, identity, result });
      trace.record({ type: 'cleanup', fileId: file.id, action: 'DELETE', status, identity, result });
    }
  }

  // ---- L12: cleanup and empty-namespace check -------------------------------------------
  async function stepL12() {
    ctx.cleanupAttempted = true;
    await cleanupCertainFiles('L12');
    if (ctx.stop) return null;
    const propfind = await send('L12', { method: 'PROPFIND', target: 'run-directory', depth: '1' }, [207]);
    if (ctx.stop) return null;
    const hrefs = parseHrefs(propfind.body.toString('utf8'));
    const runDir = await send('L12', { method: 'PROPFIND', target: 'run-directory', depth: '0' }, [207]);
    if (ctx.stop) return null;
    const remaining = [...ctx.files.values()].filter((file) => file.created).map((file) => file.id);
    if (remaining.length > 0 && ctx.stop === null) {
      stop('CLEANUP_UNVERIFIED', 'L12', `REMAINING:${remaining.join(',')}`);
    }
    return {
      deletes: ctx.cleanup.filter((entry) => entry.action === 'DELETE').map((entry) => ({
        fileId: entry.fileId, status: entry.status,
      })),
      propfind: { status: propfind.status, count: childHrefs(hrefs, plan.runDirectory).length },
      runDir: { status: runDir.status },
    };
  }

  const stepFns = {
    L0: stepL0,
    L1: stepL1,
    L2: stepL2,
    L3: stepL3,
    L4: stepL4,
    L5: stepL5,
    L6: stepL6,
    L7: stepL7,
    L8: stepL8,
    L9: stepL9,
    L10: stepL10,
    L11: stepL11,
    L12: stepL12,
  };

  try {
    for (const step of plan.steps) {
      if (ctx.stop !== null) break;
      await executeStep(step.id, stepFns[step.id]);
    }
    if (ctx.stop !== null && ctx.cleanupAttempted !== true && ctx.skipCleanup !== true) {
      await cleanupCertainFiles('ABORT');
    }
  } catch (error) {
    trace.close();
    throw error;
  }

  const verdict = computeVerdict({ steps: ctx.steps, stop: ctx.stop });
  trace.record({
    type: 'verdict',
    verdict: verdict.verdict,
    rule: verdict.rule,
    reasons: verdict.reasons,
  });
  trace.close();

  return {
    ok: true,
    refused: false,
    code: null,
    planId: plan.planId,
    mode: plan.mode === 'live' ? 'live' : 'local-mock',
    phase: plan.mode === 'live' ? PHASE3_LIVE_READINESS : PHASE1_LOCAL_MOCK_ONLY,
    runId: preflight === null ? null : preflight.runId,
    preflight,
    totals: planTotals(plan),
    verdict: verdict.verdict,
    rule: verdict.rule,
    reasons: verdict.reasons,
    unresolved: verdict.unresolved,
    stop: ctx.stop,
    steps: ctx.steps,
    cleanup: ctx.cleanup,
    quarantine: ctx.quarantine,
    raceRounds: ctx.raceRounds,
    gateStats: {
      attempts: gate.stats.attempts,
      egress: gate.stats.egress,
      responses: gate.stats.responses,
      refusals: gate.stats.refusals,
      aborted: gate.stats.aborted,
      redirects: gate.stats.redirects,
      bytesSent: gate.stats.bytesSent,
    },
    budget: gate.budget.snapshot(),
    trace: trace.records(),
  };
}

function waitForFile(filePath, timeoutMs) {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const poll = () => {
      if (fs.existsSync(filePath)) { resolve(true); return; }
      if (Date.now() >= deadline) { resolve(false); return; }
      setTimeout(poll, 5);
    };
    poll();
  });
}

// Waits for a child's ready file but stops early if the child exits: a crashed writer must fail the
// barrier quickly instead of leaving the parent polling until the full timeout.
function waitForFileOrExit(filePath, child, timeoutMs = DEFAULT_BARRIER_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    const poll = () => {
      if (settled) return;
      if (fs.existsSync(filePath)) { finish(true); return; }
      if (Date.now() >= deadline) { finish(false); return; }
      setTimeout(poll, 5);
    };
    child.once('exit', () => {
      // Give the child's final write a chance to land before declaring the barrier failed.
      setTimeout(() => finish(fs.existsSync(filePath)), 20);
    });
    child.once('error', () => finish(false));
    poll();
  });
}

function waitForExit(child, timeoutMs = DEFAULT_BARRIER_TIMEOUT_MS) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve({ ok: child.exitCode === 0, code: child.exitCode, signal: child.signalCode });
      return;
    }
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { child.kill(); } catch { /* already gone */ }
      resolve({ ok: false, code: null, signal: 'TIMEOUT' });
    }, timeoutMs);
    child.on('exit', (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ok: code === 0, code, signal });
    });
    child.on('error', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ok: false, code: null, signal: 'ERROR' });
    });
  });
}

// Child-process entry for one L6 writer. It reads its configuration file (which never contains the
// credential), builds its own gate with a delegated 2-request budget, reads the validator, waits at
// the local barrier, performs the conditional PUT and records both its OS pid and the outcome.
async function raceWriterMain() {
  const configPath = process.argv[3];
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    // The parent resolves a live plan's runtime run id before spawning L6 writers. That resolved
    // object cannot be re-validated by the committed-live-plan loader (which requires the {runId}
    // placeholder), so it is trusted directly here; the parent already authorized the exact host,
    // port, prefix and run id before any child existed. Local-mock plans keep the strict loader.
    const resolvedLivePlan = config.plan
      && config.plan.mode === 'live'
      && typeof config.plan.runId === 'string'
      && /^[0-9a-f]{32}$/.test(config.plan.runId);
    const plan = resolvedLivePlan ? config.plan : validatePlan(config.plan, {});
    const ca = fs.existsSync(path.join(config.barrierDir, 'ca.pem'))
      ? fs.readFileSync(path.join(config.barrierDir, 'ca.pem'))
      : null;
    const secret = loadSecret(plan, process.env);
    const budget = new Budget({
      maxRequests: config.budgetTokens,
      reservedCleanup: 0,
      windowMs: plan.budget.windowMs,
    });
    const gate = createGate({ plan, secret, ca, budget });
    const read = await gate.request({ method: 'GET', fileId: config.fileId });
    fs.writeFileSync(config.readyPath, JSON.stringify({
      pid: process.pid, status: read.status, etag: read.etag,
    }));
    const released = await waitForFile(config.goPath, config.timeoutMs);
    if (!released) {
      fs.writeFileSync(config.resultPath, JSON.stringify({
        pid: process.pid, writerId: config.writerId, error: 'BARRIER_TIMEOUT',
      }));
      return 3;
    }
    const put = await gate.request({
      method: 'PUT',
      fileId: config.fileId,
      ifMatch: config.ifMatch,
      body: Buffer.from(config.bodyBase64, 'base64'),
      writerId: config.writerId,
    });
    fs.writeFileSync(config.resultPath, JSON.stringify({
      pid: process.pid,
      writerId: config.writerId,
      getStatus: read.status,
      getEtag: read.etag,
      putStatus: put.status,
      putEtag: put.etag,
    }));
    return 0;
  } catch (error) {
    const message = error instanceof Error ? `${error.code || error.name}: ${error.message}` : String(error);
    try {
      if (config && typeof config.resultPath === 'string') {
        fs.writeFileSync(config.resultPath, JSON.stringify({
          pid: process.pid, writerId: config.writerId, error: message,
        }));
      }
    } catch { /* best effort */ }
    return 2;
  }
}

function parseArgs(args) {
  const out = { planPath: null, live: false, accessApprovalId: null, trace: null };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--live') out.live = true;
    else if (arg === '--plan') { i += 1; out.planPath = args[i] || null; }
    else if (arg === '--approval') { i += 1; out.accessApprovalId = args[i] || null; }
    else if (arg === '--trace') { i += 1; out.trace = args[i] || null; }
    else return { error: `UNKNOWN_ARGUMENT: ${arg}` };
  }
  return out;
}

async function main() {
  if (process.argv[2] === 'race-writer') {
    return raceWriterMain();
  }
  const args = parseArgs(process.argv.slice(2));
  if (args.error) {
    console.error(args.error);
    return 2;
  }
  if (args.planPath === null) {
    console.error('usage: node src/runner.mjs --plan <plan.json> [--trace <trace.jsonl>] [--live --approval <id>]');
    return 2;
  }
  let plan;
  try {
    plan = loadPlanFile(args.planPath, { allowNonLoopback: args.live });
  } catch (error) {
    console.error(`PLAN_REJECTED: ${error.code || error.name}`);
    return 3;
  }
  const result = await runProbe({
    plan,
    live: args.live,
    accessApprovalId: args.accessApprovalId,
    traceFilePath: args.trace,
    env: process.env,
    onPreflight: (summary) => { console.log(summary); },
  });
  if (result.refused) {
    console.error(`REFUSED: ${result.code}`);
    return 4;
  }
  console.log(JSON.stringify({
    planId: result.planId,
    mode: result.mode,
    verdict: result.verdict,
    rule: result.rule,
    stop: result.stop,
    budget: result.budget,
    gateStats: result.gateStats,
  }, null, 2));
  return result.verdict === 'NO-GO' ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SELF_PATH) {
  main().then((code) => {
    process.exitCode = typeof code === 'number' ? code : 0;
  }).catch((error) => {
    console.error(`RUNNER_ERROR: ${error && error.code ? error.code : 'UNEXPECTED'}`);
    process.exitCode = 5;
  });
}
