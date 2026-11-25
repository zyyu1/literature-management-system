// Q1E-L3 (D007-A37) — deterministic IN-MEMORY reference transaction model. LOCAL / SYNTHETIC ONLY.
//
// MODEL_ONLY / PHYSICAL_DURABILITY_UNPROVEN. This is a logical copy-on-write reference engine, NOT a database:
// there is no fsync, WAL, power-loss, multi-process atomicity, SQL isolation or real key custody here. A
// "crash"/"restart" discards in-flight work and keeps the explicitly modelled published state; it simulates
// a durability boundary, it does not prove one. Built-in modules only; no network, no filesystem writes.
//
// One published state (a frozen object) holds, as ONE logical aggregate, the website-owned confirmed records,
// the authoritative catalog (id -> revision), the operation witnesses (opId -> fingerprint/commit) and the
// confirmed Project deletion log. A transaction builds a complete candidate and publishes it at a single
// explicit commit barrier (one assignment). Earlier published states are retained so a reader can pin K.

export const STATUS = Object.freeze({ CONFIRMED: 'CONFIRMED', CONFLICT: 'CONFLICT', DEFINITE_FAILURE: 'DEFINITE_FAILURE', UNKNOWN: 'UNKNOWN' });
export const READING_STATES = Object.freeze(['unread', 'reading', 'read']);
export const NOTE_FIELDS = Object.freeze(['question', 'arguments', 'methods', 'contributions', 'limitations']);
export const TYPES = Object.freeze(['project', 'paper', 'association', 'readingStatus', 'note', 'quote', 'history']);
/** Every simulated crash point inside commit, in order. Tests inject a crash at EACH of them. */
export const BARRIERS = Object.freeze(['after-validate', 'after-build', 'before-publish', 'after-publish-before-ack']);

export class ModelError extends Error {
  constructor(code, detail) { super(`${code}: ${detail}`); this.code = code; }
}
export class SimulatedCrash extends Error {
  constructor(barrier) { super(`SIMULATED_CRASH at ${barrier}`); this.barrier = barrier; }
}

const LIB_TYPES = new Set(['user', 'group']);
const ITEM_KEY_RE = /^[A-Z0-9]{8}$/;
const LIB_ID_RE = /^[0-9]{1,12}$/;
const OWNER_RE = /^[a-z][a-z0-9-]{0,31}$/;

/** Scoped Zotero compound identity: the item key alone is NOT unique (it repeats across libraries/owners). */
export function paperId({ owner, libraryType, libraryId, itemKey }) {
  if (!OWNER_RE.test(owner)) throw new ModelError('BAD_OWNER', String(owner));
  if (!LIB_TYPES.has(libraryType)) throw new ModelError('BAD_LIBRARY_TYPE', String(libraryType));
  if (!LIB_ID_RE.test(String(libraryId))) throw new ModelError('BAD_LIBRARY_ID', String(libraryId));
  if (!ITEM_KEY_RE.test(itemKey)) throw new ModelError('BAD_ITEM_KEY', String(itemKey));
  return `paper:${owner}:${libraryType}:${libraryId}:${itemKey}`;
}
export const noteId = (pid) => `note:${pid}`;
export const statusId = (pid) => `status:${pid}`;
export const historyId = (qid) => `history:${qid}`;

const normalizedId = (id) => id.normalize('NFC').toLowerCase();
/** Opaque logical ids: a type prefix and plain characters only (no path separators, no dot segments). */
const SAFE_ID_RE = /^(project|paper|assoc|status|note|quote|history):[A-Za-z0-9:|._-]{1,240}$/;

function fail(code, detail) { throw new ModelError(code, detail); }

/**
 * Whole-graph constraint check on a CANDIDATE (never on partial state). Throws ModelError -> DEFINITE_FAILURE,
 * nothing published. Checks: owner scope, compound identity, normalised-id collisions, reference closure,
 * five-field Note, three-state ReadingStatus, Quote <-> SourceHistory pairing, catalog == records.
 */
export function validateGraph(records, catalog) {
  const seen = new Map();
  for (const [id, r] of records) {
    if (r.id !== id) fail('ID_MISMATCH', id);
    if (!SAFE_ID_RE.test(id) || id.includes('..')) fail('UNSAFE_ID', id);
    if (!TYPES.includes(r.type)) fail('BAD_TYPE', `${id} ${r.type}`);
    if (!OWNER_RE.test(r.owner)) fail('BAD_OWNER', id);
    const n = normalizedId(id);
    if (seen.has(n)) fail('DUPLICATE_NORMALIZED_ID', `${seen.get(n)} ~ ${id}`);
    seen.set(n, id);
  }
  const ref = (from, id, type) => {
    const t = records.get(id);
    if (!t) fail('DANGLING_REFERENCE', `${from.id} -> ${id}`);
    if (t.type !== type) fail('WRONG_REFERENCE_TYPE', `${from.id} -> ${id}`);
    if (t.owner !== from.owner) fail('CROSS_OWNER_REFERENCE', `${from.id} -> ${id}`);
  };
  for (const r of records.values()) {
    const d = r.data;
    switch (r.type) {
      case 'project': if (typeof d.title !== 'string' || !d.title) fail('BAD_PROJECT', r.id); break;
      case 'paper': if (paperId({ owner: r.owner, ...d }) !== r.id) fail('PAPER_IDENTITY_MISMATCH', r.id); break;
      case 'association':
        ref(r, d.projectId, 'project'); ref(r, d.paperId, 'paper');
        if (typeof d.important !== 'boolean') fail('BAD_ASSOCIATION', r.id); break;
      case 'readingStatus':
        ref(r, d.paperId, 'paper');
        if (r.id !== statusId(d.paperId) || !READING_STATES.includes(d.status)) fail('BAD_READING_STATUS', r.id); break;
      case 'note': {
        ref(r, d.paperId, 'paper');
        const keys = Object.keys(d).filter((k) => k !== 'paperId').sort();
        if (r.id !== noteId(d.paperId) || keys.join() !== [...NOTE_FIELDS].sort().join() || !NOTE_FIELDS.every((k) => typeof d[k] === 'string')) fail('BAD_NOTE_FIVE_FIELDS', r.id);
        break;
      }
      case 'quote': {
        ref(r, d.paperId, 'paper');
        const h = records.get(historyId(r.id));
        if (!h) fail('QUOTE_WITHOUT_HISTORY', r.id);
        const ev = h.data.events;
        if (!ev.length || ev.at(-1).sourceRef !== d.sourceRef) fail('QUOTE_HISTORY_MISMATCH', r.id);
        break;
      }
      case 'history': {
        ref(r, d.quoteId, 'quote');
        if (r.id !== historyId(d.quoteId)) fail('BAD_HISTORY_ID', r.id);
        d.events.forEach((e, i) => { if (e.seq !== i + 1 || typeof e.sourceRef !== 'string') fail('HISTORY_NOT_ORDERED', r.id); });
        break;
      }
      default: fail('BAD_TYPE', r.id);
    }
  }
  if (catalog.size !== records.size) fail('CATALOG_RECORD_MISMATCH', `${catalog.size} != ${records.size}`);
  for (const [id, r] of records) if (catalog.get(id) !== r.rev) fail('CATALOG_RECORD_MISMATCH', id);
}

const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); } return o; };
const cloneData = (d) => JSON.parse(JSON.stringify(d));

/**
 * @param {object} o
 * @param {(barrier:string, ctx:object)=>void} [o.barrier]  fault hook; throw SimulatedCrash to crash there
 */
export function createStore({ barrier = () => {} } = {}) {
  const genesis = { checkpoint: 0, commitId: 'c0', records: new Map(), catalog: new Map(), ops: new Map(), deletions: new Map() };
  const versions = [deepFreeze(genesis)];
  let crashed = false;
  let commitSeq = 0;
  const current = () => versions.at(-1);
  const stateAt = (k) => {
    const s = versions.find((v) => v.checkpoint === k);
    if (!s) throw new ModelError('UNKNOWN_CHECKPOINT', String(k));
    return s;
  };
  const revIn = (state, id) => state.records.get(id)?.rev ?? null;

  function begin({ writer = 'w' } = {}) {
    if (crashed) throw new ModelError('STORE_DOWN', 'restart required');
    const snap = current();
    const reads = new Map();
    const writes = new Map(); // id -> record | null (delete)
    const tx = {
      writer, snapshot: snap.checkpoint,
      get(id) {
        if (writes.has(id)) return writes.get(id);
        if (!reads.has(id)) reads.set(id, revIn(snap, id));
        const r = snap.records.get(id);
        return r ? { ...r, data: cloneData(r.data) } : null;
      },
      /** Read every record of a type (records the whole visible set for write-skew detection). */
      scan(type) {
        const out = [];
        for (const r of snap.records.values()) if (r.type === type) { out.push(tx.get(r.id)); }
        reads.set(`scan:${type}`, [...snap.records.values()].filter((r) => r.type === type).map((r) => `${r.id}@${r.rev}`).join(','));
        return out.filter((r) => !(writes.has(r.id) && writes.get(r.id) === null));
      },
      put(rec) { writes.set(rec.id, { id: rec.id, type: rec.type, owner: rec.owner, data: cloneData(rec.data) }); },
      del(id) { tx.get(id); writes.set(id, null); },
      _reads: reads, _writes: writes, _snap: snap,
    };
    return tx;
  }

  /** Internal commit. Returns a result or throws SimulatedCrash (the caller then cannot know the outcome). */
  function commitInternal(tx, { opId, fingerprint }) {
    const cur = current();
    // Operation witness lives INSIDE the published aggregate: same opId replays, other fingerprint conflicts.
    const prior = cur.ops.get(opId);
    if (prior) {
      if (prior.fingerprint !== fingerprint) return { status: STATUS.CONFLICT, reason: 'OPERATION_ID_REUSED_WITH_DIFFERENT_INTENT', opId };
      return { status: STATUS.CONFIRMED, replay: true, opId, commitId: prior.commitId, checkpoint: prior.checkpoint };
    }
    // Optimistic SERIALIZABLE check: everything read or written must be unchanged since the snapshot.
    for (const [key, seen] of tx._reads) {
      const now = key.startsWith('scan:')
        ? [...cur.records.values()].filter((r) => r.type === key.slice(5)).map((r) => `${r.id}@${r.rev}`).join(',')
        : revIn(cur, key);
      if (now !== seen) return { status: STATUS.CONFLICT, reason: 'SERIALIZATION_CONFLICT', key, opId };
    }
    for (const id of tx._writes.keys()) {
      if (revIn(cur, id) !== revIn(tx._snap, id)) return { status: STATUS.CONFLICT, reason: 'WRITE_WRITE_CONFLICT', key: id, opId };
    }
    // Build the complete copy-on-write candidate.
    const records = new Map(cur.records);
    const catalog = new Map(cur.catalog);
    const deletions = new Map(cur.deletions);
    const checkpoint = cur.checkpoint + 1;
    for (const [id, w] of tx._writes) {
      if (w === null) {
        const old = records.get(id);
        if (!old) return { status: STATUS.DEFINITE_FAILURE, reason: 'DELETE_OF_MISSING_RECORD', key: id, opId };
        records.delete(id); catalog.delete(id);
        if (old.type === 'project') deletions.set(id, checkpoint);
      } else {
        const rev = (records.get(id)?.rev ?? 0) + 1;
        records.set(id, { ...w, rev });
        catalog.set(id, rev);
      }
    }
    try { validateGraph(records, catalog); } catch (e) {
      if (e instanceof ModelError) return { status: STATUS.DEFINITE_FAILURE, reason: e.code, detail: e.message, opId };
      throw e;
    }
    barrier('after-validate', { opId, checkpoint });
    const commitId = `c${checkpoint}-${++commitSeq}`;
    const ops = new Map(cur.ops).set(opId, { fingerprint, commitId, checkpoint, writer: tx.writer });
    const candidate = deepFreeze({ checkpoint, commitId, records, catalog, ops, deletions });
    barrier('after-build', { opId, checkpoint });
    barrier('before-publish', { opId, checkpoint });
    versions.push(candidate); // ===== the single explicit commit barrier: one atomic publish =====
    barrier('after-publish-before-ack', { opId, checkpoint, commitId });
    return { status: STATUS.CONFIRMED, opId, commitId, checkpoint };
  }

  /**
   * Client-facing commit. A simulated crash anywhere in commit gives the caller UNKNOWN (it cannot tell
   * whether the publish happened). Nothing is ever retried automatically.
   */
  function commit(tx, op) {
    if (crashed) throw new ModelError('STORE_DOWN', 'restart required');
    if (!op?.opId || !op?.fingerprint) throw new ModelError('OPERATION_ID_REQUIRED', 'opId and fingerprint');
    try {
      return commitInternal(tx, op);
    } catch (e) {
      if (e instanceof SimulatedCrash) { crashed = true; return { status: STATUS.UNKNOWN, reason: 'ACK_LOST_OR_CRASH', barrier: e.barrier, opId: op.opId }; }
      throw e;
    }
  }

  return Object.freeze({
    begin,
    commit,
    /** Simulated restart: in-flight candidates are gone; the published versions are the modelled durable state. */
    restart() { crashed = false; },
    get crashed() { return crashed; },
    current,
    stateAt,
    checkpoints: () => versions.map((v) => v.checkpoint),
    /**
     * Reconcile an operation after UNKNOWN by reading the authoritative published witness (only possible while
     * the store is up). Found -> CONFIRMED (observed). Not found -> DEFINITE_FAILURE "not committed": this is
     * only sound because, in this model, nothing can publish after a restart without a new commit call.
     */
    reconcile(opId) {
      if (crashed) return { status: STATUS.UNKNOWN, reason: 'STORE_DOWN' };
      const w = current().ops.get(opId);
      return w ? { status: STATUS.CONFIRMED, observed: true, commitId: w.commitId, checkpoint: w.checkpoint }
        : { status: STATUS.DEFINITE_FAILURE, reason: 'NOT_COMMITTED_PER_AUTHORITATIVE_WITNESS' };
    },
    /** Test-only rollback of the whole engine to an older checkpoint (models a restored/rolled-back store). */
    rollbackTo(k) { const s = stateAt(k); versions.push(deepFreeze({ ...s, rolledBackFrom: current().checkpoint })); },
    _seed(records) {
      const tx = begin({ writer: 'seed' });
      for (const r of records) tx.put(r);
      return commit(tx, { opId: 'seed-0', fingerprint: 'seed' });
    },
  });
}

/** Load a fixture as checkpoint 1. */
export function seededStore(records, opts = {}) {
  const s = createStore(opts);
  const r = s._seed(records);
  if (r.status !== STATUS.CONFIRMED) throw new ModelError('SEED_FAILED', JSON.stringify(r));
  return s;
}

// ---------- domain operations (each is ONE transaction; callers commit) ----------

/** Replace the WHOLE five-field Note (never fieldwise). */
export function putWholeNote(tx, owner, pid, fields) {
  const data = { paperId: pid };
  for (const k of NOTE_FIELDS) data[k] = fields[k];
  tx.get(noteId(pid));
  tx.put({ id: noteId(pid), type: 'note', owner, data });
}
export function setReadingStatus(tx, owner, pid, status) {
  tx.get(statusId(pid));
  tx.put({ id: statusId(pid), type: 'readingStatus', owner, data: { paperId: pid, status } });
}
/** Quote Relink + confirmed SourceHistory append, paired in the same transaction. */
export function relinkQuote(tx, qid, newSourceRef) {
  const q = tx.get(qid);
  if (!q) throw new ModelError('NO_SUCH_QUOTE', qid);
  const h = tx.get(historyId(qid));
  tx.put({ ...q, data: { ...q.data, sourceRef: newSourceRef } });
  tx.put({ ...h, data: { ...h.data, events: [...h.data.events, { seq: h.data.events.length + 1, sourceRef: newSourceRef }] } });
}
/** Permanent Project deletion: the Project and ONLY its own Associations (Important lives on them). */
export function deleteProject(tx, projectId) {
  const p = tx.get(projectId);
  if (!p) throw new ModelError('NO_SUCH_PROJECT', projectId);
  for (const a of tx.scan('association')) if (a.data.projectId === projectId) tx.del(a.id);
  tx.del(projectId);
}
export function addAssociation(tx, owner, projectId, pid, important = false) {
  const p = tx.get(projectId);
  if (!p) throw new ModelError('NO_SUCH_PROJECT', projectId);
  tx.scan('association');
  tx.put({ id: `assoc:${projectId}|${pid}`, type: 'association', owner, data: { projectId, paperId: pid, important } });
}
