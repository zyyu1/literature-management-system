// Child process for scripts/resource-probe.mjs. Generates one hostile fixture in memory and
// feeds it to (a) the parser, (b) the full loopback API export, or (c) a baseline parser file.
// Prints ONE JSON line. Synthetic only; loopback only.
import { pathToFileURL } from 'node:url';

const [mode, kind, nsArg, depthArg, baselinePath] = process.argv.slice(2);
const nsDecls = Number(nsArg);
const depth = Number(depthArg);

function hostile() {
  const parts = [];
  if (kind === 'deep') { // first `nsDecls` elements each declare one prefix; the rest nest without
    for (let i = 0; i < depth; i++) parts.push(i < nsDecls ? `<a xmlns:p${i}="u">` : '<a>');
    for (let i = 0; i < depth; i++) parts.push('</a>');
    return { xml: parts.join(''), elements: depth };
  }
  if (kind === 'wide-at-limits') { // 4 nested elements × 64 xmlns = 256 decls, then 9996 leaves: every limit at its maximum
    const decl = (o) => Array.from({ length: 64 }, (_, i) => `xmlns:p${o + i}="urn:${o + i}"`).join(' ');
    return { xml: `<a ${decl(0)}><a ${decl(64)}><a ${decl(128)}><a ${decl(192)}>${'<p255:e/>'.repeat(9996)}</a></a></a></a>`, elements: 10_000 };
  }
  if (kind === 'flood') { // just under the 2 MB byte ceiling of empty elements
    const n = Math.floor((2_000_000 - 7) / 4);
    return { xml: `<r>${'<a/>'.repeat(n)}</r>`, elements: n + 1 };
  }
  throw new Error(`unknown kind ${kind}`);
}

const { xml, elements } = hostile();
const base = { mode, kind, bytes: Buffer.byteLength(xml), depth, nsDecls, elementsInFixture: elements };
const t0 = performance.now();
let out;
try {
  if (mode === 'parser' || mode === 'baseline-parser') {
    const mod = mode === 'parser' ? await import('../src/dav-xml.mjs') : await import(pathToFileURL(baselinePath).href);
    try {
      mod.parseMultistatus(xml);
      out = { rejected: false, outcome: 'parsed', partialBundle: false, upstreamWrites: 0 };
    } catch (e) {
      out = { rejected: true, outcome: 'DAV_XML', detail: e.message.slice(0, 160), partialBundle: false, upstreamWrites: 0 };
    }
  } else if (mode === 'api-export') {
    const { startStack, syntheticNote } = await import('../test/helpers.mjs');
    let hostileOn = false;
    const s = await startStack({ mockOptions: { propfindOverride: (p) => (hostileOn && p.endsWith('/poc-ns-a') ? xml : null) } });
    const n = syntheticNote();
    await s.client.put('notes', n.literatureId, n, '*');
    const writesBefore = s.mock.requestLog.filter((e) => ['PUT', 'DELETE', 'MKCOL'].includes(e.method)).length;
    hostileOn = true;
    const ex = await s.client.exportAll();
    const writes = s.mock.requestLog.filter((e) => ['PUT', 'DELETE', 'MKCOL'].includes(e.method)).length - writesBefore;
    out = {
      rejected: ex.status === 503 && ex.data.outcome === 'export_incomplete',
      outcome: `${ex.status} ${ex.data.outcome}`, detail: ex.data.detail ?? ex.data.reason,
      partialBundle: ex.data.records !== undefined || ex.data.count !== undefined, upstreamWrites: writes,
    };
    await s.stop();
  } else throw new Error(`unknown mode ${mode}`);
} catch (e) {
  out = { rejected: false, outcome: 'child_error', detail: String(e?.message ?? e).slice(0, 200) };
}
const elapsedMs = Math.round(performance.now() - t0);
console.log(JSON.stringify({ ...base, ...out, parseElapsedMs: elapsedMs, maxRssKb: process.resourceUsage().maxRSS }));
