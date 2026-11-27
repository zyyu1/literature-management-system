// P1-08 - weak validators and delayed visibility are PARTIAL, never GO and never NO-GO.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAgainstMock } from '../support/harness.mjs';

test('P1-08 weak-etag personality: consistent CAS but weak-only validators yield PARTIAL with the weak-validator reason', async (t) => {
  const { mock, result } = await runAgainstMock(t, { personality: 'weak-etag' });
  assert.equal(result.verdict, 'PARTIAL');
  assert.equal(result.rule, 'PARTIAL_LIMITING_CONDITION');
  assert.equal(result.reasons[0], 'WEAK_VALIDATOR@L3', `reasons: ${result.reasons.join(',')}`);
  assert.equal(result.stop, null, 'weak validators are a compensating-rule condition, not a STOP');
  const l3 = result.steps.find((step) => step.step === 'L3');
  assert.equal(l3.status, 'PASS');
  assert.equal(l3.evidence.weakValidator, true);
  assert.equal(l3.anomalies.includes('WEAK_VALIDATOR'), true);
  assert.equal(result.steps.find((step) => step.step === 'L12').status, 'PASS');
  assert.equal(mock.fileCount(), 0);
});

test('P1-08 stale-read personality: valid CAS but delayed read-after-write visibility yields PARTIAL with the stale-read reason', async (t) => {
  const { result } = await runAgainstMock(t, { personality: 'stale-read' });
  assert.equal(result.verdict, 'PARTIAL');
  assert.equal(result.rule, 'PARTIAL_LIMITING_CONDITION');
  assert.equal(result.reasons[0], 'STALE_READ_VISIBILITY@L2', `reasons: ${result.reasons.join(',')}`);
  const cleanup = result.reasons.findIndex((reason) => reason.startsWith('STOP_CLEANUP_UNVERIFIED@'));
  assert.ok(cleanup > 0, `cleanup STOP must follow the L2 root cause: ${result.reasons.join(',')}`);
  const l3 = result.steps.find((step) => step.step === 'L3');
  assert.equal(l3.status, 'PASS', `L3 was ${l3.status}: ${l3.reason}`);
  assert.equal(l3.evidence.immediate, false, 'the immediate read did not see the new bytes/validator');
  assert.equal(l3.evidence.delayed, true, 'later reads did see them');
  assert.equal(l3.anomalies.includes('STALE_READ_VISIBILITY'), true);
  assert.equal(result.verdict === 'NO-GO', false, 'delayed visibility is not a lost update');
});
