// Q1E-L3 (D007-A37) — A36 L3 transaction cases T01..T07: deterministic barriers, two-writer schedules, simulated
// kill/restart, rollback and invalid-witness negatives. MODEL_ONLY / PHYSICAL_DURABILITY_UNPROVEN.
// A "crash" here is a thrown SimulatedCrash inside the in-memory commit; it proves nothing about fsync/WAL/power loss.
import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import dns from 'node:dns';
import tls from 'node:tls';
import crypto from 'node:crypto';
import { STATUS, BARRIERS, SimulatedCrash, seededStore, putWholeNote, setReadingStatus, relinkQuote, deleteProject, addAssociation, noteId, statusId, historyId, NOTE_FIELDS } from '../src/model.mjs';
import { syntheticFixtureF0, trustedInventory, exportPinned, writeExternalManifest, digest, EVIDENCE } from '../src/snapshot.mjs';
import { createWitness, makeArchive, stageRestore, confirmProjectDeletion, RESTORE } from '../src/recovery.mjs';

const egress = [];
net.Socket.prototype.connect = function trapConnect(...a) { egress.push(String(a[0]?.host ?? a[0])); throw new Error('EGRESS_BLOCKED'); };
dns.lookup = (h) => { egress.push(h); throw new Error('EGRESS_BLOCKED'); };
tls.connect = (...a) => { egress.push(String(a[0]?.host ?? a[0])); throw new Error('EGRESS_BLOCKED'); };

const F0 = syntheticFixtureF0();
const { A } = F0.owners;
const { pa1, pa2, pa3, alpha, beta, q1 } = F0.ids;
const op = (name) => ({ opId: `op-${name}-${crypto.randomUUID()}`, fingerprint: `fp-${name}` });
const evid = (o) => console.log(`L3-CASE ${JSON.stringify({ route: 'L3', fixture_digest: F0.digest, model: EVIDENCE.MODEL_ONLY, durability: EVIDENCE.PHYSICAL, ...o })}`);
/** A store whose barrier hook can be armed AFTER seeding: crash once at `at`. */
function armedStore() {
  let at = null;
  const s = seededStore(F0.records, { barrier: (b) => { if (b === at) { at = null; throw new SimulatedCrash(b); } } });
  return { s, arm: (b) => { at = b; } };
}
const visible = (s, ids) => ids.map((id) => s.current().records.has(id));

test('A36-T01 crash at every pre-commit barrier: uncommitted graph invisible, no partial catalog/record/witness', () => {
  const NEW_PROJECT = 'project:owner-a:delta';
  const NEW_ASSOC = `assoc:${NEW_PROJECT}|${pa3}`;
  const rows = [];
  for (const barrier of BARRIERS) {
    const { s, arm } = armedStore();
    const cp0 = s.current().checkpoint;
    const tx = s.begin({ writer: 't01' });
    tx.put({ id: NEW_PROJECT, type: 'project', owner: A, data: { title: 'Synthetic Delta' } });
    tx.put({ id: NEW_ASSOC, type: 'association', owner: A, data: { projectId: NEW_PROJECT, paperId: pa3, important: true } });
    const o = op(`t01-${barrier}`);
    arm(barrier);
    const r = s.commit(tx, o);
    assert.equal(r.status, STATUS.UNKNOWN, `A36-T01 ${barrier}: caller sees UNKNOWN`);
    s.restart();
    const st = s.current();
    const parts = { project: st.records.has(NEW_PROJECT), assoc: st.records.has(NEW_ASSOC), catalogProject: st.catalog.has(NEW_PROJECT), catalogAssoc: st.catalog.has(NEW_ASSOC), witness: st.ops.has(o.opId) };
    const vals = Object.values(parts);
    assert.ok(vals.every((v) => v === vals[0]), `A36-T01 no partial publish at barrier ${barrier}: ${JSON.stringify(parts)}`);
    const published = barrier === 'after-publish-before-ack';
    assert.equal(vals[0], published, `A36-T01 ${barrier}: graph ${published ? 'fully' : 'not'} visible`);
    assert.equal(st.checkpoint, cp0 + (published ? 1 : 0));
    rows.push({ barrier, visible: vals[0], checkpoint: st.checkpoint });
  }
  const { s } = armedStore();
  const tx = s.begin({ writer: 't01' });
  tx.put({ id: NEW_PROJECT, type: 'project', owner: A, data: { title: 'Synthetic Delta' } });
  const r = s.commit(tx, op('t01-ok'));
  assert.equal(r.status, STATUS.CONFIRMED, 'A36-T01 positive control');
  assert.equal(s.current().records.get(NEW_PROJECT).rev, 1);
  assert.equal(s.current().catalog.get(NEW_PROJECT), 1, 'A36-T01 exact post-commit identity in catalog');
  assert.equal(s.current().commitId, r.commitId);
  evid({ case_id: 'A36-T01', fault_barrier: rows, positive_commit: r.commitId });
});

test('A36-T02 crash after durable commit before ACK; same opId other fingerprint conflicts; no duplicate write', () => {
  const { s, arm } = armedStore();
  const o = op('t02');
  const tx = s.begin({ writer: 't02' });
  putWholeNote(tx, A, pa1, Object.fromEntries(NOTE_FIELDS.map((k) => [k, `t02 ${k}`])));
  arm('after-publish-before-ack');
  assert.equal(s.commit(tx, o).status, STATUS.UNKNOWN, 'A36-T02 lost ACK -> UNKNOWN, not CONFIRMED');
  s.restart();
  const cps = s.checkpoints().length;
  assert.equal(s.reconcile(o.opId).status, STATUS.CONFIRMED, 'A36-T02 witness shows the commit');
  const conflict = s.begin({ writer: 't02b' });
  setReadingStatus(conflict, A, pa1, 'read');
  const c = s.commit(conflict, { opId: o.opId, fingerprint: 'fp-different-intent' });
  assert.equal(c.status, STATUS.CONFLICT, 'A36-T02 same opId with a different fingerprint conflicts');
  const same = s.begin({ writer: 't02c' });
  putWholeNote(same, A, pa1, Object.fromEntries(NOTE_FIELDS.map((k) => [k, `t02 ${k}`])));
  const rep = s.commit(same, o);
  assert.equal(rep.replay, true, 'A36-T02 identical intent is a replay');
  assert.equal(s.checkpoints().length, cps, 'A36-T02 no duplicate write');
  assert.equal(s.current().records.get(noteId(pa1)).rev, 2, 'note revision advanced exactly once');
  assert.equal(s.current().records.get(statusId(pa1)).data.status, 'reading', 'conflicting intent not applied');
  evid({ case_id: 'A36-T02', expected_operation_status: 'UNKNOWN -> CONFIRMED (observed)', reused_op: c.reason });
});

test('A36-T03 write skew (Project delete vs new Association) is aborted; independent Relink/Note commit serially', () => {
  for (const order of ['delete-first', 'add-first']) {
    const { s } = armedStore();
    const del = s.begin({ writer: 'deleter' });
    deleteProject(del, beta);
    const add = s.begin({ writer: 'adder' });
    addAssociation(add, A, beta, pa3, true);
    const [first, second] = order === 'delete-first' ? [[del, 'del'], [add, 'add']] : [[add, 'add'], [del, 'del']];
    const r1 = s.commit(first[0], op(`t03-${first[1]}`));
    const r2 = s.commit(second[0], op(`t03-${second[1]}`));
    assert.equal(r1.status, STATUS.CONFIRMED, `A36-T03 ${order}: first commits`);
    assert.equal(r2.status, STATUS.CONFLICT, `A36-T03 ${order}: write skew aborted (no dangling association / lost delete)`);
    const st = s.current();
    const assocToBeta = [...st.records.values()].filter((r) => r.type === 'association' && r.data.projectId === beta);
    if (order === 'delete-first') assert.equal(assocToBeta.length, 0);
    else assert.equal(st.records.has(beta), true);
    for (const id of [noteId(pa1), q1, historyId(q1), pa1]) assert.ok(st.records.has(id), `A36-T03 global ${id} kept`);
  }
  const { s } = armedStore();
  const rel = s.begin({ writer: 'rel' }); relinkQuote(rel, q1, 'p.21');
  const nt = s.begin({ writer: 'note' }); putWholeNote(nt, A, pa1, Object.fromEntries(NOTE_FIELDS.map((k) => [k, `t03 ${k}`])));
  assert.equal(s.commit(rel, op('t03-rel')).status, STATUS.CONFIRMED);
  assert.equal(s.commit(nt, op('t03-note')).status, STATUS.CONFIRMED, 'A36-T03 positive: independent writers serial-equivalent');
  evid({ case_id: 'A36-T03', schedules: ['delete-first', 'add-first'], result: 'CONFIRMED + CONFLICT' });
});

test('A36-T04 snapshot pinned at K: concurrent K+1 commits never leak into the export', () => {
  const { s } = armedStore();
  const oracle = trustedInventory(Object.fromEntries(F0.records.filter((r) => r.owner === A).map((r) => [r.id, 1])));
  const reference = exportPinned(s, { checkpoint: 1, owner: A, oracle });
  let step = 0;
  const ex = exportPinned(s, {
    checkpoint: 1, owner: A, oracle,
    onEach: () => {
      step++;
      if (step === 1 || step === 5 || step === 9) {
        const tx = s.begin({ writer: `k+${step}` });
        relinkQuote(tx, q1, `p.${100 + step}`);
        setReadingStatus(tx, A, pa2, step === 5 ? 'read' : 'reading');
        assert.equal(s.commit(tx, op(`t04-${step}`)).status, STATUS.CONFIRMED);
      }
    },
  });
  assert.equal(s.current().checkpoint, 4, 'three writers committed K+1..K+3 during the export');
  assert.equal(ex.status, EVIDENCE.KNOWN_FIXTURE, 'A36-T04 pinned export validated against the K oracle');
  assert.equal(ex.bundleDigest, reference.bundleDigest, 'A36-T04 pinned export identical to the quiet export of K');
  evid({ case_id: 'A36-T04', expected_commit_and_snapshot: 'K=1', concurrent_commits: [2, 3, 4], bundle_digest: ex.bundleDigest });
});

test('A36-T05 full engine rollback is rejected by the separately retained newest deletion checkpoint', () => {
  const { s } = armedStore();
  const w = createWitness();
  const key = crypto.randomBytes(32);
  const kr = new Map([['bk-1', key]]);
  const old = makeArchive(exportPinned(s, { checkpoint: 1, owner: A }), { keyId: 'bk-1', key });
  const o = op('t05');
  const pending = new Set();
  assert.equal(confirmProjectDeletion({ store: s, witness: w, projectId: beta, opId: o.opId, pending, deleteTx: () => { const tx = s.begin(); deleteProject(tx, beta); return s.commit(tx, o); } }).status, 'CONFIRMED');
  assert.equal(stageRestore(old, { keyring: kr, owner: A, witness: w, activeStore: s }).status, RESTORE.STALE, 'A36-T05 positive control: stale archive blocked');
  s.rollbackTo(1); // the whole engine (records + its own internal deletion log) goes back to K=1
  assert.equal(s.current().records.has(beta), true, 'rolled-back store shows the deleted project again');
  assert.equal(stageRestore(old, { keyring: kr, owner: A, witness: w, activeStore: s }).status, RESTORE.ROLLBACK, 'A36-T05 engine rollback detected by the outside witness');
  assert.equal(stageRestore(old, { keyring: kr, owner: A, witness: null, activeStore: s }).status, RESTORE.WITNESS, 'A36-T05 the internal log alone is not an independent T3');
  evid({ case_id: 'A36-T05', expected_deletion_checkpoint: 2, actual_deletion_checkpoint: w.latest.deleted.get(beta), store_checkpoint_after_rollback: s.current().checkpoint });
});

test('A36-T06 serialization abort is a definite CONFLICT, not UNKNOWN; ambiguous ACK is never retried; new intent distinct', () => {
  const { s, arm } = armedStore();
  const a = s.begin({ writer: 'a' }); setReadingStatus(a, A, pa2, 'read');
  const b = s.begin({ writer: 'b' }); setReadingStatus(b, A, pa2, 'reading');
  assert.equal(s.commit(a, op('t06-a')).status, STATUS.CONFIRMED);
  arm('after-validate'); // a crash hook is armed, but the conflict is decided first
  const rb = s.commit(b, op('t06-b'));
  assert.equal(rb.status, STATUS.CONFLICT, 'A36-T06 serialization conflict is definite, not UNKNOWN');
  arm(null);
  const c = s.begin({ writer: 'c' }); setReadingStatus(c, A, pa2, 'reading');
  const newIntent = op('t06-new-intent');
  assert.equal(s.commit(c, newIntent).status, STATUS.CONFIRMED, 'A36-T06 a NEW intent after an abort may proceed');
  const d = s.begin({ writer: 'd' }); setReadingStatus(d, A, pa2, 'unread');
  const amb = op('t06-ambiguous');
  arm('before-publish');
  assert.equal(s.commit(d, amb).status, STATUS.UNKNOWN);
  const cps = s.checkpoints().length;
  s.restart();
  assert.equal(s.checkpoints().length, cps, 'A36-T06 nothing re-sent after the ambiguous result');
  assert.equal(s.reconcile(amb.opId).status, STATUS.DEFINITE_FAILURE, 'A36-T06 reconciled, not blindly retried');
  assert.equal(s.current().records.get(statusId(pa2)).data.status, 'reading');
  evid({ case_id: 'A36-T06', conflict: rb.reason, ambiguous: 'UNKNOWN -> DEFINITE_FAILURE (witness)' });
});

test('A36-T07 external manifest write failure after a successful internal transaction: data intact, NOT_RESTORE_CERTIFIED', () => {
  const { s } = armedStore();
  const tx = s.begin(); relinkQuote(tx, q1, 'p.70');
  assert.equal(s.commit(tx, op('t07')).status, STATUS.CONFIRMED);
  const before = digest({ r: s.current().records, c: s.current().catalog });
  const ex = exportPinned(s, { checkpoint: 2, owner: A });
  const failed = writeExternalManifest(ex, () => { throw new Error('simulated external manifest store failure'); });
  assert.equal(failed.status, 'MANIFEST_WRITE_FAILED', 'A36-T07 manifest failure reported');
  assert.equal(failed.certification, EVIDENCE.BACKUP, 'A36-T07 backup NOT_RESTORE_CERTIFIED');
  assert.equal(digest({ r: s.current().records, c: s.current().catalog }), before, 'A36-T07 internal data intact');
  assert.equal(s.current().records.get(q1).data.sourceRef, 'p.70');
  const ok = writeExternalManifest(ex, () => {});
  assert.equal(ok.certification, EVIDENCE.BACKUP, 'A36-T07 even a successful fixture manifest is not a certificate');
  assert.deepEqual(egress, [], 'no socket/DNS/TLS attempt in the fault suite');
  evid({ case_id: 'A36-T07', manifest: failed.status, certification: failed.certification, egress_attempts: egress.length });
});
