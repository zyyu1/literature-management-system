// Q4-12: protected dependency integrity and strict untouched-upstream regression.
//
//   1. this ordinary, long-lived regression pins the actual original Base Git blob IDs and the exact
//      inventories of all three upstream packages (including their evidence files), the two frozen
//      fixtures and tools/offline. It tolerates unrelated approved main-only docs and the new WP-04
//      package paths because only the pinned sets are checked.
//   2. scripts/verify-candidate-scope.mjs is the separate explicit full candidate audit (Base tree,
//      cumulative additions, incremental commits, clean checkout); it is not a test file and is not
//      discovered by `node --test`.
//
// The frozen A62 egress precondition runs during module evaluation, before this file can spawn an
// upstream child or create any socket. There is no environment opt-in and no relaxation.
//
// Strict TAP acceptance contract (D007-A72 §3, carried forward by D007-A85 §0): exactly the stateful
// grammar emitted by the frozen Node v22.23.5 `--test-reporter=tap` runs, rejecting bailout, any
// failing/noncanonical/indented status record, SKIP/TODO, duplicate header/plan/summary, trailing
// content and malformed records anywhere.
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
const EXPECTED_WP03_TESTS = 103;
const NESTED_WP01_TITLE = 'Q2-11 the unchanged WP-01 suite still passes 67/67 (separate node --test process, same namespace)';

// Exact inventory of protected dependency paths with the original Base Git blob ID of each file.
// Generated mechanically from `git ls-tree -r bcc4eaad5183c923f782da0475eea1751be2de3b` for the
// five protected sets. The values are literal pins: no expected hash is derived at runtime. No
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
const PROTECTED_DIRECTORIES = Object.freeze([
  'packages/wp-01-synthetic-auth-api',
  'packages/wp-02-project-paper-read',
  'packages/wp-03-guarded-r1-writes',
  'tools/offline',
]);
const PROTECTED_FILES = Object.freeze([
  'docs/handoffs/WP-01/fixtures/wp01.v1.json',
  'docs/handoffs/WP-02/fixtures/wp02.v1.json',
]);

function git(args, opts = {}) {
  return spawnSync('git', args, { cwd: REPO, encoding: 'utf8', timeout: 120000, ...opts });
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

test('Q4-12 protected dependency bytes (all three upstream packages and evidence, both fixtures, tools/offline) match the pinned Base blob IDs with no extra or missing protected path', () => {
  const pinnedPaths = Object.keys(PROTECTED_INVENTORY).sort();
  assert.equal(pinnedPaths.length, 72, 'the pinned protected inventory is the full 72-path Base inventory');
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

// A72-STRICT-TAP-BEGIN
const TAP_HEADER = 'TAP version 13';
const TAP_SUMMARY_COUNT_KEYS = Object.freeze(['tests', 'suites', 'pass', 'fail', 'cancelled', 'skipped', 'todo']);

function tapLines(out, label) {
  assert.equal(typeof out, 'string', `${label} TAP stdout must be text`);
  assert.ok(out.length > 0, `${label} TAP stdout must not be empty`);
  const lines = out.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines.map((line) => (line.endsWith('\r') ? line.slice(0, -1) : line));
}

function parseTapCount(text, label, key) {
  assert.match(text, /^(?:0|[1-9]\d*)$/, `${label} malformed TAP summary value: # ${key} ${text}`);
  const value = Number(text);
  assert.ok(Number.isSafeInteger(value), `${label} TAP summary value is not a safe integer: # ${key} ${text}`);
  return value;
}

function parseTapSummary(out, label, expectedTests) {
  assert.ok(Number.isSafeInteger(expectedTests) && expectedTests > 0,
    `${label} expected test count must be a positive safe integer`);

  const lines = tapLines(out, label);
  let i = 0;
  assert.equal(lines[i], TAP_HEADER, `${label} TAP header`);
  i += 1;

  const titles = [];
  let pendingSubtest = null;
  let plan = null;

  while (i < lines.length) {
    const line = lines[i];
    assert.ok(line !== '', `${label} unexpected blank line before the TAP plan (line ${i + 1})`);
    assert.ok(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(line), `${label} has a control character in a TAP line`);
    assert.ok(!/^\s*bail out!/i.test(line), `${label} has a TAP bailout line`);
    assert.ok(!/^\s*not\s+ok(?:\s|$)/i.test(line), `${label} has a failing TAP status record`);

    if (line === TAP_HEADER) assert.fail(`${label} duplicate TAP header`);
    assert.ok(!/^TAP version\b/.test(line), `${label} unsupported TAP version line`);

    if (line.startsWith('# Subtest:')) {
      assert.equal(pendingSubtest, null, `${label} subtest comment without an intervening ok record`);
      const subtest = /^# Subtest: (.+)$/.exec(line);
      assert.ok(subtest, `${label} malformed TAP subtest comment`);
      assert.ok(subtest[1] === subtest[1].trim() && subtest[1].length > 0,
        `${label} TAP subtest title must be non-empty and unpadded`);
      pendingSubtest = subtest[1];
      i += 1;
      continue;
    }

    if (/^# (?:tests|suites|pass|fail|cancelled|skipped|todo|duration_ms)\b/i.test(line)) {
      assert.fail(`${label} TAP summary line before the plan`);
    }

    if (/^ok\b/.test(line)) {
      assert.ok(pendingSubtest !== null, `${label} ok record without a matching subtest comment`);
      const ok = /^ok ([1-9]\d*) - (.+)$/.exec(line);
      assert.ok(ok, `${label} malformed ok record`);
      const number = Number(ok[1]);
      const title = ok[2];
      assert.ok(!/#\s*(?:SKIP|TODO)\b/i.test(line), `${label} has a SKIP/TODO directive on an ok record`);
      assert.ok(Number.isSafeInteger(number), `${label} TAP ok number is not a safe integer`);
      assert.equal(number, titles.length + 1, `${label} TAP ok numbers must be exactly 1..N in order`);
      assert.equal(title, pendingSubtest, `${label} ok title does not match its subtest comment`);
      assert.ok(title.length > 0 && title === title.trim(), `${label} TAP ok title must be non-empty and unpadded`);
      pendingSubtest = null;
      titles.push(title);
      i += 1;

      assert.equal(lines[i], '  ---', `${label} missing TAP YAML block after ok ${number}`);
      assert.match(lines[i + 1] ?? '', /^  duration_ms: (?:0|[1-9]\d*)(?:\.\d+)?$/,
        `${label} malformed TAP duration_ms for ok ${number}`);
      assert.equal(lines[i + 2], "  type: 'test'", `${label} malformed TAP type for ok ${number}`);
      assert.equal(lines[i + 3], '  ...', `${label} missing TAP YAML terminator for ok ${number}`);
      i += 4;
      continue;
    }

    if (/^1\.\./.test(line)) {
      const planMatch = /^1\.\.([1-9]\d*)$/.exec(line);
      assert.ok(planMatch, `${label} malformed TAP plan line`);
      assert.equal(pendingSubtest, null, `${label} TAP plan after an unpaired subtest comment`);
      assert.ok(titles.length > 0, `${label} TAP plan before any ok record`);
      const declared = Number(planMatch[1]);
      assert.ok(Number.isSafeInteger(declared), `${label} TAP plan count is not a safe integer`);
      assert.equal(declared, expectedTests, `${label} TAP plan test count`);
      assert.equal(titles.length, expectedTests, `${label} TAP ok record count`);
      plan = declared;
      i += 1;
      break;
    }

    if (/^#(?: |$)/.test(line)) {
      assert.equal(pendingSubtest, null, `${label} diagnostic comment between subtest comment and ok record`);
      assert.ok(!/^#\s*(?:SKIP|TODO)\b/i.test(line), `${label} has a SKIP/TODO directive`);
      i += 1;
      continue;
    }

    assert.fail(`${label} unrecognized TAP line: ${JSON.stringify(line.slice(0, 80))}`);
  }

  assert.notEqual(plan, null, `${label} missing TAP plan line 1..N`);
  assert.equal(pendingSubtest, null, `${label} subtest comment without an ok record`);

  const summary = new Map();
  for (const key of TAP_SUMMARY_COUNT_KEYS) {
    const line = lines[i];
    assert.equal(typeof line, 'string', `${label} missing TAP summary line: # ${key}`);
    const m = new RegExp(`^# ${key} (\\S+)$`).exec(line);
    assert.ok(m, `${label} missing or out-of-order TAP summary line: # ${key}`);
    summary.set(key, parseTapCount(m[1], label, key));
    i += 1;
  }
  if (typeof lines[i] === 'string' && /^# duration_ms\b/.test(lines[i])) {
    const duration = /^# duration_ms ((?:0|[1-9]\d*)(?:\.\d+)?)$/.exec(lines[i]);
    assert.ok(duration, `${label} malformed TAP duration_ms line`);
    assert.ok(Number.isFinite(Number(duration[1])), `${label} TAP duration_ms is not finite`);
    summary.set('duration_ms', duration[1]);
    i += 1;
  }
  for (; i < lines.length; i += 1) {
    assert.ok(!/^\s*bail out!/i.test(lines[i]), `${label} has a TAP bailout line`);
    assert.ok(/^\s*$/.test(lines[i]), `${label} trailing content after the terminal TAP summary`);
  }

  const num = (key) => summary.get(key);
  assert.equal(num('tests'), expectedTests, `${label} summary test count`);
  assert.equal(num('pass'), expectedTests, `${label} summary pass count`);
  assert.equal(num('fail'), 0, `${label} summary fail count`);
  assert.equal(num('cancelled'), 0, `${label} summary cancelled count`);
  assert.equal(num('skipped'), 0, `${label} summary skipped count`);
  assert.equal(num('todo'), 0, `${label} summary todo count`);
  assert.equal(plan, num('tests'), `${label} TAP plan and summary test count disagree`);
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
  const lines = tapLines(out, label);
  const subtest = `# Subtest: ${title}`;
  const subtestCount = lines.filter((line) => line === subtest).length;
  const passCount = lines.filter((line) => {
    const m = /^ok ([1-9]\d*) - (.+)$/.exec(line);
    return m !== null && m[2] === title;
  }).length;
  assert.equal(subtestCount, 1, `${label} must contain exactly one subtest comment for the nested proof: ${title}`);
  assert.equal(passCount, 1, `${label} must contain exactly one canonical passing nested proof: ${title}`);
}
// A72-STRICT-TAP-END

function runTapSuite(cwd, timeoutMs = 180000) {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap'], {
    cwd, encoding: 'utf8', timeout: timeoutMs, env,
  });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '', signal: r.signal, error: r.error };
}

test('Q4-12 the untouched WP-01 suite passes exactly 67/67 with zero fail/skip/todo in strict TAP', (t) => {
  const r = runTapSuite(path.join(REPO, 'packages/wp-01-synthetic-auth-api'));
  const v = assertStrictUpstream(r, { label: 'WP-01', expectedTests: EXPECTED_WP01_TESTS });
  t.diagnostic(`WP01_UPSTREAM tests=${v.tests} pass=${v.pass} fail=${v.fail} skipped=${v.skipped} todo=${v.todo} verdict=${v.verdict}`);
});

test('Q4-12 the untouched WP-02 suite passes exactly 44/44 including its nested WP-01 67/67 with zero fail/skip/todo in strict TAP', (t) => {
  const r = runTapSuite(path.join(REPO, 'packages/wp-02-project-paper-read'));
  const v = assertStrictUpstream(r, { label: 'WP-02', expectedTests: EXPECTED_WP02_TESTS });
  assertTapTestOk(r.stdout, NESTED_WP01_TITLE, 'WP-02 nested WP-01 67/67');
  t.diagnostic(`WP02_UPSTREAM tests=${v.tests} pass=${v.pass} fail=${v.fail} skipped=${v.skipped} todo=${v.todo} verdict=${v.verdict}`);
});

test('Q4-12 the untouched WP-03 suite passes exactly 103/103 with zero fail/skip/todo in strict TAP', (t) => {
  const r = runTapSuite(path.join(REPO, 'packages/wp-03-guarded-r1-writes'), 300000);
  const v = assertStrictUpstream(r, { label: 'WP-03', expectedTests: EXPECTED_WP03_TESTS });
  t.diagnostic(`WP03_UPSTREAM tests=${v.tests} pass=${v.pass} fail=${v.fail} skipped=${v.skipped} todo=${v.todo} verdict=${v.verdict}`);
});
