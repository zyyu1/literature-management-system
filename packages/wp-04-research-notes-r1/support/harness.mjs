// WP-04-R1 TEST SUPPORT ONLY (not server code). Loads the two frozen fixtures as raw bytes under
// their SHA-256 guards, starts the loopback server, and offers loopback-only clients/credential
// bundles. node:fs is used only to READ the frozen fixtures; nothing is written outside os.tmpdir
// by the mutation driver.
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import { parseFrozenFixtures, NOTE_KEYS } from '../src/fixtures.mjs';
import { createResearchNoteServer } from '../src/server.mjs';
import {
  assertLoopbackBaseUrl, browserHeaders, createFakeClient, newOperationId, APP_ORIGIN, EVIL_ORIGIN,
} from '../../wp-01-synthetic-auth-api/support/harness.mjs';
import { assertPlatformEgressPrecondition } from '../../wp-01-synthetic-auth-api/support/platform-precondition.mjs';

// D007-A62/A66 §3a: unconditional, fail-closed egress gate shared by every WP-04 test file that can
// create a server or socket. Every network-capable behavioural test imports this module, and the
// call runs during module evaluation, i.e. before node:test can execute any test body and before
// any listen()/connect() can happen. It applies to default discovery, targeted runs and scratch
// mutant copies alike; there is no environment variable or opt-in that can relax it.
assertPlatformEgressPrecondition();

export { assertLoopbackBaseUrl, browserHeaders, createFakeClient, newOperationId, APP_ORIGIN, EVIL_ORIGIN, NOTE_KEYS };

export const WP01_FIXTURE_URL = new URL('../../../docs/handoffs/WP-01/fixtures/wp01.v1.json', import.meta.url);
export const WP02_FIXTURE_URL = new URL('../../../docs/handoffs/WP-02/fixtures/wp02.v1.json', import.meta.url);

export const OWNER_SCOPE = 'owner_synth_001';
export const FOREIGN_SCOPE = 'owner_synth_foreign';
export const XFAKE001 = Object.freeze(['user', 'fakeLib01', 'XFAKE001']);
export const GROUP_XFAKE001 = Object.freeze(['group', 'fakeLib02', 'XFAKE001']);
export const XFAKE002 = Object.freeze(['user', 'fakeLib01', 'XFAKE002']);
export const XFOREIGN1 = Object.freeze(['user', 'fakeLibForeign', 'XFOREIGN1']);

export const RESEARCH_NOTE_PATH = (t) => `/api/v1/papers/${t[0]}/${t[1]}/${t[2]}/research-note`;
export const RESEARCH_NOTE_EXPORT_PATH = (t) => `${RESEARCH_NOTE_PATH(t)}/export`;

export function loadRawFixtures() {
  const wp01Raw = fs.readFileSync(WP01_FIXTURE_URL);
  const wp02Raw = fs.readFileSync(WP02_FIXTURE_URL);
  return { wp01Raw, wp02Raw, ...parseFrozenFixtures({ wp01Raw, wp02Raw }) };
}

const servers = [];
export function requestTally() { return servers.reduce((n, s) => n + s.stats.requests, 0); }

export function credsHeaders(creds, extra = {}) {
  return browserHeaders({
    cookie: creds === undefined ? undefined : creds.cookieValue,
    csrf: creds === undefined ? undefined : creds.csrfToken,
    extra,
  });
}

// One HTTP request through the WP-01 loopback-only fake client (never follows redirects).
export function send(client, method, path, creds, { body, rawBody, ifMatch, ifNoneMatch, extraHeaders, origin, fetchSite, csrf, cookie } = {}) {
  const extra = { ...(extraHeaders || {}) };
  if (ifMatch !== undefined) extra['If-Match'] = ifMatch;
  if (ifNoneMatch !== undefined) extra['If-None-Match'] = ifNoneMatch;
  const headers = browserHeaders({
    cookie: cookie !== undefined ? cookie : (creds === undefined ? undefined : creds.cookieValue),
    csrf: csrf !== undefined ? csrf : (creds === undefined ? undefined : creds.csrfToken),
    origin,
    fetchSite,
    extra,
  });
  if (csrf === null) delete headers['X-CSRF-Token'];
  if (cookie === null) delete headers.Cookie;
  if (origin === null) delete headers.Origin;
  return client.request(method, path, { headers, body, rawBody });
}

export function createRawClient({ baseUrl }) {
  const { port } = assertLoopbackBaseUrl(baseUrl);
  function request(method, path, { headers = {}, body, rawBody } = {}) {
    const payload = rawBody !== undefined
      ? rawBody
      : body !== undefined
        ? Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))
        : null;
    const h = { ...headers };
    if (payload && !Object.keys(h).some((k) => k.toLowerCase() === 'content-type')) h['Content-Type'] = 'application/json';
    if (payload) h['Content-Length'] = String(payload.length);
    return new Promise((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port, path, method, headers: h, agent: false }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks);
          const text = raw.toString('utf8');
          let json = null;
          try { json = text ? JSON.parse(text) : null; } catch { json = null; }
          resolve({ status: res.statusCode, headers: res.headers, rawHeaders: res.rawHeaders, rawBody: raw, text, body: json });
        });
        res.on('error', reject);
      });
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }
  // Raw socket exchange for duplicate headers / absolute-form targets / chunked bodies.
  function raw(requestText) {
    return new Promise((resolve, reject) => {
      const socket = net.connect({ host: '127.0.0.1', port });
      const chunks = [];
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve(Buffer.concat(chunks));
      };
      socket.on('data', (d) => chunks.push(d));
      socket.on('end', finish);
      socket.on('close', finish);
      socket.on('error', reject);
      socket.write(requestText);
    });
  }
  return { request, raw, port };
}

export async function startServer(t, opts = {}) {
  const fx = loadRawFixtures();
  const srv = createResearchNoteServer({ wp01Raw: fx.wp01Raw, wp02Raw: fx.wp02Raw, ...(opts.server || {}) });
  servers.push(srv);
  const addr = await srv.listen();
  t.after(() => srv.close());
  const client = createFakeClient({ baseUrl: addr.baseUrl });
  const rawClient = createRawClient({ baseUrl: addr.baseUrl });
  const owner = srv.control.tokenFor('synthetic_session_owner_a');
  const ownerSecond = srv.control.issueFreshSession('user_demo_a');
  const workspace = srv.control.tokenFor('synthetic_session_workspace');
  const foreign = srv.control.issueFreshSession('user_demo_b');
  const revoked = srv.control.tokenFor('synthetic_session_owner_b');
  const expired = srv.control.tokenFor('synthetic_session_expired');
  const runId = srv.control.runId();
  const get = (path, creds) => rawClient.request('GET', path, { headers: credsHeaders(creds) });
  const call = (method, path, creds, requestOpts) => send(client, method, path, creds, requestOpts);
  return {
    srv, addr, client, rawClient,
    wp01: fx.wp01, wp02: fx.wp02, verified: fx.verified,
    owner, ownerSecond, workspace, foreign, revoked, expired,
    runId, get, call,
    notePath: RESEARCH_NOTE_PATH,
    exportPath: RESEARCH_NOTE_EXPORT_PATH,
  };
}

// Closed request body for the whole-note PUT: {operationId, modelRunId, scope, fields}.
export function noteBody(runId, fields, operationId = newOperationId(), extra = {}) {
  return { operationId, modelRunId: runId, scope: 'GLOBAL_PAPER', fields, ...extra };
}

export function fixtureNoteFields(wp02) {
  const paper = wp02.papers.find((p) => p.libraryType === 'user' && p.libraryId === 'fakeLib01' && p.itemKey === 'XFAKE001');
  return { ...paper.note };
}

export function emptyNoteFields() {
  const fields = {};
  for (const key of NOTE_KEYS) fields[key] = '';
  return fields;
}

export function fieldsWith(overrides = {}) {
  return { ...emptyNoteFields(), ...overrides };
}

// The current opaque whole-note revision for an owner tuple, or null when the note is absent.
export function noteRevisionOf(srv, tuple) {
  const view = srv.control.note([OWNER_SCOPE, ...tuple]);
  return view && view.exists ? view.revision : null;
}

// Resolves to { ok, value } / { ok:false, error } instead of rejecting, for socket-drop evidence.
export async function settle(promise) {
  try {
    return { ok: true, value: await promise };
  } catch (error) {
    return { ok: false, error };
  }
}

export function paperByTuple(snapshot, tuple) {
  const pk = [OWNER_SCOPE, ...tuple].join('\u0000');
  return snapshot.papers.find((p) => p.key === pk) || null;
}
