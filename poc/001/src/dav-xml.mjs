// POC-001 REMEDIATION-02 P2-N1 — minimal, dependency-free, fail-closed parser for
// WebDAV PROPFIND `multistatus` bodies (RFC 4918). Elements are matched by
// namespace URI "DAV:" — never by a textual prefix — so `d:`, `D:`, any other
// prefix or a default namespace all work. Anything outside this narrow profile
// (DOCTYPE/ENTITY, CDATA, unknown entity, unbalanced tags, duplicate attributes,
// oversized input, missing structure) throws instead of yielding a partial list.
const DAV = 'DAV:';
export const MAX_PROPFIND_BYTES = 2_000_000;
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

function parseTag(raw) {
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
    if (attrs.has(a[1])) throw new DavXmlError('duplicate attribute');
    attrs.set(a[1], decodeText(a[3] ?? a[4]));
    rest = rest.slice(a[0].length);
  }
  if (rest.trim() !== '') throw new DavXmlError('bad attributes');
  return { qname: m[1], attrs, selfClosing };
}

/** Tokenise + build a tiny tree with resolved namespaces. */
export function parseXml(input) {
  const xml = typeof input === 'string' ? input : Buffer.from(input).toString('utf8');
  if (Buffer.byteLength(xml, 'utf8') > MAX_PROPFIND_BYTES) throw new DavXmlError('body too large');
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
    const t = parseTag(raw);
    const ns = new Map(stack.at(-1).ns);
    for (const [k, v] of t.attrs) {
      if (k === 'xmlns') ns.set('', v);
      else if (k.startsWith('xmlns:')) { if (!v) throw new DavXmlError('empty prefix binding'); ns.set(k.slice(6), v); }
    }
    const [prefix, local] = t.qname.includes(':') ? t.qname.split(':') : ['', t.qname];
    if (local === undefined || local.includes(':')) throw new DavXmlError('bad qname');
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

/**
 * Returns [{ href, collection, ok }] for every DAV:response. Throws on anything
 * structurally ambiguous. `ok` means a 2xx status (response-level or a propstat).
 */
export function parseMultistatus(input) {
  const root = parseXml(input);
  if (!isDav(root, 'multistatus')) throw new DavXmlError('root is not DAV:multistatus');
  const out = [];
  for (const resp of kids(root, 'response')) {
    const hrefs = kids(resp, 'href');
    if (hrefs.length !== 1) throw new DavXmlError('response must have exactly one href');
    const href = textOf(hrefs[0]).trim();
    if (!href.startsWith('/')) throw new DavXmlError('href must be an absolute path');
    const statuses = [...kids(resp, 'status'), ...kids(resp, 'propstat').flatMap((p) => kids(p, 'status'))].map((s) => textOf(s).trim());
    if (statuses.length === 0) throw new DavXmlError('response without status');
    const ok = statuses.some((s) => /^HTTP\/1\.[01] 2\d\d\b/.test(s));
    const collection = kids(resp, 'propstat').some((p) => kids(p, 'prop').some((pr) => kids(pr, 'resourcetype').some((rt) => kids(rt, 'collection').length > 0)));
    out.push({ href: decodeURI(href), collection, ok });
  }
  if (out.length === 0) throw new DavXmlError('multistatus without responses');
  return out;
}
