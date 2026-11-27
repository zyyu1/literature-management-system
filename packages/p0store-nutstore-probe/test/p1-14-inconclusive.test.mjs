// P1-14 - R2 verdict matrix: INCONCLUSIVE, precedence and root-cause-first reasons.
//
// LOCAL_MOCK_ONLY. The full matrix runs the frozen plan against each of the eleven loopback mock
// personalities; the three synthetic cases exercise precedence clauses that a single mock run cannot
// isolate (a race stopped in round 3, a later STOP after everything passed, NO-GO with a later STOP).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAgainstMock, computeVerdict } from '../support/harness.mjs';
import { VERDICTS, VERDICT_RULES } from '../src/verdict.mjs';

const STEP_IDS = Object.freeze([
  'L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10', 'L11', 'L12',
]);

const PASS_EVIDENCE = Object.freeze({
  immediate: true,
  weakValidator: false,
  rounds: 5,
  confirmed: 5,
  unresolvedRounds: 0,
  resolved: 3,
  hashesEqual: true,
  empty: true,
});

function passStep(step) {
  return { step, status: 'PASS', reason: null, anomalies: [], evidence: { ...PASS_EVIDENCE } };
}

function allPass() {
  return STEP_IDS.map((step) => passStep(step));
}

const MATRIX = Object.freeze([
  {
    personality: 'strong',
    verdict: 'GO',
    rule: VERDICT_RULES.GO,
    reasons: [],
  },
  {
    personality: 'weak-etag',
    verdict: 'PARTIAL',
    rule: VERDICT_RULES.PARTIAL,
    firstReason: 'WEAK_VALIDATOR@L3',
  },
  {
    personality: 'stale-read',
    verdict: 'PARTIAL',
    rule: VERDICT_RULES.PARTIAL,
    firstReason: 'STALE_READ_VISIBILITY@L2',
    cleanupStopAfterRootCause: true,
  },
  {
    personality: 'lost-update',
    verdict: 'NO-GO',
    rule: VERDICT_RULES.NO_GO,
    firstReason: 'NO_GO_STALE_WRITE_ACCEPTED@L5',
  },
  {
    personality: 'create-overwrite',
    verdict: 'NO-GO',
    rule: VERDICT_RULES.NO_GO,
    firstReason: 'NO_GO_CREATE_OVERWRITE@L2',
  },
  {
    personality: 'late-ack',
    verdict: 'GO',
    rule: VERDICT_RULES.GO,
    reasons: [],
  },
  {
    personality: 'unresolvable-ack',
    verdict: 'PARTIAL',
    rule: VERDICT_RULES.PARTIAL,
    firstReason: 'UNRESOLVABLE_LATE_ACK@L8',
    cleanupStopAfterRootCause: true,
    requiresL6Complete: true,
  },
  {
    personality: 'throttle',
    verdict: 'INCONCLUSIVE',
    rule: VERDICT_RULES.INCONCLUSIVE,
    firstReason: 'STOP_THROTTLE@L0',
  },
  {
    personality: 'server-error',
    verdict: 'INCONCLUSIVE',
    rule: VERDICT_RULES.INCONCLUSIVE,
    firstReason: 'STOP_SERVER_ERROR@L0',
  },
  {
    personality: 'redirect',
    verdict: 'INCONCLUSIVE',
    rule: VERDICT_RULES.INCONCLUSIVE,
    firstReason: 'STOP_REDIRECT@L0',
  },
  {
    personality: 'bad-cert',
    verdict: 'INCONCLUSIVE',
    rule: VERDICT_RULES.INCONCLUSIVE,
    firstReason: 'STOP_TLS_OR_HOST@L0',
    mockOptions: { tls: 'bad-cert', badCertKind: 'wrong-ca' },
  },
]);

test('P1-14 the verdict vocabulary and deciding-clause names are exactly the R2 set', () => {
  assert.deepEqual([...VERDICTS], ['GO', 'PARTIAL', 'INCONCLUSIVE', 'NO-GO']);
  assert.deepEqual(VERDICT_RULES, {
    GO: 'GO_ALL_CRITERIA_PASSED',
    PARTIAL: 'PARTIAL_LIMITING_CONDITION',
    INCONCLUSIVE: 'INCONCLUSIVE_BEFORE_L6_COMPLETE',
    NO_GO: 'NO_GO_EVIDENCE',
  });
});

for (const entry of MATRIX) {
  test(`P1-14 ${entry.personality} personality: ${entry.verdict} with the R2 precedence and root-cause-first reasons`, async (t) => {
    const options = entry.mockOptions === undefined
      ? { personality: entry.personality }
      : { personality: entry.personality, mockOptions: entry.mockOptions };
    const { result } = await runAgainstMock(t, options);
    assert.equal(result.verdict, entry.verdict, `${entry.personality} reasons: ${result.reasons.join(',')}`);
    assert.equal(result.rule, entry.rule);
    if (entry.reasons !== undefined) {
      assert.deepEqual(result.reasons, entry.reasons);
    }
    if (entry.firstReason !== undefined) {
      assert.equal(result.reasons[0], entry.firstReason, `reasons: ${result.reasons.join(',')}`);
    }
    if (entry.cleanupStopAfterRootCause) {
      const cleanupIndex = result.reasons.findIndex((reason) => reason.startsWith('STOP_CLEANUP_UNVERIFIED@'));
      assert.ok(cleanupIndex > 0, `later cleanup STOP must follow the root cause: ${result.reasons.join(',')}`);
    }
    if (entry.requiresL6Complete) {
      assert.equal(result.steps.find((step) => step.step === 'L6').evidence.rounds, 5,
        'this PARTIAL is after L6 completed all five race rounds');
    }
  });
}

test('P1-14 a STOP inside L6 round 3 is INCONCLUSIVE with the race STOP as the root cause', () => {
  const steps = STEP_IDS.slice(0, 6).map((step) => passStep(step));
  steps.push({
    step: 'L6',
    status: 'UNRESOLVABLE',
    reason: 'STOP_RACE_BARRIER',
    anomalies: [],
    evidence: { rounds: 3, stopped: true },
  });
  const result = computeVerdict({ steps, stop: { rule: 'RACE_BARRIER', step: 'L6' } });
  assert.equal(result.verdict, 'INCONCLUSIVE');
  assert.equal(result.rule, 'INCONCLUSIVE_BEFORE_L6_COMPLETE');
  assert.equal(result.l6Complete, false);
  assert.equal(result.unresolved, true);
  assert.deepEqual(result.reasons, ['STOP_RACE_BARRIER@L6']);
});

test('P1-14 a STOP at L12 after every step passed is PARTIAL, never GO', () => {
  const result = computeVerdict({
    steps: allPass(),
    stop: { rule: 'CLEANUP_UNVERIFIED', step: 'L12' },
  });
  assert.equal(result.verdict, 'PARTIAL');
  assert.equal(result.rule, 'PARTIAL_LIMITING_CONDITION');
  assert.equal(result.l6Complete, true);
  assert.equal(result.unresolved, true);
  assert.deepEqual(result.reasons, ['STOP_CLEANUP_UNVERIFIED@L12']);
});

test('P1-14 NO-GO evidence always wins over a later STOP and stays first in the reasons', () => {
  const steps = allPass().map((step) => (step.step === 'L2'
    ? { step: 'L2', status: 'FAIL', reason: 'NO_GO_CREATE_OVERWRITE', anomalies: [], evidence: {} }
    : step));
  const result = computeVerdict({
    steps,
    stop: { rule: 'CLEANUP_UNVERIFIED', step: 'L12' },
  });
  assert.equal(result.verdict, 'NO-GO');
  assert.equal(result.rule, 'NO_GO_EVIDENCE');
  assert.equal(result.reasons[0], 'NO_GO_CREATE_OVERWRITE@L2');
  assert.ok(result.reasons.includes('STOP_CLEANUP_UNVERIFIED@L12'));
  assert.equal(result.unresolved, false);
});
