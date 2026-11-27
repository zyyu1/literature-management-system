// P0-STORE Phase 1 R2 - A90 §6 / A92 verdict rules and root-cause-first reasons.
//
// Four verdicts, in fixed precedence order:
//   1. NO-GO          any hard NO-GO evidence (lost update, create-only overwrite, stale delete,
//                     accepted invalid precondition, acknowledged-winner bytes lost);
//   2. INCONCLUSIVE   the run stopped or an outcome became unresolvable before L6 completed all five
//                     race rounds, and there is no NO-GO evidence: no CAS conclusion is possible;
//   3. PARTIAL        L6 completed all five rounds but a limiting condition (weak validator, delayed
//                     visibility, unresolvable late ACK, cleanup that cannot be verified, an earlier/
//                     later failing step) or a later STOP remains;
//   4. GO             every criterion passed and no STOP, anomaly or incomplete race was recorded.
//
// `reasons` are ordered root-cause first: the first failing or limiting step in L0..L12 supplies the
// first reason, formatted `<REASON>@<STEP>` (for example `STALE_READ_VISIBILITY@L2` before
// `STOP_CLEANUP_UNVERIFIED@L12`). Duplicate root causes keep their earliest step. `rule` names the
// deciding clause, not a step reason.
import { ANOMALIES, isNoGo } from './oracle.mjs';

const STEP_ORDER = Object.freeze([
  'L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10', 'L11', 'L12',
]);
const L6_COMPLETED_ROUNDS = 5;

export const VERDICTS = Object.freeze(['GO', 'PARTIAL', 'INCONCLUSIVE', 'NO-GO']);

export const VERDICT_RULES = Object.freeze({
  GO: 'GO_ALL_CRITERIA_PASSED',
  PARTIAL: 'PARTIAL_LIMITING_CONDITION',
  INCONCLUSIVE: 'INCONCLUSIVE_BEFORE_L6_COMPLETE',
  NO_GO: 'NO_GO_EVIDENCE',
});

const ANOMALY_REASON = Object.freeze({
  [ANOMALIES.WEAK_VALIDATOR]: 'WEAK_VALIDATOR',
  [ANOMALIES.STALE_READ_VISIBILITY]: 'STALE_READ_VISIBILITY',
  [ANOMALIES.VERIFY_STALE]: 'STALE_READ_VISIBILITY',
  [ANOMALIES.LATE_ACK_UNRESOLVABLE]: 'UNRESOLVABLE_LATE_ACK',
});

function indexSteps(steps) {
  const map = new Map();
  for (const result of steps || []) {
    if (result && typeof result.step === 'string') map.set(result.step, result);
  }
  return map;
}

function noGoResult(byStep) {
  for (const step of STEP_ORDER) {
    const result = byStep.get(step);
    if (isNoGo(result)) return result;
  }
  return null;
}

function allAnomalies(byStep) {
  const out = [];
  for (const result of byStep.values()) {
    for (const anomaly of result.anomalies || []) {
      if (!out.includes(anomaly)) out.push(anomaly);
    }
  }
  return out;
}

// "L6 completed all five rounds" is about evidence collection, not about a clean race outcome: a
// five-round race with no confirmed winner or with stale verification is still complete. A stopped,
// missing or short L6 is not.
function l6Completed(byStep) {
  const l6 = byStep.get('L6');
  if (!l6) return false;
  const evidence = l6.evidence && typeof l6.evidence === 'object' ? l6.evidence : {};
  if (Number.isInteger(evidence.rounds)) return evidence.rounds === L6_COMPLETED_ROUNDS;
  // Synthetic/legacy evidence without a round count: infer completion only from a fully confirmed
  // five-round PASS. Everything else is treated as not completed.
  return l6.status === 'PASS'
    && evidence.confirmed === L6_COMPLETED_ROUNDS
    && evidence.unresolvedRounds === 0;
}

function goEligible(byStep, stop) {
  if (stop !== null) return false;
  if (!l6Completed(byStep)) return false;
  for (const step of STEP_ORDER) {
    const result = byStep.get(step);
    if (!result || result.status !== 'PASS') return false;
  }
  const l3 = byStep.get('L3');
  const l3Evidence = l3.evidence || {};
  if (l3Evidence.immediate !== true) return false;
  if (l3Evidence.weakValidator === true) return false;
  const l6 = byStep.get('L6');
  const l6Evidence = l6.evidence || {};
  if (l6Evidence.confirmed !== 5 || l6Evidence.unresolvedRounds !== 0) return false;
  const l8 = byStep.get('L8');
  const l8Evidence = l8.evidence || {};
  if (l8Evidence.resolved !== 3) return false;
  const l11 = byStep.get('L11');
  const l11Evidence = l11.evidence || {};
  if (l11Evidence.hashesEqual !== true) return false;
  const l12 = byStep.get('L12');
  const l12Evidence = l12.evidence || {};
  if (l12Evidence.empty !== true) return false;
  if (allAnomalies(byStep).length > 0) return false;
  return true;
}

// The canonical root cause(s) contributed by one step. A failing/unresolvable step contributes its
// own reason first; a passing step can still contribute limiting anomalies (weak validator, delayed
// visibility, stale verification). The late-ACK outcome is named `UNRESOLVABLE_LATE_ACK` whichever
// internal anomaly spelling the oracle used.
function stepCauses(result) {
  if (!result) return [];
  const causes = [];
  const anomalies = result.anomalies || [];
  if (result.status !== 'PASS' && typeof result.reason === 'string' && result.reason.length > 0) {
    if (result.reason === 'L8_OUTCOME_UNRESOLVABLE'
      || anomalies.includes(ANOMALIES.LATE_ACK_UNRESOLVABLE)) {
      causes.push('UNRESOLVABLE_LATE_ACK');
    } else {
      causes.push(result.reason);
    }
  }
  for (const anomaly of anomalies) {
    const mapped = ANOMALY_REASON[anomaly];
    if (mapped) causes.push(mapped);
  }
  return [...new Set(causes)];
}

// Root-cause-first reason list. Steps are visited in run order; the STOP cause is inserted at its own
// step position, after that step's own reason, so a later STOP can never precede an earlier root
// cause. Duplicate canonical causes keep their earliest occurrence.
function buildReasons(byStep, stop) {
  const reasons = [];
  const seen = new Set();
  const push = (step, reason) => {
    if (typeof reason !== 'string' || reason.length === 0 || seen.has(reason)) return;
    seen.add(reason);
    reasons.push(step === null || step === undefined ? reason : `${reason}@${step}`);
  };

  for (const step of STEP_ORDER) {
    const result = byStep.get(step);
    if (result) {
      for (const reason of stepCauses(result)) push(step, reason);
    }
    if (stop !== null && stop.step === step) push(step, `STOP_${stop.rule}`);
  }
  if (stop !== null && !STEP_ORDER.includes(stop.step)) {
    push(stop.step === undefined ? null : stop.step, `STOP_${stop.rule}`);
  }
  return reasons;
}

function hasUnresolvedStep(byStep) {
  for (const result of byStep.values()) {
    if (result.status === 'UNRESOLVABLE') return true;
  }
  return false;
}

function partialFallbackReason(byStep) {
  const l6 = byStep.get('L6');
  if (l6 && l6.evidence && Number.isInteger(l6.evidence.confirmed) && l6.evidence.confirmed < 5) {
    return 'L6_CONFIRMATION_INCOMPLETE@L6';
  }
  return 'INCOMPLETE_EVIDENCE';
}

export function computeVerdict({ steps, stop = null } = {}) {
  const byStep = indexSteps(steps);
  const reasons = buildReasons(byStep, stop);
  const completed = l6Completed(byStep);
  const hardNoGo = noGoResult(byStep);

  if (hardNoGo) {
    return {
      verdict: 'NO-GO',
      rule: VERDICT_RULES.NO_GO,
      reasons,
      unresolved: false,
      noGoStep: hardNoGo.step,
      l6Complete: completed,
    };
  }

  if (!completed) {
    if (reasons.length === 0) reasons.push('L6_INCOMPLETE@L6');
    return {
      verdict: 'INCONCLUSIVE',
      rule: VERDICT_RULES.INCONCLUSIVE,
      reasons,
      unresolved: true,
      noGoStep: null,
      l6Complete: false,
    };
  }

  if (goEligible(byStep, stop)) {
    return {
      verdict: 'GO',
      rule: VERDICT_RULES.GO,
      reasons: [],
      unresolved: false,
      noGoStep: null,
      l6Complete: true,
    };
  }

  return {
    verdict: 'PARTIAL',
    rule: VERDICT_RULES.PARTIAL,
    reasons: reasons.length > 0 ? reasons : [partialFallbackReason(byStep)],
    unresolved: stop !== null || hasUnresolvedStep(byStep),
    noGoStep: null,
    l6Complete: true,
  };
}
