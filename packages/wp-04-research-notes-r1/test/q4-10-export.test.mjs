// Q4-10: saved-version export. Exact DESIGN §5 template bytes, verbatim field insertion, omitted
// missing metadata, metadata escaping, filename sanitization (reserved names, 120-byte cap, empty
// title fallback), RFC 5987 `filename*`, no mutation, absent note 409 and byte-identical repeated
// export. A local/unsaved draft can never be exported and an export never changes a revision.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  startServer, requestTally, noteBody, fieldsWith, emptyNoteFields, fixtureNoteFields, RESEARCH_NOTE_PATH,
  RESEARCH_NOTE_EXPORT_PATH, XFAKE001, XFAKE002, OWNER_SCOPE,
} from '../support/harness.mjs';
import {
  buildResearchNoteMarkdown, contentDisposition, exportFilename, safeTitle, escapeMarkdownMetadata,
  asciiFallbackFilename, percentEncodeFilename, MAX_SAFE_TITLE_BYTES,
} from '../src/export.mjs';

function revisionOf(ctx) { return ctx.srv.control.note([OWNER_SCOPE, ...XFAKE001]).revision; }

function update(ctx, fields, operationId, ifMatch = `"${revisionOf(ctx)}"`) {
  return ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE001), ctx.owner, {
    body: noteBody(ctx.runId, fields, operationId), ifMatch,
  });
}

function expectedFixtureExport(wp02, fields) {
  const paper = wp02.papers.find((p) => p.libraryType === 'user' && p.libraryId === 'fakeLib01' && p.itemKey === 'XFAKE001');
  const authors = paper.creators.map(escapeMarkdownMetadata).join('; ');
  return `# ${escapeMarkdownMetadata(paper.title)}\n\n- **Authors:** ${authors}\n- **Year:** ${paper.year}\n- **DOI:** ${escapeMarkdownMetadata(paper.doi)}\n\n`
    + `## Research Question\n\n${fields.researchQuestion}\n\n`
    + `## Arguments & Content\n\n${fields.argumentsAndContent}\n\n`
    + `## Theories & Methods\n\n${fields.theoriesAndMethods}\n\n`
    + `## Contributions & Innovations\n\n${fields.contributionsAndInnovations}\n\n`
    + `## Limitations\n\n${fields.limitations}\n`;
}

test('Q4-10 the saved fixture note exports exactly the DESIGN §5 template bytes and headers', async (t) => {
  const ctx = await startServer(t);
  const fields = fixtureNoteFields(ctx.wp02);
  const r = await ctx.get(RESEARCH_NOTE_EXPORT_PATH(XFAKE001), ctx.owner);
  assert.equal(r.status, 200);
  const expected = expectedFixtureExport(ctx.wp02, fields);
  assert.equal(r.rawBody.toString('utf8'), expected);
  assert.equal(r.headers['content-type'], 'text/markdown; charset=utf-8');
  assert.equal(r.headers['content-disposition'],
    'attachment; filename="Synthetic_Shared_Paper_XFAKE001.md"; filename*=UTF-8\'\'Synthetic_Shared_Paper_XFAKE001.md');
  assert.equal(r.headers['cache-control'], 'no-store');
  assert.equal(r.headers.etag, undefined);
  assert.ok(expected.includes('- **Authors:** Doe, Jane; 李, 四'));
  assert.ok(expected.includes('- **Year:** 2029'));
  assert.ok(expected.includes('- **DOI:** 10.0000/fake.shared'));
  assert.ok(expected.includes('## Arguments & Content'));
  assert.ok(expected.includes('## Contributions & Innovations'));
  // The fixture CRLF is inserted verbatim, not converted to LF.
  assert.ok(expected.includes('\r\n'));
});

test('Q4-10 absent notes have no export (409 NO_SAVED_NOTE), including a create that stayed UNKNOWN', async (t) => {
  const ctx = await startServer(t);
  const absent = await ctx.get(RESEARCH_NOTE_EXPORT_PATH(XFAKE002), ctx.owner);
  assert.equal(absent.status, 409);
  assert.equal(absent.body.error.code, 'NO_SAVED_NOTE');
  assert.equal(absent.body.outcome, 'CONFLICT');
  assert.equal(absent.body.dispatched, false);
  assert.match(absent.headers['content-type'], /^application\/json/);
  assert.ok(!absent.rawBody.toString('utf8').startsWith('# '));
  ctx.srv.control.setNextFault('accepted_not_committed');
  const attempted = await ctx.call('PUT', RESEARCH_NOTE_PATH(XFAKE002), ctx.owner, {
    body: noteBody(ctx.runId, fieldsWith({ researchQuestion: 'local draft only' }), 'op_export_draft_00001'),
    ifNoneMatch: '*',
  });
  assert.equal(attempted.status, 202);
  const stillAbsent = await ctx.get(RESEARCH_NOTE_EXPORT_PATH(XFAKE002), ctx.owner);
  assert.equal(stillAbsent.status, 409);
  assert.equal(stillAbsent.body.error.code, 'NO_SAVED_NOTE');
});

test('Q4-10 export is the saved version only: an UNKNOWN update never leaks an unsaved body', async (t) => {
  const ctx = await startServer(t);
  const before = await ctx.get(RESEARCH_NOTE_EXPORT_PATH(XFAKE001), ctx.owner);
  assert.equal(before.status, 200);
  const savedRevision = revisionOf(ctx);
  ctx.srv.control.setNextFault('accepted_not_committed');
  const unsaved = await update(ctx, fieldsWith({ researchQuestion: 'UNSAVED DRAFT MUST NOT EXPORT' }), 'op_export_unsaved_0001');
  assert.equal(unsaved.status, 202);
  const after = await ctx.get(RESEARCH_NOTE_EXPORT_PATH(XFAKE001), ctx.owner);
  assert.equal(after.status, 200);
  assert.deepEqual(after.rawBody, before.rawBody);
  assert.equal(revisionOf(ctx), savedRevision);
  assert.ok(!after.rawBody.toString('utf8').includes('UNSAVED DRAFT MUST NOT EXPORT'));
});

test('Q4-10 metadata lines with no value are omitted and an empty field still yields its heading', () => {
  const markdown = buildResearchNoteMarkdown({
    title: 'Only Title', creators: [], year: null, doi: '', fields: emptyNoteFields(),
  });
  assert.ok(markdown.startsWith('# Only Title\n\n\n## Research Question\n\n\n\n## Arguments & Content'));
  assert.ok(!markdown.includes('**Authors:**'));
  assert.ok(!markdown.includes('**Year:**'));
  assert.ok(!markdown.includes('**DOI:**'));
  assert.equal((markdown.match(/^## /gm) || []).length, 5);
  assert.ok(markdown.endsWith('## Limitations\n\n\n'));
  assert.equal(markdown.slice(-1), '\n', 'exactly one trailing LF');
});

test('Q4-10 title, creator and DOI metadata are escaped while field text is never escaped', () => {
  assert.equal(escapeMarkdownMetadata('plain'), 'plain');
  assert.equal(escapeMarkdownMetadata('# heading'), '\\# heading');
  assert.equal(escapeMarkdownMetadata('> quote'), '\\> quote');
  assert.equal(escapeMarkdownMetadata('a*b_c[d]e<f>g|h'), 'a\\*b\\_c\\[d\\]e\\<f\\>g\\|h');
  assert.equal(escapeMarkdownMetadata('a`b'), 'a\\`b');
  assert.equal(escapeMarkdownMetadata('a\\b'), 'a\\\\b');
  assert.equal(escapeMarkdownMetadata('- minus'), '\\- minus');
  assert.equal(escapeMarkdownMetadata('+ plus'), '\\+ plus');
  assert.equal(escapeMarkdownMetadata('1. ordered'), '1\\. ordered');
  assert.equal(escapeMarkdownMetadata('a\u0001b'), 'ab');
  const markdown = buildResearchNoteMarkdown({
    title: '# Title', creators: ['- author', '1. author'], year: 2030, doi: '`doi`',
    fields: fieldsWith({ researchQuestion: '*not escaped* _verbatim_' }),
  });
  assert.ok(markdown.startsWith('# \\# Title\n\n'));
  assert.ok(markdown.includes('- **Authors:** \\- author; 1\\. author'));
  assert.ok(markdown.includes('- **DOI:** \\`doi\\`'));
  assert.ok(markdown.includes('*not escaped* _verbatim_'), 'field text is inserted verbatim');
});

test('Q4-10 filename sanitization covers invalid characters, leading dots, reserved names, the 120-byte cap and the empty-title fallback', () => {
  assert.equal(exportFilename('Synthetic Shared Paper', 'XFAKE001'), 'Synthetic_Shared_Paper_XFAKE001.md');
  assert.equal(exportFilename('a/b\\c:d*e?f"g<h>i|j', 'KEY'), 'a_b_c_d_e_f_g_h_i_j_KEY.md');
  assert.equal(exportFilename('..hidden', 'KEY'), '_hidden_KEY.md');
  assert.equal(exportFilename('Trailing...', 'KEY'), 'Trailing_KEY.md');
  assert.equal(exportFilename('a\u0001b', 'KEY'), 'a_b_KEY.md');
  for (const name of ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM9', 'LPT1', 'LPT9']) {
    assert.equal(exportFilename(name, 'KEY'), `_${name}_KEY.md`, name);
  }
  assert.equal(exportFilename('con', 'KEY'), '_con_KEY.md');
  const long = '研'.repeat(100);
  const safeLong = safeTitle(long);
  assert.equal(Buffer.byteLength(safeLong, 'utf8'), MAX_SAFE_TITLE_BYTES);
  assert.equal([...safeLong].length, 40);
  assert.equal(exportFilename(long, 'KEY'), `${safeLong}_KEY.md`);
  const boundary = '研'.repeat(39) + 'éxy';
  const safeBoundary = safeTitle(boundary);
  assert.equal(Buffer.byteLength(safeBoundary, 'utf8'), 120, 'never splits a code point to exceed the cap');
  assert.ok(safeBoundary.endsWith('x'));
  assert.ok(!safeBoundary.endsWith('y'));
  assert.equal(exportFilename('', 'XFAKE001'), 'research-note_XFAKE001.md');
  assert.equal(exportFilename(undefined, 'XFAKE001'), 'research-note_XFAKE001.md');
  assert.equal(exportFilename('   ', 'XFAKE001'), 'research-note_XFAKE001.md');
});

test('Q4-10 the Content-Disposition ASCII fallback and RFC 5987 filename* encode a Unicode filename', () => {
  assert.equal(asciiFallbackFilename('综述_X.md'), '__X.md');
  assert.equal(percentEncodeFilename('a b'), 'a%20b');
  assert.equal(percentEncodeFilename("(x)'*"), '%28x%29%27%2A');
  assert.equal(contentDisposition('综述_X.md'),
    'attachment; filename="__X.md"; filename*=UTF-8\'\'%E7%BB%BC%E8%BF%B0_X.md');
});

test('Q4-10 repeated export is byte-identical and export never mutates the note, the state digest or the ledger', async (t) => {
  const ctx = await startServer(t);
  const first = await ctx.get(RESEARCH_NOTE_EXPORT_PATH(XFAKE001), ctx.owner);
  const digest = ctx.srv.control.stateDigest();
  const ledger = ctx.srv.control.ledgerDigest();
  const revision = revisionOf(ctx);
  const second = await ctx.get(RESEARCH_NOTE_EXPORT_PATH(XFAKE001), ctx.owner);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.deepEqual(first.rawBody, second.rawBody);
  assert.equal(ctx.srv.control.stateDigest(), digest);
  assert.equal(ctx.srv.control.ledgerDigest(), ledger);
  assert.equal(revisionOf(ctx), revision);
  assert.equal(ctx.srv.control.ledgerSize(), 0);
});

test('Q4-10 an empty-field update is exported with every heading present, one blank line per empty field', async (t) => {
  const ctx = await startServer(t);
  assert.equal((await update(ctx, emptyNoteFields(), 'op_export_empty_00001')).status, 200);
  const r = await ctx.get(RESEARCH_NOTE_EXPORT_PATH(XFAKE001), ctx.owner);
  assert.equal(r.status, 200);
  const text = r.rawBody.toString('utf8');
  assert.equal((text.match(/^## /gm) || []).length, 5, 'empty fields are not omitted');
  assert.ok(text.includes('## Research Question\n\n\n\n## Arguments & Content'));
  assert.ok(text.includes('## Limitations\n\n\n'));
  assert.equal(text.slice(-1), '\n');
});

test('zz request tally for this file stays within the 5000-request per-instance budget', (t) => {
  const n = requestTally();
  t.diagnostic(`WP04_LOCAL_REQUESTS file=q4-10 n=${n}`);
  assert.ok(n <= 5000);
});
