#!/usr/bin/env node
// D007-A85 §1/§9 — explicit, read-only candidate-scope audit for WP-04-R1.
//
// This is deliberately NOT a `node --test` file (name and location keep it outside Node's default
// test discovery) and it is deliberately separate from the long-lived ordinary Q4-12 regression:
//
//   * ordinary Q4-12 pins only the protected dependency bytes and the strict upstream suites;
//   * this audit proves the whole candidate scope of the execution branch.
//
// It proves, using Git plumbing/read commands and Node builtins only:
//   1. the immutable Base is resolvable and Base..HEAD is one or more single-parent commits with no
//      merge;
//   2. the only cumulative changes relative to Base are the explicitly enumerated 23 additions
//      (22 package paths + `docs/handoffs/WP-04/QA_HANDOFF.md`), with no extra or untracked path, no
//      Base modification/deletion and exactly 266 tracked paths;
//   3. every original Base path is byte-identical in the working tree (`git hash-object
//      --no-filters`) and byte- and mode-identical in the committed HEAD tree;
//   4. the protected WP-01/WP-02/WP-03 packages, both fixtures and `tools/offline` are unchanged;
//   5. the final checkout is clean and the raw working tree equals the committed HEAD tree.
//
// It fails closed on every mismatch. There is no argument, environment or scratch switch that
// relaxes or re-targets the audit: BASE is a fixed constant and extra arguments are rejected.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const BASE = 'bcc4eaad5183c923f782da0475eea1751be2de3b';

const BASE_TREE_PATHS = 243;
const EXPECTED_HEAD_PATHS = 266;

// The exact, explicitly enumerated cumulative additions authorized since the immutable Base. No
// wildcard or prefix-only rule is accepted for the candidate audit; every path is listed.
export const APPROVED_ADDITIONS = Object.freeze([
  'docs/handoffs/WP-04/QA_HANDOFF.md',
  'packages/wp-04-research-notes-r1/README.md',
  'packages/wp-04-research-notes-r1/package.json',
  'packages/wp-04-research-notes-r1/scripts/mutation-check.mjs',
  'packages/wp-04-research-notes-r1/scripts/verify-candidate-scope.mjs',
  'packages/wp-04-research-notes-r1/src/export.mjs',
  'packages/wp-04-research-notes-r1/src/fixtures.mjs',
  'packages/wp-04-research-notes-r1/src/model.mjs',
  'packages/wp-04-research-notes-r1/src/server.mjs',
  'packages/wp-04-research-notes-r1/src/strict-json.mjs',
  'packages/wp-04-research-notes-r1/support/harness.mjs',
  'packages/wp-04-research-notes-r1/test/q4-01-fixture-initial-note.test.mjs',
  'packages/wp-04-research-notes-r1/test/q4-02-create.test.mjs',
  'packages/wp-04-research-notes-r1/test/q4-03-update-schema.test.mjs',
  'packages/wp-04-research-notes-r1/test/q4-04-preconditions-cas.test.mjs',
  'packages/wp-04-research-notes-r1/test/q4-05-byte-fidelity.test.mjs',
  'packages/wp-04-research-notes-r1/test/q4-06-operation-ledger.test.mjs',
  'packages/wp-04-research-notes-r1/test/q4-07-faults.test.mjs',
  'packages/wp-04-research-notes-r1/test/q4-08-auth-negative.test.mjs',
  'packages/wp-04-research-notes-r1/test/q4-09-scope-isolation.test.mjs',
  'packages/wp-04-research-notes-r1/test/q4-10-export.test.mjs',
  'packages/wp-04-research-notes-r1/test/q4-11-transport.test.mjs',
  'packages/wp-04-research-notes-r1/test/q4-12-upstream-regression.test.mjs',
]);

// Literal original Base Git blob IDs of every protected dependency file (all three upstream
// packages including evidence, both frozen fixtures and tools/offline). Generated mechanically from
// `git ls-tree -r bcc4eaad5183c923f782da0475eea1751be2de3b`; no expected hash is derived at runtime.
export const PROTECTED_INVENTORY = Object.freeze({
  'docs/handoffs/WP-01/fixtures/wp01.v1.json': '0965c45e3af482f4074845e1c7558901963f224f',
  'docs/handoffs/WP-02/fixtures/wp02.v1.json': 'f1958fd288a3fdac57725e0ac1c7920aee456af0',
  'packages/wp-01-synthetic-auth-api/README.md': '05f227d2eb873f3ac37a01d5c7f4d2b2137b852c',
  'packages/wp-01-synthetic-auth-api/evidence/WP01-SUMMARY.md': '9b7bcbb8b5d906c5aa5299897afa7ffea2fa0842',
  'packages/wp-01-synthetic-auth-api/evidence/WP01-egress-probe.txt': '952203e675a0d1511ff77e4345cb25a9cc601895',
  'packages/wp-01-synthetic-auth-api/evidence/WP01-node-test-run1.tap': 'c06fc4ea40a9f4298b4350a02dfb016bb772884c',
  'packages/wp-01-synthetic-auth-api/evidence/WP01-node-test-run2.tap': '289a4a6e8bf0f04864abae7c26ab512e97373ac4',
  'packages/wp-01-synthetic-auth-api/evidence/WP01-node-test-run3.tap': 'b76510820ffdcfb98ca85dde20e715168dd868b8',
  'packages/wp-01-synthetic-auth-api/evidence/WP01-node-test-run4.tap': '80b83ba0ad2ef8e44910e752266607d103ae901c',
  'packages/wp-01-synthetic-auth-api/evidence/WP01-node-test-run5.tap': 'd74246a2a4a91b9c2df656aea0d8d677ecc183c6',
  'packages/wp-01-synthetic-auth-api/package.json': 'e52bae5098bf12a9e05417d6136b5724b1e7a833',
  'packages/wp-01-synthetic-auth-api/src/policy.mjs': '8db921d3c2f0fc4c4a83c5bb81ef3d587419eb71',
  'packages/wp-01-synthetic-auth-api/src/server.mjs': '40b870ca758535b0b80dcc72676473a2a0fd4fed',
  'packages/wp-01-synthetic-auth-api/src/store.mjs': '647dcf370678dfd9821e91473fe22c2703116851',
  'packages/wp-01-synthetic-auth-api/support/harness.mjs': '1936ae9a7bd92ea42c4fd5056c6fc20dd6fcdf9b',
  'packages/wp-01-synthetic-auth-api/support/platform-precondition.mjs': '90e13b465b193b31ac296e03e9ce5c07c2d5eeed',
  'packages/wp-01-synthetic-auth-api/test/auth-contract.test.mjs': 'a37aec84156ef0b4aaf4141bfbe814b977f50b9a',
  'packages/wp-01-synthetic-auth-api/test/origin-csrf.test.mjs': 'f698ffab96e5a26d4168be35df497aba0395b5fa',
  'packages/wp-01-synthetic-auth-api/test/outcome-unknown.test.mjs': 'f38d33494b226327b5b377d81a3b034b5fbbfa0e',
  'packages/wp-01-synthetic-auth-api/test/scope-workspace.test.mjs': '2a75b369695b53035cc28ee1beda9cd560a1bf2e',
  'packages/wp-01-synthetic-auth-api/test/session-revocation.test.mjs': 'dac70b6c410477f7c26112395e7c159d296f49af',
  'packages/wp-01-synthetic-auth-api/test/transport-negative.test.mjs': '8dac6bc3d4318cd4c6bc36636db18a4cfe5c1f23',
  'packages/wp-02-project-paper-read/README.md': 'a8b943c83d44ff13f199ca1b3eafdcbf84095dc2',
  'packages/wp-02-project-paper-read/evidence/WP01-regression-run1.tap': 'a5c40a8aeda3831fa610c7aa7bb3de396718facb',
  'packages/wp-02-project-paper-read/evidence/WP01-regression-run2.tap': 'b5b8c74f5cfe74c1edf7e66385f789e914f5fde8',
  'packages/wp-02-project-paper-read/evidence/WP01-regression-run3.tap': '453f3984b4f51a4174fd6ca92c592db6dbd4f974',
  'packages/wp-02-project-paper-read/evidence/WP01-regression-run4.tap': 'c2887bcd14711b5224682072274fdf01785d38fa',
  'packages/wp-02-project-paper-read/evidence/WP01-regression-run5.tap': 'e78fcf7a1310f7e5269bc8a3748b6d2637810d33',
  'packages/wp-02-project-paper-read/evidence/WP02-SUMMARY.md': 'dc1970fe00f96b4f74fadaceb50d803b3b48efc3',
  'packages/wp-02-project-paper-read/evidence/WP02-egress-probe.txt': '4bf4a3ce8d085c125782abeee51b8c528b368271',
  'packages/wp-02-project-paper-read/evidence/WP02-mutation.txt': '815150f3eb2257eedcb4b9b7077bec795feba941',
  'packages/wp-02-project-paper-read/evidence/WP02-node-test-run1.tap': '8e8913f1abcc68311f7419789367b94039893e58',
  'packages/wp-02-project-paper-read/evidence/WP02-node-test-run2.tap': 'c1803e672ab426176816948ba61023009c2c48f6',
  'packages/wp-02-project-paper-read/evidence/WP02-node-test-run3.tap': 'd6e1f31c1ed698f99599db8b6d550f91dad9ce21',
  'packages/wp-02-project-paper-read/evidence/WP02-node-test-run4.tap': '5130179e7950c154255536d436efd4077ffa523e',
  'packages/wp-02-project-paper-read/evidence/WP02-node-test-run5.tap': 'dc68d3e5113934859bb95030991d167845465c9a',
  'packages/wp-02-project-paper-read/package.json': 'f4ebdca321930974126c46e0c379cc2d06ca2c08',
  'packages/wp-02-project-paper-read/scripts/mutation-check.mjs': 'ae2d1b93ff6036b3d51330519a581d5a1a1317e7',
  'packages/wp-02-project-paper-read/src/catalog.mjs': '285c35a7e83a0619ebf53d3d88b0559e16b6004e',
  'packages/wp-02-project-paper-read/src/server.mjs': 'ded532a1ba7dfc62c1436f107474dbc88a023fc2',
  'packages/wp-02-project-paper-read/support/harness.mjs': 'b95ff8b0ea46d46e677e7c7eddfd7c0a4e2b2394',
  'packages/wp-02-project-paper-read/test/auth-neutral.test.mjs': '780774f373ad7c63a2787ee6d677a4667b4a4b25',
  'packages/wp-02-project-paper-read/test/identity.test.mjs': '48a6b38f9adbffb12fcc202653e1264df4701915',
  'packages/wp-02-project-paper-read/test/projects-list.test.mjs': 'ef89d527f9f5b7982c690bbf4b1233da99a012d9',
  'packages/wp-02-project-paper-read/test/readonly.test.mjs': 'a033276a41b890891bfcf086dc669e1341a5a108',
  'packages/wp-02-project-paper-read/test/scope-associations.test.mjs': '459701d9807e116ef36dd612bb4c9fee1d08a7cb',
  'packages/wp-02-project-paper-read/test/transport.test.mjs': 'f0935aea4c23071116661d3c3c0e90f7d44a6d8c',
  'packages/wp-02-project-paper-read/test/wp01-regression.test.mjs': '1306d092f98777522da95c137e737718449c9038',
  'packages/wp-03-guarded-r1-writes/README.md': '32d69c54cad629c4cd4e3322e87baa654ece994e',
  'packages/wp-03-guarded-r1-writes/package.json': '727d2d7c9e83e8c33ad1cbec3fa8fead4d977df2',
  'packages/wp-03-guarded-r1-writes/scripts/mutation-check.mjs': '0f4b0e3f22095360dfa1c6cf9ee88ea6563a0411',
  'packages/wp-03-guarded-r1-writes/scripts/verify-candidate-scope.mjs': '3268ca44e2ce7c6086107fc0b13cb95d53309fea',
  'packages/wp-03-guarded-r1-writes/src/contract.mjs': 'c4492c66b7b5b6b0e9d00de04894197610a94957',
  'packages/wp-03-guarded-r1-writes/src/fixtures.mjs': '29cbc1d7e692d7c7419ed6a699ae2da70439a3e3',
  'packages/wp-03-guarded-r1-writes/src/model.mjs': 'e7085b187633f5f19bc006dabd490d1ec30b7455',
  'packages/wp-03-guarded-r1-writes/src/server.mjs': '080bee2449ff75ba0fbeffca421894b527bbcd04',
  'packages/wp-03-guarded-r1-writes/src/strict-json.mjs': '30be1fa771266cd24ed6b5b2c44aff17bcdf7988',
  'packages/wp-03-guarded-r1-writes/support/harness.mjs': '937d260eba0fb9738a8075c238be1ff0a6f27d82',
  'packages/wp-03-guarded-r1-writes/test/auth-negative.test.mjs': '953190cca3650dd2b7b75eb3a6c7ea739a3bc4b7',
  'packages/wp-03-guarded-r1-writes/test/faults.test.mjs': 'afa09a3b18accc88f5f6dd356145e238ebfab0a4',
  'packages/wp-03-guarded-r1-writes/test/fixture-identity.test.mjs': '237db04efbc8d515e823acbd0f6081962949fadb',
  'packages/wp-03-guarded-r1-writes/test/important.test.mjs': '1b30431340c8be65c71c4f5984b4ef9a95e67b18',
  'packages/wp-03-guarded-r1-writes/test/operation-ledger.test.mjs': '46be4321a2dd7d3a18900fe1761e2f383089b34e',
  'packages/wp-03-guarded-r1-writes/test/preconditions.test.mjs': 'b99d337c4f7a5716b4134f9db734c6246efdad04',
  'packages/wp-03-guarded-r1-writes/test/project-writes.test.mjs': 'fcdd63fa768a6b3775902b33dce72550ab1b67b6',
  'packages/wp-03-guarded-r1-writes/test/r2-negative.test.mjs': '155943c0f0a1e42ca016135a562a8b0ba35a4af1',
  'packages/wp-03-guarded-r1-writes/test/reading-status.test.mjs': '8f09ae9400c4cfc8cccece83be264e9f7e1ff708',
  'packages/wp-03-guarded-r1-writes/test/transport.test.mjs': 'a948787db8d9e5c9074e7be85d7fc05643dd1453',
  'packages/wp-03-guarded-r1-writes/test/upstream-regression.test.mjs': 'd0b67734eee63a90b09d480917b0708922c5b069',
  'tools/offline/egress-probe.mjs': 'fceeea897156b2f87f240d217f2c93f231a6d662',
  'tools/offline/lo-up.py': '55b45a3678fe347155ca54c89110aa1dd0ad1454',
  'tools/offline/run-offline.sh': '2d06bfc3aee1c1d9b3a8e67fd93e483bc8b1fb20',
});

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

function verifyHistory() {
  resolveCommit(BASE, 'BASE');
  const head = resolveCommit(gitOk(['rev-parse', 'HEAD'], 'HEAD').trim(), 'HEAD');
  if (head === BASE) fail('NO_CANDIDATE_COMMIT: HEAD equals the immutable Base');
  isAncestor(BASE, head, 'BASE_NOT_ANCESTOR_OF_HEAD');
  const mergeCount = Number(gitOk(['rev-list', '--merges', '--count', `${BASE}..HEAD`], 'MERGE_COUNT').trim());
  if (mergeCount !== 0) fail(`MERGE_COMMIT_PRESENT: ${mergeCount} merge commit(s) in Base..HEAD`);
  const lines = gitOk(['rev-list', '--reverse', '--parents', `${BASE}..HEAD`], 'B_TO_HEAD_CHAIN')
    .trim().split('\n').filter(Boolean);
  if (lines.length === 0) fail('NO_CANDIDATE_COMMIT: no commits between Base and HEAD');
  let previous = BASE;
  for (const line of lines) {
    const parts = line.split(' ');
    if (parts.length !== 2) fail(`NOT_SINGLE_PARENT_COMMIT: ${parts[0]} has ${parts.length - 1} parent(s)`);
    if (parts[1] !== previous) fail(`NON_LINEAR_HISTORY: ${parts[0]} parent ${parts[1]} is not ${previous}`);
    previous = parts[0];
  }
  if (previous !== head) fail(`WRONG_LAST_COMMIT: ${previous} is not ${head}`);
  return { head, commitCount: lines.length };
}

function verifyWhitelist() {
  if (APPROVED_ADDITIONS.length !== 23) fail(`APPROVED_ADDITION_COUNT: ${APPROVED_ADDITIONS.length} (expected 23)`);
  const approved = new Set(APPROVED_ADDITIONS);
  if (approved.size !== APPROVED_ADDITIONS.length) fail('APPROVED_ADDITION_DUPLICATE');
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
    const inWhitelist = rel === 'docs/handoffs/WP-04/QA_HANDOFF.md'
      || rel.startsWith('packages/wp-04-research-notes-r1/');
    if (!inWhitelist) fail(`PATH_OUTSIDE_WHITELIST: ${rel}`);
  }
  for (const rel of APPROVED_ADDITIONS) {
    if (!actual.has(rel)) fail(`MISSING_APPROVED_ADDITION: ${rel}`);
  }
}

function verifyBaseTree(baseTree, headTree, workSet) {
  if (baseTree.size !== BASE_TREE_PATHS) fail(`BASE_TREE_PATH_COUNT: ${baseTree.size} (expected ${BASE_TREE_PATHS})`);
  for (const rel of APPROVED_ADDITIONS) {
    if (baseTree.has(rel)) fail(`APPROVED_ADDITION_EXISTS_IN_BASE: ${rel}`);
  }
  const basePaths = [...baseTree.keys()].sort();
  const missing = basePaths.filter((rel) => !workSet.has(rel));
  if (missing.length > 0) fail(`BASE_PATH_MISSING: ${missing[0]} (${missing.length} missing Base path(s))`);
  const hashes = hashBatch(basePaths);
  basePaths.forEach((rel, i) => {
    if (hashes[i] !== baseTree.get(rel).sha) {
      fail(`BASE_PATH_CHANGED: ${rel} (${hashes[i]} != ${baseTree.get(rel).sha})`);
    }
    const after = headTree.get(rel);
    if (!after) fail(`BASE_PATH_MISSING_AT_HEAD: ${rel}`);
    if (after.sha !== baseTree.get(rel).sha) fail(`BASE_PATH_CHANGED_AT_HEAD: ${rel}`);
    if (after.mode !== baseTree.get(rel).mode) {
      fail(`BASE_PATH_MODE_CHANGED_AT_HEAD: ${rel} (${baseTree.get(rel).mode} -> ${after.mode})`);
    }
  });
}

function verifyProtectedInventory(baseTree, headTree, workSet) {
  const pinned = Object.keys(PROTECTED_INVENTORY).sort();
  if (pinned.length !== 72) fail(`PROTECTED_INVENTORY_COUNT: ${pinned.length} (expected 72)`);
  const missingWork = pinned.filter((rel) => !workSet.has(rel));
  if (missingWork.length > 0) fail(`PROTECTED_PATH_MISSING: ${missingWork[0]}`);
  const hashes = hashBatch(pinned);
  pinned.forEach((rel, i) => {
    const before = baseTree.get(rel);
    const after = headTree.get(rel);
    if (!before) fail(`PROTECTED_PATH_NOT_IN_BASE: ${rel}`);
    if (!after) fail(`PROTECTED_PATH_NOT_AT_HEAD: ${rel}`);
    if (before.sha !== PROTECTED_INVENTORY[rel]) fail(`PROTECTED_BASE_BLOB_MISMATCH: ${rel}`);
    if (after.sha !== PROTECTED_INVENTORY[rel]) fail(`PROTECTED_HEAD_BLOB_CHANGED: ${rel}`);
    if (hashes[i] !== PROTECTED_INVENTORY[rel]) fail(`PROTECTED_WORKTREE_BLOB_CHANGED: ${rel}`);
  });
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

function verifyHeadAndWorktree(headTree, workFiles) {
  const headPaths = [...headTree.keys()].sort();
  if (headPaths.length !== EXPECTED_HEAD_PATHS) {
    fail(`HEAD_TREE_PATH_COUNT: ${headTree.size} (expected ${EXPECTED_HEAD_PATHS})`);
  }
  const workSet = new Set(workFiles);
  if (workSet.size !== workFiles.length) fail('WORKTREE_DUPLICATE_PATH');
  if (workFiles.length !== EXPECTED_HEAD_PATHS) {
    fail(`WORKTREE_PATH_COUNT: ${workFiles.length} (expected ${EXPECTED_HEAD_PATHS})`);
  }
  const expected = new Set([...headTree.keys()]);
  const extraWork = workFiles.filter((rel) => !expected.has(rel)).sort();
  if (extraWork.length > 0) fail(`UNEXPECTED_WORKTREE_PATH: ${extraWork[0]} (${extraWork.length} unexpected path(s))`);
  const missingWork = headPaths.filter((rel) => !workSet.has(rel));
  if (missingWork.length > 0) fail(`WORKTREE_MISSING_HEAD_PATH: ${missingWork[0]}`);
  const hashes = hashBatch(headPaths);
  headPaths.forEach((rel, i) => {
    if (hashes[i] !== headTree.get(rel).sha) {
      fail(`WORKTREE_DIFFERS_FROM_HEAD: ${rel} (${hashes[i]} != ${headTree.get(rel).sha})`);
    }
  });
}

function verifyCleanCheckout() {
  const status = gitOk(['status', '--porcelain=v1', '-uall'], 'CLEAN_CHECKOUT');
  if (status.trim() !== '') {
    const first = status.trim().split(/\r?\n/)[0];
    fail(`CLEAN_CHECKOUT: git status --porcelain is not empty: ${first}`);
  }
}

function audit() {
  if (process.argv.length > 2) fail(`UNEXPECTED_ARGUMENTS: ${process.argv.slice(2).join(' ')}`);
  const { head, commitCount } = verifyHistory();
  verifyWhitelist();
  verifyCleanCheckout();
  const baseTree = readTree(BASE, 'BASE_TREE');
  const headTree = readTree('HEAD', 'HEAD_TREE');
  const workFiles = walkWorktree();
  const workSet = new Set(workFiles);
  verifyBaseTree(baseTree, headTree, workSet);
  verifyProtectedInventory(baseTree, headTree, workSet);
  verifyHeadAndWorktree(headTree, workFiles);
  console.log('CANDIDATE_SCOPE_OK');
  console.log(`base=${BASE} head=${head} commits=${commitCount}`);
  console.log(`basePaths=${baseTree.size} approvedAdditions=${APPROVED_ADDITIONS.length} protectedPaths=${Object.keys(PROTECTED_INVENTORY).length} headPaths=${headTree.size} worktreePaths=${workFiles.length}`);
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
