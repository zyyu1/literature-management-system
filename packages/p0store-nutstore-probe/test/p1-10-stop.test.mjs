// P1-10 - throttle / server error / unexpected 401 stop immediately with no retry and only certain cleanup.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startMockFor, planForPort, runAgainstMock } from '../support/harness.mjs';

test('P1-10 a 429 at the first authenticated request STOPs immediately with no retry', async (t) => {
  const { mock, result } = await runAgainstMock(t, { personality: 'throttle' });
  assert.equal(result.stop.rule, 'THROTTLE');
  assert.equal(result.stop.step, 'L0');
  assert.equal(result.verdict, 'INCONCLUSIVE');
  assert.equal(result.rule, 'INCONCLUSIVE_BEFORE_L6_COMPLETE');
  assert.equal(result.reasons[0], 'STOP_THROTTLE@L0', `reasons: ${result.reasons.join(',')}`);
  assert.equal(result.unresolved, true);
  assert.equal(mock.stats.requests, 3, 'two unauthenticated 401s and exactly one throttled request');
  assert.equal(mock.stats.byMethod.OPTIONS, 1);
  assert.equal(mock.stats.byMethod.PROPFIND, 2);
  assert.equal(mock.stats.throttled, 1);
  assert.equal(result.steps[0].status, 'UNRESOLVABLE');
  assert.equal(result.steps[0].reason, 'STOP_THROTTLE');
});

test('P1-10 a 5xx at the first authenticated request STOPs immediately with no retry', async (t) => {
  const { mock, result } = await runAgainstMock(t, { personality: 'server-error' });
  assert.equal(result.stop.rule, 'SERVER_ERROR');
  assert.equal(result.stop.step, 'L0');
  assert.equal(result.verdict, 'INCONCLUSIVE');
  assert.equal(result.rule, 'INCONCLUSIVE_BEFORE_L6_COMPLETE');
  assert.equal(result.reasons[0], 'STOP_SERVER_ERROR@L0', `reasons: ${result.reasons.join(',')}`);
  assert.equal(mock.stats.requests, 3);
  assert.equal(mock.stats.serverErrors, 1);
});

test('P1-10 an unexpected 401 after successful authentication STOPs at once, is never retried and cleans up only the acknowledged file', async (t) => {
  const mock = await startMockFor(t, { personality: 'strong' });
  // L0 3 + L1 2 + L2 4 = 9; request 10 is the first L3 PUT, which receives the injected 401.
  mock.control.setInjectUnauthorizedAt(10);
  const plan = planForPort(mock.port);
  const { result: injected } = await runAgainstMock(t, { mock });
  assert.equal(injected.stop.rule, 'UNEXPECTED_401');
  assert.equal(injected.stop.step, 'L3');
  assert.equal(injected.verdict, 'INCONCLUSIVE');
  assert.equal(injected.rule, 'INCONCLUSIVE_BEFORE_L6_COMPLETE');
  assert.equal(injected.reasons[0], 'STOP_UNEXPECTED_401@L3', `reasons: ${injected.reasons.join(',')}`);
  const filePath = `${plan.pathPrefix}a-XFA.json`;
  assert.equal(mock.pathRequests(filePath), 6, 'four L2 requests, one rejected L3 PUT, one cleanup DELETE');
  assert.equal(mock.stats.byMethod.DELETE, 1, 'the certain file is deleted exactly once');
  assert.equal(mock.stats.requests, 11, 'no request retries the failed L3 PUT');
  assert.equal(mock.hasFile(filePath), false);
  assert.equal(injected.cleanup.some((entry) => entry.fileId === 'XFA' && entry.result === 'DELETED'), true);
});

test('P1-10 STOP after an unresolvable late ACK quarantines the uncertain file and never deletes it', async (t) => {
  const mock = await startMockFor(t, { personality: 'unresolvable-ack' });
  // L0 3 + L1 2 + L2 4 + L3 7 + L4 3 + L5 5 + L6 25 + L7 5 + L8 9 = 63; request 64 is L9's first.
  mock.control.setInjectUnauthorizedAt(64);
  const plan = planForPort(mock.port);
  const { result } = await runAgainstMock(t, { mock });
  assert.equal(result.stop.rule, 'UNEXPECTED_401');
  assert.equal(result.stop.step, 'L9');
  assert.equal(result.verdict, 'PARTIAL');
  assert.equal(result.rule, 'PARTIAL_LIMITING_CONDITION');
  assert.equal(result.reasons[0], 'UNRESOLVABLE_LATE_ACK@L8', `reasons: ${result.reasons.join(',')}`);
  assert.equal(result.steps.find((step) => step.step === 'L6').evidence.rounds, 5,
    'the L9 STOP is after L6 completed all five race rounds');
  assert.equal(result.quarantine.some((entry) => entry.fileId === 'XFA' && entry.reason === 'IDENTITY_UNCERTAIN'), true);
  assert.equal(result.cleanup.some((entry) => entry.fileId === 'XFA' && entry.result === 'QUARANTINED'), true);
  // The only DELETE that reached the mock is L7's stale conditional-delete experiment (412). The
  // abort cleanup for the uncertain XFA identity must have issued none: it records action NONE.
  assert.equal(mock.stats.byMethod.DELETE, 1, 'only the L7 stale conditional DELETE probe reached the server');
  assert.equal(result.cleanup.some((entry) => entry.fileId === 'XFA' && entry.action === 'DELETE'), false,
    'the uncertain identity must never be DELETE\'d');
  assert.equal(result.trace.some((event) => event.type === 'cleanup' && event.fileId === 'XFA' && event.action === 'DELETE'), false);
  assert.equal(mock.hasFile(`${plan.pathPrefix}a-XFA.json`), true);
});
