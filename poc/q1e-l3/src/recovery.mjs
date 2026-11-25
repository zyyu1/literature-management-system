// Q1E-L3 (D007-A37) — logical deletion high-watermark witness, simulated authenticated archives and
// ISOLATED STAGE-ONLY restore. LOCAL / SYNTHETIC / MODEL_ONLY.
//
// The witness is a logically separate mock trust domain used to show WHY external anti-rollback evidence is
// required; it is not an independent hardware/store witness. Archive "authentication" uses an HMAC over the
// fixture-only encoding with a random per-test synthetic key: it is a FIXTURE_ONLY tag, not a production
// signature, key custody or approved serialization. There is deliberately NO active cutover in this module.
import crypto from 'node:crypto';
import { fixtureEncode, digest, EVIDENCE } from './snapshot.mjs';
import { validateGraph, ModelError } from './model.mjs';

export const RESTORE = Object.freeze({
  STAGED: 'STAGED_ONLY_NOT_CUTOVER',
  STALE: 'RESTORE_BLOCKED_STALE_DELETION_STATE',
  WITNESS: 'DELETION_WITNESS_UNVERIFIABLE',
  RECONCILE: 'DELETION_WITNESS_RECONCILIATION_PENDING',
  ROLLBACK: 'STORE_ROLLBACK_DETECTED',
  AUTH: 'ARCHIVE_AUTHENTICATION_FAILED',
  KEY: 'KEY_UNAVAILABLE',
  POLICY: 'POLICY_DECISION_PENDING',
  STAGE_FAILED: 'STAGE_FAILED_ACTIVE_UNCHANGED',
  INVALID: 'STAGE_VALIDATION_FAILED',
});

/** Logically separate deletion high-watermark (trust domain "witness"), monotonic unless a test attacks it. */
export function createWitness({ domain = 'witness-domain' } = {}) {
  let hw = { checkpoint: 0, deleted: new Map(), seq: 0 };
  const history = [structuredClone(hw)];
  return {
    domain,
    get latest() { return hw; },
    /** Advance with a confirmed deletion at `checkpoint` (monotonic). */
    advance(projectId, checkpoint) {
      if (checkpoint < hw.checkpoint) throw new ModelError('WITNESS_NOT_MONOTONIC', `${checkpoint} < ${hw.checkpoint}`);
      hw = { checkpoint, deleted: new Map(hw.deleted).set(projectId, checkpoint), seq: hw.seq + 1 };
      history.push(structuredClone(hw));
    },
    /** Attack helpers (tests only). */
    rollbackTo(seq) { hw = structuredClone(history[seq]); },
    erase() { hw = null; },
    history: () => history.map((h) => ({ checkpoint: h.checkpoint, seq: h.seq })),
  };
}

/** Archive of a pinned export, tagged with a FIXTURE_ONLY HMAC bound to owner + keyId + manifest (AAD). */
export function makeArchive(exported, { keyId, key, domain = 'archive-domain' }) {
  const b = exported.bundle;
  const manifest = { owner: b.owner, checkpoint: b.checkpoint, ids: b.records.map((r) => [r.id, r.rev]), recordsDigest: digest(b.records), keyId, domain };
  const tag = crypto.createHmac('sha256', key).update(fixtureEncode({ aad: { owner: b.owner, keyId }, manifest })).digest('hex');
  return { manifest, records: structuredClone(b.records), tag, tagKind: 'FIXTURE_ONLY_HMAC', plainChecksum: digest(b.records) };
}

/** Verify an archive with a keyring (Map keyId -> key). SHA alone is never authentication. */
export function verifyArchive(archive, { keyring, owner }) {
  const key = keyring.get(archive.manifest.keyId);
  if (!key) return { ok: false, code: RESTORE.KEY, detail: 'backup key version not available; never regenerated from a password reset' };
  if (archive.manifest.owner !== owner) return { ok: false, code: RESTORE.AUTH, detail: 'owner/AAD mismatch' };
  const expect = crypto.createHmac('sha256', key).update(fixtureEncode({ aad: { owner, keyId: archive.manifest.keyId }, manifest: archive.manifest })).digest('hex');
  const a = Buffer.from(expect, 'hex');
  const t = Buffer.from(String(archive.tag), 'hex');
  if (a.length !== t.length || !crypto.timingSafeEqual(a, t)) return { ok: false, code: RESTORE.AUTH, detail: 'tag mismatch' };
  if (digest(archive.records) !== archive.manifest.recordsDigest) return { ok: false, code: RESTORE.AUTH, detail: 'records do not match the authenticated manifest' };
  return { ok: true };
}

/**
 * Isolated stage-only restore. Order of gates: authenticity -> witness availability/independence -> store
 * rollback -> pending deletion reconciliation -> stale deletion state -> privacy/retention policy -> stage
 * into a FRESH namespace (never the active store) -> validate exact identities/links/revisions/bytes.
 * `fault(step)` may throw to simulate a crash mid-stage; the stage is then discarded.
 */
export function stageRestore(archive, { keyring, owner, witness, activeStore, minWitnessSeq, pendingDeletions = new Set(), privacyRequests = [], retentionPolicy = null, fault = () => {} }) {
  const auth = verifyArchive(archive, { keyring, owner });
  if (!auth.ok) return { status: auth.code, detail: auth.detail, stage: null };
  if (!witness || witness.latest === null) return { status: RESTORE.WITNESS, detail: 'latest deletion witness missing', stage: null };
  if (witness.domain === archive.manifest.domain) return { status: RESTORE.WITNESS, detail: 'witness shares the archive trust domain; cannot self-certify staleness', stage: null };
  // A44/P2-L3-QA-1: the anti-rollback floor is an EXPLICIT operator fixture value, never an implicit genesis 0 and
  // never derived from the archive, the replayable store or the candidate witness at restore time. Missing,
  // non-number, non-safe-integer and negative values fail closed before reconciliation/rollback comparisons and
  // before any staging allocation; no coercion and no default. Numeric validity alone does not prove the floor's
  // origin or freshness (that stays outside the modelled trust); explicit 0 is only a known-genesis fixture value.
  if (typeof minWitnessSeq !== 'number' || !Number.isSafeInteger(minWitnessSeq) || minWitnessSeq < 0 || Object.is(minWitnessSeq, -0)) {
    return { status: RESTORE.WITNESS, reason: 'ROLLBACK_RESISTANCE_UNVERIFIED', detail: 'explicit non-negative safe-integer minWitnessSeq fixture floor is required; absent or invalid anchor is refused before staging', stage: null };
  }
  const hw = witness.latest;
  // A known, quarantined deletion intent explains a store/witness gap: reconcile it before anything else.
  if (pendingDeletions.size) return { status: RESTORE.RECONCILE, detail: [...pendingDeletions].join(','), stage: null };
  if (activeStore && activeStore.current().checkpoint < hw.checkpoint) return { status: RESTORE.ROLLBACK, detail: `active store checkpoint ${activeStore.current().checkpoint} < witness ${hw.checkpoint}`, stage: null };
  // A witness replayed/rolled back on its own: older than the last sequence the operator recorded, or missing a
  // deletion the active store has confirmed. Either way its freshness cannot be trusted.
  if (hw.seq < minWitnessSeq) return { status: RESTORE.WITNESS, detail: `witness seq ${hw.seq} < last seen ${minWitnessSeq}`, stage: null };
  if (activeStore) {
    for (const [pid, cp] of activeStore.current().deletions) {
      if (!(hw.deleted.get(pid) >= cp)) return { status: RESTORE.WITNESS, detail: `witness lacks confirmed deletion ${pid}@${cp}`, stage: null };
    }
  }
  const staleIds = archive.manifest.ids.map(([id]) => id).filter((id) => hw.deleted.has(id) && hw.deleted.get(id) > archive.manifest.checkpoint);
  if (staleIds.length) return { status: RESTORE.STALE, stale: staleIds, stage: null };
  if (privacyRequests.length && retentionPolicy === null) return { status: RESTORE.POLICY, detail: 'retention/erasure policy undecided; no invented retention period', stage: null };
  // ---- isolated staging namespace: new Maps, never the active store ----
  const records = new Map();
  const catalog = new Map();
  try {
    for (const r of archive.records) {
      fault('stage-record', r.id);
      records.set(r.id, { id: r.id, type: r.type, owner, rev: r.rev, data: structuredClone(r.data) });
      catalog.set(r.id, r.rev);
    }
    fault('stage-validate');
    validateGraph(records, catalog);
  } catch (e) {
    return { status: e instanceof ModelError ? RESTORE.INVALID : RESTORE.STAGE_FAILED, detail: String(e.message ?? e), stage: null };
  }
  const stageDigest = digest(archive.records.map((r) => ({ ...r, data: records.get(r.id).data })));
  if (stageDigest !== digest(archive.records)) return { status: RESTORE.INVALID, detail: 'staged bytes differ', stage: null };
  return { status: RESTORE.STAGED, stage: { records, catalog, namespace: `stage-${crypto.randomUUID()}` }, stageDigest, certification: EVIDENCE.BACKUP };
}

/** There is no authorized active cutover in A37. */
export function cutover() { throw new ModelError('CUTOVER_NOT_AUTHORIZED', 'live cutover requires a separate future authorization'); }

/**
 * A36-R03: confirmed Project deletion = store transaction + witness advance, two trust domains, no atomicity
 * between them. `order` chooses which happens first; `crashBetween` simulates a crash between the two steps.
 * Without both, the deletion is never reported CONFIRMED and a reconciliation intent is left (quarantined).
 */
export function confirmProjectDeletion({ store, witness, projectId, deleteTx, opId, order = 'store-first', crashBetween = false, pending }) {
  if (order === 'store-first') {
    const r = deleteTx();
    if (r.status !== 'CONFIRMED') return { status: r.status, step: 'store', reason: r.reason };
    pending.add(projectId);
    if (crashBetween) return { status: 'UNKNOWN', step: 'witness', reason: 'CRASH_BETWEEN_STORE_AND_WITNESS', quarantined: projectId };
    witness.advance(projectId, r.checkpoint);
    pending.delete(projectId);
    return { status: 'CONFIRMED', checkpoint: r.checkpoint };
  }
  // witness-first: announce the deletion at the next checkpoint, then commit
  const next = store.current().checkpoint + 1;
  pending.add(projectId);
  witness.advance(projectId, next);
  if (crashBetween) return { status: 'UNKNOWN', step: 'store', reason: 'CRASH_BETWEEN_WITNESS_AND_STORE', quarantined: projectId };
  const r = deleteTx();
  if (r.status !== 'CONFIRMED' || r.checkpoint !== next) return { status: 'UNKNOWN', step: 'store', reason: 'WITNESS_AND_STORE_DIVERGED', quarantined: projectId };
  pending.delete(projectId);
  return { status: 'CONFIRMED', checkpoint: r.checkpoint, opId };
}
