// P1-09 - late ACK: resolvable 3/3 without retry; unresolvable -> UNRESOLVABLE -> PARTIAL.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAgainstMock } from '../support/harness.mjs';

function l8PutEvents(result) {
  return result.trace.filter((event) => event.type === 'request' && event.step === 'L8' && event.method === 'PUT');
}

test('P1-09 late-ack personality: all three socket-destroyed writes are resolved from authoritative state without a retry', async (t) => {
  const { result } = await runAgainstMock(t, { personality: 'late-ack' });
  assert.equal(result.verdict, 'GO', `expected GO, reasons: ${result.reasons.join(',')}`);
  assert.equal(result.rule, 'GO_ALL_CRITERIA_PASSED');
  const l8 = result.steps.find((step) => step.step === 'L8');
  assert.equal(l8.status, 'PASS');
  assert.equal(l8.evidence.rounds, 3);
  assert.equal(l8.evidence.resolved, 3);
  assert.equal(l8.evidence.committed, 3, 'the server committed each aborted write');
  const puts = l8PutEvents(result);
  assert.equal(puts.length, 3, 'exactly one PUT attempt per round, never a blind retry');
  assert.equal(puts.every((event) => event.aborted === true), true, 'each attempt ended with the socket destroyed');
});

test('P1-09 unresolvable-ack personality: hidden outcome becomes UNRESOLVABLE -> PARTIAL, with no blind retry and a quarantine', async (t) => {
  const { mock, plan, result } = await runAgainstMock(t, { personality: 'unresolvable-ack' });
  assert.equal(result.verdict, 'PARTIAL');
  assert.equal(result.rule, 'PARTIAL_LIMITING_CONDITION');
  assert.equal(result.reasons[0], 'UNRESOLVABLE_LATE_ACK@L8', `reasons: ${result.reasons.join(',')}`);
  assert.equal(result.steps.find((step) => step.step === 'L6').evidence.rounds, 5,
    'L8 is after L6 completed all five race rounds');
  const l8 = result.steps.find((step) => step.step === 'L8');
  assert.equal(l8.status, 'UNRESOLVABLE');
  assert.equal(l8.reason, 'L8_OUTCOME_UNRESOLVABLE');
  assert.ok(l8.evidence.resolved < 3);
  assert.equal(l8.anomalies.includes('LATE_ACK_UNRESOLVABLE'), true);
  const puts = l8PutEvents(result);
  assert.equal(puts.length, 3, 'one attempt per round and no retry after an unresolvable outcome');
  assert.equal(result.quarantine.some((entry) => entry.fileId === 'XFA' && entry.reason === 'IDENTITY_UNCERTAIN'), true);
  assert.equal(result.cleanup.some((entry) => entry.fileId === 'XFA' && entry.result === 'QUARANTINED'), true);
  assert.equal(mock.hasFile(`${plan.pathPrefix}a-XFA.json`), true, 'an uncertain identity is never deleted');
  assert.equal(result.stop.rule, 'CLEANUP_UNVERIFIED');
});
