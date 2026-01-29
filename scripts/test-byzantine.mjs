#!/usr/bin/env node
/**
 * Test classification for Byzantine-related articles
 * to debug why blocked links aren't showing
 */

import { readFileSync } from 'fs';

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

// Load the mapping
const mappingPath = new URL('../src/lib/data/class-to-category.json', import.meta.url);
const mapping = JSON.parse(readFileSync(mappingPath, 'utf8'));

async function getP31Values(titles) {
  const normalized = titles.map(t => t.replace(/ /g, '_'));
  const params = new URLSearchParams({
    action: 'wbgetentities',
    sites: 'enwiki',
    titles: normalized.join('|'),
    props: 'claims|sitelinks',
    format: 'json',
    origin: '*'
  });

  const res = await fetch(`${WIKIDATA_API}?${params}`);
  const data = await res.json();

  const results = {};
  for (const [id, entity] of Object.entries(data.entities || {})) {
    if (id.startsWith('-') || entity.missing) continue;
    const title = entity.sitelinks?.enwiki?.title;
    if (!title) continue;
    const claims = entity.claims?.P31 || [];
    const p31s = claims.map(c => c?.mainsnak?.datavalue?.value?.id).filter(Boolean);
    results[title] = p31s;
  }
  return results;
}

function classifyArticle(p31Values, blockedCategories) {
  for (const classId of p31Values) {
    const category = mapping[classId];
    if (category && blockedCategories.includes(category)) {
      return category;
    }
  }
  return null;
}

async function test() {
  // Articles that should be blocked for Religion/History on a Byzantine page
  const testArticles = [
    'Byzantine Empire',
    'Roman Empire',
    'Christianity',
    'Constantinople',
    'Justinian I',
    'Hagia Sophia',
    'Eastern Orthodox Church',
    'Theodora (wife of Justinian I)',
    'Belisarius',
    'Greek language',
    'Jesus',
    'Pope',
    'Battle of Manzikert',
    'Crusades',
    'Ottoman Empire'
  ];

  console.log('=== Testing Byzantine Article Classification ===\n');
  console.log('Blocked categories: Religion, History\n');

  const p31Data = await getP31Values(testArticles);
  const blockedCategories = ['Religion', 'History'];

  let blockedCount = 0;
  let notBlockedCount = 0;

  for (const article of testArticles) {
    const p31s = p31Data[article] || [];
    const categories = p31s.map(id => mapping[id] || '???');
    const blocked = classifyArticle(p31s, blockedCategories);

    if (blocked) blockedCount++;
    else notBlockedCount++;

    console.log(`${blocked ? '🚫' : '✓ '} ${article}:`);
    console.log(`   P31: ${p31s.length > 0 ? p31s.slice(0, 3).join(', ') : 'NONE'}`);
    console.log(`   Category: ${categories.length > 0 ? [...new Set(categories)].slice(0, 3).join(', ') : 'NONE'}`);
    console.log(`   Blocked: ${blocked || 'NO'}`);
    console.log();
  }

  console.log('=== Summary ===');
  console.log(`Blocked: ${blockedCount}/${testArticles.length}`);
  console.log(`Not blocked: ${notBlockedCount}/${testArticles.length}`);

  if (notBlockedCount > blockedCount) {
    console.log('\n⚠️  Most articles are NOT being blocked!');
    console.log('This suggests a classification issue with the mapping.');
  }
}

test().catch(console.error);
