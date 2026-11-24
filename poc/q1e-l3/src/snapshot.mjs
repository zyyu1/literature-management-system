// Q1E-L3 (D007-A37) — trusted PREDECLARED synthetic inventory, pinned-checkpoint snapshot read and
// fixture-only encoding. LOCAL / SYNTHETIC / MODEL_ONLY.
//
// Nothing here proves general completeness. An independent predeclared fixture catalog can detect a KNOWN
// omission (A36-C01); an omission that is absent from every source we have cannot be detected (A36-C02), and
// is reported as UNSUPPORTED_COMPLETENESS. No production manifest signing or canonical-JSON profile is chosen:
// `fixtureEncode` is a deterministic FIXTURE-ONLY byte encoding for test digests.
import crypto from 'node:crypto';
import { paperId, noteId, statusId, historyId } from './model.mjs';

export const EVIDENCE = Object.freeze({
  MODEL_ONLY: 'MODEL_ONLY',
  PHYSICAL: 'PHYSICAL_DURABILITY_UNPROVEN',
  COMPLETENESS: 'UNSUPPORTED_COMPLETENESS',
  BACKUP: 'NOT_RESTORE_CERTIFIED',
  KNOWN_FIXTURE: 'KNOWN_FIXTURE_ENUMERATION_OBSERVED',
});

/** Deterministic fixture-only encoding (sorted keys, Maps as sorted entry arrays). Not a production profile. */
export function fixtureEncode(v) {
  const norm = (x) => {
    if (x instanceof Map) return [...x.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([k, w]) => [k, norm(w)]);
    if (Array.isArray(x)) return x.map(norm);
    if (x && typeof x === 'object') return Object.fromEntries(Object.keys(x).sort().map((k) => [k, norm(x[k])]));
    return x;
  };
  return Buffer.from(JSON.stringify(norm(v)), 'utf8');
}
export const digest = (v) => crypto.createHash('sha256').update(fixtureEncode(v)).digest('hex');

/**
 * The independent oracle: an expected id -> revision map declared by the TEST, not derived from the system
 * under test. `expectedAt(checkpoint)` must be supplied by the fixture author.
 */
export function trustedInventory(expected) {
  const m = new Map(Object.entries(expected));
  return Object.freeze({ ids: () => [...m.keys()].sort(), rev: (id) => m.get(id), size: m.size, digest: digest(m), source: 'PREDECLARED_TEST_FIXTURE' });
}

/**
 * A36-C01/C02: compare an (untrusted) DAV-like listing against a catalog.
 * - With an independent predeclared catalog, a missing KNOWN id fails closed (no partial bundle, no count proof).
 * - When the "catalog" was derived from the same listing, nothing can be detected: the honest answer is
 *   UNSUPPORTED_COMPLETENESS, never a success claim.
 */
export function checkListing(listingIds, catalog, { catalogSource }) {
  const listed = new Set(listingIds);
  const missing = catalog.ids().filter((id) => !listed.has(id));
  const unexpected = [...listed].filter((id) => catalog.rev(id) === undefined).sort();
  if (missing.length) return { status: 'FAIL', code: 'KNOWN_ID_OMITTED', missing, bundle: null, certified: false };
  if (unexpected.length) return { status: 'FAIL', code: 'UNEXPECTED_ID', unexpected, bundle: null, certified: false };
  if (catalogSource !== 'PREDECLARED_TEST_FIXTURE') {
    return { status: 'UNSUPPORTED', code: EVIDENCE.COMPLETENESS, reason: 'NO_INDEPENDENT_ORACLE', certified: false };
  }
  return { status: EVIDENCE.KNOWN_FIXTURE, completeness: EVIDENCE.COMPLETENESS, certified: false };
}

/**
 * A36-C07/T04: export pinned at ONE committed checkpoint K. Every record and revision comes from that one
 * published state even if writers publish K+1.. while the export runs. `onEach` lets a test interleave a
 * concurrent writer between record reads. The result is compared with the independent oracle for K; a known
 * id that is missing or at another revision fails closed with no bundle.
 */
export function exportPinned(store, { checkpoint, owner, oracle, onEach = () => {} }) {
  const pinned = store.stateAt(checkpoint);
  const out = [];
  for (const id of [...pinned.catalog.keys()].sort()) {
    const rec = pinned.records.get(id);
    if (rec.owner !== owner) continue;
    out.push({ id, type: rec.type, rev: rec.rev, data: rec.data });
    onEach(id);
  }
  const got = new Map(out.map((r) => [r.id, r.rev]));
  if (oracle) {
    const missing = oracle.ids().filter((id) => !got.has(id));
    if (missing.length) return { status: 'FAIL', code: 'KNOWN_ID_OMITTED', missing, bundle: null };
    const wrongRev = oracle.ids().filter((id) => got.get(id) !== oracle.rev(id));
    if (wrongRev.length) return { status: 'FAIL', code: 'MIXED_OR_WRONG_REVISION', wrongRev, bundle: null };
    const extra = [...got.keys()].filter((id) => oracle.rev(id) === undefined);
    if (extra.length) return { status: 'FAIL', code: 'UNEXPECTED_ID', extra, bundle: null };
  }
  const bundle = { owner, checkpoint, records: out };
  return {
    status: oracle ? EVIDENCE.KNOWN_FIXTURE : 'UNVERIFIED_ENUMERATION',
    completeness: EVIDENCE.COMPLETENESS,
    certification: EVIDENCE.BACKUP,
    durability: EVIDENCE.PHYSICAL,
    bundle,
    bundleDigest: digest(bundle),
  };
}

/**
 * A36-T07: an export manifest written to an EXTERNAL sink after the internal transaction. If that write fails,
 * the internal data stays intact and the backup is NOT_RESTORE_CERTIFIED — there is no cross-store atomicity.
 */
export function writeExternalManifest(exported, sink) {
  const manifest = { owner: exported.bundle.owner, checkpoint: exported.bundle.checkpoint, ids: exported.bundle.records.map((r) => [r.id, r.rev]), digest: exported.bundleDigest };
  try {
    sink(manifest);
  } catch (e) {
    return { status: 'MANIFEST_WRITE_FAILED', certification: EVIDENCE.BACKUP, reason: String(e.message ?? e) };
  }
  // Even a successful external write is only a fixture manifest, never a backup certificate.
  return { status: 'MANIFEST_WRITTEN_FIXTURE_ONLY', certification: EVIDENCE.BACKUP, manifest };
}

/**
 * Synthetic fixture F0 (A36 §A), predeclared and test-only. Two owners; the same Zotero itemKey in two library
 * scopes of one owner and in another owner's library; two Projects of owner-a (beta is the one a test deletes);
 * Associations with per-project Important; a shared whole five-field UTF-8 Markdown Note; a shared ReadingStatus;
 * a KeyQuote with confirmed SourceHistory. `localDrafts` are unconfirmed browser-local drafts that must NEVER
 * enter the store or an export. All text is invented; no real paper, PDF, annotation or credential.
 */
export function syntheticFixtureF0() {
  const A = 'owner-a';
  const B = 'owner-b';
  const pa1 = paperId({ owner: A, libraryType: 'user', libraryId: '1001', itemKey: 'ABCD2345' });
  const pa2 = paperId({ owner: A, libraryType: 'group', libraryId: '2002', itemKey: 'ABCD2345' });
  const pa3 = paperId({ owner: A, libraryType: 'user', libraryId: '1001', itemKey: 'ZXCV6789' });
  const pb1 = paperId({ owner: B, libraryType: 'user', libraryId: '1001', itemKey: 'ABCD2345' });
  const alpha = 'project:owner-a:alpha';
  const beta = 'project:owner-a:beta';
  const gamma = 'project:owner-b:gamma';
  const q1 = 'quote:owner-a:q1';
  const paper = (owner, id, libraryType, libraryId, itemKey) => ({ id, type: 'paper', owner, data: { libraryType, libraryId, itemKey } });
  const assoc = (owner, p, pid, important) => ({ id: `assoc:${p}|${pid}`, type: 'association', owner, data: { projectId: p, paperId: pid, important } });
  const note = (owner, pid, tag) => ({
    id: noteId(pid), type: 'note', owner,
    data: {
      paperId: pid,
      question: `# 研究问题 ${tag}\r\n合成问题：为何 *缓存* 会失效？ 🧪`,
      arguments: `- 论点一\n- Argument two with combining é (e\u0301) and NFC é`,
      methods: '```\nsynthetic-method --dry-run\n```\n',
      contributions: '贡献：**合成**数据，无真实文献。',
      limitations: 'Limitations: none real; trailing spaces kept  \n',
    },
  });
  const records = [
    paper(A, pa1, 'user', '1001', 'ABCD2345'),
    paper(A, pa2, 'group', '2002', 'ABCD2345'),
    paper(A, pa3, 'user', '1001', 'ZXCV6789'),
    paper(B, pb1, 'user', '1001', 'ABCD2345'),
    { id: alpha, type: 'project', owner: A, data: { title: 'Synthetic Alpha' } },
    { id: beta, type: 'project', owner: A, data: { title: 'Synthetic Beta' } },
    { id: gamma, type: 'project', owner: B, data: { title: 'Synthetic Gamma' } },
    assoc(A, alpha, pa1, true), assoc(A, alpha, pa3, false), assoc(A, beta, pa1, true), assoc(A, beta, pa2, false),
    assoc(B, gamma, pb1, false),
    note(A, pa1, 'A1'), note(B, pb1, 'B1'),
    { id: statusId(pa1), type: 'readingStatus', owner: A, data: { paperId: pa1, status: 'reading' } },
    { id: statusId(pa2), type: 'readingStatus', owner: A, data: { paperId: pa2, status: 'unread' } },
    { id: q1, type: 'quote', owner: A, data: { paperId: pa1, text: '合成引文 synthetic quote', sourceRef: 'p.12' } },
    { id: historyId(q1), type: 'history', owner: A, data: { quoteId: q1, events: [{ seq: 1, sourceRef: 'p.12' }] } },
  ];
  const localDrafts = [{ id: noteId(pa3), owner: A, draft: true, data: { question: 'UNCONFIRMED local draft — must never be exported' } }];
  return { owners: { A, B }, ids: { pa1, pa2, pa3, pb1, alpha, beta, gamma, q1 }, records, localDrafts, digest: digest({ records, localDrafts }) };
}
