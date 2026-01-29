#!/usr/bin/env node
import { readFileSync } from 'fs';

const mappingPath = new URL('../src/lib/data/class-to-category.json', import.meta.url);
const mapping = JSON.parse(readFileSync(mappingPath, 'utf8'));

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

async function checkP279Chain(classId, depth = 0, visited = new Set()) {
  if (depth > 4 || visited.has(classId)) return;
  visited.add(classId);

  const params = new URLSearchParams({
    action: 'wbgetentities',
    ids: classId,
    props: 'claims|labels',
    languages: 'en',
    format: 'json',
    origin: '*'
  });

  const res = await fetch(`${WIKIDATA_API}?${params}`);
  const data = await res.json();
  const entity = data.entities?.[classId];
  if (!entity) return;

  const label = entity.labels?.en?.value || classId;
  const p279Claims = entity.claims?.P279 || [];
  const parents = p279Claims.map(c => c?.mainsnak?.datavalue?.value?.id).filter(Boolean);

  const inMapping = mapping[classId] ? `-> ${mapping[classId]}` : '';
  console.log('  '.repeat(depth) + `${classId}: ${label} ${inMapping}`);

  for (const parent of parents.slice(0, 3)) {
    await checkP279Chain(parent, depth + 1, visited);
  }
}

const classId = process.argv[2] || 'Q183770';
console.log(`=== P279 Chain for ${classId} ===\n`);
checkP279Chain(classId);
