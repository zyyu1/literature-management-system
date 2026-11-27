// WP-04-R1 strict JSON intake (LOCAL_SYNTHETIC_ONLY), copied from the frozen WP-03-R1 intake.
// JSON.parse silently keeps the last of two duplicate object keys, which would let a request smuggle
// a second `operationId`, `scope` or note field past a schema check. This parser implements the JSON
// grammar and fails closed on duplicate keys anywhere in the graph. Objects are created with a null
// prototype so that a literal `__proto__` key becomes an own key and is then rejected by the shared
// WP-01 key guard. The 64 KiB request cap is enforced by the server before this parser runs.
const MAX_DEPTH = 32;

export class StrictJsonError extends Error {
  constructor(code, detail) {
    super(detail || code);
    this.code = code;
  }
}

export function parseStrictJson(text) {
  let i = 0;
  const n = text.length;

  function fail(detail) { throw new StrictJsonError('BAD_JSON', detail); }

  function ws() {
    while (i < n) {
      const c = text.charCodeAt(i);
      if (c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d) i += 1;
      else break;
    }
  }

  function parseString() {
    if (text[i] !== '"') fail('string expected');
    i += 1;
    let out = '';
    let start = i;
    while (i < n) {
      const c = text.charCodeAt(i);
      if (c === 0x22) { // closing quote
        out += text.slice(start, i);
        i += 1;
        return out;
      }
      if (c === 0x5c) { // backslash
        out += text.slice(start, i);
        i += 1;
        if (i >= n) fail('unterminated escape');
        const e = text[i];
        if (e === '"' || e === '\\' || e === '/') { out += e; i += 1; }
        else if (e === 'b') { out += '\b'; i += 1; }
        else if (e === 'f') { out += '\f'; i += 1; }
        else if (e === 'n') { out += '\n'; i += 1; }
        else if (e === 'r') { out += '\r'; i += 1; }
        else if (e === 't') { out += '\t'; i += 1; }
        else if (e === 'u') {
          const hex = text.slice(i + 1, i + 5);
          if (hex.length !== 4 || !/^[0-9a-fA-F]{4}$/.test(hex)) fail('bad \\u escape');
          out += String.fromCharCode(parseInt(hex, 16));
          i += 5;
        } else {
          fail('unknown escape');
        }
        start = i;
        continue;
      }
      if (c < 0x20) fail('raw control character in string');
      i += 1;
    }
    return fail('unterminated string');
  }

  function parseNumber() {
    const m = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(i));
    if (!m) return fail('bad number');
    i += m[0].length;
    return Number(m[0]);
  }

  function parseValue(depth) {
    if (depth > MAX_DEPTH) throw new StrictJsonError('TOO_DEEP');
    ws();
    if (i >= n) fail('unexpected end');
    const c = text[i];
    if (c === '{') return parseObject(depth + 1);
    if (c === '[') return parseArray(depth + 1);
    if (c === '"') return parseString();
    if (text.startsWith('true', i)) { i += 4; return true; }
    if (text.startsWith('false', i)) { i += 5; return false; }
    if (text.startsWith('null', i)) { i += 4; return null; }
    return parseNumber();
  }

  function parseObject(depth) {
    i += 1; // {
    const obj = Object.create(null);
    const keys = new Set();
    ws();
    if (text[i] === '}') { i += 1; return obj; }
    while (true) {
      ws();
      const key = parseString();
      if (keys.has(key)) throw new StrictJsonError('DUPLICATE_FIELD');
      keys.add(key);
      ws();
      if (text[i] !== ':') fail('colon expected');
      i += 1;
      obj[key] = parseValue(depth);
      ws();
      if (text[i] === ',') { i += 1; continue; }
      if (text[i] === '}') { i += 1; return obj; }
      return fail('comma or } expected');
    }
  }

  function parseArray(depth) {
    i += 1; // [
    const arr = [];
    ws();
    if (text[i] === ']') { i += 1; return arr; }
    while (true) {
      arr.push(parseValue(depth));
      ws();
      if (text[i] === ',') { i += 1; continue; }
      if (text[i] === ']') { i += 1; return arr; }
      return fail('comma or ] expected');
    }
  }

  const value = parseValue(0);
  ws();
  if (i !== n) throw new StrictJsonError('BAD_JSON', 'trailing data');
  return value;
}
