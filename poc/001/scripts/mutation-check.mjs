// Sanity check that the POC tests have teeth: inject known-bad changes into a
// temporary copy of poc/001 and require the relevant suite to FAIL.
import { cp, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MUTANTS = [
  { id: 'M1', desc: 'adapter treats 5xx as committed', file: 'src/webdav-adapter.mjs',
    from: "return { outcome: 'unknown', status: r.status };", to: "return { outcome: 'committed', status: r.status, etag: null };", suite: 'test/poc06-faults.test.mjs' },
  { id: 'M2', desc: 'API forwards writes without If-Match (naive overwrite)', file: 'src/safe-api.mjs',
    from: 'const w = await adapter.put(recPath(namespace, kind, id), bytes, cond);', to: 'const w = await adapter.put(recPath(namespace, kind, id), bytes, { unsafeUnconditional: true });', suite: 'test/poc05-race.test.mjs' },
  { id: 'M3', desc: 'API re-sends an operation whose outcome is Unknown', file: 'src/safe-api.mjs',
    from: "if (prior.verdict === 'unknown') return json(res, 409, { outcome: 'verification_required', operationId: opId });", to: "if (prior.verdict === 'unknown') ledger.delete(opId); else", suite: 'test/poc06-faults.test.mjs' },
  { id: 'M4', desc: 'API access log records request headers (session token leak)', file: 'src/safe-api.mjs',
    from: 'log({ m: req.method,', to: 'log({ h: req.headers, m: req.method,', suite: 'test/poc02-security.test.mjs' },
  { id: 'M5', desc: 'restore allowed into the active namespace', file: 'src/safe-api.mjs',
    from: "|| target === namespace) return json(res, 400", to: "&& target !== namespace) return json(res, 400", suite: 'test/poc07-backup.test.mjs' },
  { id: 'M6', desc: 'path id allowlist removed (traversal possible)', file: 'src/note-codec.mjs',
    from: 'export const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;', to: 'export const ID_RE = /^.+$/;', suite: 'test/poc02-security.test.mjs' },
];

let failures = 0;
for (const m of MUTANTS) {
  const dir = await mkdtemp(join(tmpdir(), `poc001-${m.id}-`));
  await cp(root, dir, { recursive: true, filter: (p) => !p.includes('node_modules') && !p.includes('/evidence/') });
  const f = join(dir, m.file);
  const src = await readFile(f, 'utf8');
  if (!src.includes(m.from)) { console.log(`${m.id} SETUP_ERROR pattern not found`); failures++; continue; }
  await writeFile(f, src.replace(m.from, m.to));
  const r = spawnSync(process.execPath, ['--test', m.suite], { cwd: dir, encoding: 'utf8', timeout: 180_000 });
  const killed = r.status !== 0;
  console.log(`${m.id} ${killed ? 'KILLED' : 'SURVIVED'} (suite exit ${r.status}) — ${m.desc}`);
  if (!killed) failures++;
  await rm(dir, { recursive: true, force: true });
}
console.log(failures ? `MUTATION CHECK: ${failures} problem(s)` : 'MUTATION CHECK: all mutants killed');
process.exit(failures ? 1 : 0);
