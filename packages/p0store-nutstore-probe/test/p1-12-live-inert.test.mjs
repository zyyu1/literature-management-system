// P1-12 - live mode is inert in Phase 1: every missing precondition refuses before any socket, and the
// package contains no real host literal (loopback and .invalid placeholders only).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  runProbe, planForPort, planForHost, countingTransport, walkPackageSourceFiles, urlHostsInText,
  PHASE1_LIVE_ENABLED, CANARY, CREDENTIAL_ENV_NAME,
} from '../support/harness.mjs';

const APPROVAL = 'APPR-P0STORE-LOCAL-0001';

function envWithSecret() {
  return { [CREDENTIAL_ENV_NAME]: CANARY };
}

test('P1-12 live mode is frozen off and every missing precondition has its own refusal before any socket', async () => {
  assert.equal(PHASE1_LIVE_ENABLED, false, 'Phase 1 must be inert by construction');
  const transport = countingTransport();
  const livePlan = planForHost('probe-host.invalid');
  const loopbackPlan = planForPort(8443);
  const common = { transport: transport.fn, allowTestHooks: true };

  const noLive = await runProbe({ ...common, plan: livePlan, live: false, env: envWithSecret() });
  assert.equal(noLive.refused, true);
  assert.equal(noLive.code, 'NON_LOOPBACK_HOST');
  assert.equal(noLive.trace.length, 0);

  const noApproval = await runProbe({
    ...common, plan: livePlan, live: true, accessApprovalId: null, env: envWithSecret(),
  });
  assert.equal(noApproval.code, 'ACCESS_APPROVAL_REQUIRED');

  const noSecret = await runProbe({
    ...common, plan: livePlan, live: true, accessApprovalId: APPROVAL, env: {},
  });
  assert.equal(noSecret.code, 'LIVE_SECRET_MISSING');

  const loopback = await runProbe({
    ...common, plan: loopbackPlan, live: true, accessApprovalId: APPROVAL, env: envWithSecret(),
  });
  assert.equal(loopback.code, 'LIVE_HOST_LOOPBACK');

  const inert = await runProbe({
    ...common, plan: livePlan, live: true, accessApprovalId: APPROVAL, env: envWithSecret(),
  });
  assert.equal(inert.code, 'PHASE1_LIVE_INERT');
  assert.equal(inert.gateStats, null);

  assert.equal(transport.calls(), 0, 'no refusal created a socket or transport call');
});

test('P1-12 the package and committed plan contain no real host literal, only loopback and .invalid placeholders', () => {
  const offenders = [];
  const forbiddenTokens = [['jianguo', 'yun'].join(''), ['dav.jianguo', 'yun'].join(''), ['nutstore', '.com'].join('')];
  for (const file of walkPackageSourceFiles()) {
    const text = fs.readFileSync(file, 'utf8');
    for (const host of urlHostsInText(text)) {
      const allowed = host === '127.0.0.1' || host === '::1' || host === 'localhost' || host.endsWith('.invalid');
      if (!allowed) offenders.push(`${file}: ${host}`);
    }
    for (const token of forbiddenTokens) {
      if (text.toLowerCase().includes(token)) offenders.push(`${file}: ${token}`);
    }
  }
  assert.deepEqual(offenders, [], `non-placeholder host material found:\n${offenders.join('\n')}`);
});

test('P1-12 no live-mode enablement is committed: the runner has no environment opt-in or waiver flag', () => {
  const runner = fs.readFileSync(new URL('../src/runner.mjs', import.meta.url), 'utf8');
  assert.ok(runner.includes('PHASE1_LIVE_ENABLED = false'));
  assert.equal(/process\.env\.(?:P0STORE_LIVE|LIVE_MODE|ALLOW_LIVE)/.test(runner), false);
  assert.equal(/--allow-live|--unsafe|--waiver/.test(runner), false);
});
