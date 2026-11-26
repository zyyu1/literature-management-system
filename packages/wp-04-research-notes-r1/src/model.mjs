// WP-04-R1 single in-memory Research Note model (LOCAL_SYNTHETIC_ONLY, MEMORY_ONLY).
// The frozen WP-02 read catalog is re-used READ-ONLY as the fixture validation gate; its immutable
// metadata objects are cloned into THIS model, which is the only mutable Research Note state for
// WP-04-R1. Project, association, Important, Reading Status and metadata state are never cloned as
// mutable state and are never written: WP-04-R1 has no cascade path.
//
// There is exactly one global note per canonical paper tuple (ownerScope, libraryType, libraryId,
// itemKey). A note is either absent (no confirmed note, no revision) or present with all five exact
// fields and one opaque server-generated whole-note revision. Revisions and the runId are derived
// from a per-instance random runId plus the frozen identity and a generation counter; they never
// come from a client value, the fixture literals or a clock.
import { createHash, randomBytes } from 'node:crypto';
import { createCatalog, NOTE_KEYS, paperKey } from '../../wp-02-project-paper-read/src/catalog.mjs';
import { fingerprint } from '../../wp-01-synthetic-auth-api/src/policy.mjs';

export { NOTE_KEYS, paperKey };

export const RUN_ID_RE = /^run_[A-Za-z0-9_-]{16,64}$/;
export const REVISION_RE = /^rev_[A-Za-z0-9_-]{16,64}$/;
export const NOTE_TARGET_PREFIX = 'note:';

// Test-only fault controls. They are NEVER reachable over HTTP and fault names are never returned.
export const FAULT = Object.freeze({
  MODEL_ACK: 'model_ack',
  NOT_DISPATCHED: 'not_dispatched',
  ACCEPTED_NOT_COMMITTED: 'accepted_not_committed',
  LOST_ACK_AFTER_COMMIT: 'lost_ack_after_commit',
  SOCKET_DROP_AFTER_COMMIT: 'socket_drop_after_commit',
  ERROR_AFTER_DISPATCH: 'error_after_dispatch',
});
export const FAULT_NAMES = Object.freeze(Object.values(FAULT));
const COMMITTING_FAULTS = new Set([
  FAULT.MODEL_ACK, FAULT.LOST_ACK_AFTER_COMMIT, FAULT.SOCKET_DROP_AFTER_COMMIT, FAULT.ERROR_AFTER_DISPATCH,
]);

export function noteTargetKey(pk) { return NOTE_TARGET_PREFIX + pk; }

const byString = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function cloneFields(source) {
  const fields = {};
  for (const key of NOTE_KEYS) fields[key] = source[key];
  return fields;
}

export function createResearchNoteModel({ wp01Fixture, wp02Fixture }) {
  if (!wp01Fixture || wp01Fixture.fixtureSchemaVersion !== 'WP01-SYNTHETIC-v1.0.0') {
    throw new Error('UNSAFE_CONFIG: not the frozen WP-01 synthetic fixture');
  }
  let catalog;
  try {
    catalog = createCatalog(wp02Fixture); // read-only validation gate, discarded after cloning
  } catch (e) {
    throw new Error('UNSAFE_CONFIG: invalid WP-02 frozen fixture: ' + e.message);
  }

  const runId = 'run_' + randomBytes(18).toString('base64url');
  const papers = new Map();
  const ledger = new Map(); // `${principalId}\u0000${operationId}` -> record
  const quarantined = new Map(); // targetKey -> { operationId, outcome, code }
  const stats = { dispatches: 0, commits: 0, replays: 0, unknownOutcomes: 0, conflicts: 0 };
  let nextFault = FAULT.MODEL_ACK;

  function revision(kind, identity, generation) {
    return 'rev_' + createHash('sha256')
      .update(`${runId}|${kind}|${identity}|${generation}`)
      .digest('base64url')
      .slice(0, 22);
  }

  let initialNotes = 0;
  for (const [pk, p] of catalog.papers) {
    let note = null;
    if (p.note !== null) {
      initialNotes += 1;
      note = { fields: cloneFields(p.note), generation: 1, revision: revision('note', pk, 1) };
    }
    papers.set(pk, {
      key: pk,
      ownerScope: p.ownerScope,
      libraryType: p.libraryType,
      libraryId: p.libraryId,
      itemKey: p.itemKey,
      title: p.title,
      creators: p.creators,
      year: p.year,
      doi: p.doi,
      readingStatus: p.readingStatus,
      note,
    });
  }
  if (initialNotes !== 1) {
    throw new Error('UNSAFE_CONFIG: frozen WP-02 fixture must carry exactly one initial note');
  }
  const validated = catalog.counts();
  if (papers.size !== validated.papers) {
    throw new Error('STOP: cloned note model paper count does not match the frozen catalog');
  }
  const frozenCatalogCounts = Object.freeze({
    projects: validated.projects,
    papers: validated.papers,
    associations: validated.associations,
  });

  const sortedPapers = () => [...papers.values()].sort((a, b) => byString(a.key, b.key));

  function paperByKey(pk) { return papers.get(pk) || null; }
  function paperByTuple(ownerScope, libraryType, libraryId, itemKey) {
    return papers.get(paperKey(ownerScope, libraryType, libraryId, itemKey)) || null;
  }
  function noteRecord(pk) {
    const p = papers.get(pk);
    return p ? p.note : null;
  }
  function noteView(pk) {
    const p = papers.get(pk);
    if (!p) return null;
    if (!p.note) return { exists: false };
    return { exists: true, fields: cloneFields(p.note.fields), revision: p.note.revision };
  }
  function noteRevision(pk) {
    const p = papers.get(pk);
    return p && p.note ? p.note.revision : null;
  }

  // The one synchronous whole-note transition. No per-field merge: every field is replaced.
  function writeNote(pk, fields) {
    const p = papers.get(pk);
    if (!p) throw new Error('STOP: note target does not exist');
    const generation = (p.note ? p.note.generation : 0) + 1;
    p.note = {
      fields: cloneFields(fields),
      generation,
      revision: revision('note', pk, generation),
    };
    return p.note;
  }

  function ledgerKey(principalId, operationId) { return principalId + '\u0000' + operationId; }
  function ledgerGet(principalId, operationId) { return ledger.get(ledgerKey(principalId, operationId)) || null; }
  function ledgerPut(record) { ledger.set(ledgerKey(record.principalId, record.operationId), record); }
  function ledgerSize() { return ledger.size; }
  function ledgerSnapshot() { return [...ledger.values()].map((r) => structuredClone(r)); }

  function isQuarantined(targetKey) { return quarantined.has(targetKey); }
  function quarantineTarget(targetKey, operationId, code) {
    quarantined.set(targetKey, { operationId, outcome: 'UNKNOWN', code });
  }
  // DESIGN §6: an UNKNOWN target is quarantined for new writes "until resolved by read". The
  // authorized GET research-note handler calls this after it has produced the current state.
  function clearQuarantine(targetKey) { quarantined.delete(targetKey); }
  function quarantineSnapshot() {
    return [...quarantined.entries()].map(([targetKey, v]) => ({ targetKey, ...v }));
  }

  function setNextFault(f) {
    if (!FAULT_NAMES.includes(f)) throw new Error('unknown fault scenario');
    nextFault = f;
  }
  function takeFault() { const f = nextFault; nextFault = FAULT.MODEL_ACK; return f; }

  // The one synchronous transition: dispatch decision + (optional) note mutation + counters.
  // The caller holds the ledger/state write in the same synchronous block.
  function dispatch(fault, apply) {
    if (fault === FAULT.NOT_DISPATCHED) {
      return { dispatched: false, committed: false, fault };
    }
    stats.dispatches += 1;
    if (!COMMITTING_FAULTS.has(fault)) {
      return { dispatched: true, committed: false, fault };
    }
    apply();
    stats.commits += 1;
    return { dispatched: true, committed: true, fault };
  }

  function counts() {
    return { papers: papers.size, notes: [...papers.values()].filter((p) => p.note !== null).length };
  }

  function canonicalState() {
    return {
      runId,
      catalog: frozenCatalogCounts,
      papers: sortedPapers().map((p) => [
        p.key, p.ownerScope, p.libraryType, p.libraryId, p.itemKey, p.title, p.creators, p.year, p.doi, p.readingStatus,
        p.note === null ? null : [p.note.revision, p.note.generation, ...NOTE_KEYS.map((k) => p.note.fields[k])],
      ]),
    };
  }
  function stateDigest() {
    return createHash('sha256').update(JSON.stringify(canonicalState())).digest('hex');
  }
  function ledgerDigest() {
    const rows = [...ledger.values()].sort((a, b) => byString(
      a.principalId + '\u0000' + a.operationId,
      b.principalId + '\u0000' + b.operationId,
    ));
    return createHash('sha256').update(JSON.stringify(rows)).digest('hex');
  }

  function paperMetadata(p) {
    return {
      key: p.key,
      ownerScope: p.ownerScope,
      libraryType: p.libraryType,
      libraryId: p.libraryId,
      itemKey: p.itemKey,
      title: p.title,
      creators: p.creators,
      year: p.year,
      doi: p.doi,
      readingStatus: p.readingStatus,
    };
  }

  // Deep copies only: no caller can mutate model state through a snapshot.
  function snapshot() {
    return structuredClone({
      runId,
      counts: counts(),
      catalog: frozenCatalogCounts,
      papers: sortedPapers().map((p) => ({
        ...paperMetadata(p),
        note: p.note === null ? null : {
          fields: cloneFields(p.note.fields),
          generation: p.note.generation,
          revision: p.note.revision,
        },
      })),
      ledger: ledgerSnapshot(),
      quarantine: quarantineSnapshot(),
      stats: { ...stats },
    });
  }
  function snapshotPaper(tuple) {
    const p = paperByTuple(tuple[0], tuple[1], tuple[2], tuple[3]);
    if (!p) return null;
    return structuredClone({ ...paperMetadata(p), noteRevision: noteRevision(p.key) });
  }
  function snapshotNote(tuple) {
    const p = paperByTuple(tuple[0], tuple[1], tuple[2], tuple[3]);
    if (!p) return null;
    return structuredClone(noteView(p.key));
  }
  function initialNoteTuples() {
    return sortedPapers()
      .filter((p) => p.note !== null)
      .map((p) => [p.ownerScope, p.libraryType, p.libraryId, p.itemKey]);
  }

  return {
    runId,
    counts,
    catalogCounts: () => ({ ...frozenCatalogCounts }),
    snapshot,
    stateDigest,
    ledgerDigest,
    ledgerSize,
    ledgerSnapshot,
    ledgerGet,
    ledgerPut,
    isQuarantined,
    quarantineTarget,
    clearQuarantine,
    quarantineSnapshot,
    setNextFault,
    takeFault,
    dispatch,
    stats: () => ({ ...stats }),
    paperByKey,
    paperByTuple,
    noteRecord,
    noteView,
    noteRevision,
    snapshotPaper,
    snapshotNote,
    initialNoteTuples,
    writeNote,
    allPapers: sortedPapers,
    fingerprintOf: fingerprint,
  };
}
