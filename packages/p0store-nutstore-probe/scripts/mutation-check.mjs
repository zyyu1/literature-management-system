#!/usr/bin/env node
// P0-STORE Phase 1 mutation driver (Execution self-check; NOT independent QA). Node builtins only.
//
// The frozen A62 egress precondition runs first, before any scratch tree, baseline or child. For each
// mutant: copy this package plus the single frozen read-only dependency it imports into a scratch
// tree OUTSIDE the repository (OS temp when writable, otherwise the clone's parent directory), apply
// one exact text mutation, run the relevant test file and require a NAMED failing test (not a crash
// or timeout). The crash/timeout classifications are reported separately and never count as killed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assertPlatformEgressPrecondition } from '../../wp-01-synthetic-auth-api/support/platform-precondition.mjs';

assertPlatformEgressPrecondition();

const PKG = fileURLToPath(new URL('../', import.meta.url));
const REPO = path.resolve(PKG, '../..');
const SCRATCH = (() => {
  for (const base of [os.tmpdir(), path.resolve(REPO, '..')]) {
    try {
      const probe = fs.mkdtempSync(path.join(base, 'p0store-probe-'));
      fs.rmSync(probe, { recursive: true, force: true });
      return base;
    } catch { /* try the next candidate */ }
  }
  throw new Error('no writable scratch base for the mutation driver');
})();

export const BASELINE_FILES = Object.freeze([
  'test/p1-02-gate-pinning.test.mjs',
  'test/p1-03-tls-redirect-stop.test.mjs',
  'test/p1-04-budget-caps.test.mjs',
  'test/p1-05-secret.test.mjs',
  'test/p1-06-strong-go.test.mjs',
  'test/p1-07-no-go.test.mjs',
  'test/p1-09-late-ack.test.mjs',
  'test/p1-10-stop.test.mjs',
  'test/p1-11-race.test.mjs',
  'test/p1-14-inconclusive.test.mjs',
  'test/p1-15-live-gating.test.mjs',
]);

export const MUTANTS = Object.freeze([
  {
    id: 'M01',
    what: 'skip host/port pinning from the plan (hardcoded origin port)',
    edits: [{
      file: 'src/gate.mjs',
      from: '    host: plan.host,\n    port: plan.port,\n',
      to: '    host: plan.host,\n    port: 443,\n',
    }],
    files: ['test/p1-02-gate-pinning.test.mjs'],
    expect: /P1-02 the gate pins the exact plan host, port and run path prefix/,
  },
  {
    id: 'M02',
    what: 'follow a 3xx Location with a second transport call',
    edits: [{
      file: 'src/gate.mjs',
      from: '      stats.responses += 1;\n',
      to: '      if (result.redirect && result.headers && typeof result.headers.location === \'string\') {\n'
        + '        const redirectTarget = new URL(result.headers.location);\n'
        + '        result = await transport({\n'
        + '          host: redirectTarget.hostname,\n'
        + '          port: redirectTarget.port === \'\' ? 443 : Number(redirectTarget.port),\n'
        + '          path: redirectTarget.pathname,\n'
        + '          method,\n'
        + '          headers: {},\n'
        + '          body: null,\n'
        + '          ca: caMaterial,\n'
        + '          timeoutMs,\n'
        + '          abortMode: null,\n'
        + '          abortDelayMs: 0,\n'
        + '        });\n'
        + '      }\n'
        + '      stats.responses += 1;\n',
    }],
    files: ['test/p1-03-tls-redirect-stop.test.mjs'],
    expect: /P1-03 a 3xx response STOPs the run and the Location is never fetched/,
  },
  {
    id: 'M03',
    what: 'disable TLS certificate verification',
    edits: [{
      file: 'src/gate.mjs',
      from: '      rejectUnauthorized: true,\n',
      to: `      rejectUnauthorized: ${'false'},\n`,
    }],
    files: ['test/p1-03-tls-redirect-stop.test.mjs'],
    expect: /P1-03 wrong-ca certificate fails strict TLS verification/,
  },
  {
    id: 'M04',
    what: 'allow recursive/root DELETE at the gate (drop the Depth guard)',
    edits: [{
      file: 'src/gate.mjs',
      from: "        if (request.depth !== undefined && request.depth !== null) refuse('DELETE_DEPTH_FORBIDDEN');\n",
      to: '',
    }],
    files: ['test/p1-02-gate-pinning.test.mjs'],
    expect: /P1-02 writes and deletes are restricted to the frozen file manifest/,
  },
  {
    id: 'M05',
    what: 'skip the pre-reserved cleanup budget (normal cap becomes the full 100)',
    edits: [{
      file: 'src/gate.mjs',
      from: '    const nonReservedCeiling = this.#maxRequests - this.#reservedCleanup;\n    if (kind === \'normal\') {\n',
      to: '    const nonReservedCeiling = this.#maxRequests;\n    if (kind === \'normal\') {\n',
    }],
    files: ['test/p1-04-budget-caps.test.mjs'],
    expect: /P1-04 the rolling 30-minute window refuses the 89th normal request/,
  },
  {
    id: 'M06',
    what: 'log credential material (trace leak refusal disabled, silently redacted instead)',
    edits: [
      {
        file: 'src/trace.mjs',
        from: '  if (secret && secret.appearsIn(text)) traceFail(\'TRACE_SECRET_LEAK\');\n',
        to: '',
      },
      {
        file: 'src/trace.mjs',
        from: '    if (secret && secret.appearsIn(line)) traceFail(\'TRACE_SECRET_LEAK\');\n',
        to: '',
      },
    ],
    files: ['test/p1-05-secret.test.mjs'],
    expect: /P1-05 the trace writer fails closed if any event tries to carry credential material/,
  },
  {
    id: 'M07',
    what: 'treat a rejected 412 create as success (false create-only overwrite)',
    edits: [{
      file: 'src/oracle.mjs',
      from: '  if (is2xx(obs.create2.status)) {\n',
      to: '  if (is2xx(obs.create2.status) || obs.create2.status === 412) {\n',
    }],
    files: ['test/p1-06-strong-go.test.mjs'],
    expect: /P1-06 strong WebDAV personality/,
  },
  {
    id: 'M08',
    what: 'treat a missing 412 as success (lost update undetected)',
    edits: [{
      file: 'src/oracle.mjs',
      from: '  if (is2xx(obs.stale.status)) return fail(\'L5\', NO_GO_REASONS.STALE_WRITE_ACCEPTED, { status: obs.stale.status });\n',
      to: '',
    }],
    files: ['test/p1-07-no-go.test.mjs'],
    expect: /P1-07 lost-update personality/,
  },
  {
    id: 'M09',
    what: 'blind retry after an unresolvable late ACK',
    edits: [{
      file: 'src/runner.mjs',
      from: '      } else {\n'
        + '        ctx.current = { ...pre, certain: false };\n'
        + '        ctx.files.get(\'XFA\').certain = false;\n'
        + '      }\n'
        + '      rounds.push({\n',
      to: '      } else {\n'
        + '        ctx.current = { ...pre, certain: false };\n'
        + '        ctx.files.get(\'XFA\').certain = false;\n'
        + '      }\n'
        + '      if (resolution === \'UNRESOLVABLE\') {\n'
        + '        const retry = await gate.request({ method: \'PUT\', fileId: \'XFA\', ifMatch: pre.etag, body });\n'
        + '        recordRequest(\'L8\', retry);\n'
        + '      }\n'
        + '      rounds.push({\n',
    }],
    files: ['test/p1-09-late-ack.test.mjs'],
    expect: /P1-09 unresolvable-ack personality/,
  },
  {
    id: 'M10',
    what: 'treat an UNRESOLVABLE late ACK as a PASS (GO despite an undetermined outcome)',
    edits: [{
      file: 'src/oracle.mjs',
      from: '    return unresolved(\'L8\', \'L8_OUTCOME_UNRESOLVABLE\', evidence, [ANOMALIES.LATE_ACK_UNRESOLVABLE]);\n',
      to: '    return pass(\'L8\', evidence);\n',
    }],
    files: ['test/p1-09-late-ack.test.mjs'],
    expect: /P1-09 unresolvable-ack personality/,
  },
  {
    id: 'M11',
    what: 'record a single process for both race writers (single-process race)',
    edits: [{
      file: 'src/runner.mjs',
      from: '          pids: [childA.pid, childB.pid],\n',
      to: '          pids: [process.pid, process.pid],\n',
    }],
    files: ['test/p1-11-race.test.mjs'],
    expect: /P1-11 five race rounds run in two separate OS processes/,
  },
  {
    id: 'M12',
    what: 'verdict GO despite one lost race round (confirmed >= 4)',
    edits: [{
      file: 'src/verdict.mjs',
      from: '  if (l6Evidence.confirmed !== 5 || l6Evidence.unresolvedRounds !== 0) return false;\n',
      to: '  if (l6Evidence.confirmed < 4 || l6Evidence.unresolvedRounds !== 0) return false;\n',
    }],
    files: ['test/p1-11-race.test.mjs'],
    expect: /P1-11 the L6 evidence records two distinct writer PIDs/,
  },
  {
    id: 'M13',
    what: 'clean up a file whose identity is uncertain (delete anyway)',
    edits: [{
      file: 'src/runner.mjs',
      from: '      if (!file.certain) {\n',
      to: '      if (false) {\n',
    }],
    files: ['test/p1-10-stop.test.mjs'],
    expect: /P1-10 STOP after an unresolvable late ACK quarantines the uncertain file/,
  },
  {
    id: 'M14',
    what: 'map an early STOP to PARTIAL instead of INCONCLUSIVE',
    edits: [{
      file: 'src/verdict.mjs',
      from: '      verdict: \'INCONCLUSIVE\',\n      rule: VERDICT_RULES.INCONCLUSIVE,\n',
      to: '      verdict: \'PARTIAL\',\n      rule: VERDICT_RULES.INCONCLUSIVE,\n',
    }],
    files: ['test/p1-14-inconclusive.test.mjs'],
    expect: /P1-14 throttle personality/,
  },
  {
    id: 'M15',
    what: 'map INCONCLUSIVE to GO despite L6 not completing all rounds',
    edits: [{
      file: 'src/verdict.mjs',
      from: '      verdict: \'INCONCLUSIVE\',\n      rule: VERDICT_RULES.INCONCLUSIVE,\n',
      to: '      verdict: \'GO\',\n      rule: VERDICT_RULES.INCONCLUSIVE,\n',
    }],
    files: ['test/p1-14-inconclusive.test.mjs'],
    expect: /P1-14 throttle personality/,
  },
  {
    id: 'M16',
    what: 'place a later STOP reason before the root cause (reverse reason order)',
    edits: [{
      file: 'src/verdict.mjs',
      from: '  const reasons = buildReasons(byStep, stop);\n',
      to: '  const reasons = buildReasons(byStep, stop).reverse();\n',
    }],
    files: ['test/p1-14-inconclusive.test.mjs'],
    expect: /P1-14 stale-read personality/,
  },
  {
    id: 'M17',
    what: 'accept a missing CLI approval',
    edits: [{
      file: 'src/runner.mjs',
      from: '  if (accessApprovalId === null || accessApprovalId === undefined) {\n',
      to: '  if (false && (accessApprovalId === null || accessApprovalId === undefined)) {\n',
    }, {
      file: 'src/runner.mjs',
      from: '  if (typeof accessApprovalId !== \'string\' || !LIVE_APPROVAL_RE.test(accessApprovalId)) {\n',
      to: '  if (false && (typeof accessApprovalId !== \'string\' || !LIVE_APPROVAL_RE.test(accessApprovalId))) {\n',
    }],
    files: ['test/p1-15-live-gating.test.mjs'],
    expect: /P1-15 mutation target: a missing approval/,
  },
  {
    id: 'M18',
    what: 'accept a mismatched or malformed CLI approval',
    edits: [{
      file: 'src/runner.mjs',
      from: '  if (typeof accessApprovalId !== \'string\' || !LIVE_APPROVAL_RE.test(accessApprovalId)) {\n',
      to: '  if (typeof accessApprovalId !== \'string\' || false) {\n',
    }],
    files: ['test/p1-15-live-gating.test.mjs'],
    expect: /P1-15 mutation target: a malformed approval/,
  },
  {
    id: 'M19',
    what: 'accept a different live host',
    edits: [{
      file: 'src/plan.mjs',
      from: '  if (value.host !== LIVE_HOST) fail(\'LIVE_HOST_MISMATCH\', String(value.host));\n',
      to: '  if (false) fail(\'LIVE_HOST_MISMATCH\', String(value.host));\n',
    }, {
      file: 'src/runner.mjs',
      from: '  if (plan.host !== LIVE_HOST) return { ok: false, reason: \'LIVE_HOST_MISMATCH\' };\n',
      to: '  if (false) return { ok: false, reason: \'LIVE_HOST_MISMATCH\' };\n',
    }],
    files: ['test/p1-15-live-gating.test.mjs'],
    expect: /P1-15 mutation target: a different live host/,
  },
  {
    id: 'M20',
    what: 'accept a live prefix outside the allowed parent',
    edits: [{
      file: 'src/plan.mjs',
      from: '  if (value.pathPrefix !== LIVE_PATH_PREFIX_TEMPLATE) fail(\'LIVE_PATH_PREFIX_MISMATCH\', String(value.pathPrefix));\n',
      to: '  if (false) fail(\'LIVE_PATH_PREFIX_MISMATCH\', String(value.pathPrefix));\n',
    }, {
      file: 'src/plan.mjs',
      from: '  validateFiles(value.files, filePlan);\n',
      to: '  // validateFiles intentionally skipped by M20\n',
    }, {
      file: 'src/runner.mjs',
      from: '  if (plan.pathPrefix !== LIVE_PATH_PREFIX_TEMPLATE) return { ok: false, reason: \'LIVE_PATH_PREFIX_MISMATCH\' };\n',
      to: '  if (false) return { ok: false, reason: \'LIVE_PATH_PREFIX_MISMATCH\' };\n',
    }],
    files: ['test/p1-15-live-gating.test.mjs'],
    expect: /P1-15 mutation target: a prefix outside/,
  },
  {
    id: 'M21',
    what: 'skip the exact Node runtime check',
    edits: [{
      file: 'src/runner.mjs',
      from: '  if (runtime === null || typeof runtime !== \'object\'\n    || runtime.version !== \'v22.23.5\' || runtime.arch !== \'x64\') {\n',
      to: '  if (false) {\n',
    }],
    files: ['test/p1-15-live-gating.test.mjs'],
    expect: /P1-15 mutation target: a stubbed Node mismatch/,
  },
  {
    id: 'M22',
    what: 'read the credential before authorization checks complete',
    edits: [{
      file: 'src/runner.mjs',
      from: '}) {\n  if (live !== true) return { ok: false, reason: \'LIVE_FLAG_REQUIRED\' };\n',
      to: '}) {\n  const early = env === null || typeof env !== \'object\' ? undefined : env[plan.credentialEnvVar];\n  if (live !== true) return { ok: false, reason: \'LIVE_FLAG_REQUIRED\' };\n',
    }],
    files: ['test/p1-15-live-gating.test.mjs'],
    expect: /P1-15 mutation target: the secret is not read/,
  },
]);

function copyTree(root) {
  const dep = path.join(root, 'packages', 'wp-01-synthetic-auth-api', 'support');
  fs.mkdirSync(dep, { recursive: true });
  fs.copyFileSync(
    path.join(REPO, 'packages', 'wp-01-synthetic-auth-api', 'support', 'platform-precondition.mjs'),
    path.join(dep, 'platform-precondition.mjs'),
  );
  fs.cpSync(PKG, path.join(root, 'packages', 'p0store-nutstore-probe'), { recursive: true });
}

function applyEdits(root, edits) {
  for (const edit of edits) {
    const target = path.join(root, 'packages', 'p0store-nutstore-probe', edit.file);
    const source = fs.readFileSync(target, 'utf8');
    const occurrences = source.split(edit.from).length - 1;
    if (occurrences !== 1) return `PATTERN_NOT_UNIQUE(${edit.file}:${occurrences})`;
    fs.writeFileSync(target, source.replace(edit.from, edit.to));
  }
  return null;
}

function runSuite(pkg, files) {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], {
    cwd: pkg, encoding: 'utf8', timeout: 300000, env,
  });
  const failed = (r.stdout || '').split('\n')
    .filter((line) => /^not ok \d+ - /.test(line))
    .map((line) => line.replace(/^not ok \d+ - /, ''));
  return {
    status: r.status,
    failed,
    timedOut: Boolean(r.error && r.error.code === 'ETIMEDOUT'),
    error: r.error,
  };
}

function main() {
  const results = [];
  const baseRoot = fs.mkdtempSync(path.join(SCRATCH, 'p0store-mut-base-'));
  copyTree(baseRoot);
  const baseline = runSuite(path.join(baseRoot, 'packages', 'p0store-nutstore-probe'), BASELINE_FILES);
  fs.rmSync(baseRoot, { recursive: true, force: true });
  console.log(`BASELINE exit=${baseline.status} failing=${baseline.failed.length}`);
  if (baseline.timedOut) {
    console.log('BASELINE_TIMEOUT');
    process.exit(2);
  }
  if (baseline.status !== 0) {
    console.log('BASELINE_NOT_GREEN');
    for (const failure of baseline.failed) console.log(`  baseline failing: ${failure}`);
    process.exit(2);
  }

  for (const mutant of MUTANTS) {
    const root = fs.mkdtempSync(path.join(SCRATCH, `p0store-mut-${mutant.id}-`));
    copyTree(root);
    const pkg = path.join(root, 'packages', 'p0store-nutstore-probe');
    const patchError = applyEdits(root, mutant.edits);
    let verdict;
    let detail = '';
    if (patchError) {
      verdict = 'PATTERN_NOT_UNIQUE';
      detail = patchError;
    } else {
      const r = runSuite(pkg, mutant.files);
      const named = r.failed.find((failure) => mutant.expect.test(failure));
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

  const killed = results.filter((result) => result.verdict === 'KILLED').length;
  console.log(`MUTATION_SUMMARY killed=${killed}/${results.length}`);
  process.exit(killed === results.length ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
