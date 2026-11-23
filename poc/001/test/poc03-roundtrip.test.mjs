// POC-03 — JSON/Markdown round trip with Unicode, math, code (LOCAL MOCK).
import test from 'node:test';
import assert from 'node:assert/strict';
import { startStack, syntheticNote, syntheticItemKey } from './helpers.mjs';
import { NOTE_FIELDS, renderMarkdown, parseMarkdown, literatureId, encodeEnvelope, decodeEnvelope } from '../src/note-codec.mjs';
import { sha256Hex } from '../src/util.mjs';

const fieldDigests = (n) => Object.fromEntries(NOTE_FIELDS.map(([k]) => [k, sha256Hex(Buffer.from(n[k], 'utf8'))]));

test('POC-03 codec: Markdown export parses back byte-identical for all five fields', () => {
  for (let v = 0; v < 4; v++) {
    const note = syntheticNote(9000001, syntheticItemKey(), v);
    const md = renderMarkdown(note);
    assert.match(md, /## Research Question/);
    assert.match(md, /## Limitations/);
    const back = parseMarkdown(md);
    assert.deepEqual(back, note);
    assert.deepEqual(fieldDigests(back), fieldDigests(note));
    assert.equal(renderMarkdown(back), md, 'deterministic export');
  }
  const note = syntheticNote();
  assert.notEqual(note.contributions.normalize('NFC'), note.contributions, 'fixture deliberately contains non-NFC text');
  assert.equal(parseMarkdown(renderMarkdown(note)).contributions, note.contributions, 'no Unicode normalization applied');
  const tampered = renderMarkdown(note).replace('论点 A', '论点 X');
  assert.throws(() => parseMarkdown(tampered), /digest mismatch|missing end/, 'tampering detected, never silently accepted');
});

test('POC-03 envelope round trip through API and storage is byte-exact', async (t) => {
  const s = await startStack();
  t.after(() => s.stop());
  const note = syntheticNote();
  const put = await s.client.put('notes', note.literatureId, note, '*');
  assert.equal(put.data.outcome, 'saved');
  const stored = s.mock.files.get(`/lms-poc/${s.namespace}/notes/${note.literatureId}.json`);
  assert.equal(sha256Hex(stored.bytes), put.data.sha256, 'storage holds exactly the bytes the API hashed');
  const env = decodeEnvelope(stored.bytes);
  assert.deepEqual(env.data, note);
  assert.equal(sha256Hex(encodeEnvelope({ kind: 'notes', id: note.literatureId, operationId: env.operationId, data: env.data, provenance: env.provenance })), put.data.sha256);
  const got = await s.client.get('notes', note.literatureId);
  assert.deepEqual(fieldDigests(got.data.record), fieldDigests(note));
  const md = await s.client.markdown('notes', note.literatureId);
  assert.equal(md.status, 200);
  assert.deepEqual(parseMarkdown(md.data), note, 'API Markdown export parses back to stored record');
  assert.ok(Buffer.byteLength(JSON.stringify(note)) > 15_000, 'long-text fixture exercised');
});

test('POC-03 identity: Zotero library+key mapping is unique; duplicate create refused', async (t) => {
  assert.equal(literatureId(9000001, 'SABC1234'), 'lit-9000001-sabc1234');
  assert.notEqual(literatureId(9000001, 'SABC1234'), literatureId(9000002, 'SABC1234'));
  assert.throws(() => literatureId(9000001, 'sabc1234'), /invalid zotero identity/);
  assert.throws(() => literatureId('../1', 'SABC1234'), /invalid zotero identity/);
  const s = await startStack();
  t.after(() => s.stop());
  const note = syntheticNote();
  assert.equal((await s.client.put('notes', note.literatureId, note, '*')).data.outcome, 'saved');
  const dup = await s.client.put('notes', note.literatureId, { ...note, question: 'duplicate' }, '*');
  assert.equal(dup.status, 412);
  assert.equal(dup.data.outcome, 'conflict');
  assert.deepEqual((await s.client.get('notes', note.literatureId)).data.record, note, 'original kept');
  const proj = { projectId: 'proj-synthetic-1', name: '合成项目', literatureIds: [note.literatureId, note.literatureId] };
  assert.equal((await s.client.put('projects', proj.projectId, proj, '*')).status, 422, 'duplicate Project↔Literature association refused');
  const bad = await s.client.put('progress', note.literatureId, { literatureId: note.literatureId, status: 'skimmed' }, '*');
  assert.equal(bad.status, 422, 'only three reading statuses (D003)');
});
