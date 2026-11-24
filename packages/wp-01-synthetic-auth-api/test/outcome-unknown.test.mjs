// Q06 (OUTCOME-01, OUTCOME-02): A5 fake outcome contract — CONFIRMED / CONFLICT / DEFINITE_FAILURE / UNKNOWN;
// 202 is never Saved; lost ACK never blindly replayed.
// Q09: same-operation retry, foreign principal, revoked-during-UNKNOWN keep the original operation/draft context.
// All outcomes come from an injected in-process fake backend; nothing is durable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  fixtureCase, startServer, browserHeaders, newOperationId, createDraftSaver, requestTally,
} from '../support/harness.mjs';

const ALPHA = 'project_synth_alpha';
const creds = (s) => ({ cookie: s.cookieValue, csrf: s.csrfToken });

async function setup(t) {
  const env = await startServer(t);
  const a = env.srv.control.tokenFor('synthetic_session_owner_a');
  return { ...env, a, saver: createDraftSaver(env.client, creds(a)) };
}

test('Q06 CONFIRMED only for authoritative fake ACK: saved=true, new revision, draft cleared', async (t) => {
  const { srv, saver } = await setup(t);
  saver.edit(true, '"rev-fake-alpha-01"');
  const st = await saver.save(ALPHA);
  assert.equal(st.lastStatus, 200);
  assert.equal(st.outcome, 'CONFIRMED');
  assert.equal(st.draft, null);
  assert.equal(srv.control.projectSnapshot(ALPHA).revision, 'rev-fake-alpha-02');
});

test('Q06 OUTCOME-02 202 accepted-not-committed is UNKNOWN and NOT Saved; draft + operationId kept', async (t) => {
  const { fixture, srv, client, a, saver } = await setup(t);
  const c = fixtureCase(fixture, 'OUTCOME-02');
  assert.equal(c.expect, 'NOT_SAVED');
  srv.control.setNextOutcome(c.scenario);
  saver.edit(true, '"rev-fake-alpha-01"');
  const opId = saver.state.operationId;
  const st = await saver.save(ALPHA);
  assert.equal(st.lastStatus, 202);
  assert.equal(st.outcome, 'UNKNOWN');
  assert.deepEqual(st.draft, { value: true });
  assert.equal(st.operationId, opId);
  assert.equal(srv.control.projectSnapshot(ALPHA).archived, false, 'not committed');
  const v = await saver.verify();
  assert.equal(v.body.operation.outcome, 'UNKNOWN');
  assert.equal(v.body.authoritative, false);
  void client; void a;
});

test('Q06 202 response body itself never claims Saved', async (t) => {
  const { srv, client, a } = await setup(t);
  srv.control.setNextOutcome('fake_accepted_not_committed');
  const r = await client.request('POST', `/api/v1/projects/${ALPHA}/mutations`, {
    headers: browserHeaders({ cookie: a.cookieValue, csrf: a.csrfToken, extra: { 'If-Match': '"rev-fake-alpha-01"' } }),
    body: { operationId: newOperationId(), action: 'SET_ARCHIVED', value: true },
  });
  assert.equal(r.status, 202);
  assert.equal(r.body.outcome, 'UNKNOWN');
  assert.equal(r.body.saved, false);
  assert.equal(r.body.revision, undefined);
  assert.equal(r.headers.etag, undefined);
});

test('Q06 OUTCOME-01 lost ACK after dispatch (504) is UNKNOWN; no blind replay: second save refused locally, server re-dispatches nothing', async (t) => {
  const { fixture, srv, client, a, saver } = await setup(t);
  const c = fixtureCase(fixture, 'OUTCOME-01');
  assert.equal(c.expect, 'UNKNOWN_NO_REPLAY');
  srv.control.setNextOutcome(c.scenario);
  saver.edit(true, '"rev-fake-alpha-01"');
  const st = await saver.save(ALPHA);
  assert.equal(st.lastStatus, 504);
  assert.equal(st.outcome, 'UNKNOWN');
  assert.deepEqual(st.draft, { value: true });
  assert.equal(srv.backend.dispatches, 1);
  await assert.rejects(() => saver.save(ALPHA), /blind replay refused/);
  // Even a raw resend of the same operationId is not dispatched again by the server.
  const again = await client.request('POST', `/api/v1/projects/${ALPHA}/mutations`, {
    headers: browserHeaders({ cookie: a.cookieValue, csrf: a.csrfToken, extra: { 'If-Match': '"rev-fake-alpha-01"' } }),
    body: { operationId: st.operationId, action: 'SET_ARCHIVED', value: true },
  });
  assert.equal(again.status, 409);
  assert.equal(again.body.error.code, 'OPERATION_ID_REUSED');
  assert.equal(again.body.outcome, 'UNKNOWN');
  assert.equal(again.body.saved, false);
  assert.equal(again.body.operation.operationId, st.operationId);
  assert.equal(srv.backend.dispatches, 1, 'no second dispatch');
});

test('Q06 lost ACK as a dropped connection after dispatch keeps UNKNOWN, draft and operationId', async (t) => {
  const { srv, saver } = await setup(t);
  srv.control.setNextOutcome('fake_lost_ack_after_dispatch', { dropConnection: true });
  saver.edit(true, '"rev-fake-alpha-01"');
  const opId = saver.state.operationId;
  const st = await saver.save(ALPHA);
  assert.equal(st.lastStatus, 'TRANSPORT_ERROR_AFTER_SEND');
  assert.equal(st.outcome, 'UNKNOWN');
  assert.equal(st.operationId, opId);
  assert.deepEqual(st.draft, { value: true });
  assert.equal(srv.backend.dispatches, 1);
});

test('Q06 CONFLICT: fake stale revision (412), missing If-Match (428), stale If-Match (412) keep draft', async (t) => {
  const { srv, client, a, saver } = await setup(t);
  srv.control.setNextOutcome('fake_stale_revision');
  saver.edit(true, '"rev-fake-alpha-01"');
  const st = await saver.save(ALPHA);
  assert.equal(st.lastStatus, 412);
  assert.equal(st.outcome, 'CONFLICT');
  assert.deepEqual(st.draft, { value: true });
  const send = (extra) => client.request('POST', `/api/v1/projects/${ALPHA}/mutations`, {
    headers: browserHeaders({ cookie: a.cookieValue, csrf: a.csrfToken, extra }),
    body: { operationId: newOperationId(), action: 'SET_ARCHIVED', value: true },
  });
  const missing = await send({});
  assert.equal(missing.status, 428);
  assert.equal(missing.body.outcome, 'CONFLICT');
  const stale = await send({ 'If-Match': '"rev-fake-alpha-00"' });
  assert.equal(stale.status, 412);
  assert.equal(stale.body.outcome, 'CONFLICT');
  assert.equal(srv.control.projectSnapshot(ALPHA).archived, false);
});

test('Q06 DEFINITE_FAILURE: fake not-dispatched (403) changes nothing and is not Saved', async (t) => {
  const { srv, saver } = await setup(t);
  srv.control.setNextOutcome('fake_not_dispatched');
  saver.edit(true, '"rev-fake-alpha-01"');
  const st = await saver.save(ALPHA);
  assert.equal(st.lastStatus, 403);
  assert.equal(st.outcome, 'DEFINITE_FAILURE');
  assert.deepEqual(st.draft, { value: true });
  assert.equal(srv.control.projectSnapshot(ALPHA).archived, false);
  assert.equal(srv.backend.commits, 0);
  assert.equal(srv.backend.dispatches, 0, 'fake_not_dispatched never reaches dispatch');
});

test('Q06 all four outcomes are distinct and map from the fixture simulatedOutcomes table', async (t) => {
  const { fixture, srv, client, a } = await setup(t);
  const seen = new Map();
  for (const sim of fixture.simulatedOutcomes) {
    const rev = srv.control.projectSnapshot(ALPHA).revision;
    srv.control.setNextOutcome(sim.scenario);
    const r = await client.request('POST', `/api/v1/projects/${ALPHA}/mutations`, {
      headers: browserHeaders({ cookie: a.cookieValue, csrf: a.csrfToken, extra: { 'If-Match': `"${rev}"` } }),
      body: { operationId: newOperationId(), action: 'SET_ARCHIVED', value: !srv.control.projectSnapshot(ALPHA).archived },
    });
    assert.equal(r.status, sim.transportStatus, sim.scenario);
    assert.equal(r.body.outcome, sim.outcome, sim.scenario);
    assert.equal(r.body.saved, sim.outcome === 'CONFIRMED', sim.scenario);
    seen.set(sim.outcome, true);
  }
  assert.deepEqual([...seen.keys()].sort(), ['CONFIRMED', 'CONFLICT', 'DEFINITE_FAILURE', 'UNKNOWN']);
});

test('Q09 same operationId with a different payload/fingerprint is rejected without dispatch', async (t) => {
  const { srv, client, a } = await setup(t);
  srv.control.setNextOutcome('fake_lost_ack_after_dispatch');
  const opId = newOperationId();
  const h = browserHeaders({ cookie: a.cookieValue, csrf: a.csrfToken, extra: { 'If-Match': '"rev-fake-alpha-01"' } });
  await client.request('POST', `/api/v1/projects/${ALPHA}/mutations`, { headers: h, body: { operationId: opId, action: 'SET_ARCHIVED', value: true } });
  const diff = await client.request('POST', `/api/v1/projects/${ALPHA}/mutations`, { headers: h, body: { operationId: opId, action: 'SET_ARCHIVED', value: false } });
  assert.equal(diff.status, 409);
  assert.equal(diff.body.error.code, 'OPERATION_FINGERPRINT_MISMATCH');
  assert.equal(diff.body.operation, undefined);
  assert.equal(srv.backend.dispatches, 1);
});

test('Q09 foreign principal cannot see or reuse another principal\'s operation (neutral denial)', async (t) => {
  const { srv, client, a } = await setup(t);
  srv.control.setNextOutcome('fake_lost_ack_after_dispatch');
  const opId = newOperationId();
  await client.request('POST', `/api/v1/projects/${ALPHA}/mutations`, {
    headers: browserHeaders({ cookie: a.cookieValue, csrf: a.csrfToken, extra: { 'If-Match': '"rev-fake-alpha-01"' } }),
    body: { operationId: opId, action: 'SET_ARCHIVED', value: true },
  });
  const b = srv.control.issueFreshSession('user_demo_b');
  const look = await client.request('GET', `/api/v1/operations/${opId}`, { headers: browserHeaders({ cookie: b.cookieValue }) });
  const random = await client.request('GET', `/api/v1/operations/${newOperationId()}`, { headers: browserHeaders({ cookie: b.cookieValue }) });
  assert.equal(look.status, 403);
  assert.deepEqual(look.body, random.body);
  const reuse = await client.request('POST', `/api/v1/projects/${ALPHA}/mutations`, {
    headers: browserHeaders({ cookie: b.cookieValue, csrf: b.csrfToken, extra: { 'If-Match': '"rev-fake-alpha-02"' } }),
    body: { operationId: opId, action: 'SET_ARCHIVED', value: true },
  });
  assert.equal(reuse.status, 403);
  assert.equal(reuse.body.error.code, 'NOT_AVAILABLE');
  assert.equal(srv.backend.dispatches, 1);
});

test('Q09 revoked during UNKNOWN: 401 does not cancel/fail the op; re-auth reads the same UNKNOWN context, no replay', async (t) => {
  const { srv, a, saver } = await setup(t);
  srv.control.setNextOutcome('fake_lost_ack_after_dispatch');
  saver.edit(true, '"rev-fake-alpha-01"');
  const opId = saver.state.operationId;
  await saver.save(ALPHA);
  assert.equal(saver.state.outcome, 'UNKNOWN');
  srv.control.revokeByCookie(a.cookieValue);
  const denied = await saver.verify();
  assert.equal(denied.status, 401);
  assert.equal(saver.state.outcome, 'UNKNOWN', 'revocation does not turn UNKNOWN into failed/cancelled');
  assert.deepEqual(saver.state.draft, { value: true });
  assert.equal(saver.state.operationId, opId);
  const fresh = srv.control.issueFreshSession('user_demo_a');
  const v = await saver.verify(creds(fresh));
  assert.equal(v.status, 200);
  assert.equal(v.body.operation.operationId, opId);
  assert.equal(v.body.operation.outcome, 'UNKNOWN');
  assert.equal(v.body.operation.expectedRevision, 'rev-fake-alpha-01');
  assert.equal(v.body.authoritative, false);
  assert.equal(srv.backend.dispatches, 1, 'no replay after re-auth');
  assert.equal(saver.state.attempts, 1);
});

test('zz request tally for this file stays within the WP-01 5000-request cap', (t) => {
  const n = requestTally();
  t.diagnostic(`WP01_LOCAL_REQUESTS file=outcome-unknown n=${n}`);
  assert.ok(n <= 5000);
});
