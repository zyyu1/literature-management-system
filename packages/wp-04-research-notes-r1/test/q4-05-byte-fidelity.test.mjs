// Q4-05: byte fidelity. Every accepted field is stored and returned byte-identically after JSON
// decoding: no Unicode normalization, trimming, newline conversion, tab expansion, HTML conversion
// or default text. Only lone surrogates / invalid UTF-8 (422), U+0000 (422) and the 16 KiB per-field
// / 48 KiB total size limits (413) are rejected.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  startServer, requestTally, noteBody, fieldsWith, emptyNoteFields, RESEARCH_NOTE_PATH,
  XFAKE001, OWNER_SCOPE,
} from '../support/harness.mjs';

function revisionOf(ctx) { return ctx.srv.control.note([OWNER_SCOPE, ...XFAKE001]).revision; }

function update(ctx, fields, operationId) {
  return ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, {
    body: noteBody(ctx.runId, fields, operationId), ifMatch: `"${revisionOf(ctx)}"`,
  });
}

const VECTOR = Object.freeze({
  researchQuestion: '合成问题 e\u0301 (combining) and é (precomposed) 🧪 $x^2$ $$\\sum_{i=1}^{n} x_i$$ \\(a+b\\)\nsecond line',
  argumentsAndContent: 'fenced:\n```js\nconst x = 1;\n```\nTAB:\there\r\nCRLF\rCR\nLF trailing   ',
  theoriesAndMethods: '',
  contributionsAndInnovations: 'A\u030A vs Å; emoji 👩🏽‍🚀; math $\\alpha$',
  limitations: 'CRLF\r\nCR\rLF\nend',
});

test('Q4-05 byte fidelity round-trip preserves CJK, combining marks, emoji, LaTeX, tabs, CRLF/CR/LF, trailing spaces and empty fields', async (t) => {
  const ctx = await startServer(t);
  const r = await update(ctx, VECTOR);
  assert.equal(r.status, 200);
  const readBack = await ctx.get(RESEARCH_NOTE_PATH(XFAKE001), ctx.owner);
  assert.equal(readBack.status, 200);
  assert.deepEqual(readBack.body.fields, VECTOR);
  for (const key of Object.keys(VECTOR)) {
    assert.equal(Buffer.byteLength(readBack.body.fields[key], 'utf8'), Buffer.byteLength(VECTOR[key], 'utf8'), key);
  }
  // No NFC/NFD normalization: the decomposed sequence and the composed character stay distinct.
  assert.ok(readBack.body.fields.researchQuestion.includes('e\u0301'));
  assert.ok(readBack.body.fields.researchQuestion.includes('é'));
  assert.notEqual(readBack.body.fields.researchQuestion, readBack.body.fields.researchQuestion.normalize('NFC'));
  assert.ok(readBack.body.fields.limitations.includes('\r\n'));
  assert.ok(readBack.body.fields.limitations.includes('\r'));
  assert.ok(readBack.body.fields.limitations.includes('\n'));
  assert.ok(readBack.body.fields.argumentsAndContent.includes('\there'));
  assert.ok(readBack.body.fields.argumentsAndContent.endsWith('trailing   '));
  // The saved-version export inserts each field verbatim, including CRLF.
  const exported = await ctx.get(`${RESEARCH_NOTE_PATH(XFAKE001)}/export`, ctx.owner);
  assert.equal(exported.status, 200);
  const text = exported.rawBody.toString('utf8');
  for (const key of Object.keys(VECTOR)) {
    if (VECTOR[key] !== '') assert.ok(text.includes(VECTOR[key]), `export contains ${key} verbatim`);
  }
});

test('Q4-05 lone surrogates, U+0000 and oversize field text are rejected without changing saved bytes', async (t) => {
  const ctx = await startServer(t);
  const ifMatch = `"${revisionOf(ctx)}"`;
  const digest = ctx.srv.control.stateDigest();
  const ledger = ctx.srv.control.ledgerSize();

  const loneBody = noteBody(ctx.runId, fieldsWith({ researchQuestion: '\ud800' }), 'op_lone_surrogate_01');
  const lone = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, {
    rawBody: Buffer.from(JSON.stringify(loneBody)), ifMatch,
  });
  assert.equal(lone.status, 422);
  assert.equal(lone.body.error.code, 'INVALID_TEXT');
  assert.equal(lone.body.dispatched, false);

  const nul = await update(ctx, fieldsWith({ researchQuestion: 'a\u0000b' }), 'op_nul_text_000001');
  assert.equal(nul.status, 422);
  assert.equal(nul.body.error.code, 'INVALID_TEXT');

  const tooBigField = await update(ctx, fieldsWith({ researchQuestion: 'a'.repeat(16 * 1024 + 1) }), 'op_big_field_000001');
  assert.equal(tooBigField.status, 413);
  assert.equal(tooBigField.body.error.code, 'TEXT_TOO_LARGE');

  const tooBigTotal = fieldsWith({
    researchQuestion: 'b'.repeat(10000),
    argumentsAndContent: 'b'.repeat(10000),
    theoriesAndMethods: 'b'.repeat(10000),
    contributionsAndInnovations: 'b'.repeat(10000),
    limitations: 'b'.repeat(10000),
  });
  const bigTotal = await update(ctx, tooBigTotal, 'op_big_total_000001');
  assert.equal(bigTotal.status, 413);
  assert.equal(bigTotal.body.error.code, 'TEXT_TOO_LARGE');

  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.ledgerSize(), ledger);
  assert.equal(ctx.srv.control.stats().dispatches, 0);

  // Exactly 16 KiB in one field (and therefore below the 48 KiB total) is accepted byte-exactly.
  const limitFields = fieldsWith({ researchQuestion: 'c'.repeat(16 * 1024) });
  const exact = await update(ctx, limitFields, 'op_exact_field_00001');
  assert.equal(exact.status, 200);
  const readBack = await ctx.get(RESEARCH_NOTE_PATH(XFAKE001), ctx.owner);
  assert.equal(Buffer.byteLength(readBack.body.fields.researchQuestion, 'utf8'), 16 * 1024);
});

test('Q4-05 invalid UTF-8 request bytes are rejected as 422 INVALID_TEXT before JSON parsing', async (t) => {
  const ctx = await startServer(t);
  const ifMatch = `"${revisionOf(ctx)}"`;
  const digest = ctx.srv.control.stateDigest();
  const invalid = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, {
    rawBody: Buffer.from([0x7b, 0xff, 0xfe, 0x7d]), ifMatch,
  });
  assert.equal(invalid.status, 422);
  assert.equal(invalid.body.error.code, 'INVALID_TEXT');
  assert.equal(invalid.body.dispatched, false);
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.stats().dispatches, 0);
});

test('Q4-05 other C0 control characters are preserved verbatim rather than silently rejected or rewritten', async (t) => {
  const ctx = await startServer(t);
  const fields = fieldsWith({ researchQuestion: 'a\u0001b\tc\r\nd' });
  const r = await update(ctx, fields, 'op_control_chars_0001');
  assert.equal(r.status, 200);
  const readBack = await ctx.get(RESEARCH_NOTE_PATH(XFAKE001), ctx.owner);
  assert.equal(readBack.body.fields.researchQuestion, 'a\u0001b\tc\r\nd');
});

test('zz request tally for this file stays within the 5000-request per-instance budget', (t) => {
  const n = requestTally();
  t.diagnostic(`WP04_LOCAL_REQUESTS file=q4-05 n=${n}`);
  assert.ok(n <= 5000);
});
