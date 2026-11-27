// P1-16 - R4 live auth identity: user env validation before the password, redaction of the user name,
// exact Basic identity, and first-401 stop with no cleanup. All tests are offline and synthetic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  runProbe, loadPlanFile, loadExamplePlan, validatePlan, PlanError, countingTransport,
  traceHasSecret, CANARY, CREDENTIAL_ENV_NAME,
} from '../support/harness.mjs';
import { LIVE_USER_ENV } from '../src/plan.mjs';
import { Secret } from '../src/secret.mjs';

const LIVE_PLAN_URL = new URL('../plans/live-nutstore-plan.json', import.meta.url);
const GOOD_APPROVAL = 'P0STORE-ACCESS-02-20261127-ABCD';
const GOOD_RUNTIME = { version: 'v22.23.5', arch: 'x64' };
const GOOD_USER = 'probe-user@example.invalid';

function liveBase() {
  return JSON.parse(fs.readFileSync(LIVE_PLAN_URL, 'utf8'));
}

function livePlan() {
  return loadPlanFile(LIVE_PLAN_URL);
}

function envWithSecret() {
  return { [LIVE_USER_ENV]: GOOD_USER, [CREDENTIAL_ENV_NAME]: CANARY };
}

function passwordPoisonEnv(user) {
  const env = {};
  if (user !== undefined) env[LIVE_USER_ENV] = user;
  Object.defineProperty(env, CREDENTIAL_ENV_NAME, {
    enumerable: true,
    get() { throw new Error('PASSWORD_READ_BEFORE_USER_VALIDATION'); },
  });
  return env;
}

function response(status, headers = {}, body = Buffer.alloc(0)) {
  return {
    status, headers, body, aborted: false, redirect: false, error: null, durationMs: 1,
  };
}

function authHeaderOf(options) {
  return options.headers && (options.headers.Authorization || options.headers.authorization);
}

async function expectUserRefusal(user, code) {
  const transport = countingTransport();
  const result = await runProbe({
    plan: livePlan(),
    live: true,
    accessApprovalId: GOOD_APPROVAL,
    env: passwordPoisonEnv(user),
    runtime: GOOD_RUNTIME,
    transport: transport.fn,
    allowTestHooks: true,
  });
  assert.equal(result.refused, true, `expected ${code}, got ${result.verdict}`);
  assert.equal(result.code, code);
  assert.equal(result.trace.length, 0);
  assert.equal(transport.calls(), 0);
  return result;
}

// A non-401 stub used by U-05/U-06: OPTIONS 200, parent PROPFIND 207, then MKCOL 429. It captures
// every transport call but never creates a socket.
function non401Stub(seen) {
  return async (options) => {
    seen.push(options);
    if (options.method === 'OPTIONS') return response(200, {});
    if (options.method === 'PROPFIND' && options.path === '/dav/LMS-P0STORE/') {
      return response(207, { dav: '1,2' });
    }
    if (options.method === 'MKCOL') return response(429, {});
    return response(500, {});
  };
}

test('P1-16 U-01 a live plan without credentialUserEnvVar is rejected with PLAN_REJECTED', () => {
  const raw = liveBase();
  delete raw.credentialUserEnvVar;
  let thrown = null;
  try {
    validatePlan(raw);
  } catch (error) {
    thrown = error;
  }
  assert.ok(thrown instanceof PlanError, 'expected a PlanError');
  assert.equal(thrown.code, 'PLAN_REJECTED');
});

test('P1-16 U-02 an unset user env gives CREDENTIAL_USER_MISSING with zero transport and an empty trace', async () => {
  await expectUserRefusal(undefined, 'CREDENTIAL_USER_MISSING');
});

test('P1-16 U-03 an empty user env gives CREDENTIAL_USER_MISSING with zero transport and an empty trace', async () => {
  await expectUserRefusal('', 'CREDENTIAL_USER_MISSING');
});

test('P1-16 U-04 a malformed user env gives CREDENTIAL_USER_MALFORMED before the password is read', async () => {
  const malformed = [
    'probe:user@example.invalid',
    'probe user@example.invalid',
    'probe-user.example.invalid',
    'a'.repeat(255),
    'probe-user@example.invalid\u0000',
  ];
  for (const user of malformed) {
    await expectUserRefusal(user, 'CREDENTIAL_USER_MALFORMED');
  }
});

test('P1-16 U-05 the live Authorization header decodes to exactly the runtime user and synthetic password', async () => {
  const seen = [];
  const result = await runProbe({
    plan: livePlan(),
    live: true,
    accessApprovalId: GOOD_APPROVAL,
    env: envWithSecret(),
    runtime: GOOD_RUNTIME,
    transport: non401Stub(seen),
    allowTestHooks: true,
  });
  assert.equal(result.refused, false);
  const authenticated = seen.find((call) => authHeaderOf(call) !== undefined);
  assert.ok(authenticated, 'expected at least one authenticated request');
  const header = authHeaderOf(authenticated);
  assert.equal(header.startsWith('Basic '), true);
  assert.equal(Buffer.from(header.slice(6), 'base64').toString('utf8'), `${GOOD_USER}:${CANARY}`);
});

test('P1-16 U-06 user and password canaries never appear in trace, console, preflight, result or error text', async () => {
  const seen = [];
  let summary = null;
  const result = await runProbe({
    plan: livePlan(),
    live: true,
    accessApprovalId: GOOD_APPROVAL,
    env: envWithSecret(),
    runtime: GOOD_RUNTIME,
    transport: non401Stub(seen),
    allowTestHooks: true,
    onPreflight: (line) => { summary = line; },
  });
  assert.equal(result.refused, false);
  assert.equal(result.preflight.user, '<redacted>');
  assert.equal(result.preflight.userChars, GOOD_USER.length);
  assert.ok(summary.includes(`user=<redacted, ${GOOD_USER.length} chars>`));
  assert.equal(summary.includes(GOOD_USER), false);
  assert.equal(summary.includes(CANARY), false);

  const pair = `${GOOD_USER}:${CANARY}`;
  const pairB64 = Buffer.from(pair, 'utf8').toString('base64');
  const userB64 = Buffer.from(GOOD_USER, 'utf8').toString('base64');
  const passwordB64 = Buffer.from(CANARY, 'utf8').toString('base64');
  const header = `Basic ${pairB64}`;
  const forms = [GOOD_USER, CANARY, pair, pairB64, userB64, passwordB64, header];
  const haystack = [
    JSON.stringify(result),
    JSON.stringify(result.trace),
    JSON.stringify(result.preflight),
    summary,
    String(result),
  ];
  for (const form of forms) {
    for (const text of haystack) {
      assert.equal(text.includes(form), false, `form leaked: ${form}`);
    }
  }
  assert.equal(traceHasSecret(result.trace, CANARY), false);

  const secret = new Secret(CANARY, GOOD_USER);
  for (const form of [GOOD_USER, pair, pairB64, userB64, passwordB64, header]) {
    assert.equal(secret.contains(form), true, `Secret should contain ${form}`);
    assert.equal(secret.redact(`before ${form} after`).includes(form), false, `Secret should redact ${form}`);
  }

  const bad = await runProbe({
    plan: livePlan(),
    live: true,
    accessApprovalId: GOOD_APPROVAL,
    env: passwordPoisonEnv(`${GOOD_USER}:bad`),
    runtime: GOOD_RUNTIME,
    transport: countingTransport().fn,
    allowTestHooks: true,
  });
  assert.equal(bad.refused, true);
  assert.equal(bad.code, 'CREDENTIAL_USER_MALFORMED');
  assert.equal(bad.message.includes(GOOD_USER), false);
  assert.equal(JSON.stringify(bad).includes(GOOD_USER), false);
});

test('P1-16 U-07 the first live 401 stops with one transport call, INCONCLUSIVE and no cleanup', async () => {
  const seen = [];
  const transport = async (options) => {
    seen.push(options);
    return response(401, {});
  };
  const result = await runProbe({
    plan: livePlan(),
    live: true,
    accessApprovalId: GOOD_APPROVAL,
    env: envWithSecret(),
    runtime: GOOD_RUNTIME,
    transport,
    allowTestHooks: true,
  });
  assert.equal(result.refused, false);
  assert.equal(seen.length, 1, 'the first 401 must end the run before any second request');
  assert.equal(result.verdict, 'INCONCLUSIVE');
  assert.equal(result.stop.rule, 'UNEXPECTED_401');
  assert.equal(result.stop.step, 'L0');
  assert.equal(result.cleanup.length, 0);
  assert.equal(result.gateStats.egress, 1);
  assert.equal(result.trace.filter((event) => event.type === 'request').length, 1);
  assert.equal(result.trace.some((event) => event.type === 'cleanup'), false);
});

test('P1-16 U-08 local/mock runs keep the fixed probe user and the frozen harness identity', async () => {
  const seen = [];
  const transport = async (options) => {
    seen.push(options);
    if (options.method === 'OPTIONS') return response(401, {});
    if (options.method === 'PROPFIND' && options.path === '/LMS-P0STORE/') {
      return response(authHeaderOf(options) === undefined ? 401 : 207, { dav: '1,2' });
    }
    if (options.method === 'PROPFIND') return response(207, { dav: '1,2' });
    if (options.method === 'MKCOL') return response(429, {});
    return response(500, {});
  };
  const result = await runProbe({
    plan: loadExamplePlan(),
    env: { [CREDENTIAL_ENV_NAME]: CANARY },
    transport,
    allowTestHooks: true,
  });
  assert.equal(result.refused, false);
  assert.equal(result.mode, 'local-mock');
  const authenticated = seen.find((call) => authHeaderOf(call) !== undefined);
  assert.ok(authenticated, 'expected an authenticated local request');
  assert.equal(Buffer.from(authHeaderOf(authenticated).slice(6), 'base64').toString('utf8'), `probe:${CANARY}`);
});
