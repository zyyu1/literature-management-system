// P0-STORE Phase 1 - credential handling (A90 §3 Phase 1, DESIGN §2).
//
// The credential exists only as the value of exactly one environment variable named by the frozen
// plan, read at run time. It is never accepted from a file, an argument, a URL, a trace or a log, and
// the Secret object deliberately renders itself as [REDACTED] for every common serialisation path.
// The gate asks the Secret for a single Basic authorization header value; nothing else can read the
// clear text. Missing or malformed credentials refuse before the gate (and therefore before any
// socket) exists.
import util from 'node:util';

const ENV_NAME_RE = /^[A-Z][A-Z0-9_]{2,63}$/;
const MAX_SECRET_CHARS = 512;
const REDACTED = '[REDACTED]';

export class SecretError extends Error {
  constructor(code, detail) {
    super(detail === undefined ? code : `${code}: ${detail}`);
    this.name = 'SecretError';
    this.code = code;
    this.detail = detail === undefined ? null : detail;
  }
}

function secretFail(code, detail) {
  throw new SecretError(code, detail);
}

function hasControlCharacters(value) {
  return /[\u0000-\u001f\u007f-\u009f]/.test(value);
}

export class Secret {
  #value;

  #basicHeader;

  constructor(value) {
    if (typeof value !== 'string') secretFail('SECRET_INVALID', 'credential must be a string');
    if (value.length === 0) secretFail('SECRET_MISSING', 'credential is empty');
    if (value.length > MAX_SECRET_CHARS) secretFail('SECRET_TOO_LONG', `credential exceeds ${MAX_SECRET_CHARS} characters`);
    if (hasControlCharacters(value)) secretFail('SECRET_INVALID', 'credential contains a control character');
    this.#value = value;
    // The synthetic Basic user name is fixed and non-personal; only the password comes from the env.
    this.#basicHeader = `Basic ${Buffer.from(`probe:${value}`, 'utf8').toString('base64')}`;
    Object.freeze(this);
  }

  // The only accessor. Gate code puts this in the Authorization header and nowhere else.
  authorizationHeader() {
    return this.#basicHeader;
  }

  // True if any representation of the secret appears in a string (clear text or Basic/base64 form).
  appearsIn(text) {
    if (typeof text !== 'string' || text.length === 0) return false;
    const forms = [this.#value, Buffer.from(this.#value, 'utf8').toString('base64'), this.#basicHeader];
    return forms.some((form) => form.length > 0 && text.includes(form));
  }

  redact(text) {
    if (typeof text !== 'string' || text.length === 0) return text;
    let out = text;
    out = out.replaceAll(this.#basicHeader, REDACTED);
    out = out.replaceAll(this.#value, REDACTED);
    out = out.replaceAll(Buffer.from(this.#value, 'utf8').toString('base64'), REDACTED);
    return out;
  }

  toString() {
    return REDACTED;
  }

  toJSON() {
    return REDACTED;
  }

  [util.inspect.custom]() {
    return REDACTED;
  }
}

// Reads the single credential named by the plan. Refuses on a missing, empty, oversized or malformed
// value before any caller can construct a gate or a socket.
export function loadSecret(plan, env = process.env) {
  const name = plan && plan.credentialEnvVar;
  if (typeof name !== 'string' || !ENV_NAME_RE.test(name)) {
    secretFail('SECRET_ENV_NAME_INVALID', String(name));
  }
  if (env === null || typeof env !== 'object') secretFail('SECRET_INVALID', 'environment is not an object');
  const raw = env[name];
  if (raw === undefined) secretFail('SECRET_MISSING', `environment variable ${name} is not set`);
  if (typeof raw !== 'string') secretFail('SECRET_INVALID', `environment variable ${name} is not a string`);
  return new Secret(raw);
}

const AUTHORIZATION_LINE_RE = /(authorization\s*:\s*)([^\r\n,}]*)/gi;

// Header-independent redaction for arbitrary diagnostic strings. It removes Authorization header
// values even when no Secret instance is available (for example a malformed header echo).
export function redactAuthorizationText(text, secret = null) {
  if (typeof text !== 'string' || text.length === 0) return text;
  let out = text.replace(AUTHORIZATION_LINE_RE, (match, prefix) => `${prefix}${REDACTED}`);
  if (secret instanceof Secret) out = secret.redact(out);
  return out;
}

// Throws if a candidate diagnostic text contains the live credential in any representation.
export function assertNoSecretLeak(text, secret) {
  if (secret instanceof Secret && secret.appearsIn(typeof text === 'string' ? text : String(text))) {
    throw new SecretError('SECRET_LEAK', 'credential material appeared in a diagnostic string');
  }
  return text;
}
