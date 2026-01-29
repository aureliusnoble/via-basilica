/**
 * Test pre-computed class mapping approach
 *
 * Strategy:
 * 1. Use SPARQL to get ALL classes that are subclasses of our target categories
 * 2. Store this mapping in a simple JSON object
 * 3. At runtime: Get P31 → instant lookup in mapping
 */

const WIKIDATA_SPARQL = 'https://query.wikidata.org/sparql';
const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

// Query SPARQL endpoint
async function querySparql(query) {
  const params = new URLSearchParams({ query, format: 'json' });
  const res = await fetch(`${WIKIDATA_SPARQL}?${params}`, {
    headers: {
      'Accept': 'application/sparql-results+json',
      'User-Agent': 'WikiGame/1.0'
    }
  });
  if (!res.ok) throw new Error(`SPARQL failed: ${res.status}`);
  return res.json();
}

// Get ALL subclasses of a target class (limited to avoid timeout)
async function getAllSubclasses(targetClassId, label, limit = 10000) {
  console.log(`Fetching subclasses of ${label} (${targetClassId})...`);

  const query = `
    SELECT DISTINCT ?class WHERE {
      ?class wdt:P279* wd:${targetClassId} .
    }
    LIMIT ${limit}
  `;

  const startTime = Date.now();
  const result = await querySparql(query);
  const elapsed = Date.now() - startTime;

  const classes = (result.results?.bindings || [])
    .map(b => b.class?.value?.split('/').pop())
    .filter(Boolean);

  console.log(`  Found ${classes.length} subclasses in ${elapsed}ms`);
  return classes;
}

// Build the complete mapping
async function buildClassMapping() {
  const mapping = {};

  const targets = [
    { id: 'Q486972', category: 'Geography', label: 'human settlement' },
    { id: 'Q56061', category: 'Geography', label: 'administrative territorial entity' },
    { id: 'Q5', category: 'People', label: 'human' },
    { id: 'Q9174', category: 'Religion', label: 'religion' },
    { id: 'Q1530022', category: 'Religion', label: 'religious organization' },
    { id: 'Q24398318', category: 'Religion', label: 'religious building' },
    { id: 'Q13418847', category: 'History', label: 'historical event' },
    { id: 'Q11514315', category: 'History', label: 'historical period' },
    { id: 'Q48349', category: 'History', label: 'empire' },
    { id: 'Q198', category: 'History', label: 'war' },
  ];

  for (const target of targets) {
    const subclasses = await getAllSubclasses(target.id, target.label);
    for (const classId of subclasses) {
      // First match wins (in case of overlap)
      if (!mapping[classId]) {
        mapping[classId] = target.category;
      }
    }
  }

  return mapping;
}

// Batch fetch Wikidata P31 values
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

    // Get the original Wikipedia title
    const sitelink = entity.sitelinks?.enwiki;
    const title = sitelink?.title;
    if (!title) continue;

    const claims = entity.claims?.P31 || [];
    const p31s = claims
      .map(c => c?.mainsnak?.datavalue?.value?.id)
      .filter(Boolean);
    results[title] = p31s;
  }

  return results;
}

// Get outgoing links from Wikipedia
async function getOutgoingLinks(title) {
  const params = new URLSearchParams({
    action: 'query', prop: 'links', titles: title,
    plnamespace: '0', pllimit: '500', format: 'json', origin: '*'
  });
  const res = await fetch(`${WIKIPEDIA_API}?${params}`);
  const data = await res.json();
  const pages = data.query?.pages || {};
  const pageId = Object.keys(pages)[0];
  return (pages[pageId]?.links || []).map(l => l.title);
}

// Classify articles using pre-computed mapping
function classifyWithMapping(p31Values, mapping) {
  for (const classId of p31Values) {
    if (mapping[classId]) {
      return mapping[classId];
    }
  }
  return null;
}

async function main() {
  console.log('=== Pre-computed Class Mapping Test ===\n');

  // Step 1: Build the mapping (this would be done offline and stored)
  console.log('--- Step 1: Building class mapping ---\n');
  const buildStart = Date.now();
  const classMapping = await buildClassMapping();
  const buildTime = Date.now() - buildStart;

  const totalClasses = Object.keys(classMapping).length;
  console.log(`\nBuilt mapping with ${totalClasses} classes in ${buildTime}ms`);

  // Show distribution
  const categoryCount = {};
  for (const cat of Object.values(classMapping)) {
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  }
  console.log('\nCategory distribution:');
  for (const [cat, count] of Object.entries(categoryCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count} classes`);
  }

  // Step 2: Test with real game scenario
  console.log('\n--- Step 2: Game scenario test ---\n');

  const startingArticle = 'Cass Township, Clay County, Indiana';
  console.log(`Starting article: ${startingArticle}`);

  // Get outgoing links
  const linksStart = Date.now();
  const links = await getOutgoingLinks(startingArticle);
  console.log(`Fetched ${links.length} links in ${Date.now() - linksStart}ms`);

  // Get P31 values for all links (batch)
  const p31Start = Date.now();
  const allP31 = {};
  for (let i = 0; i < links.length; i += 50) {
    const batch = links.slice(i, i + 50);
    const batchP31 = await getP31Values(batch);
    Object.assign(allP31, batchP31);
  }
  const p31Time = Date.now() - p31Start;
  console.log(`Fetched P31 values in ${p31Time}ms`);

  // Classify using pre-computed mapping
  const classifyStart = Date.now();
  const results = {
    categorized: {},
    uncategorized: [],
    noP31: []
  };

  for (const link of links) {
    const p31s = allP31[link];
    if (!p31s || p31s.length === 0) {
      results.noP31.push(link);
      continue;
    }

    const category = classifyWithMapping(p31s, classMapping);
    if (category) {
      results.categorized[category] = results.categorized[category] || [];
      results.categorized[category].push(link);
    } else {
      results.uncategorized.push({ title: link, classes: p31s });
    }
  }
  const classifyTime = Date.now() - classifyStart;

  // Report
  console.log('\n=== Results ===\n');

  const totalCategorized = Object.values(results.categorized).flat().length;
  console.log(`Categorized: ${totalCategorized}/${links.length} (${(totalCategorized/links.length*100).toFixed(1)}%)`);
  console.log(`No P31: ${results.noP31.length}`);
  console.log(`Uncategorized (has P31 but unknown class): ${results.uncategorized.length}`);

  console.log('\nBy category:');
  for (const [cat, articles] of Object.entries(results.categorized)) {
    console.log(`  ${cat}: ${articles.length}`);
  }

  console.log('\n--- Timing ---');
  console.log(`P31 fetch: ${p31Time}ms`);
  console.log(`Classification: ${classifyTime}ms`);
  console.log(`TOTAL (excluding pre-build): ${p31Time + classifyTime}ms`);

  console.log('\n--- Uncategorized classes ---');
  const unknownClasses = new Set();
  for (const item of results.uncategorized) {
    for (const c of item.classes) unknownClasses.add(c);
  }
  console.log([...unknownClasses].slice(0, 10).join(', '));
}

main().catch(console.error);
