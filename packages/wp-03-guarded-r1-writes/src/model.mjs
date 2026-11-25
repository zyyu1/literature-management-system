// WP-03-R1 single in-memory model (LOCAL_SYNTHETIC_ONLY, MEMORY_ONLY).
// The frozen WP-02 read catalog is re-used READ-ONLY as the fixture validation gate; its immutable
// objects are cloned into THIS model, which is the only mutable Project/Paper/association state for
// WP-03-R1. WP-01's separate fake Project state and fake mutation backend are never used.
//
// Per-instance opaque runId and distinct opaque revisions for every Project, every global
// ReadingStatus and every Project-association Important are derived from the runId + frozen
// identity + generation. Revisions never come from a client value and never from a clock.
import { createHash, randomBytes } from 'node:crypto';
import { createCatalog, paperKey } from '../../wp-02-project-paper-read/src/catalog.mjs';
import { fingerprint } from '../../wp-01-synthetic-auth-api/src/policy.mjs';

export { paperKey };

export const RUN_ID_RE = /^run_[A-Za-z0-9_-]{16,64}$/;
export const REVISION_RE = /^rev_[A-Za-z0-9_-]{16,64}$/;

// Test-only fault controls. They are NEVER reachable over HTTP.
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

export function associationKey(projectId, pk) { return projectId + '\u0001' + pk; }
export function projectTargetKey(projectId) { return 'project:' + projectId; }
export function paperTargetKey(pk) { return 'paper:' + pk; }
export function associationTargetKey(projectId, pk) { return 'association:' + projectId + '\u0001' + pk; }

const byString = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function createGuardedModel({ wp01Fixture, wp02Fixture }) {
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
  const projects = new Map();
  const papers = new Map();
  const associations = new Map();
  const ledger = new Map(); // `${principalId}\u0000${operationId}` -> record
  const quarantined = new Map(); // targetKey -> { operationId, outcome, code }
  const stats = { dispatches: 0, commits: 0, replays: 0, unknownOutcomes: 0, conflicts: 0, denials: 0 };
  let nextFault = FAULT.MODEL_ACK;

  function revision(kind, identity, generation) {
    return 'rev_' + createHash('sha256')
      .update(`${runId}|${kind}|${identity}|${generation}`)
      .digest('base64url')
      .slice(0, 22);
  }

  for (const pr of catalog.projects.values()) {
    projects.set(pr.id, {
      id: pr.id,
      ownerId: pr.ownerId,
      name: pr.name,
      archived: pr.archived === true,
      generation: 1,
      revision: revision('project', pr.id, 1),
    });
  }
  for (const [pk, p] of catalog.papers) {
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
      note: p.note,
      generation: 1,
      revision: revision('reading_status', pk, 1),
    });
  }
  for (const a of wp02Fixture.associations) {
    const proj = projects.get(a.projectId);
    if (!proj) throw new Error('UNSAFE_CONFIG: frozen association references an unknown Project');
    const pk = paperKey(proj.ownerId, a.paper[0], a.paper[1], a.paper[2]);
    if (!papers.has(pk)) throw new Error('UNSAFE_CONFIG: frozen association references an unknown paper');
    const lk = associationKey(a.projectId, pk);
    if (associations.has(lk)) throw new Error('STOP: duplicated frozen association');
    associations.set(lk, {
      projectId: a.projectId,
      paperKey: pk,
      important: a.important === true,
      generation: 1,
      revision: revision('important', lk, 1),
    });
  }
  const validated = catalog.counts();
  if (projects.size !== validated.projects || papers.size !== validated.papers || associations.size !== validated.associations) {
    throw new Error('STOP: cloned model counts do not match the frozen catalog');
  }

  const sortedProjects = () => [...projects.values()].sort((a, b) => byString(a.id, b.id));
  const sortedPapers = () => [...papers.values()].sort((a, b) => byString(a.key, b.key));
  const sortedAssociations = () => [...associations.values()]
    .sort((a, b) => byString(a.projectId + '\u0001' + a.paperKey, b.projectId + '\u0001' + b.paperKey));

  function projectById(id) { return projects.get(id) || null; }
  function paperByKey(pk) { return papers.get(pk) || null; }
  function paperByTuple(ownerScope, libraryType, libraryId, itemKey) {
    return papers.get(paperKey(ownerScope, libraryType, libraryId, itemKey)) || null;
  }
  function associationOf(projectId, pk) { return associations.get(associationKey(projectId, pk)) || null; }
  function projectAssociations(projectId) { return sortedAssociations().filter((a) => a.projectId === projectId); }
  function paperAssociations(pk) { return sortedAssociations().filter((a) => a.paperKey === pk); }

  function bumpProject(p) {
    p.generation += 1;
    p.revision = revision('project', p.id, p.generation);
    return p;
  }
  function addProject({ projectId, ownerId, name }) {
    if (projects.has(projectId)) throw new Error('STOP: Project already exists');
    const p = { id: projectId, ownerId, name, archived: false, generation: 1, revision: revision('project', projectId, 1) };
    projects.set(projectId, p);
    return p;
  }
  function renameProject(p, name) { p.name = name; return bumpProject(p); }
  function setProjectArchived(p, archived) { p.archived = archived === true; return bumpProject(p); }
  function setReadingStatus(p, value) {
    p.readingStatus = value;
    p.generation += 1;
    p.revision = revision('reading_status', p.key, p.generation);
    return p;
  }
  function setImportant(a, value) {
    a.important = value === true;
    a.generation += 1;
    a.revision = revision('important', associationKey(a.projectId, a.paperKey), a.generation);
    return a;
  }

  function projectView(p) {
    return { id: p.id, name: p.name, archived: p.archived, revision: p.revision };
  }
  function projectSummary(p) {
    const list = projectAssociations(p.id);
    return {
      id: p.id, name: p.name, archived: p.archived, revision: p.revision,
      paperCount: list.length, importantCount: list.filter((a) => a.important).length,
    };
  }
  function paperView(p) {
    return {
      libraryType: p.libraryType, libraryId: p.libraryId, itemKey: p.itemKey,
      title: p.title, creators: p.creators, year: p.year, doi: p.doi,
      readingStatus: p.readingStatus, note: p.note,
    };
  }
  function paperRow(a) {
    const p = papers.get(a.paperKey);
    return {
      libraryType: p.libraryType, libraryId: p.libraryId, itemKey: p.itemKey,
      title: p.title, creators: p.creators, year: p.year, doi: p.doi,
      readingStatus: p.readingStatus, noteState: p.note ? 'PRESENT' : 'EMPTY', important: a.important,
      readingStatusRevision: p.revision, importantRevision: a.revision,
    };
  }
  function projectResource(p) { return { kind: 'project', ...projectView(p) }; }
  function paperResource(p) {
    return {
      kind: 'paper', libraryType: p.libraryType, libraryId: p.libraryId, itemKey: p.itemKey,
      readingStatus: p.readingStatus, revision: p.revision,
    };
  }
  function associationResource(a) {
    const p = papers.get(a.paperKey);
    return {
      kind: 'association', projectId: a.projectId,
      paper: { libraryType: p.libraryType, libraryId: p.libraryId, itemKey: p.itemKey },
      important: a.important, revision: a.revision,
    };
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
  function quarantineSnapshot() {
    return [...quarantined.entries()].map(([targetKey, v]) => ({ targetKey, ...v }));
  }

  function setNextFault(f) {
    if (!FAULT_NAMES.includes(f)) throw new Error('unknown fault scenario');
    nextFault = f;
  }
  function takeFault() { const f = nextFault; nextFault = FAULT.MODEL_ACK; return f; }

  // The one synchronous transition: dispatch decision + (optional) model mutation + counters.
  // The caller holds the ledger/state write in the same synchronous block.
  function dispatch(fault, apply) {
    if (fault === FAULT.NOT_DISPATCHED) {
      return { dispatched: false, committed: false, fault };
    }
    stats.dispatches += 1;
    if (!COMMITTING_FAULTS.has(fault)) {
      return { dispatched: true, committed: false, fault };
    }
    const applied = apply();
    stats.commits += 1;
    return { dispatched: true, committed: true, fault, applied };
  }

  function counts() { return { projects: projects.size, papers: papers.size, associations: associations.size }; }

  function canonicalState() {
    return {
      runId,
      projects: sortedProjects().map((p) => [p.id, p.ownerId, p.name, p.archived, p.revision]),
      papers: sortedPapers().map((p) => [p.key, p.ownerScope, p.libraryType, p.libraryId, p.itemKey, p.readingStatus, p.revision, p.note === null ? null : p.note]),
      associations: sortedAssociations().map((a) => [a.projectId, a.paperKey, a.important, a.revision]),
    };
  }
  function stateDigest() {
    return createHash('sha256').update(JSON.stringify(canonicalState())).digest('hex');
  }
  function ledgerDigest() {
    const rows = [...ledger.values()].sort((a, b) => byString(a.principalId + '\u0000' + a.operationId, b.principalId + '\u0000' + b.operationId));
    return createHash('sha256').update(JSON.stringify(rows)).digest('hex');
  }

  // Deep copies only: no caller can mutate model state through a snapshot.
  function snapshot() {
    return structuredClone({
      runId,
      counts: counts(),
      projects: sortedProjects().map((p) => ({ id: p.id, ownerId: p.ownerId, name: p.name, archived: p.archived, revision: p.revision })),
      papers: sortedPapers().map((p) => ({
        key: p.key, ownerScope: p.ownerScope, libraryType: p.libraryType, libraryId: p.libraryId, itemKey: p.itemKey,
        title: p.title, creators: p.creators, year: p.year, doi: p.doi, readingStatus: p.readingStatus, revision: p.revision,
        note: p.note,
      })),
      associations: sortedAssociations().map((a) => ({ projectId: a.projectId, paperKey: a.paperKey, important: a.important, revision: a.revision })),
      ledger: ledgerSnapshot(),
      quarantine: quarantineSnapshot(),
      stats: { ...stats },
    });
  }
  function snapshotProject(id) { const p = projects.get(id); return p ? structuredClone(projectView(p)) : null; }
  function snapshotPaper(tuple) {
    const [ownerScope, libraryType, libraryId, itemKey] = tuple;
    const p = paperByTuple(ownerScope, libraryType, libraryId, itemKey);
    return p ? structuredClone({ key: p.key, ...paperView(p), revision: p.revision }) : null;
  }
  function snapshotAssociation(projectId, pk) {
    const a = associationOf(projectId, pk);
    return a ? structuredClone({ projectId: a.projectId, paperKey: a.paperKey, important: a.important, revision: a.revision }) : null;
  }

  return {
    runId,
    counts,
    snapshot,
    stateDigest,
    ledgerDigest,
    ledgerSize,
    ledgerSnapshot,
    ledgerGet,
    ledgerPut,
    isQuarantined,
    quarantineTarget,
    quarantineSnapshot,
    setNextFault,
    takeFault,
    dispatch,
    stats: () => ({ ...stats }),
    projectById,
    paperByKey,
    paperByTuple,
    associationOf,
    projectAssociations,
    paperAssociations,
    allProjects: sortedProjects,
    allPapers: sortedPapers,
    allAssociations: sortedAssociations,
    addProject,
    renameProject,
    setProjectArchived,
    setReadingStatus,
    setImportant,
    projectView,
    projectSummary,
    paperView,
    paperRow,
    projectResource,
    paperResource,
    associationResource,
    snapshotProject,
    snapshotPaper,
    snapshotAssociation,
    fingerprintOf: fingerprint,
  };
}
