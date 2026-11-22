// Heuristic scan of the POC-001 change set for secrets, private endpoints and
// forbidden data files. NOT a complete security audit.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const repo = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const base = process.argv[2] ?? 'origin/main';
const changed = execSync(`git diff --name-only ${base} -- .`, { cwd: repo, encoding: 'utf8' }).split('\n').filter(Boolean);
const untracked = execSync('git ls-files --others --exclude-standard', { cwd: repo, encoding: 'utf8' }).split('\n').filter(Boolean);
const files = [...new Set([...changed, ...untracked])];

const FORBIDDEN_FILES = /\.(pdf|sqlite3?|db|zip|xpi|env|pem|key|p12)$|(^|\/)\.env/i;
const PATTERNS = [
  ['credential assignment', /(api[_-]?key|token|passw(or)?d|secret)\s*[:=]\s*["'][A-Za-z0-9_\-/+]{16,}["']/i],
  ['GitHub token', /gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,}/],
  ['AWS key', /AKIA[0-9A-Z]{16}/],
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['URL with embedded credentials', /https?:\/\/[^/\s:@'"]+:[^/\s@'"]+@/],
  ['real Nutstore endpoint', /jianguoyun\.com|nutstore\.(net|com)/i],
  ['Zotero API key header', /Zotero-API-Key\s*:\s*[A-Za-z0-9]{16,}/i],
  ['Basic auth literal', /Basic [A-Za-z0-9+/]{20,}={0,2}/],
];
// Lines that are themselves scanner/test patterns or documentation of the rule.
const ALLOW = [/secret-scan\.mjs$/, /poc02-security\.test\.mjs$/];

let findings = 0;
for (const f of files) {
  if (FORBIDDEN_FILES.test(f)) { console.log(`FORBIDDEN FILE ${f}`); findings++; continue; }
  if (ALLOW.some((a) => a.test(f))) continue;
  let text;
  try { text = readFileSync(`${repo}/${f}`, 'utf8'); } catch { continue; }
  text.split('\n').forEach((line, i) => {
    for (const [name, re] of PATTERNS) if (re.test(line)) { console.log(`${name}: ${f}:${i + 1}`); findings++; }
  });
}
console.log(`secret-scan: ${files.length} changed files scanned against ${base}, ${findings} findings`);
process.exit(findings ? 1 : 0);
