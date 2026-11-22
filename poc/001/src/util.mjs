import crypto from 'node:crypto';

export const sha256Hex = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

const LOOPBACK = new Set(['127.0.0.1', '::1', '[::1]', 'localhost']);

/** Default-deny: POC-001 local phase may only talk to / listen on loopback. */
export function assertLoopbackHost(hostname) {
  if (!LOOPBACK.has(hostname)) {
    const err = new Error(`REAL_SERVICE_BLOCKED: non-loopback host refused in POC-001 local phase`);
    err.code = 'REAL_SERVICE_BLOCKED';
    throw err;
  }
}

export function timingSafeEqualStr(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export const randomId = (bytes = 16) => crypto.randomBytes(bytes).toString('hex');
