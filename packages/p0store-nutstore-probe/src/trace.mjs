// P0-STORE Phase 1 - redacted JSONL trace (A90 §3 Phase 1, DESIGN §2).
//
// Every line is a closed-schema event: run/step/request/refusal/stop/cleanup/quarantine/verdict.
// A request line carries only method, path template + synthetic id, status, validator hash prefix,
// body SHA-256, byte count, duration, abort/redirect flags and budget counters. Headers (and
// therefore Authorization), concrete paths, host names, account listings and response bodies never
// enter the trace, and every string is redacted again before writing. The writer refuses to emit a
// line that still contains the live credential in clear text, Basic or base64 form.
import fs from 'node:fs';
import { redactAuthorizationText } from './secret.mjs';

const EVENT_KEYS = Object.freeze({
  run: Object.freeze(['type', 'planId', 'mode', 'phase']),
  step: Object.freeze(['type', 'step', 'status', 'reason', 'anomalies']),
  request: Object.freeze([
    'type', 'step', 'seq', 'method', 'pathTemplate', 'syntheticId', 'status',
    'validatorHashPrefix', 'bodySha256', 'bytesSent', 'aborted', 'redirect', 'durationMs', 'budget',
  ]),
  refusal: Object.freeze(['type', 'step', 'method', 'code', 'pathTemplate']),
  stop: Object.freeze(['type', 'rule', 'step', 'detail']),
  cleanup: Object.freeze(['type', 'fileId', 'action', 'status', 'identity', 'result']),
  quarantine: Object.freeze(['type', 'fileId', 'reason']),
  verdict: Object.freeze(['type', 'verdict', 'rule', 'reasons']),
});
const BUDGET_KEYS = Object.freeze(['normal', 'cleanup', 'total', 'maxRequests', 'reservedCleanup', 'nonReservedCeiling']);

export class TraceError extends Error {
  constructor(code, detail) {
    super(detail === undefined ? code : `${code}: ${detail}`);
    this.name = 'TraceError';
    this.code = code;
  }
}

function traceFail(code, detail) {
  throw new TraceError(code, detail);
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeString(text, secret) {
  if (typeof text !== 'string') return text;
  if (text.includes('://')) traceFail('TRACE_HOST_LIKE_VALUE', text);
  // Fail closed before any redaction: a trace event that tries to carry credential material must be
  // refused, not silently rewritten. Redaction below remains as defence in depth for the explicit
  // Authorization-header form.
  if (secret && secret.appearsIn(text)) traceFail('TRACE_SECRET_LEAK');
  const redacted = redactAuthorizationText(text, secret);
  if (redacted.includes('Authorization:')) traceFail('TRACE_AUTHORIZATION_VALUE');
  if (secret && secret.appearsIn(redacted)) traceFail('TRACE_SECRET_LEAK');
  return redacted;
}

function sanitize(value, secret) {
  if (typeof value === 'string') return sanitizeString(value, secret);
  if (Array.isArray(value)) return value.map((item) => sanitize(item, secret));
  if (isPlainObject(value)) {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (/authorization|password|secret|credential|cookie|header/i.test(key)) traceFail('TRACE_FORBIDDEN_FIELD', key);
      out[key] = sanitize(item, secret);
    }
    return out;
  }
  return value;
}

function checkShape(event) {
  if (!isPlainObject(event)) traceFail('TRACE_EVENT_NOT_OBJECT');
  const allowed = EVENT_KEYS[event.type];
  if (!allowed) traceFail('TRACE_EVENT_TYPE_UNKNOWN', String(event.type));
  for (const key of Object.keys(event)) {
    if (!allowed.includes(key)) traceFail('TRACE_EVENT_FIELD_UNKNOWN', `${event.type}.${key}`);
  }
}

// Budget shape is validated after sanitisation so that credential/host-like material is always
// refused with its own dedicated reason even when the event is otherwise structurally incomplete.
function checkBudget(event) {
  if (event.type !== 'request') return;
  if (!isPlainObject(event.budget)) traceFail('TRACE_BUDGET_REQUIRED');
  for (const key of Object.keys(event.budget)) {
    if (!BUDGET_KEYS.includes(key)) traceFail('TRACE_BUDGET_FIELD_UNKNOWN', key);
  }
}

export function createTrace(options = {}) {
  const filePath = options.filePath === undefined ? null : options.filePath;
  const secret = options.secret || null;
  const records = [];
  let closed = false;

  function record(event) {
    if (closed) traceFail('TRACE_CLOSED');
    checkShape(event);
    const sanitized = sanitize(structuredClone(event), secret);
    checkBudget(sanitized);
    const line = JSON.stringify(sanitized);
    if (secret && secret.appearsIn(line)) traceFail('TRACE_SECRET_LEAK');
    records.push(Object.freeze(sanitized));
    if (filePath !== null) {
      try {
        fs.appendFileSync(filePath, `${line}\n`, 'utf8');
      } catch (error) {
        traceFail('TRACE_WRITE_FAILED', error instanceof Error ? error.message : String(error));
      }
    }
    return sanitized;
  }

  return Object.freeze({
    record,
    records() {
      return [...records];
    },
    filePath,
    close() {
      closed = true;
    },
  });
}

// Convenience for tests and the QA handoff scan: the exact serialized trace text.
export function serializeTrace(trace) {
  return trace.records().map((event) => JSON.stringify(event)).join('\n');
}
