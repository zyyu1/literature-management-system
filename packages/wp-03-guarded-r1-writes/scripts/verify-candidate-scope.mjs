#!/usr/bin/env node
// D007-A66 §3b — explicit, read-only candidate-scope audit for the WP-03-R1 remediation.
//
// This is deliberately NOT a `node --test` file (name and location keep it outside Node's default
// test discovery) and it is deliberately separate from the long-lived ordinary Q3-11 regression:
//
//   * ordinary Q3-11 pins only the protected dependency bytes and the strict upstream suites;
//   * this audit proves the whole candidate scope of the execution branch.
//
// It proves, using Git plumbing/read commands and Node builtins only:
//   1. the full original Base tree is readable and every Base path outside the approved additions
//      is byte-identical in the working tree (`git hash-object --no-filters` vs Base blob IDs);
//   2. no Base path is modified or deleted, and the only cumulative additions relative to Base are
//      the explicitly enumerated A66-approved files (no extra or untracked path);
//   3. history since Base is a single-parent chain with no merge commits, the newest incremental
//      commit's parent is the exact A66 START, and exactly the six A66 paths changed relative to
//      START (`scripts/verify-candidate-scope.mjs` is an addition, the other five are modifications);
//   4. the final checkout is clean and the working tree matches the committed candidate tree.
//
// It fails closed on every mismatch. There is no self-referential candidate SHA (HEAD is read, never
// pinned) and no expected hash is derived from the candidate tree (Base is the only tree compared).
// `--base` and `--start` exist only so disposable scratch/simulated trees can be audited; the
// defaults are the immutable A66 constants.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const DEFAULT_BASE = '1684cea5623c8421e16c328c7f1464e8932d3118';
const DEFAULT_START = '0fcad9cb6016900d5f7057161619e4a9f2e94b55';

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

// The exact six paths D007-A66 §3 authorizes relative to START. The new audit script is an
// addition; the other five must be modifications of existing START paths.
export const A66_CHANGED_PATHS = Object.freeze([
  'docs/handoffs/WP-03/QA_HANDOFF.md',
  'packages/wp-03-guarded-r1-writes/README.md',
  'packages/wp-03-guarded-r1-writes/scripts/mutation-check.mjs',
  'packages/wp-03-guarded-r1-writes/scripts/verify-candidate-scope.mjs',
  'packages/wp-03-guarded-r1-writes/support/harness.mjs',
  'packages/wp-03-guarded-r1-writes/test/upstream-regression.test.mjs',
]);
const A66_ADDED_PATH = 'packages/wp-03-guarded-r1-writes/scripts/verify-candidate-scope.mjs';

class ScopeError extends Error {}
function fail(reason) { throw new ScopeError(reason); }

function usage() {
  return [
    'usage: node scripts/verify-candidate-scope.mjs [--base <40-hex>] [--start <40-hex>]',
    `defaults: --base ${DEFAULT_BASE} --start ${DEFAULT_START}`,
  ].join('\n');
}

function parseArgs(argv) {
  let base = DEFAULT_BASE;
  let start = DEFAULT_START;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    }
    if (arg === '--base' || arg === '--start') {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) fail(`MISSING_ARGUMENT: ${arg}`);
      if (arg === '--base') base = value; else start = value;
      i += 1;
    } else if (arg.startsWith('--base=')) {
      base = arg.slice('--base='.length);
    } else if (arg.startsWith('--start=')) {
      start = arg.slice('--start='.length);
    } else {
      fail(`UNKNOWN_ARGUMENT: ${arg}`);
    }
  }
  for (const [name, value] of [['--base', base], ['--start', start]]) {
    if (!/^[0-9a-f]{40}$/.test(value)) fail(`INVALID_SHA: ${name} ${value}`);
  }
  return { base, start };
}

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

function verifyHistory(base, start) {
  resolveCommit(base, 'BASE');
  resolveCommit(start, 'START');
  const head = resolveCommit(gitOk(['rev-parse', 'HEAD'], 'HEAD').trim(), 'HEAD');
  if (head === start) fail('NO_INCREMENTAL_COMMIT_SINCE_START: HEAD equals START');
  isAncestor(base, head, 'BASE_NOT_ANCESTOR_OF_HEAD');
  isAncestor(start, head, 'START_NOT_ANCESTOR_OF_HEAD');

  const mergeCount = Number(gitOk(['rev-list', '--merges', '--count', `${base}..HEAD`], 'MERGE_COUNT').trim());
  if (mergeCount !== 0) fail(`MERGE_COMMIT_PRESENT: ${mergeCount} merge commit(s) in Base..HEAD`);

  const chain = gitOk(['rev-list', '--reverse', '--parents', `${base}..HEAD`], 'INCREMENTAL_CHAIN')
    .trim().split('\n').filter(Boolean);
  if (chain.length === 0) fail('NO_INCREMENTAL_COMMIT_SINCE_BASE');
  for (const line of chain) {
    const parts = line.split(' ');
    if (parts.length !== 2) fail(`INCREMENTAL_COMMIT_NOT_SINGLE_PARENT: ${parts[0]}`);
  }
  const oldest = chain[0].split(' ');
  const newest = chain[chain.length - 1].split(' ');
  if (oldest[1] !== base) fail(`BASE_NOT_PARENT_OF_OLDEST_INCREMENTAL_COMMIT: ${oldest[0]} has parent ${oldest[1]}`);
  if (newest[1] !== start) fail(`START_NOT_PARENT_OF_NEWEST_INCREMENTAL_COMMIT: ${newest[0]} has parent ${newest[1]}`);
  const countSinceStart = Number(gitOk(['rev-list', '--count', `${start}..HEAD`], 'COUNT_SINCE_START').trim());
  if (countSinceStart !== 1) fail(`INCREMENTAL_COMMIT_COUNT_SINCE_START: ${countSinceStart} (exactly one is authorized)`);
  return head;
}

function verifyIncrementalPaths(start) {
  const actual = parseNameStatus(
    gitOk(['diff', '--name-status', '--no-renames', start, 'HEAD'], 'A66_DIFF'),
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

// One cumulative-scope check group: the approved additions are exactly the added paths relative to
// Base, no Base path is modified/deleted, and no extra path exists in the working tree or at HEAD.
// Keeping the whole group together makes a bypass of the extra-path check a single, auditable edit.
function verifyCumulativeAdditions(base, baseTree, headTree, workFiles) {
  const approved = new Set(APPROVED_ADDITIONS);
  if (approved.size !== APPROVED_ADDITIONS.length) fail('APPROVED_ADDITION_DUPLICATE');
  for (const rel of APPROVED_ADDITIONS) {
    if (baseTree.has(rel)) fail(`APPROVED_ADDITION_EXISTS_IN_BASE: ${rel}`);
  }
  const expected = new Set([...baseTree.keys(), ...APPROVED_ADDITIONS]);
  const workSet = new Set(workFiles);
  const extraWork = workFiles.filter((rel) => !expected.has(rel)).sort();
  if (extraWork.length > 0) fail(`UNEXPECTED_WORKTREE_PATH: ${extraWork[0]} (${extraWork.length} unexpected path(s))`);
  const missingWork = APPROVED_ADDITIONS.filter((rel) => !workSet.has(rel)).sort();
  if (missingWork.length > 0) fail(`MISSING_APPROVED_ADDITION: ${missingWork[0]}`);
  const extraHead = [...headTree.keys()].filter((rel) => !expected.has(rel)).sort();
  if (extraHead.length > 0) fail(`UNEXPECTED_HEAD_PATH: ${extraHead[0]}`);
  const missingHead = [...expected].filter((rel) => !headTree.has(rel)).sort();
  if (missingHead.length > 0) fail(`MISSING_HEAD_PATH: ${missingHead[0]}`);

  const actual = parseNameStatus(
    gitOk(['diff', '--name-status', '--no-renames', base, 'HEAD'], 'BASE_DIFF'),
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

function audit(base, start) {
  const head = verifyHistory(base, start);
  verifyIncrementalPaths(start);
  verifyCleanCheckout();
  const baseTree = readTree(base, 'BASE_TREE');
  if (baseTree.size < 150) fail(`BASE_TREE_TOO_SMALL: ${baseTree.size}`);
  const headTree = readTree('HEAD', 'HEAD_TREE');
  const workFiles = walkWorktree();
  const workSet = new Set(workFiles);
  if (workSet.size !== workFiles.length) fail('WORKTREE_DUPLICATE_PATH');
  verifyBaseTreeUnchanged(baseTree, workSet);
  verifyCumulativeAdditions(base, baseTree, headTree, workFiles);
  verifyWorktreeMatchesHead(headTree, workFiles);
  console.log('CANDIDATE_SCOPE_OK');
  console.log(`base=${base} start=${start} head=${head}`);
  console.log(`basePaths=${baseTree.size} approvedAdditions=${APPROVED_ADDITIONS.length} a66ChangedPaths=${A66_CHANGED_PATHS.length} worktreePaths=${workFiles.length}`);
}

function main(argv) {
  try {
    const { base, start } = parseArgs(argv);
    audit(base, start);
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
  main(process.argv.slice(2));
}
