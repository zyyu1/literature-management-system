// Q3-09: R2 stays negative-only. Permanent Project delete, Current unlink and All unlink are denied
// for a valid Owner target with STEP_UP_REQUIRED and mutationEnabled:false, before any dispatch.
// Forged step-up/confirmation/risk fields cannot enable; foreign/missing/workspace stay neutral;
// there is no global delete/unlink path at all.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  startServer, requestTally, PROJECT_PATH, PAPER_PATH, UNLINK_CURRENT_PATH, UNLINK_ALL_PATH,
  XFAKE001, XFOREIGN1, OWNER_SCOPE,
} from '../support/harness.mjs';

const ALPHA = 'project_synth_alpha';

function assertStepUp(res, label) {
  assert.equal(res.status, 403, label);
  assert.equal(res.body.error.code, 'STEP_UP_REQUIRED', label);
  assert.equal(res.body.stepUp, 'REQUIRED', label);
  assert.equal(res.body.mutationEnabled, false, label);
  assert.equal(res.body.dispatched, false, label);
  assert.equal(res.body.saved, false, label);
  assert.equal(res.body.durable, false, label);
  assert.equal(res.body.simulated, true, label);
}

test('Q3-09 valid Owner permanent Project delete is refused with STEP_UP_REQUIRED and no side effect', async (t) => {
  const ctx = await startServer(t);
  const before = ctx.srv.control.project(ALPHA);
  const digest = ctx.srv.control.stateDigest();
  const ledger = ctx.srv.control.ledgerSize();
  const res = await ctx.call('DELETE', PROJECT_PATH(ALPHA), ctx.owner, { ifMatch: `"${before.revision}"` });
  assertStepUp(res, 'delete project');
  assert.deepEqual(ctx.srv.control.project(ALPHA), before);
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.ledgerSize(), ledger);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q3-09 valid Owner Current unlink is refused with STEP_UP_REQUIRED; the association survives', async (t) => {
  const ctx = await startServer(t);
  const before = ctx.srv.control.association(ALPHA, [OWNER_SCOPE, ...XFAKE001]);
  const digest = ctx.srv.control.stateDigest();
  const res = await ctx.call('DELETE', UNLINK_CURRENT_PATH(ALPHA, XFAKE001), ctx.owner, { ifMatch: `"${before.revision}"` });
  assertStepUp(res, 'unlink current');
  assert.deepEqual(ctx.srv.control.association(ALPHA, [OWNER_SCOPE, ...XFAKE001]), before);
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q3-09 valid Owner All unlink is refused with STEP_UP_REQUIRED; every association survives', async (t) => {
  const ctx = await startServer(t);
  const before = ctx.srv.control.snapshot().associations.map((a) => ({ ...a }));
  const digest = ctx.srv.control.stateDigest();
  const res = await ctx.call('POST', UNLINK_ALL_PATH(XFAKE001), ctx.owner, { body: { operationId: 'op_unlinkall_001' } });
  assertStepUp(res, 'unlink all');
  assert.deepEqual(ctx.srv.control.snapshot().associations.map((a) => ({ ...a })), before);
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q3-09 forged step-up, confirmation, risk and bypass fields cannot enable any R2 action', async (t) => {
  const ctx = await startServer(t);
  const digest = ctx.srv.control.stateDigest();
  const forged = [
    { stepUp: 'GRANTED', confirmed: true },
    { confirmation: 'CONFIRMED', mutationEnabled: true },
    { riskTier: 'LOW', riskAccepted: true },
    { stepUpToken: 'fake', otp: '000000' },
    { bypass: true, admin: true },
  ];
  for (const body of forged) {
    for (const [method, path] of [
      ['DELETE', PROJECT_PATH(ALPHA)],
      ['DELETE', UNLINK_CURRENT_PATH(ALPHA, XFAKE001)],
      ['POST', UNLINK_ALL_PATH(XFAKE001)],
    ]) {
      const res = await ctx.call(method, path, ctx.owner, { body });
      assertStepUp(res, `${method} ${path} ${JSON.stringify(body)}`);
    }
  }
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.project(ALPHA).archived, false);
  assert.equal(ctx.srv.control.snapshot().counts.associations, 6);
});

test('Q3-09 R2 denials without a request body still require auth/CSRF and stay STEP_UP for a valid Owner', async (t) => {
  const ctx = await startServer(t);
  assertStepUp(await ctx.call('DELETE', PROJECT_PATH(ALPHA), ctx.owner), 'delete no body');
  assertStepUp(await ctx.call('DELETE', UNLINK_CURRENT_PATH(ALPHA, XFAKE001), ctx.owner), 'unlink no body');
  assertStepUp(await ctx.call('POST', UNLINK_ALL_PATH(XFAKE001), ctx.owner), 'unlink all no body');
  const anon = await ctx.call('DELETE', PROJECT_PATH(ALPHA), undefined);
  assert.equal(anon.status, 401);
  assert.equal(anon.body.error.code, 'AUTH_REQUIRED');
  const badCsrf = await ctx.call('DELETE', PROJECT_PATH(ALPHA), ctx.owner, { csrf: 'wrong' });
  assert.equal(badCsrf.status, 403);
  assert.equal(badCsrf.body.error.code, 'CSRF_DENIED');
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q3-09 foreign, missing and workspace R2 targets do not reveal the step-up rejection', async (t) => {
  const ctx = await startServer(t);
  const cases = [
    ['DELETE', PROJECT_PATH('project_synth_foreign'), ctx.owner, 403, 'NOT_AVAILABLE'],
    ['DELETE', PROJECT_PATH('project_synth_missing'), ctx.owner, 403, 'NOT_AVAILABLE'],
    ['DELETE', PROJECT_PATH(ALPHA), ctx.foreign, 403, 'NOT_AVAILABLE'],
    ['DELETE', PROJECT_PATH(ALPHA), ctx.workspace, 403, 'WORKSPACE_READ_ONLY'],
    ['DELETE', UNLINK_CURRENT_PATH('project_synth_foreign', XFOREIGN1), ctx.owner, 403, 'NOT_AVAILABLE'],
    ['DELETE', UNLINK_CURRENT_PATH(ALPHA, XFAKE001), ctx.workspace, 403, 'WORKSPACE_READ_ONLY'],
    ['POST', UNLINK_ALL_PATH(XFOREIGN1), ctx.owner, 403, 'NOT_AVAILABLE'],
    ['POST', UNLINK_ALL_PATH(XFAKE001), ctx.workspace, 403, 'WORKSPACE_READ_ONLY'],
  ];
  for (const [method, path, creds, status, code] of cases) {
    const res = await ctx.call(method, path, creds, { body: { stepUp: 'GRANTED' } });
    assert.equal(res.status, status, `${method} ${path}`);
    assert.equal(res.body.error.code, code);
    assert.ok(!('stepUp' in res.body));
    assert.ok(!('mutationEnabled' in res.body));
  }
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q3-09 no global/permanent delete or unlink route exists (no collection delete, no paper delete)', async (t) => {
  const ctx = await startServer(t);
  const digest = ctx.srv.control.stateDigest();
  const probes = [
    ['DELETE', '/api/v1/projects'],
    ['DELETE', PAPER_PATH(XFAKE001)],
    ['DELETE', '/api/v1/papers'],
    ['PUT', PROJECT_PATH(ALPHA)],
    ['POST', PROJECT_PATH(ALPHA)],
    ['DELETE', `${PAPER_PATH(XFAKE001)}/reading-status`],
    ['DELETE', `${PROJECT_PATH(ALPHA)}/papers`],
    ['GET', UNLINK_ALL_PATH(XFAKE001)],
  ];
  for (const [method, path] of probes) {
    const res = await ctx.call(method, path, ctx.owner, { body: { stepUp: 'GRANTED' } });
    assert.ok([404, 405].includes(res.status), `${method} ${path} -> ${res.status}`);
    assert.ok(!('stepUp' in res.body));
  }
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.snapshot().counts.associations, 6);
});

test('Q3-09 R2 denial bytes are stable and carry no operation identity', async (t) => {
  const ctx = await startServer(t);
  const a = await ctx.call('DELETE', PROJECT_PATH(ALPHA), ctx.owner, { body: { operationId: 'op_r2_first_001' } });
  const b = await ctx.call('DELETE', PROJECT_PATH(ALPHA), ctx.owner, { body: { operationId: 'op_r2_first_002' } });
  assertStepUp(a, 'first');
  assertStepUp(b, 'second');
  assert.equal(a.headers['content-length'], b.headers['content-length']);
  assert.equal(a.rawBody, undefined);
  assert.ok(!JSON.stringify(a.body).includes('operationId'));
  assert.ok(!JSON.stringify(a.body).includes('revision'));
  assert.equal(ctx.srv.control.ledgerSize(), 0);
});

test('zz request tally for this file stays within the 5000-request per-instance budget', (t) => {
  const n = requestTally();
  t.diagnostic(`WP03_LOCAL_REQUESTS file=r2-negative n=${n}`);
  assert.ok(n <= 5000);
});
