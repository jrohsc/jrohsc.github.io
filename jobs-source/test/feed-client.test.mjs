import test from 'node:test';
import assert from 'node:assert/strict';
import { createFeedClient } from '../../ai-jobs/feed-client.js';
import { manifestFor } from '../snapshot.mjs';

const snapshot = { schemaVersion: 1, updatedAt: '2026-10-05T18:00:00Z', refreshMinutes: 5, jobs: [{ id: 'example:1' }], sources: [] };
function server(initial = snapshot) {
  let current = structuredClone(initial), failure = false, calls = [];
  return { calls, update(value) { current = value; }, fail(value) { failure = value; },
    async fetch(url) {
      calls.push(url);
      if (failure) return { ok: false, status: 503 };
      return { ok: true, json: async () => url.includes('manifest.json') ? manifestFor(current) : structuredClone(current) };
    } };
}
test('30-second checks download only the manifest when the revision is unchanged', async () => {
  const api = server(), client = createFeedClient({ fetchImpl: api.fetch });
  assert.deepEqual((await client.poll()).snapshot, snapshot);
  assert.equal((await client.poll()).snapshot, null);
  assert.equal(api.calls.filter(url => url.includes('data.json')).length, 1);
  assert.equal(api.calls.filter(url => url.includes('manifest.json')).length, 2);
});
test('a changed feed is fetched and concurrent checks share one request', async () => {
  const api = server(), client = createFeedClient({ fetchImpl: api.fetch });
  await client.poll();
  const next = { ...snapshot, updatedAt: '2026-10-05T18:05:00Z', jobs: [...snapshot.jobs, { id: 'example:2' }] };
  api.update(next);
  const [a, b] = await Promise.all([client.poll(), client.poll()]);
  assert.equal(a.snapshot.jobs.length, 2); assert.equal(b.snapshot.jobs.length, 2);
  assert.equal(api.calls.length, 4);
});
test('failed refresh retains the current revision and reconnects on a later check', async () => {
  const api = server(), client = createFeedClient({ fetchImpl: api.fetch });
  await client.poll(); api.fail(true);
  await assert.rejects(client.poll(), /503/);
  api.fail(false);
  assert.equal((await client.poll()).snapshot, null);
  assert.equal(api.calls.filter(url => url.includes('data.json')).length, 1);
});
test('backup is used on first-load outage but never downgrades a loaded feed', async () => {
  let online = false;
  const calls = [], client = createFeedClient({ base: 'https://raw.example/feed', fetchImpl: async url => {
    calls.push(url);
    if (url.startsWith('https:') && !online) return { ok: false, status: 503 };
    return { ok: true, json: async () => url.includes('manifest') ? manifestFor(snapshot) : snapshot };
  } });
  assert.equal((await client.poll()).mode, 'backup');
  assert.equal(calls.filter(url => url.startsWith('./data')).length, 1);
  await assert.rejects(client.poll(), /503/);
  online = true;
  assert.equal((await client.poll()).mode, 'live');
});
test('out-of-order cached snapshots and mismatched publication pairs are rejected', async () => {
  const api = server(), client = createFeedClient({ fetchImpl: api.fetch });
  await client.poll();
  api.update({ ...snapshot, updatedAt: '2026-10-05T17:55:00Z' });
  await assert.rejects(client.poll(), /older/);
  const mixed = createFeedClient({ fetchImpl: async url => ({ ok: true, json: async () => url.includes('manifest') ? manifestFor({ ...snapshot, updatedAt: '2026-10-05T18:05:00Z' }) : snapshot }) });
  await assert.rejects(mixed.poll(), /being published/);
});
test('manifest identifies content changes even if the collection timestamp is unchanged', () => {
  assert.equal(manifestFor(snapshot).revision.length, 64);
  assert.equal(manifestFor(snapshot).revision, manifestFor(structuredClone(snapshot)).revision);
  assert.notEqual(manifestFor(snapshot).revision, manifestFor({ ...snapshot, jobs: [] }).revision);
  assert.equal(manifestFor(snapshot).pollSeconds, 30);
});
