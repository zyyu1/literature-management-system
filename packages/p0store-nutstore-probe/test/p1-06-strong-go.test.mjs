// P1-06 - strong personality: full L0-L12 run, GO verdict, budget inside 88 + cleanup, empty namespace.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  runAgainstMock, traceHasSecret, CANARY, STEP_IDS,
} from '../support/harness.mjs';

test('P1-06 strong WebDAV personality: full L0-L12 run yields GO, budget <= 88 + cleanup and an empty namespace', async (t) => {
  const { mock, plan, result } = await runAgainstMock(t, { personality: 'strong' });

  assert.equal(result.refused, false);
  assert.equal(result.verdict, 'GO', `expected GO, got ${result.verdict} (${result.reasons.join(',')})`);
  assert.equal(result.rule, 'GO_ALL_CRITERIA_PASSED');
  assert.deepEqual(result.reasons, []);
  assert.equal(result.unresolved, false);
  assert.equal(result.stop, null);

  assert.equal(result.steps.length, 13);
  assert.deepEqual(result.steps.map((step) => step.step), [...STEP_IDS]);
  for (const step of result.steps) {
    assert.equal(step.status, 'PASS', `${step.step} was ${step.status}: ${step.reason}`);
  }

  const byStep = new Map(result.steps.map((step) => [step.step, step]));
  assert.equal(byStep.get('L3').evidence.immediate, true, 'read-after-write is immediate');
  assert.equal(byStep.get('L3').evidence.weakValidator, false, 'validators are strong');
  assert.equal(byStep.get('L6').evidence.confirmed, 5, 'all five race rounds have exactly one confirmed winner');
  assert.equal(byStep.get('L8').evidence.resolved, 3, 'all three late-ACK outcomes are determinable');
  assert.equal(byStep.get('L11').evidence.hashesEqual, true);
  assert.equal(byStep.get('L12').evidence.empty, true);

  assert.ok(result.budget.normal <= 88, `normal requests ${result.budget.normal} <= 88`);
  assert.equal(result.budget.cleanup, 6, 'six per-file cleanup DELETEs');
  assert.ok(result.budget.cleanup <= 12, 'cleanup stayed inside the 12 reserved slots');
  assert.ok(result.budget.total <= 88 + 12, 'total stayed inside 88 + reserved cleanup');
  assert.equal(result.budget.maxRequests, 100);
  assert.equal(result.gateStats.egress, result.budget.total - 20,
    'parent transport calls exclude the 20 delegated L6 child requests');
  assert.equal(result.gateStats.redirects, 0);

  assert.equal(mock.fileCount(), 0, 'no probe file remains in the namespace');
  const runDirectory = plan.runDirectory.replace(/\/+$/, '');
  assert.ok(mock.control.collections().includes(runDirectory), 'the empty run directory itself is retained');
  assert.equal(mock.files().filter((filePath) => filePath.startsWith(plan.pathPrefix)).length, 0);

  assert.equal(traceHasSecret(result.trace, CANARY), false);
  const requestEvents = result.trace.filter((event) => event.type === 'request');
  assert.equal(requestEvents.length, result.gateStats.egress);
  assert.equal(JSON.stringify(result.trace).includes('127.0.0.1'), false, 'the trace carries no host literal');
  assert.equal(requestEvents.every((event) => !String(event.pathTemplate).includes('://')), true);
  assert.equal(result.trace.at(-1).type, 'verdict');
  assert.equal(result.trace.at(-1).verdict, 'GO');
});
