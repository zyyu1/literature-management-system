// P1-03 - TLS verification and redirect STOP before any credential is sent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  runAgainstMock, traceHasSecret, CANARY, PACKAGE_ROOT,
} from '../support/harness.mjs';
import { httpsTransport } from '../src/gate.mjs';

for (const kind of ['wrong-ca', 'wrong-cn', 'expired']) {
  test(`P1-03 ${kind} certificate fails strict TLS verification, STOPs the run and never sends the credential`, async (t) => {
    const { mock, result } = await runAgainstMock(t, {
      personality: 'bad-cert',
      mockOptions: { tls: 'bad-cert', badCertKind: kind },
    });
    assert.equal(result.stop.rule, 'TLS_OR_HOST', `expected TLS STOP for ${kind}`);
    // R2/DEC-37 minimal whitelist exception: a STOP before L6 completed is INCONCLUSIVE, not PARTIAL.
    assert.equal(result.verdict, 'INCONCLUSIVE');
    assert.equal(result.unresolved, true);
    assert.equal(result.steps[0].reason, 'STOP_TLS_OR_HOST');
    assert.equal(mock.stats.requests, 0, 'no HTTP request may reach the server over a failed handshake');
    assert.equal(mock.stats.authFailures, 0, 'no Authorization header may be sent');
    assert.equal(mock.stats.connections <= 1, true, 'at most one TCP connection is attempted');
    const requests = result.trace.filter((event) => event.type === 'request');
    assert.equal(requests.length, 1, 'the failed attempt is recorded once and not retried');
    assert.equal(requests[0].status, null);
    assert.equal(traceHasSecret(result.trace, CANARY), false, 'the credential never appears in the trace');
  });
}

test('P1-03 a 3xx response STOPs the run and the Location is never fetched', async (t) => {
  const redirectTarget = '/LMS-P0STORE/redirect-target-XFRD';
  let transportCalls = 0;
  const countingTransport = async (options) => {
    transportCalls += 1;
    return httpsTransport(options);
  };
  const { mock, result } = await runAgainstMock(t, {
    personality: 'redirect',
    mockOptions: { redirectLocation: 'https://redirect.invalid' + redirectTarget },
    probeOptions: { transport: countingTransport, allowTestHooks: true },
  });
  assert.equal(result.stop.rule, 'REDIRECT');
  // R2/DEC-37 minimal whitelist exception: a STOP before L6 completed is INCONCLUSIVE, not PARTIAL.
  assert.equal(result.verdict, 'INCONCLUSIVE');
  assert.equal(result.unresolved, true);
  assert.equal(transportCalls, 3, 'one transport call per L0 request; no fourth call for the redirect target');
  assert.equal(mock.stats.redirects, 1);
  assert.equal(mock.stats.requests, 3, 'exactly the three L0 requests, no follow-up request');
  assert.equal(mock.stats.connections, 3, 'one socket per L0 request and none for the redirect target');
  assert.equal(mock.pathRequests(redirectTarget), 0, 'the redirect target must never be requested');
  const requests = result.trace.filter((event) => event.type === 'request');
  assert.equal(requests.length, 3);
  assert.equal(requests[2].status, 302);
  assert.equal(requests[2].redirect, true);
  assert.equal(requests.some((event) => event.pathTemplate === redirectTarget), false);
});

test('P1-03 the gate source carries strict TLS verification and never disables certificate checks', () => {
  const source = fs.readFileSync(path.join(PACKAGE_ROOT, 'src', 'gate.mjs'), 'utf8');
  assert.ok(source.includes('rejectUnauthorized: true'), 'strict verification is explicit');
  const forbidden = ['rejectUnauthorized', ':', ' ', 'false'].join('');
  assert.equal(source.includes(forbidden), false, 'no code path disables certificate verification');
  assert.ok(source.includes('minVersion') === false);
});
