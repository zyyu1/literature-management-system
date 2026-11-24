// WP-02 synthetic read-only catalog (D007-A56). In-process, ephemeral, TEST-ONLY.
// R-ID: a paper's identity is the tuple (ownerScope, libraryType, libraryId, itemKey). Title/DOI never merge.
// R-SCOPE: readingStatus and note are global per paper; `important` lives on the Project–paper association.
import { createHash } from 'node:crypto';

export const LIBRARY_TYPES = new Set(['user', 'group']);
export const LIBRARY_ID_RE = /^[A-Za-z0-9]{1,64}$/;
export const ITEM_KEY_RE = /^[A-Za-z0-9]{1,32}$/;
export const NOTE_KEYS = Object.freeze([
  'researchQuestion', 'argumentsAndContent', 'theoriesAndMethods', 'contributionsAndInnovations', 'limitations',
]);

export function paperKey(ownerScope, libraryType, libraryId, itemKey) {
  return [ownerScope, libraryType, libraryId, itemKey].join('\u0000');
}

export function createCatalog(fixture) {
  if (!fixture || fixture.fixtureSchemaVersion !== 'WP02-SYNTHETIC-v1.0.0') throw new Error('UNSAFE_CONFIG: not the WP02 synthetic fixture');
  const p = fixture.privacy || {};
  if (p.realCredentialsPresent || p.pdfBytesPresent || p.zoteroIdentifiersReal) throw new Error('UNSAFE_CONFIG: fixture claims real data');

  const projects = new Map();
  for (const pr of fixture.projects) {
    if (projects.has(pr.id)) throw new Error('STOP: duplicate project id');
    projects.set(pr.id, Object.freeze({ id: pr.id, ownerId: pr.ownerId, name: pr.name, archived: pr.archived === true, revision: pr.revision }));
  }

  const papers = new Map(); // paperKey -> canonical paper (exactly one per identity tuple)
  for (const x of fixture.papers) {
    if (!LIBRARY_TYPES.has(x.libraryType) || !LIBRARY_ID_RE.test(x.libraryId) || !ITEM_KEY_RE.test(x.itemKey)) {
      throw new Error('UNSAFE_CONFIG: invalid paper identity in fixture');
    }
    const k = paperKey(x.ownerId, x.libraryType, x.libraryId, x.itemKey);
    if (papers.has(k)) throw new Error('STOP: duplicated global paper'); // A10/A56 STOP condition
    let note = null;
    if (x.note !== null) {
      note = {};
      for (const nk of NOTE_KEYS) {
        if (typeof x.note[nk] !== 'string') throw new Error('UNSAFE_CONFIG: note must carry the five string fields');
        note[nk] = x.note[nk]; // stored verbatim: no trim, no NFC, no newline normalisation (R-BYTES)
      }
      if (Object.keys(x.note).length !== NOTE_KEYS.length) throw new Error('UNSAFE_CONFIG: unexpected note field');
      Object.freeze(note);
    }
    papers.set(k, Object.freeze({
      ownerScope: x.ownerId, libraryType: x.libraryType, libraryId: x.libraryId, itemKey: x.itemKey,
      title: x.title, creators: Object.freeze([...x.creators]), year: x.year, doi: x.doi,
      readingStatus: x.readingStatus, note,
    }));
  }

  const associations = new Map(); // `${projectId}\u0001${paperKey}` -> { projectId, paperKey, important }
  function linkKey(projectId, pk) { return projectId + '\u0001' + pk; }
  function addAssociation(projectId, tuple, important) {
    const proj = projects.get(projectId);
    if (!proj) throw new Error('UNSAFE_CONFIG: association to unknown project');
    const pk = paperKey(proj.ownerId, tuple[0], tuple[1], tuple[2]);
    if (!papers.has(pk)) throw new Error('UNSAFE_CONFIG: association to unknown paper (cross-owner links are impossible)');
    const lk = linkKey(projectId, pk);
    if (associations.has(lk)) return { created: false };
    associations.set(lk, { projectId, paperKey: pk, important: important === true });
    return { created: true };
  }
  for (const a of fixture.associations) {
    const r = addAssociation(a.projectId, a.paper, a.important);
    if (!r.created) throw new Error('STOP: duplicated association in fixture');
  }

  const sortedAssoc = () => [...associations.values()].sort((a, b) => (a.projectId + a.paperKey).localeCompare(b.projectId + b.paperKey));

  return {
    projects,
    papers,
    // Projects the principal may read: same owner and a reading role (OWNER, WORKSPACE_READONLY).
    readableProjects(principal) {
      if (!principal || (principal.role !== 'OWNER' && principal.role !== 'WORKSPACE_READONLY') || !principal.ownerId) return [];
      return [...projects.values()].filter((pr) => pr.ownerId === principal.ownerId).sort((a, b) => a.id.localeCompare(b.id));
    },
    projectAssociations(projectId) {
      return sortedAssoc().filter((a) => a.projectId === projectId);
    },
    paperAssociations(pk) {
      return sortedAssoc().filter((a) => a.paperKey === pk);
    },
    // Test-only seeding hook modelling a re-import (fixture importAttempts); NOT an HTTP import API.
    seedImport(projectId, tuple) {
      const proj = projects.get(projectId);
      if (!proj) throw new Error('unknown project');
      const pk = paperKey(proj.ownerId, tuple[0], tuple[1], tuple[2]);
      if (!papers.has(pk)) throw new Error('seedImport only links existing canonical papers in WP-02');
      const before = papers.size;
      const r = addAssociation(projectId, tuple, false);
      if (papers.size !== before) throw new Error('STOP: duplicated global paper');
      return { paperCreated: false, associationCreated: r.created };
    },
    stateDigest() {
      const canon = {
        projects: [...projects.values()].sort((a, b) => a.id.localeCompare(b.id)),
        papers: [...papers.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, v]),
        associations: sortedAssoc(),
      };
      return createHash('sha256').update(JSON.stringify(canon)).digest('hex');
    },
    counts() { return { projects: projects.size, papers: papers.size, associations: associations.size }; },
  };
}
