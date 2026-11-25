// Q1E-L3 (D007-A37) — A36 common cases C01..C12 and recovery cases R01..R07, each with a positive control and a
// fail-closed negative. MODEL_ONLY / PHYSICAL_DURABILITY_UNPROVEN / UNSUPPORTED_COMPLETENESS / NOT_RESTORE_CERTIFIED.
// Synthetic data only; the prototype opens no socket (a trap below records any attempt; A36-C12 asserts zero).
import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import dns from 'node:dns';
import tls from 'node:tls';
import crypto from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { STATUS, NOTE_FIELDS, seededStore, putWholeNote, setReadingStatus, relinkQuote, deleteProject, addAssociation, noteId, statusId, historyId, paperId, BARRIERS, SimulatedCrash, createStore } from '../src/model.mjs';
import { syntheticFixtureF0, trustedInventory, checkListing, exportPinned, digest, fixtureEncode, EVIDENCE } from '../src/snapshot.mjs';
import { createWitness, makeArchive, verifyArchive, stageRestore, cutover, confirmProjectDeletion, RESTORE } from '../src/recovery.mjs';

// ---- egress trap (A36-C12): any socket / DNS / TLS attempt is recorded and refused ----
const egress = [];
net.Socket.prototype.connect = function trapConnect(...a) { egress.push(['net.connect', String(a[0]?.host ?? a[0])]); throw new Error('EGRESS_BLOCKED'); };
dns.lookup = (h) => { egress.push(['dns.lookup', h]); throw new Error('EGRESS_BLOCKED'); };
tls.connect = (...a) => { egress.push(['tls.connect', String(a[0]?.host ?? a[0])]); throw new Error('EGRESS_BLOCKED'); };

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const F0 = syntheticFixtureF0();
const { A, B } = F0.owners;
const { pa1, pa2, pa3, pb1, alpha, beta, gamma, q1 } = F0.ids;
const fresh = () => seededStore(F0.records);
const op = (name) => ({ opId: `op-${name}-${crypto.randomUUID()}`, fingerprint: `fp-${name}` });
const stateDigest = (s) => digest({ records: s.current().records, catalog: s.current().catalog });
const ownerAIds = () => F0.records.filter((r) => r.owner === A).map((r) => r.id).sort();
/** Independent oracle, written by the test author from the fixture declaration (every owner-a record at rev 1). */
const ORACLE_A_K1 = () => trustedInventory(Object.fromEntries(ownerAIds().map((id) => [id, 1])));
const evid = (o) => console.log(`L3-CASE ${JSON.stringify({ route: 'L3', fixture_digest: F0.digest, model: EVIDENCE.MODEL_ONLY, durability: EVIDENCE.PHYSICAL, ...o })}`);
const keyring = (pairs) => new Map(pairs);
const fixtureKey = () => crypto.randomBytes(32); // random synthetic per test; never stored

/** Delete beta through store + witness (CONFIRMED only when both happened). */
function confirmDeleteBeta(store, witness, pending = new Set()) {
  const o = op('delete-beta');
  return confirmProjectDeletion({ store, witness, projectId: beta, opId: o.opId, pending, deleteTx: () => { const tx = store.begin({ writer: 'deleter' }); deleteProject(tx, beta); return store.commit(tx, o); } });
}

// ===================================== A36-C01..C12 =====================================
test('A36-C01 known omitted ID: trusted predeclared catalog detects it; no partial bundle, no count proof', () => {
  const s = fresh();
  const oracle = ORACLE_A_K1();
  const full = checkListing(oracle.ids(), oracle, { catalogSource: oracle.source });
  assert.equal(full.status, EVIDENCE.KNOWN_FIXTURE, 'A36-C01 positive: complete listing vs trusted catalog');
  assert.equal(full.certified, false, 'never a backup certificate');
  const omitted = `assoc:${alpha}|${pa3}`;
  const listing = oracle.ids().filter((id) => id !== omitted); // a syntactically valid but incomplete 207-like listing
  const r = checkListing(listing, oracle, { catalogSource: oracle.source });
  assert.equal(r.status, 'FAIL', 'A36-C01 known omitted ID detected');
  assert.equal(r.code, 'KNOWN_ID_OMITTED');
  assert.deepEqual(r.missing, [omitted]);
  assert.equal(r.bundle, null, 'A36-C01 no partial bundle');
  const ex = exportPinned(s, { checkpoint: 1, owner: A, oracle });
  assert.equal(ex.status, EVIDENCE.KNOWN_FIXTURE, 'A36-C01 export enumerates every predeclared id');
  assert.equal(ex.bundle.records.length, oracle.size, 'A36-C01 known inventory complete in export');
  assert.equal(ex.completeness, EVIDENCE.COMPLETENESS);
  const oracleWithExtra = trustedInventory(Object.fromEntries([...ownerAIds().map((id) => [id, 1]), ['project:owner-a:never-written', 1]]));
  const ex2 = exportPinned(s, { checkpoint: 1, owner: A, oracle: oracleWithExtra });
  assert.equal(ex2.code, 'KNOWN_ID_OMITTED', 'A36-C01 export missing a known id fails closed');
  assert.equal(ex2.bundle, null);
  evid({ case_id: 'A36-C01', independent_oracle: 'PREDECLARED_TEST_FIXTURE', oracle_digest: oracle.digest, positive: full.status, negative: r.code, missing: r.missing });
});

test('A36-C02 unknown omission absent from listing AND self-derived catalog is undetectable -> UNSUPPORTED_COMPLETENESS', () => {
  const oracle = ORACLE_A_K1();
  const unknown = `assoc:${beta}|${pa2}`; // exists in the store; the listing silently drops it
  const listing = oracle.ids().filter((id) => id !== unknown);
  const selfDerived = trustedInventory(Object.fromEntries(listing.map((id) => [id, 1])));
  const r = checkListing(listing, selfDerived, { catalogSource: 'DERIVED_FROM_LISTING' });
  assert.equal(r.status, 'UNSUPPORTED', 'A36-C02 honest impossibility, not a success');
  assert.equal(r.code, 'UNSUPPORTED_COMPLETENESS', 'A36-C02 reported as UNSUPPORTED_COMPLETENESS');
  assert.equal(r.certified, false);
  assert.notEqual(r.status, EVIDENCE.KNOWN_FIXTURE, 'A36-C02 must never claim enumeration success');
  // Contrast (positive control): the same omission IS detectable only with an independent predeclared catalog.
  const contrast = checkListing(listing, oracle, { catalogSource: oracle.source });
  assert.equal(contrast.code, 'KNOWN_ID_OMITTED');
  evid({ case_id: 'A36-C02', verdict: 'UNSUPPORTED_COMPLETENESS', independent_oracle: 'NONE (self-derived)', negative_control: contrast.code });
});

test('A36-C03 owner/library scope: compound Zotero identity, no cross-owner links, dangling/duplicate ids reject', () => {
  const s = fresh();
  assert.notEqual(pa1, pa2, 'same itemKey, different library scope -> different identity');
  assert.notEqual(pa1, pb1, 'same itemKey and library id, different owner -> different identity');
  const ex = exportPinned(s, { checkpoint: 1, owner: A, oracle: ORACLE_A_K1() });
  assert.ok(ex.bundle.records.every((r) => !r.id.includes(':owner-b:')), 'A36-C03 owner-scoped export excludes owner-b');
  const before = stateDigest(s);
  const attempts = {
    cross: (tx) => addAssociation(tx, A, alpha, pb1),
    dangling: (tx) => tx.put({ id: `assoc:${alpha}|paper:owner-a:user:1001:QQQQ0000`, type: 'association', owner: A, data: { projectId: alpha, paperId: 'paper:owner-a:user:1001:QQQQ0000', important: false } }),
    duplicate: (tx) => tx.put({ id: 'project:owner-a:Alpha', type: 'project', owner: A, data: { title: 'collides after normalisation' } }),
    identity: (tx) => tx.put({ id: paperId({ owner: A, libraryType: 'user', libraryId: '1001', itemKey: 'QWER1234' }), type: 'paper', owner: A, data: { libraryType: 'group', libraryId: '1001', itemKey: 'QWER1234' } }),
  };
  const expected = { cross: 'CROSS_OWNER_REFERENCE', dangling: 'DANGLING_REFERENCE', duplicate: 'DUPLICATE_NORMALIZED_ID', identity: 'PAPER_IDENTITY_MISMATCH' };
  for (const [k, f] of Object.entries(attempts)) {
    const tx = s.begin({ writer: 'w-c03' });
    f(tx);
    const r = s.commit(tx, op(`c03-${k}`));
    assert.equal(r.status, STATUS.DEFINITE_FAILURE, `A36-C03 ${k} rejected`);
    assert.equal(r.reason, expected[k], `A36-C03 ${k} reason`);
  }
  assert.equal(stateDigest(s), before, 'A36-C03 nothing published by rejected graphs');
  evid({ case_id: 'A36-C03', rejected: expected, state_unchanged: true });
});

test('A36-C04 concurrent whole five-field Note / ReadingStatus: one revision or explicit CONFLICT, never fieldwise or lost', () => {
  const s = fresh();
  const w1 = s.begin({ writer: 'w1' });
  const w2 = s.begin({ writer: 'w2' });
  const v1 = Object.fromEntries(NOTE_FIELDS.map((k) => [k, `w1 ${k} 写入`]));
  const v2 = Object.fromEntries(NOTE_FIELDS.map((k) => [k, `w2 ${k}`]));
  putWholeNote(w1, A, pa1, v1); setReadingStatus(w1, A, pa1, 'read');
  putWholeNote(w2, A, pa1, v2); setReadingStatus(w2, A, pa1, 'unread');
  const r1 = s.commit(w1, op('c04-w1'));
  const r2 = s.commit(w2, op('c04-w2'));
  assert.equal(r1.status, STATUS.CONFIRMED, 'A36-C04 first writer confirmed');
  assert.equal(r2.status, STATUS.CONFLICT, 'A36-C04 second writer gets explicit CONFLICT (no silent lost update)');
  const note = s.current().records.get(noteId(pa1));
  assert.deepEqual(Object.fromEntries(NOTE_FIELDS.map((k) => [k, note.data[k]])), v1, 'A36-C04 whole note from exactly one writer');
  assert.equal(s.current().records.get(statusId(pa1)).data.status, 'read');
  assert.equal(note.rev, 2);
  const before = stateDigest(s);
  const partial = s.begin({ writer: 'w3' });
  partial.put({ id: noteId(pa1), type: 'note', owner: A, data: { paperId: pa1, question: 'only one field' } });
  assert.equal(s.commit(partial, op('c04-partial')).reason, 'BAD_NOTE_FIVE_FIELDS', 'A36-C04 fieldwise/partial note rejected');
  const badStatus = s.begin({ writer: 'w4' });
  setReadingStatus(badStatus, A, pa1, 'skimmed');
  assert.equal(s.commit(badStatus, op('c04-status')).reason, 'BAD_READING_STATUS', 'A36-C04 only three reading states');
  assert.equal(stateDigest(s), before);
  evid({ case_id: 'A36-C04', expected_operation_status: ['CONFIRMED', 'CONFLICT'], observed: [r1.status, r2.status], note_rev: note.rev });
});

test('A36-C05 Quote Relink + SourceHistory and Project deletion + own Associations commit together; globals retained', () => {
  const s = fresh();
  const del = s.begin({ writer: 'deleter' });
  deleteProject(del, beta);
  const rel = s.begin({ writer: 'relinker' });
  relinkQuote(rel, q1, 'p.13');
  assert.equal(s.commit(rel, op('c05-relink')).status, STATUS.CONFIRMED);
  assert.equal(s.commit(del, op('c05-delete')).status, STATUS.CONFIRMED, 'A36-C05 independent pair both confirmed');
  const st = s.current();
  assert.equal(st.records.get(q1).data.sourceRef, 'p.13');
  assert.deepEqual(st.records.get(historyId(q1)).data.events.map((e) => e.sourceRef), ['p.12', 'p.13'], 'A36-C05 Relink and history together');
  assert.equal(st.records.has(beta), false);
  assert.equal([...st.records.values()].filter((r) => r.type === 'association' && r.data.projectId === beta).length, 0, 'A36-C05 own associations removed with the project');
  for (const id of [noteId(pa1), q1, pa1, pa2, statusId(pa1), statusId(pa2), `assoc:${alpha}|${pa1}`]) assert.ok(st.records.has(id), `A36-C05 global/other record retained: ${id}`);
  assert.equal(st.records.get(`assoc:${alpha}|${pa1}`).data.important, true, 'Important of another project untouched');
  const before = stateDigest(s);
  const half = s.begin({ writer: 'half' });
  half.del(alpha); // project without its associations
  assert.equal(s.commit(half, op('c05-half-delete')).reason, 'DANGLING_REFERENCE', 'A36-C05 project deletion without its associations rejected');
  const noHist = s.begin({ writer: 'nohist' });
  const q = noHist.get(q1);
  noHist.put({ ...q, data: { ...q.data, sourceRef: 'p.99' } });
  assert.equal(s.commit(noHist, op('c05-nohist')).reason, 'QUOTE_HISTORY_MISMATCH', 'A36-C05 relink without history rejected');
  assert.equal(stateDigest(s), before);
  evid({ case_id: 'A36-C05', deleted_project: beta, deletion_checkpoint: st.deletions.get(beta), retained_globals: true });
});

test('A36-C06 crash before commit / after commit before ACK: UNKNOWN, reconciled from the operation witness, never replayed', () => {
  for (const [barrier, expectCommitted] of [['before-publish', false], ['after-publish-before-ack', true]]) {
    let armed = false; // armed only after the fixture is seeded
    const s = seededStoreWith((b) => { if (armed && b === barrier) { armed = false; throw new SimulatedCrash(b); } });
    armed = true;
    const tx = s.begin({ writer: 'w' });
    setReadingStatus(tx, A, pa2, 'read');
    const o = op(`c06-${barrier}`);
    const cps = s.checkpoints().length;
    const r = s.commit(tx, o);
    assert.equal(r.status, STATUS.UNKNOWN, `A36-C06 ${barrier}: client sees UNKNOWN`);
    assert.equal(s.crashed, true);
    s.restart();
    assert.equal(s.checkpoints().length, cps + (expectCommitted ? 1 : 0), 'A36-C06 no automatic retry after the crash');
    const rec = s.reconcile(o.opId);
    assert.equal(rec.status, expectCommitted ? STATUS.CONFIRMED : STATUS.DEFINITE_FAILURE, `A36-C06 ${barrier}: reconciled from the authoritative witness`);
    if (expectCommitted) {
      const again = s.begin({ writer: 'w' });
      setReadingStatus(again, A, pa2, 'read');
      const replay = s.commit(again, o);
      assert.equal(replay.replay, true, 'A36-C06 same opId is a replay, not a second write');
      assert.equal(s.checkpoints().length, cps + 1);
      const other = s.begin({ writer: 'w' });
      setReadingStatus(other, A, pa2, 'reading');
      assert.equal(s.commit(other, { opId: o.opId, fingerprint: 'fp-other' }).status, STATUS.CONFLICT, 'A36-C06 reused opId with other intent conflicts');
    }
  }
  evid({ case_id: 'A36-C06', fault_barrier: ['before-publish', 'after-publish-before-ack'], expected_operation_status: 'UNKNOWN -> DEFINITE_FAILURE | CONFIRMED (observed)' });
});
function seededStoreWith(barrier) { return seededStore(F0.records, { barrier }); }

test('A36-C07 export pinned at one committed cut K while a second writer commits K+1', () => {
  const s = fresh();
  const oracle = ORACLE_A_K1();
  let wrote = false;
  const ex = exportPinned(s, {
    checkpoint: 1, owner: A, oracle,
    onEach: () => { if (!wrote) { wrote = true; const tx = s.begin({ writer: 'k+1' }); relinkQuote(tx, q1, 'p.77'); putWholeNote(tx, A, pa1, Object.fromEntries(NOTE_FIELDS.map((k) => [k, `K+1 ${k}`]))); assert.equal(s.commit(tx, op('c07')).status, STATUS.CONFIRMED); } },
  });
  assert.equal(s.current().checkpoint, 2, 'writer committed K+1 during the export');
  assert.equal(ex.status, EVIDENCE.KNOWN_FIXTURE, 'A36-C07 export from exactly one committed cut');
  const got = Object.fromEntries(ex.bundle.records.map((r) => [r.id, r]));
  assert.equal(got[q1].data.sourceRef, 'p.12', 'A36-C07 quote from K');
  assert.equal(got[historyId(q1)].data.events.length, 1, 'A36-C07 history from K');
  assert.ok(got[noteId(pa1)].data.question.startsWith('# 研究问题'), 'A36-C07 note from K');
  const mixed = exportPinned(s, { checkpoint: 2, owner: A, oracle });
  assert.equal(mixed.code, 'MIXED_OR_WRONG_REVISION', 'A36-C07 negative: a K+1 cut does not certify against the K oracle');
  assert.equal(mixed.bundle, null);
  evid({ case_id: 'A36-C07', expected_commit_and_snapshot: 'K=1', concurrent_writer: 'K+1=2', bundle_digest: ex.bundleDigest });
});

test('A36-C08 valid old backup containing a later-deleted Project is blocked by the newer outside-archive witness', () => {
  const s = fresh();
  const w = createWitness();
  const key = fixtureKey();
  const old = makeArchive(exportPinned(s, { checkpoint: 1, owner: A }), { keyId: 'bk-1', key });
  assert.equal(verifyArchive(old, { keyring: keyring([['bk-1', key]]), owner: A }).ok, true, 'old archive is internally valid');
  assert.equal(confirmDeleteBeta(s, w).status, 'CONFIRMED');
  const r = stageRestore(old, { keyring: keyring([['bk-1', key]]), owner: A, witness: w, activeStore: s, minWitnessSeq: w.latest.seq });
  assert.equal(r.status, RESTORE.STALE, 'A36-C08 old archive with deleted Project blocked');
  assert.deepEqual(r.stale, [beta]);
  assert.equal(r.stage, null);
  assert.ok(s.current().records.has(noteId(pa1)) && s.current().records.has(q1), 'A36-C08 global Note/Quote unaffected');
  const newer = makeArchive(exportPinned(s, { checkpoint: s.current().checkpoint, owner: A }), { keyId: 'bk-1', key });
  assert.equal(stageRestore(newer, { keyring: keyring([['bk-1', key]]), owner: A, witness: w, activeStore: s, minWitnessSeq: w.latest.seq }).status, RESTORE.STAGED, 'A36-C08 positive: post-deletion archive stages');
  evid({ case_id: 'A36-C08', expected_deletion_checkpoint: 2, actual_deletion_checkpoint: w.latest.deleted.get(beta), archive_checkpoint: 1, result: r.status });
});

test('A36-C09 missing, rolled-back or non-independent witness fails closed (DELETION_WITNESS_UNVERIFIABLE)', () => {
  const s = fresh();
  const w = createWitness();
  const key = fixtureKey();
  assert.equal(confirmDeleteBeta(s, w).status, 'CONFIRMED');
  const arc = makeArchive(exportPinned(s, { checkpoint: s.current().checkpoint, owner: A }), { keyId: 'bk-1', key });
  const base = { keyring: keyring([['bk-1', key]]), owner: A, activeStore: s };
  assert.equal(stageRestore(arc, { ...base, witness: w, minWitnessSeq: 1 }).status, RESTORE.STAGED, 'A36-C09 positive control');
  const erased = createWitness(); erased.erase();
  assert.equal(stageRestore(arc, { ...base, witness: erased }).status, RESTORE.WITNESS, 'A36-C09 missing witness');
  const same = createWitness({ domain: 'archive-domain' });
  assert.equal(stageRestore(arc, { ...base, witness: same }).status, RESTORE.WITNESS, 'A36-C09 witness in the archive trust domain');
  const rolled = createWitness(); rolled.advance(beta, 2); rolled.rollbackTo(0);
  assert.equal(stageRestore(arc, { ...base, witness: rolled, minWitnessSeq: 1 }).status, RESTORE.WITNESS, 'A36-C09 rolled-back witness');
  const lagging = createWitness();
  assert.equal(stageRestore(arc, { ...base, witness: lagging, minWitnessSeq: 0 }).status, RESTORE.WITNESS, 'A36-C09 witness lacking a confirmed deletion');
  evid({ case_id: 'A36-C09', negatives: ['missing', 'same-domain', 'rolled-back', 'lagging'], result: RESTORE.WITNESS });
});

test('A36-C10 tampered manifest with recomputed checksum, owner/key/AAD mismatch, lost key are refused', () => {
  const s = fresh();
  const key = fixtureKey();
  const ex = exportPinned(s, { checkpoint: 1, owner: A });
  const arc = makeArchive(ex, { keyId: 'bk-1', key });
  assert.equal(verifyArchive(arc, { keyring: keyring([['bk-1', key]]), owner: A }).ok, true, 'A36-C10 positive control');
  const tampered = structuredClone(arc);
  tampered.records.find((r) => r.id === noteId(pa1)).data.question = 'tampered';
  tampered.plainChecksum = digest(tampered.records);
  tampered.manifest.recordsDigest = digest(tampered.records); // attacker recomputes every plain hash
  assert.equal(verifyArchive(tampered, { keyring: keyring([['bk-1', key]]), owner: A }).code, RESTORE.AUTH, 'A36-C10 recomputed checksum is not authentication');
  assert.equal(verifyArchive(arc, { keyring: keyring([['bk-1', key]]), owner: B }).code, RESTORE.AUTH, 'A36-C10 owner/AAD mismatch');
  assert.equal(verifyArchive(arc, { keyring: keyring([['bk-1', fixtureKey()]]), owner: A }).code, RESTORE.AUTH, 'A36-C10 wrong key');
  const lost = stageRestore(arc, { keyring: new Map(), owner: A, witness: createWitness(), activeStore: s });
  assert.equal(lost.status, RESTORE.KEY, 'A36-C10 lost key -> KEY_UNAVAILABLE');
  assert.equal(lost.stage, null, 'A36-C10 not mistaken for an empty/missing Note');
  evid({ case_id: 'A36-C10', tag: arc.tagKind, negatives: ['recomputed-checksum', 'owner-aad', 'wrong-key', 'lost-key'] });
});

test('A36-C11 isolated staging: exact UTF-8 five-field Note restored in a fresh namespace; faults never touch active', () => {
  const s = fresh();
  const key = fixtureKey();
  const kr = keyring([['bk-1', key]]);
  const arc = makeArchive(exportPinned(s, { checkpoint: 1, owner: A }), { keyId: 'bk-1', key });
  const active0 = stateDigest(s);
  const ok = stageRestore(arc, { keyring: kr, owner: A, witness: createWitness(), activeStore: s, minWitnessSeq: 0 });
  assert.equal(ok.status, RESTORE.STAGED, 'A36-C11 positive: staged only');
  const src = s.current().records.get(noteId(pa1)).data;
  const got = ok.stage.records.get(noteId(pa1)).data;
  for (const k of NOTE_FIELDS) assert.ok(Buffer.from(got[k], 'utf8').equals(Buffer.from(src[k], 'utf8')), `A36-C11 byte-exact ${k}`);
  assert.notEqual(ok.stage.records, s.current().records, 'A36-C11 stage is a separate namespace');
  let n = 0;
  const half = stageRestore(arc, { keyring: kr, owner: A, witness: createWitness(), activeStore: s, minWitnessSeq: 0, fault: (step) => { if (step === 'stage-record' && ++n === 3) throw new Error('simulated half-restore'); } });
  assert.equal(half.status, RESTORE.STAGE_FAILED, 'A36-C11 half-restore fails');
  const bad = makeArchive({ bundle: { owner: A, checkpoint: 1, records: [{ id: 'project:owner-a:../../etc', type: 'project', rev: 1, data: { title: 'x' } }] } }, { keyId: 'bk-1', key });
  assert.equal(stageRestore(bad, { keyring: kr, owner: A, witness: createWitness(), activeStore: s, minWitnessSeq: 0 }).status, RESTORE.INVALID, 'A36-C11 path-traversal id rejected');
  const schema = makeArchive({ bundle: { owner: A, checkpoint: 1, records: [...exportPinned(s, { checkpoint: 1, owner: A }).bundle.records.filter((r) => r.id !== noteId(pa1)), { id: noteId(pa1), type: 'note', rev: 1, data: { paperId: pa1, question: 'q' } }] } }, { keyId: 'bk-1', key });
  assert.equal(stageRestore(schema, { keyring: kr, owner: A, witness: createWitness(), activeStore: s, minWitnessSeq: 0 }).status, RESTORE.INVALID, 'A36-C11 bad schema rejected');
  assert.equal(stageRestore(arc, { keyring: kr, owner: B, witness: createWitness(), activeStore: s }).status, RESTORE.AUTH, 'A36-C11 foreign owner rejected');
  assert.throws(() => cutover(), /CUTOVER_NOT_AUTHORIZED/, 'A36-C11 no live cutover');
  assert.equal(stateDigest(s), active0, 'A36-C11 active state unchanged by every staging attempt');
  evid({ case_id: 'A36-C11', stage_digest: ok.stageDigest, negatives: ['half-restore', 'path-traversal', 'bad-schema', 'foreign-owner', 'cutover'] });
});

// ===================================== A36-R01..R07 =====================================
test('A36-R01 newer deletion state blocks a valid old archive and preserves shared global records', () => {
  const s = fresh();
  const w = createWitness();
  const key = fixtureKey();
  const kr = keyring([['bk-1', key]]);
  const old = makeArchive(exportPinned(s, { checkpoint: 1, owner: A }), { keyId: 'bk-1', key });
  assert.equal(confirmDeleteBeta(s, w).status, 'CONFIRMED');
  const before = stateDigest(s);
  const r = stageRestore(old, { keyring: kr, owner: A, witness: w, activeStore: s, minWitnessSeq: w.latest.seq });
  assert.equal(r.status, RESTORE.STALE, 'A36-R01 stale archive blocked');
  assert.equal(stateDigest(s), before, 'A36-R01 active unchanged');
  for (const id of [noteId(pa1), q1, historyId(q1), pa1, statusId(pa1)]) assert.ok(s.current().records.has(id), `A36-R01 shared ${id} retained`);
  const fresher = makeArchive(exportPinned(s, { checkpoint: s.current().checkpoint, owner: A }), { keyId: 'bk-1', key });
  assert.equal(stageRestore(fresher, { keyring: kr, owner: A, witness: w, activeStore: s, minWitnessSeq: w.latest.seq }).status, RESTORE.STAGED, 'A36-R01 positive control');
  evid({ case_id: 'A36-R01', expected_deletion_checkpoint: 2, actual_deletion_checkpoint: w.latest.deleted.get(beta), result: r.status });
});

test('A36-R02 removed, tampered or replayed witness (alone or together with the store) -> STOP', () => {
  const s = fresh();
  const w = createWitness();
  const key = fixtureKey();
  const kr = keyring([['bk-1', key]]);
  const old = makeArchive(exportPinned(s, { checkpoint: 1, owner: A }), { keyId: 'bk-1', key });
  assert.equal(confirmDeleteBeta(s, w).status, 'CONFIRMED');
  const lastSeen = w.latest.seq;
  const removed = createWitness(); removed.erase();
  assert.equal(stageRestore(old, { keyring: kr, owner: A, witness: removed, activeStore: s }).status, RESTORE.WITNESS, 'A36-R02 removed witness');
  const replayed = createWitness(); replayed.advance(beta, 2); replayed.rollbackTo(0);
  assert.equal(stageRestore(old, { keyring: kr, owner: A, witness: replayed, minWitnessSeq: lastSeen }).status, RESTORE.WITNESS, 'A36-R02 replayed older witness');
  s.rollbackTo(1); // store (T1/T2) and witness (T3) replayed together
  const both = createWitness(); both.advance(beta, 2); both.rollbackTo(0);
  const r = stageRestore(old, { keyring: kr, owner: A, witness: both, activeStore: s, minWitnessSeq: lastSeen });
  assert.equal(r.status, RESTORE.WITNESS, 'A36-R02 joint replay of store and witness -> STOP, no false rollback resistance');
  assert.equal(stageRestore(old, { keyring: kr, owner: A, witness: w, activeStore: s, minWitnessSeq: lastSeen }).status, RESTORE.ROLLBACK, 'A36-R02 intact witness exposes the store rollback');
  evid({ case_id: 'A36-R02', last_seen_witness_seq: lastSeen, results: ['WITNESS', 'WITNESS', 'WITNESS', 'ROLLBACK'] });
});

test('A36-R03 crash between confirmed deletion and witness advance (both orders) -> never CONFIRMED, quarantined, restore STOP', () => {
  for (const order of ['store-first', 'witness-first']) {
    const s = fresh();
    const w = createWitness();
    const key = fixtureKey();
    const kr = keyring([['bk-1', key]]);
    const old = makeArchive(exportPinned(s, { checkpoint: 1, owner: A }), { keyId: 'bk-1', key });
    const pending = new Set();
    const o = op(`r03-${order}`);
    const r = confirmProjectDeletion({ store: s, witness: w, projectId: beta, opId: o.opId, order, crashBetween: true, pending, deleteTx: () => { const tx = s.begin(); deleteProject(tx, beta); return s.commit(tx, o); } });
    assert.notEqual(r.status, 'CONFIRMED', `A36-R03 ${order}: never CONFIRMED`);
    assert.equal(r.quarantined, beta, `A36-R03 ${order}: orphan intent quarantined`);
    assert.equal(stageRestore(old, { keyring: kr, owner: A, witness: w, activeStore: s, minWitnessSeq: 0, pendingDeletions: pending }).status, RESTORE.RECONCILE, `A36-R03 ${order}: restore STOP until reconciled`);
    const s2 = fresh(); const w2 = createWitness(); const p2 = new Set(); const o2 = op(`r03-ok-${order}`);
    const ok = confirmProjectDeletion({ store: s2, witness: w2, projectId: beta, opId: o2.opId, order, pending: p2, deleteTx: () => { const tx = s2.begin(); deleteProject(tx, beta); return s2.commit(tx, o2); } });
    assert.equal(ok.status, 'CONFIRMED', `A36-R03 ${order}: positive control`);
    assert.equal(p2.size, 0);
  }
  evid({ case_id: 'A36-R03', orders: ['store-first', 'witness-first'], crash: 'between', result: 'UNKNOWN + RECONCILIATION_PENDING' });
});

test('A36-R04 staged restore reproduces exact identities, links, revisions, counts and UTF-8 bytes, or fails without touching active', () => {
  const s = fresh();
  const tx = s.begin(); relinkQuote(tx, q1, 'p.40'); assert.equal(s.commit(tx, op('r04')).status, STATUS.CONFIRMED);
  const key = fixtureKey();
  const kr = keyring([['bk-1', key]]);
  const ex = exportPinned(s, { checkpoint: 2, owner: A });
  const arc = makeArchive(ex, { keyId: 'bk-1', key });
  const r = stageRestore(arc, { keyring: kr, owner: A, witness: createWitness(), activeStore: s, minWitnessSeq: 0 });
  assert.equal(r.status, RESTORE.STAGED, 'A36-R04 positive');
  assert.equal(r.stage.records.size, ex.bundle.records.length, 'A36-R04 exact count');
  for (const rec of ex.bundle.records) {
    const st = r.stage.records.get(rec.id);
    assert.equal(st.rev, rec.rev, `A36-R04 revision ${rec.id}`);
    assert.equal(digest(st.data), digest(rec.data), `A36-R04 bytes ${rec.id}`);
  }
  assert.deepEqual(r.stage.records.get(historyId(q1)).data.events.map((e) => e.seq), [1, 2], 'A36-R04 ordered history');
  const active0 = stateDigest(s);
  const truncated = makeArchive({ bundle: { ...ex.bundle, records: ex.bundle.records.filter((x) => x.id !== historyId(q1)) } }, { keyId: 'bk-1', key });
  assert.equal(stageRestore(truncated, { keyring: kr, owner: A, witness: createWitness(), activeStore: s, minWitnessSeq: 0 }).status, RESTORE.INVALID, 'A36-R04 missing linked history fails');
  assert.equal(stateDigest(s), active0, 'A36-R04 active unchanged');
  evid({ case_id: 'A36-R04', staged_count: r.stage.records.size, stage_digest: r.stageDigest });
});

test('A36-R05 wrong key version, lost key, wrong owner, stale-but-valid manifest: honest refusal, no key regeneration', async () => {
  const s = fresh();
  const w = createWitness();
  const key = fixtureKey();
  const arc = makeArchive(exportPinned(s, { checkpoint: 1, owner: A }), { keyId: 'bk-1', key });
  assert.equal(stageRestore(arc, { keyring: keyring([['bk-2', fixtureKey()]]), owner: A, witness: w, activeStore: s }).status, RESTORE.KEY, 'A36-R05 wrong key version');
  assert.equal(stageRestore(arc, { keyring: new Map(), owner: A, witness: w, activeStore: s }).status, RESTORE.KEY, 'A36-R05 lost key');
  assert.equal(stageRestore(arc, { keyring: keyring([['bk-1', key]]), owner: B, witness: w, activeStore: s }).status, RESTORE.AUTH, 'A36-R05 wrong owner/AAD');
  assert.equal(confirmDeleteBeta(s, w).status, 'CONFIRMED');
  assert.equal(stageRestore(arc, { keyring: keyring([['bk-1', key]]), owner: A, witness: w, activeStore: s, minWitnessSeq: w.latest.seq }).status, RESTORE.STALE, 'A36-R05 valid but stale manifest');
  const mod = await import('../src/recovery.mjs');
  assert.ok(!Object.keys(mod).some((k) => /regenerat|reset|derive.*key/i.test(k)), 'A36-R05 no key regeneration path exists');
  evid({ case_id: 'A36-R05', negatives: ['wrong-key-version', 'lost-key', 'wrong-owner', 'stale-manifest'] });
});

test('A36-R06 crash half-way through staging and concurrent restores never write active; cutover not authorized', () => {
  const s = fresh();
  const key = fixtureKey();
  const kr = keyring([['bk-1', key]]);
  const arc = makeArchive(exportPinned(s, { checkpoint: 1, owner: A }), { keyId: 'bk-1', key });
  const active0 = stateDigest(s);
  let n = 0;
  const crashed = stageRestore(arc, { keyring: kr, owner: A, witness: createWitness(), activeStore: s, minWitnessSeq: 0, fault: (step) => { if (step === 'stage-record' && ++n === 7) throw new SimulatedCrash('stage'); } });
  assert.equal(crashed.status, RESTORE.STAGE_FAILED, 'A36-R06 half-way crash fails safely');
  assert.equal(crashed.stage, null);
  const a = stageRestore(arc, { keyring: kr, owner: A, witness: createWitness(), activeStore: s, minWitnessSeq: 0 });
  const b = stageRestore(arc, { keyring: kr, owner: A, witness: createWitness(), activeStore: s, minWitnessSeq: 0 });
  assert.notEqual(a.stage.namespace, b.stage.namespace, 'A36-R06 concurrent restores use separate stages');
  assert.throws(() => cutover(), /CUTOVER_NOT_AUTHORIZED/);
  assert.equal(stateDigest(s), active0, 'A36-R06 no active writes');
  evid({ case_id: 'A36-R06', fault_barrier: 'stage-record #7', result: crashed.status });
});

test('A36-R07 privacy erasure vs retained deletion state: POLICY_DECISION_PENDING, no invented retention days', () => {
  const s = fresh();
  const key = fixtureKey();
  const kr = keyring([['bk-1', key]]);
  const arc = makeArchive(exportPinned(s, { checkpoint: 1, owner: A }), { keyId: 'bk-1', key });
  const r = stageRestore(arc, { keyring: kr, owner: A, witness: createWitness(), activeStore: s, minWitnessSeq: 0, privacyRequests: [{ subject: 'synthetic-erasure-request' }] });
  assert.equal(r.status, RESTORE.POLICY, 'A36-R07 undecided policy -> POLICY_DECISION_PENDING');
  const decided = stageRestore(arc, { keyring: kr, owner: A, witness: createWitness(), activeStore: s, minWitnessSeq: 0, privacyRequests: [{ subject: 'synthetic-erasure-request' }], retentionPolicy: { decidedBy: 'test-only placeholder' } });
  assert.equal(decided.status, RESTORE.STAGED, 'A36-R07 positive control only when a decision is supplied');
  const src = ['model.mjs', 'snapshot.mjs', 'recovery.mjs'].map((f) => readFileSync(join(ROOT, 'src', f), 'utf8')).join('\n');
  assert.doesNotMatch(src, /retention[^\n]{0,40}\b\d+\s*(day|days|d)\b/i, 'A36-R07 no invented retention period in the model');
  evid({ case_id: 'A36-R07', result: r.status });
});

// ============================ A44 minimal remediation (P2-L3-QA-1 / P2-L3-QA-2) ============================
test('A44-ANCHOR-01 explicit synthetic anti-rollback floor is mandatory before any staging (P2-L3-QA-1)', () => {
  const s = fresh();
  const key = fixtureKey();
  const kr = keyring([['bk-1', key]]);
  const arc = makeArchive(exportPinned(s, { checkpoint: 1, owner: A }), { keyId: 'bk-1', key });
  const w = createWitness();
  const active0 = stateDigest(s);
  const seq0 = w.latest.seq;
  let stagingCallbacks = 0;
  const fault = () => { stagingCallbacks++; };
  const base = { keyring: kr, owner: A, witness: w, activeStore: s, fault };
  const invalid = [undefined, null, NaN, Infinity, -Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, -0, '0', '1', false, true, {}, [], 0n];
  for (const v of invalid) {
    const r = stageRestore(arc, { ...base, minWitnessSeq: v });
    assert.equal(r.status, RESTORE.WITNESS, `A44-ANCHOR-01 invalid floor ${String(v)} refused`);
    assert.equal(r.reason, 'ROLLBACK_RESISTANCE_UNVERIFIED', `A44-ANCHOR-01 invalid floor ${String(v)} reason`);
    assert.equal(r.stage, null, `A44-ANCHOR-01 invalid floor ${String(v)} no stage`);
  }
  const omitted = stageRestore(arc, base);
  assert.equal(omitted.status, RESTORE.WITNESS, 'A44-ANCHOR-01 omitted floor refused');
  assert.equal(omitted.reason, 'ROLLBACK_RESISTANCE_UNVERIFIED', 'A44-ANCHOR-01 omitted floor reason');
  assert.equal(stagingCallbacks, 0, 'A44-ANCHOR-01 absent/invalid anchor never reaches staging');
  assert.equal(stateDigest(s), active0, 'A44-ANCHOR-01 active store unchanged');
  assert.equal(w.latest.seq, seq0, 'A44-ANCHOR-01 witness not advanced');
  const genesis = stageRestore(arc, { ...base, minWitnessSeq: 0 });
  assert.equal(genesis.status, RESTORE.STAGED, 'A44-ANCHOR-01 explicit known-genesis 0 stages');
  assert.equal(stagingCallbacks, arc.manifest.ids.length + 1, 'A44-ANCHOR-01 staging callbacks only after a valid floor');
  const tooNew = stageRestore(arc, { ...base, minWitnessSeq: Number.MAX_SAFE_INTEGER });
  assert.equal(tooNew.status, RESTORE.WITNESS, 'A44-ANCHOR-01 future floor above the witness seq rejects');
  assert.notEqual(tooNew.reason, 'ROLLBACK_RESISTANCE_UNVERIFIED', 'A44-ANCHOR-01 valid-but-too-high floor keeps the retained seq gate');
});

test('A44-C07-HISTORICAL-K exact pinned checkpoint', () => {
  const s = fresh();
  const K1 = s.current().checkpoint;
  assert.equal(K1, 1, 'A44-C07-HISTORICAL-K fixture genesis is K1');
  const ownerAIds = F0.records.filter((r) => r.owner === A).map((r) => r.id).sort();
  const oracle = trustedInventory(Object.fromEntries(ownerAIds.map((id) => [id, 1])));
  const quiet = exportPinned(s, { checkpoint: K1, owner: A, oracle });
  assert.equal(quiet.status, EVIDENCE.KNOWN_FIXTURE, 'A44-C07-HISTORICAL-K quiet K1 reference is enumerable');
  // K2: replace the WHOLE five-field Note and relink the Quote with its SourceHistory event.
  const tx2 = s.begin({ writer: 'k2' });
  putWholeNote(tx2, A, pa1, Object.fromEntries(NOTE_FIELDS.map((k) => [k, `K2 ${k} 更新`])));
  relinkQuote(tx2, q1, 'p.44');
  assert.equal(s.commit(tx2, op('a44-k2')).status, STATUS.CONFIRMED, 'A44-C07-HISTORICAL-K K2 committed');
  // K3: change the ReadingStatus and delete Project beta plus its own Associations.
  const tx3 = s.begin({ writer: 'k3' });
  setReadingStatus(tx3, A, pa1, 'read');
  deleteProject(tx3, beta);
  assert.equal(s.commit(tx3, op('a44-k3')).status, STATUS.CONFIRMED, 'A44-C07-HISTORICAL-K K3 committed');
  assert.equal(s.current().checkpoint, K1 + 2, 'A44-C07-HISTORICAL-K head advanced past K1');
  const before = stateDigest(s);
  const ex = exportPinned(s, { checkpoint: K1, owner: A, oracle });
  assert.equal(ex.status, EVIDENCE.KNOWN_FIXTURE, 'A44-C07-HISTORICAL-K exact pinned checkpoint');
  assert.equal(ex.bundle.checkpoint, K1, 'A44-C07-HISTORICAL-K bundle checkpoint is K1');
  const got = new Map(ex.bundle.records.map((r) => [r.id, r]));
  const declared = new Map(F0.records.map((r) => [r.id, r]));
  assert.deepEqual([...got.keys()].sort(), oracle.ids(), 'A44-C07-HISTORICAL-K exact K1 id set');
  for (const id of oracle.ids()) {
    assert.equal(got.get(id).rev, oracle.rev(id), `A44-C07-HISTORICAL-K revision ${id}`);
    assert.ok(fixtureEncode(got.get(id).data).equals(fixtureEncode(declared.get(id).data)), `A44-C07-HISTORICAL-K UTF-8 bytes ${id}`);
  }
  assert.equal(got.get(noteId(pa1)).data.question, declared.get(noteId(pa1)).data.question, 'A44-C07-HISTORICAL-K no K2 Note update');
  assert.deepEqual(got.get(historyId(q1)).data.events, [{ seq: 1, sourceRef: 'p.12' }], 'A44-C07-HISTORICAL-K no K2 history update');
  assert.equal(got.get(statusId(pa1)).data.status, 'reading', 'A44-C07-HISTORICAL-K no K3 status update');
  assert.ok(got.has(beta), 'A44-C07-HISTORICAL-K historical Project beta retained');
  for (const a of F0.records.filter((r) => r.type === 'association' && r.data.projectId === beta)) assert.ok(got.has(a.id), `A44-C07-HISTORICAL-K historical association ${a.id}`);
  assert.ok(![...got.keys()].some((id) => id.includes(':owner-b:')), 'A44-C07-HISTORICAL-K owner exclusion');
  assert.equal(digest(ex.bundle), quiet.bundleDigest, 'A44-C07-HISTORICAL-K quiet-reference digest equality');
  assert.equal(stateDigest(s), before, 'A44-C07-HISTORICAL-K export does not mutate active state');
  const wrong = exportPinned(s, { checkpoint: K1 + 2, owner: A, oracle });
  assert.equal(wrong.bundle, null, 'A44-C07-HISTORICAL-K K3 against the K1 oracle yields no bundle');
  assert.equal(wrong.status, 'FAIL', 'A44-C07-HISTORICAL-K wrong-oracle negative is a FAIL');
});

// A36-C12 runs last in this file so the egress trap has observed every other case in it.
test('A36-C12 no network, no secrets/PDF bytes, no forbidden imports; only the L3 prefix is used', () => {
  const srcFiles = readdirSync(join(ROOT, 'src')).map((f) => [f, readFileSync(join(ROOT, 'src', f), 'utf8')]);
  for (const [f, txt] of srcFiles) {
    assert.doesNotMatch(txt, /from ['"]node:(net|http|https|http2|dns|tls|dgram|child_process|worker_threads|fs)['"]/, `A36-C12 ${f} imports no network/process/fs module`);
    assert.doesNotMatch(txt, /\bfetch\(|XMLHttpRequest|WebSocket/, `A36-C12 ${f} no fetch/socket API`);
  }
  const all = [...srcFiles, ...readdirSync(HERE).map((f) => [f, readFileSync(join(HERE, f), 'utf8')])];
  for (const [f, txt] of all) {
    assert.doesNotMatch(txt, /-----BEGIN [A-Z ]*PRIVATE KEY-----|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}/, `A36-C12 ${f} contains no key/token`);
  }
  assert.doesNotMatch(JSON.stringify(F0), /%PDF-/, 'A36-C12 fixture contains no PDF bytes');
  const exported = JSON.stringify(exportPinned(fresh(), { checkpoint: 1, owner: A }).bundle);
  assert.doesNotMatch(exported, /UNCONFIRMED local draft/, 'A36-C12 local drafts never exported');
  assert.deepEqual(egress, [], 'A36-C12 zero socket/DNS/TLS attempts during the whole contract suite');
  evid({ case_id: 'A36-C12', egress_attempts: egress.length, scanned_files: all.length });
});

// Barrier list sanity (used by l3-faults T01): keep the contract explicit.
test('model exposes every commit barrier used by the fault suite', () => {
  assert.deepEqual([...BARRIERS], ['after-validate', 'after-build', 'before-publish', 'after-publish-before-ack']);
  assert.equal(typeof createStore, 'function');
});
