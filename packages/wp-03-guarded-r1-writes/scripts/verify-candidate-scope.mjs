#!/usr/bin/env node
// D007-A72 §2 — explicit, read-only candidate-scope audit for the WP-03-R1 A72 correction.
//
// This is deliberately NOT a `node --test` file (name and location keep it outside Node's default
// test discovery) and it is deliberately separate from the long-lived ordinary Q3-11 regression:
//
//   * ordinary Q3-11 pins only the protected dependency bytes and the strict upstream suites;
//   * this audit proves the whole candidate scope of the execution branch.
//
// It proves, using Git plumbing/read commands and Node builtins only:
//   1. the full original Base tree is readable and every Base path is byte-identical in the working
//      tree (`git hash-object --no-filters`) and byte- and mode-identical in the committed HEAD tree;
//   2. the only cumulative additions relative to Base are the explicitly enumerated 22 paths, with
//      no extra or untracked path, no Base modification/deletion and exactly 222 tracked paths;
//   3. B..S is the historic two-commit A66 chain, T..S is exactly the six A66 paths (5 M + 1 A), and
//      S..HEAD is exactly one single-parent A72 commit changing exactly the three A72 paths (all M);
//      B..HEAD is exactly three single-parent commits with no merge;
//   4. every S path outside the three A72 paths is byte- and mode-identical at HEAD;
//   5. the final checkout is clean and the raw working tree equals the committed HEAD tree.
//
// It fails closed on every mismatch. There is no argument, environment or scratch switch that
// relaxes or re-targets the audit: B, T and S are fixed constants, so the "real audit" cannot be
// pointed at a different scope. Disposable scratch trees can still be checked by constructing them
// with the same fixed object IDs; a scratch tree that does not match is expected to fail.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const BASE = '1684cea5623c8421e16c328c7f1464e8932d3118';
const A66_START = '0fcad9cb6016900d5f7057161619e4a9f2e94b55';
const A72_START = 'e6b1180e4e3e5790958ae3319af18bba8889ffbc';

const BASE_TREE_PATHS = 200;
const EXPECTED_HEAD_PATHS = 222;

// The exact, explicitly enumerated cumulative additions authorized since the immutable Base. No
// wildcard or prefix-only rule is accepted for the candidate audit; every path is listed.
export const APPROVED_ADDITIONS = Object.freeze([
  'docs/handoffs/WP-03/QA_HANDOFF.md',
  'packages/wp-03-guarded-r1-writes/README.md',
  'packages/wp-03-guarded-r1-writes/package.json',
  'packages/wp-03-guarded-r1-writes/scripts/mutation-check.mjs',
  'packages/wp-03-guarded-r1-writes/scripts/verify-candidate-scope.mjs',
  'packages/wp-03-guarded-r1-writes/src/contract.mjs',
  'packages/wp-03-guarded-r1-writes/src/fixtures.mjs',
  'packages/wp-03-guarded-r1-writes/src/model.mjs',
  'packages/wp-03-guarded-r1-writes/src/server.mjs',
  'packages/wp-03-guarded-r1-writes/src/strict-json.mjs',
  'packages/wp-03-guarded-r1-writes/support/harness.mjs',
  'packages/wp-03-guarded-r1-writes/test/auth-negative.test.mjs',
  'packages/wp-03-guarded-r1-writes/test/faults.test.mjs',
  'packages/wp-03-guarded-r1-writes/test/fixture-identity.test.mjs',
  'packages/wp-03-guarded-r1-writes/test/important.test.mjs',
  'packages/wp-03-guarded-r1-writes/test/operation-ledger.test.mjs',
  'packages/wp-03-guarded-r1-writes/test/preconditions.test.mjs',
  'packages/wp-03-guarded-r1-writes/test/project-writes.test.mjs',
  'packages/wp-03-guarded-r1-writes/test/r2-negative.test.mjs',
  'packages/wp-03-guarded-r1-writes/test/reading-status.test.mjs',
  'packages/wp-03-guarded-r1-writes/test/transport.test.mjs',
  'packages/wp-03-guarded-r1-writes/test/upstream-regression.test.mjs',
]);

// The exact six paths D007-A66 §3 authorizes relative to the A66 START T. The audit script is an
// addition; the other five must be modifications of existing T paths.
export const A66_CHANGED_PATHS = Object.freeze([
  'docs/handoffs/WP-03/QA_HANDOFF.md',
  'packages/wp-03-guarded-r1-writes/README.md',
  'packages/wp-03-guarded-r1-writes/scripts/mutation-check.mjs',
  'packages/wp-03-guarded-r1-writes/scripts/verify-candidate-scope.mjs',
  'packages/wp-03-guarded-r1-writes/support/harness.mjs',
  'packages/wp-03-guarded-r1-writes/test/upstream-regression.test.mjs',
]);
const A66_ADDED_PATH = 'packages/wp-03-guarded-r1-writes/scripts/verify-candidate-scope.mjs';

// The exact three existing paths D007-A72 §2 authorizes relative to the correction START S. All
// three must be modifications; no A72 path may be added, deleted or renamed.
export const A72_CHANGED_PATHS = Object.freeze([
  'packages/wp-03-guarded-r1-writes/README.md',
  'packages/wp-03-guarded-r1-writes/scripts/verify-candidate-scope.mjs',
  'packages/wp-03-guarded-r1-writes/test/upstream-regression.test.mjs',
]);

class ScopeError extends Error {}
function fail(reason) { throw new ScopeError(reason); }

function git(args) {
  return spawnSync('git', args, {
    cwd: REPO, encoding: 'utf8', timeout: 120000, maxBuffer: 64 * 1024 * 1024,
  });
}

function gitOk(args, label) {
  const r = git(args);
  if (r.error) fail(`${label}: git could not run: ${r.error.message}`);
  if (r.status !== 0) {
    const detail = (r.stderr || r.stdout || '').trim().split(/\r?\n/)[0] || '';
    fail(`${label}: git ${args.join(' ')} exited ${r.status}${detail ? `: ${detail}` : ''}`);
  }
  return r.stdout;
}

function resolveCommit(sha, label) {
  const r = git(['rev-parse', '--verify', '--quiet', `${sha}^{commit}`]);
  if (r.error) fail(`${label}: git could not run: ${r.error.message}`);
  if (r.status !== 0) fail(`${label}_NOT_A_COMMIT: ${sha}`);
  const full = r.stdout.trim();
  if (full !== sha) fail(`${label}_NOT_THE_FULL_SHA: ${sha}`);
  return full;
}

function readTree(treeish, label) {
  const stdout = gitOk(['ls-tree', '-r', '-z', treeish], label);
  const files = new Map();
  for (const record of stdout.split('\0')) {
    if (!record) continue;
    const tab = record.indexOf('\t');
    if (tab < 0) fail(`${label}_MALFORMED_TREE_RECORD`);
    const meta = record.slice(0, tab).split(' ');
    if (meta.length !== 3) fail(`${label}_MALFORMED_TREE_METADATA`);
    const [mode, type, sha] = meta;
    const rel = record.slice(tab + 1);
    if (type !== 'blob') fail(`${label}_NON_BLOB_ENTRY: ${rel} (${type})`);
    if (mode !== '100644' && mode !== '100755') fail(`${label}_NON_REGULAR_MODE: ${rel} (${mode})`);
    if (files.has(rel)) fail(`${label}_DUPLICATE_PATH: ${rel}`);
    files.set(rel, { mode, sha });
  }
  return files;
}

function hashBatch(rels) {
  const hashes = [];
  for (let i = 0; i < rels.length; i += 40) {
    const chunk = rels.slice(i, i + 40);
    const stdout = gitOk(['hash-object', '--no-filters', '--', ...chunk], `HASH_OBJECT_${i}`);
    const lines = stdout.trim().split('\n').filter(Boolean);
    if (lines.length !== chunk.length) fail(`HASH_OBJECT_COUNT: expected ${chunk.length}, got ${lines.length}`);
    hashes.push(...lines);
  }
  return hashes;
}

function parseNameStatus(stdout, label) {
  const rows = new Map();
  for (const line of stdout.split('\n').filter(Boolean)) {
    const tab = line.indexOf('\t');
    if (tab < 0) fail(`${label}_MALFORMED: ${line}`);
    const status = line.slice(0, tab);
    const rel = line.slice(tab + 1);
    if (rows.has(rel)) fail(`${label}_DUPLICATE_PATH: ${rel}`);
    rows.set(rel, status);
  }
  return rows;
}

function isAncestor(ancestor, descendant, label) {
  const r = git(['merge-base', '--is-ancestor', ancestor, descendant]);
  if (r.error) fail(`${label}: git could not run: ${r.error.message}`);
  if (r.status === 1) fail(`${label}: ${ancestor} is not an ancestor of ${descendant}`);
  if (r.status !== 0) fail(`${label}: git merge-base exited ${r.status}`);
}

function singleParentChain(from, to, label) {
  const lines = gitOk(['rev-list', '--reverse', '--parents', `${from}..${to}`], label)
    .trim().split('\n').filter(Boolean);
  if (lines.length === 0) fail(`${label}: no commits between ${from} and ${to}`);
  const chain = lines.map((line) => {
    const parts = line.split(' ');
    if (parts.length !== 2) fail(`${label}_NOT_SINGLE_PARENT: ${parts[0]}`);
    return { sha: parts[0], parent: parts[1] };
  });
  if (chain[0].parent !== from) fail(`${label}_WRONG_FIRST_PARENT: ${chain[0].sha} has ${chain[0].parent}`);
  if (chain[chain.length - 1].sha !== to) fail(`${label}_WRONG_LAST_COMMIT: ${chain[chain.length - 1].sha} is not ${to}`);
  return chain;
}

function verifyHistory() {
  resolveCommit(BASE, 'BASE');
  resolveCommit(A66_START, 'A66_START');
  resolveCommit(A72_START, 'A72_START');
  const head = resolveCommit(gitOk(['rev-parse', 'HEAD'], 'HEAD').trim(), 'HEAD');
  if (head === A72_START) fail('NO_INCREMENTAL_COMMIT_SINCE_A72_START: HEAD equals the correction START');
  if (head === A66_START) fail('NO_INCREMENTAL_COMMIT_SINCE_A66_START');
  isAncestor(BASE, A66_START, 'BASE_NOT_ANCESTOR_OF_A66_START');
  isAncestor(A66_START, A72_START, 'A66_START_NOT_ANCESTOR_OF_A72_START');
  isAncestor(A72_START, head, 'A72_START_NOT_ANCESTOR_OF_HEAD');

  const mergeCount = Number(gitOk(['rev-list', '--merges', '--count', `${BASE}..HEAD`], 'MERGE_COUNT').trim());
  if (mergeCount !== 0) fail(`MERGE_COMMIT_PRESENT: ${mergeCount} merge commit(s) in Base..HEAD`);

  const historic = singleParentChain(BASE, A72_START, 'B_TO_S_CHAIN');
  if (historic.length !== 2) fail(`B_TO_S_COMMIT_COUNT: ${historic.length} (expected the historic 2 commits)`);
  const a66 = singleParentChain(A66_START, A72_START, 'T_TO_S_CHAIN');
  if (a66.length !== 1) fail(`T_TO_S_COMMIT_COUNT: ${a66.length} (expected exactly one A66 commit)`);
  const a72 = singleParentChain(A72_START, head, 'S_TO_HEAD_CHAIN');
  if (a72.length !== 1) fail(`S_TO_HEAD_COMMIT_COUNT: ${a72.length} (expected exactly one A72 commit)`);
  const all = singleParentChain(BASE, head, 'B_TO_HEAD_CHAIN');
  if (all.length !== 3) fail(`B_TO_HEAD_COMMIT_COUNT: ${all.length} (expected three single-parent commits)`);
  return head;
}

function verifyA66IncrementalPaths() {
  const actual = parseNameStatus(
    gitOk(['diff', '--name-status', '--no-renames', A66_START, A72_START], 'A66_DIFF'),
    'A66_DIFF',
  );
  if (actual.size !== A66_CHANGED_PATHS.length) {
    fail(`A66_CHANGED_PATH_COUNT: ${actual.size} (expected exactly ${A66_CHANGED_PATHS.length})`);
  }
  for (const rel of A66_CHANGED_PATHS) {
    const expectedStatus = rel === A66_ADDED_PATH ? 'A' : 'M';
    if (!actual.has(rel)) fail(`A66_PATH_NOT_CHANGED: ${rel}`);
    if (actual.get(rel) !== expectedStatus) {
      fail(`A66_PATH_STATUS: ${rel} is ${actual.get(rel)} (expected ${expectedStatus})`);
    }
  }
  for (const rel of actual.keys()) {
    if (!A66_CHANGED_PATHS.includes(rel)) fail(`A66_EXTRA_CHANGED_PATH: ${rel}`);
  }
}

function verifyA72IncrementalPaths() {
  const actual = parseNameStatus(
    gitOk(['diff', '--name-status', '--no-renames', A72_START, 'HEAD'], 'A72_DIFF'),
    'A72_DIFF',
  );
  if (actual.size !== A72_CHANGED_PATHS.length) {
    fail(`A72_CHANGED_PATH_COUNT: ${actual.size} (expected exactly ${A72_CHANGED_PATHS.length})`);
  }
  for (const rel of A72_CHANGED_PATHS) {
    if (!actual.has(rel)) fail(`A72_PATH_NOT_CHANGED: ${rel}`);
    if (actual.get(rel) !== 'M') fail(`A72_PATH_STATUS: ${rel} is ${actual.get(rel)} (expected M)`);
  }
  for (const rel of actual.keys()) {
    if (!A72_CHANGED_PATHS.includes(rel)) fail(`A72_EXTRA_CHANGED_PATH: ${rel}`);
  }
}

function verifyCleanCheckout() {
  const status = gitOk(['status', '--porcelain=v1', '-uall'], 'CLEAN_CHECKOUT');
  if (status.trim() !== '') {
    const first = status.trim().split(/\r?\n/)[0];
    fail(`CLEAN_CHECKOUT: git status --porcelain is not empty: ${first}`);
  }
}

function walkWorktree() {
  const out = [];
  function walk(abs, prefix, isRoot) {
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      if (isRoot && entry.name === '.git') continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(path.join(abs, entry.name), rel, false);
      } else if (entry.isFile()) {
        out.push(rel);
      } else {
        fail(`WORKTREE_NON_REGULAR_PATH: ${rel}`);
      }
    }
  }
  walk(REPO, '', true);
  return out;
}

function verifyBaseTreeUnchanged(baseTree, workSet) {
  if (baseTree.size !== BASE_TREE_PATHS) fail(`BASE_TREE_PATH_COUNT: ${baseTree.size} (expected ${BASE_TREE_PATHS})`);
  const basePaths = [...baseTree.keys()].sort();
  const missing = basePaths.filter((rel) => !workSet.has(rel));
  if (missing.length > 0) {
    fail(`BASE_PATH_MISSING: ${missing[0]} (${missing.length} missing Base path(s))`);
  }
  const hashes = hashBatch(basePaths);
  basePaths.forEach((rel, i) => {
    if (hashes[i] !== baseTree.get(rel).sha) {
      fail(`BASE_PATH_CHANGED: ${rel} (${hashes[i]} != ${baseTree.get(rel).sha})`);
    }
  });
}

// S paths outside the three A72 paths must be byte- and mode-identical at HEAD; paths inside the
// three must be modified. HEAD must not add, remove or rename any S path.
function verifyStartTreeScope(a72Tree, headTree) {
  const a72Paths = [...a72Tree.keys()].sort();
  const headPaths = [...headTree.keys()].sort();
  const missing = a72Paths.filter((rel) => !headTree.has(rel));
  if (missing.length > 0) fail(`A72_START_PATH_MISSING: ${missing[0]} (${missing.length} missing S path(s))`);
  const extra = headPaths.filter((rel) => !a72Tree.has(rel));
  if (extra.length > 0) fail(`A72_EXTRA_HEAD_PATH: ${extra[0]} (${extra.length} unexpected path(s))`);
  for (const rel of a72Paths) {
    const before = a72Tree.get(rel);
    const after = headTree.get(rel);
    if (before.mode !== after.mode) fail(`A72_PATH_MODE_CHANGED: ${rel} (${before.mode} -> ${after.mode})`);
    const changed = A72_CHANGED_PATHS.includes(rel);
    if (changed && before.sha === after.sha) fail(`A72_PATH_NOT_MODIFIED: ${rel}`);
    if (!changed && before.sha !== after.sha) fail(`A72_PATH_CHANGED_OUTSIDE_SCOPE: ${rel}`);
  }
}

// One cumulative-scope check group: the approved additions are exactly the added paths relative to
// Base, no Base path is modified/deleted, and no extra path exists in the working tree or at HEAD.
// Keeping the whole group together makes a bypass of the extra-path check a single, auditable edit.
function verifyCumulativeAdditions(baseTree, headTree, workFiles) {
  const approved = new Set(APPROVED_ADDITIONS);
  if (approved.size !== APPROVED_ADDITIONS.length) fail('APPROVED_ADDITION_DUPLICATE');
  if (APPROVED_ADDITIONS.length !== 22) fail(`APPROVED_ADDITION_COUNT: ${APPROVED_ADDITIONS.length} (expected 22)`);
  if (headTree.size !== EXPECTED_HEAD_PATHS) {
    fail(`HEAD_TREE_PATH_COUNT: ${headTree.size} (expected ${EXPECTED_HEAD_PATHS})`);
  }
  if (workFiles.length !== EXPECTED_HEAD_PATHS) {
    fail(`WORKTREE_PATH_COUNT: ${workFiles.length} (expected ${EXPECTED_HEAD_PATHS})`);
  }
  for (const rel of APPROVED_ADDITIONS) {
    if (baseTree.has(rel)) fail(`APPROVED_ADDITION_EXISTS_IN_BASE: ${rel}`);
  }
  const expected = new Set([...baseTree.keys(), ...APPROVED_ADDITIONS]);
  if (expected.size !== EXPECTED_HEAD_PATHS) fail(`EXPECTED_PATH_COUNT: ${expected.size} (expected ${EXPECTED_HEAD_PATHS})`);
  const workSet = new Set(workFiles);
  if (workSet.size !== workFiles.length) fail('WORKTREE_DUPLICATE_PATH');
  const extraWork = workFiles.filter((rel) => !expected.has(rel)).sort();
  if (extraWork.length > 0) fail(`UNEXPECTED_WORKTREE_PATH: ${extraWork[0]} (${extraWork.length} unexpected path(s))`);
  const missingWork = APPROVED_ADDITIONS.filter((rel) => !workSet.has(rel)).sort();
  if (missingWork.length > 0) fail(`MISSING_APPROVED_ADDITION: ${missingWork[0]}`);
  const extraHead = [...headTree.keys()].filter((rel) => !expected.has(rel)).sort();
  if (extraHead.length > 0) fail(`UNEXPECTED_HEAD_PATH: ${extraHead[0]}`);
  const missingHead = [...expected].filter((rel) => !headTree.has(rel)).sort();
  if (missingHead.length > 0) fail(`MISSING_HEAD_PATH: ${missingHead[0]}`);

  const actual = parseNameStatus(
    gitOk(['diff', '--name-status', '--no-renames', BASE, 'HEAD'], 'BASE_DIFF'),
    'BASE_DIFF',
  );
  if (actual.size !== APPROVED_ADDITIONS.length) {
    fail(`CUMULATIVE_ADDITION_COUNT: ${actual.size} (expected exactly ${APPROVED_ADDITIONS.length})`);
  }
  for (const [rel, status] of actual) {
    if (!approved.has(rel)) fail(`UNEXPECTED_ADDED_PATH: ${rel}`);
    if (status !== 'A') fail(`BASE_PATH_MODIFIED_OR_DELETED: ${rel} (${status})`);
  }
  for (const rel of APPROVED_ADDITIONS) {
    if (!actual.has(rel)) fail(`MISSING_APPROVED_ADDITION: ${rel}`);
  }
  // Committed tree evidence: every original Base path is byte- and mode-identical at HEAD. This
  // also covers the Windows worktree case where the filesystem cannot represent the executable bit.
  for (const [rel, before] of baseTree) {
    const after = headTree.get(rel);
    if (!after) fail(`BASE_PATH_MISSING_AT_HEAD: ${rel}`);
    if (before.sha !== after.sha) fail(`BASE_PATH_CHANGED_AT_HEAD: ${rel}`);
    if (before.mode !== after.mode) fail(`BASE_PATH_MODE_CHANGED_AT_HEAD: ${rel} (${before.mode} -> ${after.mode})`);
  }
}

function verifyWorktreeMatchesHead(headTree, workFiles) {
  const headPaths = [...headTree.keys()].sort();
  const workSet = new Set(workFiles);
  const missing = headPaths.filter((rel) => !workSet.has(rel));
  if (missing.length > 0) fail(`WORKTREE_MISSING_HEAD_PATH: ${missing[0]}`);
  const hashes = hashBatch(headPaths);
  headPaths.forEach((rel, i) => {
    if (hashes[i] !== headTree.get(rel).sha) {
      fail(`WORKTREE_DIFFERS_FROM_HEAD: ${rel} (${hashes[i]} != ${headTree.get(rel).sha})`);
    }
  });
}

function audit() {
  const head = verifyHistory();
  verifyA66IncrementalPaths();
  verifyA72IncrementalPaths();
  verifyCleanCheckout();
  const baseTree = readTree(BASE, 'BASE_TREE');
  const a72Tree = readTree(A72_START, 'A72_START_TREE');
  const headTree = readTree('HEAD', 'HEAD_TREE');
  const workFiles = walkWorktree();
  const workSet = new Set(workFiles);
  if (workSet.size !== workFiles.length) fail('WORKTREE_DUPLICATE_PATH');
  if (a72Tree.size !== EXPECTED_HEAD_PATHS) {
    fail(`A72_START_TREE_PATH_COUNT: ${a72Tree.size} (expected ${EXPECTED_HEAD_PATHS})`);
  }
  verifyBaseTreeUnchanged(baseTree, workSet);
  verifyStartTreeScope(a72Tree, headTree);
  verifyCumulativeAdditions(baseTree, headTree, workFiles);
  verifyWorktreeMatchesHead(headTree, workFiles);
  console.log('CANDIDATE_SCOPE_OK');
  console.log(`base=${BASE} a66Start=${A66_START} a72Start=${A72_START} head=${head}`);
  console.log(`basePaths=${baseTree.size} approvedAdditions=${APPROVED_ADDITIONS.length} a66ChangedPaths=${A66_CHANGED_PATHS.length} a72ChangedPaths=${A72_CHANGED_PATHS.length} worktreePaths=${workFiles.length}`);
}

function main() {
  try {
    audit();
  } catch (error) {
    if (error instanceof ScopeError) {
      console.error(`CANDIDATE_SCOPE_FAILED: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    console.error(`CANDIDATE_SCOPE_ERROR: ${error && error.stack ? error.stack : error}`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
