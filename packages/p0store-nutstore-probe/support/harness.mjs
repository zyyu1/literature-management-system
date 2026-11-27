// P0-STORE Phase 1 - TEST SUPPORT ONLY (never imported by src/).
//
// The frozen A62 egress precondition is evaluated while this module is being imported, i.e. before
// any test body can start a loopback mock, create a socket or spawn the L6 writer children. Every
// test file imports this module first. There is no environment opt-in and no relaxation: online the
// suite fails closed with EGRESS_PRECONDITION_FAILED before any network object exists.
//
// Helpers below only wrap the loopback HTTPS mock, the frozen example plan and the live credential
// environment for one test at a time. They never contact a non-loopback host and never write to the
// repository.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertPlatformEgressPrecondition } from '../../wp-01-synthetic-auth-api/support/platform-precondition.mjs';
import { loadSecret } from '../src/secret.mjs';
import { createGate } from '../src/gate.mjs';
import { runProbe } from '../src/runner.mjs';
import { loadPlanFile, validatePlan } from '../src/plan.mjs';
import { startMock } from './mock-webdav.mjs';

// Serialize the frozen guard's Windows inventory query across concurrently started test files.
// Twelve+ node:test files each import this module in parallel; each guard call spawns PowerShell and
// under that contention the frozen 8 s query timeout fires (QUERY_FAILED). The lock only serializes
// the existing, unchanged guard call (still before any socket); it never weakens or skips it.
const GUARD_LOCK = path.join(os.tmpdir(), 'p0store-egress-guard.lock');
const guardSleep = (ms) => { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); };
function acquireGuardLock() {
  const started = Date.now();
  for (;;) {
    try {
      const fd = fs.openSync(GUARD_LOCK, 'wx');
      fs.writeSync(fd, String(process.pid));
      return fd;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      try {
        const st = fs.statSync(GUARD_LOCK);
        if (Date.now() - st.mtimeMs > 30000) { try { fs.unlinkSync(GUARD_LOCK); } catch {} }
      } catch {}
      if (Date.now() - started > 120000) throw new Error('EGRESS_GUARD_LOCK_TIMEOUT');
      guardSleep(25);
    }
  }
}
const guardLockFd = acquireGuardLock();
try {
  assertPlatformEgressPrecondition();
} finally {
  try { fs.closeSync(guardLockFd); } catch {}
  try { fs.unlinkSync(GUARD_LOCK); } catch {}
}

export { assertPlatformEgressPrecondition };
export { loadSecret, createGate, runProbe, loadPlanFile, validatePlan, startMock };
export { Budget, GateRefusal, BudgetRefusal, canonicalizeRequestPath } from '../src/gate.mjs';
export { authorizeLiveRun, PHASE1_LIVE_ENABLED } from '../src/runner.mjs';
export { planTotals, STEP_IDS, STEP_SPEC, PlanError } from '../src/plan.mjs';
export { getTestCertificates, PERSONALITIES } from './mock-webdav.mjs';
export { evaluateStep } from '../src/oracle.mjs';
export { computeVerdict } from '../src/verdict.mjs';

export const PACKAGE_ROOT = fileURLToPath(new URL('../', import.meta.url));
export const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
export const PLAN_FILE = path.join(PACKAGE_ROOT, 'plans', 'example-plan.json');
export const CREDENTIAL_ENV_NAME = 'P0STORE_WEBDAV_PASSWORD';

// Fixed synthetic credential canary. It is fake test material, never a real password.
export const CANARY = 'canary-p0store-test-only-4f19c2';

export function readExamplePlanObject() {
  return JSON.parse(fs.readFileSync(PLAN_FILE, 'utf8'));
}

export function loadExamplePlan() {
  return loadPlanFile(PLAN_FILE);
}

// The committed plan remains the frozen loopback example; tests only replace the ephemeral mock port
// (and never the host, prefix, budget, caps, timing or file manifest).
export function planForPort(port, overrides = {}) {
  const raw = { ...readExamplePlanObject(), port, ...overrides };
  return validatePlan(raw);
}

export function planForHost(host, overrides = {}) {
  const raw = { ...readExamplePlanObject(), host, ...overrides };
  return validatePlan(raw, { allowNonLoopback: true });
}

export async function startMockFor(t, options = {}) {
  const mock = await startMock({ password: CANARY, ...options });
  t.after(async () => { await mock.close(); });
  return mock;
}

// Runs the full frozen plan against a fresh loopback mock. The credential env var is set only for the
// duration of the call because the L6 writer children inherit process.env and read it themselves.
export async function runAgainstMock(t, { personality = 'strong', mock: providedMock = null, mockOptions = {}, probeOptions = {} } = {}) {
  const mock = providedMock || await startMockFor(t, { personality, ...mockOptions });
  const plan = planForPort(mock.port);
  const previous = process.env[CREDENTIAL_ENV_NAME];
  process.env[CREDENTIAL_ENV_NAME] = CANARY;
  try {
    const result = await runProbe({ plan, ca: mock.caPem, ...probeOptions });
    return { mock, plan, result };
  } finally {
    if (previous === undefined) delete process.env[CREDENTIAL_ENV_NAME];
    else process.env[CREDENTIAL_ENV_NAME] = previous;
  }
}

export function makeGate(plan, { transport = undefined, budget = undefined, ca = null } = {}) {
  const secret = loadSecret(plan, { [plan.credentialEnvVar]: CANARY });
  return createGate({
    plan, secret, ca, transport, budget, allowTestHooks: true,
  });
}

// Counts transport invocations (i.e. socket attempts) without changing any production decision.
export function countingTransport(responseFactory = null) {
  let calls = 0;
  const seen = [];
  async function transport(options) {
    calls += 1;
    seen.push({ host: options.host, port: options.port, path: options.path, method: options.method });
    if (responseFactory) return responseFactory(options);
    return {
      status: 207,
      headers: {},
      body: Buffer.from('<D:multistatus xmlns:D="DAV:"/>'),
      aborted: false,
      redirect: false,
      error: null,
      durationMs: 1,
    };
  }
  return { fn: transport, calls: () => calls, seen };
}

export function traceHasSecret(traceRecords, secretValue) {
  const text = JSON.stringify(traceRecords);
  const basics = [
    secretValue,
    Buffer.from(secretValue, 'utf8').toString('base64'),
    Buffer.from(`probe:${secretValue}`, 'utf8').toString('base64'),
  ];
  return basics.some((form) => text.includes(form));
}

// Extracts every http(s) URL host from a text and returns it. Used by the P1-12 static scan.
export function urlHostsInText(text) {
  const hosts = [];
  const pattern = /https?:\/\/(\[[^\]]+\]|[^/\s"'`<>]+)/g;
  let match = pattern.exec(text);
  while (match !== null) {
    let host = match[1];
    if (host.startsWith('[')) host = host.slice(1, -1);
    host = host.split(':')[0].toLowerCase();
    hosts.push(host);
    match = pattern.exec(text);
  }
  return hosts;
}

export function walkPackageSourceFiles() {
  const out = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.isFile() && /\.(mjs|json|md)$/.test(entry.name)) out.push(abs);
    }
  }
  walk(PACKAGE_ROOT);
  return out;
}
