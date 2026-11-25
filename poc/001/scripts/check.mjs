// Syntax check (no TypeScript/ESLint installed: zero-dependency POC). Exits non-zero on any error.
import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    if (n === 'node_modules' || n === 'evidence') continue;
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p); else if (p.endsWith('.mjs')) files.push(p);
  }
})(root);
let bad = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  if (r.status !== 0) { bad++; console.log(`FAIL ${f}\n${r.stderr}`); }
}
console.log(`node --check: ${files.length} files, ${bad} failures`);
process.exit(bad ? 1 : 0);
