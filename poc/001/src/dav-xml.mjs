// POC-001 REMEDIATION-02 P2-N1 — minimal, dependency-free, fail-closed parser for
// WebDAV PROPFIND `multistatus` bodies (RFC 4918). Elements are matched by
// namespace URI "DAV:" — never by a textual prefix — so `d:`, `D:`, any other
// prefix or a default namespace all work. Anything outside this narrow profile
// (DOCTYPE/ENTITY, CDATA, unknown entity, unbalanced tags, duplicate attributes,
// oversized input, missing structure) throws instead of yielding a partial list.
const DAV = 'DAV:';
export const MAX_PROPFIND_BYTES = 2_000_000;
// REMEDIATION-05 (D007-A25) R05-1: deterministic resource bounds, enforced while parsing
// (count-and-stop BEFORE allocating), never via stack overflow or the heap limit.
export const LIMITS = Object.freeze({
  maxDepth: 64,
  maxElements: 10_000,
  maxAttrsPerElement: 64,
  maxTotalAttrs: 10_000,
  maxNsDecls: 256,
  maxBytes: MAX_PROPFIND_BYTES,
});
const PREDEF = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

class DavXmlError extends Error {
  constructor(msg) { super(`DAV_XML: ${msg}`); this.code = 'DAV_XML'; }
}

function decodeText(t) {
  if (/&(?!(#x[0-9a-fA-F]{1,6}|#[0-9]{1,7}|[a-zA-Z]{1,10});)/.test(t)) throw new DavXmlError('bare or malformed ampersand');
  return t.replace(/&(#x[0-9a-fA-F]{1,6}|#[0-9]{1,7}|[a-zA-Z]{1,10});/g, (m, ent) => {
    if (ent[0] === '#') {
      const cp = ent[1] === 'x' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      if (!(cp > 0 && cp <= 0x10ffff)) throw new DavXmlError('bad char ref');
      return String.fromCodePoint(cp);
    }
    if (!Object.hasOwn(PREDEF, ent)) throw new DavXmlError(`unknown entity &${ent};`);
    return PREDEF[ent];
  });
}

function parseTag(raw, budget) {
  // raw excludes '<' and '>'
  const selfClosing = raw.endsWith('/');
  const body = selfClosing ? raw.slice(0, -1) : raw;
  const m = /^([^\s/]+)([\s\S]*)$/.exec(body);
  if (!m) throw new DavXmlError('bad tag');
  const attrs = new Map();
  let rest = m[2];
  const attrRe = /^\s+([^\s=/"']+)\s*=\s*("([^"<]*)"|'([^'<]*)')/;
  for (;;) {
    const a = attrRe.exec(rest);
    if (!a) break;
    if (attrs.size + 1 > LIMITS.maxAttrsPerElement) throw new DavXmlError(`resource limit: more than ${LIMITS.maxAttrsPerElement} attributes on one element`);
    if (++budget.attributes > LIMITS.maxTotalAttrs) throw new DavXmlError(`resource limit: more than ${LIMITS.maxTotalAttrs} attributes in document`);
    if (attrs.has(a[1])) throw new DavXmlError('duplicate attribute');
    attrs.set(a[1], decodeText(a[3] ?? a[4]));
    rest = rest.slice(a[0].length);
  }
  if (rest.trim() !== '') throw new DavXmlError('bad attributes');
  return { qname: m[1], attrs, selfClosing };
}

/**
 * Tokenise + build a tiny tree with resolved namespaces.
 * `stats` (optional, for tests/evidence) receives counters: elements, attributes,
 * nsDecls, maxDepth, scopeMaps (namespace Maps allocated — one per DECLARING element, not
 * one per element: inherited scopes are shared by reference).
 */
export function parseXml(input, stats = {}) {
  const xml = typeof input === 'string' ? input : Buffer.from(input).toString('utf8');
  if (Buffer.byteLength(xml, 'utf8') > MAX_PROPFIND_BYTES) throw new DavXmlError('body too large');
  Object.assign(stats, { elements: 0, attributes: 0, nsDecls: 0, maxDepth: 0, scopeMaps: 1 });
  const budget = stats;
  let i = 0;
  const root = { children: [] };
  const stack = [{ node: root, ns: new Map([['xml', 'http://www.w3.org/XML/1998/namespace']]) }];
  let sawRoot = false;
  while (i < xml.length) {
    if (xml[i] !== '<') {
      const j = xml.indexOf('<', i);
      const text = xml.slice(i, j < 0 ? xml.length : j);
      if (stack.length === 1) { if (text.trim()) throw new DavXmlError('text outside root'); }
      else stack.at(-1).node.children.push({ text: decodeText(text) });
      i = j < 0 ? xml.length : j;
      continue;
    }
    if (xml.startsWith('<!--', i)) {
      const j = xml.indexOf('-->', i + 4);
      if (j < 0) throw new DavXmlError('unterminated comment');
      i = j + 3; continue;
    }
    if (xml.startsWith('<?', i)) {
      const j = xml.indexOf('?>', i + 2);
      if (j < 0 || i !== 0 || !/^<\?xml\s/.test(xml.slice(i, j))) throw new DavXmlError('processing instruction not allowed');
      i = j + 2; continue;
    }
    if (xml.startsWith('<!', i)) throw new DavXmlError('DOCTYPE/ENTITY/CDATA not allowed');
    // find tag end honouring quotes
    let j = i + 1; let q = null;
    for (; j < xml.length; j++) {
      const c = xml[j];
      if (q) { if (c === q) q = null; } else if (c === '"' || c === "'") q = c; else if (c === '>') break; else if (c === '<') throw new DavXmlError('lt in tag');
    }
    if (j >= xml.length) throw new DavXmlError('unterminated tag');
    const raw = xml.slice(i + 1, j);
    i = j + 1;
    if (raw.startsWith('/')) {
      const name = raw.slice(1).trim();
      const top = stack.pop();
      if (stack.length === 0 || top.node.qname !== name) throw new DavXmlError('mismatched close tag');
      continue;
    }
    if (stack.length === 1 && sawRoot) throw new DavXmlError('multiple roots');
    // R05-1: depth and element-count gates BEFORE any allocation for the new element.
    const depth = stack.length; // root element has depth 1
    if (depth > LIMITS.maxDepth) throw new DavXmlError(`resource limit: nesting depth > ${LIMITS.maxDepth}`);
    if (++budget.elements > LIMITS.maxElements) throw new DavXmlError(`resource limit: more than ${LIMITS.maxElements} elements`);
    if (depth > budget.maxDepth) budget.maxDepth = depth;
    const t = parseTag(raw, budget);
    // R05-1: share the parent's scope by reference; copy ONLY if this element binds a namespace.
    const parentNs = stack.at(-1).ns;
    let ns = parentNs;
    for (const [k, v] of t.attrs) {
      if (k !== 'xmlns' && !k.startsWith('xmlns:')) continue;
      if (++budget.nsDecls > LIMITS.maxNsDecls) throw new DavXmlError(`resource limit: more than ${LIMITS.maxNsDecls} namespace declarations`);
      if (ns === parentNs) { ns = new Map(parentNs); budget.scopeMaps++; }
      if (k === 'xmlns') ns.set('', v);
      else { if (!v) throw new DavXmlError('empty prefix binding'); ns.set(k.slice(6), v); }
    }
    const colon = t.qname.indexOf(':');
    if (colon !== t.qname.lastIndexOf(':')) throw new DavXmlError('bad qname (more than one colon)');
    const [prefix, local] = colon >= 0 ? [t.qname.slice(0, colon), t.qname.slice(colon + 1)] : ['', t.qname];
    if (!local || (colon >= 0 && !prefix)) throw new DavXmlError('bad qname');
    const uri = ns.get(prefix);
    if (prefix && uri === undefined) throw new DavXmlError(`unbound prefix ${prefix}`);
    const node = { qname: t.qname, ns: uri ?? null, local, children: [] };
    stack.at(-1).node.children.push(node);
    if (stack.length === 1) sawRoot = true;
    if (!t.selfClosing) stack.push({ node, ns });
  }
  if (stack.length !== 1) throw new DavXmlError('unclosed element');
  if (!sawRoot) throw new DavXmlError('no root');
  return root.children.find((c) => c.qname);
}

const isDav = (n, local) => n && n.qname && n.ns === DAV && n.local === local;
const kids = (n, local) => n.children.filter((c) => isDav(c, local));
const textOf = (n) => n.children.map((c) => (c.text !== undefined ? c.text : textOf(c))).join('');

// REMEDIATION-04 (D007-A23) R04-1: conservative POC profile for the multistatus STRUCTURE.
// Every structurally significant DAV element must sit under its expected direct parent,
// wherever it occurs in the tree; the three container levels accept only allowlisted
// children; a response-shaped element in a foreign namespace is refused. Anything else
// fails closed. Some rejected shapes are legal RFC 4918 extensions — they are outside this
// restricted POC profile, not claimed to be invalid WebDAV.
const STRUCTURAL_PARENT = {
  multistatus: [null],
  response: ['multistatus'],
  href: ['response'],
  propstat: ['response'],
  status: ['response', 'propstat'],
  prop: ['propstat'],
  resourcetype: ['prop'],
  collection: ['resourcetype'],
  responsedescription: ['multistatus', 'response', 'propstat'],
};
const ALLOWED_CHILDREN = {
  multistatus: new Set(['response', 'responsedescription']),
  response: new Set(['href', 'status', 'propstat', 'responsedescription']),
  propstat: new Set(['prop', 'status', 'responsedescription']),
};
const TEXT_ONLY = new Set(['href', 'status', 'responsedescription']);
const RESPONSE_SHAPED = new Set(['multistatus', 'response', 'propstat', 'href']);

function validateStructure(node, parent) {
  if (!node.qname) return;
  const davLocal = node.ns === DAV ? node.local : null;
  if (davLocal && Object.hasOwn(STRUCTURAL_PARENT, davLocal)) {
    const parentLocal = parent && parent.ns === DAV ? parent.local : (parent ? '#foreign' : null);
    if (!STRUCTURAL_PARENT[davLocal].includes(parentLocal)) throw new DavXmlError(`misplaced DAV:${davLocal} under ${parent ? parent.qname : 'document'}`);
  }
  if (node.ns !== DAV && RESPONSE_SHAPED.has(node.local)) throw new DavXmlError(`response-shaped element in foreign namespace: ${node.qname}`);
  if (davLocal && Object.hasOwn(ALLOWED_CHILDREN, davLocal)) {
    for (const c of node.children) {
      if (c.text !== undefined) { if (c.text.trim()) throw new DavXmlError(`unexpected text in DAV:${davLocal}`); continue; }
      if (c.ns !== DAV || !ALLOWED_CHILDREN[davLocal].has(c.local)) throw new DavXmlError(`unsupported child ${c.qname} in DAV:${davLocal}`);
    }
  }
  if (davLocal && TEXT_ONLY.has(davLocal) && node.children.some((c) => c.qname)) throw new DavXmlError(`DAV:${davLocal} must contain text only`);
  for (const c of node.children) validateStructure(c, node);
}

/**
 * Returns [{ href, collection, ok }] for every DAV:response. Throws on anything
 * structurally ambiguous. `ok` means a 2xx status (response-level or a propstat).
 */
export function parseMultistatus(input) {
  const root = parseXml(input);
  if (!isDav(root, 'multistatus')) throw new DavXmlError('root is not DAV:multistatus');
  validateStructure(root, null); // R04-1: whole-tree hierarchy check — nothing can be silently skipped
  const out = [];
  for (const resp of kids(root, 'response')) {
    const hrefs = kids(resp, 'href');
    if (hrefs.length !== 1) throw new DavXmlError('response must have exactly one href');
    const href = textOf(hrefs[0]).trim();
    if (!href.startsWith('/')) throw new DavXmlError('href must be an absolute path');
    const direct = kids(resp, 'status');
    const propstats = kids(resp, 'propstat');
    // REMEDIATION-03 Q1: RFC 4918 allows either a response-level status OR propstat(s), not both.
    if (direct.length > 0 && propstats.length > 0) throw new DavXmlError('response has both status and propstat');
    if (direct.length > 1) throw new DavXmlError('multiple response-level statuses');
    if (propstats.some((p) => kids(p, 'status').length !== 1)) throw new DavXmlError('propstat must have exactly one status');
    const statuses = [...direct, ...propstats.flatMap((p) => kids(p, 'status'))].map((s) => textOf(s).trim());
    if (statuses.length === 0) throw new DavXmlError('response without status');
    const ok = statuses.some((s) => /^HTTP\/1\.[01] 2\d\d\b/.test(s));
    // R04-2: a collection marker counts ONLY inside a propstat whose own status is 2xx.
    const is2xx = (p) => kids(p, 'status').some((st) => /^HTTP\/1\.[01] 2\d\d\b/.test(textOf(st).trim()));
    const collection = propstats.filter(is2xx).some((p) => kids(p, 'prop').some((pr) => kids(pr, 'resourcetype').some((rt) => kids(rt, 'collection').length > 0)));
    out.push({ href: decodeURI(href), collection, ok });
  }
  if (out.length === 0) throw new DavXmlError('multistatus without responses');
  return out;
}
