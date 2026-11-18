import { readFile, writeFile } from 'node:fs/promises';

// The repository token can read the public star count but not the stargazer list.
const core = '/metrics/source/plugins/core/index.mjs';
const source = await readFile(core, 'utf8');
const original = 'computed.repositories[property] += repository[property]?.totalCount ?? 0';
const countPublicStars = 'computed.repositories[property] += repository[property]?.totalCount ?? (property === "stargazers" ? repository.stargazerCount ?? 0 : 0)';
if (!source.includes(original)) {
  throw new Error('Metrics changed how it reads repository counts');
}
await writeFile(core, source.replace(original, countPublicStars));
await import('/metrics/source/app/action/index.mjs');
