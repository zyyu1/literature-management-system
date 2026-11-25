// Q3-11: protected dependency integrity and strict untouched-upstream regression.
//
// D007-A66 §3b separates two proofs that must both exist:
//   1. this ordinary, long-lived regression pins the actual original Base Git blob IDs and the exact
//      inventory of both whole upstream packages (including their evidence files), the two frozen
//      fixtures and tools/offline. It tolerates unrelated approved main-only docs and the new WP-03
//      package paths because only the pinned sets are checked.
//   2. scripts/verify-candidate-scope.mjs is the separate explicit full candidate audit (Base tree,
//      cumulative additions, incremental commits, clean checkout); it is not a test file and is not
//      discovered by `node --test`.
//
// D007-A66 §3a makes the frozen A62 egress precondition unconditional. It runs during module
// evaluation, before this file can spawn an upstream child or create any socket, and there is no
// HOST_PRECONDITION_ONLY relaxation and no WP03_REQUIRE_OFFLINE_UPSTREAM opt-in.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assertPlatformEgressPrecondition } from '../../wp-01-synthetic-auth-api/support/platform-precondition.mjs';

assertPlatformEgressPrecondition();

const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const EXPECTED_WP01_TESTS = 67;
const EXPECTED_WP02_TESTS = 44;
const NESTED_WP01_TITLE = 'Q2-11 the unchanged WP-01 suite still passes 67/67 (separate node --test process, same namespace)';

// Exact inventory of protected dependency paths with the original Base Git blob ID of each file.
// Generated mechanically from `git ls-tree -r 1684cea5623c8421e16c328c7f1464e8932d3118` for the
// four protected sets. The values are literal pins: no expected hash is derived at runtime. No
// wildcard, prefix-only check, exclusion or ignore rule is applied when the inventory is compared;
// every path below is checked and any extra file under the protected directories fails the test.
const PROTECTED_INVENTORY = Object.freeze({
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
  'tools/offline/egress-probe.mjs': 'fceeea897156b2f87f240d217f2c93f231a6d662',
  'tools/offline/lo-up.py': '55b45a3678fe347155ca54c89110aa1dd0ad1454',
  'tools/offline/run-offline.sh': '2d06bfc3aee1c1d9b3a8e67fd93e483bc8b1fb20',
});
const PROTECTED_DIRECTORIES = Object.freeze([
  'packages/wp-01-synthetic-auth-api',
  'packages/wp-02-project-paper-read',
  'tools/offline',
]);
const PROTECTED_FILES = Object.freeze([
  'docs/handoffs/WP-01/fixtures/wp01.v1.json',
  'docs/handoffs/WP-02/fixtures/wp02.v1.json',
]);

function git(args, opts = {}) {
  const r = spawnSync('git', args, { cwd: REPO, encoding: 'utf8', timeout: 120000, ...opts });
  return r;
}

function walkProtected(relDir) {
  const out = [];
  function walk(dir, prefix) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), rel);
      } else {
        assert.ok(entry.isFile(), `protected path is not a regular file: ${relDir}/${rel}`);
        out.push(rel);
      }
    }
  }
  walk(path.join(REPO, relDir), relDir);
  return out;
}

function hashBatch(rels) {
  const hashes = [];
  for (let i = 0; i < rels.length; i += 40) {
    const chunk = rels.slice(i, i + 40);
    const r = git(['hash-object', '--no-filters', '--', ...chunk]);
    assert.equal(r.status, 0, `git hash-object chunk at ${i}`);
    const lines = r.stdout.trim().split('\n').filter(Boolean);
    assert.equal(lines.length, chunk.length, 'git hash-object returned one hash per path');
    hashes.push(...lines);
  }
  return hashes;
}

test('Q3-11 protected dependency bytes (both upstream packages and evidence, both fixtures, tools/offline) match the pinned original Base blob IDs with no extra or missing protected path', () => {
  const pinnedPaths = Object.keys(PROTECTED_INVENTORY).sort();
  assert.equal(pinnedPaths.length, 51, 'the pinned protected inventory is the full 51-path Base inventory');
  assert.equal(Object.isFrozen(PROTECTED_INVENTORY), true);

  for (const relDir of PROTECTED_DIRECTORIES) {
    const absDir = path.join(REPO, relDir);
    assert.ok(fs.existsSync(absDir), `protected dependency directory is missing: ${relDir}/`);
    const actual = walkProtected(relDir).sort();
    const expected = pinnedPaths.filter((rel) => rel.startsWith(`${relDir}/`));
    assert.deepEqual(actual, expected,
      `protected dependency inventory mismatch under ${relDir}/ (extra, missing or unexpected nested path)`);
  }
  for (const rel of PROTECTED_FILES) {
    const abs = path.join(REPO, rel);
    assert.ok(fs.existsSync(abs), `protected fixture is missing: ${rel}`);
    assert.ok(fs.statSync(abs).isFile(), `protected fixture is a regular file: ${rel}`);
  }

  const hashes = hashBatch(pinnedPaths);
  const mismatched = [];
  pinnedPaths.forEach((rel, i) => {
    if (hashes[i] !== PROTECTED_INVENTORY[rel]) mismatched.push(rel);
  });
  assert.deepEqual(mismatched, [],
    'protected dependency bytes changed from the pinned original Base Git blob IDs (git hash-object --no-filters)');
});

// Strict TAP validation for the frozen upstream suites. Any missing, malformed, duplicated or
// partial summary line is rejected; the plan and every `ok` line must be present and consistent.
function parseTapSummary(out, label, expectedTests) {
  assert.equal(typeof out, 'string', `${label} TAP stdout must be text`);
  const lines = out.split(/\r?\n/);
  assert.equal(lines[0], 'TAP version 13', `${label} TAP header`);
  const requiredKeys = ['tests', 'suites', 'pass', 'fail', 'cancelled', 'skipped', 'todo'];
  const summary = new Map();
  for (const line of lines) {
    const m = /^# (tests|suites|pass|fail|cancelled|skipped|todo|duration_ms) (.*)$/.exec(line);
    if (!m) continue;
    assert.ok(!summary.has(m[1]), `${label} duplicate TAP summary line: # ${m[1]}`);
    summary.set(m[1], m[2]);
  }
  for (const key of requiredKeys) {
    assert.ok(summary.has(key), `${label} missing TAP summary line: # ${key}`);
    assert.match(summary.get(key), /^\d+$/, `${label} malformed TAP summary value: # ${key} ${summary.get(key)}`);
  }
  if (summary.has('duration_ms')) {
    assert.match(summary.get('duration_ms'), /^\d+(?:\.\d+)?$/, `${label} malformed TAP duration_ms`);
  }
  const plans = lines.map((line) => /^1\.\.(\d+)$/.exec(line)).filter(Boolean);
  assert.equal(plans.length, 1, `${label} exactly one TAP plan line 1..N`);
  assert.equal(Number(plans[0][1]), expectedTests, `${label} TAP plan test count`);
  const notOk = lines.filter((line) => /^not ok \d+ - /.test(line));
  assert.deepEqual(notOk, [], `${label} has a failing TAP test line`);
  const ok = lines.filter((line) => /^ok \d+ - /.test(line));
  assert.equal(ok.length, expectedTests, `${label} TAP ok line count`);
  const numbers = [];
  for (const line of ok) {
    numbers.push(Number(/^ok (\d+) - /.exec(line)[1]));
  }
  assert.deepEqual([...numbers].sort((a, b) => a - b), Array.from({ length: expectedTests }, (_, i) => i + 1),
    `${label} TAP test numbers must be exactly 1..${expectedTests} without duplicates`);
  assert.deepEqual(
    lines.filter((line) => /^(?:ok|not ok) \d+ - .*#\s*(?:SKIP|TODO)\b/i.test(line)
      || /^# (?:SKIP|TODO)\b/.test(line)),
    [],
    `${label} has a SKIP/TODO directive`,
  );
  const num = (key) => Number(summary.get(key));
  assert.equal(num('tests'), expectedTests, `${label} summary test count`);
  assert.equal(num('pass'), expectedTests, `${label} summary pass count`);
  assert.equal(num('fail'), 0, `${label} summary fail count`);
  assert.equal(num('cancelled'), 0, `${label} summary cancelled count`);
  assert.equal(num('skipped'), 0, `${label} summary skipped count`);
  assert.equal(num('todo'), 0, `${label} summary todo count`);
  return {
    tests: num('tests'), pass: num('pass'), fail: num('fail'),
    cancelled: num('cancelled'), skipped: num('skipped'), todo: num('todo'),
  };
}

function assertStrictUpstream(r, { label, expectedTests }) {
  assert.ok(r && typeof r === 'object', `${label} result object`);
  assert.equal(r.error, undefined, `${label} child must not fail to spawn or time out`);
  assert.equal(r.signal, null, `${label} child must not be terminated by a signal`);
  assert.equal(r.status, 0, `${label} child exit code must be 0`);
  const summary = parseTapSummary(r.stdout, label, expectedTests);
  return { verdict: 'FULL', ...summary };
}

function assertTapTestOk(out, title, label) {
  const wanted = ` - ${title}`;
  assert.ok(out.split(/\r?\n/).some((line) => line.startsWith('ok ') && line.endsWith(wanted)),
    `${label} missing the required passing test: ${title}`);
}

function runTapSuite(cwd) {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap'], {
    cwd, encoding: 'utf8', timeout: 180000, env,
  });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '', signal: r.signal, error: r.error };
}

test('Q3-11 the untouched WP-01 suite passes exactly 67/67 with zero fail/skip/todo in strict TAP', (t) => {
  const r = runTapSuite(path.join(REPO, 'packages/wp-01-synthetic-auth-api'));
  const v = assertStrictUpstream(r, { label: 'WP-01', expectedTests: EXPECTED_WP01_TESTS });
  t.diagnostic(`WP01_UPSTREAM tests=${v.tests} pass=${v.pass} fail=${v.fail} skipped=${v.skipped} todo=${v.todo} verdict=${v.verdict}`);
});

test('Q3-11 the untouched WP-02 suite passes exactly 44/44 including its nested WP-01 67/67 with zero fail/skip/todo in strict TAP', (t) => {
  const r = runTapSuite(path.join(REPO, 'packages/wp-02-project-paper-read'));
  const v = assertStrictUpstream(r, { label: 'WP-02', expectedTests: EXPECTED_WP02_TESTS });
  assertTapTestOk(r.stdout, NESTED_WP01_TITLE, 'WP-02 nested WP-01 67/67');
  t.diagnostic(`WP02_UPSTREAM tests=${v.tests} pass=${v.pass} fail=${v.fail} skipped=${v.skipped} todo=${v.todo} verdict=${v.verdict}`);
});
