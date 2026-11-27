// P0-STORE Phase 1 - A90 §6 verdict rules (GO / PARTIAL / NO-GO) and STOP interaction.
//
// Pure function over the per-step oracle results and the recorded STOP. Order of precedence is fixed:
//   1. any hard NO-GO evidence (lost update, create-only overwrite, stale conditional delete,
//      invalid precondition accepted, acknowledged winner bytes lost) -> NO-GO, regardless of STOP;
//   2. a STOP or any unresolvable evidence without NO-GO -> PARTIAL with `unresolved: true`;
//   3. GO only when L0-L12 all pass, L2/L5/L6/L7 prove CAS, L3 is consistent and immediately visible
//      with a strong validator, L8 is determinable 3/3, L11 hashes are equal, L12 cleaned the
//      namespace and no anomaly or STOP was recorded;
//   4. otherwise PARTIAL with the specific compensating reason(s) (weak validator, delayed/stale
//      visibility, late ACK unresolvable).
import { ANOMALIES, isNoGo } from './oracle.mjs';

const REQUIRED_STEPS = Object.freeze([
  'L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10', 'L11', 'L12',
]);

export const VERDICTS = Object.freeze(['GO', 'PARTIAL', 'NO-GO']);

function indexSteps(steps) {
  const map = new Map();
  for (const result of steps || []) {
    if (result && typeof result.step === 'string') map.set(result.step, result);
  }
  return map;
}

function noGoResult(byStep) {
  for (const step of REQUIRED_STEPS) {
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

function goEligible(byStep) {
  for (const step of REQUIRED_STEPS) {
    const result = byStep.get(step);
    if (!result || result.status !== 'PASS') return false;
  }
  const l3 = byStep.get('L3');
  if (l3.evidence.immediate !== true) return false;
  if (l3.evidence.weakValidator === true) return false;
  const l6 = byStep.get('L6');
  if (l6.evidence.confirmed !== 5 || l6.evidence.unresolvedRounds !== 0) return false;
  const l8 = byStep.get('L8');
  if (l8.evidence.resolved !== 3) return false;
  const l11 = byStep.get('L11');
  if (l11.evidence.hashesEqual !== true) return false;
  const l12 = byStep.get('L12');
  if (l12.evidence.empty !== true) return false;
  if (allAnomalies(byStep).length > 0) return false;
  return true;
}

function partialReasons(byStep, stop) {
  const reasons = [];
  const anomalies = allAnomalies(byStep);
  if (anomalies.includes(ANOMALIES.WEAK_VALIDATOR)) reasons.push('WEAK_VALIDATOR');
  if (anomalies.includes(ANOMALIES.STALE_READ_VISIBILITY) || anomalies.includes(ANOMALIES.VERIFY_STALE)) {
    reasons.push('STALE_READ_VISIBILITY');
  }
  const l8 = byStep.get('L8');
  if (l8 && (l8.status === 'UNRESOLVABLE' || (l8.anomalies || []).includes(ANOMALIES.LATE_ACK_UNRESOLVABLE))) {
    reasons.push('LATE_ACK_UNRESOLVABLE');
  }
  if (stop) reasons.push(`STOP_${stop.rule}`);
  const l12 = byStep.get('L12');
  if (l12 && l12.status !== 'PASS') reasons.push('CLEANUP_UNVERIFIED');
  return [...new Set(reasons)];
}

export function computeVerdict({ steps, stop = null } = {}) {
  const byStep = indexSteps(steps);
  const hardNoGo = noGoResult(byStep);
  if (hardNoGo) {
    return {
      verdict: 'NO-GO',
      rule: hardNoGo.reason,
      reasons: [hardNoGo.reason],
      unresolved: false,
      noGoStep: hardNoGo.step,
    };
  }
  if (stop) {
    return {
      verdict: 'PARTIAL',
      rule: `STOP_${stop.rule}`,
      reasons: partialReasons(byStep, stop),
      unresolved: true,
      noGoStep: null,
    };
  }
  if (goEligible(byStep)) {
    return { verdict: 'GO', rule: 'GO', reasons: [], unresolved: false, noGoStep: null };
  }
  const reasons = partialReasons(byStep, stop);
  if (reasons.length > 0) {
    return {
      verdict: 'PARTIAL',
      rule: reasons[0],
      reasons,
      unresolved: reasons.includes('LATE_ACK_UNRESOLVABLE') || reasons.includes('CLEANUP_UNVERIFIED'),
      noGoStep: null,
    };
  }
  return {
    verdict: 'PARTIAL',
    rule: 'UNRESOLVABLE',
    reasons: ['UNRESOLVABLE_EVIDENCE'],
    unresolved: true,
    noGoStep: null,
  };
}
