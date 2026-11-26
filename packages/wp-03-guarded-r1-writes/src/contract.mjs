// WP-03-R1 contract vocabulary and validators (LOCAL_SYNTHETIC_ONLY).
// Closed request bodies, exact scopes/actions/values, exact strong conditional tags and the
// Unicode-safe Project name rule. No I/O; reusable by tests without the HTTP server.
import { OP_ID_RE } from '../../wp-01-synthetic-auth-api/src/policy.mjs';

export { OP_ID_RE };

export const RUN_ID_RE = /^run_[A-Za-z0-9_-]{16,64}$/;
export const REVISION_RE = /^rev_[A-Za-z0-9_-]{16,64}$/;
export const MAX_NAME_BYTES = 256;
export const MAX_OPAQUE_TAG_CHARS = 128;

export const SCOPE = Object.freeze({
  PROJECT: 'PROJECT',
  GLOBAL_PAPER: 'GLOBAL_PAPER',
  PROJECT_ASSOCIATION: 'PROJECT_ASSOCIATION',
});

export const ACTION = Object.freeze({
  CREATE: 'CREATE',
  RENAME: 'RENAME',
  ARCHIVE: 'ARCHIVE',
  RESTORE: 'RESTORE',
  SET_READING_STATUS: 'SET_READING_STATUS',
  SET_IMPORTANT: 'SET_IMPORTANT',
});

export const READING_STATUSES = Object.freeze(['To Read', 'Reading', 'Read']);

export const BASE_FIELDS = Object.freeze(['operationId', 'modelRunId', 'scope', 'action']);

// Route-level closed field supersets. An action may only narrow this set, never widen it.
export const ROUTE_FIELDS = Object.freeze({
  create: Object.freeze([...BASE_FIELDS, 'projectId', 'name']),
  project: Object.freeze([...BASE_FIELDS, 'name']),
  readingStatus: Object.freeze([...BASE_FIELDS, 'value']),
  important: Object.freeze([...BASE_FIELDS, 'value']),
});

export const ROUTE_SCOPE = Object.freeze({
  create: SCOPE.PROJECT,
  project: SCOPE.PROJECT,
  readingStatus: SCOPE.GLOBAL_PAPER,
  important: SCOPE.PROJECT_ASSOCIATION,
});

export const ROUTE_ACTIONS = Object.freeze({
  create: Object.freeze([ACTION.CREATE]),
  project: Object.freeze([ACTION.RENAME, ACTION.ARCHIVE, ACTION.RESTORE]),
  readingStatus: Object.freeze([ACTION.SET_READING_STATUS]),
  important: Object.freeze([ACTION.SET_IMPORTANT]),
});

// Name rule: real Unicode preserved byte-for-byte (no trim, no NFC, no case fold), but the value
// must be a well-formed, non-blank, control-free UTF-8 string of at most 256 bytes. Lone
// surrogates are rejected because they cannot be preserved through UTF-8.
export function checkProjectName(name) {
  if (typeof name !== 'string') return { ok: false, code: 'INVALID_NAME' };
  if (!name.isWellFormed()) return { ok: false, code: 'INVALID_NAME' };
  if (name.length === 0 || name.trim().length === 0) return { ok: false, code: 'INVALID_NAME' };
  if (/[\u0000-\u001f\u007f-\u009f]/.test(name)) return { ok: false, code: 'INVALID_NAME' };
  if (Buffer.byteLength(name, 'utf8') > MAX_NAME_BYTES) return { ok: false, code: 'INVALID_NAME' };
  return { ok: true };
}

// Exact strong single opaque If-Match. Returns one of:
//   { kind: 'missing' } | { kind: 'invalid', reason } | { kind: 'tag', tag: '"..."' }
export function parseIfMatch(raw) {
  if (raw === undefined) return { kind: 'missing' };
  if (typeof raw !== 'string') return { kind: 'invalid', reason: 'not-a-string' };
  if (raw === '*') return { kind: 'invalid', reason: 'wildcard' };
  if (raw.startsWith('W/')) return { kind: 'invalid', reason: 'weak' };
  if (raw.includes(',')) return { kind: 'invalid', reason: 'multiple' };
  if (raw.length < 3 || raw.length > MAX_OPAQUE_TAG_CHARS + 2) return { kind: 'invalid', reason: 'length' };
  if (raw[0] !== '"' || raw[raw.length - 1] !== '"') return { kind: 'invalid', reason: 'not-quoted' };
  const inner = raw.slice(1, -1);
  if (inner.length === 0) return { kind: 'invalid', reason: 'empty' };
  if (!/^[\x21\x23-\x7e\x80-\xff]+$/.test(inner)) return { kind: 'invalid', reason: 'opaque-tag-charset' };
  return { kind: 'tag', tag: raw };
}

// Create requires exactly `If-None-Match: *` and nothing else.
export function parseCreatePrecondition(raw) {
  if (raw === undefined) return { kind: 'missing' };
  if (raw === '*') return { kind: 'star' };
  return { kind: 'invalid' };
}

export const CONDITIONAL_HEADERS = Object.freeze([
  'if-match', 'if-none-match', 'if-modified-since', 'if-unmodified-since', 'if-range',
]);

export function hasUnexpectedConditional(req, allowed) {
  for (const h of CONDITIONAL_HEADERS) {
    if (!allowed.includes(h) && req.headers[h] !== undefined) return h;
  }
  return null;
}
