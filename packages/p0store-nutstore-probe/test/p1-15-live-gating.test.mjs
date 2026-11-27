// P1-15 - R3 live gating end-to-end with an injected counting/stub transport (no socket): the
// all-conditions-satisfied path resolves a fresh run id, prints a redacted pre-flight, and targets the
// pinned origin/run prefix; every mutant-target gating case refuses before a secret read or request.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  runProbe, loadPlanFile, countingTransport, traceHasSecret, CANARY, CREDENTIAL_ENV_NAME,
} from '../support/harness.mjs';
import { LIVE_HOST } from '../src/plan.mjs';

const LIVE_PLAN_URL = new URL('../plans/live-nutstore-plan.json', import.meta.url);
const GOOD_APPROVAL = 'P0STORE-ACCESS-02-20261127-ABCD';
const GOOD_RUNTIME = { version: 'v22.23.5', arch: 'x64' };

function liveBase() {
  return JSON.parse(fs.readFileSync(LIVE_PLAN_URL, 'utf8'));
}

function envWithSecret() {
  return { [CREDENTIAL_ENV_NAME]: CANARY };
}

function poisonedEnv() {
  const fail = () => { throw new Error('SECRET_READ_BEFORE_AUTHORIZATION'); };
  return new Proxy({}, { get: fail, has: fail, ownKeys: fail });
}

function response(status, headers = {}, body = Buffer.alloc(0)) {
  return {
    status, headers, body, aborted: false, redirect: false, error: null, durationMs: 1,
  };
}

function collectionXml() {
  return Buffer.from('<?xml version="1.0"?><D:multistatus xmlns:D="DAV:"><D:response>'
    + '<D:href>/dav/LMS-P0STORE/</D:href><D:propstat><D:prop><D:resourcetype>'
    + '<D:collection/></D:resourcetype></D:prop><D:status>HTTP/1.1 200 OK</D:status>'
    + '</D:propstat></D:response></D:multistatus>');
}

// Stops at the first L2 PUT with 429, so this all-conditions run never reaches L6 children or any
// real transport. The three L0 calls, MKCOL and L1 PROPFIND still establish the first target paths.
function stubTransport(seen) {
  return async (options) => {
    seen.push({
      method: options.method,
      host: options.host,
      port: options.port,
      path: options.path,
      hasAuth: Boolean(options.headers && options.headers.Authorization),
    });
    if (options.method === 'OPTIONS') return response(401, {});
    if (options.method === 'PROPFIND' && options.path === '/dav/LMS-P0STORE/') {
      return response(options.headers && options.headers.Authorization ? 207 : 401, { dav: '1,2' });
    }
    if (options.method === 'MKCOL') return response(201, {});
    if (options.method === 'PROPFIND') return response(207, { dav: '1,2' }, collectionXml());
    if (options.method === 'PUT') return response(429, {});
    return response(500, {});
  };
}

async function runSatisfied(seen, onPreflight = null) {
  const plan = loadPlanFile(LIVE_PLAN_URL);
  const transport = stubTransport(seen);
  return runProbe({
    plan,
    live: true,
    accessApprovalId: GOOD_APPROVAL,
    env: envWithSecret(),
    runtime: GOOD_RUNTIME,
    transport,
    allowTestHooks: true,
    onPreflight,
  });
}

test('P1-15 all seven conditions satisfied: pre-flight is redacted, run id is fresh, and L0/L1/L2 target the pinned origin and run prefix', async () => {
  const seen = [];
  let summary = null;
  const result = await runSatisfied(seen, (line) => { summary = line; });
  assert.equal(result.refused, false);
  assert.equal(result.mode, 'live');
  assert.equal(result.phase, 'P0_STORE_PHASE3_LIVE_READINESS');
  assert.match(result.runId, /^[0-9a-f]{32}$/);
  assert.equal(result.preflight.runId, result.runId);
  assert.equal(result.preflight.host, LIVE_HOST);
  assert.equal(result.preflight.port, 443);
  assert.equal(result.preflight.pathPrefix, `/dav/LMS-P0STORE/${result.runId}/`);
  assert.equal(result.preflight.approvalId, GOOD_APPROVAL);
  assert.equal(result.preflight.budget.maxRequests, 100);
  assert.equal(result.preflight.budget.reservedCleanup, 12);
  assert.equal(result.preflight.limits.maxFiles, 20);
  assert.equal(result.preflight.limits.maxFileBytes, 1048576);
  assert.equal(result.preflight.limits.maxTotalBytes, 20971520);
  assert.equal(result.preflight.limits.maxWriters, 2);
  assert.equal(result.preflight.node, 'v22.23.5');
  assert.equal(result.preflight.arch, 'x64');

  assert.equal(typeof summary, 'string');
  assert.match(summary, /^P0STORE_PREFLIGHT /);
  assert.ok(summary.includes(`host=${LIVE_HOST}`));
  assert.ok(summary.includes('port=443'));
  assert.ok(summary.includes(`runId=${result.runId}`));
  assert.ok(summary.includes(`approvalId=${GOOD_APPROVAL}`));
  assert.ok(summary.includes('node=v22.23.5'));
  assert.equal(summary.includes(CANARY), false, 'the pre-flight summary must never contain the secret');

  assert.equal(result.trace[0].type, 'run');
  assert.ok(result.trace[0].phase.includes(GOOD_APPROVAL), 'the approval id is in the trace header');
  assert.equal(traceHasSecret(result.trace, CANARY), false);
  assert.equal(JSON.stringify(result.preflight).includes(CANARY), false);

  const origin = 'https://' + LIVE_HOST + ':443';
  assert.equal(seen.length, 6, `expected the L0/L1/L2 prefix only, got ${JSON.stringify(seen)}`);
  for (const call of seen) {
    assert.equal(call.host, LIVE_HOST);
    assert.equal(call.port, 443);
    assert.ok(call.path.startsWith('/dav/LMS-P0STORE/'));
  }
  assert.deepEqual(seen.slice(0, 3).map((call) => [call.method, call.path, call.hasAuth]), [
    ['OPTIONS', '/dav/LMS-P0STORE/', false],
    ['PROPFIND', '/dav/LMS-P0STORE/', false],
    ['PROPFIND', '/dav/LMS-P0STORE/', true],
  ], 'L0 semantics: OPTIONS/PROPFIND unauthenticated, then authenticated PROPFIND');
  const runDirectory = `/dav/LMS-P0STORE/${result.runId}`;
  const mkcol = seen.find((call) => call.method === 'MKCOL');
  assert.equal(mkcol.path, runDirectory);
  const firstFile = seen.find((call) => call.method === 'PUT');
  assert.equal(firstFile.path, `${result.preflight.pathPrefix}a-XFA.json`);
  assert.equal(origin + firstFile.path, origin + result.preflight.pathPrefix + 'a-XFA.json');
  assert.equal(result.stop.rule, 'THROTTLE');
  assert.equal(result.gateStats.egress, seen.length);
  assert.equal(result.raceRounds, null, 'the stub STOP happens before L6');
});

test('P1-15 two satisfied runs generate two different 32-hex run ids', async () => {
  const first = await runSatisfied([]);
  const second = await runSatisfied([]);
  assert.match(first.runId, /^[0-9a-f]{32}$/);
  assert.match(second.runId, /^[0-9a-f]{32}$/);
  assert.notEqual(first.runId, second.runId, 'a run id is never reused');
  assert.notEqual(first.preflight.pathPrefix, second.preflight.pathPrefix);
});

async function expectGatingRefusal({ plan = liveBase(), overrides = {}, code }) {
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
  assert.equal(result.refused, true, `expected ${code}, got ${result.verdict}`);
  assert.equal(result.code, code);
  assert.equal(result.trace.length, 0);
  assert.equal(transport.calls(), 0);
}

test('P1-15 mutation target: a missing approval refuses before the secret is read', async () => {
  await expectGatingRefusal({
    overrides: { accessApprovalId: null, env: poisonedEnv() },
    code: 'LIVE_APPROVAL_REQUIRED',
  });
});

test('P1-15 mutation target: a malformed approval refuses before the secret is read', async () => {
  await expectGatingRefusal({
    overrides: { accessApprovalId: 'P0STORE-ACCESS-02-2026-ABCD', env: poisonedEnv() },
    code: 'LIVE_APPROVAL_INVALID',
  });
});

test('P1-15 mutation target: a different live host refuses before the secret is read', async () => {
  await expectGatingRefusal({
    plan: { ...liveBase(), host: LIVE_HOST + '.evil' },
    overrides: { env: poisonedEnv() },
    code: 'LIVE_HOST_MISMATCH',
  });
});

test('P1-15 mutation target: a prefix outside /dav/LMS-P0STORE/ refuses before the secret is read', async () => {
  await expectGatingRefusal({
    plan: { ...liveBase(), pathPrefix: '/dav/OTHER/{runId}/' },
    overrides: { env: poisonedEnv() },
    code: 'LIVE_PATH_PREFIX_MISMATCH',
  });
});

test('P1-15 mutation target: a stubbed Node mismatch refuses with no transport call', async () => {
  await expectGatingRefusal({
    overrides: { runtime: { version: 'v22.22.0', arch: 'x64' } },
    code: 'NODE_RUNTIME_MISMATCH',
  });
});

test('P1-15 mutation target: the secret is not read when authorization fails before check 5', async () => {
  await expectGatingRefusal({
    overrides: { live: false, env: poisonedEnv() },
    code: 'LIVE_FLAG_REQUIRED',
  });
});
