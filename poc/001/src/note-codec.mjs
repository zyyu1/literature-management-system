// POC-001 — synthetic ResearchNote JSON envelope + Markdown export codec.
// JSON is the canonical stored form; Markdown is an export that must parse back
// to byte-identical field values (length-prefixed markers, no escaping games).
import { sha256Hex } from './util.mjs';

export const NOTE_FIELDS = [
  ['question', 'Research Question'],
  ['arguments', 'Arguments & Research Content'],
  ['methods', 'Theories & Methods'],
  ['contributions', 'Contributions & Innovations'],
  ['limitations', 'Limitations'],
];

// REMEDIATION-01 P2-5: a Map, never a plain object, so prototype keys such as
// `constructor`, `__proto__`, `toString` can never resolve to a validator.
export const RECORD_KINDS = new Map([
  ['notes', validateNote],
  ['projects', validateProject],
  ['progress', validateProgress],
]);
export const KIND_NAMES = [...RECORD_KINDS.keys()];
export const isKind = (k) => typeof k === 'string' && RECORD_KINDS.has(k);
export const validatorFor = (k) => (isKind(k) ? RECORD_KINDS.get(k) : null);

export const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const isId = (v) => typeof v === 'string' && ID_RE.test(v);
const ZOTERO_KEY_RE = /^[A-Z0-9]{8}$/;

/** Global literature identity from Zotero Library ID + parent item key (D001). */
export function literatureId(libraryId, itemKey) {
  if (!/^[0-9]{1,12}$/.test(String(libraryId)) || !ZOTERO_KEY_RE.test(itemKey)) throw new Error('invalid zotero identity');
  return `lit-${libraryId}-${itemKey.toLowerCase()}`; // Zotero keys are [A-Z0-9], so lower-casing is bijective
}

function isStr(v, max) { return typeof v === 'string' && v.length <= max; }
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;

// REMEDIATION-01 P2-11: every kind rejects unexpected fields and checks types
// BEFORE any regex (no String() coercion of non-strings).
function onlyFields(data, allowed) {
  return Object.keys(data).filter((k) => !allowed.includes(k)).map((k) => `unexpected field ${k}`);
}
function validateNote(id, data) {
  if (!isPlainObject(data)) return ['body must be an object'];
  const errs = onlyFields(data, ['literatureId', ...NOTE_FIELDS.map(([k]) => k)]);
  if (data.literatureId !== id) errs.push('literatureId must equal path id');
  for (const [k] of NOTE_FIELDS) if (!isStr(data[k], 200_000)) errs.push(`${k} must be a string <= 200000 chars`);
  return errs;
}
function validateProject(id, data) {
  if (!isPlainObject(data)) return ['body must be an object'];
  const errs = onlyFields(data, ['projectId', 'name', 'description', 'literatureIds']);
  if (data.projectId !== id) errs.push('projectId must equal path id');
  if (!isStr(data.name, 200) || data.name.length === 0) errs.push('name required (string <= 200)');
  if (data.description !== undefined && !isStr(data.description, 5000)) errs.push('description must be a string <= 5000');
  if (data.literatureIds !== undefined) {
    if (!Array.isArray(data.literatureIds) || data.literatureIds.length > 10_000) errs.push('literatureIds must be an array');
    else if (!data.literatureIds.every(isId)) errs.push('literatureIds must be valid id strings');
    else if (new Set(data.literatureIds).size !== data.literatureIds.length) errs.push('duplicate literatureIds');
  }
  return errs;
}
function validateProgress(id, data) {
  if (!isPlainObject(data)) return ['body must be an object'];
  const errs = onlyFields(data, ['literatureId', 'status']);
  if (data.literatureId !== id) errs.push('literatureId must equal path id');
  if (!['to_read', 'reading', 'read'].includes(data.status)) errs.push('status must be to_read|reading|read');
  return errs;
}

const OP_RE = /^[0-9a-f][0-9a-f-]{7,63}$/;
export const dataDigest = (data) => sha256Hex(Buffer.from(JSON.stringify(data), 'utf8'));

/**
 * `operationId` holds the server's write tag; `provenance` (REMEDIATION-02 P2-N4) is an
 * HMAC computed by the safe API with a server-held key. The codec only checks shape;
 * the API authenticates it.
 */
export function encodeEnvelope({ kind, id, operationId, data, provenance }) {
  const env = { schema: 'lms.poc001/v1', kind, id, operationId, dataSha256: dataDigest(data), ...(provenance ? { provenance } : {}), data };
  return Buffer.from(JSON.stringify(env, null, 2) + '\n', 'utf8');
}

/** Strict decode: schema, kind/id identity, data digest and the kind's validator. */
export function decodeEnvelope(bytes, expect = {}) {
  const env = JSON.parse(Buffer.from(bytes).toString('utf8'));
  if (!isPlainObject(env) || env.schema !== 'lms.poc001/v1') throw new Error('unknown schema');
  const extra = onlyFields(env, ['schema', 'kind', 'id', 'operationId', 'dataSha256', 'provenance', 'data']);
  if (env.provenance !== undefined && !(typeof env.provenance === 'string' && /^[0-9a-f]{64}$/.test(env.provenance))) throw new Error('envelope: invalid provenance');
  if (extra.length) throw new Error(`envelope: ${extra.join(', ')}`);
  if (!isKind(env.kind) || !isId(env.id)) throw new Error('envelope: invalid kind/id');
  if (expect.kind !== undefined && env.kind !== expect.kind) throw new Error('envelope: kind mismatch');
  if (expect.id !== undefined && env.id !== expect.id) throw new Error('envelope: id mismatch');
  if (typeof env.operationId !== 'string' || !OP_RE.test(env.operationId)) throw new Error('envelope: invalid operationId');
  if (env.dataSha256 !== dataDigest(env.data)) throw new Error('envelope: data digest mismatch');
  const errs = validatorFor(env.kind)(env.id, env.data);
  if (errs.length) throw new Error(`envelope: invalid data: ${errs.join('; ')}`);
  return env;
}

export function renderMarkdown(note) {
  const lines = ['---', `lms_schema: lms.poc001.note-md/v1`, `literature_id: ${note.literatureId}`, '---', ''];
  for (const [k, title] of NOTE_FIELDS) {
    const bytes = Buffer.byteLength(note[k], 'utf8');
    lines.push(`## ${title}`, '', `<!-- lms:field ${k} bytes=${bytes} sha256=${sha256Hex(Buffer.from(note[k], 'utf8'))} -->`);
    lines.push(note[k]);
    lines.push(`<!-- lms:end ${k} -->`, '');
  }
  return lines.join('\n');
}

export function parseMarkdown(md) {
  const buf = Buffer.from(md, 'utf8');
  const head = /^---\nlms_schema: lms\.poc001\.note-md\/v1\nliterature_id: ([a-z0-9-]+)\n---\n/.exec(md);
  if (!head) throw new Error('missing front matter');
  const note = { literatureId: head[1] };
  let pos = Buffer.byteLength(head[0], 'utf8');
  for (const [k] of NOTE_FIELDS) {
    const marker = Buffer.from(`<!-- lms:field ${k} bytes=`, 'utf8');
    const at = buf.indexOf(marker, pos);
    if (at < 0) throw new Error(`missing field ${k}`);
    const lineEnd = buf.indexOf(0x0a, at);
    const m = /bytes=(\d+) sha256=([0-9a-f]{64}) -->$/.exec(buf.subarray(at, lineEnd).toString('utf8'));
    if (!m) throw new Error(`bad marker ${k}`);
    const start = lineEnd + 1;
    const value = buf.subarray(start, start + Number(m[1]));
    if (sha256Hex(value) !== m[2]) throw new Error(`digest mismatch ${k}`);
    note[k] = value.toString('utf8');
    const endMarker = Buffer.from(`\n<!-- lms:end ${k} -->`, 'utf8');
    if (!buf.subarray(start + value.length, start + value.length + endMarker.length).equals(endMarker)) throw new Error(`missing end ${k}`);
    pos = start + value.length + endMarker.length;
  }
  return note;
}
