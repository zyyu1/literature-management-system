// WP-02 mutation driver (Execution self-check; NOT independent QA). Node built-ins only.
// For each mutant: copy the package into a scratch tree under os.tmpdir(), apply ONE exact text replacement,
// run the WP-02 suite, and require (a) a non-zero exit and (b) a failing test whose title matches `expect`.
// Run inside the A54 namespace:  /tmp/offline/run-offline.sh node scripts/mutation-check.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PKG = fileURLToPath(new URL('../', import.meta.url));
const REPO = path.resolve(PKG, '../..');

export const MUTANTS = [
  { id: 'M01', what: 'title/DOI merge of papers', file: 'src/catalog.mjs',
    from: "if (papers.has(k)) throw new Error('STOP: duplicated global paper'); // A10/A56 STOP condition",
    to: "if (papers.has(k)) throw new Error('STOP: duplicated global paper');\n    { const twin = [...papers.values()].find((v) => v.title === x.title && v.doi === x.doi); if (twin) { papers.set(k, twin); continue; } }",
    expect: /Q2-02 identical title AND DOI never merge/ },
  { id: 'M02', what: 'itemKey-only identity', file: 'src/catalog.mjs',
    from: "return [ownerScope, libraryType, libraryId, itemKey].join('\\u0000');",
    to: "return [ownerScope, itemKey].join('\\u0000');",
    expect: /Q2-02 A6-02 same itemKey in another library/ },
  { id: 'M03', what: 'important made global', file: 'src/server.mjs',
    from: "readingStatus: p.readingStatus, noteState: p.note ? 'PRESENT' : 'EMPTY', important: a.important,",
    to: "readingStatus: p.readingStatus, noteState: p.note ? 'PRESENT' : 'EMPTY', important: catalog.paperAssociations(a.paperKey).some((x) => x.important),",
    expect: /Q2-04 important is PROJECT-LOCAL/ },
  { id: 'M04', what: 'foreign Project leaked (owner scope ignored)', file: 'src/catalog.mjs',
    from: '.filter((pr) => pr.ownerId === principal.ownerId)',
    to: '.filter(() => true)',
    expect: /Q2-03 .*foreign/ },
  { id: 'M05', what: 'archived Project hidden from detail', file: 'src/server.mjs',
    from: '.filter((a) => readable.has(a.projectId))',
    to: '.filter((a) => readable.has(a.projectId) && !readable.get(a.projectId).archived)',
    expect: /Q2-05 detail associations/ },
  { id: 'M06', what: 'distinguishable 403 for missing vs foreign (404 for missing paper)', file: 'src/server.mjs',
    from: '      if (!p) throw NOT_AVAILABLE();',
    to: "      if (!p) throw new Denial(404, 'NOT_FOUND');",
    expect: /Q2-06 every denial class yields the byte-identical/ },
  { id: 'M07', what: 'a non-GET mutates state (DELETE drops the Project)', file: 'src/server.mjs',
    from: "    if (req.method !== 'GET') return send(",
    to: "    if (req.method === 'DELETE' && params.projectId) catalog.projects.delete(params.projectId);\n    if (req.method !== 'GET') return send(",
    expect: /Q2-07 .*405|Q2-08/ },
  { id: 'M08', what: 'note normalisation (CRLF->LF + trim)', file: 'src/catalog.mjs',
    from: 'note[nk] = x.note[nk]; // stored verbatim',
    to: "note[nk] = x.note[nk].replace(/\\r\\n/g, '\\n').trim(); // stored verbatim",
    expect: /Q2-09 R-BYTES/ },
  { id: 'M09', what: 'ANONYMOUS distinguishable (401 instead of neutral 403)', file: 'src/server.mjs',
    from: '    if (found.length === 0) throw NOT_AVAILABLE();',
    to: "    if (found.length === 0) throw new Denial(401, 'AUTH_REQUIRED');",
    expect: /Q2-06 every denial class yields the byte-identical/ },
  { id: 'M10', what: 'state=active filter includes archived', file: 'src/server.mjs',
    from: "(state === 'archived' ? pr.archived : !pr.archived)",
    to: "(state === 'archived' ? pr.archived : true)",
    expect: /Q2-03 default and state=active/ },
  { id: 'M11', what: 'WORKSPACE_READONLY denied on reads', file: 'src/server.mjs',
    from: "if (principal.role !== 'OWNER' && principal.role !== 'WORKSPACE_READONLY') throw NOT_AVAILABLE();",
    to: "if (principal.role !== 'OWNER') throw NOT_AVAILABLE();",
    expect: /Q2-07 WORKSPACE_READONLY: every WP-02 GET succeeds/ },
  { id: 'M12', what: 're-import creates a second link (no dedupe)', file: 'src/catalog.mjs',
    from: '    if (associations.has(lk)) return { created: false };\n',
    to: "    if (associations.has(lk)) { associations.set(lk + '#dup', { projectId, paperKey: pk, important: important === true }); return { created: true }; }\n",
    expect: /Q2-01 A6-01 seeded re-import/ },
  { id: 'M13', what: 'dot accepted in libraryId (traversal-prone ID grammar)', file: 'src/catalog.mjs',
    from: 'export const LIBRARY_ID_RE = /^[A-Za-z0-9]{1,64}$/;',
    to: 'export const LIBRARY_ID_RE = /^[A-Za-z0-9.]{1,64}$/;',
    expect: /Q2-10 traversal/ },
];

function copyTree(root) {
  fs.mkdirSync(path.join(root, 'docs/handoffs/WP-01/fixtures'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs/handoffs/WP-02/fixtures'), { recursive: true });
  fs.copyFileSync(path.join(REPO, 'docs/handoffs/WP-01/fixtures/wp01.v1.json'), path.join(root, 'docs/handoffs/WP-01/fixtures/wp01.v1.json'));
  fs.copyFileSync(path.join(REPO, 'docs/handoffs/WP-02/fixtures/wp02.v1.json'), path.join(root, 'docs/handoffs/WP-02/fixtures/wp02.v1.json'));
  fs.cpSync(path.join(REPO, 'packages/wp-01-synthetic-auth-api'), path.join(root, 'packages/wp-01-synthetic-auth-api'), { recursive: true });
  fs.cpSync(PKG, path.join(root, 'packages/wp-02-project-paper-read'), {
    recursive: true, filter: (src) => !src.includes(`${path.sep}evidence`) && !src.includes(`${path.sep}scripts`),
  });
}

function runSuite(cwd) {
  const env = { ...process['env'] };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap'], { cwd, encoding: 'utf8', timeout: 180000, env });
  const failed = (r.stdout || '').split('\n').filter((l) => /^not ok \d+ - /.test(l)).map((l) => l.replace(/^not ok \d+ - /, ''));
  return { status: r.status, failed };
}

function main() {
  const results = [];
  // Baseline: unmutated scratch copy must pass.
  const baseRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wp02-mut-base-'));
  copyTree(baseRoot);
  const base = runSuite(path.join(baseRoot, 'packages/wp-02-project-paper-read'));
  fs.rmSync(baseRoot, { recursive: true, force: true });
  console.log(`BASELINE exit=${base.status} failed=${base.failed.length}`);
  if (base.status !== 0) { console.log('BASELINE_NOT_GREEN'); process.exit(2); }

  for (const m of MUTANTS) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), `wp02-mut-${m.id}-`));
    copyTree(root);
    const target = path.join(root, 'packages/wp-02-project-paper-read', m.file);
    const src = fs.readFileSync(target, 'utf8');
    const n = src.split(m.from).length - 1;
    let verdict;
    let detail = '';
    if (n !== 1) { verdict = 'PATTERN_NOT_UNIQUE'; detail = `occurrences=${n}`; } else {
      fs.writeFileSync(target, src.replace(m.from, m.to));
      const r = runSuite(path.join(root, 'packages/wp-02-project-paper-read'));
      const named = r.failed.find((f) => m.expect.test(f));
      verdict = r.status !== 0 && named ? 'KILLED' : r.status !== 0 ? 'KILLED_WRONG_REASON' : 'SURVIVED';
      detail = `exit=${r.status} failing=${r.failed.length} by="${named || r.failed[0] || ''}"`;
    }
    fs.rmSync(root, { recursive: true, force: true });
    results.push({ ...m, verdict });
    console.log(`${m.id} ${verdict} — ${m.what} — ${detail}`);
  }
  const killed = results.filter((r) => r.verdict === 'KILLED').length;
  console.log(`MUTATION_SUMMARY killed=${killed}/${results.length}`);
  process.exit(killed === results.length ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
