// WP-01 TEST SUPPORT ONLY (not server code): fixture loader with SHA-256 guard and a
// loopback-only fake client that models the A5 client side (local draft + operationId, UNKNOWN,
// never auto-replay). Uses node:fs only to read the frozen fixture. No network beyond 127.0.0.1.
import fs from 'node:fs';
import http from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { createSyntheticAuthServer } from '../src/server.mjs';

export const FIXTURE_SHA256 = '86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65';
export const FIXTURE_URL = new URL('../../../docs/handoffs/WP-01/fixtures/wp01.v1.json', import.meta.url);
export const APP_ORIGIN = 'https://app.wp01.invalid';
export const EVIL_ORIGIN = 'https://evil.wp01.invalid';

export function loadFixture() {
  const raw = fs.readFileSync(FIXTURE_URL);
  const sha = createHash('sha256').update(raw).digest('hex');
  if (sha !== FIXTURE_SHA256 || raw.length !== 4573) throw new Error('FIXTURE_MISMATCH: STOP');
  return { fixture: JSON.parse(raw.toString('utf8')), sha256: sha, bytes: raw.length };
}

export function fixtureCase(fixture, id) {
  const c = fixture.adversarialCases.find((x) => x.id === id);
  if (!c) throw new Error('missing fixture case ' + id);
  return c;
}

// Per-test-file tally of local requests served (WP-01 cap: 5000 per documented run).
const servers = [];
export function requestTally() { return servers.reduce((n, s) => n + s.stats.requests, 0); }

export async function startServer(t, opts = {}) {
  const { fixture } = loadFixture();
  const srv = createSyntheticAuthServer({ fixture: opts.fixture || fixture, ...opts.server });
  servers.push(srv);
  const addr = await srv.listen();
  t.after(() => srv.close());
  const client = createFakeClient({ baseUrl: addr.baseUrl });
  return { srv, addr, client, fixture: opts.fixture || fixture };
}

export function assertLoopbackBaseUrl(baseUrl) {
  let u;
  try { u = new URL(baseUrl); } catch { throw new Error('NON_LOOPBACK_DENIED'); }
  if (u.protocol !== 'http:' || u.hostname !== '127.0.0.1' || !u.port || u.username || u.password
    || (u.pathname !== '/' && u.pathname !== '') || u.search || u.hash) {
    throw new Error('NON_LOOPBACK_DENIED');
  }
  return { port: Number(u.port) };
}

// Low-level loopback client. Never follows redirects; never resolves DNS (literal 127.0.0.1 only).
export function createFakeClient({ baseUrl }) {
  const { port } = assertLoopbackBaseUrl(baseUrl);
  const counters = { requests: 0, deniedRedirects: 0 };

  function request(method, path, { headers = {}, body, rawBody } = {}) {
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
      return Promise.reject(new Error('NON_LOOPBACK_DENIED'));
    }
    const payload = rawBody !== undefined ? rawBody : body !== undefined ? Buffer.from(JSON.stringify(body)) : null;
    const h = { ...headers };
    if (payload && !Object.keys(h).some((k) => k.toLowerCase() === 'content-type')) h['Content-Type'] = 'application/json';
    if (payload) h['Content-Length'] = String(payload.length);
    counters.requests += 1;
    return new Promise((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port, path, method, headers: h, agent: false }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let json = null;
          try { json = text ? JSON.parse(text) : null; } catch { json = null; }
          const out = { status: res.statusCode, headers: res.headers, body: json, rawHeaders: res.rawHeaders };
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            const loc = res.headers.location;
            let dest = null;
            try { dest = new URL(loc, baseUrl); } catch { dest = null; }
            const loop = dest && dest.protocol === 'http:' && dest.hostname === '127.0.0.1' && Number(dest.port) === port;
            if (!loop) { counters.deniedRedirects += 1; out.redirectDenied = true; out.deniedDestination = String(loc); }
          }
          resolve(out);
        });
        res.on('error', reject);
      });
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }
  return { request, counters, port };
}

export function browserHeaders({ cookie, csrf, origin = APP_ORIGIN, fetchSite = 'same-site', extra = {} } = {}) {
  const h = { Origin: origin, ...extra };
  if (fetchSite !== null) h['Sec-Fetch-Site'] = fetchSite;
  if (cookie !== undefined) h.Cookie = `__Host-lms_session=${cookie}`;
  if (csrf !== undefined) h['X-CSRF-Token'] = csrf;
  return h;
}

export function newOperationId() { return 'op_' + randomBytes(12).toString('base64url'); }

// A5 client-side model: one user intent -> one operationId; local draft kept until CONFIRMED.
export function createDraftSaver(client, creds) {
  const st = { draft: null, operationId: null, outcome: null, attempts: 0, lastStatus: null, intent: null };
  return {
    state: st,
    edit(value, ifMatch) { st.draft = { value }; st.intent = { ifMatch }; st.operationId = newOperationId(); st.outcome = 'DRAFT'; },
    async save(projectId) {
      if (st.outcome === 'UNKNOWN') throw new Error('UNKNOWN: verify required; blind replay refused');
      st.attempts += 1;
      let r;
      try {
        r = await client.request('POST', `/api/v1/projects/${projectId}/mutations`, {
          headers: browserHeaders({ cookie: creds.cookie, csrf: creds.csrf, extra: { 'If-Match': st.intent.ifMatch } }),
          body: { operationId: st.operationId, action: 'SET_ARCHIVED', value: st.draft.value },
        });
      } catch {
        st.outcome = 'UNKNOWN'; st.lastStatus = 'TRANSPORT_ERROR_AFTER_SEND';
        return st;
      }
      st.lastStatus = r.status;
      if (r.status === 200 && r.body && r.body.outcome === 'CONFIRMED' && r.body.saved === true) { st.outcome = 'CONFIRMED'; st.draft = null; }
      else if (r.status === 202 || r.status >= 500) st.outcome = 'UNKNOWN';
      else if (r.status === 409 || r.status === 412 || r.status === 428) st.outcome = 'CONFLICT';
      else st.outcome = 'DEFINITE_FAILURE';
      return st;
    },
    async verify(newCreds) {
      const c = newCreds || creds;
      const r = await client.request('GET', `/api/v1/operations/${st.operationId}`, { headers: browserHeaders({ cookie: c.cookie }) });
      return r; // verification is read-only; it never changes st.outcome to CONFIRMED by itself
    },
  };
}
