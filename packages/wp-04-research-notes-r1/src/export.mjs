// WP-04-R1 saved-version Markdown export (LOCAL_SYNTHETIC_ONLY). Pure functions only: the exporter
// never reads or writes model state. The server passes the saved note fields, so a local (client)
// draft can never influence the export, and exporting never changes a revision or the ledger.
//
// Byte layout is exactly DESIGN §5 (UI-D005.1e): fixed H1 and metadata block, the five frozen
// headings, field text inserted verbatim (no escaping, wrapping, normalization or newline change),
// blank lines between sections and exactly one trailing LF after the last field.
import { NOTE_KEYS } from '../../wp-02-project-paper-read/src/catalog.mjs';

export const NOTE_HEADINGS = Object.freeze({
  researchQuestion: 'Research Question',
  argumentsAndContent: 'Arguments & Content',
  theoriesAndMethods: 'Theories & Methods',
  contributionsAndInnovations: 'Contributions & Innovations',
  limitations: 'Limitations',
});

export const MAX_SAFE_TITLE_BYTES = 120;
export const DEFAULT_SAFE_TITLE = 'research-note';

const WINDOWS_RESERVED_NAMES = new Set([
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
]);

// Metadata-only sanitizing. Field text is NEVER passed through these helpers.
export function stripControlCharacters(value) {
  return String(value).replace(/[\u0000-\u001f\u007f-\u009f]/g, '');
}

// Backslash-escape Markdown-significant metadata characters, strip control characters, and escape a
// leading list marker (`-`, `+`, or `digit.`). The caller must only pass title/creators/DOI text.
export function escapeMarkdownMetadata(value) {
  let out = stripControlCharacters(value);
  out = out.replace(/[\\`*_\[\]<>#|]/g, '\\$&');
  out = out.replace(/^([-+])/, '\\$1');
  out = out.replace(/^(\d+)\.(?=\s)/, '$1\\.');
  return out;
}

function capUtf8(value, maxBytes) {
  if (Buffer.byteLength(value, 'utf8') <= maxBytes) return value;
  let out = '';
  let bytes = 0;
  for (const ch of value) {
    const size = Buffer.byteLength(ch, 'utf8');
    if (bytes + size > maxBytes) break;
    out += ch;
    bytes += size;
  }
  return out;
}

// `<safe-title>` per DESIGN §5: replace path separators, Windows-invalid characters, control
// characters and leading dots with `_`; collapse runs of `_`/whitespace; trim trailing dots/spaces;
// map Windows reserved device names to `_<name>`; cap at 120 UTF-8 bytes without splitting a code
// point. Empty/missing title is represented by '' here; `exportFilename` applies the fallback.
export function safeTitle(rawTitle) {
  let title = typeof rawTitle === 'string' ? rawTitle : '';
  title = title.replace(/[\u0000-\u001f\u007f-\u009f]/g, '_');
  title = title.replace(/[\\/:*?"<>|]/g, '_');
  title = title.replace(/^\.+/, (dots) => '_'.repeat(dots.length));
  if (title.trim() === '') return '';
  title = title.replace(/[\s_]+/g, '_');
  title = title.replace(/[. ]+$/, '');
  title = capUtf8(title, MAX_SAFE_TITLE_BYTES);
  title = title.replace(/[. ]+$/, '');
  if (title === '') return '';
  const stem = title.split('.')[0].toUpperCase();
  if (WINDOWS_RESERVED_NAMES.has(stem)) title = '_' + title;
  title = capUtf8(title, MAX_SAFE_TITLE_BYTES);
  title = title.replace(/[. ]+$/, '');
  return title;
}

export function exportFilename(rawTitle, itemKey) {
  const safe = safeTitle(rawTitle);
  return `${safe === '' ? DEFAULT_SAFE_TITLE : safe}_${itemKey}.md`;
}

// ASCII fallback used in the quoted `filename=` parameter. The sanitized filename is normally
// already ASCII-safe; non-ASCII title characters collapse to `_` only for this parameter.
export function asciiFallbackFilename(filename) {
  return String(filename).replace(/[^\x20-\x7e]+/g, '_');
}

// RFC 5987 extended parameter value for UTF-8 filenames. encodeURIComponent does not escape
// `'`, `(`, `)` or `*`, which are not attr-chars, so they are escaped explicitly.
export function percentEncodeFilename(filename) {
  return encodeURIComponent(String(filename))
    .replace(/['()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

export function contentDisposition(filename) {
  return `attachment; filename="${asciiFallbackFilename(filename)}"; filename*=UTF-8''${percentEncodeFilename(filename)}`;
}

function metadataYear(year) {
  if (Number.isInteger(year)) return String(year);
  if (typeof year === 'string' && stripControlCharacters(year).trim() !== '') {
    return escapeMarkdownMetadata(year);
  }
  return null;
}

// Exact saved-version export body. Returns a string; the caller encodes it as UTF-8.
export function buildResearchNoteMarkdown({ title, creators, year, doi, fields } = {}) {
  const heading = escapeMarkdownMetadata(typeof title === 'string' ? title : '');
  let out = `# ${heading}\n\n`;

  const authors = Array.isArray(creators)
    ? creators
      .filter((creator) => typeof creator === 'string' && stripControlCharacters(creator).trim() !== '')
      .map((creator) => escapeMarkdownMetadata(creator))
      .join('; ')
    : '';
  if (authors !== '') out += `- **Authors:** ${authors}\n`;

  const renderedYear = metadataYear(year);
  if (renderedYear !== null) out += `- **Year:** ${renderedYear}\n`;

  if (typeof doi === 'string' && stripControlCharacters(doi).trim() !== '') {
    out += `- **DOI:** ${escapeMarkdownMetadata(doi)}\n`;
  }

  // The blank line that closes the metadata block. When every metadata line is omitted this leaves
  // the title's blank line and this blank line, exactly as the DESIGN §5 template does.
  out += '\n';

  const source = fields && typeof fields === 'object' ? fields : {};
  NOTE_KEYS.forEach((key, index) => {
    const value = typeof source[key] === 'string' ? source[key] : '';
    out += `## ${NOTE_HEADINGS[key]}\n\n${value}\n`;
    if (index < NOTE_KEYS.length - 1) out += '\n';
  });
  return out;
}
