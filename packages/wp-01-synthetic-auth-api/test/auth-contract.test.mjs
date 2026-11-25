// Q01 (AUTH-01, AUTH-02) and Q10 (provenance) — WP-01 synthetic only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import {
  loadFixture, fixtureCase, startServer, browserHeaders, requestTally, FIXTURE_URL, FIXTURE_SHA256,
} from '../support/harness.mjs';

const PKG = new URL('../', import.meta.url);

test('Q10 fixture is the frozen canonical file (SHA-256, size, schema, seed, clock)', () => {
  const raw = fs.readFileSync(FIXTURE_URL);
  assert.equal(createHash('sha256').update(raw).digest('hex'), FIXTURE_SHA256);
  assert.equal(raw.length, 4573);
  const { fixture } = loadFixture();
  assert.equal(fixture.fixtureSchemaVersion, 'WP01-SYNTHETIC-v1.0.0');
  assert.equal(fixture.seed, 21001);
  assert.equal(fixture.clock.isoUtc, '2030-01-02T03:04:05.000Z');
  assert.equal(fixture.adversarialCases.length, 13);
  assert.equal(fixture.privacy.realCredentialsPresent, false);
});

// A60: the runtime platform allowlist is cross-platform; Node version and architecture are unchanged.
test('Q10 runtime is Node v22.23.5 on a supported 64-bit platform', () => {
  assert.equal(process.version, 'v22.23.5');
  assert.ok(process.platform === 'linux' || process.platform === 'win32', `unsupported platform ${process.platform}`);
  assert.equal(process.arch, 'x64');
});

function walk(dirUrl, out = []) {
  for (const e of fs.readdirSync(dirUrl, { withFileTypes: true })) {
    const u = new URL(e.name + (e.isDirectory() ? '/' : ''), dirUrl);
    if (e.isDirectory()) walk(u, out); else out.push(u);
  }
  return out;
}

test('Q10 package has no dependencies, no install scripts and imports only node: builtins or relative files', () => {
  const pkg = JSON.parse(fs.readFileSync(new URL('package.json', PKG), 'utf8'));
  assert.deepEqual(pkg.dependencies, {});
  assert.deepEqual(pkg.devDependencies, {});
  for (const k of ['preinstall', 'install', 'postinstall', 'prepare', 'prepublish', 'prepack']) {
    assert.equal(pkg.scripts?.[k], undefined, `lifecycle script ${k}`);
  }
  assert.equal(fs.existsSync(new URL('node_modules', PKG)), false);
  assert.equal(fs.existsSync(new URL('package-lock.json', PKG)), false);
  const files = walk(PKG).filter((u) => u.pathname.endsWith('.mjs'));
  assert.ok(files.length >= 10);
  const importRe = /(?:^|\n)\s*import\s[^;]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(importRe)) {
      const spec = m[1] || m[2];
      assert.ok(spec.startsWith('node:') || spec.startsWith('./') || spec.startsWith('../'), `${f.pathname}: ${spec}`);
    }
    assert.doesNotMatch(src, new RegExp('\\brequ' + 'ire\\('), `${f.pathname} uses CommonJS loading`);
  }
});

test('Q10 server source has no forbidden hosts, wildcard bind or listen-on-import', () => {
  for (const name of ['server.mjs', 'store.mjs', 'policy.mjs']) {
    const src = fs.readFileSync(new URL('src/' + name, PKG), 'utf8');
    assert.doesNotMatch(src, /nutstore|jianguoyun|api\.zotero\.org|onrender|cloudflare/i, name);
    assert.doesNotMatch(src, /0\.0\.0\.0/, name);
    assert.doesNotMatch(src, /process\.env\b/, `${name} reads process environment`);
    assert.doesNotMatch(src, /^(?:await\s+)?[a-zA-Z_.]*listen\(/m, `${name} listens at module top level`);
  }
});

test('health endpoint declares LOCAL_SYNTHETIC_ONLY / FAKE_ONLY / not production-suitable', async (t) => {
  const { client } = await startServer(t);
  const r = await client.request('GET', '/api/v1/health');
  assert.equal(r.status, 200);
  assert.equal(r.body.mode, 'LOCAL_SYNTHETIC_ONLY');
  assert.equal(r.body.provider, 'FAKE_ONLY');
  assert.equal(r.body.productionSuitable, false);
  assert.equal(r.headers['cache-control'], 'no-store');
});

test('Q01 authorized flow: fake Owner reads own scoped Project with ETag', async (t) => {
  const { srv, client } = await startServer(t);
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  const r = await client.request('GET', '/api/v1/projects/project_synth_alpha', { headers: browserHeaders({ cookie: a.cookieValue }) });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.project, { id: 'project_synth_alpha', archived: false, revision: 'rev-fake-alpha-01' });
  assert.equal(r.headers.etag, '"rev-fake-alpha-01"');
});

test('Q01 AUTH-01 guest (no Session) is denied with 401 and no data', async (t) => {
  const { fixture, client, srv } = await startServer(t);
  const c = fixtureCase(fixture, 'AUTH-01');
  assert.equal(c.expect, 'DENY');
  assert.throws(() => srv.control.issueFreshSession(c.principal), /no first-visitor bootstrap/);
  const r = await client.request(c.action, `/api/v1/projects/${c.resource}`, { headers: browserHeaders({}) });
  assert.equal(r.status, 401);
  assert.equal(r.body.error.code, 'AUTH_REQUIRED');
  assert.equal(r.body.project, undefined);
});

test('Q01 AUTH-02 foreign principal denied WITHOUT existence leak (existing == nonexistent == foreign-owned)', async (t) => {
  const { fixture, client, srv } = await startServer(t);
  const c = fixtureCase(fixture, 'AUTH-02');
  assert.equal(c.expect, 'DENY_WITHOUT_EXISTENCE_LEAK');
  const b = srv.control.issueFreshSession(c.principal);
  const probe = (id) => client.request(c.action, `/api/v1/projects/${id}`, { headers: browserHeaders({ cookie: b.cookieValue }) });
  const existing = await probe(c.resource);
  const missing = await probe('project_does_not_exist');
  const own = await probe('project_synth_foreign'); // role FOREIGN_DENIED: denied everywhere
  for (const r of [existing, missing, own]) {
    assert.equal(r.status, 403);
    assert.deepEqual(r.body, { apiVersion: 'v1', error: { code: 'NOT_AVAILABLE' }, outcome: 'DEFINITE_FAILURE', dispatched: false });
    assert.equal(r.headers.etag, undefined);
  }
  assert.equal(existing.headers['content-length'], missing.headers['content-length']);
});

test('Q01 Owner cannot read a foreign-owned Project; response identical to a missing one', async (t) => {
  const { srv, client } = await startServer(t);
  const a = srv.control.tokenFor('synthetic_session_owner_a');
  const f = await client.request('GET', '/api/v1/projects/project_synth_foreign', { headers: browserHeaders({ cookie: a.cookieValue }) });
  const m = await client.request('GET', '/api/v1/projects/project_nope', { headers: browserHeaders({ cookie: a.cookieValue }) });
  assert.equal(f.status, 403);
  assert.deepEqual(f.body, m.body);
});

test('zz request tally for this file stays within the WP-01 5000-request cap', (t) => {
  const n = requestTally();
  t.diagnostic(`WP01_LOCAL_REQUESTS file=auth-contract n=${n}`);
  assert.ok(n <= 5000);
});
