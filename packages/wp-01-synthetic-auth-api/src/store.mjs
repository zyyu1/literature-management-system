// WP-01 ephemeral, in-process, TEST-ONLY state: fake principals, fake Sessions, resource ACL,
// operation ledger and an injectable fake backend. Nothing here is durable, shared across
// processes, or an identity/session store. No database, no WebDAV adapter, no replay guarantee.
import { randomBytes } from 'node:crypto';
import { Denial, OUTCOME, LIMITS, safeEqualString, fingerprint } from './policy.mjs';

const nullMap = (entries) => new Map(entries);

export function createStore(fixture) {
  validateFixtureShape(fixture);
  const clockBase = Date.parse(fixture.clock.isoUtc);
  let clockOffsetMs = 0;
  const now = () => clockBase + clockOffsetMs;

  const principals = nullMap(fixture.principals.map((p) => [p.id, Object.freeze({ ...p })]));
  const projects = nullMap(fixture.resources.projects.map((p) => [p.id, { ...p }]));
  const outcomes = nullMap(fixture.simulatedOutcomes.map((o) => [o.scenario, Object.freeze({ ...o })]));

  // token -> session record. Tokens are random opaque values; fixture IDs are never used as cookies.
  const sessionsByToken = new Map();
  const tokenByFixtureId = new Map();
  const ledger = new Map(); // `${principalId}\u0000${operationId}` -> record

  const backend = {
    dispatches: 0, // requests that reached the fake backend after every pre-dispatch check
    commits: 0, // fake in-memory state changes
    nextScenario: 'fake_acknowledged',
    dropConnection: false,
  };
  const revisionCounters = new Map();

  function newToken() { return randomBytes(32).toString('base64url'); }

  function addSession(rec) {
    const token = newToken();
    const s = { ...rec, token, csrf: newToken() };
    sessionsByToken.set(token, s);
    return s;
  }

  for (const f of fixture.sessions) {
    const s = addSession({
      fixtureId: f.id,
      principalId: f.principalId,
      issuedAt: Date.parse(f.issuedAt),
      expiresAt: Date.parse(f.expiresAt),
      state: f.state,
    });
    tokenByFixtureId.set(f.id, s.token);
  }

  function authenticate(token) {
    if (!token) throw new Denial(401, 'AUTH_REQUIRED');
    const s = sessionsByToken.get(token);
    if (!s) throw new Denial(401, 'SESSION_INVALID');
    if (s.state === 'REVOKED') throw new Denial(401, 'SESSION_REVOKED');
    if (s.state === 'ROTATED') throw new Denial(401, 'SESSION_INVALID');
    if (s.state === 'EXPIRED' || now() >= s.expiresAt) throw new Denial(401, 'SESSION_EXPIRED');
    if (s.state !== 'ACTIVE') throw new Denial(401, 'SESSION_INVALID');
    const p = principals.get(s.principalId);
    if (!p || p.status !== 'ACTIVE' || p.role === 'ANONYMOUS') throw new Denial(401, 'SESSION_INVALID');
    return { session: s, principal: p };
  }

  function checkCsrf(session, presented) {
    if (!safeEqualString(session.csrf, presented)) throw new Denial(403, 'CSRF_DENIED');
  }

  // Neutral authorization: missing and foreign resources are indistinguishable to the caller.
  function authorizeProject(principal, projectId, mode) {
    const proj = projects.get(projectId);
    const sameOwner = proj && principal.ownerId !== null && proj.ownerId === principal.ownerId;
    if (!sameOwner) throw new Denial(403, 'NOT_AVAILABLE');
    if (principal.role === 'OWNER') return proj;
    if (principal.role === 'WORKSPACE_READONLY') {
      if (mode === 'projection') return proj;
      if (mode === 'owner-read') throw new Denial(403, 'NOT_AVAILABLE');
      throw new Denial(403, 'WORKSPACE_READ_ONLY');
    }
    throw new Denial(403, 'NOT_AVAILABLE');
  }

  function rotate(session) {
    session.state = 'ROTATED';
    const next = addSession({
      fixtureId: null,
      principalId: session.principalId,
      issuedAt: now(),
      expiresAt: session.expiresAt, // renewal never extends the absolute expiry
      state: 'ACTIVE',
    });
    return next;
  }

  function nextRevision(proj) {
    const n = (revisionCounters.get(proj.id) || 1) + 1;
    revisionCounters.set(proj.id, n);
    return proj.revision.replace(/-\d+$/, '') + '-' + String(n).padStart(2, '0');
  }

  // Fake backend: the ONLY place a (fake) state change can happen. Outcome is injected.
  function dispatch(proj, mutation) {
    const scenario = backend.nextScenario;
    backend.nextScenario = 'fake_acknowledged';
    const drop = backend.dropConnection;
    backend.dropConnection = false;
    const sim = outcomes.get(scenario);
    if (!sim) throw new Error('unknown fake scenario');
    // fake_not_dispatched models a backend refusal before dispatch: nothing is sent, nothing changes.
    const dispatched = sim.scenario !== 'fake_not_dispatched';
    if (dispatched) backend.dispatches += 1;
    let committed = false;
    if (sim.scenario === 'fake_acknowledged' || sim.scenario === 'fake_lost_ack_after_dispatch') {
      // A lost-ACK may well have committed: that is exactly why the caller must stay UNKNOWN.
      proj.archived = mutation.value;
      proj.revision = nextRevision(proj);
      backend.commits += 1;
      committed = true;
    }
    return { sim, committed, drop: dispatched && drop, dispatched };
  }

  function ledgerKey(principalId, operationId) { return principalId + '\u0000' + operationId; }

  return {
    now,
    principals,
    projects,
    backend,
    authenticate,
    checkCsrf,
    authorizeProject,
    rotate,
    dispatch,
    ledgerGet: (pid, opId) => ledger.get(ledgerKey(pid, opId)),
    ledgerPut: (pid, opId, rec) => ledger.set(ledgerKey(pid, opId), rec),
    fingerprint,
    revoke(session) { session.state = 'REVOKED'; },
    control: {
      tokenFor(fixtureSessionId) {
        const t = tokenByFixtureId.get(fixtureSessionId);
        if (!t) throw new Error('unknown fixture session');
        const s = sessionsByToken.get(t);
        return { cookieValue: s.token, csrfToken: s.csrf };
      },
      issueFreshSession(principalId) {
        const p = principals.get(principalId);
        if (!p || p.role === 'ANONYMOUS' || p.status !== 'ACTIVE') {
          throw new Error('refused: no session for anonymous/unknown principal (no first-visitor bootstrap)');
        }
        const s = addSession({ fixtureId: null, principalId, issuedAt: now(), expiresAt: now() + LIMITS.syntheticFreshSessionMs, state: 'ACTIVE' });
        return { cookieValue: s.token, csrfToken: s.csrf };
      },
      revokeFixtureSession(fixtureSessionId) {
        const s = sessionsByToken.get(tokenByFixtureId.get(fixtureSessionId));
        if (!s) throw new Error('unknown fixture session');
        s.state = 'REVOKED';
      },
      revokeByCookie(cookieValue) {
        const s = sessionsByToken.get(cookieValue);
        if (!s) throw new Error('unknown session');
        s.state = 'REVOKED';
      },
      advanceClock(ms) {
        if (!Number.isFinite(ms) || ms < 0) throw new Error('clock only moves forward');
        clockOffsetMs += ms;
      },
      nowIso: () => new Date(now()).toISOString(),
      setNextOutcome(scenario, { dropConnection = false } = {}) {
        if (!outcomes.has(scenario)) throw new Error('scenario not in fixture');
        backend.nextScenario = scenario;
        backend.dropConnection = Boolean(dropConnection);
      },
      projectSnapshot(id) { const p = projects.get(id); return p ? { ...p } : undefined; },
    },
  };
}

function validateFixtureShape(f) {
  const ok = f && f.fixtureSchemaVersion === 'WP01-SYNTHETIC-v1.0.0'
    && f.environment && f.environment.mode === 'LOCAL_SYNTHETIC_ONLY'
    && f.environment.provider === 'FAKE_ONLY'
    && f.environment.bindHost === '127.0.0.1'
    && Array.isArray(f.principals) && Array.isArray(f.sessions)
    && f.resources && Array.isArray(f.resources.projects)
    && Array.isArray(f.simulatedOutcomes) && f.clock && typeof f.clock.isoUtc === 'string';
  if (!ok) throw new Error('UNSAFE_CONFIG: fixture is not the WP01 synthetic schema');
  if (f.privacy && (f.privacy.realCredentialsPresent || f.privacy.pdfBytesPresent || f.privacy.zoteroIdentifiersReal)) {
    throw new Error('UNSAFE_CONFIG: fixture claims real data');
  }
  void OUTCOME;
}
