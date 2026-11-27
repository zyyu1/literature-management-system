// P1-02 - gate pinning, verb allowlist, canonical paths and zero egress on refusal.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  startMockFor, planForPort, makeGate, countingTransport, createGate, GateRefusal,
} from '../support/harness.mjs';

async function setup(t, options = {}) {
  const mock = await startMockFor(t, { personality: 'strong' });
  const plan = planForPort(mock.port);
  const gate = makeGate(plan, { ca: mock.caPem, transport: options.transport });
  return { mock, plan, gate };
}

async function expectRefusal(promise, code) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof GateRefusal, `expected GateRefusal ${code}, got ${error && error.name}`);
    assert.equal(error.code, code, `expected ${code}, got ${error.code} (${error.message})`);
    return true;
  });
}

test('P1-02 the gate pins the exact plan host, port and run path prefix for every request', async (t) => {
  const transport = countingTransport();
  const { mock, plan, gate } = await setup(t, { transport: transport.fn });
  const response = await gate.request({ method: 'MKCOL', target: 'run-directory' });
  assert.equal(response.status, 207);
  assert.equal(transport.calls(), 1);
  assert.deepEqual(transport.seen[0], {
    host: '127.0.0.1', port: mock.port, path: plan.runDirectory, method: 'MKCOL',
  });
  assert.deepEqual(gate.pinned, {
    protocol: 'https:',
    host: plan.host,
    port: plan.port,
    prefix: plan.pathPrefix,
    runDirectory: plan.runDirectory,
    probeParent: plan.probeParent,
  });
  assert.equal(gate.stats.egress, 1);
});

test('P1-02 the test-only transport hook cannot replace production transport without the explicit test switch', async (t) => {
  const { plan } = await setup(t);
  assert.throws(() => createGate({ plan, transport: () => ({}) }), (error) => {
    assert.equal(error.code, 'GATE_TEST_HOOK_NOT_AUTHORIZED');
    return true;
  });
});

test('P1-02 the verb allowlist rejects PATCH/POST/TRACE/CONNECT and non-canonical method spellings', async (t) => {
  const { mock, plan, gate } = await setup(t);
  const path = `${plan.pathPrefix}a-XFA.json`;
  for (const method of ['PATCH', 'POST', 'TRACE', 'CONNECT']) {
    await expectRefusal(gate.request({ method, path }), 'METHOD_NOT_ALLOWED');
  }
  await expectRefusal(gate.request({ method: 'get', path }), 'METHOD_INVALID');
  await expectRefusal(gate.request({ method: 'GET', path, unexpected: true }), 'UNKNOWN_REQUEST_FIELD');
  assert.equal(gate.stats.egress, 0, 'no refused request created a socket');
  assert.equal(mock.stats.requests, 0);
});

test('P1-02 canonical path negatives each fail with their own dedicated reason', async (t) => {
  const { mock, plan, gate } = await setup(t);
  const prefix = plan.pathPrefix;
  const cases = [
    [`${prefix}../a-XFA.json`, 'PATH_DOT_SEGMENT'],
    [`${prefix}./a-XFA.json`, 'PATH_DOT_SEGMENT'],
    [`${prefix}%2e%2e/a-XFA.json`, 'PATH_ENCODED_DOT'],
    [`${prefix}a%2fXFA.json`, 'PATH_ENCODED_SEPARATOR'],
    [`${prefix}a%5cXFA.json`, 'PATH_ENCODED_SEPARATOR'],
    [`${prefix}a%252eXFA.json`, 'PATH_DOUBLE_ENCODED'],
    [`${prefix}a%zzXFA.json`, 'PATH_BAD_ENCODING'],
    [`${prefix}a\\XFA.json`, 'PATH_BACKSLASH'],
    [`${prefix}a\u0001XFA.json`, 'PATH_CONTROL_BYTE'],
    [`${prefix}a?x=1`, 'PATH_QUERY_OR_FRAGMENT'],
    [`${prefix}a//XFA.json`, 'PATH_EMPTY_SEGMENT'],
    [`${prefix}a XFA.json`, 'PATH_ILLEGAL_CHAR'],
    ['//evil.invalid/x', 'PATH_ABSOLUTE_FORM'],
    ['/LMS-P0STORE/other-run-fake/a-XFZ.json', 'PATH_OUTSIDE_PREFIX'],
    ['https://evil.invalid/x', 'PATH_NOT_ABSOLUTE'],
    ['', 'PATH_EMPTY'],
  ];
  for (const [path, code] of cases) {
    await expectRefusal(gate.request({ method: 'GET', path, auth: false }), code);
  }
  assert.equal(gate.stats.egress, 0);
  assert.equal(mock.stats.requests, 0);
  assert.equal(mock.stats.connections, 0);
});

test('P1-02 a refused request produces zero egress: no transport call, no connection and no HTTP request', async (t) => {
  const { mock, plan, gate } = await setup(t);
  for (const path of ['//evil.invalid/x', '/outside/a.json', `${plan.pathPrefix}%2e%2e/x`]) {
    await assert.rejects(gate.request({ method: 'GET', path }), (error) => error instanceof GateRefusal);
  }
  await assert.rejects(gate.request({ method: 'DELETE', path: plan.runDirectory }), (error) => error instanceof GateRefusal);
  assert.equal(gate.stats.egress, 0);
  assert.equal(gate.stats.responses, 0);
  assert.equal(mock.stats.requests, 0);
  assert.equal(mock.stats.connections, 0);
});

test('P1-02 writes and deletes are restricted to the frozen file manifest and conditional requests', async (t) => {
  const { mock, plan, gate } = await setup(t);
  const body = Buffer.from('{"synthetic":true,"file":"XFA"}\n');

  assert.equal((await gate.request({ method: 'MKCOL', target: 'run-directory' })).status, 201);
  await expectRefusal(gate.request({ method: 'MKCOL', target: 'run-directory' }), 'MKCOL_ALREADY_DONE');
  const put = await gate.request({ method: 'PUT', fileId: 'XFA', ifNoneMatch: '*', body });
  assert.equal(put.status, 201);
  assert.equal(typeof put.etag, 'string');

  await expectRefusal(gate.request({ method: 'PUT', fileId: 'XQ', ifNoneMatch: '*', body }), 'FILE_NOT_IN_PLAN');
  await expectRefusal(gate.request({ method: 'PUT', path: `${plan.pathPrefix}a-XFA.json`, ifNoneMatch: '*', body }), 'FILE_ID_REQUIRED');
  await expectRefusal(gate.request({ method: 'PUT', fileId: 'XFA', body }), 'PUT_CONDITION_REQUIRED');
  await expectRefusal(gate.request({
    method: 'PUT', fileId: 'XFA', ifNoneMatch: '*', ifMatch: '"x"', body,
  }), 'PUT_MULTIPLE_CONDITIONS');
  await expectRefusal(gate.request({
    method: 'PUT', fileId: 'XFA', ifNoneMatch: '*', body: Buffer.alloc(2049, 0x61),
  }), 'FILE_PLAN_BYTES_EXCEEDED');
  await expectRefusal(gate.request({
    method: 'PUT', fileId: 'XFA', path: `${plan.pathPrefix}other-XFA.json`, ifNoneMatch: '*', body,
  }), 'FILE_PATH_MISMATCH');
  await expectRefusal(gate.request({ method: 'DELETE', target: 'run-directory' }), 'DELETE_NOT_PERMITTED_PATH');
  await expectRefusal(gate.request({ method: 'DELETE', fileId: 'XFA', ifMatch: '"x"', depth: '1' }), 'DELETE_DEPTH_FORBIDDEN');
  await expectRefusal(gate.request({ method: 'DELETE', fileId: 'XFA' }), 'DELETE_CONDITION_REQUIRED');
  await expectRefusal(gate.request({ method: 'PROPFIND', fileId: 'XFA', depth: 'infinity' }), 'PROPFIND_DEPTH_INVALID');
  await expectRefusal(gate.request({ method: 'OPTIONS', fileId: 'XFA' }), 'OPTIONS_PATH_INVALID');
  await expectRefusal(gate.request({ method: 'HEAD', fileId: 'XFA', body }), 'BODY_NOT_ALLOWED');

  const stale = await gate.request({ method: 'DELETE', fileId: 'XFA', ifMatch: '"stale-XFA"' });
  assert.equal(stale.status, 412);
  const deleted = await gate.request({ method: 'DELETE', fileId: 'XFA', ifMatch: put.etag });
  assert.equal(deleted.status, 204);
  await expectRefusal(gate.request({ method: 'DELETE', fileId: 'XFA', ifMatch: put.etag }), 'DELETE_UNKNOWN_FILE');
  assert.equal(mock.stats.byMethod.DELETE, 2, 'only the one stale and one valid DELETE reached the server');
});
