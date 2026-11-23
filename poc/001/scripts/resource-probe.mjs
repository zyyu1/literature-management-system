// REMEDIATION-05 (D007-A25) R05-1 — isolated resource-exhaustion probe. LOCAL / SYNTHETIC ONLY.
// Each hostile fixture runs in its OWN child process with --max-old-space-size=256, an OS-level
// SIGKILL timeout enforced by this parent (independent of the JS parser), and peak RSS sampled
// from /proc/<pid>/status (VmHWM) plus the child's own getrusage maxRSS.
//
//   node scripts/resource-probe.mjs            → current parser + full API export, exit 1 on any failure
//   node scripts/resource-probe.mjs --baseline <file>
//                                             → additionally runs the given (pre-R05) dav-xml.mjs as
//                                               INFO only; its result never affects the exit code
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import os from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const CHILD = join(here, 'resource-probe-child.mjs');
const HEAP_MB = 256;
const KILL_AFTER_MS = 20_000;
const TARGET_MS = 2_000;

/** Historical hostile shapes from QA 7092575362 (re-generated deterministically, never stored). */
export const FIXTURES = {
  'H1-442KB-1000xmlns-60000deep': { kind: 'deep', nsDecls: 1000, depth: 60_000 },
  'H2-396KB-2000xmlns-50000deep': { kind: 'deep', nsDecls: 2000, depth: 50_000 },
  // Additional synthetic shapes (not historical): worst case INSIDE all limits, and an element flood.
  'H3-at-limits-256xmlns-9996wide': { kind: 'wide-at-limits', nsDecls: 256, depth: 4 },
  'H4-2MB-element-flood': { kind: 'flood', nsDecls: 0, depth: 1 },
};

function runChild(args) {
  return new Promise((resolve) => {
    const t0 = process.hrtime.bigint();
    const child = spawn(process.execPath, [`--max-old-space-size=${HEAP_MB}`, CHILD, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = ''; let err = ''; let vmHwmKb = 0; let killed = false;
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    const poll = setInterval(() => {
      try {
        const m = /VmHWM:\s+(\d+) kB/.exec(readFileSync(`/proc/${child.pid}/status`, 'utf8'));
        if (m) vmHwmKb = Math.max(vmHwmKb, Number(m[1]));
      } catch { /* process gone */ }
    }, 5);
    const killer = setTimeout(() => { killed = true; child.kill('SIGKILL'); }, KILL_AFTER_MS);
    child.on('exit', (code, signal) => {
      clearInterval(poll); clearTimeout(killer);
      const wallMs = Number(process.hrtime.bigint() - t0) / 1e6;
      let report = null;
      try { report = JSON.parse(out.trim().split('\n').at(-1)); } catch { /* crashed */ }
      resolve({
        exitCode: code, signal, killedByTimeout: killed, wallMs: Math.round(wallMs),
        peakRssMbProc: +(vmHwmKb / 1024).toFixed(1),
        peakRssMbSelf: report?.maxRssKb ? +(report.maxRssKb / 1024).toFixed(1) : null,
        heapLimitHit: /Reached heap limit|heap out of memory/i.test(err),
        report,
        stderrTail: err.trim().split('\n').slice(-2).join(' | ').slice(0, 300),
      });
    });
  });
}

const args = process.argv.slice(2);
const baselineIdx = args.indexOf('--baseline');
const baseline = baselineIdx >= 0 ? args[baselineIdx + 1] : null;

const env = {
  node: process.version, platform: `${os.type()} ${os.release()} ${os.arch()}`, cpus: os.cpus().length,
  cpuModel: os.cpus()[0]?.model ?? 'n/a', heapLimitMb: HEAP_MB, osKillAfterMs: KILL_AFTER_MS, targetMs: TARGET_MS,
};
console.log(`resource-probe env ${JSON.stringify(env)}`);

const rows = [];
let failures = 0;
for (const [name, spec] of Object.entries(FIXTURES)) {
  for (const mode of ['parser', 'api-export']) {
    const r = await runChild([mode, spec.kind, String(spec.nsDecls), String(spec.depth)]);
    const ok = r.exitCode === 0 && !r.killedByTimeout && !r.heapLimitHit
      && r.report?.rejected === true && r.report?.partialBundle === false && (r.report?.upstreamWrites ?? 0) === 0
      && r.wallMs < TARGET_MS;
    if (!ok) failures++;
    rows.push({ verdict: ok ? 'PASS' : 'FAIL', fixture: name, mode, ...r });
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${mode} exit=${r.exitCode}${r.signal ? `/${r.signal}` : ''} wall=${r.wallMs}ms rss=${r.peakRssMbProc}MB `
      + `bytes=${r.report?.bytes} depth=${r.report?.depth} elements=${r.report?.elementsInFixture} xmlns=${r.report?.nsDecls} `
      + `outcome=${r.report?.outcome} detail=${JSON.stringify(r.report?.detail ?? r.stderrTail)}`);
  }
}
if (baseline) {
  if (!existsSync(baseline)) { console.log(`BASELINE not found: ${baseline}`); }
  else {
    for (const [name, spec] of Object.entries(FIXTURES)) {
      const r = await runChild(['baseline-parser', spec.kind, String(spec.nsDecls), String(spec.depth), baseline]);
      rows.push({ verdict: 'INFO', fixture: name, mode: 'baseline-parser (pre-R05)', ...r });
      console.log(`INFO(BASELINE pre-R05) ${name} exit=${r.exitCode}${r.signal ? `/${r.signal}` : ''} wall=${r.wallMs}ms rss=${r.peakRssMbProc}MB heapLimitHit=${r.heapLimitHit} killed=${r.killedByTimeout} outcome=${r.report?.outcome ?? 'no report (crashed)'}`);
    }
  }
}
console.log(`RESOURCE PROBE: ${failures ? `${failures} FAIL` : 'all current-code cases PASS'} (target < ${TARGET_MS} ms wall incl. node start-up, heap ${HEAP_MB} MB)`);
console.log(`ROWS ${JSON.stringify(rows)}`);
process.exit(failures ? 1 : 0);

