// POC-02 — server-side credential boundary, allowlist, auth, redaction, SSRF (LOCAL MOCK).
import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import util from 'node:util';
import { readFile } from 'node:fs/promises';
import { startStack, syntheticNote, SRC } from './helpers.mjs';
import { createWebDavAdapter } from '../src/webdav-adapter.mjs';
import { createSafeApi } from '../src/safe-api.mjs';

/** Raw HTTP so the path is sent byte-for-byte (fetch would normalize "..").  */
function raw(apiUrl, requestLine, headers = {}) {
  const { port } = new URL(apiUrl);
  return new Promise((resolve, reject) => {
    const sock = net.connect(port, '127.0.0.1');
    let buf = '';
    sock.on('data', (d) => { buf += d; });
    sock.on('end', () => resolve(buf));
    sock.on('error', reject);
    const h = Object.entries({ Host: `127.0.0.1:${port}`, Connection: 'close', ...headers }).map(([k, v]) => `${k}: ${v}`).join('\r\n');
    sock.write(`${requestLine}\r\n${h}\r\n\r\n`);
  });
}
const statusOf = (resp) => Number(/^HTTP\/1\.1 (\d{3})/.exec(resp)?.[1]);

test('POC-02 authentication and request validation', async (t) => {
  const s = await startStack();
  t.after(() => s.stop());
  const note = syntheticNote();
  const base = s.apiUrl + `/api/records/notes/${note.literatureId}`;
  assert.equal((await fetch(s.apiUrl + '/api/health')).status, 200);
  assert.equal((await fetch(base)).status, 401, 'no token');
  assert.equal((await fetch(base, { headers: { Authorization: 'Bearer wrong-token' } })).status, 401, 'wrong token');
  assert.equal((await fetch(base, { headers: { Authorization: `Basic ${Buffer.from('a:b').toString('base64')}` } })).status, 401, 'basic auth not accepted');
  assert.equal((await fetch(`${base}?token=${s.secrets.apiToken}`)).status, 401, 'token in query is not auth');

  const put = (headers, body = JSON.stringify(note)) => fetch(base, { method: 'PUT', body, headers: { Authorization: `Bearer ${s.secrets.apiToken}`, 'Content-Type': 'application/json', ...headers } });
  assert.equal((await put({ 'Operation-Id': s.client.newOperationId() })).status, 428, 'precondition required');
  assert.equal((await put({ 'If-None-Match': '*' })).status, 400, 'operation id required');
  assert.equal((await put({ 'If-None-Match': '*', 'Operation-Id': s.client.newOperationId(), 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await put({ 'If-None-Match': '*', 'Operation-Id': s.client.newOperationId() }, 'x'.repeat(1_000_001))).status, 413);
  const extra = await s.client.put('notes', note.literatureId, { ...note, target: 'http://evil.invalid/' }, '*');
  assert.equal(extra.status, 422, 'unexpected field (e.g. smuggled target URL) rejected');
  const wrongId = await s.client.put('notes', note.literatureId, { ...note, literatureId: 'lit-1-other' }, '*');
  assert.equal(wrongId.status, 422, 'body identity must equal path identity');
  assert.equal(s.mock.requestLog.filter((e) => e.method === 'PUT').length, 0, 'no rejected request reached storage');
});

test('POC-02 path/kind allowlist, traversal, SSRF and origin', async (t) => {
  const s = await startStack();
  t.after(() => s.stop());
  const auth = { Authorization: `Bearer ${s.secrets.apiToken}` };
  const cases = [
    ['GET /api/records/notes/..%2f..%2fsecret HTTP/1.1', 400],
    ['GET /api/records/notes/%2e%2e HTTP/1.1', 400],
    ['GET /api/records/notes/../../etc/passwd HTTP/1.1', 404],
    ['GET /api/records/notes/a%5cb HTTP/1.1', 400],
    ['GET /api/records/notes/UPPER HTTP/1.1', 400],
    ['GET /api/records/notes/a.json HTTP/1.1', 400],
    [`GET /api/records/notes/${'a'.repeat(65)} HTTP/1.1`, 400],
    ['GET /api/records/__proto__/x HTTP/1.1', 404],
    ['GET /api/records/constructor/x HTTP/1.1', 404],
    ['GET /api/records/secrets/x HTTP/1.1', 404],
    ['GET http://169.254.169.254/latest/meta-data HTTP/1.1', 400],
    ['GET http://127.0.0.1:1/api/records/notes/x HTTP/1.1', 400],
    ['GET /api/records/notes/x?url=http://evil.invalid/ HTTP/1.1', 400],
    ['GET /api/records/notes/x?target=//evil.invalid HTTP/1.1', 400],
    ['GET /api/export?namespace=other HTTP/1.1', 400],
    ['DELETE /api/records/notes/x HTTP/1.1', 405],
  ];
  for (const [line, expected] of cases) {
    const resp = await raw(s.apiUrl, line, auth);
    assert.equal(statusOf(resp), expected, line);
    assert.doesNotMatch(resp, /access-control-allow-origin/i);
  }
  const hostSpoof = await raw(s.apiUrl, 'GET /api/records/notes/x HTTP/1.1', { ...auth, Host: 'evil.invalid', 'X-Forwarded-Host': 'evil.invalid' });
  assert.equal(statusOf(hostSpoof), 404, 'Host header has no routing effect (record simply not found)');
  const evilOrigin = await raw(s.apiUrl, 'GET /api/records/notes/x HTTP/1.1', { ...auth, Origin: 'https://evil.invalid' });
  assert.equal(statusOf(evilOrigin), 403);

  const davHost = new URL(s.dav.url).host;
  for (const e of s.mock.requestLog) {
    assert.equal(e.host, davHost, 'upstream requests only ever go to the configured mock');
    assert.ok(e.path.startsWith(`/lms-poc/${s.namespace}`), `only namespace paths reach storage: ${e.path}`);
  }
});

test('POC-02 credentials never leave the server side (responses, headers, logs, client code)', async (t) => {
  const s = await startStack();
  t.after(() => s.stop());
  const transcript = [];
  const record = (r) => transcript.push(JSON.stringify(r));
  const note = syntheticNote();
  const c = await s.client.put('notes', note.literatureId, note, '*'); record(c);
  record(await s.client.get('notes', note.literatureId));
  record(await s.client.markdown('notes', note.literatureId));
  record(await s.client.put('notes', note.literatureId, note, '"stale"'));
  record(await s.client.exportAll());
  s.mock.faults.push({ method: 'PUT', kind: 'status', status: 500 });
  record(await s.client.put('notes', note.literatureId, note, c.data.revision));
  s.mock.revokeCredentials();
  record(await s.client.put('notes', note.literatureId, note, c.data.revision));
  record(await s.client.get('notes', note.literatureId));
  s.mock.restoreCredentials();

  const basic = Buffer.from(`${s.secrets.davUser}:${s.secrets.davPass}`).toString('base64');
  const haystacks = {
    responses: transcript.join('\n'),
    logs: JSON.stringify(s.logs),
    adapterSerialized: JSON.stringify(s.adapter) + util.inspect(s.adapter),
    clientSource: await readFile(SRC('client.mjs'), 'utf8'),
  };
  for (const [name, hay] of Object.entries(haystacks)) {
    for (const secret of [s.secrets.davPass, s.secrets.davUser, basic, s.dav.url]) {
      assert.ok(!hay.includes(secret), `${name} must not contain upstream credential/URL`);
    }
  }
  assert.ok(!haystacks.logs.includes(s.secrets.apiToken), 'logs must not contain API session token');
  assert.match(transcript.at(-2), /upstream_auth/, 'expired upstream credential surfaces as a generic upstream_auth error');
});

test('POC-02 default-deny real network and loopback-only listeners', async () => {
  const mk = (baseUrl) => () => createWebDavAdapter({ baseUrl, username: 'synthetic', password: 'synthetic' });
  assert.throws(mk('https://dav.example.com/dav/'), /HTTPS_TRANSPORT_NOT_IMPLEMENTED/, 'https fails closed before any host check or network');
  assert.throws(mk('http://dav.example.com/dav/'), /REAL_SERVICE_BLOCKED/);
  assert.throws(mk('http://10.0.0.5/dav/'), /REAL_SERVICE_BLOCKED/);
  assert.throws(mk('http://user:pw@127.0.0.1:1/dav/'), /must not be embedded/);
  assert.throws(mk('file:///etc/passwd'), /unsupported protocol/);
  const adapter = createWebDavAdapter({ baseUrl: 'http://127.0.0.1:1/x', username: 'synthetic', password: 'synthetic' });
  assert.throws(() => createSafeApi({ adapter, namespace: 'n', apiTokens: ['t'], host: '0.0.0.0' }), /REAL_SERVICE_BLOCKED/);
  const s = await startStack();
  try {
    assert.equal(new URL(s.apiUrl).hostname, '127.0.0.1');
    assert.equal(new URL(s.dav.url).hostname, '127.0.0.1');
  } finally { await s.stop(); }
});
