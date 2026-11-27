// P0-STORE Phase 1 - credential handling (A90 §3 Phase 1, DESIGN §2; R4/DEC-42).
//
// The credential exists only as the value of exactly one environment variable named by the frozen
// plan, read at run time. R4 adds a second run-time value for the live user name: it comes from the
// variable named by the optional plan key `credentialUserEnvVar`, is validated before the password is
// read, and is treated as personal data for redaction. Local/mock plans omit the key and keep the
// fixed synthetic user `probe`.
//
// The Secret object deliberately renders itself as [REDACTED] for every common serialisation path.
// The gate asks the Secret for a single Basic authorization header value; nothing else can read the
// clear text. Missing or malformed credentials refuse before the gate (and therefore before any
// socket) exists.
import util from 'node:util';

const ENV_NAME_RE = /^[A-Z][A-Z0-9_]{2,63}$/;
const USER_RE = /^[^\s:@]+@[^\s:@]+\.[^\s:@]+$/;
const MAX_SECRET_CHARS = 512;
const MAX_USER_CHARS = 254;
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

function validateUserShape(value, { allowSynthetic = false } = {}) {
  if (allowSynthetic && value === 'probe') return true;
  if (typeof value !== 'string' || value.length < 3 || value.length > MAX_USER_CHARS) return false;
  if (hasControlCharacters(value) || value.includes(':')) return false;
  return USER_RE.test(value);
}

export class Secret {
  #value;

  #user;

  #pair;

  #basicHeader;

  #protectUser;

  constructor(value, user = 'probe') {
    if (typeof value !== 'string') secretFail('SECRET_INVALID', 'credential must be a string');
    if (value.length === 0) secretFail('SECRET_MISSING', 'credential is empty');
    if (value.length > MAX_SECRET_CHARS) secretFail('SECRET_TOO_LONG', `credential exceeds ${MAX_SECRET_CHARS} characters`);
    if (hasControlCharacters(value)) secretFail('SECRET_INVALID', 'credential contains a control character');
    if (!validateUserShape(user, { allowSynthetic: true })) {
      secretFail('CREDENTIAL_USER_MALFORMED', 'credential user does not match the required e-mail shape');
    }
    this.#value = value;
    this.#user = user;
    this.#pair = `${user}:${value}`;
    this.#basicHeader = `Basic ${Buffer.from(this.#pair, 'utf8').toString('base64')}`;
    // The local/mock identity `probe` is synthetic and non-personal, so it is not redacted by itself;
    // every other user name is personal data and is covered by appearsIn/redact.
    this.#protectUser = user !== 'probe';
    Object.freeze(this);
  }

  // The only accessor. Gate code puts this in the Authorization header and nowhere else.
  authorizationHeader() {
    return this.#basicHeader;
  }

  // True if any representation of the credential appears in a string. The protected user name is
  // covered in clear and base64 form, as are the clear user:password pair, its base64 form and the
  // Basic header.
  appearsIn(text) {
    if (typeof text !== 'string' || text.length === 0) return false;
    const forms = [
      this.#value,
      Buffer.from(this.#value, 'utf8').toString('base64'),
      this.#pair,
      Buffer.from(this.#pair, 'utf8').toString('base64'),
      this.#basicHeader,
    ];
    if (this.#protectUser) {
      forms.push(this.#user, Buffer.from(this.#user, 'utf8').toString('base64'));
    }
    return forms.some((form) => form.length > 0 && text.includes(form));
  }

  // Alias used by the R4 spec and by callers that describe the check as a containment predicate.
  contains(text) {
    return this.appearsIn(text);
  }

  redact(text) {
    if (typeof text !== 'string' || text.length === 0) return text;
    let out = text;
    const forms = [
      this.#basicHeader,
      Buffer.from(this.#pair, 'utf8').toString('base64'),
      Buffer.from(this.#value, 'utf8').toString('base64'),
    ];
    if (this.#protectUser) forms.push(Buffer.from(this.#user, 'utf8').toString('base64'));
    forms.push(this.#pair, this.#value);
    if (this.#protectUser) forms.push(this.#user);
    for (const form of forms) {
      if (form.length > 0) out = out.replaceAll(form, REDACTED);
    }
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

// Reads and validates the optional live user name before the password is touched. A local/mock plan
// without `credentialUserEnvVar` returns the fixed synthetic `probe` identity.
export function loadCredentialUser(plan, env = process.env) {
  const name = plan && plan.credentialUserEnvVar;
  if (name === undefined || name === null) return 'probe';
  if (typeof name !== 'string' || !ENV_NAME_RE.test(name)) {
    secretFail('CREDENTIAL_USER_ENV_INVALID', 'credentialUserEnvVar is not a valid environment name');
  }
  if (env === null || typeof env !== 'object') {
    secretFail('CREDENTIAL_USER_MISSING', `environment variable ${name} is not set`);
  }
  const raw = env[name];
  if (raw === undefined || raw === '') {
    secretFail('CREDENTIAL_USER_MISSING', `environment variable ${name} is not set or empty`);
  }
  if (!validateUserShape(raw)) {
    secretFail('CREDENTIAL_USER_MALFORMED', 'credential user does not match the required e-mail shape');
  }
  return raw;
}

// Reads the single password named by the plan. When a live user was already validated, it is passed
// explicitly so this function never re-reads the user environment. Local/mock callers fall back to
// `probe`. Refuses on a missing, empty, oversized or malformed value before any caller can construct
// a gate or a socket.
export function loadSecret(plan, env = process.env, user = undefined) {
  const effectiveUser = user === undefined ? loadCredentialUser(plan, env) : user;
  const name = plan && plan.credentialEnvVar;
  if (typeof name !== 'string' || !ENV_NAME_RE.test(name)) {
    secretFail('SECRET_ENV_NAME_INVALID', String(name));
  }
  if (env === null || typeof env !== 'object') secretFail('SECRET_INVALID', 'environment is not an object');
  const raw = env[name];
  if (raw === undefined) secretFail('SECRET_MISSING', `environment variable ${name} is not set`);
  if (typeof raw !== 'string') secretFail('SECRET_INVALID', `environment variable ${name} is not a string`);
  return new Secret(raw, effectiveUser);
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
