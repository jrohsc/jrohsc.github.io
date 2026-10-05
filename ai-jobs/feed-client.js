// A tiny manifest is polled frequently; the full feed is downloaded only on change.
export function createFeedClient({ base = '.', fallbackBase = '.', fetchImpl = fetch, now = Date.now } = {}) {
  let revision = null, latestAt = 0, hasSnapshot = false, pending = null;
  async function get(path) {
    const response = await fetchImpl(path, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`Feed request failed: HTTP ${response.status}`);
    return response.json();
  }
  function validate(snapshot) {
    if (snapshot?.schemaVersion !== 1 || !Array.isArray(snapshot.jobs) || !Array.isArray(snapshot.sources) || !Number.isFinite(Date.parse(snapshot.updatedAt))) throw new Error('Unexpected feed format');
    if (Date.parse(snapshot.updatedAt) < latestAt) throw new Error('Feed is older than the current results');
    return snapshot;
  }
  async function check() {
    try {
      const manifest = await get(`${base}/manifest.json?check=${now()}`);
      if (manifest?.schemaVersion !== 1 || !/^[a-f0-9]{64}$/.test(manifest.revision || '') || !Number.isFinite(Date.parse(manifest.updatedAt))) throw new Error('Unexpected feed manifest');
      if (hasSnapshot && revision === manifest.revision) return { snapshot: null, checkedAt: now(), mode: 'live' };
      const snapshot = validate(await get(`${base}/data.json?revision=${manifest.revision}`));
      if (snapshot.updatedAt !== manifest.updatedAt) throw new Error('A new feed is being published; retrying on the next check');
      revision = manifest.revision; latestAt = Date.parse(snapshot.updatedAt); hasSnapshot = true;
      return { snapshot, checkedAt: now(), mode: 'live' };
    } catch (error) {
      if (hasSnapshot || base === fallbackBase) throw error;
      const snapshot = validate(await get(`${fallbackBase}/data.json?check=${now()}`));
      latestAt = Date.parse(snapshot.updatedAt); hasSnapshot = true;
      return { snapshot, checkedAt: now(), mode: 'backup' };
    }
  }
  return { poll() { return pending || (pending = check().finally(() => { pending = null; })); } };
}
