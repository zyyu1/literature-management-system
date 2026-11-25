// WP-02 TEST SUPPORT ONLY. Fixture loaders with SHA-256 guards, server start with an automatic
// before/after state-digest equality check (R-RO / Q2-08), and the WP-01 loopback fake client
// re-used by READ-ONLY import. node:fs is used only to read the frozen fixtures.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createProjectPaperReadServer } from '../src/server.mjs';
import { createFakeClient, browserHeaders, APP_ORIGIN, EVIL_ORIGIN } from '../../wp-01-synthetic-auth-api/support/harness.mjs';

export { createFakeClient, browserHeaders, APP_ORIGIN, EVIL_ORIGIN };

export const WP02_FIXTURE_SHA256 = 'c4fc68afb0a1660c109c4af24620ff17279161d8e3b8e02cdf286d3e060bf888';
export const WP01_FIXTURE_SHA256 = '86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65';
export const WP02_FIXTURE_URL = new URL('../../../docs/handoffs/WP-02/fixtures/wp02.v1.json', import.meta.url);
export const WP01_FIXTURE_URL = new URL('../../../docs/handoffs/WP-01/fixtures/wp01.v1.json', import.meta.url);

function readGuarded(url, sha, size) {
  const raw = fs.readFileSync(url);
  const got = createHash('sha256').update(raw).digest('hex');
  if (got !== sha || raw.length !== size) throw new Error('FIXTURE_MISMATCH: STOP');
  return raw;
}

export function loadFixtures() {
  const raw02 = readGuarded(WP02_FIXTURE_URL, WP02_FIXTURE_SHA256, 4989);
  const raw01 = readGuarded(WP01_FIXTURE_URL, WP01_FIXTURE_SHA256, 4573);
  return { wp02: JSON.parse(raw02.toString('utf8')), wp01: JSON.parse(raw01.toString('utf8')), raw02 };
}

const servers = [];
export function requestTally() { return servers.reduce((n, s) => n + s.stats.requests, 0); }

// Starts a server; on teardown asserts the catalog state digest is unchanged (no route mutates state).
export async function startServer(t, opts = {}) {
  const { wp01, wp02 } = loadFixtures();
  const srv = createProjectPaperReadServer({ wp01Fixture: wp01, wp02Fixture: opts.wp02 || wp02, ...opts.server });
  servers.push(srv);
  const digestBefore = srv.catalog.stateDigest();
  const addr = await srv.listen();
  t.after(async () => {
    await srv.close();
    if (!opts.allowSeedChange) assert.equal(srv.catalog.stateDigest(), digestBefore, 'state digest changed (R-RO)');
  });
  const client = createFakeClient({ baseUrl: addr.baseUrl });
  const owner = srv.sessions.tokenFor('synthetic_session_owner_a');
  const workspace = srv.sessions.tokenFor('synthetic_session_workspace');
  const get = (path, cookie) => client.request('GET', path, { headers: browserHeaders(cookie === undefined ? {} : { cookie }) });
  return { srv, addr, client, wp01, wp02: opts.wp02 || wp02, owner, workspace, get, digestBefore };
}

export const PAPER_PATH = (t) => `/api/v1/papers/${t[0]}/${t[1]}/${t[2]}`;
export const XFAKE001 = ['user', 'fakeLib01', 'XFAKE001'];
export const GROUP_XFAKE001 = ['group', 'fakeLib02', 'XFAKE001'];
export const XFAKE002 = ['user', 'fakeLib01', 'XFAKE002'];
export const XFOREIGN1 = ['user', 'fakeLibForeign', 'XFOREIGN1'];
