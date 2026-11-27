// P1-04 - rolling budget, reserved cleanup slots and the file/size/writer caps.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Budget, BudgetRefusal, makeGate, planForPort, readExamplePlanObject, validatePlan,
} from '../support/harness.mjs';

function canned(status, headers = {}) {
  return async () => ({
    status, headers, body: Buffer.alloc(0), aborted: false, redirect: false, error: null, durationMs: 1,
  });
}

function planWith(mutate) {
  const raw = structuredClone(readExamplePlanObject());
  mutate(raw);
  return validatePlan(raw);
}

test('P1-04 the rolling 30-minute window refuses the 89th normal request and reopens after the window', () => {
  let now = 0;
  const budget = new Budget({
    maxRequests: 100, reservedCleanup: 12, windowMs: 1800000, clock: () => now,
  });
  for (let i = 0; i < 88; i += 1) budget.tryAcquire('normal');
  assert.equal(budget.snapshot().normal, 88);
  assert.throws(() => budget.tryAcquire('normal'), (error) => {
    assert.ok(error instanceof BudgetRefusal);
    assert.equal(error.code, 'BUDGET_NORMAL_EXHAUSTED');
    return true;
  });
  now = 1799999;
  assert.throws(() => budget.tryAcquire('normal'), (error) => error.code === 'BUDGET_NORMAL_EXHAUSTED',
    'the first request is still inside the rolling window one millisecond before 30 minutes');
  now = 1800000;
  assert.equal(budget.tryAcquire('normal'), true, 'the oldest request left the rolling window at exactly 30 minutes');
  assert.equal(budget.snapshot().normal, 1);
});

test('P1-04 the 12 cleanup slots are pre-reserved: normal requests can never consume them', () => {
  let now = 0;
  const budget = new Budget({
    maxRequests: 100, reservedCleanup: 12, windowMs: 1800000, clock: () => now,
  });
  for (let i = 0; i < 88; i += 1) budget.tryAcquire('normal');
  for (let i = 0; i < 12; i += 1) budget.tryAcquire('cleanup');
  const snapshot = budget.snapshot();
  assert.equal(snapshot.normal, 88);
  assert.equal(snapshot.cleanup, 12);
  assert.equal(snapshot.total, 100);
  assert.throws(() => budget.tryAcquire('normal'), (error) => error.code === 'BUDGET_NORMAL_EXHAUSTED');
  assert.throws(() => budget.tryAcquire('cleanup'), (error) => error.code === 'BUDGET_CLEANUP_RESERVE_EXHAUSTED');
});

test('P1-04 delegated writer budgets are charged to the single parent budget and cannot exceed their allowance', () => {
  const budget = new Budget({ maxRequests: 100, reservedCleanup: 12, windowMs: 1800000 });
  const delegated = budget.delegate(4);
  assert.equal(budget.snapshot().normal, 4);
  assert.equal(delegated.tryAcquire('normal'), true);
  assert.equal(delegated.tryAcquire('normal'), true);
  assert.throws(() => delegated.tryAcquire('normal'), (error) => error.code === 'BUDGET_DELEGATION_EXCEEDED');
  assert.throws(() => budget.delegate(85), (error) => error.code === 'BUDGET_NORMAL_EXHAUSTED');
  assert.equal(budget.delegate(84).tryAcquire('normal'), true);
  assert.equal(budget.snapshot().normal, 88);
});

test('P1-04 the gate refuses the request that would exceed the budget before any transport call', async () => {
  const plan = planForPort(8443);
  let now = 0;
  const budget = new Budget({
    maxRequests: 5, reservedCleanup: 2, windowMs: 1800000, clock: () => now,
  });
  let calls = 0;
  const transport = async (options) => {
    calls += 1;
    if (options.method === 'PUT') {
      return { status: 201, headers: { etag: '"v1-test"' }, body: Buffer.alloc(0), aborted: false, redirect: false, error: null, durationMs: 1 };
    }
    if (options.method === 'DELETE') {
      return { status: 204, headers: {}, body: Buffer.alloc(0), aborted: false, redirect: false, error: null, durationMs: 1 };
    }
    return { status: 207, headers: {}, body: Buffer.alloc(0), aborted: false, redirect: false, error: null, durationMs: 1 };
  };
  const gate = makeGate(plan, { transport, budget });
  const body = Buffer.from('{"synthetic":true}\n');
  assert.equal((await gate.request({ method: 'PUT', fileId: 'XFA', ifNoneMatch: '*', body })).status, 201);
  assert.equal((await gate.request({ method: 'PROPFIND', fileId: 'XFZ', depth: '0' })).status, 207);
  assert.equal((await gate.request({ method: 'PROPFIND', fileId: 'XFZ', depth: '0' })).status, 207);
  await assert.rejects(gate.request({ method: 'PROPFIND', fileId: 'XFZ', depth: '0' }), (error) => {
    assert.equal(error.code, 'BUDGET_NORMAL_EXHAUSTED');
    return true;
  });
  assert.equal(calls, 3, 'the refused request never reached the transport');
  assert.equal(gate.stats.egress, 3);
  assert.equal((await gate.request({ method: 'DELETE', fileId: 'XFA', ifMatch: '"v1-test"', cleanup: true })).status, 204);
  assert.equal(calls, 4, 'cleanup still uses its pre-reserved slot');
  assert.equal(gate.budget.snapshot().cleanup, 1);
  assert.equal(gate.budget.snapshot().normal, 3);
  assert.equal(gate.budget.snapshot().total, 4);
});

test('P1-04 the file-count, per-file and total-size caps refuse before egress', async () => {
  const cappedRaw = readExamplePlanObject();
  cappedRaw.limits.maxFiles = 2;
  const cappedPlan = cappedRaw;
  const gate = makeGate(cappedPlan, { transport: canned(201, { etag: '"v1-x"' }) });
  const body = Buffer.from('{"synthetic":true}\n');
  assert.equal((await gate.request({ method: 'PUT', fileId: 'XFA', ifNoneMatch: '*', body })).status, 201);
  assert.equal((await gate.request({ method: 'PUT', fileId: 'XFJ', ifNoneMatch: '*', body })).status, 201);
  await assert.rejects(gate.request({ method: 'PUT', fileId: 'XFD', ifNoneMatch: '*', body }), (error) => {
    assert.equal(error.code, 'FILE_CAP_EXCEEDED');
    return true;
  });

  const totalRaw = readExamplePlanObject();
  totalRaw.limits.maxTotalBytes = 100;
  const totalGate = makeGate(totalRaw, { transport: canned(201, { etag: '"v1-x"' }) });
  assert.equal((await totalGate.request({
    method: 'PUT', fileId: 'XFA', ifNoneMatch: '*', body: Buffer.alloc(60, 0x61),
  })).status, 201);
  await assert.rejects(totalGate.request({
    method: 'PUT', fileId: 'XFJ', ifNoneMatch: '*', body: Buffer.alloc(60, 0x61),
  }), (error) => error.code === 'TOTAL_SIZE_CAP_EXCEEDED');

  const plan = planForPort(8443);
  const sizeGate = makeGate(plan, { transport: canned(201, { etag: '"v1-x"' }) });
  await assert.rejects(sizeGate.request({
    method: 'PUT', fileId: 'XFA', ifNoneMatch: '*', body: Buffer.alloc(2049, 0x61),
  }), (error) => error.code === 'FILE_PLAN_BYTES_EXCEEDED');
  await assert.rejects(sizeGate.request({
    method: 'PUT', fileId: 'XFA', ifNoneMatch: '*', body: Buffer.alloc(plan.limits.maxFileBytes + 1, 0x61),
  }), (error) => error.code === 'FILE_SIZE_CAP_EXCEEDED');
  assert.equal(sizeGate.stats.egress, 0);
});

test('P1-04 the writer cap allows exactly two writer slots and refuses a third', async () => {
  const plan = planForPort(8443);
  const gate = makeGate(plan, { transport: canned(207) });
  assert.equal(gate.registerWriter(1), 1);
  assert.equal(gate.registerWriter(2), 2);
  assert.throws(() => gate.registerWriter(3), (error) => error.code === 'WRITER_CAP_EXCEEDED');
  assert.throws(() => gate.registerWriter(1), (error) => error.code === 'WRITER_ALREADY_REGISTERED');
  gate.releaseWriter(1);
  assert.equal(gate.registerWriter(1), 1);
  await assert.rejects(gate.request({
    method: 'GET', fileId: 'XFZ', writerId: 3,
  }), (error) => error.code === 'WRITER_CAP_EXCEEDED');
  assert.equal(gate.stats.egress, 0);
});
