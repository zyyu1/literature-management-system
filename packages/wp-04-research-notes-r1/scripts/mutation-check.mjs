// WP-04-R1 mutation driver (Execution self-check; NOT independent QA). Node built-ins only.
// For each mutant: copy the package plus its frozen read-only dependencies and fixtures into a
// scratch tree under os.tmpdir(), apply exact text replacements, run the relevant WP-04 test files
// and require (a) a non-zero exit and (b) a failing test whose title matches `expect`.
// The upstream-regression file is excluded here because it needs the real clone's `.git` and is run
// by the normal suite; every behavioural WP-04 file is exercised.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assertPlatformEgressPrecondition } from '../../wp-01-synthetic-auth-api/support/platform-precondition.mjs';

// D007-A62/A66 §3a preflight: the frozen egress precondition runs before any scratch-tree creation,
// baseline run, mutation work or child spawn. It is unconditional; there is no environment opt-in.
assertPlatformEgressPrecondition();

const PKG = fileURLToPath(new URL('../', import.meta.url));
const REPO = path.resolve(PKG, '../..');
const BEHAVIOUR_FILES = [
  'test/q4-01-fixture-initial-note.test.mjs',
  'test/q4-02-create.test.mjs',
  'test/q4-03-update-schema.test.mjs',
  'test/q4-04-preconditions-cas.test.mjs',
  'test/q4-05-byte-fidelity.test.mjs',
  'test/q4-06-operation-ledger.test.mjs',
  'test/q4-07-faults.test.mjs',
  'test/q4-08-auth-negative.test.mjs',
  'test/q4-09-scope-isolation.test.mjs',
  'test/q4-10-export.test.mjs',
  'test/q4-11-transport.test.mjs',
];

// Scratch trees live OUTSIDE the repository: the OS temp dir when it is writable (a hardened
// sandbox may deny it), otherwise the clone's parent directory. No repository file is touched.
function scratchBase() {
  for (const base of [os.tmpdir(), path.resolve(REPO, '..')]) {
    try {
      const probe = fs.mkdtempSync(path.join(base, 'wp04-probe-'));
      fs.rmSync(probe, { recursive: true, force: true });
      return base;
    } catch { /* try the next candidate */ }
  }
  throw new Error('no writable scratch base for the mutation driver');
}
const SCRATCH = scratchBase();

export const MUTANTS = [
  {
    id: 'M01', what: 'allow per-field partial write (missing keys default to empty and overwrite)',
    edits: [
      {
        file: 'src/server.mjs',
        from: "    if (Object.keys(raw).length !== NOTE_KEYS.length) throw new Denial(422, 'INVALID_FIELDS');\n",
        to: '',
      },
      {
        file: 'src/server.mjs',
        from: "      if (!Object.hasOwn(raw, key)) throw new Denial(422, 'INVALID_FIELDS');\n      const value = raw[key];\n",
        to: "      const value = raw[key] === undefined ? '' : raw[key];\n",
      },
    ],
    files: ['test/q4-03-update-schema.test.mjs'],
    expect: /Q4-03 missing, extra, null, non-string and duplicate five-field keys are 422 with no partial write/,
  },
  {
    id: 'M02', what: 'skip revision comparison (stale whole-note update is accepted)',
    edits: [{
      file: 'src/server.mjs',
      from: "        if (pre.tag !== `\"${current.revision}\"`) {\n          throw new Denial(412, 'STALE_RESOURCE_REVISION', { outcome: OUTCOME.CONFLICT, currentRevision: current.revision });\n        }\n",
      to: '',
    }],
    files: ['test/q4-04-preconditions-cas.test.mjs'],
    expect: /Q4-04 a stale If-Match is 412 STALE_RESOURCE_REVISION/,
  },
  {
    id: 'M03', what: 'normalize field text to NFC',
    edits: [{
      file: 'src/server.mjs',
      from: '      fields[key] = value;\n',
      to: "      fields[key] = value.normalize('NFC');\n",
    }],
    files: ['test/q4-05-byte-fidelity.test.mjs'],
    expect: /Q4-05 byte fidelity round-trip preserves/,
  },
  {
    id: 'M04', what: 'convert CRLF/CR to LF on write',
    edits: [{
      file: 'src/server.mjs',
      from: '      fields[key] = value;\n',
      to: "      fields[key] = value.replace(/\\r\\n?/g, '\\n');\n",
    }],
    files: ['test/q4-05-byte-fidelity.test.mjs'],
    expect: /Q4-05 byte fidelity round-trip preserves/,
  },
  {
    id: 'M05', what: 'trim field whitespace on write',
    edits: [{
      file: 'src/server.mjs',
      from: '      fields[key] = value;\n',
      to: '      fields[key] = value.trim();\n',
    }],
    files: ['test/q4-05-byte-fidelity.test.mjs'],
    expect: /Q4-05 byte fidelity round-trip preserves/,
  },
  {
    id: 'M06', what: 'drop owner scope (a foreign paper resolves inside the owner scope)',
    edits: [{
      file: 'src/model.mjs',
      from: '  function paperByTuple(ownerScope, libraryType, libraryId, itemKey) {\n    return papers.get(paperKey(ownerScope, libraryType, libraryId, itemKey)) || null;\n  }',
      to: '  function paperByTuple(ownerScope, libraryType, libraryId, itemKey) {\n    return [...papers.values()].find((p) => p.libraryType === libraryType && p.libraryId === libraryId && p.itemKey === itemKey) || null;\n  }',
    }],
    files: ['test/q4-08-auth-negative.test.mjs'],
    expect: /Q4-08 valid foreign and missing targets receive byte-identical neutral 403s/,
  },
  {
    id: 'M07', what: 'allow Workspace write',
    edits: [{
      file: 'src/server.mjs',
      from: "  function requireOwner(principal) {\n    if (principal.role === 'WORKSPACE_READONLY') throw workspaceReadOnly();\n    if (principal.role !== 'OWNER') throw notAvailable();\n  }",
      to: "  function requireOwner(principal) {\n    if (principal.role !== 'OWNER' && principal.role !== 'WORKSPACE_READONLY') throw notAvailable();\n  }",
    }],
    files: ['test/q4-08-auth-negative.test.mjs'],
    expect: /Q4-08 Workspace may read a note but is denied every write and the export/,
  },
  {
    id: 'M08', what: 'skip CSRF validation',
    edits: [{
      file: 'src/server.mjs',
      from: "    sessions.checkCsrf(auth.session, req.headers['x-csrf-token']);\n",
      to: '',
    }],
    files: ['test/q4-08-auth-negative.test.mjs'],
    expect: /Q4-08 missing or wrong CSRF, duplicate CSRF and an ambiguous Cookie header are rejected before dispatch/,
  },
  {
    id: 'M09', what: 'duplicate operation dispatch (ledger replay always misses)',
    edits: [{
      file: 'src/server.mjs',
      from: '    if (!prior) return null;\n',
      to: '    if (!prior) return null;\n    return null;\n',
    }],
    files: ['test/q4-06-operation-ledger.test.mjs'],
    expect: /Q4-06 an exact replay of a confirmed update never re-dispatches/,
  },
  {
    id: 'M10', what: 'accept a changed fingerprint under the same operationId',
    edits: [{
      file: 'src/server.mjs',
      from: "    if (prior.fingerprint !== fp) throw conflict('OPERATION_ID_REUSE');\n",
      to: "    if (prior.fingerprint !== fp && false) throw conflict('OPERATION_ID_REUSE');\n",
    }],
    files: ['test/q4-06-operation-ledger.test.mjs'],
    expect: /Q4-06 a changed field set, tuple, precondition or scope under one operationId is 409 OPERATION_ID_REUSE/,
  },
  {
    id: 'M11', what: 'report saved/CONFIRMED on an UNKNOWN 202',
    edits: [{
      file: 'src/server.mjs',
      from: '    } else if (result.fault === FAULT.ACCEPTED_NOT_COMMITTED) {\n      status = 202;\n      body = unknownBody(ctx.operationId);',
      to: "    } else if (result.fault === FAULT.ACCEPTED_NOT_COMMITTED) {\n      status = 202;\n      body = { ...unknownBody(ctx.operationId), outcome: 'CONFIRMED', saved: true, revision: 'rev_fake_aaaaaaaaaaaaaa' };",
    }],
    files: ['test/q4-07-faults.test.mjs'],
    expect: /Q4-07 202 accepted-not-committed stays UNKNOWN/,
  },
  {
    id: 'M12', what: 'share one note across libraries by itemKey',
    edits: [
      {
        file: 'src/model.mjs',
        from: '  function noteRecord(pk) {\n    const p = papers.get(pk);',
        to: '  function noteRecord(pk) {\n    pk = sharedNoteKey(pk);\n    const p = papers.get(pk);',
      },
      {
        file: 'src/model.mjs',
        from: '  function noteView(pk) {\n    const p = papers.get(pk);',
        to: '  function noteView(pk) {\n    pk = sharedNoteKey(pk);\n    const p = papers.get(pk);',
      },
      {
        file: 'src/model.mjs',
        from: '  function writeNote(pk, fields) {\n    const p = papers.get(pk);',
        to: '  function writeNote(pk, fields) {\n    pk = sharedNoteKey(pk);\n    const p = papers.get(pk);',
      },
      {
        file: 'src/model.mjs',
        from: '  function noteRecord(pk) {\n    pk = sharedNoteKey(pk);',
        to: "  function sharedNoteKey(pk) {\n    const p = papers.get(pk);\n    if (!p) return pk;\n    const shared = [...papers.values()].find((x) => x.ownerScope === p.ownerScope && x.itemKey === p.itemKey);\n    return shared ? shared.key : pk;\n  }\n  function noteRecord(pk) {\n    pk = sharedNoteKey(pk);",
      },
    ],
    files: ['test/q4-09-scope-isolation.test.mjs'],
    expect: /Q4-09 writing user\/fakeLib01\/XFAKE001 never changes XFAKE002, group\/fakeLib02\/XFAKE001 or the foreign paper/,
  },
  {
    id: 'M13', what: 'mutate the note revision on export',
    edits: [{
      file: 'src/server.mjs',
      from: "      const view = model.noteView(paper.key);\n      if (!view.exists) throw new Denial(409, 'NO_SAVED_NOTE', { outcome: OUTCOME.CONFLICT });",
      to: "      const view = model.noteView(paper.key);\n      if (!view.exists) throw new Denial(409, 'NO_SAVED_NOTE', { outcome: OUTCOME.CONFLICT });\n      model.writeNote(paper.key, view.fields);",
    }],
    files: ['test/q4-10-export.test.mjs'],
    expect: /Q4-10 repeated export is byte-identical and export never mutates/,
  },
  {
    id: 'M14', what: 'omit an empty section in export',
    edits: [{
      file: 'src/export.mjs',
      from: "    const value = typeof source[key] === 'string' ? source[key] : '';\n    out += `## ${NOTE_HEADINGS[key]}\\n\\n${value}\\n`;",
      to: "    const value = typeof source[key] === 'string' ? source[key] : '';\n    if (value === '') return;\n    out += `## ${NOTE_HEADINGS[key]}\\n\\n${value}\\n`;",
    }],
    files: ['test/q4-10-export.test.mjs'],
    expect: /Q4-10 metadata lines with no value are omitted and an empty field still yields its heading/,
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
  fs.cpSync(PKG, path.join(root, 'packages/wp-04-research-notes-r1'), {
    recursive: true, filter: (src) => !src.includes(`${path.sep}scripts`),
  });
}

function applyEdits(root, edits) {
  for (const edit of edits) {
    const target = path.join(root, 'packages/wp-04-research-notes-r1', edit.file);
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
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], { cwd, encoding: 'utf8', timeout: 240000, env });
  const failed = (r.stdout || '').split('\n').filter((l) => /^not ok \d+ - /.test(l)).map((l) => l.replace(/^not ok \d+ - /, ''));
  return { status: r.status, failed, timedOut: r.error && r.error.code === 'ETIMEDOUT' };
}

function main() {
  const results = [];

  const baseRoot = fs.mkdtempSync(path.join(SCRATCH, 'wp04-mut-base-'));
  copyTree(baseRoot);
  const baseline = runSuite(path.join(baseRoot, 'packages/wp-04-research-notes-r1'), BEHAVIOUR_FILES);
  fs.rmSync(baseRoot, { recursive: true, force: true });
  console.log(`BASELINE exit=${baseline.status} failing=${baseline.failed.length}`);
  if (baseline.status !== 0) {
    console.log('BASELINE_NOT_GREEN');
    for (const f of baseline.failed) console.log(`  baseline failing: ${f}`);
    process.exit(2);
  }

  for (const mutant of MUTANTS) {
    const root = fs.mkdtempSync(path.join(SCRATCH, `wp04-mut-${mutant.id}-`));
    copyTree(root);
    const pkg = path.join(root, 'packages/wp-04-research-notes-r1');
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
