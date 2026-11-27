// P1-07 - dangerous personalities must produce NO-GO and STOP (lost update, create-only overwrite).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAgainstMock } from '../support/harness.mjs';

test('P1-07 lost-update personality: a stale If-Match accepted in L5 yields NO-GO and an immediate STOP', async (t) => {
  const { mock, plan, result } = await runAgainstMock(t, { personality: 'lost-update' });
  assert.equal(result.verdict, 'NO-GO');
  assert.equal(result.rule, 'NO_GO_EVIDENCE');
  assert.equal(result.reasons[0], 'NO_GO_STALE_WRITE_ACCEPTED@L5', `reasons: ${result.reasons.join(',')}`);
  assert.equal(result.stop.rule, 'LOST_UPDATE');
  assert.equal(result.stop.step, 'L5');
  const l5 = result.steps.find((step) => step.step === 'L5');
  assert.equal(l5.status, 'FAIL');
  assert.equal(l5.reason, 'NO_GO_STALE_WRITE_ACCEPTED');
  assert.equal(l5.evidence.status >= 200 && l5.evidence.status < 300, true, 'the server accepted the stale write');
  assert.equal(result.steps.some((step) => step.step === 'L6'), false, 'the run stopped before the race');
  assert.equal(result.cleanup.some((entry) => entry.fileId === 'XFA' && entry.result === 'DELETED'), true,
    'the acknowledged file was still cleaned up');
  assert.equal(mock.hasFile(`${plan.pathPrefix}a-XFA.json`), false);
});

test('P1-07 create-overwrite personality: create-only overwrite in L2 yields NO-GO and an immediate STOP', async (t) => {
  const { mock, plan, result } = await runAgainstMock(t, { personality: 'create-overwrite' });
  assert.equal(result.verdict, 'NO-GO');
  assert.equal(result.rule, 'NO_GO_EVIDENCE');
  assert.equal(result.reasons[0], 'NO_GO_CREATE_OVERWRITE@L2', `reasons: ${result.reasons.join(',')}`);
  assert.equal(result.stop.rule, 'CREATE_OVERWRITE');
  assert.equal(result.stop.step, 'L2');
  const l2 = result.steps.find((step) => step.step === 'L2');
  assert.equal(l2.status, 'FAIL');
  assert.equal(l2.reason, 'NO_GO_CREATE_OVERWRITE');
  assert.equal(result.steps.some((step) => step.step === 'L3'), false);
  assert.equal(result.cleanup.some((entry) => entry.fileId === 'XFA' && entry.result === 'DELETED'), true);
  assert.equal(mock.hasFile(`${plan.pathPrefix}a-XFA.json`), false);
});
