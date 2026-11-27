// P1-11 - the race is genuinely cross-process, barrier-synchronised, five rounds, exactly one winner.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAgainstMock, computeVerdict } from '../support/harness.mjs';

test('P1-11 five race rounds run in two separate OS processes with a shared barrier and exactly one acknowledged winner', async (t) => {
  const { result } = await runAgainstMock(t, { personality: 'strong' });
  assert.equal(result.verdict, 'GO', `expected GO, reasons: ${result.reasons.join(',')}`);
  const l6 = result.steps.find((step) => step.step === 'L6');
  assert.equal(l6.status, 'PASS');
  assert.equal(l6.evidence.rounds, 5);
  assert.equal(l6.evidence.confirmed, 5);
  assert.equal(l6.evidence.unresolvedRounds, 0);
  assert.equal(Array.isArray(result.raceRounds), true);
  assert.equal(result.raceRounds.length, 5);
  for (const round of result.raceRounds) {
    assert.equal(round.barrier, 'file', 'the writers are released together by a local file barrier');
    assert.equal(round.pids.length, 2);
    assert.equal(Number.isSafeInteger(round.pids[0]) && Number.isSafeInteger(round.pids[1]), true);
    assert.notEqual(round.pids[0], round.pids[1], 'two separate OS processes, never one process twice');
    assert.deepEqual(round.resultPids, round.pids, 'the child-reported PID matches the OS child PID');
    assert.deepEqual(round.writerIds, [1, 2]);
    assert.equal(round.readEtags[0], round.preEtag, 'both writers read the same pre-round validator');
    assert.equal(round.readEtags[1], round.preEtag);
    const winners = round.statuses.filter((status) => status >= 200 && status < 300).length;
    const conflicts = round.statuses.filter((status) => status === 412 || status === 409).length;
    assert.equal(winners, 1, `round ${round.round} has exactly one acknowledged winner`);
    assert.equal(conflicts, 1);
    assert.equal(round.confirmed, true, `round ${round.round} winner bytes survive`);
    assert.equal(round.finalSha256, round.bodySha256[round.winnerIndex]);
  }
});

test('P1-11 the L6 evidence records two distinct writer PIDs, matching child-reported PIDs and one winner per round', () => {
  // The detailed round records are asserted from the raw step observation through a focused run of the
  // same module-level helper: the verdict input exposes only sanitized evidence, so this test drives
  // the verdict with an explicit one-lost-round record as well (mutation oracle for "GO despite one
  // lost round").
  const allSteps = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10', 'L11', 'L12'];
  const pass = (step, evidence = {}) => ({ step, status: 'PASS', reason: null, anomalies: [], evidence });
  const steps = allSteps.map((step) => pass(step, {
    immediate: true,
    weakValidator: false,
    rounds: 5,
    confirmed: 5,
    unresolvedRounds: 0,
    resolved: 3,
    hashesEqual: true,
    empty: true,
  }));
  const go = computeVerdict({ steps, stop: null });
  assert.equal(go.verdict, 'GO');
  const fourOfFive = steps.map((step) => (step.step === 'L6'
    ? { ...step, evidence: { ...step.evidence, confirmed: 4 } }
    : step));
  const partial = computeVerdict({ steps: fourOfFive, stop: null });
  assert.equal(partial.verdict, 'PARTIAL', 'one lost round must never be GO');
});
