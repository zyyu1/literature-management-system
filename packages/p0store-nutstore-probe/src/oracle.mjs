// P0-STORE Phase 1 - per-step oracles (A90 §4, §6; DESIGN §2).
//
// Pure classification only: no I/O, no clock, no network. The runner records an observation object
// per step and this module returns PASS / FAIL / UNRESOLVABLE plus a dedicated reason, an anomaly
// list (weak validators, delayed visibility, unresolvable late ACK) and sanitized evidence. Reasons
// starting with `NO_GO_` are the A90 §6 hard failures (lost update, create-only overwrite, stale
// conditional delete); verdict.mjs consumes them.
export const STEP_ORACLE_IDS = Object.freeze([
  'L0_TLS_AUTH', 'L1_MKCOL_SHAPE', 'L2_CREATE_ONLY', 'L3_ETAG_CONSISTENCY', 'L4_IDENTICAL_REWRITE',
  'L5_CONDITIONAL_UPDATE', 'L6_CROSS_PROCESS_RACE', 'L7_INVALID_AND_STALE', 'L8_LATE_ACK',
  'L9_ERROR_SEMANTICS', 'L10_MULTI_PARTIAL', 'L11_BACKUP_HASHES', 'L12_CLEANUP',
]);

export const ANOMALIES = Object.freeze({
  WEAK_VALIDATOR: 'WEAK_VALIDATOR',
  STALE_READ_VISIBILITY: 'STALE_READ_VISIBILITY',
  VERIFY_STALE: 'VERIFY_STALE',
  LATE_ACK_UNRESOLVABLE: 'LATE_ACK_UNRESOLVABLE',
});

export const NO_GO_REASONS = Object.freeze({
  CREATE_OVERWRITE: 'NO_GO_CREATE_OVERWRITE',
  STALE_WRITE_ACCEPTED: 'NO_GO_STALE_WRITE_ACCEPTED',
  STALE_DELETE_ACCEPTED: 'NO_GO_STALE_DELETE_ACCEPTED',
  INVALID_PRECONDITION_ACCEPTED: 'NO_GO_INVALID_PRECONDITION_ACCEPTED',
  ROUND_LOST_UPDATE: 'NO_GO_ROUND_LOST_UPDATE',
  VERIFY_MISMATCH: 'NO_GO_VERIFY_MISMATCH',
});

const NO_GO_SET = new Set(Object.values(NO_GO_REASONS));

function pass(step, evidence = {}, anomalies = []) {
  return { step, status: 'PASS', reason: null, anomalies: [...new Set(anomalies)], evidence };
}
function fail(step, reason, evidence = {}) {
  return { step, status: 'FAIL', reason, anomalies: [], evidence };
}
function unresolved(step, reason, evidence = {}, anomalies = []) {
  return { step, status: 'UNRESOLVABLE', reason, anomalies: [...new Set(anomalies)], evidence };
}

function isStatus(value, expected) {
  return Number.isInteger(value) && value === expected;
}
function is2xx(status) {
  return Number.isInteger(status) && status >= 200 && status < 300;
}
function isWeak(etag) {
  return typeof etag === 'string' && etag.startsWith('W/');
}
function allWeak(etags) {
  const present = etags.filter((etag) => typeof etag === 'string');
  return present.length > 0 && present.every(isWeak);
}

function evaluateL0(obs) {
  if (obs.tlsError) return fail('L0', 'L0_TLS_ERROR', {});
  if (obs.optionsUnauth.redirect || obs.propfindUnauth.redirect || obs.propfindAuth.redirect) {
    return fail('L0', 'L0_REDIRECTED', {});
  }
  if (!isStatus(obs.optionsUnauth.status, 401)) return fail('L0', 'L0_OPTIONS_UNAUTH_NOT_401', { status: obs.optionsUnauth.status });
  if (!isStatus(obs.propfindUnauth.status, 401)) return fail('L0', 'L0_PROPFIND_UNAUTH_NOT_401', { status: obs.propfindUnauth.status });
  if (!isStatus(obs.propfindAuth.status, 207)) return fail('L0', 'L0_PROPFIND_AUTH_NOT_207', { status: obs.propfindAuth.status });
  if (typeof obs.propfindAuth.dav !== 'string' || obs.propfindAuth.dav.length === 0) {
    return fail('L0', 'L0_DAV_HEADER_MISSING', {});
  }
  return pass('L0', { dav: obs.propfindAuth.dav });
}

function evaluateL1(obs) {
  if (obs.mkcol.redirect || obs.propfind.redirect) return fail('L1', 'L1_REDIRECTED', {});
  if (!isStatus(obs.mkcol.status, 201)) return fail('L1', 'L1_MKCOL_NOT_CREATED', { status: obs.mkcol.status });
  if (!isStatus(obs.propfind.status, 207)) return fail('L1', 'L1_PROPFIND_NOT_207', { status: obs.propfind.status });
  if (obs.propfind.collection !== true) return fail('L1', 'L1_NOT_A_COLLECTION', {});
  if (obs.propfind.shape && (obs.propfind.shape.resourcetype !== true || obs.propfind.shape.getlastmodified !== true)) {
    return fail('L1', 'L1_PROPFIND_SHAPE_INVALID', obs.propfind.shape);
  }
  return pass('L1', { collection: true, shape: obs.propfind.shape || null });
}

function evaluateL2(obs) {
  if (!obs || !obs.create1 || !obs.create2 || !obs.get || !obs.propfind) {
    return unresolved('L2', 'L2_OBSERVATION_INCOMPLETE', {});
  }
  const anomalies = [];
  if (obs.create1.redirect || obs.create2.redirect || obs.get.redirect) return fail('L2', 'L2_REDIRECTED', {});
  if (!isStatus(obs.create1.status, 201)) return fail('L2', 'L2_CREATE_NOT_201', { status: obs.create1.status });
  if (is2xx(obs.create2.status)) {
    return fail('L2', NO_GO_REASONS.CREATE_OVERWRITE, { second: obs.create2.status });
  }
  if (!isStatus(obs.create2.status, 412) && !isStatus(obs.create2.status, 409)) {
    return fail('L2', 'L2_SECOND_CREATE_UNEXPECTED_STATUS', { status: obs.create2.status });
  }
  if (isStatus(obs.get.status, 200) && obs.get.bodySha256 === obs.firstBodySha256) {
    if (obs.propfind.etag !== undefined && obs.create1.etag !== undefined && obs.propfind.etag !== obs.create1.etag) {
      return fail('L2', 'L2_ETAG_MISMATCH', { create: obs.create1.etag, propfind: obs.propfind.etag });
    }
    return pass('L2', { secondCreateRejected: obs.create2.status });
  }
  if (isStatus(obs.get.status, 200) && obs.get.bodySha256 === obs.secondBodySha256) {
    return fail('L2', NO_GO_REASONS.CREATE_OVERWRITE, { read: 'second-body' });
  }
  if (isStatus(obs.get.status, 404) || obs.get.bodySha256 === obs.preBodySha256) {
    // The create was rejected but the immediate read is stale: a visibility anomaly, not an overwrite.
    return pass('L2', { secondCreateRejected: obs.create2.status, readStale: true }, [ANOMALIES.STALE_READ_VISIBILITY]);
  }
  return unresolved('L2', 'L2_READ_UNRESOLVABLE', { status: obs.get.status });
}

function evaluateL3(obs) {
  if (!obs || !obs.put || !Array.isArray(obs.reads) || !obs.propfind || !obs.head) {
    return unresolved('L3', 'L3_OBSERVATION_INCOMPLETE', {});
  }
  const anomalies = [];
  if (obs.put.redirect) return fail('L3', 'L3_REDIRECTED', {});
  if (!is2xx(obs.put.status)) return fail('L3', 'L3_UPDATE_REJECTED', { status: obs.put.status });
  const expectedEtag = obs.put.etag;
  if (typeof expectedEtag !== 'string' || expectedEtag.length === 0) return fail('L3', 'L3_PUT_ETAG_MISSING', {});
  if (obs.reads.length !== 3) return fail('L3', 'L3_READ_COUNT', { count: obs.reads.length });

  for (const [index, read] of obs.reads.entries()) {
    if (read.status !== 200) return fail('L3', 'L3_READ_STATUS', { index, status: read.status });
  }
  const immediate = obs.reads[0].etag === expectedEtag && obs.reads[0].bodySha256 === obs.bodySha256;
  const later = obs.reads[1].etag === expectedEtag && obs.reads[1].bodySha256 === obs.bodySha256
    && obs.reads[2].etag === expectedEtag && obs.reads[2].bodySha256 === obs.bodySha256;
  const allMatch = immediate && later;
  const weak = allWeak([
    expectedEtag, obs.reads[0].etag, obs.reads[1].etag, obs.reads[2].etag, obs.propfind.etag, obs.head.etag,
  ]);
  if (weak) anomalies.push(ANOMALIES.WEAK_VALIDATOR);
  if (!obs.finalRead || obs.finalRead.status !== 200 || obs.finalRead.etag !== expectedEtag
    || obs.finalRead.bodySha256 !== obs.bodySha256) {
    return fail('L3', 'L3_FINAL_READ_INCONSISTENT', { status: obs.finalRead ? obs.finalRead.status : null });
  }
  if (!allMatch) {
    if (!immediate && later) {
      anomalies.push(ANOMALIES.STALE_READ_VISIBILITY);
      return pass('L3', { immediate: false, delayed: true, weakValidator: weak }, anomalies);
    }
    return fail('L3', 'L3_READ_INCONSISTENT', {
      put: expectedEtag,
      reads: obs.reads.map((read) => ({ etag: read.etag, body: read.bodySha256 })),
      expectedBody: obs.bodySha256,
    });
  }
  return pass('L3', { immediate, delayed: false, weakValidator: weak }, anomalies);
}

function evaluateL4(obs) {
  if (!obs || !obs.put || !obs.get || !obs.head) return unresolved('L4', 'L4_OBSERVATION_INCOMPLETE', {});
  if (obs.put.redirect) return fail('L4', 'L4_REDIRECTED', {});
  if (!is2xx(obs.put.status)) return fail('L4', 'L4_REWRITE_REJECTED', { status: obs.put.status });
  if (!isStatus(obs.get.status, 200)) return fail('L4', 'L4_READ_STATUS', { status: obs.get.status });
  if (obs.get.bodySha256 !== obs.priorBodySha256) return fail('L4', 'L4_BODY_CHANGED', {});
  if (obs.head.status !== 200 || obs.head.etag !== obs.put.etag) {
    return fail('L4', 'L4_HEAD_ETAG_INCONSISTENT', { put: obs.put.etag, head: obs.head.etag });
  }
  return pass('L4', {
    validatorChangedOnIdenticalRewrite: obs.put.etag !== obs.priorEtag,
    validatorStableOnIdenticalRewrite: obs.put.etag === obs.priorEtag,
  });
}

function evaluateL5(obs) {
  if (!obs || !obs.update || !obs.stale || !obs.get || !obs.propfind || !obs.head) {
    return unresolved('L5', 'L5_OBSERVATION_INCOMPLETE', {});
  }
  if (obs.update.redirect) return fail('L5', 'L5_REDIRECTED', {});
  if (!is2xx(obs.update.status)) return fail('L5', 'L5_UPDATE_REJECTED', { status: obs.update.status });
  if (is2xx(obs.stale.status)) return fail('L5', NO_GO_REASONS.STALE_WRITE_ACCEPTED, { status: obs.stale.status });
  if (!isStatus(obs.stale.status, 412) && !isStatus(obs.stale.status, 409)) {
    return fail('L5', 'L5_STALE_UNEXPECTED_STATUS', { status: obs.stale.status });
  }
  const anomalies = [];
  if (obs.get.status === 200 && obs.get.bodySha256 === obs.expectedBodySha256) {
    // winner bytes survived
  } else if (obs.get.status === 200 && obs.get.bodySha256 === obs.preBodySha256) {
    anomalies.push(ANOMALIES.STALE_READ_VISIBILITY);
  } else {
    return fail('L5', 'L5_BYTES_CHANGED', { status: obs.get.status });
  }
  if (obs.propfind.etag !== obs.update.etag) {
    if (obs.propfind.etag === obs.preEtag) anomalies.push(ANOMALIES.STALE_READ_VISIBILITY);
    else return fail('L5', 'L5_ETAG_INCONSISTENT', { update: obs.update.etag, propfind: obs.propfind.etag });
  }
  if (obs.head.status !== 200 || obs.head.etag !== obs.update.etag) {
    return fail('L5', 'L5_HEAD_ETAG_INCONSISTENT', { update: obs.update.etag, head: obs.head.etag });
  }
  return pass('L5', { staleRejected: obs.stale.status }, anomalies);
}

function evaluateL6(obs) {
  if (!Array.isArray(obs.rounds) || obs.rounds.length === 0) {
    return fail('L6', 'L6_ROUND_COUNT', { count: 0 });
  }
  // Hard NO-GO first: a round with two accepted writers is a lost update even if the run stopped
  // before all five rounds completed.
  for (const round of obs.rounds) {
    if (!Array.isArray(round.pids) || round.pids.length !== 2
      || !Number.isSafeInteger(round.pids[0]) || !Number.isSafeInteger(round.pids[1])
      || round.pids[0] === round.pids[1]) {
      return fail('L6', 'L6_WRITER_PID_INVALID', { round: round.round, pids: round.pids });
    }
    if (!Array.isArray(round.statuses) || !Array.isArray(round.bodySha256) || !Array.isArray(round.etags)) {
      return unresolved('L6', 'L6_ROUND_INCOMPLETE', { round: round.round });
    }
    if (round.resultPids && (round.resultPids[0] !== round.pids[0] || round.resultPids[1] !== round.pids[1])) {
      return fail('L6', 'L6_WRITER_PID_MISMATCH', { round: round.round });
    }
    if (Array.isArray(round.statuses) && round.statuses.length === 2
      && round.statuses.filter((status) => is2xx(status)).length === 2) {
      return fail('L6', NO_GO_REASONS.ROUND_LOST_UPDATE, { round: round.round });
    }
  }
  if (obs.rounds.length !== 5) return fail('L6', 'L6_ROUND_COUNT', { count: obs.rounds.length });
  const anomalies = [];
  let confirmed = 0;
  let staleVerify = 0;
  let unresolvedRounds = 0;
  for (const round of obs.rounds) {
    const winners = round.statuses.filter((status) => is2xx(status)).length;
    const conflicts = round.statuses.filter((status) => status === 412 || status === 409).length;
    if (winners !== 1 || conflicts !== 1) {
      unresolvedRounds += 1;
      continue;
    }
    const winnerIndex = round.statuses.findIndex((status) => is2xx(status));
    const winnerBody = round.bodySha256[winnerIndex];
    const winnerEtag = round.etags[winnerIndex];
    if (round.finalSha256 === winnerBody && (winnerEtag === null || round.finalEtag === winnerEtag)) {
      confirmed += 1;
      continue;
    }
    if (round.finalSha256 === round.preSha256) {
      staleVerify += 1;
      anomalies.push(ANOMALIES.VERIFY_STALE);
      continue;
    }
    if (round.finalSha256 === round.bodySha256[1 - winnerIndex]) {
      return fail('L6', NO_GO_REASONS.VERIFY_MISMATCH, { round: round.round });
    }
    unresolvedRounds += 1;
  }
  const evidence = { rounds: obs.rounds.length, confirmed, staleVerify, unresolvedRounds };
  if (unresolvedRounds > 0) return unresolved('L6', 'L6_ROUND_UNRESOLVABLE', evidence, anomalies);
  return pass('L6', evidence, anomalies);
}

function evaluateL7(obs) {
  if (!obs || !obs.weak || !obs.garbage || !obs.missingTarget || !obs.staleDelete || !obs.get) {
    return unresolved('L7', 'L7_OBSERVATION_INCOMPLETE', {});
  }
  if (obs.weak.redirect || obs.staleDelete.redirect) return fail('L7', 'L7_REDIRECTED', {});
  const invalidAccepted = [obs.weak, obs.garbage].filter((entry) => is2xx(entry.status));
  if (invalidAccepted.length > 0) {
    return fail('L7', NO_GO_REASONS.INVALID_PRECONDITION_ACCEPTED, { accepted: invalidAccepted.length });
  }
  if (![400, 412, 428].includes(obs.weak.status)) return fail('L7', 'L7_WEAK_VALIDATOR_STATUS', { status: obs.weak.status });
  if (![400, 412, 428].includes(obs.garbage.status)) return fail('L7', 'L7_GARBAGE_VALIDATOR_STATUS', { status: obs.garbage.status });
  if (![404, 412].includes(obs.missingTarget.status)) {
    if (is2xx(obs.missingTarget.status)) return fail('L7', NO_GO_REASONS.INVALID_PRECONDITION_ACCEPTED, { missingTarget: obs.missingTarget.status });
    return fail('L7', 'L7_MISSING_TARGET_STATUS', { status: obs.missingTarget.status });
  }
  if (is2xx(obs.staleDelete.status)) {
    return fail('L7', NO_GO_REASONS.STALE_DELETE_ACCEPTED, { status: obs.staleDelete.status });
  }
  if (!isStatus(obs.staleDelete.status, 412) && !isStatus(obs.staleDelete.status, 409)) {
    return fail('L7', 'L7_STALE_DELETE_STATUS', { status: obs.staleDelete.status });
  }
  if (!isStatus(obs.get.status, 200)) return fail('L7', 'L7_FILE_MISSING_AFTER_STALE_DELETE', { status: obs.get.status });
  const anomalies = [];
  if (obs.get.bodySha256 === obs.preBodySha256) anomalies.push(ANOMALIES.STALE_READ_VISIBILITY);
  else if (obs.get.bodySha256 !== obs.expectedBodySha256) return fail('L7', 'L7_FILE_CHANGED', {});
  return pass('L7', { staleDeleteRejected: obs.staleDelete.status }, anomalies);
}

function evaluateL8(obs) {
  if (!Array.isArray(obs.rounds) || obs.rounds.length !== 3) {
    return fail('L8', 'L8_ROUND_COUNT', { count: Array.isArray(obs.rounds) ? obs.rounds.length : 0 });
  }
  let committed = 0;
  let notCommitted = 0;
  for (const round of obs.rounds) {
    if (round.attempted !== true) return fail('L8', 'L8_ATTEMPT_MISSING', { round: round.round });
    if (round.resolution === 'COMMITTED') committed += 1;
    else if (round.resolution === 'NOT_COMMITTED') notCommitted += 1;
  }
  const resolved = committed + notCommitted;
  const evidence = { rounds: obs.rounds.length, committed, notCommitted, resolved };
  if (resolved !== 3) {
    return unresolved('L8', 'L8_OUTCOME_UNRESOLVABLE', evidence, [ANOMALIES.LATE_ACK_UNRESOLVABLE]);
  }
  return pass('L8', evidence);
}

function evaluateL9(obs) {
  if (obs.missingCollection.redirect) return fail('L9', 'L9_REDIRECTED', {});
  if (!isStatus(obs.missingCollection.status, 409)) {
    return fail('L9', 'L9_MISSING_COLLECTION_STATUS', { status: obs.missingCollection.status });
  }
  if (!isStatus(obs.missingFile.status, 404)) return fail('L9', 'L9_MISSING_FILE_STATUS', { status: obs.missingFile.status });
  if (!obs.oversized.refusedCode) return fail('L9', 'L9_OVERSIZED_NOT_REFUSED_LOCALLY', {});
  if (!obs.outside.refusedCode) return fail('L9', 'L9_OUTSIDE_PATH_NOT_REFUSED_LOCALLY', {});
  if (obs.oversized.egress !== 0 || obs.outside.egress !== 0) return fail('L9', 'L9_REFUSAL_EGRESS', {});
  return pass('L9', {
    missingCollection: obs.missingCollection.status,
    missingFile: obs.missingFile.status,
    oversizedRefused: obs.oversized.refusedCode,
    outsideRefused: obs.outside.refusedCode,
  });
}

function evaluateL10(obs) {
  if (!obs || !obs.journalPut || !obs.abortedPut || !obs.getJournal || !obs.getData
    || !obs.dataPut || !obs.propfind) {
    return unresolved('L10', 'L10_OBSERVATION_INCOMPLETE', {});
  }
  if (obs.journalPut.redirect) return fail('L10', 'L10_REDIRECTED', {});
  if (!isStatus(obs.journalPut.status, 201)) return fail('L10', 'L10_JOURNAL_NOT_CREATED', { status: obs.journalPut.status });
  if (obs.abortedPut.aborted !== true) return fail('L10', 'L10_ABORT_NOT_OBSERVED', {});
  if (!isStatus(obs.getJournal.status, 200)) return fail('L10', 'L10_JOURNAL_MISSING', { status: obs.getJournal.status });
  const partialStateObserved = isStatus(obs.getData.status, 404);
  if (!isStatus(obs.getData.status, 404) && !isStatus(obs.getData.status, 200)) {
    return unresolved('L10', 'L10_DATA_STATE_UNRESOLVABLE', { status: obs.getData.status });
  }
  if (!isStatus(obs.dataPut.status, 201) && !isStatus(obs.dataPut.status, 204)) {
    return fail('L10', 'L10_DATA_NOT_WRITTEN', { status: obs.dataPut.status });
  }
  if (!isStatus(obs.propfind.status, 207)) return fail('L10', 'L10_PROPFIND_STATUS', { status: obs.propfind.status });
  if (obs.propfind.hasJournal !== true || obs.propfind.hasData !== true) {
    return fail('L10', 'L10_TWO_FILES_NOT_VISIBLE', { count: obs.propfind.count });
  }
  return pass('L10', { partialStateObserved, nonAtomicMeasured: true });
}

function evaluateL11(obs) {
  if (!obs || !Array.isArray(obs.sources) || !Array.isArray(obs.restores) || !Array.isArray(obs.readbacks)) {
    return unresolved('L11', 'L11_OBSERVATION_INCOMPLETE', {});
  }
  if (obs.sources.length !== 3) return fail('L11', 'L11_SOURCE_COUNT', {});
  for (const source of obs.sources) {
    if (source.status !== 200 || typeof source.sha256 !== 'string') {
      return fail('L11', 'L11_SOURCE_READ_FAILED', { id: source.id, status: source.status });
    }
  }
  for (const restore of obs.restores) {
    if (!is2xx(restore.status)) return fail('L11', 'L11_RESTORE_FAILED', { id: restore.id, status: restore.status });
  }
  for (const readback of obs.readbacks) {
    const source = obs.sources.find((entry) => entry.id === readback.sourceId);
    if (!source) return fail('L11', 'L11_READBACK_SOURCE_UNKNOWN', { id: readback.id });
    if (readback.status !== 200 || readback.sha256 !== source.sha256) {
      return fail('L11', 'L11_HASH_MISMATCH', { id: readback.id });
    }
  }
  return pass('L11', { sources: obs.sources.length, restores: obs.restores.length, hashesEqual: true });
}

function evaluateL12(obs) {
  if (!obs || !Array.isArray(obs.deletes) || !obs.propfind || !obs.runDir) {
    return unresolved('L12', 'L12_OBSERVATION_INCOMPLETE', {});
  }
  if (obs.deletes.length === 0) return fail('L12', 'L12_NO_DELETES', {});
  for (const entry of obs.deletes) {
    const ok = entry.status === 204 || entry.status === 200 || entry.status === 404;
    if (!ok) return fail('L12', 'L12_DELETE_FAILED', { fileId: entry.fileId, status: entry.status });
  }
  if (obs.propfind.count !== 0) return fail('L12', 'L12_NAMESPACE_NOT_EMPTY', { count: obs.propfind.count });
  if (!isStatus(obs.runDir.status, 207)) return fail('L12', 'L12_RUN_DIRECTORY_MISSING', { status: obs.runDir.status });
  return pass('L12', { deleted: obs.deletes.length, empty: true });
}

const EVALUATORS = Object.freeze({
  L0: evaluateL0,
  L1: evaluateL1,
  L2: evaluateL2,
  L3: evaluateL3,
  L4: evaluateL4,
  L5: evaluateL5,
  L6: evaluateL6,
  L7: evaluateL7,
  L8: evaluateL8,
  L9: evaluateL9,
  L10: evaluateL10,
  L11: evaluateL11,
  L12: evaluateL12,
});

export function evaluateStep(step, observation) {
  const evaluator = EVALUATORS[step];
  if (!evaluator) throw new Error(`unknown step oracle: ${String(step)}`);
  if (observation === null || typeof observation !== 'object') {
    return unresolved(step, `${step}_OBSERVATION_MISSING`, {});
  }
  return evaluator(observation);
}

export function isNoGo(result) {
  return result !== null && typeof result === 'object' && NO_GO_SET.has(result.reason);
}
