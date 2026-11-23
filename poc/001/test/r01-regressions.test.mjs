// REMEDIATION-01 regression tests (LOCAL MOCK). One block per QA finding.
// QA probes A–G from comment 7088088675 are re-expressed here as deterministic tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { startStack, syntheticNote, SRC } from './helpers.mjs';
import { createWebDavAdapter } from '../src/webdav-adapter.mjs';
import { encodeEnvelope, decodeEnvelope } from '../src/note-codec.mjs';
import { sha256Hex } from '../src/util.mjs';

async function seeded(t, opts) {
  const s = await startStack({ timeoutMs: 250, ...opts });
  t.after(() => s.stop());
  const note = syntheticNote();
  const c = await s.client.put('notes', note.literatureId, note, '*');
  assert.equal(c.data.outcome, 'saved');
  const path = `/lms-poc/${s.namespace}/notes/${note.literatureId}.json`;
  const puts = () => s.mock.requestLog.filter((e) => e.method === 'PUT' && e.path === path).length;
  const stored = () => decodeEnvelope(s.mock.files.get(path).bytes).data;
  return { s, note, rev: c.data.revision, path, puts, stored };
}
const rawPut = (s, id, headers, body) => fetch(`${s.apiUrl}/api/records/notes/${id}`, {
  method: 'PUT', body, headers: { Authorization: `Bearer ${s.secrets.apiToken}`, 'Content-Type': 'application/json', ...headers },
});

// ---------------------------------------------------------------- P1-1
test('P1-1 late commit after timeout: verify is non-terminal until observed; late commit → committed, never a prior false negative', async (t) => {
  const { s, note, rev, puts, stored } = await seeded(t);
  s.mock.faults.push({ method: 'PUT', kind: 'hold', holdId: 'late-1' });
  const opId = s.client.newOperationId();
  const v2 = { ...note, question: 'late commit' };
  assert.equal((await s.client.put('notes', note.literatureId, v2, rev, opId)).data.outcome, 'unknown');
  await s.mock.waitHeld('late-1');
  const before = await s.client.verify(opId);
  assert.deepEqual([before.data.outcome, before.data.terminal], ['not_yet_observed', false]);
  assert.equal((await s.client.put('notes', note.literatureId, v2, rev, opId)).data.outcome, 'verification_required');
  s.mock.release('late-1');
  for (let i = 0; i < 50 && stored().question !== 'late commit'; i++) await new Promise((r) => setTimeout(r, 10));
  assert.deepEqual(stored(), v2, 'the held request committed late at storage');
  const after = await s.client.verify(opId);
  assert.deepEqual([after.data.outcome, after.data.terminal], ['committed', true]);
  const replay = await s.client.put('notes', note.literatureId, v2, rev, opId);
  assert.equal(replay.data.outcome, 'saved');
  assert.equal(puts(), 2, 'seed + the single original attempt; nothing re-sent');
});

test('P1-1 fence before late release: terminal not_committed stays true because the late request now fails CAS', async (t) => {
  const { s, note, rev, stored } = await seeded(t);
  s.mock.faults.push({ method: 'PUT', kind: 'hold', holdId: 'late-2' });
  const opId = s.client.newOperationId();
  assert.equal((await s.client.put('notes', note.literatureId, { ...note, question: 'late 2' }, rev, opId)).data.outcome, 'unknown');
  await s.mock.waitHeld('late-2');
  const f = await s.client.fence(opId);
  assert.deepEqual([f.data.outcome, f.data.fenced, f.data.terminal], ['not_committed', true, true]);
  const logLen = s.mock.requestLog.length;
  s.mock.release('late-2');
  await new Promise((r) => setTimeout(r, 50));
  assert.deepEqual(stored(), note, 'late request was rejected by If-Match at storage; original content intact');
  assert.ok(s.mock.requestLog.length >= logLen);
  const v = await s.client.verify(opId);
  assert.deepEqual([v.data.outcome, v.data.terminal], ['not_committed', true], 'verdict consistent after the late attempt');
  assert.equal((await s.client.put('notes', note.literatureId, { ...note, question: 'late 2' }, rev, opId)).data.outcome, 'not_committed');
});

test('P1-1 create-only Unknown cannot be fenced: stays Unknown (documented UNSUPPORTED)', async (t) => {
  const s = await startStack({ timeoutMs: 250 });
  t.after(() => s.stop());
  const note = syntheticNote();
  s.mock.faults.push({ method: 'PUT', kind: 'hang' });
  const opId = s.client.newOperationId();
  // first create also triggers MKCOLs; the hang applies to the PUT only
  assert.equal((await s.client.put('notes', note.literatureId, note, '*', opId)).data.outcome, 'unknown');
  assert.equal((await s.client.verify(opId)).data.outcome, 'not_yet_observed');
  const f = await s.client.fence(opId);
  assert.equal(f.status, 422); assert.equal(f.data.outcome, 'fence_unsupported_for_create');
  assert.equal((await s.client.put('notes', note.literatureId, note, '*', opId)).data.outcome, 'verification_required');
});

// ---------------------------------------------------------------- P1-2
test('P1-2 same Operation-Id concurrently: reserved before first await → exactly one upstream PUT', async (t) => {
  const { s, note, rev, puts } = await seeded(t);
  s.mock.faults.push({ method: 'PUT', kind: 'hold', holdId: 'dup' });
  const opId = s.client.newOperationId();
  const v2 = { ...note, question: 'dup' };
  const first = s.client.put('notes', note.literatureId, v2, rev, opId);
  await s.mock.waitHeld('dup');
  const second = await s.client.put('notes', note.literatureId, v2, rev, opId);
  assert.equal(second.status, 409); assert.equal(second.data.outcome, 'operation_in_progress');
  await new Promise((r) => setTimeout(r, 400)); // exceed the 250ms adapter timeout deterministically
  s.mock.release('dup');
  assert.equal((await first).data.outcome, 'unknown', 'first attempt timed out at the API (250ms) before release');
  assert.equal(puts(), 2, 'seed + one');
});

test('P1-2 overlapping body arrival with the same Operation-Id: second request refused while first body still streaming', async (t) => {
  const { s, note, rev, puts } = await seeded(t);
  const opId = s.client.newOperationId();
  const body = Buffer.from(JSON.stringify({ ...note, question: 'slow body' }));
  const { port } = new URL(s.apiUrl);
  const slow = http.request({ host: '127.0.0.1', port, method: 'PUT', path: `/api/records/notes/${note.literatureId}`, headers: {
    Authorization: `Bearer ${s.secrets.apiToken}`, 'Content-Type': 'application/json', 'If-Match': rev, 'Operation-Id': opId, 'Content-Length': body.length } });
  const slowRes = new Promise((r) => slow.on('response', (res) => { let d = ''; res.on('data', (c) => { d += c; }); res.on('end', () => r({ status: res.statusCode, data: JSON.parse(d) })); }));
  slow.write(body.subarray(0, 10));
  await new Promise((r) => setTimeout(r, 30));
  const second = await rawPut(s, note.literatureId, { 'If-Match': rev, 'Operation-Id': opId }, body);
  assert.equal(second.status, 409);
  assert.equal((await second.json()).outcome, 'operation_in_progress');
  slow.end(body.subarray(10));
  assert.equal((await slowRes).data.outcome, 'saved');
  assert.equal(puts(), 2);
});

test('P1-2 same Operation-Id with a different payload or target is refused; replay agrees with the real result', async (t) => {
  const { s, note, rev, puts } = await seeded(t);
  const opId = s.client.newOperationId();
  const v2 = { ...note, question: 'v2' };
  const ok = await s.client.put('notes', note.literatureId, v2, rev, opId);
  assert.equal(ok.data.outcome, 'saved');
  const diff = await s.client.put('notes', note.literatureId, { ...v2, question: 'other payload' }, rev, opId);
  assert.equal(diff.status, 422); assert.equal(diff.data.error, 'operation_id_reused_with_different_payload');
  const other = await s.client.put('notes', note.literatureId, v2, ok.data.revision, opId);
  assert.equal(other.status, 422); assert.equal(other.data.error, 'operation_id_reused_for_other_target');
  const replay = await s.client.put('notes', note.literatureId, v2, rev, opId);
  assert.equal(replay.data.outcome, 'saved'); assert.equal(replay.data.revision, ok.data.revision);
  assert.equal(puts(), 2);
});

test('P1-2/P2-8 exception after reservation never strands an entry as pending', async (t) => {
  const { s, note, rev } = await seeded(t);
  let mode = 'throw-before-send';
  const real = s.adapter;
  const flaky = {
    ...real,
    get: real.get, propfind: real.propfind, remove: real.remove,
    mkcol: async (p) => { if (mode === 'throw-before-send') throw new Error('injected'); return real.mkcol(p); },
    put: async (p, b, c) => { if (mode === 'throw-after-send') { await real.put(p, b, c); throw new Error('injected'); } return real.put(p, b, c); },
  };
  const inst = await s.newInstance({ adapterOverride: flaky });
  const opA = inst.client.newOperationId();
  const r1 = await inst.client.put('notes', note.literatureId, { ...note, question: 'a' }, rev, opA);
  assert.equal(r1.status, 500);
  assert.equal(inst.api.ledger.size, 0, 'nothing was sent: reservation released');
  mode = 'throw-after-send';
  const opB = inst.client.newOperationId();
  const r2 = await inst.client.put('notes', note.literatureId, { ...note, question: 'b' }, rev, opB);
  assert.equal(r2.status, 500);
  const entry = [...inst.api.ledger.values()].find((e) => e.opId === opB);
  assert.equal(entry.verdict, 'unknown', 'sent upstream then failed: Unknown, not pending');
  assert.equal((await inst.client.verify(opB)).data.outcome, 'committed', 'and it can be resolved');
});

test('P2-8 ledger is scoped per principal: another token cannot verify, fence or spoof an operation', async (t) => {
  const { s, note, rev } = await seeded(t, { extraTokens: 1 });
  const [other] = s.extraClients;
  s.mock.faults.push({ method: 'PUT', kind: 'hang' });
  const opId = s.client.newOperationId();
  assert.equal((await s.client.put('notes', note.literatureId, { ...note, question: 'mine' }, rev, opId)).data.outcome, 'unknown');
  assert.equal((await other.verify(opId)).status, 404);
  assert.equal((await other.fence(opId)).status, 404);
  const spoof = await other.put('notes', note.literatureId, { ...note, question: 'spoof' }, rev, opId);
  assert.equal(spoof.data.outcome, 'saved', 'other principal performs its own, separate write');
  const v = await s.client.verify(opId);
  assert.equal(v.data.outcome, 'indeterminate', 'spoofed write does not count as our operation (write tag is principal-bound)');
});

test('P2-8 ledger is bounded and fails closed rather than evicting Unknown entries', async (t) => {
  const { s, note } = await seeded(t, { maxLedgerEntries: 3 });
  // seed write occupies 1 terminal entry; it may be evicted
  const ids = [];
  for (let i = 0; i < 3; i++) {
    s.mock.faults.push({ method: 'PUT', kind: 'hang' });
    const cur = await s.client.get('notes', note.literatureId);
    const op = s.client.newOperationId();
    ids.push(op);
    assert.equal((await s.client.put('notes', note.literatureId, { ...note, question: `u${i}` }, cur.data.revision, op)).data.outcome, 'unknown');
  }
  const full = await s.client.put('notes', note.literatureId, note, (await s.client.get('notes', note.literatureId)).data.revision);
  assert.equal(full.status, 503); assert.equal(full.data.reason, 'operation_ledger_full');
  for (const op of ids) assert.notEqual((await s.client.verify(op)).status, 404, 'Unknown entries were not evicted');
});

// ---------------------------------------------------------------- P1-3
test('P1-3 If-Match must be exactly one strong entity-tag; malformed variants never reach storage', async (t) => {
  const { s, note, rev, puts } = await seeded(t);
  const body = JSON.stringify(note);
  const bad = ['*', `${rev}, "x"`, `*, ${rev}`, `W/${rev}`, 'abc', '"a b"', '""', `"${'a'.repeat(129)}"`, `"x"y`, `"a\\"b"`];
  for (const im of bad) {
    const r = await rawPut(s, note.literatureId, { 'If-Match': im, 'Operation-Id': s.client.newOperationId() }, body);
    assert.equal(r.status, 400, `If-Match ${JSON.stringify(im)}`);
  }
  const both = await rawPut(s, note.literatureId, { 'If-Match': rev, 'If-None-Match': '*', 'Operation-Id': s.client.newOperationId() }, body);
  assert.equal(both.status, 400);
  const inm = await rawPut(s, note.literatureId, { 'If-None-Match': rev, 'Operation-Id': s.client.newOperationId() }, body);
  assert.equal(inm.status, 400, 'If-None-Match only accepts *');
  // duplicate If-Match header lines are folded into a list by Node → rejected
  const { port } = new URL(s.apiUrl);
  const dup = await new Promise((resolve) => {
    const sock = net.connect(port, '127.0.0.1');
    let buf = '';
    sock.on('data', (d) => { buf += d; }); sock.on('end', () => resolve(buf));
    sock.write(`PUT /api/records/notes/${note.literatureId} HTTP/1.1\r\nHost: x\r\nConnection: close\r\nAuthorization: Bearer ${s.secrets.apiToken}\r\nContent-Type: application/json\r\nOperation-Id: ${s.client.newOperationId()}\r\nIf-Match: ${rev}\r\nIf-Match: "x"\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
  });
  assert.match(dup, /^HTTP\/1\.1 400/);
  assert.equal(puts(), 1, 'no malformed precondition reached WebDAV');
  const stale = await s.client.put('notes', note.literatureId, note, '"0000000000000000-999"');
  assert.equal(stale.status, 412, 'well-formed but stale strong ETag → conflict under CAS');
});

// ---------------------------------------------------------------- P1-4
test('P1-4 https base URL fails closed: zero connections, zero Authorization sent', async (t) => {
  let connections = 0;
  const seen = [];
  const listener = http.createServer((req, res) => { seen.push(req.headers.authorization ?? null); res.end(); });
  listener.on('connection', () => { connections++; });
  await new Promise((r) => listener.listen(0, '127.0.0.1', r));
  t.after(() => new Promise((r) => listener.close(r)));
  const port = listener.address().port;
  assert.throws(() => createWebDavAdapter({ baseUrl: `https://127.0.0.1:${port}/dav`, username: 'synthetic', password: 'SYNTH-x' }), /HTTPS_TRANSPORT_NOT_IMPLEMENTED/);
  const child = spawn(process.execPath, [SRC('api-main.mjs')], {
    env: { PATH: process.env.PATH, POC_UPSTREAM_URL: `https://127.0.0.1:${port}/dav`, POC_UPSTREAM_USER: 'synthetic', POC_UPSTREAM_PASS: 'SYNTH-x', POC_API_TOKEN: 'synthetic-t', POC_NAMESPACE: 'n' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  const [code] = await once(child, 'exit');
  assert.notEqual(code, 0, 'API process refuses to start');
  assert.doesNotMatch(out, /LISTENING/);
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(connections, 0); assert.deepEqual(seen, []);
});

// ---------------------------------------------------------------- P2-5
test('P2-5 prototype-like kinds rejected on every path (records, verify, restore) before any upstream call', async (t) => {
  const { s, note } = await seeded(t);
  const before = s.mock.requestLog.length;
  for (const k of ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf']) {
    assert.equal((await s.client.raw('GET', `/api/records/${k}/x`)).status, 404, k);
    const v = await s.client.verify(s.client.newOperationId(), { kind: k, id: 'x', base: '*' });
    assert.equal(v.status, 404, `verify kind=${k}`);
  }
  const bundle = (await s.client.exportAll()).data;
  const evil = structuredClone(bundle);
  evil.records[0].kind = 'constructor';
  const r = await s.client.restore(evil, 'restore-proto');
  assert.equal(r.status, 422);
  const upstream = s.mock.requestLog.slice(before).filter((e) => /constructor|__proto__|toString|hasOwnProperty|valueOf/.test(e.path));
  assert.deepEqual(upstream, []);
  assert.ok(note);
});

// ---------------------------------------------------------------- P2-6
test('P2-6 restore validates decoded envelopes, not just self-consistent hashes', async (t) => {
  const { s, note } = await seeded(t);
  const bundle = (await s.client.exportAll()).data;
  const putsBefore = s.mock.requestLog.filter((e) => e.method === 'PUT').length;
  const forge = (bytes) => {
    const b = structuredClone(bundle);
    b.records[0].bytesBase64 = Buffer.from(bytes).toString('base64');
    b.records[0].sha256 = sha256Hex(Buffer.from(bytes));
    b.manifestSha256 = sha256Hex(Buffer.from(b.records.map((r) => `${r.kind}/${r.id} ${r.sha256}`).sort().join('\n')));
    return b;
  };
  const arbitrary = forge('{"anything": "self-hashed"}');
  assert.equal((await s.client.restore(arbitrary, 'restore-forge-a')).data.error, 'bundle_record_invalid');
  const wrongId = forge(encodeEnvelope({ kind: 'notes', id: 'lit-1-other', operationId: 'deadbeef00', data: { ...note, literatureId: 'lit-1-other' } }));
  assert.equal((await s.client.restore(wrongId, 'restore-forge-b')).data.error, 'bundle_record_invalid', 'envelope id must match declared path');
  const env = JSON.parse(Buffer.from(bundle.records[0].bytesBase64, 'base64'));
  env.data.question = 'tampered but digest not updated';
  assert.equal((await s.client.restore(forge(JSON.stringify(env)), 'restore-forge-c')).data.error, 'bundle_record_invalid', 'inner data digest checked');
  const dup = structuredClone(bundle); dup.records.push(dup.records[0]);
  assert.equal((await s.client.restore(dup, 'restore-forge-d')).data.error, 'bundle_duplicate_record');
  assert.equal(s.mock.requestLog.filter((e) => e.method === 'PUT').length, putsBefore);
});

// ---------------------------------------------------------------- P2-7
test('P2-7 export fails closed on unrecognized or invalid entries (never a silently short ok)', async (t) => {
  const { s, note } = await seeded(t);
  const base = `/lms-poc/${s.namespace}`;
  s.mock.files.set(`${base}/notes/README.txt`, { bytes: Buffer.from('stray'), etag: '"stray-1"' });
  let ex = await s.client.exportAll();
  assert.deepEqual([ex.status, ex.data.outcome, ex.data.reason], [503, 'export_incomplete', 'unrecognized_entry']);
  s.mock.files.delete(`${base}/notes/README.txt`);
  s.mock.collections.add(`${base}/unknown-kind`);
  ex = await s.client.exportAll();
  assert.equal(ex.data.reason, 'unrecognized_entry');
  s.mock.collections.delete(`${base}/unknown-kind`);
  s.mock.files.set(`${base}/notes/lit-9000001-sbadbad1.json`, { bytes: Buffer.from('{"not":"an envelope"}'), etag: '"bad-1"' });
  ex = await s.client.exportAll();
  assert.equal(ex.data.reason, 'invalid_record');
  s.mock.files.delete(`${base}/notes/lit-9000001-sbadbad1.json`);
  ex = await s.client.exportAll();
  assert.equal(ex.data.outcome, 'ok'); assert.equal(ex.data.count, 1);
  assert.ok(note);
});

// ---------------------------------------------------------------- P2-9
test('P2-9 concurrent restores into the same target: exactly one restored (in-process and across instances)', async (t) => {
  const { s } = await seeded(t);
  const bundle = (await s.client.exportAll()).data;
  const [a, b] = await Promise.all([s.client.restore(bundle, 'restore-race-1'), s.client.restore(bundle, 'restore-race-1')]);
  assert.deepEqual([a.status, b.status].sort(), [200, 409]);
  const other = await s.newInstance();
  s.mock.setBarrier({ method: 'MKCOL', pathIncludes: '/restore-race-2', count: 2 });
  const [c, d] = await Promise.all([s.client.restore(bundle, 'restore-race-2'), other.client.restore(bundle, 'restore-race-2')]);
  const outcomes = [c.data.outcome, d.data.outcome].sort();
  assert.deepEqual(outcomes, ['restored', 'target_not_fresh'], 'storage-level MKCOL acquisition decides');
});

// ---------------------------------------------------------------- P2-10
test('P2-10 committed_unverified when the storage returns no ETag (never "saved")', async (t) => {
  const { s, note, rev } = await seeded(t);
  s.mock.faults.push({ method: 'PUT', kind: 'strip-etag' });
  const r = await s.client.put('notes', note.literatureId, { ...note, question: 'no etag' }, rev);
  assert.equal(r.status, 202); assert.equal(r.data.outcome, 'committed_unverified');
});

test('P2-10 verify after API restart: caller restates target; results are never terminal', async (t) => {
  const { s, note, rev } = await seeded(t);
  s.mock.faults.push({ method: 'PUT', kind: 'commit-then-drop' });
  const opId = s.client.newOperationId();
  assert.equal((await s.client.put('notes', note.literatureId, { ...note, question: 'pre-restart' }, rev, opId)).data.outcome, 'unknown');
  const restarted = await s.newInstance();
  assert.equal((await restarted.client.verify(opId)).status, 404, 'no ledger after restart');
  const v = await restarted.client.verify(opId, { kind: 'notes', id: note.literatureId, base: rev });
  assert.deepEqual([v.data.outcome, v.data.terminal], ['committed', false]);
  const opX = restarted.client.newOperationId();
  const v2 = await restarted.client.verify(opX, { kind: 'notes', id: note.literatureId, base: v.data.currentRevision });
  assert.deepEqual([v2.data.outcome, v2.data.terminal], ['not_yet_observed', false]);
  assert.equal((await restarted.client.fence(opX)).status, 404, 'fence requires the in-process ledger');
  for (const bad of [{ kind: 'notes', id: note.literatureId, base: 'W/"x"' }, { kind: 'notes', id: '../x', base: '*' }]) {
    assert.equal((await restarted.client.verify(opX, bad)).status, 404);
  }
});

test('P2-10 corrupt read is reported as corrupt, not returned as data', async (t) => {
  const { s, note } = await seeded(t);
  s.mock.faults.push({ method: 'GET', kind: 'corrupt-read' });
  const g = await s.client.get('notes', note.literatureId);
  assert.equal(g.status, 502); assert.equal(g.data.outcome, 'corrupt_record');
  assert.equal((await s.client.get('notes', note.literatureId)).status, 200, 'next clean read fine');
});

// ---------------------------------------------------------------- P2-11
test('P2-11 validators reject unexpected fields and non-string identifiers without coercion', async (t) => {
  const { s, note } = await seeded(t);
  const lid = note.literatureId;
  const cases = [
    ['progress', lid, { literatureId: lid, status: 'read', extra: 1 }],
    ['progress', lid, { literatureId: lid, status: ['read'] }],
    ['projects', 'proj-a', { projectId: 'proj-a', name: 'x', literatureIds: [123] }],
    ['projects', 'proj-a', { projectId: 'proj-a', name: 'x', literatureIds: [[lid]] }],
    ['projects', 'proj-a', { projectId: 'proj-a', name: 'x', owner: 'someone' }],
    ['projects', 'proj-a', { projectId: 'proj-a', name: 42 }],
    ['notes', lid, JSON.parse(`{"__proto__": {"x": 1}, ${JSON.stringify(note).slice(1)}`)],
    ['notes', lid, [note]],
  ];
  for (const [kind, id, body] of cases) {
    const r = await s.client.put(kind, id, body, '*');
    assert.equal(r.status, 422, `${kind} ${JSON.stringify(body).slice(0, 60)}`);
  }
});

// ---------------------------------------------------------------- P2-12
test('P2-12 transport classification: never-connected → not_sent; connected-then-dropped → unknown', async (t) => {
  const closed = net.createServer();
  await new Promise((r) => closed.listen(0, '127.0.0.1', r));
  const closedPort = closed.address().port;
  await new Promise((r) => closed.close(r));
  const a1 = createWebDavAdapter({ baseUrl: `http://127.0.0.1:${closedPort}/x`, username: 'synthetic', password: 'SYNTH-x', timeoutMs: 300 });
  const r1 = await a1.put('/n/a.json', Buffer.from('{}'), { ifNoneMatch: '*' });
  assert.equal(r1.outcome, 'not_sent');

  const dropper = net.createServer((sock) => sock.destroy());
  await new Promise((r) => dropper.listen(0, '127.0.0.1', r));
  t.after(() => new Promise((r) => dropper.close(r)));
  const a2 = createWebDavAdapter({ baseUrl: `http://127.0.0.1:${dropper.address().port}/x`, username: 'synthetic', password: 'SYNTH-x', timeoutMs: 300 });
  const r2 = await a2.put('/n/a.json', Buffer.from('{}'), { ifNoneMatch: '*' });
  assert.equal(r2.outcome, 'unknown', `connected then reset (${r2.code}) may have delivered bytes`);

  const silent = net.createServer(() => {});
  await new Promise((r) => silent.listen(0, '127.0.0.1', r));
  t.after(() => { silent.close(); });
  const a3 = createWebDavAdapter({ baseUrl: `http://127.0.0.1:${silent.address().port}/x`, username: 'synthetic', password: 'SYNTH-x', timeoutMs: 200 });
  const r3 = await a3.put('/n/a.json', Buffer.from('{}'), { ifNoneMatch: '*' });
  assert.equal(r3.outcome, 'unknown', 'timeout after connect is Unknown');
});

test('P2-12 (QA probe G5/G6) redirects are never followed; truncated 2xx bodies are not data', async (t) => {
  let hits = 0;
  const srv = http.createServer((req, res) => {
    hits++;
    if (req.url.includes('redirect')) { res.writeHead(307, { Location: 'http://evil.invalid/steal' }); return res.end(); }
    res.writeHead(200, { 'Content-Length': 100, ETag: '"t-1"' });
    res.write('{"partial":');
    res.socket.destroy();
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  t.after(() => new Promise((r) => srv.close(r)));
  const a = createWebDavAdapter({ baseUrl: `http://127.0.0.1:${srv.address().port}/x`, username: 'synthetic', password: 'SYNTH-x', timeoutMs: 300 });
  const w = await a.put('/n/redirect.json', Buffer.from('{}'), { ifNoneMatch: '*' });
  assert.equal(w.outcome, 'unknown', '3xx on a write is not success and not a definite failure');
  const r = await a.get('/n/redirect.json');
  assert.equal(r.outcome, 'error'); assert.equal(r.status, 307);
  assert.equal(hits, 2, 'no follow-up request to the Location target');
  const tr = await a.get('/n/truncated.json');
  assert.notEqual(tr.outcome, 'ok', `truncated body must not be returned as data (got ${tr.outcome})`);
});
