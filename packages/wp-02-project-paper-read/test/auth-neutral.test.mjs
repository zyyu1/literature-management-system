// Q2-06: FOREIGN, ANONYMOUS, foreign paper/Project and non-existent IDs -> byte-identical neutral 403 + identical headers.
// Q2-07 (GET half): WORKSPACE_READONLY may call every GET. WP-01 Session rules apply unchanged (revoked/expired -> 401).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { startServer, requestTally, PAPER_PATH, XFAKE001, XFOREIGN1, APP_ORIGIN } from '../support/harness.mjs';

const NEUTRAL = { apiVersion: 'v1', error: { code: 'NOT_AVAILABLE' }, outcome: 'DEFINITE_FAILURE', dispatched: false };
const NOISE = new Set(['date', 'connection', 'keep-alive']); // documented per-request noise

function raw(port, path, cookie, origin = APP_ORIGIN) {
  return new Promise((resolve, reject) => {
    const headers = { Origin: origin };
    if (cookie) headers.Cookie = `__Host-lms_session=${cookie}`;
    const req = http.request({ host: '127.0.0.1', port, path, method: 'GET', headers, agent: false }, (res) => {
      const c = [];
      res.on('data', (x) => c.push(x));
      res.on('end', () => {
        const h = [];
        for (let i = 0; i < res.rawHeaders.length; i += 2) {
          if (!NOISE.has(res.rawHeaders[i].toLowerCase())) h.push(`${res.rawHeaders[i]}: ${res.rawHeaders[i + 1]}`);
        }
        resolve({ status: res.statusCode, body: Buffer.concat(c), headers: h.join('\n') });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

test('Q2-06 every denial class yields the byte-identical neutral 403 body and identical headers', async (t) => {
  const { srv, client } = await startServer(t);
  const owner = srv.sessions.tokenFor('synthetic_session_owner_a').cookieValue;
  const foreign = srv.sessions.issueFreshSession('user_demo_b').cookieValue;
  const port = client.port;
  const cases = [
    // [label, path, cookie]
    ['ANONYMOUS list', '/api/v1/projects', undefined],
    ['ANONYMOUS papers', '/api/v1/projects/project_synth_alpha/papers', undefined],
    ['ANONYMOUS detail', PAPER_PATH(XFAKE001), undefined],
    ['FOREIGN list', '/api/v1/projects?state=all', foreign],
    ['FOREIGN own-scope project', '/api/v1/projects/project_synth_foreign/papers', foreign],
    ['FOREIGN own-scope paper', PAPER_PATH(XFOREIGN1), foreign],
    ['FOREIGN on owner project', '/api/v1/projects/project_synth_alpha/papers', foreign],
    ['FOREIGN on owner paper', PAPER_PATH(XFAKE001), foreign],
    ['owner -> foreign project', '/api/v1/projects/project_synth_foreign/papers', owner],
    ['owner -> foreign paper', PAPER_PATH(XFOREIGN1), owner],
    ['owner -> missing project', '/api/v1/projects/project_synth_missing/papers', owner],
    ['owner -> missing paper', '/api/v1/papers/user/fakeLib01/XNOPE999', owner],
    ['owner -> missing library', '/api/v1/papers/group/fakeLib99/XFAKE001', owner],
  ];
  const results = [];
  for (const [label, path, cookie] of cases) results.push([label, await raw(port, path, cookie)]);
  const [, ref] = results[0];
  assert.equal(ref.status, 403);
  assert.deepEqual(JSON.parse(ref.body.toString('utf8')), NEUTRAL);
  for (const [label, r] of results) {
    assert.equal(r.status, 403, label);
    assert.ok(r.body.equals(ref.body), `${label}: body bytes differ`);
    assert.equal(r.headers, ref.headers, `${label}: headers differ`);
  }
});

test('Q2-06 foreign Project/paper never appear for the owner and existence is not distinguishable', async (t) => {
  const { get, owner } = await startServer(t);
  const f = await get('/api/v1/projects/project_synth_foreign/papers', owner.cookieValue);
  const m = await get('/api/v1/projects/project_zzz/papers', owner.cookieValue);
  assert.deepEqual(f.body, m.body);
  assert.equal(f.headers['content-length'], m.headers['content-length']);
});

test('Q2-06 WP-01 Session rules unchanged: revoked and expired Sessions get 401, duplicate cookie 401', async (t) => {
  const { srv, get, client } = await startServer(t);
  const revoked = srv.sessions.tokenFor('synthetic_session_owner_b').cookieValue;
  const expired = srv.sessions.tokenFor('synthetic_session_expired').cookieValue;
  const r1 = await get('/api/v1/projects', revoked);
  const r2 = await get('/api/v1/projects', expired);
  assert.equal(r1.status, 401);
  assert.equal(r1.body.error.code, 'SESSION_REVOKED');
  assert.equal(r2.status, 401);
  assert.equal(r2.body.error.code, 'SESSION_EXPIRED');
  const owner = srv.sessions.tokenFor('synthetic_session_owner_a').cookieValue;
  const dup = await client.request('GET', '/api/v1/projects', { headers: { Cookie: `__Host-lms_session=${owner}; __Host-lms_session=x` } });
  assert.equal(dup.status, 401);
  srv.sessions.advanceClock(3600000);
  assert.equal((await get('/api/v1/projects', owner)).status, 401, 'fake clock expiry applies to WP-02 routes too');
});

test('Q2-07 WORKSPACE_READONLY: every WP-02 GET succeeds with the same data as the Owner', async (t) => {
  const { get, owner, workspace } = await startServer(t);
  const paths = [
    '/api/v1/projects', '/api/v1/projects?state=archived', '/api/v1/projects?state=all',
    '/api/v1/projects/project_synth_alpha/papers', '/api/v1/projects/project_synth_beta/papers',
    '/api/v1/projects/project_synth_gamma/papers', PAPER_PATH(XFAKE001),
  ];
  for (const p of paths) {
    const w = await get(p, workspace.cookieValue);
    const o = await get(p, owner.cookieValue);
    assert.equal(w.status, 200, p);
    assert.deepEqual(w.body, o.body, p);
  }
  assert.equal((await get(PAPER_PATH(XFOREIGN1), workspace.cookieValue)).status, 403);
});

test('Q2-06 credentialed CORS only for the exact allowed Origin; Vary: Origin always', async (t) => {
  const { client, owner } = await startServer(t);
  const ok = await raw(client.port, '/api/v1/projects', owner.cookieValue);
  const evil = await raw(client.port, '/api/v1/projects', owner.cookieValue, 'https://evil.wp01.invalid');
  assert.match(ok.headers, /Access-Control-Allow-Origin: https:\/\/app\.wp01\.invalid/);
  assert.match(ok.headers, /Access-Control-Allow-Credentials: true/);
  assert.doesNotMatch(evil.headers, /Access-Control-Allow-Origin/);
  assert.match(evil.headers, /Vary: Origin/);
});

test('zz request tally for this file stays within the 5000-request cap', (t) => {
  const n = requestTally();
  t.diagnostic(`WP02_LOCAL_REQUESTS file=auth-neutral n=${n}`);
  assert.ok(n <= 5000);
});
