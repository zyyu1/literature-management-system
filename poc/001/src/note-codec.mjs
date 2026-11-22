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

export const RECORD_KINDS = {
  notes: validateNote,
  projects: validateProject,
  progress: validateProgress,
};

export const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const ZOTERO_KEY_RE = /^[A-Z0-9]{8}$/;

/** Global literature identity from Zotero Library ID + parent item key (D001). */
export function literatureId(libraryId, itemKey) {
  if (!/^[0-9]{1,12}$/.test(String(libraryId)) || !ZOTERO_KEY_RE.test(itemKey)) throw new Error('invalid zotero identity');
  return `lit-${libraryId}-${itemKey.toLowerCase()}`; // Zotero keys are [A-Z0-9], so lower-casing is bijective
}

function isStr(v, max) { return typeof v === 'string' && v.length <= max; }

function validateNote(id, data) {
  const errs = [];
  if (!data || typeof data !== 'object') return ['body must be an object'];
  if (data.literatureId !== id) errs.push('literatureId must equal path id');
  for (const [k] of NOTE_FIELDS) if (!isStr(data[k], 200_000)) errs.push(`${k} must be a string <= 200000 chars`);
  const allowed = new Set(['literatureId', ...NOTE_FIELDS.map(([k]) => k)]);
  for (const k of Object.keys(data)) if (!allowed.has(k)) errs.push(`unexpected field ${k}`);
  return errs;
}
function validateProject(id, data) {
  const errs = [];
  if (data?.projectId !== id) errs.push('projectId must equal path id');
  if (!isStr(data?.name, 200)) errs.push('name required');
  if (data?.literatureIds !== undefined && (!Array.isArray(data.literatureIds) || data.literatureIds.some((x) => !ID_RE.test(x)))) errs.push('literatureIds invalid');
  if (data?.literatureIds && new Set(data.literatureIds).size !== data.literatureIds.length) errs.push('duplicate literatureIds');
  return errs;
}
function validateProgress(id, data) {
  if (data?.literatureId !== id) return ['literatureId must equal path id'];
  if (!['to_read', 'reading', 'read'].includes(data?.status)) return ['status must be to_read|reading|read'];
  return [];
}

export function encodeEnvelope({ kind, id, operationId, data }) {
  const env = { schema: 'lms.poc001/v1', kind, id, operationId, data };
  return Buffer.from(JSON.stringify(env, null, 2) + '\n', 'utf8');
}
export function decodeEnvelope(bytes) {
  const env = JSON.parse(Buffer.from(bytes).toString('utf8'));
  if (env.schema !== 'lms.poc001/v1') throw new Error('unknown schema');
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
