// Q1E-L3 (D007-A37) — meaningful mutation verifier. Every mutant is applied to a DISPOSABLE copy of poc/q1e-l3
// under os.tmpdir() (outside the repository); the tracked source is never modified. A mutant counts as KILLED only
// when the suite fails AND the intended named A36 assertion appears in the output; a failure for another reason is
// WRONG_REASON, a passing suite is SURVIVED, a missing patch site is NOT_RUN. No fixed totals are assumed.
import { cp, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SUITES = ['test/l3-contract.test.mjs', 'test/l3-faults.test.mjs'];

const MUTANTS = [
  // ---- the eight mandatory A37 classes ----
  { id: 'M-INV', cls: 'known inventory omission accepted as complete', file: 'src/snapshot.mjs',
    from: '  const missing = catalog.ids().filter((id) => !listed.has(id));', to: '  const missing = [];',
    expect: /A36-C01 known omitted ID detected/ },
  { id: 'M-COMMIT', cls: 'split record/catalog commit (records published before catalog+witness)', file: 'src/model.mjs',
    from: "    barrier('before-publish', { opId, checkpoint });\n    versions.push(candidate);",
    to: "    versions.push(deepFreeze({ ...cur, records, checkpoint }));\n    barrier('before-publish', { opId, checkpoint });\n    versions.push(candidate);",
    expect: /A36-T01 no partial publish at barrier/ },
  { id: 'M-HISTORY', cls: 'Quote Relink published without its SourceHistory event', file: 'src/model.mjs',
    from: "        if (!ev.length || ev.at(-1).sourceRef !== d.sourceRef) fail('QUOTE_HISTORY_MISMATCH', r.id);", to: '        // quote/history pairing check removed',
    expect: /A36-C05 relink without history rejected/ },
  { id: 'M-CAS', cls: 'read-set (write-skew) conflict check removed', file: 'src/model.mjs',
    from: "      if (now !== seen) return { status: STATUS.CONFLICT, reason: 'SERIALIZATION_CONFLICT', key, opId };", to: '      void now;',
    expect: /A36-T03 \S+: write skew aborted/ },
  { id: 'M-SNAP', cls: 'export mixes K with K+1 (reads current instead of pinned)', file: 'src/snapshot.mjs',
    from: '    const rec = pinned.records.get(id);', to: '    const rec = store.current().records.get(id) ?? pinned.records.get(id);',
    expect: /A36-(C07|T04) (export from exactly one committed cut|pinned export)/ },
  { id: 'M-ACK', cls: 'false CONFIRMED / DEFINITE_FAILURE after a lost ACK', file: 'src/model.mjs',
    from: "      if (e instanceof SimulatedCrash) { crashed = true; return { status: STATUS.UNKNOWN, reason: 'ACK_LOST_OR_CRASH', barrier: e.barrier, opId: op.opId }; }",
    to: "      if (e instanceof SimulatedCrash) { crashed = true; return { status: e.barrier === 'after-publish-before-ack' ? STATUS.CONFIRMED : STATUS.DEFINITE_FAILURE, barrier: e.barrier, opId: op.opId }; }",
    expect: /A36-C06 \S+: client sees UNKNOWN|A36-T02 lost ACK -> UNKNOWN/ },
  { id: 'M-DELETE', cls: 'newer deletion high-watermark ignored (old Project resurrects)', file: 'src/recovery.mjs',
    from: '  if (staleIds.length) return { status: RESTORE.STALE, stale: staleIds, stage: null };', to: '  void staleIds;',
    expect: /A36-C08 old archive with deleted Project blocked|A36-R01 stale archive blocked/ },
  { id: 'M-STAGE', cls: 'isolated restore writes into the active store', file: 'src/recovery.mjs',
    from: '  const records = new Map();\n  const catalog = new Map();', to: '  const records = activeStore ? activeStore.current().records : new Map();\n  const catalog = activeStore ? activeStore.current().catalog : new Map();',
    expect: /A36-C11 (stage is a separate namespace|active state unchanged)/ },
  // ---- additional recommended classes ----
  { id: 'M-OWNER', cls: 'cross-owner reference accepted', file: 'src/model.mjs',
    from: "    if (t.owner !== from.owner) fail('CROSS_OWNER_REFERENCE', `${from.id} -> ${id}`);", to: '    // owner check removed',
    expect: /A36-C03 cross rejected/ },
  { id: 'M-NOTE', cls: 'partial (fieldwise) Note accepted', file: 'src/model.mjs',
    from: "        if (r.id !== noteId(d.paperId) || keys.join() !== [...NOTE_FIELDS].sort().join() || !NOTE_FIELDS.every((k) => typeof d[k] === 'string')) fail('BAD_NOTE_FIVE_FIELDS', r.id);",
    to: "        if (r.id !== noteId(d.paperId)) fail('BAD_NOTE_FIVE_FIELDS', r.id);",
    expect: /A36-C04 fieldwise\/partial note rejected/ },
  { id: 'M-HASH', cls: 'recomputed plain checksum accepted instead of the fixture tag', file: 'src/recovery.mjs',
    from: "  if (a.length !== t.length || !crypto.timingSafeEqual(a, t)) return { ok: false, code: RESTORE.AUTH, detail: 'tag mismatch' };", to: '  void a; void t;',
    expect: /A36-C10 (recomputed checksum is not authentication|wrong key)/ },
  { id: 'M-GLOBAL', cls: 'Project deletion cascades into the shared global Note', file: 'src/model.mjs',
    from: '  for (const a of tx.scan(\'association\')) if (a.data.projectId === projectId) tx.del(a.id);',
    to: "  for (const a of tx.scan('association')) if (a.data.projectId === projectId) { tx.del(a.id); if (tx.get(noteId(a.data.paperId))) tx.del(noteId(a.data.paperId)); }",
    expect: /A36-C05 global\/other record retained|A36-T03 global/ },
  // ---- A44 remediation classes (P2-L3-QA-1 anchor admission, P2-L3-QA-2 historical head selection) ----
  { id: 'M-ANCHOR-BYPASS', cls: 'missing/invalid explicit anti-rollback floor accepted (implicit genesis)', file: 'src/recovery.mjs',
    from: "  if (typeof minWitnessSeq !== 'number' || !Number.isSafeInteger(minWitnessSeq) || minWitnessSeq < 0 || Object.is(minWitnessSeq, -0)) {", to: '  if (false) {',
    expect: /A44-ANCHOR-01/ },
  { id: 'M-SNAP-HEAD', cls: 'historical export selects the current head instead of the pinned checkpoint', file: 'src/snapshot.mjs',
    from: '  const pinned = store.stateAt(checkpoint);', to: '  const pinned = store.current();',
    expect: /A44-C07-HISTORICAL-K/ },
];

const work = await mkdtemp(join(tmpdir(), 'q1e-l3-mut-'));
const rows = [];
try {
  for (const m of MUTANTS) {
    const dir = join(work, m.id);
    await cp(ROOT, dir, { recursive: true, filter: (p) => !p.includes('/evidence') });
    const f = join(dir, m.file);
    const src = await readFile(f, 'utf8');
    const n = src.split(m.from).length - 1;
    if (n !== 1) { rows.push({ ...m, verdict: 'NOT_RUN', note: `patch site occurrences ${n}` }); continue; }
    await writeFile(f, src.replace(m.from, m.to));
    const syn = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    if (syn.status !== 0) { rows.push({ ...m, verdict: 'NOT_RUN', note: 'mutant does not parse' }); continue; }
    const t0 = Date.now();
    const r = spawnSync(process.execPath, ['--test', ...SUITES], { cwd: dir, encoding: 'utf8', timeout: 120_000 });
    const out = `${r.stdout}${r.stderr}`;
    const failing = (out.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 70));
    const verdict = r.status === 0 ? 'SURVIVED' : r.signal ? 'WRONG_REASON' : m.expect.test(out) ? 'KILLED_BY_INTENDED_ORACLE' : 'WRONG_REASON';
    rows.push({ ...m, verdict, exit: r.status, ms: Date.now() - t0, failing });
  }
} finally {
  await rm(work, { recursive: true, force: true });
}
for (const r of rows) console.log(`${r.id.padEnd(10)} ${r.verdict.padEnd(26)} ${r.cls}${r.note ? ` [${r.note}]` : ''}${r.failing ? ` :: ${r.failing.length} failing (${r.failing.join(' | ')})` : ''}`);
const count = (v) => rows.filter((r) => r.verdict === v).length;
const killed = count('KILLED_BY_INTENDED_ORACLE');
console.log(`MUTATION: executed ${rows.length - count('NOT_RUN')}, killed-by-intended-assertion ${killed}, survivors ${count('SURVIVED')}, wrong-reason ${count('WRONG_REASON')}, not-run ${count('NOT_RUN')}`);
process.exit(killed === rows.length ? 0 : 1);
