// Q4-08: authorization, CSRF, Origin/Fetch-Metadata, media type and body hygiene negatives. All are
// decided before dispatch. Workspace is read-only (note GET allowed, write and export denied);
// foreign and missing tuples receive byte-identical neutral 403s with no revision or ledger
// disclosure.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  startServer, requestTally, noteBody, fieldsWith, browserHeaders, RESEARCH_NOTE_PATH,
  RESEARCH_NOTE_EXPORT_PATH, XFAKE001, XFAKE002, XFOREIGN1, OWNER_SCOPE, APP_ORIGIN, EVIL_ORIGIN,
} from '../support/harness.mjs';

function revisionOf(ctx) { return ctx.srv.control.note([OWNER_SCOPE, ...XFAKE001]).revision; }

function rawPut(ctx, { extraHeaders = [], body, path = RESEARCH_NOTE_PATH(XFAKE001), cookie, csrf = 'normal' } = {}) {
  const csrfToken = csrf === 'normal' ? ctx.owner.csrfToken : csrf;
  const lines = [
    `PUT ${path} HTTP/1.1`,
    'Host: 127.0.0.1',
    `Origin: ${APP_ORIGIN}`,
    'Sec-Fetch-Site: same-site',
    'Content-Type: application/json',
    `Cookie: __Host-lms_session=${cookie || ctx.owner.cookieValue}`,
    ...(csrfToken === null ? [] : [`X-CSRF-Token: ${csrfToken}`]),
    `If-Match: "${revisionOf(ctx)}"`,
    ...extraHeaders,
    `Content-Length: ${Buffer.byteLength(body)}`,
    'Connection: close',
    '',
    body,
  ].join('\r\n');
  return ctx.rawClient.raw(lines);
}

test('Q4-08 Workspace may read a note but is denied every write and the export with neutral denials', async (t) => {
  const ctx = await startServer(t);
  const digest = ctx.srv.control.stateDigest();
  const read = await ctx.get(RESEARCH_NOTE_PATH(XFAKE001), ctx.workspace);
  assert.equal(read.status, 200);
  assert.equal(read.body.exists, true);
  const write = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.workspace, {
    body: noteBody(ctx.runId, fieldsWith({ researchQuestion: 'workspace write' })),
    ifMatch: `"${revisionOf(ctx)}"`,
  });
  assert.equal(write.status, 403);
  assert.equal(write.body.error.code, 'WORKSPACE_READ_ONLY');
  assert.equal(write.body.dispatched, false);
  const exportDenied = await ctx.get(RESEARCH_NOTE_EXPORT_PATH(XFAKE001), ctx.workspace);
  assert.equal(exportDenied.status, 403);
  assert.equal(exportDenied.body.error.code, 'NOT_AVAILABLE');
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
});

test('Q4-08 missing, revoked, expired and invalid Sessions are 401 on writes; anonymous reads stay neutral', async (t) => {
  const ctx = await startServer(t);
  const body = noteBody(ctx.runId, fieldsWith({ researchQuestion: 'session' }), 'op_session_negative_01');
  const cases = [
    [ctx.revoked, 'SESSION_REVOKED'],
    [ctx.expired, 'SESSION_EXPIRED'],
    [{ cookieValue: 'not-a-real-session-token', csrfToken: ctx.owner.csrfToken }, 'SESSION_INVALID'],
    [undefined, 'AUTH_REQUIRED'],
  ];
  for (const [creds, code] of cases) {
    const res = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), creds, { body, ifMatch: `"${revisionOf(ctx)}"` });
    assert.equal(res.status, 401, code);
    assert.equal(res.body.error.code, code);
    assert.equal(res.body.dispatched, false);
  }
  const anonymousNote = await ctx.get(RESEARCH_NOTE_PATH(XFAKE001), undefined);
  assert.equal(anonymousNote.status, 403);
  assert.equal(anonymousNote.body.error.code, 'NOT_AVAILABLE');
  const anonymousExport = await ctx.get(RESEARCH_NOTE_EXPORT_PATH(XFAKE001), undefined);
  assert.equal(anonymousExport.status, 403);
  assert.equal(anonymousExport.body.error.code, 'NOT_AVAILABLE');
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q4-08 missing or wrong CSRF, duplicate CSRF and an ambiguous Cookie header are rejected before dispatch', async (t) => {
  const ctx = await startServer(t);
  const body = JSON.stringify(noteBody(ctx.runId, fieldsWith({ researchQuestion: 'csrf' }), 'op_csrf_negative_0001'));
  for (const csrf of ['wrong-token-value', null]) {
    const res = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, {
      body: JSON.parse(body), csrf, ifMatch: `"${revisionOf(ctx)}"`,
    });
    assert.equal(res.status, 403, String(csrf));
    assert.equal(res.body.error.code, 'CSRF_DENIED');
    assert.equal(res.body.dispatched, false);
  }
  const duplicateCsrf = (await rawPut(ctx, {
    body, extraHeaders: [`X-CSRF-Token: ${ctx.owner.csrfToken}`],
  })).toString('latin1');
  assert.match(duplicateCsrf, /^HTTP\/1\.1 403 /);
  assert.match(duplicateCsrf, /CSRF_DENIED/);
  const ambiguousCookie = (await rawPut(ctx, {
    body, extraHeaders: [`Cookie: __Host-lms_session=${ctx.owner.cookieValue}`],
  })).toString('latin1');
  assert.match(ambiguousCookie, /^HTTP\/1\.1 401 /);
  assert.match(ambiguousCookie, /SESSION_INVALID/);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
});

test('Q4-08 missing/wrong Origin and missing/cross-site Fetch Metadata are denied before dispatch', async (t) => {
  const ctx = await startServer(t);
  const revision = `"${revisionOf(ctx)}"`;
  const body = noteBody(ctx.runId, fieldsWith({ researchQuestion: 'origin' }), 'op_origin_negative_001');
  const missingOrigin = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, { body, origin: null, ifMatch: revision });
  assert.equal(missingOrigin.status, 403);
  assert.equal(missingOrigin.body.error.code, 'ORIGIN_DENIED');
  const evilOrigin = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, { body, origin: EVIL_ORIGIN, ifMatch: revision });
  assert.equal(evilOrigin.status, 403);
  assert.equal(evilOrigin.body.error.code, 'ORIGIN_DENIED');
  const noFetch = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, { body, fetchSite: null, ifMatch: revision });
  assert.equal(noFetch.status, 403);
  assert.equal(noFetch.body.error.code, 'FETCH_METADATA_DENIED');
  const crossSite = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, { body, fetchSite: 'cross-site', ifMatch: revision });
  assert.equal(crossSite.status, 403);
  assert.equal(crossSite.body.error.code, 'FETCH_METADATA_DENIED');
  const duplicateOrigin = (await rawPut(ctx, {
    body: JSON.stringify(body), extraHeaders: [`Origin: ${APP_ORIGIN}`],
  })).toString('latin1');
  assert.match(duplicateOrigin, /^HTTP\/1\.1 403 /);
  assert.match(duplicateOrigin, /ORIGIN_DENIED/);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q4-08 wrong media type and malformed, duplicate-key, prototype and non-UTF-8 bodies fail closed', async (t) => {
  const ctx = await startServer(t);
  const revision = `"${revisionOf(ctx)}"`;
  const valid = JSON.stringify(noteBody(ctx.runId, fieldsWith({ researchQuestion: 'body' }), 'op_body_negative_0001'));
  const wrongType = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, {
    rawBody: Buffer.from(valid), extraHeaders: { 'Content-Type': 'text/plain' }, ifMatch: revision,
  });
  assert.equal(wrongType.status, 415);
  assert.equal(wrongType.body.error.code, 'UNSUPPORTED_MEDIA_TYPE');
  const malformed = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, {
    rawBody: Buffer.from('{'), ifMatch: revision,
  });
  assert.equal(malformed.status, 400);
  assert.equal(malformed.body.error.code, 'BAD_JSON');
  const duplicate = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, {
    rawBody: Buffer.from(`{"operationId":"op_duplicate_key_001","operationId":"op_duplicate_key_001","modelRunId":"${ctx.runId}","scope":"GLOBAL_PAPER","fields":{}}`),
    ifMatch: revision,
  });
  assert.equal(duplicate.status, 422);
  assert.equal(duplicate.body.error.code, 'DUPLICATE_FIELD');
  const prototype = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, {
    rawBody: Buffer.from('{"__proto__":{"polluted":1},"operationId":"op_prototype_000001"}'), ifMatch: revision,
  });
  assert.equal(prototype.status, 400);
  assert.equal(prototype.body.error.code, 'FORBIDDEN_KEY');
  const badUtf8 = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, {
    rawBody: Buffer.from([0x7b, 0xff, 0xfe, 0x7d]), ifMatch: revision,
  });
  assert.equal(badUtf8.status, 422);
  assert.equal(badUtf8.body.error.code, 'INVALID_TEXT');
  assert.equal({}.polluted, undefined);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q4-08 forged owner/role/revision/fault/saved fields cannot enable or override anything', async (t) => {
  const ctx = await startServer(t);
  const revision = `"${revisionOf(ctx)}"`;
  const digest = ctx.srv.control.stateDigest();
  const forgedFields = [
    ['ownerId', 'owner_synth_foreign'], ['role', 'OWNER'], ['revision', 'rev_forged_000000'],
    ['stepUp', 'GRANTED'], ['confirmation', 'CONFIRMED'], ['riskTier', 'LOW'],
    ['fault', 'model_ack'], ['scenario', 'model_ack'], ['saved', true], ['durable', true], ['dispatched', true],
  ];
  for (const [field, value] of forgedFields) {
    const body = { ...noteBody(ctx.runId, fieldsWith({ researchQuestion: 'forged' }), 'op_forged_field_0001'), [field]: value };
    const r = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, { body, ifMatch: revision });
    assert.equal(r.status, 400, field);
    assert.equal(r.body.error.code, 'UNKNOWN_FIELD', field);
    assert.equal(r.body.dispatched, false, field);
  }
  const extraNoteField = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, {
    body: { ...noteBody(ctx.runId, fieldsWith({ researchQuestion: 'forged' }), 'op_forged_field_0002'), fields: { ...fieldsWith({ researchQuestion: 'forged' }), ownerId: 'x' } },
    ifMatch: revision,
  });
  assert.equal(extraNoteField.status, 422);
  assert.equal(extraNoteField.body.error.code, 'INVALID_FIELDS');
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
});

test('Q4-08 valid foreign and missing targets receive byte-identical neutral 403s with stable headers and no disclosure', async (t) => {
  const ctx = await startServer(t);
  const missingTuple = ['user', 'fakeLib01', 'XFAKE999'];
  const noteHeaders = browserHeaders({ cookie: ctx.owner.cookieValue });
  const missingNote = await ctx.rawClient.request('GET', RESEARCH_NOTE_PATH(missingTuple), { headers: noteHeaders });
  const foreignNote = await ctx.rawClient.request('GET', RESEARCH_NOTE_PATH(XFOREIGN1), { headers: noteHeaders });
  assert.equal(missingNote.status, 403);
  assert.equal(foreignNote.status, 403);
  assert.deepEqual(missingNote.rawBody, foreignNote.rawBody, 'the neutral denial body is byte-identical');
  const stable = ['content-type', 'content-length', 'cache-control', 'x-content-type-options', 'vary'];
  for (const header of stable) assert.equal(missingNote.headers[header], foreignNote.headers[header], header);
  assert.equal(missingNote.headers.etag, undefined);
  assert.equal(missingNote.headers.location, undefined);
  const text = missingNote.rawBody.toString('utf8');
  for (const needle of ['operationId', 'revision', 'currentRevision', 'runId', 'owner_synth', 'fakeLib']) {
    assert.ok(!text.includes(needle), `neutral denial leaked ${needle}`);
  }

  const putBody = noteBody(ctx.runId, fieldsWith({ researchQuestion: 'neutral' }), 'op_neutral_put_000001');
  const putHeaders = browserHeaders({
    cookie: ctx.owner.cookieValue, csrf: ctx.owner.csrfToken, extra: { 'If-Match': '"rev_whatever_000000"' },
  });
  const missingPut = await ctx.rawClient.request('PUT', RESEARCH_NOTE_PATH(missingTuple), { headers: putHeaders, body: putBody });
  const foreignPut = await ctx.rawClient.request('PUT', RESEARCH_NOTE_PATH(XFOREIGN1), { headers: putHeaders, body: putBody });
  assert.equal(missingPut.status, 403);
  assert.equal(foreignPut.status, 403);
  assert.deepEqual(missingPut.rawBody, foreignPut.rawBody);

  const missingExport = await ctx.rawClient.request('GET', RESEARCH_NOTE_EXPORT_PATH(missingTuple), { headers: noteHeaders });
  const foreignExport = await ctx.rawClient.request('GET', RESEARCH_NOTE_EXPORT_PATH(XFOREIGN1), { headers: noteHeaders });
  assert.equal(missingExport.status, 403);
  assert.equal(foreignExport.status, 403);
  assert.deepEqual(missingExport.rawBody, foreignExport.rawBody);

  // Workspace export of an existing note is the same neutral denial as a missing target.
  const wsHeaders = browserHeaders({ cookie: ctx.workspace.cookieValue });
  const workspaceExport = await ctx.rawClient.request('GET', RESEARCH_NOTE_EXPORT_PATH(XFAKE001), { headers: wsHeaders });
  const workspaceMissing = await ctx.rawClient.request('GET', RESEARCH_NOTE_EXPORT_PATH(missingTuple), { headers: wsHeaders });
  assert.equal(workspaceExport.status, 403);
  assert.equal(workspaceMissing.status, 403);
  assert.deepEqual(workspaceExport.rawBody, workspaceMissing.rawBody);

  // A FOREIGN_DENIED principal is denied even on its own owner-scoped paper.
  const foreignOwn = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFOREIGN1), ctx.foreign, {
    body: noteBody(ctx.runId, fieldsWith({ researchQuestion: 'foreign own' }), 'op_neutral_foreign_01'),
    ifMatch: '"rev_whatever_000000"',
  });
  assert.equal(foreignOwn.status, 403);
  assert.equal(foreignOwn.body.error.code, 'NOT_AVAILABLE');
  assert.equal(ctx.srv.control.stats().dispatches, 0);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
});

test('zz request tally for this file stays within the 5000-request per-instance budget', (t) => {
  const n = requestTally();
  t.diagnostic(`WP04_LOCAL_REQUESTS file=q4-08 n=${n}`);
  assert.ok(n <= 5000);
});
