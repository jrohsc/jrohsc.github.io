import { createHash } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';

export function manifestFor(snapshot, serialized = JSON.stringify(snapshot)) {
  return { schemaVersion: 1, revision: createHash('sha256').update(serialized).digest('hex'),
    updatedAt: snapshot.updatedAt, refreshMinutes: snapshot.refreshMinutes, pollSeconds: 30 };
}
export async function writeSnapshot(snapshot, output = new URL('../ai-jobs/data.json', import.meta.url)) {
  const body = JSON.stringify(snapshot);
  await mkdir(new URL('./', output), { recursive: true });
  await writeFile(output, body);
  await writeFile(new URL('manifest.json', output), JSON.stringify(manifestFor(snapshot, body)));
}
