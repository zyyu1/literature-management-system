// POC-07 — export, restore into a FRESH isolated namespace, integrity comparison,
// safe repetition, no delete cascade (LOCAL MOCK).
import test from 'node:test';
import assert from 'node:assert/strict';
import { startStack, syntheticNote } from './helpers.mjs';
import { sha256Hex } from '../src/util.mjs';

async function seedDataset(s) {
  const notes = Array.from({ length: 10 }, (_, i) => syntheticNote(9000001, undefined, i));
  for (const n of notes) assert.equal((await s.client.put('notes', n.literatureId, n, '*')).data.outcome, 'saved');
  for (const n of notes.slice(0, 6)) assert.equal((await s.client.put('progress', n.literatureId, { literatureId: n.literatureId, status: ['to_read', 'reading', 'read'][notes.indexOf(n) % 3] }, '*')).data.outcome, 'saved');
  for (let p = 0; p < 3; p++) {
    const proj = { projectId: `proj-synthetic-${p}`, name: `合成项目 ${p}`, literatureIds: notes.slice(p * 3, p * 3 + 5).map((n) => n.literatureId) };
    assert.equal((await s.client.put('projects', proj.projectId, proj, '*')).data.outcome, 'saved');
  }
  return 10 + 6 + 3;
}

const nsSnapshot = (s, ns) => s.mock.snapshot().filter((f) => f.path.startsWith(`/lms-poc/${ns}/`)).map((f) => ({ rel: f.path.slice(`/lms-poc/${ns}/`.length), sha256: f.sha256 }));

test('POC-07 export → restore to fresh namespace → hashes, counts, identities match; source untouched', async (t) => {
  const s = await startStack();
  t.after(() => s.stop());
  const expected = await seedDataset(s);
  const srcBefore = s.mock.snapshot();

  const ex = await s.client.exportAll();
  assert.equal(ex.status, 200);
  assert.equal(ex.data.count, expected);
  const bundle = ex.data;
  assert.equal(new Set(bundle.records.map((r) => `${r.kind}/${r.id}`)).size, expected, 'unique identities');
  for (const r of bundle.records) assert.equal(sha256Hex(Buffer.from(r.bytesBase64, 'base64')), r.sha256);

  const rs = await s.client.restore(bundle, 'restore-poc07-a');
  assert.equal(rs.status, 200, JSON.stringify(rs.data));
  assert.equal(rs.data.outcome, 'restored');
  assert.equal(rs.data.verified, expected);
  assert.deepEqual(nsSnapshot(s, 'restore-poc07-a'), nsSnapshot(s, s.namespace), 'restored files byte-identical (sha256) to source');

  const srcAfter = s.mock.snapshot().filter((f) => f.path.startsWith(`/lms-poc/${s.namespace}/`));
  assert.deepEqual(srcAfter, srcBefore.filter((f) => f.path.startsWith(`/lms-poc/${s.namespace}/`)), 'source namespace untouched (same bytes AND same ETags)');

  const again = await s.client.restore(bundle, 'restore-poc07-a');
  assert.equal(again.status, 409, 'repeat into same target refused, nothing overwritten');
  const second = await s.client.restore(bundle, 'restore-poc07-b');
  assert.equal(second.data.outcome, 'restored', 'repeatable into another fresh namespace');
  assert.equal(s.mock.requestLog.filter((e) => e.method === 'DELETE').length, 0, 'no delete issued at any point');
});

test('POC-07 restore safety: tampered bundle, active namespace and non-restore targets refused before any write', async (t) => {
  const s = await startStack();
  t.after(() => s.stop());
  await seedDataset(s);
  const bundle = (await s.client.exportAll()).data;
  const putsBefore = s.mock.requestLog.filter((e) => e.method === 'PUT').length;

  const tampered = structuredClone(bundle);
  const buf = Buffer.from(tampered.records[0].bytesBase64, 'base64'); buf[10] ^= 1;
  tampered.records[0].bytesBase64 = buf.toString('base64');
  assert.equal((await s.client.restore(tampered, 'restore-x')).data.error, 'bundle_integrity_failed');
  const dropped = structuredClone(bundle); dropped.records.pop();
  assert.equal((await s.client.restore(dropped, 'restore-x')).data.error, 'bundle_manifest_mismatch', 'silently missing record detected');
  for (const target of [s.namespace, 'poc-ns-other', 'restore-../x', '']) {
    assert.equal((await s.client.restore(bundle, target)).status, 400, `target ${JSON.stringify(target)} refused`);
  }
  assert.equal(s.mock.requestLog.filter((e) => e.method === 'PUT').length, putsBefore, 'no write happened');
});

test('POC-07 failures are honest: export during outage is incomplete (no partial bundle); restore write failure reported', async (t) => {
  const s = await startStack({ timeoutMs: 300 });
  t.after(() => s.stop());
  const n = await seedDataset(s);
  s.mock.faults.push({ method: 'GET', kind: 'status', status: 503 });
  const ex = await s.client.exportAll();
  assert.equal(ex.status, 503); assert.equal(ex.data.outcome, 'export_incomplete'); assert.equal(ex.data.records, undefined);
  const bundle = (await s.client.exportAll()).data;
  s.mock.faults.push({ method: 'PUT', kind: 'status', status: 507, pathIncludes: 'restore-poc07-f' });
  const rs = await s.client.restore(bundle, 'restore-poc07-f');
  assert.equal(rs.status, 502); assert.equal(rs.data.outcome, 'restore_incomplete');
  assert.equal(rs.data.verified, n - 1); assert.equal(rs.data.failures.length, 1);
});
