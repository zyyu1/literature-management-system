// WP-03-R1 mutation driver (Execution self-check; NOT independent QA). Node built-ins only.
// For each mutant: copy the package plus its frozen read-only dependencies and fixtures into a
// scratch tree under os.tmpdir(), apply exact text replacements, run the relevant WP-03 test files
// and require (a) a non-zero exit and (b) a failing test whose title matches `expect`.
// The upstream-regression file is excluded here because it needs the real clone's `.git` and is run
// by the normal suite; every behavioural WP-03 file is exercised.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assertPlatformEgressPrecondition } from '../../wp-01-synthetic-auth-api/support/platform-precondition.mjs';

// D007-A66 §3a preflight: the frozen A62/A59 egress precondition runs before any scratch-tree
// creation, baseline run, mutation work or child spawn. It is unconditional; there is no
// environment opt-in. A connected/unsupported/ambiguous host stops here with EGRESS_PRECONDITION_FAILED
// and the 13 mutant definitions below are never exercised.
assertPlatformEgressPrecondition();

const PKG = fileURLToPath(new URL('../', import.meta.url));
const REPO = path.resolve(PKG, '../..');
const BEHAVIOUR_FILES = [
  'test/fixture-identity.test.mjs',
  'test/project-writes.test.mjs',
  'test/reading-status.test.mjs',
  'test/important.test.mjs',
  'test/preconditions.test.mjs',
  'test/operation-ledger.test.mjs',
  'test/faults.test.mjs',
  'test/auth-negative.test.mjs',
  'test/r2-negative.test.mjs',
  'test/transport.test.mjs',
];

// Scratch trees live OUTSIDE the repository: the OS temp dir when it is writable (a hardened
// sandbox may deny it), otherwise the clone's parent directory. No repository file is touched.
function scratchBase() {
  for (const base of [os.tmpdir(), path.resolve(REPO, '..')]) {
    try {
      const probe = fs.mkdtempSync(path.join(base, 'wp03-probe-'));
      fs.rmSync(probe, { recursive: true, force: true });
      return base;
    } catch { /* try the next candidate */ }
  }
  throw new Error('no writable scratch base for the mutation driver');
}
const SCRATCH = scratchBase();

export const MUTANTS = [
  {
    id: 'M01', what: 'drop owner scope (foreign Projects leak into owner reads)',
    edits: [{
      file: 'src/server.mjs',
      from: '        .filter((p) => p.ownerId === principal.ownerId)\n',
      to: '        .filter(() => true)\n',
    }],
    files: ['test/fixture-identity.test.mjs'],
    expect: /Q3-01 owner projections match the frozen fixture/,
  },
  {
    id: 'M02', what: 'allow Workspace write',
    edits: [{
      file: 'src/server.mjs',
      from: "  function requireOwner(principal) {\n    if (principal.role === 'WORKSPACE_READONLY') throw workspaceReadOnly();\n    if (principal.role !== 'OWNER') throw notAvailable();\n  }",
      to: "  function requireOwner(principal) {\n    if (principal.role !== 'OWNER' && principal.role !== 'WORKSPACE_READONLY') throw notAvailable();\n  }",
    }],
    files: ['test/auth-negative.test.mjs'],
    expect: /Q3-08 WORKSPACE_READONLY is denied every write route/,
  },
  {
    id: 'M03', what: 'skip CSRF validation',
    edits: [{
      file: 'src/server.mjs',
      from: "    sessions.checkCsrf(auth.session, req.headers['x-csrf-token']);\n",
      to: '',
    }],
    files: ['test/auth-negative.test.mjs'],
    expect: /Q3-08 missing or wrong CSRF/,
  },
  {
    id: 'M04', what: 'bypass revision comparison',
    edits: [{
      file: 'src/server.mjs',
      from: '    if (p.tag !== `"${currentRevision}"`) throw preconditionFailed(currentRevision);\n',
      to: '',
    }],
    files: ['test/preconditions.test.mjs'],
    expect: /Q3-05 a stale If-Match is 412/,
  },
  {
    id: 'M05', what: 'duplicate operation dispatch (ledger replay always misses)',
    edits: [{
      file: 'src/server.mjs',
      from: '    const prior = model.ledgerGet(principal.id, operationId);\n    if (!prior) return null;\n',
      to: '    const prior = model.ledgerGet(principal.id, operationId);\n    if (!prior) return null;\n    return null;\n',
    }],
    files: ['test/operation-ledger.test.mjs'],
    expect: /Q3-06 an exact replay of a confirmed operation/,
  },
  {
    id: 'M06', what: 'accept a changed fingerprint under the same operationId',
    edits: [{
      file: 'src/server.mjs',
      from: "    if (prior.fingerprint !== fp) throw conflict('OPERATION_ID_REUSE');\n",
      to: "    if (prior.fingerprint !== fp && false) throw conflict('OPERATION_ID_REUSE');\n",
    }],
    files: ['test/operation-ledger.test.mjs'],
    expect: /Q3-06 the same operationId with a changed action/,
  },
  {
    id: 'M07', what: 'false CONFIRMED/saved on an UNKNOWN 202',
    edits: [{
      file: 'src/server.mjs',
      from: '    } else if (result.fault === FAULT.ACCEPTED_NOT_COMMITTED) {\n      status = 202;\n      body = unknownBody(ctx.operationId);',
      to: "    } else if (result.fault === FAULT.ACCEPTED_NOT_COMMITTED) {\n      status = 202;\n      body = { ...unknownBody(ctx.operationId), outcome: 'CONFIRMED', saved: true, revision: 'rev_fake_aaaaaaaaaaaaaa' };",
    }],
    files: ['test/faults.test.mjs'],
    expect: /Q3-07 202 accepted-not-committed/,
  },
  {
    id: 'M08', what: 'make ReadingStatus Project-local in the projection',
    edits: [{
      file: 'src/model.mjs',
      from: "      readingStatus: p.readingStatus, noteState: p.note ? 'PRESENT' : 'EMPTY', important: a.important,",
      to: "      readingStatus: a.projectId === 'project_synth_alpha' ? p.readingStatus : 'To Read', noteState: p.note ? 'PRESENT' : 'EMPTY', important: a.important,",
    }],
    files: ['test/reading-status.test.mjs'],
    expect: /Q3-03 each ReadingStatus enum value/,
  },
  {
    id: 'M09', what: 'make Important global across the paper',
    edits: [{
      file: 'src/model.mjs',
      from: "      readingStatus: p.readingStatus, noteState: p.note ? 'PRESENT' : 'EMPTY', important: a.important,",
      to: "      readingStatus: p.readingStatus, noteState: p.note ? 'PRESENT' : 'EMPTY', important: model.paperAssociations(a.paperKey).some((x) => x.important),",
    }],
    files: ['test/important.test.mjs'],
    expect: /Q3-04 Important toggles only the exact Project association/,
  },
  {
    id: 'M10', what: 'allow an R2 destructive dispatch (permanent Project delete)',
    edits: [
      {
        file: 'src/model.mjs',
        from: '    allProjects: sortedProjects,\n',
        to: '    allProjects: sortedProjects,\n    deleteProject: (id) => projects.delete(id),\n',
      },
      {
        file: 'src/server.mjs',
        from: '    throw stepUpRequired();\n',
        to: "    model.deleteProject('project_synth_alpha');\n    return send(res, req, 200, { apiVersion: API_VERSION, outcome: 'CONFIRMED', dispatched: true, saved: false }, name, 'CONFIRMED');\n",
      },
    ],
    files: ['test/r2-negative.test.mjs'],
    expect: /Q3-09 valid Owner permanent Project delete/,
  },
  {
    id: 'M11', what: 'case-fold paper identity',
    edits: [{
      file: 'src/model.mjs',
      from: "import { createCatalog, paperKey } from '../../wp-02-project-paper-read/src/catalog.mjs';",
      to: "import { createCatalog } from '../../wp-02-project-paper-read/src/catalog.mjs';\nconst paperKey = (...a) => [a[0], a[1], a[2], String(a[3]).toLowerCase()].join('\\u0000');",
    }],
    files: ['test/operation-ledger.test.mjs'],
    expect: /Q3-06 case-fold identity/,
  },
  {
    id: 'M12', what: 'accept an old runId (no instance fence)',
    edits: [{
      file: 'src/server.mjs',
      from: "    if (id !== model.runId) throw conflict('STALE_MODEL_RUN');\n",
      to: "    if (id !== model.runId && false) throw conflict('STALE_MODEL_RUN');\n",
    }],
    files: ['test/operation-ledger.test.mjs'],
    expect: /Q3-06 old-runId replay/,
  },
  {
    id: 'M13', what: 'fake DEFINITE_FAILURE after a possible dispatch',
    edits: [{
      file: 'src/server.mjs',
      from: "    } else if (result.fault === FAULT.ERROR_AFTER_DISPATCH) {\n      status = 500;\n      body = unknownBody(ctx.operationId, 'INTERNAL');",
      to: "    } else if (result.fault === FAULT.ERROR_AFTER_DISPATCH) {\n      status = 500;\n      body = errorBody('INTERNAL');",
    }],
    files: ['test/faults.test.mjs'],
    expect: /Q3-07 an unexpected post-dispatch error/,
  },
];

function copyTree(root) {
  fs.mkdirSync(path.join(root, 'packages'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs/handoffs/WP-01/fixtures'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs/handoffs/WP-02/fixtures'), { recursive: true });
  fs.copyFileSync(path.join(REPO, 'docs/handoffs/WP-01/fixtures/wp01.v1.json'), path.join(root, 'docs/handoffs/WP-01/fixtures/wp01.v1.json'));
  fs.copyFileSync(path.join(REPO, 'docs/handoffs/WP-02/fixtures/wp02.v1.json'), path.join(root, 'docs/handoffs/WP-02/fixtures/wp02.v1.json'));
  fs.cpSync(path.join(REPO, 'packages/wp-01-synthetic-auth-api'), path.join(root, 'packages/wp-01-synthetic-auth-api'), {
    recursive: true, filter: (src) => !src.includes(`${path.sep}evidence`),
  });
  fs.cpSync(path.join(REPO, 'packages/wp-02-project-paper-read'), path.join(root, 'packages/wp-02-project-paper-read'), {
    recursive: true, filter: (src) => !src.includes(`${path.sep}evidence`) && !src.includes(`${path.sep}scripts`),
  });
  fs.cpSync(PKG, path.join(root, 'packages/wp-03-guarded-r1-writes'), {
    recursive: true, filter: (src) => !src.includes(`${path.sep}scripts`),
  });
}

function applyEdits(root, edits) {
  for (const edit of edits) {
    const target = path.join(root, 'packages/wp-03-guarded-r1-writes', edit.file);
    const src = fs.readFileSync(target, 'utf8');
    const occurrences = src.split(edit.from).length - 1;
    if (occurrences !== 1) return `PATTERN_NOT_UNIQUE(${edit.file}:${occurrences})`;
    fs.writeFileSync(target, src.replace(edit.from, edit.to));
  }
  return null;
}

function runSuite(cwd, files) {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], { cwd, encoding: 'utf8', timeout: 180000, env });
  const failed = (r.stdout || '').split('\n').filter((l) => /^not ok \d+ - /.test(l)).map((l) => l.replace(/^not ok \d+ - /, ''));
  return { status: r.status, failed, timedOut: r.error && r.error.code === 'ETIMEDOUT' };
}

function main() {
  const results = [];

  const baseRoot = fs.mkdtempSync(path.join(SCRATCH, 'wp03-mut-base-'));
  copyTree(baseRoot);
  const baseline = runSuite(path.join(baseRoot, 'packages/wp-03-guarded-r1-writes'), BEHAVIOUR_FILES);
  fs.rmSync(baseRoot, { recursive: true, force: true });
  console.log(`BASELINE exit=${baseline.status} failing=${baseline.failed.length}`);
  if (baseline.status !== 0) {
    console.log('BASELINE_NOT_GREEN');
    for (const f of baseline.failed) console.log(`  baseline failing: ${f}`);
    process.exit(2);
  }

  for (const mutant of MUTANTS) {
    const root = fs.mkdtempSync(path.join(SCRATCH, `wp03-mut-${mutant.id}-`));
    copyTree(root);
    const pkg = path.join(root, 'packages/wp-03-guarded-r1-writes');
    const patchError = applyEdits(root, mutant.edits);
    let verdict;
    let detail = '';
    if (patchError) {
      verdict = 'PATTERN_NOT_UNIQUE';
      detail = patchError;
    } else {
      const r = runSuite(pkg, mutant.files);
      const named = r.failed.find((f) => mutant.expect.test(f));
      verdict = r.timedOut ? 'TIMEOUT'
        : r.status !== 0 && named ? 'KILLED'
          : r.status !== 0 ? 'KILLED_WRONG_REASON'
            : 'SURVIVED';
      detail = `exit=${r.status} failing=${r.failed.length} by="${named || r.failed[0] || ''}"`;
    }
    fs.rmSync(root, { recursive: true, force: true });
    results.push({ ...mutant, verdict });
    console.log(`${mutant.id} ${verdict} — ${mutant.what} — ${detail}`);
  }
  const killed = results.filter((r) => r.verdict === 'KILLED').length;
  console.log(`MUTATION_SUMMARY killed=${killed}/${results.length}`);
  process.exit(killed === results.length ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
