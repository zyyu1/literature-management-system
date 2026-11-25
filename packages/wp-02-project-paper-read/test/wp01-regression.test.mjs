// Q2-11: WP-01 regression. (a) packages/wp-01-synthetic-auth-api/** equals the A56 Base
// a0fb04f6d03ac81bbcb35800318c927e278e8b92 plus exactly the D007-A60 test-only overlay (the two
// test preconditions and the new support/platform-precondition.mjs; every other byte unchanged);
// (b) the WP-01 suite is 67/67.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const WP01 = new URL('../../wp-01-synthetic-auth-api/', import.meta.url);

// sha256 of every file under packages/wp-01-synthetic-auth-api at Base a0fb04f (git show <Base>:<path> | sha256sum).
const BASE_MANIFEST = [
  ['README.md', '1dbcbf300c4276fce29a3f26adcce7879fa42300aa9091f7d17733dc58141449'],
  ['evidence/WP01-SUMMARY.md', '9ead842d0df782b4d85dc68adf042fbda633c23f5498e0768a063b285d059ac1'],
  ['evidence/WP01-egress-probe.txt', 'c8beea40704006d6bcc333e62d65e0bf2803c84889e20df08420a78ffa5af292'],
  ['evidence/WP01-node-test-run1.tap', '66c1919ed924c5401f2d89fb97f9cc3454ad61a4b0c94f84e786d500e74df9c3'],
  ['evidence/WP01-node-test-run2.tap', 'feb359449ba4a37402518dc54e1f07668de67b7c325e2a19bdc6dbd7d223af62'],
  ['evidence/WP01-node-test-run3.tap', '5f3564a06be257a71d4a429518f8b91df1138bd6167cfc38ddd6982aeb2bfff1'],
  ['evidence/WP01-node-test-run4.tap', '24265f08187888237ed1d4d7c83709264e9cb39ed63181b822dc81f6b6bc1fc4'],
  ['evidence/WP01-node-test-run5.tap', 'fb9be501be7ccf9c5aca7c02f4158212685f43cfe1cbc0175bcc53adeddd4bee'],
  ['package.json', '625e86e492422de3fe5da12a9845e28f91897c13c978691952ae342d982941c2'],
  ['src/policy.mjs', '5012f06451e7d064a7bf9810ade069616d8bcb456a4c9c5849d12066879f9ea3'],
  ['src/server.mjs', 'fde40c103cd11a3f0e63895ce418f185840b0c10bdfbf010c6b5fcb414476604'],
  ['src/store.mjs', 'cf178e7f1d9bb53414dcc09fbdf634caf085c5e1c94a8b8a6dba9accf178a0f9'],
  ['support/harness.mjs', '5973200605e7f8b389b18dac85212f062df9e520f414965be4db274bf313d766'],
  ['test/auth-contract.test.mjs', '42f229ca7cd9cf204c61de41c2e7aa78b396df21704e67cff3c3f97264d9c073'],
  ['test/origin-csrf.test.mjs', '4d70c3afd6c16f203307ecc86d68b228185aadfaafe9d9685fd358d99d3aa4b1'],
  ['test/outcome-unknown.test.mjs', '7993c1399337eb24d4797598ecb481842a22a60cf2f1280d7a35c5c74d6980f9'],
  ['test/scope-workspace.test.mjs', 'ee91b4d321bf6763a96f5c9d100cfca288acd762afe4d444cf37c4fa17ffbcea'],
  ['test/session-revocation.test.mjs', '5940e2895fd9ed2217efde04c281a386d600a77454967c656400c19cd2a3089a'],
  ['test/transport-negative.test.mjs', 'c85a3c5d5e0ce39fe5245e4f7253bdcaf6192b05b45ea6c75d7b220dfe01a343'],
];

// D007-A60 overlay: the ONLY authorized WP-01 byte changes plus the one new test-only helper.
// Every other file keeps its literal A56 Base SHA-256 from BASE_MANIFEST above; nothing is derived
// at runtime and no path is excluded by wildcard.
const A60_OVERLAY = Object.freeze({
  'test/auth-contract.test.mjs': '243a5523b4bf285aa7e8e85b6757535e34379d3b10e514cca903c4c4fcbfe753',
  'test/transport-negative.test.mjs': '9ee17908eb1e5338aa0bece83096468c5209fa819925d251761cbdf4b9bbddb1',
  'support/platform-precondition.mjs': '5e67d2e482ceb53c5a4e3a77c37791355665727558eb89b8dd2469b774975bdf',
});
const A60_ADDED = ['support/platform-precondition.mjs'];

function expectedShaFor(relPath) {
  if (Object.hasOwn(A60_OVERLAY, relPath)) return A60_OVERLAY[relPath];
  const row = BASE_MANIFEST.find(([p]) => p === relPath);
  if (!row) throw new Error(`Q2-11 unexpected path: ${relPath}`);
  return row[1];
}

function listFiles(dirUrl, prefix = '', out = []) {
  for (const e of fs.readdirSync(dirUrl, { withFileTypes: true })) {
    if (e.isDirectory()) listFiles(new URL(e.name + '/', dirUrl), prefix + e.name + '/', out);
    else out.push(prefix + e.name);
  }
  return out;
}

test('Q2-11 packages/wp-01-synthetic-auth-api/** equals the A56 Base plus the explicit A60 test-only overlay (no other change)', () => {
  const actual = listFiles(WP01).sort();
  const expected = [...BASE_MANIFEST.map(([p]) => p), ...A60_ADDED].sort();
  assert.deepEqual(actual, expected);
  for (const p of expected) {
    const got = createHash('sha256').update(fs.readFileSync(new URL(p, WP01))).digest('hex');
    assert.equal(got, expectedShaFor(p), p);
  }
});

test('Q2-11 the unchanged WP-01 suite still passes 67/67 (separate node --test process, same namespace)', () => {
  // Drop NODE_TEST_CONTEXT so the nested runner is an independent top-level run with TAP output.
  const env = { ...process['env'] };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap'], { cwd: fileURLToPath(WP01), encoding: 'utf8', timeout: 120000, env });
  const out = r.stdout || '';
  const num = (k) => Number((out.match(new RegExp(`^# ${k} (\\d+)$`, 'm')) || [])[1]);
  assert.equal(r.status, 0, 'WP-01 suite exit code');
  assert.equal(num('tests'), 67);
  assert.equal(num('pass'), 67);
  assert.equal(num('fail'), 0);
});
