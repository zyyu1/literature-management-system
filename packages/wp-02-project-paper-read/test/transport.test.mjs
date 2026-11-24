// Q2-10 transport: loopback only; traversal and encoded separators in {libraryId}/{itemKey} rejected;
// WP-01 limits; plus provenance (fixture SHAs, Node exact, zero deps) and the zero-traffic egress precondition.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import net from 'node:net';
import { createProjectPaperReadServer } from '../src/server.mjs';
import { startServer, loadFixtures, requestTally, PAPER_PATH, XFAKE001 } from '../support/harness.mjs';

const PKG = new URL('../', import.meta.url);

test('egress precondition (zero traffic): only `lo` exists and no proxy variables are set', () => {
  assert.deepEqual(Object.keys(os.networkInterfaces()), ['lo'], 'run inside run-offline.sh (D007-A54); STOP otherwise');
  const env = process['env'];
  for (const k of ['HTTPS_PROXY', 'HTTP_PROXY', 'https_proxy', 'http_proxy', 'ALL_PROXY', 'all_proxy']) assert.equal(env[k], undefined, k);
});

test('Q2-10 non-loopback / wildcard / fixed-port bind and raised request budget are refused', () => {
  const { wp01, wp02 } = loadFixtures();
  const mk = (o) => () => createProjectPaperReadServer({ wp01Fixture: wp01, wp02Fixture: wp02, ...o });
  for (const host of ['0.0.0.0', '::', '::1', 'localhost', '192.0.2.1']) assert.throws(mk({ host }), /UNSAFE_CONFIG/, host);
  for (const port of [80, 8080]) assert.throws(mk({ port }), /UNSAFE_CONFIG/);
  for (const requestBudget of [5001, 0]) assert.throws(mk({ requestBudget }), /UNSAFE_CONFIG/);
  const bad = structuredClone(wp02);
  bad.dependsOn.wp01Sha256 = '0'.repeat(64);
  assert.throws(() => createProjectPaperReadServer({ wp01Fixture: wp01, wp02Fixture: bad }), /UNSAFE_CONFIG/);
});

test('Q2-10 server listens on 127.0.0.1 only and is inert until listen()', async (t) => {
  const { srv, addr } = await startServer(t);
  assert.equal(addr.host, '127.0.0.1');
  assert.equal(srv.address().address, '127.0.0.1');
  const { wp01, wp02 } = loadFixtures();
  assert.equal(createProjectPaperReadServer({ wp01Fixture: wp01, wp02Fixture: wp02 }).address(), null);
});

test('Q2-10 traversal, encoded separators and malformed IDs in {libraryType}/{libraryId}/{itemKey} are rejected', async (t) => {
  const { get, owner } = await startServer(t);
  const bad = [
    '/api/v1/papers/user/fakeLib01/..', '/api/v1/papers/user/..%2FfakeLib01/XFAKE001', '/api/v1/papers/user/fakeLib01%2F..%2FfakeLibForeign/XFOREIGN1',
    '/api/v1/papers/user/fakeLib01/XFAKE001%2F..', '/api/v1/papers/user/fakeLib01/XFAKE%5C001', '/api/v1/papers/user/fakeLib01/XFAKE%00001',
    '/api/v1/papers/user/fake.Lib01/XFAKE001', '/api/v1/papers/user/fakeLib01/XFAKE-001', '/api/v1/papers/USER/fakeLib01/XFAKE001',
    '/api/v1/papers/feed/fakeLib01/XFAKE001', '/api/v1/papers/user/__proto__/XFAKE001', '/api/v1/papers/user/fakeLib01/constructor',
    '/api/v1/papers/user/%2e%2e/XFAKE001', '/api/v1/papers/user/fakeLib01', '/api/v1/papers/user/fakeLib01/XFAKE001/extra',
    `/api/v1/papers/user/${'a'.repeat(65)}/XFAKE001`, `/api/v1/papers/user/fakeLib01/${'K'.repeat(33)}`,
    '/api/v1/projects/__proto__/papers', '/api/v1/projects/..%2Fproject_synth_foreign/papers', '/api/v1/projects/Project_Synth_Alpha/papers',
    `${PAPER_PATH(XFAKE001)}?x=1`, '/api/v1/projects/project_synth_alpha/papers?state=all',
  ];
  for (const p of bad) {
    const r = await get(p, owner.cookieValue);
    assert.ok([400, 404].includes(r.status), `${p} -> ${r.status}`);
    assert.equal(r.body?.paper, undefined);
    assert.equal(r.body?.papers, undefined);
  }
});

test('Q2-10 absolute-form, protocol-relative and asterisk request targets are rejected (no proxying)', async (t) => {
  const { client } = await startServer(t);
  for (const target of ['http://api.zotero.invalid/api/v1/projects', '//evil.wp01.invalid/api/v1/projects', '*']) {
  const resp = await new Promise((resolve, reject) => {
    const s = net.connect({ host: '127.0.0.1', port: client.port });
    let b = '';
    s.on('data', (d) => { b += d; });
    s.on('close', () => resolve(b));
    s.on('error', reject);
    s.write(`GET ${target} HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n`);
  });
  assert.match(resp, /^HTTP\/1\.1 400 /, target);
  }
});

test('Q2-10 WP-01 limits apply: oversized declared body 413, request budget 429', async (t) => {
  const { client, owner } = await startServer(t);
  const r = await client.request('GET', '/api/v1/projects', {
    headers: { Cookie: `__Host-lms_session=${owner.cookieValue}` }, rawBody: Buffer.alloc(65537, 0x20),
  });
  assert.equal(r.status, 413);
  const small = await startServer(t, { server: { requestBudget: 3 } });
  const codes = [];
  for (let i = 0; i < 5; i += 1) codes.push((await small.get('/api/v1/health')).status);
  assert.deepEqual(codes, [200, 200, 200, 429, 429]);
});

test('Q2-10 response over 256 KiB becomes a bounded RESPONSE_LIMIT error (in-memory fixture copy)', async (t) => {
  const { wp02 } = loadFixtures();
  const copy = structuredClone(wp02);
  copy.papers[0].title = 'T'.repeat(262144);
  const { get, owner } = await startServer(t, { wp02: copy });
  const r = await get(PAPER_PATH(XFAKE001), owner.cookieValue);
  assert.equal(r.status, 500);
  assert.equal(r.body.error.code, 'RESPONSE_LIMIT');
});

test('Q2-10 sanitized logs: only t/method/route/status/code; no cookie, ID or note text', async (t) => {
  const { srv, get, owner } = await startServer(t);
  await get(PAPER_PATH(XFAKE001), owner.cookieValue);
  await get('/api/v1/projects/project_synth_foreign/papers', owner.cookieValue);
  const dump = JSON.stringify(srv.logs);
  for (const n of [owner.cookieValue, 'XFAKE001', 'fakeLib01', 'project_synth', '合成']) assert.ok(!dump.includes(n), n);
  for (const e of srv.logs) assert.deepEqual(Object.keys(e).sort(), ['code', 'method', 'route', 'status', 't']);
});

test('provenance: fixtures frozen (SHA-256), Node v22.23.5 linux/x64, zero deps, imports node: or relative only', () => {
  const { wp02 } = loadFixtures(); // throws on SHA/size mismatch
  assert.equal(wp02.fixtureSchemaVersion, 'WP02-SYNTHETIC-v1.0.0');
  assert.equal(wp02.seed, 22002);
  assert.equal(process.version, 'v22.23.5');
  assert.equal(process.platform, 'linux');
  assert.equal(process.arch, 'x64');
  const pkg = JSON.parse(fs.readFileSync(new URL('package.json', PKG), 'utf8'));
  assert.deepEqual(pkg.dependencies, {});
  assert.deepEqual(pkg.devDependencies, {});
  assert.equal(pkg.scripts, undefined, 'no scripts (A56)');
  assert.equal(fs.existsSync(new URL('node_modules', PKG)), false);
  assert.equal(fs.existsSync(new URL('package-lock.json', PKG)), false);
  const files = [];
  const walk = (u) => { for (const e of fs.readdirSync(u, { withFileTypes: true })) { const c = new URL(e.name + (e.isDirectory() ? '/' : ''), u); if (e.isDirectory()) walk(c); else if (c.pathname.endsWith('.mjs')) files.push(c); } };
  walk(PKG);
  const importRe = /(?:^|\n)\s*import\s[^;]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(importRe)) {
      const spec = m[1] || m[2];
      assert.ok(spec.startsWith('node:') || spec.startsWith('./') || spec.startsWith('../'), `${f.pathname}: ${spec}`);
    }
  }
  for (const name of ['server.mjs', 'catalog.mjs']) {
    const src = fs.readFileSync(new URL('src/' + name, PKG), 'utf8');
    assert.doesNotMatch(src, /process\.env\b|0\.0\.0\.0|nutstore|jianguoyun|zotero\.org/i, name);
    assert.doesNotMatch(src, /^(?:await\s+)?[a-zA-Z_.]*listen\(/m, `${name} listens at top level`);
  }
});

test('zz request tally for this file stays within the 5000-request cap', (t) => {
  const n = requestTally();
  t.diagnostic(`WP02_LOCAL_REQUESTS file=transport n=${n}`);
  assert.ok(n <= 5000);
});
