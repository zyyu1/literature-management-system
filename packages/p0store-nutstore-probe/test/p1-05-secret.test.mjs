// P1-05 - credential isolation: runtime env only, never in trace/log/error/URL, missing refuses first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import util from 'node:util';
import {
  startMockFor, planForPort, makeGate, countingTransport, runProbe, loadSecret,
  traceHasSecret, CANARY, CREDENTIAL_ENV_NAME,
} from '../support/harness.mjs';
import { Secret, SecretError, redactAuthorizationText } from '../src/secret.mjs';
import { createTrace, serializeTrace } from '../src/trace.mjs';

test('P1-05 the Secret object redacts every common serialisation and never exposes clear text', () => {
  const secret = new Secret(CANARY);
  assert.equal(String(secret), '[REDACTED]');
  assert.equal(`${secret}`, '[REDACTED]');
  assert.equal(JSON.stringify({ secret }), '{"secret":"[REDACTED]"}');
  assert.equal(JSON.stringify(secret), '"[REDACTED]"');
  assert.equal(util.inspect(secret).includes(CANARY), false);
  assert.equal(util.inspect({ secret }).includes(CANARY), false);
  assert.equal(secret.redact(`before ${CANARY} after`), 'before [REDACTED] after');
  const header = secret.authorizationHeader();
  assert.equal(header.startsWith('Basic '), true);
  assert.equal(header.includes(CANARY), false);
  assert.equal(Buffer.from(header.slice(6), 'base64').toString('utf8'), `probe:${CANARY}`);
  assert.equal(secret.appearsIn(header), true);
  assert.equal(secret.appearsIn('nothing here'), false);
});

test('P1-05 a missing or malformed credential refuses before any socket or gate exists', async () => {
  const plan = planForPort(8443);
  const transport = countingTransport();
  const refused = await runProbe({
    plan, env: {}, transport: transport.fn, allowTestHooks: true,
  });
  assert.equal(refused.refused, true);
  assert.equal(refused.code, 'SECRET_MISSING');
  assert.equal(refused.steps.length, 0);
  assert.equal(refused.gateStats, null);
  assert.equal(refused.trace.length, 0);
  assert.equal(transport.calls(), 0);

  assert.throws(() => loadSecret(plan, {}), (error) => {
    assert.ok(error instanceof SecretError);
    assert.equal(error.code, 'SECRET_MISSING');
    assert.equal(error.message.includes(CANARY), false);
    return true;
  });
  assert.throws(() => loadSecret(plan, { [CREDENTIAL_ENV_NAME]: '' }), (error) => error.code === 'SECRET_MISSING');
  assert.throws(() => loadSecret(plan, { [CREDENTIAL_ENV_NAME]: 'bad\u0000value' }), (error) => error.code === 'SECRET_INVALID');
  assert.throws(() => loadSecret(plan, { [CREDENTIAL_ENV_NAME]: 'x'.repeat(513) }), (error) => error.code === 'SECRET_TOO_LONG');
  assert.throws(() => loadSecret({ ...plan, credentialEnvVar: 'lower' }, { lower: CANARY }), (error) => error.code === 'SECRET_ENV_NAME_INVALID');
});

test('P1-05 the credential never appears in the trace, logs, errors, request URLs or mock request paths', async (t) => {
  const mock = await startMockFor(t, { personality: 'strong' });
  const plan = planForPort(mock.port);
  const gate = makeGate(plan, { ca: mock.caPem });
  const secret = new Secret(CANARY);
  const trace = createTrace({ secret });

  const response = await gate.request({ method: 'GET', fileId: 'XFZ' });
  assert.equal(response.status, 404);
  trace.record({
    type: 'request',
    step: 'T',
    seq: 1,
    method: response.method,
    pathTemplate: response.pathTemplate,
    syntheticId: response.syntheticId,
    status: response.status,
    validatorHashPrefix: response.validatorHashPrefix,
    bodySha256: response.bodySha256,
    bytesSent: 0,
    aborted: false,
    redirect: false,
    durationMs: response.durationMs,
    budget: {
      normal: 1, cleanup: 0, total: 1, maxRequests: 100, reservedCleanup: 12, nonReservedCeiling: 88,
    },
  });

  const serialized = serializeTrace(trace);
  assert.equal(traceHasSecret(trace.records(), CANARY), false);
  assert.equal(serialized.includes(CANARY), false);
  assert.equal(response.path.includes(CANARY), false);
  assert.equal(JSON.stringify(gate.stats).includes(CANARY), false);
  assert.equal(mock.stats.requestLog.every((entry) => !entry.path.includes(CANARY)), true);

  let refusalError = null;
  try {
    await gate.request({ method: 'GET', path: '//evil.invalid/x' });
  } catch (error) {
    refusalError = error;
  }
  assert.ok(refusalError);
  assert.equal(String(refusalError.message).includes(CANARY), false);
  assert.equal(String(refusalError.stack || '').includes(CANARY), false);
  assert.equal(redactAuthorizationText(`Authorization: ${secret.authorizationHeader()}`, secret).includes(CANARY), false);
  assert.equal(redactAuthorizationText(secret.authorizationHeader(), secret), '[REDACTED]');
  trace.close();
});

test('P1-05 the trace writer fails closed if any event tries to carry credential material', () => {
  const secret = new Secret(CANARY);
  const trace = createTrace({ secret });
  assert.throws(() => trace.record({
    type: 'request',
    step: 'T',
    seq: 1,
    method: 'GET',
    pathTemplate: '/LMS-P0STORE/{runId}/a-{fileId}.json',
    syntheticId: 'XFA',
    status: 200,
    validatorHashPrefix: null,
    bodySha256: CANARY,
    bytesSent: 0,
    aborted: false,
    redirect: false,
    durationMs: 1,
    budget: {
      normal: 1, cleanup: 0, total: 1, maxRequests: 100, reservedCleanup: 12, nonReservedCeiling: 88,
    },
  }), (error) => error.code === 'TRACE_SECRET_LEAK');
  assert.throws(() => trace.record({
    type: 'stop', rule: 'TEST', step: 'T', detail: `leaked ${CANARY}`,
  }), (error) => error.code === 'TRACE_SECRET_LEAK');
  assert.throws(() => trace.record({ type: 'request', step: 'T', seq: 1, method: 'GET', pathTemplate: 'https://evil.invalid/x' }),
    (error) => error.code === 'TRACE_HOST_LIKE_VALUE');
  assert.throws(() => trace.record({ type: 'request', step: 'T', seq: 1, authorization: 'x' }),
    (error) => error.code === 'TRACE_EVENT_FIELD_UNKNOWN');
  trace.close();
});
