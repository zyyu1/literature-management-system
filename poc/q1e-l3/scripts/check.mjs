// Q1E-L3 (D007-A37) — no-network, no-dependency coverage and safety check. LOCAL / SYNTHETIC / MODEL_ONLY.
// Run from anywhere: `node poc/q1e-l3/scripts/check.mjs`. Does not edit anything and does not touch CI.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = '1dd8b51f84921d23dc0112e4056fa7220bbb73e8';
const WHITELIST = [
  /^poc\/q1e-l3\/README\.md$/, /^poc\/q1e-l3\/src\/(model|snapshot|recovery)\.mjs$/,
  /^poc\/q1e-l3\/test\/l3-(contract|faults)\.test\.mjs$/, /^poc\/q1e-l3\/scripts\/(check|mutation-check)\.mjs$/,
  /^poc\/q1e-l3\/evidence\/.+$/, /^docs\/handoffs\/Q1E-L3\/QA_HANDOFF\.md$/,
];
const CASES = [
  ...Array.from({ length: 12 }, (_, i) => `A36-C${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 7 }, (_, i) => `A36-T${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 7 }, (_, i) => `A36-R${String(i + 1).padStart(2, '0')}`),
];
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'} ${msg}`); if (!cond) failures++; };
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });

// 1. syntax of every JS module in the prototype
const js = walk(ROOT).filter((f) => f.endsWith('.mjs') && !f.includes(`${join(ROOT, 'evidence')}`));
for (const f of js) {
  const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  ok(r.status === 0, `node --check ${relative(ROOT, f)}`);
}
// 2. all 26 A36 cases are named tests with a positive and a negative assertion each (>= 2 assertions)
const tests = ['l3-contract.test.mjs', 'l3-faults.test.mjs'].map((f) => readFileSync(join(ROOT, 'test', f), 'utf8')).join('\n');
for (const id of CASES) {
  const named = new RegExp(`test\\('${id} `).test(tests);
  const block = tests.split(/\ntest\(/).find((b) => b.startsWith(`'${id} `)) ?? '';
  const asserts = (block.match(/assert\.\w+\(/g) ?? []).length;
  ok(named && asserts >= 2, `${id} mapped to a named test (${asserts} assertions)`);
}
ok(!/test\('A36-L\d\d/.test(tests), 'no L1 (A36-L01..L09) cases implemented (out of A37 scope)');
ok(/UNSUPPORTED_COMPLETENESS/.test(tests) && /test\('A36-C02 /.test(tests), 'A36-C02 reported as UNSUPPORTED_COMPLETENESS');
// 3. built-in only, no network/process/fs in the model, no dependency manifest, no secrets
for (const f of readdirSync(join(ROOT, 'src'))) {
  const t = readFileSync(join(ROOT, 'src', f), 'utf8');
  const imports = [...t.matchAll(/from ['"]([^'"]+)['"]/g)].map((m) => m[1]);
  ok(imports.every((m) => m === 'node:crypto' || m.startsWith('./')), `src/${f} imports only node:crypto and local modules (${imports.join(', ')})`);
  ok(!/\bfetch\(|XMLHttpRequest|WebSocket|process\.env/.test(t), `src/${f} uses no network API or environment secrets`);
}
ok(!existsSync(join(ROOT, 'package.json')) && !existsSync(join(ROOT, 'node_modules')), 'no package.json / node_modules under poc/q1e-l3 (zero dependencies)');
for (const f of walk(ROOT)) {
  const t = readFileSync(f, 'utf8');
  ok(!/-----BEGIN [A-Z ]*PRIVATE KEY-----|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|%PDF-1\./.test(t), `no key/token/PDF bytes in ${relative(ROOT, f)}`);
}
const readme = existsSync(join(ROOT, 'README.md')) ? readFileSync(join(ROOT, 'README.md'), 'utf8') : '';
ok(/MODEL_ONLY/.test(readme) && /PHYSICAL_DURABILITY_UNPROVEN/.test(readme) && /UNSUPPORTED_COMPLETENESS/.test(readme), 'README states MODEL_ONLY / PHYSICAL_DURABILITY_UNPROVEN / UNSUPPORTED_COMPLETENESS');
// 4. git scope (only when run inside the repository checkout)
const g = spawnSync('git', ['-C', ROOT, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' });
if (g.status === 0) {
  const top = g.stdout.trim();
  const committed = spawnSync('git', ['-C', top, 'diff', '--name-only', `${BASE}..HEAD`], { encoding: 'utf8' });
  const work = spawnSync('git', ['-C', top, 'status', '--porcelain', '--untracked-files=all'], { encoding: 'utf8' });
  if (committed.status === 0) {
    const paths = [...new Set([...committed.stdout.split('\n'), ...work.stdout.split('\n').map((l) => l.slice(3))].filter(Boolean))];
    const outside = paths.filter((p) => !WHITELIST.some((re) => re.test(p)));
    ok(outside.length === 0, `every changed path vs ${BASE.slice(0, 7)} is on the A37 whitelist (${paths.length} paths${outside.length ? `; outside: ${outside.join(', ')}` : ''})`);
    const merges = spawnSync('git', ['-C', top, 'rev-list', '--merges', `${BASE}..HEAD`], { encoding: 'utf8' }).stdout.trim();
    ok(merges === '', 'zero merge commits since the immutable base');
  } else {
    console.log(`INFO base ${BASE.slice(0, 7)} not available in this checkout; git scope check NOT_RUN`);
  }
} else {
  console.log('INFO not a git checkout; git scope check NOT_RUN');
}
console.log(failures ? `CHECK: ${failures} failure(s)` : 'CHECK: all checks passed (MODEL_ONLY / PHYSICAL_DURABILITY_UNPROVEN)');
process.exit(failures ? 1 : 0);
