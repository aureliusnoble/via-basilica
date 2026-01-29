/**
 * Prototype: Test Wikidata P31 approach for article classification
 *
 * Tests:
 * 1. Speed of batch lookups
 * 2. Coverage (what % of articles have P31 values)
 * 3. What P31 classes we encounter
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

// Load the pre-computed class mapping
const mappingPath = new URL('./src/lib/data/class-to-category.json', import.meta.url);
const CLASS_TO_CATEGORY = JSON.parse(readFileSync(mappingPath, 'utf8'));

// Fetch outgoing links from an article
async function getOutgoingLinks(title) {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'links',
    titles: title,
    plnamespace: '0',
    pllimit: '500',
    format: 'json',
    origin: '*'
  });

  const res = await fetch(`${WIKIPEDIA_API}?${params}`);
  const data = await res.json();
  const pages = data.query?.pages || {};
  const pageId = Object.keys(pages)[0];
  return (pages[pageId]?.links || []).map(l => l.title);
}

// Batch fetch Wikidata entities by Wikipedia titles (up to 50 at a time)
async function getWikidataEntities(titles) {
  // wbgetentities supports up to 50 titles per request
  const normalizedTitles = titles.map(t => t.replace(/ /g, '_'));

  const params = new URLSearchParams({
    action: 'wbgetentities',
    sites: 'enwiki',
    titles: normalizedTitles.join('|'),
    props: 'claims',
    format: 'json',
    origin: '*'
  });

  const res = await fetch(`${WIKIDATA_API}?${params}`);
  return res.json();
}

// Extract P31 values from entity claims
function getP31Values(entity) {
  const claims = entity?.claims?.P31;
  if (!claims) return [];

  return claims
    .map(claim => claim?.mainsnak?.datavalue?.value?.id)
    .filter(Boolean);
}

// Check a single batch (up to 50 titles)
async function checkBatch(titles) {
  const startTime = Date.now();
  const data = await getWikidataEntities(titles);
  const elapsed = Date.now() - startTime;

  const results = {
    found: 0,
    notFound: 0,
    hasP31: 0,
    noP31: 0,
    p31Classes: {},
    categorized: {},
    uncategorized: [],
    elapsed
  };

  const entities = data.entities || {};

  for (const [id, entity] of Object.entries(entities)) {
    if (id.startsWith('-') || entity.missing) {
      results.notFound++;
      continue;
    }

    results.found++;
    const p31Values = getP31Values(entity);

    if (p31Values.length === 0) {
      results.noP31++;
      results.uncategorized.push(entity.sitelinks?.enwiki?.title || id);
      continue;
    }

    results.hasP31++;

    // Track all P31 classes we see
    for (const classId of p31Values) {
      results.p31Classes[classId] = (results.p31Classes[classId] || 0) + 1;

      // Check if we can categorize it
      const category = CLASS_TO_CATEGORY[classId];
      if (category) {
        results.categorized[category] = (results.categorized[category] || 0) + 1;
      }
    }
  }

  return results;
}

// Process all titles in batches of 50
async function checkAllTitles(titles) {
  const BATCH_SIZE = 50;
  const allResults = {
    totalTitles: titles.length,
    found: 0,
    notFound: 0,
    hasP31: 0,
    noP31: 0,
    p31Classes: {},
    categorized: {},
    uncategorized: [],
    totalTime: 0,
    batchTimes: []
  };

  for (let i = 0; i < titles.length; i += BATCH_SIZE) {
    const batch = titles.slice(i, i + BATCH_SIZE);
    const batchResults = await checkBatch(batch);

    allResults.found += batchResults.found;
    allResults.notFound += batchResults.notFound;
    allResults.hasP31 += batchResults.hasP31;
    allResults.noP31 += batchResults.noP31;
    allResults.totalTime += batchResults.elapsed;
    allResults.batchTimes.push(batchResults.elapsed);
    allResults.uncategorized.push(...batchResults.uncategorized);

    // Merge P31 classes
    for (const [classId, count] of Object.entries(batchResults.p31Classes)) {
      allResults.p31Classes[classId] = (allResults.p31Classes[classId] || 0) + count;
    }

    // Merge categorized
    for (const [cat, count] of Object.entries(batchResults.categorized)) {
      allResults.categorized[cat] = (allResults.categorized[cat] || 0) + count;
    }
  }

  return allResults;
}

async function main() {
  console.log('=== Wikidata P31 Approach Prototype ===\n');

  // Test 1: Sanity check with known articles
  console.log('--- Test 1: Known Articles ---\n');
  const knownArticles = [
    'Saint Peter',      // Should be Q5 (human)
    'Roman Empire',     // Should be historical country/empire
    'France',           // Should be Q6256 (country)
    'Christianity',     // Should be Q9174 (religion)
    'World War II',     // Should be Q198 (war)
    'Dog',              // Should be Q16521 (taxon)
    'Cass Township, Clay County, Indiana', // Should be civil township
    'New York City',    // Should be Q515 (city)
    'Pope Francis',     // Should be Q5 (human)
    'Battle of Gettysburg', // Should be Q178561 (battle)
  ];

  const sanityResults = await checkBatch(knownArticles);
  console.log(`Time: ${sanityResults.elapsed}ms for ${knownArticles.length} articles`);
  console.log(`Found: ${sanityResults.found}, Not Found: ${sanityResults.notFound}`);
  console.log(`Has P31: ${sanityResults.hasP31}, No P31: ${sanityResults.noP31}`);
  console.log('\nP31 Classes found:');
  for (const [classId, count] of Object.entries(sanityResults.p31Classes)) {
    const category = CLASS_TO_CATEGORY[classId] || '???';
    console.log(`  ${classId}: ${count} -> ${category}`);
  }

  // Test 2: Real game scenario - outgoing links from starting article
  console.log('\n--- Test 2: Game Scenario ---\n');
  const startingArticle = 'Cass Township, Clay County, Indiana';
  console.log(`Starting article: ${startingArticle}`);

  const linksStart = Date.now();
  const links = await getOutgoingLinks(startingArticle);
  console.log(`Fetched ${links.length} outgoing links in ${Date.now() - linksStart}ms\n`);

  console.log('Checking all links via Wikidata...');
  const gameResults = await checkAllTitles(links);

  console.log('\n=== Results ===\n');
  console.log(`Total articles: ${gameResults.totalTitles}`);
  console.log(`Found in Wikidata: ${gameResults.found} (${(gameResults.found/gameResults.totalTitles*100).toFixed(1)}%)`);
  console.log(`Not found: ${gameResults.notFound}`);
  console.log(`Has P31: ${gameResults.hasP31} (${(gameResults.hasP31/gameResults.found*100).toFixed(1)}% of found)`);
  console.log(`No P31: ${gameResults.noP31}`);

  console.log('\n--- Timing ---');
  console.log(`Total time: ${gameResults.totalTime}ms`);
  console.log(`Avg per batch (50): ${(gameResults.totalTime/gameResults.batchTimes.length).toFixed(0)}ms`);
  console.log(`Avg per article: ${(gameResults.totalTime/gameResults.totalTitles).toFixed(1)}ms`);
  console.log(`Batch times: ${gameResults.batchTimes.join(', ')}ms`);

  console.log('\n--- P31 Classes Encountered ---');
  const sortedClasses = Object.entries(gameResults.p31Classes)
    .sort((a, b) => b[1] - a[1]);
  for (const [classId, count] of sortedClasses.slice(0, 20)) {
    const category = CLASS_TO_CATEGORY[classId] || '???';
    console.log(`  ${classId}: ${count} -> ${category}`);
  }

  console.log('\n--- Categorization Summary ---');
  const totalCategorized = Object.values(gameResults.categorized).reduce((a, b) => a + b, 0);
  console.log(`Mapped to our categories: ${totalCategorized} (${(totalCategorized/gameResults.hasP31*100).toFixed(1)}% of those with P31)`);
  for (const [cat, count] of Object.entries(gameResults.categorized).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }

  console.log('\n--- Uncategorized (no P31) ---');
  console.log(gameResults.uncategorized.slice(0, 10).join(', '));
  if (gameResults.uncategorized.length > 10) {
    console.log(`  ... and ${gameResults.uncategorized.length - 10} more`);
  }

  // Performance assessment
  console.log('\n=== Performance Assessment ===\n');
  if (gameResults.totalTime < 1000) {
    console.log('✓ EXCELLENT: Sub-second response');
  } else if (gameResults.totalTime < 2000) {
    console.log('✓ FAST: Under 2 seconds');
  } else if (gameResults.totalTime < 5000) {
    console.log('⚠ MODERATE: 2-5 seconds');
  } else {
    console.log('✗ SLOW: Over 5 seconds');
  }
}

main().catch(console.error);
