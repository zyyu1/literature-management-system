// WP-01 synthetic policy constants and pure helpers (D007-A21, LOCAL_SYNTHETIC_ONLY).
// Server-only. No I/O, no network, no secrets. All values are WP-01 test limits, not production SLOs.
import { timingSafeEqual, createHash } from 'node:crypto';

export const API_VERSION = 'v1';
export const COOKIE_NAME = '__Host-lms_session';
export const COOKIE_ATTRS = 'Path=/; Secure; HttpOnly; SameSite=Lax';

export const LIMITS = Object.freeze({
  maxRequestBodyBytes: 64 * 1024,
  maxResponseBodyBytes: 256 * 1024,
  maxRequestsPerRun: 5000,
  maxPathLength: 2048,
  // Synthetic lifetime for test-issued fresh sessions only; the real Session duration is UNDECIDED.
  syntheticFreshSessionMs: 3600000,
});

export const LOOPBACK_BIND = '127.0.0.1';
export const SAFE_FETCH_SITES = new Set(['same-origin', 'same-site']);
export const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
export const ID_RE = /^[a-z][a-z0-9_]{0,63}$/;
export const OP_ID_RE = /^op_[A-Za-z0-9_-]{8,64}$/;

export const OUTCOME = Object.freeze({
  CONFIRMED: 'CONFIRMED',
  CONFLICT: 'CONFLICT',
  DEFINITE_FAILURE: 'DEFINITE_FAILURE',
  UNKNOWN: 'UNKNOWN',
});

// Pre-dispatch denials are DEFINITE_FAILURE in the A5 sense (validated rejection before mutation).
export class Denial extends Error {
  constructor(status, code, extra = {}) {
    super(code);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export function isValidResourceId(id) {
  return typeof id === 'string' && !FORBIDDEN_KEYS.has(id) && ID_RE.test(id);
}

export function safeEqualString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function fingerprint(obj) {
  return createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

// Reject JSON whose object graph carries prototype-pollution keys anywhere.
export function hasForbiddenKey(value, depth = 0) {
  if (depth > 32) return true;
  if (value === null || typeof value !== 'object') return false;
  for (const k of Object.keys(value)) {
    if (FORBIDDEN_KEYS.has(k)) return true;
    if (hasForbiddenKey(value[k], depth + 1)) return true;
  }
  return false;
}

// Parse a request target into decoded path segments; fail closed on anything ambiguous.
export function parseTarget(rawUrl) {
  if (typeof rawUrl !== 'string' || rawUrl.length === 0 || rawUrl.length > LIMITS.maxPathLength) return null;
  if (!rawUrl.startsWith('/') || rawUrl.startsWith('//')) return null;
  const q = rawUrl.indexOf('?');
  const pathPart = q === -1 ? rawUrl : rawUrl.slice(0, q);
  const query = new URLSearchParams(q === -1 ? '' : rawUrl.slice(q + 1));
  const rawSegs = pathPart.split('/').slice(1);
  const segs = [];
  for (const s of rawSegs) {
    let d;
    try { d = decodeURIComponent(s); } catch { return null; }
    if (d === '' || d === '.' || d === '..' || /[\/\\\u0000-\u001f\u007f]/.test(d)) return null;
    segs.push(d);
  }
  return { segs, query };
}

export function isLoopbackHost(host) {
  return host === '127.0.0.1' || host === '[::1]' || host === '::1';
}
