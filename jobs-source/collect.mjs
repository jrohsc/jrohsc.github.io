import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { sources } from './sources.mjs';
import { collectSource, pool, request } from './adapters.mjs';
import { mergeSnapshot } from './model.mjs';
import { writeSnapshot } from './snapshot.mjs';

const output = new URL('../ai-jobs/data.json', import.meta.url);
const args = process.argv.slice(2);
const value = key => args.find(a => a.startsWith(`--${key}=`))?.split('=').slice(1).join('=');
let previous;
try { previous = JSON.parse(await readFile(output, 'utf8')); } catch {}
if (value('seed-url')) {
  try {
    const live = await (await request(value('seed-url'))).json();
    if (live.schemaVersion === 1 && Array.isArray(live.jobs) && (!previous || Date.parse(live.updatedAt) > Date.parse(previous.updatedAt))) previous = live;
  } catch (e) { console.warn(`Using checked-in snapshot: ${e.message}`); }
}
const maxAge = Number(value('max-age-minutes') || 0);
if (previous && Date.now() - Date.parse(previous.updatedAt) < maxAge * 60000) {
  await writeSnapshot(previous, output);
  console.log(`Reused ${previous.updatedAt} snapshot; collection cadence is ${maxAge} minutes.`);
} else {
  // Keep the newest known good feed on disk even if CI interrupts a slow crawl.
  if (previous) await writeFile(output, JSON.stringify(previous));
  const selected = value('sources') ? sources.filter(s => value('sources').split(',').includes(s.id)) : sources;
  const results = await pool(selected, 3, async source => {
    console.log(`Scanning ${source.name}…`);
    const result = await collectSource(source);
    console.log(`${source.name}: ${result.jobs.length} listings; ${result.complete ? 'complete' : result.error || 'partial'}`);
    return result;
  });
  // A targeted diagnostic run must not discard sources it did not scan.
  const included = new Set(selected.map(s => s.id));
  const snapshot = mergeSnapshot(previous, results, new Date().toISOString());
  if (value('sources') && previous) {
    snapshot.sources.push(...previous.sources.filter(s => !included.has(s.id)));
    snapshot.jobs.push(...previous.jobs.filter(j => !included.has(j.sourceId)));
  }
  const healthy = snapshot.sources.filter(s => ['ok', 'partial'].includes(s.status));
  if (!healthy.length && !previous) throw new Error('No source could be collected; refusing to publish an empty initial feed');
  await writeSnapshot(snapshot, output);
  console.log(`Saved ${snapshot.jobs.length} US matches to ${fileURLToPath(output)} (${healthy.length}/${snapshot.sources.length} sources with results).`);
}
