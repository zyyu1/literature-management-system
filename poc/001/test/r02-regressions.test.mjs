// REMEDIATION-02 regression tests (LOCAL MOCK). One block per finding from re-QA comment 7088521226.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { startStack, syntheticNote } from './helpers.mjs';
import { createWebDavAdapter } from '../src/webdav-adapter.mjs';
import { createSafeApi } from '../src/safe-api.mjs';
import { createClient } from '../src/client.mjs';
import { encodeEnvelope, decodeEnvelope } from '../src/note-codec.mjs';
import { randomId, sha256Hex } from '../src/util.mjs';

async function seeded(t, opts = {}) {
  const s = await startStack({ timeoutMs: 250, ...opts });
  t.after(() => s.stop());
  const note = syntheticNote();
  const c = await s.client.put('notes', note.literatureId, note, '*');
  const path = `/lms-poc/${s.namespace}/notes/${note.literatureId}.json`;
  const puts = () => s.mock.requestLog.filter((e) => e.method === 'PUT' && e.path === path).length;
  const stored = () => decodeEnvelope(s.mock.files.get(path).bytes).data;
  return { s, note, c, rev: c.data.revision, path, puts, stored };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 2000) { const t0 = Date.now(); while (!fn()) { if (Date.now() - t0 > ms) throw new Error('timeout'); await sleep(10); } }

// ---------------------------------------------------------------- P1-R1
test('P1-R1 content-hash ETags: identical-bytes fence keeps the ETag → fence_not_confirmed, never terminal; late commit then resolves to committed', async (t) => {
  const { s, note, c, rev, stored } = await seeded(t, { mockOptions: { etagMode: 'content-hash' } });
  assert.equal(c.data.outcome, 'saved', 'content-hash strong ETags are trusted for normal saves');
  s.mock.faults.push({ method: 'PUT', kind: 'hold', holdId: 'r1' });
  const opId = s.client.newOperationId();
  const v2 = { ...note, question: 'late under content-hash' };
  assert.equal((await s.client.put('notes', note.literatureId, v2, rev, opId)).data.outcome, 'unknown');
  await s.mock.waitHeld('r1');
  const f = await s.client.fence(opId);
  assert.deepEqual([f.data.outcome, f.data.reason, f.data.terminal], ['fence_not_confirmed', 'etag_unchanged', false]);
  assert.equal((await s.client.put('notes', note.literatureId, v2, rev, opId)).data.outcome, 'verification_required', 'still Unknown');
  s.mock.release('r1');
  await until(() => stored().question === v2.question);
  const v = await s.client.verify(opId);
  assert.deepEqual([v.data.outcome, v.data.terminal], ['committed', true], 'no false cached not_committed');
  assert.equal((await s.client.put('notes', note.literatureId, v2, rev, opId)).data.outcome, 'saved');
});

test('P1-R1 generation ETags, race order A (fence → late release): terminal not_committed holds; late write rejected', async (t) => {
  const { s, note, rev, stored } = await seeded(t);
  s.mock.faults.push({ method: 'PUT', kind: 'hold', holdId: 'oa' });
  const opId = s.client.newOperationId();
  assert.equal((await s.client.put('notes', note.literatureId, { ...note, question: 'A' }, rev, opId)).data.outcome, 'unknown');
  await s.mock.waitHeld('oa');
  const f = await s.client.fence(opId);
  assert.deepEqual([f.data.outcome, f.data.terminal], ['not_committed', true]);
  assert.notEqual(f.data.currentRevision, rev, 'fence produced a different strong ETag');
  s.mock.release('oa');
  await sleep(60);
  assert.deepEqual(stored(), note);
  assert.equal((await s.client.verify(opId)).data.outcome, 'not_committed');
});

test('P1-R1 generation ETags, race order B (late release → fence): fence observes our write → committed', async (t) => {
  const { s, note, rev, stored } = await seeded(t);
  s.mock.faults.push({ method: 'PUT', kind: 'hold', holdId: 'ob' });
  const opId = s.client.newOperationId();
  const v2 = { ...note, question: 'B' };
  assert.equal((await s.client.put('notes', note.literatureId, v2, rev, opId)).data.outcome, 'unknown');
  await s.mock.waitHeld('ob');
  s.mock.release('ob');
  await until(() => stored().question === 'B');
  const f = await s.client.fence(opId);
  assert.deepEqual([f.data.outcome, f.data.terminal], ['committed', true]);
});

test('P1-R1 fence PUT without ETag / with untrusted ETag is not terminal', async (t) => {
  const { s, note, rev } = await seeded(t);
  for (const kind of ['strip-etag']) {
    s.mock.faults.push({ method: 'PUT', kind: 'hang' });
    const opId = s.client.newOperationId();
    const cur = (await s.client.get('notes', note.literatureId)).data.revision;
    assert.equal((await s.client.put('notes', note.literatureId, { ...note, question: kind }, cur, opId)).data.outcome, 'unknown');
    s.mock.faults.push({ method: 'PUT', kind });
    const f = await s.client.fence(opId);
    assert.deepEqual([f.data.outcome, f.data.reason, f.data.terminal], ['fence_not_confirmed', 'no_etag', false]);
  }
  assert.ok(rev);
});

// ---------------------------------------------------------------- P2-N1
for (const style of ['d', 'D', 'default', 'z']) {
  test(`P2-N1 PROPFIND namespace style "${style}": 2 stored records → export count 2`, async (t) => {
    const s = await startStack({ mockOptions: { xmlStyle: style } });
    t.after(() => s.stop());
    for (let i = 0; i < 2; i++) { const n = syntheticNote(9000001, undefined, i); assert.equal((await s.client.put('notes', n.literatureId, n, '*')).data.outcome, 'saved'); }
    const ex = await s.client.exportAll();
    assert.equal(ex.status, 200); assert.equal(ex.data.count, 2);
  });
}

test('P2-N1 malformed / foreign / incomplete listings fail closed (never 200 with a short or empty list)', async (t) => {
  let override = null;
  const s = await startStack({ mockOptions: { propfindOverride: (p) => (override ? override(p) : null) } });
  t.after(() => s.stop());
  for (let i = 0; i < 2; i++) { const n = syntheticNote(9000001, undefined, i); await s.client.put('notes', n.literatureId, n, '*'); }
  const ns = `/lms-poc/${s.namespace}`;
  const resp = (href, extra = '<d:status>HTTP/1.1 200 OK</d:status>', col = false) => `<d:response><d:href>${href}</d:href><d:propstat><d:prop><d:resourcetype>${col ? '<d:collection/>' : ''}</d:resourcetype></d:prop>${extra}</d:propstat></d:response>`;
  const ms = (body, decl = 'xmlns:d="DAV:"') => `<?xml version="1.0"?><d:multistatus ${decl}>${body}</d:multistatus>`;
  const rootOk = ms(resp(`${ns}/`, undefined, true) + resp(`${ns}/notes/`, undefined, true));
  const fixtures = {
    'missing self href': ms(resp(`${ns}/notes/`, undefined, true)),
    'foreign href': ms(resp(`${ns}/`, undefined, true) + resp('/elsewhere/notes/', undefined, true)),
    'truncated xml': rootOk.slice(0, -20),
    'DOCTYPE + entity': `<!DOCTYPE d [<!ENTITY x "y">]>${rootOk}`,
    'unknown entity': rootOk.replace(`${ns}/notes/`, `${ns}/notes&x;/`),
    'non-DAV namespace': ms(resp(`${ns}/`, undefined, true), 'xmlns:d="urn:not-dav"'),
    'entry with 404 status': ms(resp(`${ns}/`, undefined, true) + resp(`${ns}/notes/`, '<d:status>HTTP/1.1 404 Not Found</d:status>', true)),
    'entry without status': ms(resp(`${ns}/`, undefined, true) + resp(`${ns}/notes/`, '', true)),
    'absolute-URL href': ms(resp(`http://evil.invalid${ns}/`, undefined, true)),
    'CDATA': rootOk.replace('</d:multistatus>', '<![CDATA[x]]></d:multistatus>'),
    'oversized body': ms(resp(`${ns}/`, undefined, true) + '<!--' + 'x'.repeat(2_100_000) + '-->'),
  };
  for (const [name, xml] of Object.entries(fixtures)) {
    override = (p) => (p === ns ? xml : null);
    const ex = await s.client.exportAll();
    assert.equal(ex.status, 503, name); assert.equal(ex.data.outcome, 'export_incomplete', name);
    assert.equal(ex.data.records, undefined, `${name}: no partial bundle`);
  }
  override = (p) => (p === `${ns}/notes` ? ms(resp(`${ns}/notes/`, undefined, true)) : null); // kind listing silently empty, no self issue
  const empty = await s.client.exportAll();
  assert.equal(empty.data.count, 0, 'a well-formed listing that is genuinely empty is accepted as empty');
  override = (p) => (p === `${ns}/notes` ? ms(resp(`${ns}/notes/x.json`)) : null);
  assert.equal((await s.client.exportAll()).data.reason, 'malformed_listing', 'kind listing without its self entry');
  override = null;
  assert.equal((await s.client.exportAll()).data.count, 2);
});

// ---------------------------------------------------------------- P2-N2
test('P2-N2 absolute deadline beats a byte-trickling peer: write → Unknown (not pending), read → unavailable', async (t) => {
  const { s, note, rev } = await seeded(t, { timeoutMs: 300, deadlineMs: 900 });
  s.mock.faults.push({ method: 'PUT', kind: 'trickle' });
  const opId = s.client.newOperationId();
  const t0 = Date.now();
  const r = await s.client.put('notes', note.literatureId, { ...note, question: 'trickle' }, rev, opId);
  const took = Date.now() - t0;
  assert.equal(r.data.outcome, 'unknown');
  assert.ok(took < 2500, `bounded by the absolute deadline (took ${took}ms)`);
  const entry = [...s.api.ledger.values()].find((e) => e.opId === opId);
  assert.equal(entry.verdict, 'unknown', 'not stuck pending');
  assert.equal((await s.client.verify(opId)).data.outcome, 'committed', 'the trickled write had applied; verify finds our tag');
  s.mock.faults.push({ method: 'GET', kind: 'trickle' });
  const t1 = Date.now();
  const g = await s.client.get('notes', note.literatureId);
  assert.equal(g.status, 503); assert.ok(Date.now() - t1 < 2500);
});

test('P2-N2 response bodies are bounded (no unbounded buffering)', async (t) => {
  const big = http.createServer((req, res) => { res.writeHead(200, { ETag: '"b-1"' }); res.end(Buffer.alloc(50_000, 120)); });
  await new Promise((r) => big.listen(0, '127.0.0.1', r));
  t.after(() => new Promise((r) => big.close(r)));
  const a = createWebDavAdapter({ baseUrl: `http://127.0.0.1:${big.address().port}/x`, username: 'synthetic', password: 'SYNTH-x', maxResponseBytes: 10_000 });
  const g = await a.get('/n/a.json');
  assert.equal(g.outcome, 'unavailable'); assert.equal(g.code, 'ERESPONSETOOLARGE');
});

// ---------------------------------------------------------------- P2-N3
test('P2-N3 evicted operations are tombstoned: replay refused (operation_expired), zero re-dispatch', async (t) => {
  const { s, note, puts, stored } = await seeded(t, { maxPerPrincipal: 2, maxTombstonesPerPrincipal: 3 });
  const rev0 = (await s.client.get('notes', note.literatureId)).data.revision;
  s.mock.faults.push({ method: 'PUT', kind: 'status', status: 429 });
  const op429 = s.client.newOperationId();
  const v429 = { ...note, question: 'was rate limited' };
  assert.equal((await s.client.put('notes', note.literatureId, v429, rev0, op429)).data.reason, 'rate_limited');
  let cur = rev0;
  for (let i = 0; i < 2; i++) { // push op429 (and the seed) out of the live ledger
    const r = await s.client.put('notes', note.literatureId, { ...note, question: `fill ${i}` }, cur);
    assert.equal(r.data.outcome, 'saved'); cur = r.data.revision;
  }
  assert.ok(!([...s.api.ledger.values()].some((e) => e.opId === op429)), 'evicted from live ledger');
  const before = puts();
  const replay = await s.client.put('notes', note.literatureId, v429, rev0, op429);
  assert.equal(replay.status, 409); assert.deepEqual([replay.data.outcome, replay.data.priorVerdict], ['operation_expired', 'not_saved']);
  assert.equal(puts(), before, 'not re-dispatched (the QA re-dispatch case)');
  const v = await s.client.verify(op429);
  assert.deepEqual([v.data.outcome, v.data.expired], ['not_saved', true]);
  assert.equal(stored().question, 'fill 1');
});

test('P2-N3 beyond the tombstone window / after restart: unsupported, but conditional writes still prevent a lost update', async (t) => {
  const { s, note, rev, stored } = await seeded(t, { maxPerPrincipal: 1, maxTombstonesPerPrincipal: 1 });
  const op = s.client.newOperationId();
  const v1 = { ...note, question: 'v1' };
  const w1 = await s.client.put('notes', note.literatureId, v1, rev, op);
  assert.equal(w1.data.outcome, 'saved');
  let cur = w1.data.revision;
  for (let i = 0; i < 3; i++) { const r = await s.client.put('notes', note.literatureId, { ...note, question: `later ${i}` }, cur); cur = r.data.revision; }
  assert.ok(!s.api.tombstones.has([...s.api.tombstones.keys()].find((k) => k.endsWith(op))), 'op fell out of the window');
  const replay = await s.client.put('notes', note.literatureId, v1, rev, op);
  assert.equal(replay.status, 412, 'dispatched again (window exceeded) but the stale base makes CAS reject it');
  assert.equal(stored().question, 'later 2', 'newer data not overwritten');
  const restarted = await s.newInstance();
  const rr = await restarted.client.put('notes', note.literatureId, v1, rev, op);
  assert.equal(rr.status, 412, 'same after a restart');
});

// ---------------------------------------------------------------- P2-N4
test('P2-N4 stable principal ids across instances with reversed token order: no cross-principal poisoning', async (t) => {
  const { s, note, rev } = await seeded(t, { extraTokens: 1 });
  const tokA = s.secrets.apiToken; const tokB = s.secrets.extraTokens[0];
  const inst2 = await s.newInstance({ tokens: [tokB, tokA] });
  assert.equal(s.api.principalIdFor(tokA), inst2.api.principalIdFor(tokA));
  assert.notEqual(s.api.principalIdFor(tokA), inst2.api.principalIdFor(tokB));
  const clientB2 = createClient({ apiUrl: inst2.url, token: tokB });
  s.mock.faults.push({ method: 'PUT', kind: 'hang' });
  const opId = s.client.newOperationId();
  assert.equal((await s.client.put('notes', note.literatureId, { ...note, question: 'A mine' }, rev, opId)).data.outcome, 'unknown');
  const spoof = await clientB2.put('notes', note.literatureId, { ...note, question: 'B with A op id' }, rev, opId);
  assert.equal(spoof.data.outcome, 'saved');
  const v = await s.client.verify(opId);
  assert.equal(v.data.outcome, 'indeterminate', 'not verification_failed, not committed');
});

test('P2-N4 forged envelopes (well-formed tag, wrong/missing provenance) are rejected on read, export and restore', async (t) => {
  const { s, note } = await seeded(t);
  const forgedId = 'lit-9000001-sforged1';
  const forged = encodeEnvelope({ kind: 'notes', id: forgedId, operationId: randomId(16), data: { ...note, literatureId: forgedId }, provenance: randomId(32) });
  s.mock.files.set(`/lms-poc/${s.namespace}/notes/${forgedId}.json`, { bytes: forged, etag: '"forged-1"' });
  assert.equal((await s.client.get('notes', forgedId)).data.outcome, 'unauthenticated_record');
  const ex = await s.client.exportAll();
  assert.deepEqual([ex.status, ex.data.reason], [503, 'unauthenticated_record']);
  s.mock.files.delete(`/lms-poc/${s.namespace}/notes/${forgedId}.json`);
  const bundle = (await s.client.exportAll()).data;
  const b = structuredClone(bundle);
  b.records[0].bytesBase64 = forged.toString('base64'); b.records[0].id = forgedId; b.records[0].sha256 = sha256Hex(forged);
  b.manifestSha256 = sha256Hex(Buffer.from(b.records.map((r) => `${r.kind}/${r.id} ${r.sha256}`).sort().join('\n')));
  assert.equal((await s.client.restore(b, 'restore-forged')).data.error, 'bundle_record_unauthenticated');
  const otherKey = await s.newInstance({ provenanceKey: `SYNTH-OTHER-KEY-${randomId(20)}` });
  assert.equal((await otherKey.client.get('notes', note.literatureId)).data.outcome, 'unauthenticated_record', 'different key: portability UNSUPPORTED, fails closed');
});

test('P2-N4 reserved restore- prefix: an active namespace may not be restore-*', async () => {
  const adapter = createWebDavAdapter({ baseUrl: 'http://127.0.0.1:1/x', username: 'synthetic', password: 'SYNTH-x' });
  assert.throws(() => createSafeApi({ adapter, namespace: 'restore-live', apiTokens: ['t'], provenanceKey: 'SYNTH-PROVENANCE-KEY-000000000000000' }), /reserved restore- prefix/);
  assert.throws(() => createSafeApi({ adapter, namespace: 'n', apiTokens: ['t'], provenanceKey: 'short' }), /provenanceKey/);
});

// ---------------------------------------------------------------- P2-N5
test('P2-N5 per-principal quota: one principal exhausting its slots does not block another', async (t) => {
  const { s, note } = await seeded(t, { maxPerPrincipal: 2, extraTokens: 1 });
  const [other] = s.extraClients;
  const before = s.mock.requestLog.filter((e) => e.method === 'PUT').length;
  for (let i = 0; i < 2; i++) {
    s.mock.faults.push({ method: 'PUT', kind: 'hang' });
    const cur = (await s.client.get('notes', note.literatureId)).data.revision;
    assert.equal((await s.client.put('notes', note.literatureId, { ...note, question: `u${i}` }, cur)).data.outcome, 'unknown');
  }
  const full = await s.client.put('notes', note.literatureId, note, (await s.client.get('notes', note.literatureId)).data.revision);
  assert.deepEqual([full.status, full.data.outcome, full.data.reason], [503, 'not_saved', 'principal_ledger_full']);
  assert.equal(s.mock.requestLog.filter((e) => e.method === 'PUT').length, before + 2, 'rejected before dispatch');
  const n2 = syntheticNote();
  assert.equal((await other.put('notes', n2.literatureId, n2, '*')).data.outcome, 'saved', 'other principal unaffected');
});

// ---------------------------------------------------------------- P2-N6
test('P2-N6 concurrent fences are serialised; fence timeout stays Unknown; deleted record → record_missing', async (t) => {
  const { s, note, rev, path } = await seeded(t);
  s.mock.faults.push({ method: 'PUT', kind: 'hang' });
  const opId = s.client.newOperationId();
  assert.equal((await s.client.put('notes', note.literatureId, { ...note, question: 'x' }, rev, opId)).data.outcome, 'unknown');
  s.mock.faults.push({ method: 'PUT', kind: 'hold', holdId: 'fence' });
  const f1 = s.client.fence(opId);
  await s.mock.waitHeld('fence');
  const f2 = await s.client.fence(opId);
  assert.deepEqual([f2.status, f2.data.outcome, f2.data.terminal], [409, 'fence_in_progress', false]);
  await sleep(400); // let the fence PUT exceed the 250ms adapter timeout before the storage applies it
  s.mock.release('fence');
  const r1 = await f1;
  assert.equal(r1.data.terminal, false, 'held fence PUT timed out at the API → not confirmed');
  assert.equal(r1.data.outcome, 'fence_not_confirmed');
  assert.notEqual((await s.client.verify(opId)).data.terminal, true);

  const opB = s.client.newOperationId();
  const cur = (await s.client.get('notes', note.literatureId)).data.revision;
  s.mock.faults.push({ method: 'PUT', kind: 'hang' });
  assert.equal((await s.client.put('notes', note.literatureId, { ...note, question: 'y' }, cur, opB)).data.outcome, 'unknown');
  s.mock.faults.push({ method: 'PUT', kind: 'hang' });
  const ft = await s.client.fence(opB);
  assert.deepEqual([ft.data.outcome, ft.data.reason, ft.data.terminal], ['fence_not_confirmed', 'fence_unknown', false]);

  s.mock.files.delete(path);
  const fd = await s.client.fence(opB);
  assert.deepEqual([fd.data.outcome, fd.data.terminal], ['record_missing', false]);
  assert.deepEqual([(await s.client.verify(opB)).data.outcome], ['record_missing']);
});

// ---------------------------------------------------------------- P2-N7
test('P2-N7 POC If-Match profile: RFC-legal comma tag refused as out-of-profile; lists refused; zero upstream', async (t) => {
  const { s, note, puts } = await seeded(t);
  const before = puts();
  const send = (im) => fetch(`${s.apiUrl}/api/records/notes/${note.literatureId}`, { method: 'PUT', body: JSON.stringify(note), headers: { Authorization: `Bearer ${s.secrets.apiToken}`, 'Content-Type': 'application/json', 'If-Match': im, 'Operation-Id': s.client.newOperationId() } }).then(async (r) => [r.status, (await r.json()).error]);
  assert.deepEqual(await send('"a,b"'), [400, 'if_match_outside_poc_profile']);
  assert.deepEqual(await send('"a","b"'), [400, 'invalid_if_match']);
  assert.deepEqual(await send('"a", "b"'), [400, 'invalid_if_match']);
  assert.equal(puts(), before);
});

// ---------------------------------------------------------------- P2-N8
test('P2-N8 weak ETags (local negative fixture): never "saved", never stripped, updates refused explicitly', async (t) => {
  const s = await startStack({ mockOptions: { etagMode: 'weak' } });
  t.after(() => s.stop());
  const note = syntheticNote();
  const c = await s.client.put('notes', note.literatureId, note, '*');
  assert.deepEqual([c.status, c.data.outcome, c.data.reason], [202, 'committed_unverified', 'untrusted_etag']);
  const g = await s.client.get('notes', note.literatureId);
  assert.match(g.data.revision, /^W\//); assert.equal(g.data.revisionStrong, false);
  const u = await s.client.put('notes', note.literatureId, { ...note, question: 'update' }, g.data.revision);
  assert.deepEqual([u.status, u.data.error], [400, 'unsupported_weak_etag']);
  assert.equal(s.mock.requestLog.filter((e) => e.method === 'PUT' && e.ifMatch).length, 0, 'no If-Match (stripped or not) reached storage');
  assert.deepEqual(decodeEnvelope(s.mock.files.get(`/lms-poc/${s.namespace}/notes/${note.literatureId}.json`).bytes).data, note);
});

test('P2-N8 differing strong ETag between PUT response and GET → committed_unverified (readback_mismatch)', async (t) => {
  const { s, note, rev } = await seeded(t);
  s.mock.faults.push({ method: 'PUT', kind: 'bogus-etag' });
  const r = await s.client.put('notes', note.literatureId, { ...note, question: 'bogus' }, rev);
  assert.deepEqual([r.status, r.data.outcome, r.data.reason], [202, 'committed_unverified', 'readback_mismatch']);
});
