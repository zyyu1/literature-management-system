// Q3-08: authorization, CSRF, Origin/Fetch-Metadata, media type and body hygiene negatives — all
// before dispatch, with byte-identical neutral denials and no revision/ledger disclosure.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  startServer, requestTally, browserHeaders, projectPatchBody, importantBody, readingStatusBody, createBody,
  PROJECT_PATH, READING_STATUS_PATH, IMPORTANT_PATH, UNLINK_CURRENT_PATH, UNLINK_ALL_PATH,
  XFAKE001, OWNER_SCOPE, APP_ORIGIN,
} from '../support/harness.mjs';
import { ACTION } from '../src/contract.mjs';

const ALPHA = 'project_synth_alpha';

function revisions(ctx) {
  return {
    project: ctx.srv.control.project(ALPHA).revision,
    status: ctx.srv.control.paper([OWNER_SCOPE, ...XFAKE001]).revision,
    assoc: ctx.srv.control.association(ALPHA, [OWNER_SCOPE, ...XFAKE001]).revision,
  };
}

function patchBody(ctx, action, extra = {}) {
  return projectPatchBody(ctx.runId, action, extra);
}

test('Q3-08 WORKSPACE_READONLY is denied every write route with no dispatch or state change', async (t) => {
  const ctx = await startServer(t);
  const r = revisions(ctx);
  const digest = ctx.srv.control.stateDigest();
  const cases = [
    ['POST', '/api/v1/projects', { body: createBody(ctx.runId, 'project_synth_delta', 'Delta'), ifNoneMatch: '*' }],
    ['PATCH', PROJECT_PATH(ALPHA), { body: patchBody(ctx, ACTION.RENAME, { name: 'ws' }), ifMatch: `"${r.project}"` }],
    ['PATCH', READING_STATUS_PATH(XFAKE001), { body: readingStatusBody(ctx.runId, 'Read'), ifMatch: `"${r.status}"` }],
    ['PATCH', IMPORTANT_PATH(ALPHA, XFAKE001), { body: importantBody(ctx.runId, false), ifMatch: `"${r.assoc}"` }],
    ['DELETE', PROJECT_PATH(ALPHA), { body: { stepUp: 'forged' } }],
    ['DELETE', UNLINK_CURRENT_PATH(ALPHA, XFAKE001), {}],
    ['POST', UNLINK_ALL_PATH(XFAKE001), { body: { confirmation: 'forged' } }],
  ];
  for (const [method, path, opts] of cases) {
    const res = await ctx.call(method, path, ctx.workspace, opts);
    assert.equal(res.status, 403, `${method} ${path}`);
    assert.equal(res.body.error.code, 'WORKSPACE_READ_ONLY');
    assert.equal(res.body.dispatched, false);
  }
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
  // The read projection remains available and scoped (no owner ids, no write material).
  const list = await ctx.get('/api/v1/projects?state=all', ctx.workspace);
  assert.equal(list.status, 200);
  assert.equal(list.body.projects.length, 3);
  assert.ok(!JSON.stringify(list.body).includes('owner_synth_001'));
});

test('Q3-08 missing, revoked, expired and invalid Sessions are 401 on unsafe routes; anonymous reads stay neutral', async (t) => {
  const ctx = await startServer(t);
  const body = patchBody(ctx, ACTION.RENAME, { name: 'nope' });
  const cases = [
    [ctx.revoked, 'SESSION_REVOKED'],
    [ctx.expired, 'SESSION_EXPIRED'],
    [{ cookieValue: 'not-a-real-session-token', csrfToken: ctx.owner.csrfToken }, 'SESSION_INVALID'],
    [undefined, 'AUTH_REQUIRED'],
  ];
  for (const [creds, code] of cases) {
    const res = await ctx.call('PATCH', PROJECT_PATH(ALPHA), creds, { body, ifMatch: `"${revisions(ctx).project}"` });
    assert.equal(res.status, 401, code);
    assert.equal(res.body.error.code, code);
    assert.equal(res.body.dispatched, false);
  }
  const anonRead = await ctx.get('/api/v1/projects?state=all', undefined);
  assert.equal(anonRead.status, 403);
  assert.equal(anonRead.body.error.code, 'NOT_AVAILABLE');
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q3-08 ambiguous Cookie headers are 401 SESSION_INVALID', async (t) => {
  const ctx = await startServer(t);
  const body = JSON.stringify(patchBody(ctx, ACTION.RENAME, { name: 'ambiguous' }));
  const text = [
    `PATCH /api/v1/projects/${ALPHA} HTTP/1.1`,
    'Host: 127.0.0.1',
    `Origin: ${APP_ORIGIN}`,
    'Sec-Fetch-Site: same-site',
    'Content-Type: application/json',
    `Cookie: __Host-lms_session=${ctx.owner.cookieValue}; __Host-lms_session=${ctx.owner.cookieValue}`,
    `X-CSRF-Token: ${ctx.owner.csrfToken}`,
    `If-Match: "${revisions(ctx).project}"`,
    `Content-Length: ${Buffer.byteLength(body)}`,
    'Connection: close',
    '',
    body,
  ].join('\r\n');
  const raw = (await ctx.rawClient.raw(text)).toString('latin1');
  assert.match(raw, /^HTTP\/1\.1 401 /);
  assert.match(raw, /SESSION_INVALID/);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q3-08 duplicate CSRF and Origin header lines are rejected before dispatch', async (t) => {
  const ctx = await startServer(t);
  const body = JSON.stringify(patchBody(ctx, ACTION.RENAME, { name: 'dup headers' }));
  const head = [
    `PATCH /api/v1/projects/${ALPHA} HTTP/1.1`,
    'Host: 127.0.0.1',
    `Origin: ${APP_ORIGIN}`,
    'Sec-Fetch-Site: same-site',
    'Content-Type: application/json',
    `Cookie: __Host-lms_session=${ctx.owner.cookieValue}`,
    `X-CSRF-Token: ${ctx.owner.csrfToken}`,
    `If-Match: "${revisions(ctx).project}"`,
    `Content-Length: ${Buffer.byteLength(body)}`,
    'Connection: close',
  ];
  const withDupCsrf = [...head.slice(0, 7), `X-CSRF-Token: ${ctx.owner.csrfToken}`, ...head.slice(7), '', body].join('\r\n');
  const csrfText = (await ctx.rawClient.raw(withDupCsrf)).toString('latin1');
  assert.match(csrfText, /^HTTP\/1\.1 403 /);
  assert.match(csrfText, /CSRF_DENIED/);
  const withDupOrigin = [...head.slice(0, 3), `Origin: ${APP_ORIGIN}`, ...head.slice(3), '', body].join('\r\n');
  const originText = (await ctx.rawClient.raw(withDupOrigin)).toString('latin1');
  assert.match(originText, /^HTTP\/1\.1 403 /);
  assert.match(originText, /ORIGIN_DENIED/);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
});

test('Q3-08 missing or wrong CSRF token is 403 CSRF_DENIED before dispatch', async (t) => {
  const ctx = await startServer(t);
  const body = patchBody(ctx, ACTION.RENAME, { name: 'csrf' });
  for (const csrf of ['wrong-token-value', null]) {
    const res = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, { body, csrf, ifMatch: `"${revisions(ctx).project}"` });
    assert.equal(res.status, 403, String(csrf));
    assert.equal(res.body.error.code, 'CSRF_DENIED');
    assert.equal(res.body.dispatched, false);
  }
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q3-08 missing/wrong Origin and missing/cross-site Fetch Metadata are denied before dispatch', async (t) => {
  const ctx = await startServer(t);
  const body = JSON.stringify(patchBody(ctx, ACTION.RENAME, { name: 'origin' }));
  const headers = [
    'Host: 127.0.0.1',
    'Content-Type: application/json',
    `Cookie: __Host-lms_session=${ctx.owner.cookieValue}`,
    `X-CSRF-Token: ${ctx.owner.csrfToken}`,
    `If-Match: "${revisions(ctx).project}"`,
    `Content-Length: ${Buffer.byteLength(body)}`,
    'Connection: close',
  ];
  const sendRaw = async (extra) => {
    const text = [
      `PATCH /api/v1/projects/${ALPHA} HTTP/1.1`,
      ...extra,
      ...headers,
      '',
      body,
    ].join('\r\n');
    return (await ctx.rawClient.raw(text)).toString('latin1');
  };
  const missingOrigin = await sendRaw(['Sec-Fetch-Site: same-site']);
  assert.match(missingOrigin, /^HTTP\/1\.1 403 /);
  assert.match(missingOrigin, /ORIGIN_DENIED/);
  const evilOrigin = await sendRaw([`Origin: ${'https://evil.wp01.invalid'}`, 'Sec-Fetch-Site: same-site']);
  assert.match(evilOrigin, /^HTTP\/1\.1 403 /);
  assert.match(evilOrigin, /ORIGIN_DENIED/);
  const noFetch = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, {
    body: patchBody(ctx, ACTION.RENAME, { name: 'fm' }), fetchSite: null, ifMatch: `"${revisions(ctx).project}"`,
  });
  assert.equal(noFetch.status, 403);
  assert.equal(noFetch.body.error.code, 'FETCH_METADATA_DENIED');
  const crossSite = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, {
    body: patchBody(ctx, ACTION.RENAME, { name: 'fm2' }), fetchSite: 'cross-site', ifMatch: `"${revisions(ctx).project}"`,
  });
  assert.equal(crossSite.status, 403);
  assert.equal(crossSite.body.error.code, 'FETCH_METADATA_DENIED');
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q3-08 wrong or missing media type is 415; malformed, duplicate-key, prototype and non-UTF-8 bodies are 400', async (t) => {
  const ctx = await startServer(t);
  const revision = revisions(ctx).project;
  const valid = JSON.stringify(patchBody(ctx, ACTION.RENAME, { name: 'body' }));
  const wrongType = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, {
    rawBody: Buffer.from(valid), extraHeaders: { 'Content-Type': 'text/plain' }, ifMatch: `"${revision}"`,
  });
  assert.equal(wrongType.status, 415);
  assert.equal(wrongType.body.error.code, 'UNSUPPORTED_MEDIA_TYPE');
  const cases = [
    ['{', 'BAD_JSON'],
    ['{"operationId":}', 'BAD_JSON'],
    ['{"operationId":"op_abcdefghij","operationId":"op_abcdefghij","modelRunId":"' + ctx.runId + '","scope":"PROJECT","action":"RENAME","name":"x"}', 'DUPLICATE_FIELD'],
    ['{"__proto__":{"polluted":1},"operationId":"op_abcdefghij"}', 'FORBIDDEN_KEY'],
    ['{"operationId":"op_abcdefghij","x":{"constructor":{"prototype":{}}}}', 'FORBIDDEN_KEY'],
  ];
  for (const [raw, code] of cases) {
    const res = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, {
      rawBody: Buffer.from(raw), ifMatch: `"${revision}"`,
    });
    assert.equal(res.status, 400, raw.slice(0, 30));
    assert.equal(res.body.error.code, code);
  }
  const badUtf8 = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, {
    rawBody: Buffer.from([0x7b, 0xff, 0xfe, 0x7d]), ifMatch: `"${revision}"`,
  });
  assert.equal(badUtf8.status, 400);
  assert.equal(badUtf8.body.error.code, 'INVALID_ENCODING');
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal({}.polluted, undefined);
});

test('Q3-08 forged owner/role/revision/step-up/risk/fault/confirmation fields cannot enable or override anything', async (t) => {
  const ctx = await startServer(t);
  const revision = revisions(ctx).project;
  const digest = ctx.srv.control.stateDigest();
  const forgedFields = [
    ['ownerId', 'owner_synth_foreign'], ['role', 'OWNER'], ['revision', 'rev_forged_000000'],
    ['stepUp', 'GRANTED'], ['confirmation', 'CONFIRMED'], ['riskTier', 'LOW'],
    ['fault', 'model_ack'], ['scenario', 'model_ack'], ['saved', true], ['durable', true], ['dispatched', true],
  ];
  for (const [field, value] of forgedFields) {
    const body = { ...patchBody(ctx, ACTION.RENAME, { name: 'forged' }), [field]: value };
    const res = await ctx.call('PATCH', PROJECT_PATH(ALPHA), ctx.owner, { body, ifMatch: `"${revision}"` });
    assert.equal(res.status, 400, field);
    assert.equal(res.body.error.code, 'UNKNOWN_FIELD');
    assert.equal(res.body.dispatched, false);
  }
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
});

test('Q3-08 valid foreign and missing Owner targets are byte-identical neutral 403s with stable headers', async (t) => {
  const ctx = await startServer(t);
  const body = patchBody(ctx, ACTION.RENAME, { name: 'neutral' });
  const headers = browserHeaders({ cookie: ctx.owner.cookieValue, csrf: ctx.owner.csrfToken, extra: { 'If-Match': `"${revisions(ctx).project}"` } });
  const missing = await ctx.rawClient.request('PATCH', PROJECT_PATH('project_synth_missing'), { headers, body });
  const foreign = await ctx.rawClient.request('PATCH', PROJECT_PATH('project_synth_foreign'), { headers, body });
  assert.equal(missing.status, 403);
  assert.equal(foreign.status, 403);
  assert.deepEqual(missing.rawBody, foreign.rawBody, 'the neutral denial body is byte-identical');
  const stable = ['content-type', 'content-length', 'cache-control', 'x-content-type-options', 'vary', 'access-control-allow-origin', 'access-control-allow-credentials'];
  for (const h of stable) assert.equal(missing.headers[h], foreign.headers[h], h);
  assert.equal(missing.headers.etag, undefined);
  assert.equal(missing.headers.location, undefined);
  const text = missing.rawBody.toString('utf8');
  for (const needle of ['operationId', 'revision', 'currentRevision', 'runId', 'owner_synth', 'project_synth']) {
    assert.ok(!text.includes(needle), `neutral denial leaked ${needle}`);
  }
  // A FOREIGN_DENIED principal is denied even on its own owner-scoped resource.
  const ownForeign = await ctx.call('PATCH', PROJECT_PATH('project_synth_foreign'), ctx.foreign, {
    body: patchBody(ctx, ACTION.RENAME, { name: 'foreign own' }), ifMatch: '"rev_whatever_000000"',
  });
  assert.equal(ownForeign.status, 403);
  assert.equal(ownForeign.body.error.code, 'NOT_AVAILABLE');
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
});

test('Q3-08 no route discloses revision or ledger material to an unauthorized caller', async (t) => {
  const ctx = await startServer(t);
  const body = readingStatusBody(ctx.runId, 'Read');
  const targets = [
    [READING_STATUS_PATH(XFAKE001), ctx.foreign],
    [READING_STATUS_PATH(['user', 'fakeLib01', 'XFAKE999']), ctx.owner],
  ];
  for (const [path, creds] of targets) {
    const res = await ctx.call('PATCH', path, creds, { body, ifMatch: '"rev_whatever_000000"' });
    assert.equal(res.status, 403);
    for (const key of ['revision', 'currentRevision', 'operationId', 'runId']) {
      assert.ok(!(key in res.body), `${path} leaked ${key}`);
    }
  }
  assert.equal(ctx.srv.control.ledgerSize(), 0);
});

test('zz request tally for this file stays within the 5000-request per-instance budget', (t) => {
  const n = requestTally();
  t.diagnostic(`WP03_LOCAL_REQUESTS file=auth-negative n=${n}`);
  assert.ok(n <= 5000);
});
