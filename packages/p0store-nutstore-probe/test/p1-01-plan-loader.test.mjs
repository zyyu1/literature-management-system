// P1-01 - strict frozen-plan loader.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  readExamplePlanObject, loadExamplePlan, validatePlan, planTotals, STEP_IDS, PlanError,
} from '../support/harness.mjs';

const BASE = readExamplePlanObject();

function mutate(fn) {
  const plan = structuredClone(BASE);
  fn(plan);
  return plan;
}

function expectCode(plan, code) {
  let thrown = null;
  try {
    validatePlan(plan);
  } catch (error) {
    thrown = error;
  }
  assert.ok(thrown instanceof PlanError, `expected PlanError ${code}, nothing was thrown`);
  assert.equal(thrown.code, code, `expected dedicated reason ${code}, got ${thrown.code} (${thrown.message})`);
}

function expectMutation(fn, code) {
  expectCode(mutate(fn), code);
}

test('P1-01 the committed example plan loads as a frozen closed-schema plan with the 13 ordered steps and the A90 budget totals', () => {
  const plan = loadExamplePlan();
  assert.equal(Object.isFrozen(plan), true);
  assert.equal(Object.isFrozen(plan.steps), true);
  assert.equal(Object.isFrozen(plan.files), true);
  assert.deepEqual(plan.steps.map((step) => step.id), [...STEP_IDS]);
  assert.equal(plan.steps.length, 13);
  assert.equal(plan.protocol, 'https:');
  assert.equal(plan.host, '127.0.0.1');
  assert.equal(plan.port, 8443);
  assert.equal(plan.pathPrefix, `${plan.probeParent}${plan.runId}/`);
  assert.equal(plan.runDirectory, `${plan.probeParent}${plan.runId}`);
  const totals = planTotals(plan);
  assert.equal(totals.requests, 89);
  assert.equal(totals.cleanupRequests, 6);
  assert.equal(totals.normalRequests, 83);
  assert.equal(totals.nonReservedCeiling, 88);
  assert.ok(totals.normalRequests <= totals.nonReservedCeiling);
  assert.equal(plan.budget.maxRequests, 100);
  assert.equal(plan.budget.reservedCleanup, 12);
  assert.equal(plan.limits.maxFiles, 20);
  assert.equal(plan.limits.maxFileBytes, 1048576);
  assert.equal(plan.limits.maxTotalBytes, 20971520);
  assert.equal(plan.limits.maxWriters, 2);
});

test('P1-01 unknown top-level, budget, limits, timing, file and step keys are rejected with UNKNOWN_FIELD', () => {
  expectMutation((plan) => { plan.unexpected = true; }, 'UNKNOWN_FIELD');
  expectMutation((plan) => { plan.budget.burst = 10; }, 'UNKNOWN_FIELD');
  expectMutation((plan) => { plan.limits.threads = 4; }, 'UNKNOWN_FIELD');
  expectMutation((plan) => { plan.timing.retryDelayMs = 5; }, 'UNKNOWN_FIELD');
  expectMutation((plan) => { plan.files[0].owner = 'x'; }, 'UNKNOWN_FIELD');
  expectMutation((plan) => { plan.steps[0].depth = '0'; }, 'UNKNOWN_FIELD');
  expectMutation((plan) => { delete plan.planId; }, 'MISSING_FIELD');
});

test('P1-01 extra, duplicate, missing and reordered steps each fail with their own reason', () => {
  expectMutation((plan) => { plan.steps[12] = { ...plan.steps[12], id: 'L13' }; }, 'STEP_EXTRA');
  expectMutation((plan) => { plan.steps[5] = structuredClone(plan.steps[4]); }, 'STEP_DUPLICATE');
  expectMutation((plan) => { plan.steps.splice(5, 1); }, 'STEP_MISSING');
  expectMutation((plan) => {
    const swap = plan.steps[0];
    plan.steps[0] = plan.steps[1];
    plan.steps[1] = swap;
  }, 'STEP_ORDER');
});

test('P1-01 forbidden and step-inappropriate verbs are rejected', () => {
  expectMutation((plan) => { plan.steps[2].methods = ['PATCH']; }, 'FORBIDDEN_VERB');
  expectMutation((plan) => { plan.steps[2].methods = ['POST']; }, 'FORBIDDEN_VERB');
  expectMutation((plan) => { plan.steps[2].methods = ['OPTIONS']; }, 'STEP_METHOD_NOT_ALLOWED');
  expectMutation((plan) => { plan.steps[0].methods = []; }, 'STEP_METHODS');
  expectMutation((plan) => { plan.steps[0].methods = ['OPTIONS', 'OPTIONS']; }, 'STEP_METHODS');
  expectMutation((plan) => { plan.steps[0].oracle = 'GO'; }, 'STEP_ORACLE_MISMATCH');
});

test('P1-01 over-cap request budgets are rejected: 101 max, a missing 12-slot cleanup reserve and a 100-request plan', () => {
  expectMutation((plan) => { plan.budget.maxRequests = 101; }, 'BUDGET_MAX_OVER_CAP');
  expectMutation((plan) => { plan.budget.reservedCleanup = 11; }, 'BUDGET_CLEANUP_RESERVE_MISSING');
  expectMutation((plan) => { plan.budget.windowMs = 60000; }, 'BUDGET_WINDOW_INVALID');
  expectMutation((plan) => { plan.steps[6].requests = 36; }, 'BUDGET_PLANNED_AT_CAP');
  expectMutation((plan) => { plan.steps[6].requests = 26; }, 'STEP_REQUEST_OVER');
  expectMutation((plan) => { plan.steps[11].cleanupRequests = 1; }, 'STEP_CLEANUP_WITHOUT_DELETE');
});

test('P1-01 the file manifest enforces the 20-file, 1 MiB-per-file, 20 MiB-total and 2-writer ceilings', () => {
  expectMutation((plan) => {
    plan.files = [];
    for (let i = 0; i < 21; i += 1) {
      plan.files.push({
        id: `XF${i}`,
        name: `x-XF${i}.json`,
        maxBytes: 16,
        template: `/LMS-P0STORE/{runId}/x-{fileId}.json`,
      });
    }
  }, 'FILE_CAP_OVER');
  expectMutation((plan) => { plan.files[0].maxBytes = 1048577; }, 'FILE_SIZE_CAP_OVER');
  expectMutation((plan) => { plan.limits.maxFileBytes = 1048577; }, 'FILE_SIZE_CAP_OVER');
  expectMutation((plan) => { plan.limits.maxTotalBytes = 1024; }, 'TOTAL_SIZE_CAP_OVER');
  expectMutation((plan) => { plan.limits.maxFiles = 21; }, 'FILE_CAP_OVER');
  expectMutation((plan) => { plan.limits.maxWriters = 3; }, 'WRITER_CAP_OVER');
  expectMutation((plan) => { plan.files[1].id = plan.files[0].id; }, 'FILE_DUPLICATE_ID');
  expectMutation((plan) => { plan.files[1].name = plan.files[0].name; }, 'FILE_DUPLICATE_NAME');
  expectMutation((plan) => { plan.files[0].name = '../escape-XFA.json'; }, 'FILE_INVALID_NAME');
  expectMutation((plan) => { plan.files[0].template = '/LMS-P0STORE/{runId}/wrong-{fileId}.json'; }, 'FILE_TEMPLATE_MISMATCH');
});

test('P1-01 non-https protocols, non-loopback hosts and malformed path pinning are rejected', () => {
  expectMutation((plan) => { plan.protocol = 'http:'; }, 'NON_HTTPS_PLAN');
  expectMutation((plan) => { plan.host = 'probe-host.invalid'; }, 'NON_LOOPBACK_HOST');
  expectMutation((plan) => { plan.pathPrefix = '/LMS-P0STORE/other-run-fake/'; }, 'PATH_PREFIX_MISMATCH');
  expectMutation((plan) => { plan.runDirectory = '/LMS-P0STORE/other-run-fake'; }, 'RUN_DIRECTORY_MISMATCH');
  expectMutation((plan) => { plan.probeParent = '/'; }, 'INVALID_PROBE_PARENT');
  expectMutation((plan) => { plan.pathPrefix = `${plan.pathPrefix}../`; }, 'PATH_PREFIX_MISMATCH');
  expectMutation((plan) => { plan.port = 0; }, 'INVALID_PORT');
  expectMutation((plan) => { plan.credentialEnvVar = 'lower-case'; }, 'INVALID_CREDENTIAL_ENV');
});

test('P1-01 every rejection carries a stable PlanError code and never a generic count failure', () => {
  const reasons = new Set();
  const cases = [
    [(plan) => { plan.host = 'probe-host.invalid'; }, 'NON_LOOPBACK_HOST'],
    [(plan) => { plan.budget.reservedCleanup = 0; }, 'BUDGET_CLEANUP_RESERVE_MISSING'],
    [(plan) => { plan.steps[6].requests = 36; }, 'BUDGET_PLANNED_AT_CAP'],
    [(plan) => { plan.steps[5] = structuredClone(plan.steps[4]); }, 'STEP_DUPLICATE'],
  ];
  for (const [fn, code] of cases) {
    try {
      validatePlan(mutate(fn));
    } catch (error) {
      assert.equal(error.code, code);
      reasons.add(error.code);
    }
  }
  assert.equal(reasons.size, cases.length, 'each negative has its own dedicated reason');
});
