// WP-04-R1 frozen-fixture intake (LOCAL_SYNTHETIC_ONLY). Pure: no filesystem, no network.
// The two WP-01/WP-02 fixtures are accepted ONLY as raw bytes that match their frozen byte length
// and SHA-256. Anything else fails closed before any note state exists. Parsed fixture objects are
// cloned into one WP-04 model; the fixture files themselves are never written.
//
// The WP-02 fixture is also the only source of initial note content: exactly one canonical paper
// (`user/fakeLib01/XFAKE001`) carries a five-field note, and the other three papers carry
// `note: null`. A fixture that disagrees is rejected here, before a model can be built.
import { createHash } from 'node:crypto';

export const WP01_FIXTURE_BYTES = 4573;
export const WP01_FIXTURE_SHA256 = '86c47a5a6ad48cc4f14dc492c64cfd2412885ece462740fc00b96d60a604be65';
export const WP02_FIXTURE_BYTES = 4989;
export const WP02_FIXTURE_SHA256 = 'c4fc68afb0a1660c109c4af24620ff17279161d8e3b8e02cdf286d3e060bf888';
export const WP01_FIXTURE_SCHEMA = 'WP01-SYNTHETIC-v1.0.0';
export const WP02_FIXTURE_SCHEMA = 'WP02-SYNTHETIC-v1.0.0';

// Frozen fixture fact (DESIGN §2): the only canonical paper with an initial confirmed note.
export const INITIAL_NOTE_OWNER = 'owner_synth_001';
export const INITIAL_NOTE_TUPLE = Object.freeze(['user', 'fakeLib01', 'XFAKE001']);
export const NOTE_KEYS = Object.freeze([
  'researchQuestion', 'argumentsAndContent', 'theoriesAndMethods', 'contributionsAndInnovations', 'limitations',
]);

function guardedBytes(label, raw, size, sha) {
  if (!Buffer.isBuffer(raw)) {
    throw new Error(`UNSAFE_CONFIG: ${label} fixture must be supplied as raw bytes`);
  }
  if (raw.length !== size) {
    throw new Error(`UNSAFE_CONFIG: ${label} fixture byte length is not the frozen ${size}`);
  }
  const got = createHash('sha256').update(raw).digest('hex');
  if (got !== sha) {
    throw new Error(`UNSAFE_CONFIG: ${label} fixture SHA-256 is not the frozen oracle`);
  }
  return got;
}

function checkInitialNotes(wp02) {
  const withNotes = wp02.papers.filter((p) => p.note !== null);
  if (withNotes.length !== 1) {
    throw new Error('UNSAFE_CONFIG: the frozen WP-02 fixture must carry exactly one initial note');
  }
  const [initial] = withNotes;
  if (initial.ownerId !== INITIAL_NOTE_OWNER
    || initial.libraryType !== INITIAL_NOTE_TUPLE[0]
    || initial.libraryId !== INITIAL_NOTE_TUPLE[1]
    || initial.itemKey !== INITIAL_NOTE_TUPLE[2]) {
    throw new Error('UNSAFE_CONFIG: the frozen WP-02 initial note is not the documented canonical paper');
  }
  const keys = Object.keys(initial.note);
  if (keys.length !== NOTE_KEYS.length) {
    throw new Error('UNSAFE_CONFIG: the frozen initial note must carry exactly the five fields');
  }
  for (const key of NOTE_KEYS) {
    if (typeof initial.note[key] !== 'string') {
      throw new Error('UNSAFE_CONFIG: the frozen initial note fields must be strings');
    }
  }
}

// Returns the parsed fixtures plus their proven byte length / digest. Raw-byte verification happens
// BEFORE JSON.parse, so a tampered fixture is never interpreted.
export function parseFrozenFixtures(input) {
  const { wp01Raw, wp02Raw } = input || {};
  const wp01Sha = guardedBytes('WP-01', wp01Raw, WP01_FIXTURE_BYTES, WP01_FIXTURE_SHA256);
  const wp02Sha = guardedBytes('WP-02', wp02Raw, WP02_FIXTURE_BYTES, WP02_FIXTURE_SHA256);
  let wp01;
  let wp02;
  try {
    wp01 = JSON.parse(wp01Raw.toString('utf8'));
    wp02 = JSON.parse(wp02Raw.toString('utf8'));
  } catch {
    throw new Error('UNSAFE_CONFIG: frozen fixture is not JSON');
  }
  if (!wp01 || wp01.fixtureSchemaVersion !== WP01_FIXTURE_SCHEMA) {
    throw new Error('UNSAFE_CONFIG: WP-01 fixture schema is not the frozen synthetic schema');
  }
  if (!wp02 || wp02.fixtureSchemaVersion !== WP02_FIXTURE_SCHEMA) {
    throw new Error('UNSAFE_CONFIG: WP-02 fixture schema is not the frozen synthetic schema');
  }
  if (!wp02.dependsOn || wp02.dependsOn.wp01Sha256 !== WP01_FIXTURE_SHA256) {
    throw new Error('UNSAFE_CONFIG: WP-02 fixture does not reference the frozen WP-01 fixture');
  }
  if (wp01.environment?.mode !== 'LOCAL_SYNTHETIC_ONLY' || wp01.environment?.provider !== 'FAKE_ONLY'
    || wp01.environment?.bindHost !== '127.0.0.1' || wp01.environment?.port !== 0) {
    throw new Error('UNSAFE_CONFIG: WP-01 fixture environment is not the synthetic loopback mode');
  }
  for (const [label, f] of [['WP-01', wp01], ['WP-02', wp02]]) {
    const p = f.privacy || {};
    if (p.realCredentialsPresent || p.pdfBytesPresent || p.zoteroIdentifiersReal) {
      throw new Error(`UNSAFE_CONFIG: ${label} fixture claims real data`);
    }
    if (p.allowedNetwork !== undefined && p.allowedNetwork !== 'loopback-only') {
      throw new Error(`UNSAFE_CONFIG: ${label} fixture allows a non-loopback network`);
    }
  }
  if (!Array.isArray(wp01.principals) || !Array.isArray(wp01.sessions) || !Array.isArray(wp02.projects)
    || !Array.isArray(wp02.papers) || !Array.isArray(wp02.associations)) {
    throw new Error('UNSAFE_CONFIG: frozen fixture collections are missing');
  }
  checkInitialNotes(wp02);
  return {
    wp01,
    wp02,
    verified: {
      wp01: { bytes: WP01_FIXTURE_BYTES, sha256: wp01Sha },
      wp02: { bytes: WP02_FIXTURE_BYTES, sha256: wp02Sha },
    },
  };
}
