// Runs the full POC-001 local evidence sequence and writes evidence/ files.
// Every result here is LOCAL MOCK ONLY. Real Nutstore: BLOCKED / NOT RUN.
import { spawnSync, execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'evidence');
const git = (c) => { try { return execSync(`git ${c}`, { cwd: root, encoding: 'utf8' }).trim(); } catch { return 'n/a'; } };

const env = {
  generatedAt: new Date().toISOString(),
  gitHead: git('rev-parse HEAD'),
  gitBranch: git('rev-parse --abbrev-ref HEAD'),
  // Recorded BEFORE evidence/ is regenerated; evidence/ itself is excluded.
  gitDirtyPaths: git("status --short -- . ':(exclude)evidence'") || '(clean)',
  node: process.version,
  npm: (() => { try { return execSync('npm --version', { encoding: 'utf8' }).trim(); } catch { return 'n/a'; } })(),
  os: `${os.type()} ${os.release()} ${os.arch()}`,
  authorizedBase: '1c084e5f14e4af8018ef5fe99710be7205cfbdf4',
  remediation: 'POC-001-REMEDIATION-01 (Design commit f7e89c4d438fc30b54546ec0f27823604df7aaa2)',
  providerKind: 'MOCK (in-repo loopback test double, poc/001/src/mock-webdav.mjs)',
  realNutstore: 'BLOCKED_REAL_SERVICE — NOT RUN (no account access authorized)',
};

rmSync(outDir, { recursive: true, force: true }); // no stale files from earlier runs
mkdirSync(outDir, { recursive: true });

const STEPS = [
  ['env-node', 'node', ['--version']],
  ['deps-tree', 'npm', ['ls', '--all']],
  ['check', 'node', ['scripts/check.mjs']],
  ['POC-01', 'node', ['--test', '--test-reporter=spec', 'test/poc01-crud.test.mjs']],
  ['POC-02', 'node', ['--test', '--test-reporter=spec', 'test/poc02-security.test.mjs']],
  ['POC-03', 'node', ['--test', '--test-reporter=spec', 'test/poc03-roundtrip.test.mjs']],
  ['POC-04', 'node', ['--test', '--test-reporter=spec', 'test/poc04-multiclient.test.mjs']],
  ['POC-05', 'node', ['--test', '--test-reporter=spec', 'test/poc05-race.test.mjs']],
  ['POC-06', 'node', ['--test', '--test-reporter=spec', 'test/poc06-faults.test.mjs']],
  ['POC-07', 'node', ['--test', '--test-reporter=spec', 'test/poc07-backup.test.mjs']],
  ['R01-regressions', 'node', ['--test', '--test-reporter=spec', 'test/r01-regressions.test.mjs']],
  ...[1, 2, 3, 4, 5].map((i) => [`full-suite-run${i}`, 'node', ['--test', 'test/*.test.mjs']]),
  ['secret-scan', 'node', ['scripts/secret-scan.mjs', '1c084e5f14e4af8018ef5fe99710be7205cfbdf4']],
  ['mutation', 'node', ['scripts/mutation-check.mjs']],
];

const results = [];
for (const [id, cmd, args] of STEPS) {
  const t0 = Date.now();
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', timeout: 600_000 });
  const ms = Date.now() - t0;
  const out = (r.stdout ?? '') + (r.stderr ? `\n[stderr]\n${r.stderr}` : '');
  // REMEDIATION-01: strip ANSI codes and the local workspace path (portable, no user paths).
  const clean = out.replace(/\x1b\[[0-9;]*m/g, '').split(root).join('<poc/001>');
  writeFileSync(join(outDir, `${id}.txt`), `$ ${cmd} ${args.join(' ')}\n# exit ${r.status} · ${ms} ms\n\n${clean}`);
  const summary = /# pass (\d+)[\s\S]*?# fail (\d+)/.exec(clean) ?? /ℹ pass (\d+)[\s\S]*?ℹ fail (\d+)/.exec(clean);
  results.push({ id, command: `${cmd} ${args.join(' ')}`, exit: r.status, ms, pass: summary?.[1] ?? null, fail: summary?.[2] ?? null });
  console.log(`${id.padEnd(12)} exit=${r.status} ${ms}ms${summary ? ` pass=${summary[1]} fail=${summary[2]}` : ''}`);
}
writeFileSync(join(outDir, 'results.json'), JSON.stringify({ env, results }, null, 2) + '\n');
const allOk = results.every((r) => r.exit === 0);
console.log(allOk ? 'ALL STEPS EXIT 0 (LOCAL MOCK ONLY)' : 'SOME STEPS FAILED');
process.exit(allOk ? 0 : 1);
