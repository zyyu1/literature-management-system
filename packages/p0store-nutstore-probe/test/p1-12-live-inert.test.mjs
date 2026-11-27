// P1-12 - R3 live gating (rewritten): every missing/wrong authorization condition refuses before any
// secret value is read, gate creation, transport call or child process. Also proves that the real-host
// literal exists only in the committed live plan and the one pinned-host constant.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  runProbe, loadExamplePlan, countingTransport, walkPackageSourceFiles, urlHostsInText,
  CANARY, CREDENTIAL_ENV_NAME, PACKAGE_ROOT,
} from '../support/harness.mjs';
import { LIVE_HOST } from '../src/plan.mjs';

const LIVE_PLAN_URL = new URL('../plans/live-nutstore-plan.json', import.meta.url);
const LIVE_PLAN_PATH = path.join(PACKAGE_ROOT, 'plans', 'live-nutstore-plan.json');
const PLAN_SOURCE_PATH = path.join(PACKAGE_ROOT, 'src', 'plan.mjs');
const GOOD_APPROVAL = 'P0STORE-ACCESS-02-20261127-ABCD';
const GOOD_RUNTIME = { version: 'v22.23.5', arch: 'x64' };

function liveBase() {
  return JSON.parse(fs.readFileSync(LIVE_PLAN_URL, 'utf8'));
}

function livePlan(overrides = {}) {
  return { ...liveBase(), ...overrides };
}

function mutation(fn) {
  const plan = liveBase();
  fn(plan);
  return plan;
}

function envWithSecret() {
  return { [CREDENTIAL_ENV_NAME]: CANARY };
}

function poisonedEnv() {
  const fail = () => { throw new Error('SECRET_READ_BEFORE_AUTHORIZATION'); };
  return new Proxy({}, { get: fail, has: fail, ownKeys: fail });
}

async function expectRefusal(plan, code, overrides = {}) {
  const transport = countingTransport();
  const result = await runProbe({
    plan,
    live: true,
    accessApprovalId: GOOD_APPROVAL,
    env: envWithSecret(),
    runtime: GOOD_RUNTIME,
    transport: transport.fn,
    allowTestHooks: true,
    ...overrides,
  });
  assert.equal(result.refused, true, `expected refusal ${code}, got ${result.verdict}`);
  assert.equal(result.code, code, `expected ${code}, got ${result.code}: ${result.message}`);
  assert.equal(result.trace.length, 0);
  assert.equal(transport.calls(), 0, 'no refusal may create a transport call');
  return result;
}

test('P1-12 condition 1: a live plan without --live refuses with LIVE_FLAG_REQUIRED before the secret is read', async () => {
  await expectRefusal(livePlan(), 'LIVE_FLAG_REQUIRED', { live: false, env: poisonedEnv() });
});

test('P1-12 condition 2: a local-mock plan with --live refuses with LIVE_PLAN_MODE_REQUIRED before the secret is read', async () => {
  await expectRefusal(loadExamplePlan(), 'LIVE_PLAN_MODE_REQUIRED', { env: poisonedEnv() });
});

test('P1-12 condition 2: every wrong live host variant refuses with LIVE_HOST_MISMATCH and no secret read', async () => {
  const hosts = [
    LIVE_HOST + '.evil',
    'jianguoyun.com',
    '203.0.113.7',
    LIVE_HOST.toUpperCase(),
    'wrong.invalid',
  ];
  for (const host of hosts) {
    await expectRefusal(mutation((plan) => { plan.host = host; }), 'LIVE_HOST_MISMATCH', { env: poisonedEnv() });
  }
});

test('P1-12 condition 2: wrong port, protocol, parent, path prefix, run directory, CA and env each have their own reason', async () => {
  const cases = [
    [(plan) => { plan.port = 8443; }, 'LIVE_PORT_MISMATCH'],
    [(plan) => { plan.protocol = 'http:'; }, 'LIVE_PROTOCOL_MISMATCH'],
    [(plan) => { plan.probeParent = '/dav/OTHER/'; }, 'LIVE_PROBE_PARENT_MISMATCH'],
    [(plan) => { plan.pathPrefix = '/dav/OTHER/{runId}/'; }, 'LIVE_PATH_PREFIX_MISMATCH'],
    [(plan) => { plan.runDirectory = '/dav/OTHER/{runId}'; }, 'LIVE_RUN_DIRECTORY_MISMATCH'],
    [(plan) => { plan.pinnedCaFile = 'ca.pem'; }, 'LIVE_PINNED_CA_FORBIDDEN'],
    [(plan) => { plan.credentialEnvVar = 'OTHER_PASSWORD'; }, 'LIVE_CREDENTIAL_ENV_MISMATCH'],
  ];
  for (const [fn, code] of cases) {
    await expectRefusal(mutation(fn), code, { env: poisonedEnv() });
  }
});

test('P1-12 condition 3: missing and malformed CLI approvals refuse before the secret is read', async () => {
  await expectRefusal(livePlan(), 'LIVE_APPROVAL_REQUIRED', { accessApprovalId: null, env: poisonedEnv() });
  await expectRefusal(livePlan(), 'LIVE_APPROVAL_INVALID', { accessApprovalId: 'not-an-approval', env: poisonedEnv() });
  await expectRefusal(livePlan(), 'LIVE_APPROVAL_INVALID', {
    accessApprovalId: 'P0STORE-ACCESS-02-20261127-abc', env: poisonedEnv(),
  });
});

test('P1-12 condition 3: a committed live plan with a shipped approval id refuses with LIVE_PLAN_SELF_AUTHORIZED', async () => {
  await expectRefusal(mutation((plan) => {
    plan.accessApprovalId = 'P0STORE-ACCESS-02-20261127-ABCD';
  }), 'LIVE_PLAN_SELF_AUTHORIZED', { env: poisonedEnv() });
});

test('P1-12 condition 4: a plan-supplied run id refuses with LIVE_RUN_ID_SUPPLIED before the secret is read', async () => {
  await expectRefusal(mutation((plan) => { plan.runId = 'a'.repeat(32); }), 'LIVE_RUN_ID_SUPPLIED', {
    env: poisonedEnv(),
  });
});

test('P1-12 condition 5: a missing credential refuses with LIVE_CREDENTIAL_MISSING and no transport call', async () => {
  const result = await expectRefusal(livePlan(), 'LIVE_CREDENTIAL_MISSING', { env: {} });
  assert.equal(result.gateStats, null);
});

test('P1-12 condition 6: a stubbed wrong Node version or arch refuses with NODE_RUNTIME_MISMATCH', async () => {
  await expectRefusal(livePlan(), 'NODE_RUNTIME_MISMATCH', {
    runtime: { version: 'v22.22.0', arch: 'x64' },
  });
  await expectRefusal(livePlan(), 'NODE_RUNTIME_MISMATCH', {
    runtime: { version: 'v22.23.5', arch: 'arm64' },
  });
});

test('P1-12 the seven-condition matrix never creates a transport call or a trace event', async () => {
  const transport = countingTransport();
  const cases = [
    [livePlan(), { live: false }],
    [loadExamplePlan(), {}],
    [mutation((plan) => { plan.port = 8443; }), {}],
    [livePlan(), { accessApprovalId: null }],
    [mutation((plan) => { plan.runId = 'a'.repeat(32); }), {}],
    [livePlan(), { env: {} }],
    [livePlan(), { runtime: { version: 'v0.0.0', arch: 'x64' } }],
  ];
  for (const [plan, overrides] of cases) {
    const result = await runProbe({
      plan,
      live: true,
      accessApprovalId: GOOD_APPROVAL,
      env: envWithSecret(),
      runtime: GOOD_RUNTIME,
      transport: transport.fn,
      allowTestHooks: true,
      ...overrides,
    });
    assert.equal(result.refused, true);
    assert.equal(result.trace.length, 0);
  }
  assert.equal(transport.calls(), 0);
});

test('P1-12 the live path no longer consults the legacy inert constant or an environment opt-in', () => {
  const runner = fs.readFileSync(new URL('../src/runner.mjs', import.meta.url), 'utf8');
  assert.equal(runner.includes('PHASE1_LIVE_INERT'), false);
  assert.equal(/phase1LiveEnabled/.test(runner), false);
  assert.equal(/process\.env\.(?:P0STORE_LIVE|LIVE_MODE|ALLOW_LIVE)/.test(runner), false);
  assert.equal(/--allow-live|--unsafe|--waiver/.test(runner), false);
});

test('P1-12 the real-host literal exists only in the committed live plan and the one pinned-host constant', () => {
  const allowed = new Map([
    [LIVE_PLAN_PATH, 1],
    [PLAN_SOURCE_PATH, 1],
  ]);
  const counts = new Map();
  const offenders = [];
  for (const file of walkPackageSourceFiles()) {
    const text = fs.readFileSync(file, 'utf8');
    const count = text.split(LIVE_HOST).length - 1;
    if (count > 0) counts.set(file, count);
    if (count > 0 && allowed.get(file) !== count) {
      offenders.push(`${file}: ${count} real-host occurrence(s)`);
    }
    for (const host of urlHostsInText(text)) {
      const permitted = host === '127.0.0.1' || host === '::1' || host === 'localhost'
        || host.endsWith('.invalid');
      if (!permitted) offenders.push(`${file}: URL host ${host}`);
    }
  }
  for (const [file, expected] of allowed) {
    assert.equal(counts.get(file), expected, `expected exactly ${expected} real-host literal in ${file}`);
  }
  assert.deepEqual(offenders, [], `real-host literal outside the two allowed places:\n${offenders.join('\n')}`);
});
