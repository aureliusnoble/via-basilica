#!/usr/bin/env node
/**
 * Analyze Uncategorized P31 Classes
 *
 * This script:
 * 1. Fetches random Wikipedia articles
 * 2. Gets their outgoing links
 * 3. Fetches P31 values for all links
 * 4. Identifies which P31 classes are NOT in our mapping
 * 5. Looks up what those classes are on Wikidata
 * 6. Reports the most common uncategorized classes
 */

import { readFileSync } from 'fs';

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

// Load existing mapping
const mappingPath = new URL('../src/lib/data/class-to-category.json', import.meta.url);
const CLASS_MAPPING = JSON.parse(readFileSync(mappingPath, 'utf8'));

const NUM_ARTICLES = 50; // Test 50 random articles
const MAX_LINKS_PER_ARTICLE = 100;

// Track all uncategorized classes with counts
const uncategorizedClasses = new Map(); // classId -> { count, articles: Set }
const allP31Encountered = new Map(); // classId -> count

// Fetch random Wikipedia articles
async function getRandomArticles(count) {
  const params = new URLSearchParams({
    action: 'query',
    list: 'random',
    rnnamespace: '0',
    rnlimit: String(count),
    format: 'json',
    origin: '*'
  });

  const res = await fetch(`${WIKIPEDIA_API}?${params}`);
  const data = await res.json();
  return (data.query?.random || []).map(r => r.title);
}

// Fetch outgoing links from an article
async function getOutgoingLinks(title, limit = MAX_LINKS_PER_ARTICLE) {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'links',
    titles: title,
    plnamespace: '0',
    pllimit: String(limit),
    format: 'json',
    origin: '*'
  });

  const res = await fetch(`${WIKIPEDIA_API}?${params}`);
  const data = await res.json();
  const pages = data.query?.pages || {};
  const pageId = Object.keys(pages)[0];
  return (pages[pageId]?.links || []).map(l => l.title);
}

// Batch fetch P31 values from Wikidata
async function getP31Values(titles) {
  if (titles.length === 0) return {};

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

// Look up class labels from Wikidata
async function getClassLabels(classIds) {
  if (classIds.length === 0) return {};

  const labels = {};

  // Process in batches of 50
  for (let i = 0; i < classIds.length; i += 50) {
    const batch = classIds.slice(i, i + 50);
    const params = new URLSearchParams({
      action: 'wbgetentities',
      ids: batch.join('|'),
      props: 'labels|claims',
      languages: 'en',
      format: 'json',
      origin: '*'
    });

    const res = await fetch(`${WIKIDATA_API}?${params}`);
    const data = await res.json();

    for (const [id, entity] of Object.entries(data.entities || {})) {
      if (entity.missing) continue;

      const label = entity.labels?.en?.value || id;

      // Also get P279 (subclass of) to understand the class hierarchy
      const p279Claims = entity.claims?.P279 || [];
      const parentClasses = p279Claims
        .map(c => c?.mainsnak?.datavalue?.value?.id)
        .filter(Boolean);

      labels[id] = { label, parentClasses };
    }

    // Small delay between batches
    if (i + 50 < classIds.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  return labels;
}

// Process a single article
async function processArticle(title) {
  const links = await getOutgoingLinks(title);
  if (links.length === 0) return { total: 0, categorized: 0, uncategorized: 0 };

  // Fetch P31 values in batches
  const allP31 = {};
  for (let i = 0; i < links.length; i += 50) {
    const batch = links.slice(i, i + 50);
    const batchP31 = await getP31Values(batch);
    Object.assign(allP31, batchP31);
  }

  let categorized = 0;
  let uncategorized = 0;

  for (const link of links) {
    const p31s = allP31[link] || [];
    if (p31s.length === 0) continue;

    // Track all encountered classes
    for (const classId of p31s) {
      allP31Encountered.set(classId, (allP31Encountered.get(classId) || 0) + 1);
    }

    // Check if any P31 maps to a category
    let found = false;
    for (const classId of p31s) {
      if (CLASS_MAPPING[classId]) {
        found = true;
        categorized++;
        break;
      }
    }

    if (!found) {
      uncategorized++;
      // Track all uncategorized classes for this link
      for (const classId of p31s) {
        if (!uncategorizedClasses.has(classId)) {
          uncategorizedClasses.set(classId, { count: 0, articles: new Set() });
        }
        const entry = uncategorizedClasses.get(classId);
        entry.count++;
        entry.articles.add(link);
      }
    }
  }

  return { total: links.length, categorized, uncategorized };
}

async function main() {
  console.log('=== Analyzing Uncategorized P31 Classes ===\n');
  console.log(`Current mapping has ${Object.keys(CLASS_MAPPING).length} classes\n`);
  console.log(`Fetching ${NUM_ARTICLES} random articles...\n`);

  const articles = await getRandomArticles(NUM_ARTICLES);

  let totalLinks = 0;
  let totalCategorized = 0;
  let totalUncategorized = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    process.stdout.write(`[${i + 1}/${articles.length}] ${article.substring(0, 40).padEnd(40)}... `);

    try {
      const result = await processArticle(article);
      totalLinks += result.total;
      totalCategorized += result.categorized;
      totalUncategorized += result.uncategorized;

      const pct = result.total > 0 ? ((result.categorized / result.total) * 100).toFixed(0) : 0;
      console.log(`${pct}%`);

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.log(`Error: ${err.message}`);
    }
  }

  console.log('\n=== Summary ===\n');
  console.log(`Total links analyzed: ${totalLinks}`);
  console.log(`Categorized: ${totalCategorized} (${(totalCategorized / totalLinks * 100).toFixed(1)}%)`);
  console.log(`Uncategorized (has P31 but no mapping): ${totalUncategorized}`);

  // Get top uncategorized classes
  const sortedUncategorized = [...uncategorizedClasses.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 100);

  console.log(`\nFound ${uncategorizedClasses.size} unique uncategorized classes`);
  console.log('\nFetching labels for top uncategorized classes...\n');

  // Look up labels for top classes
  const topClassIds = sortedUncategorized.map(([id]) => id);
  const classInfo = await getClassLabels(topClassIds);

  console.log('=== Top 50 Uncategorized Classes ===\n');
  console.log('These are P31 classes that appear frequently but are not in our mapping:\n');

  const suggestions = [];

  for (let i = 0; i < Math.min(50, sortedUncategorized.length); i++) {
    const [classId, data] = sortedUncategorized[i];
    const info = classInfo[classId] || { label: '???', parentClasses: [] };
    const parents = info.parentClasses.slice(0, 3).join(', ') || 'none';

    console.log(`${(i + 1).toString().padStart(2)}. ${classId.padEnd(12)} (${data.count.toString().padStart(3)}x) - ${info.label}`);
    console.log(`    Parents: ${parents}`);
    console.log(`    Examples: ${[...data.articles].slice(0, 3).join(', ')}`);
    console.log();

    suggestions.push({
      id: classId,
      label: info.label,
      count: data.count,
      parentClasses: info.parentClasses,
      examples: [...data.articles].slice(0, 5)
    });
  }

  // Suggest category mappings
  console.log('\n=== Suggested Additions ===\n');
  console.log('Based on the class labels and parent classes, here are suggested mappings:\n');

  const categoryGuesses = {
    'human': 'People',
    'person': 'People',
    'politician': 'People',
    'athlete': 'People',
    'actor': 'People',
    'musician': 'People',
    'writer': 'People',
    'scientist': 'People',
    'artist': 'People',

    'city': 'Geography',
    'town': 'Geography',
    'village': 'Geography',
    'country': 'Geography',
    'state': 'Geography',
    'region': 'Geography',
    'settlement': 'Geography',
    'municipality': 'Geography',
    'district': 'Geography',
    'county': 'Geography',
    'province': 'Geography',
    'territory': 'Geography',
    'location': 'Geography',
    'place': 'Geography',

    'film': 'Arts',
    'movie': 'Arts',
    'album': 'Arts',
    'song': 'Arts',
    'television': 'Arts',
    'series': 'Arts',
    'book': 'Arts',
    'novel': 'Arts',
    'painting': 'Arts',
    'artwork': 'Arts',

    'sport': 'Sports',
    'team': 'Sports',
    'club': 'Sports',
    'league': 'Sports',
    'season': 'Sports',
    'championship': 'Sports',
    'tournament': 'Sports',
    'match': 'Sports',
    'game': 'Sports',
    'athlete': 'Sports',
    'player': 'Sports',

    'war': 'History',
    'battle': 'History',
    'conflict': 'History',
    'revolution': 'History',
    'historical': 'History',
    'empire': 'History',
    'dynasty': 'History',

    'religion': 'Religion',
    'church': 'Religion',
    'religious': 'Religion',
    'saint': 'Religion',
    'deity': 'Religion',
    'god': 'Religion',

    'species': 'Science',
    'taxon': 'Science',
    'genus': 'Science',
    'family': 'Science',
    'chemical': 'Science',
    'compound': 'Science',
    'protein': 'Science',
    'gene': 'Science',
    'star': 'Science',
    'galaxy': 'Science',
    'planet': 'Science',
    'asteroid': 'Science',

    'university': 'Education',
    'college': 'Education',
    'school': 'Education',
    'academy': 'Education',
    'institute': 'Education',

    'language': 'Language',

    'law': 'Law',
    'court': 'Law',
    'legal': 'Law',

    'government': 'Government',
    'agency': 'Government',
    'ministry': 'Government',
    'party': 'Government',
    'political': 'Government',

    'organization': 'Society',
    'company': 'Society',
    'corporation': 'Society',
    'association': 'Society',

    'disambiguation': 'Skip', // Wikimedia pages
    'wikimedia': 'Skip',
    'list': 'Skip',
    'template': 'Skip',
    'category': 'Skip',
  };

  const suggestedMappings = [];

  for (const item of suggestions) {
    const labelLower = item.label.toLowerCase();
    let suggestedCategory = null;

    for (const [keyword, category] of Object.entries(categoryGuesses)) {
      if (labelLower.includes(keyword)) {
        suggestedCategory = category;
        break;
      }
    }

    if (suggestedCategory && suggestedCategory !== 'Skip') {
      suggestedMappings.push({
        id: item.id,
        label: item.label,
        category: suggestedCategory,
        count: item.count
      });
    }
  }

  // Output as JavaScript for easy copying
  console.log('// Add these to the build script or directly to the mapping:\n');
  console.log('const ADDITIONAL_CLASSES = {');
  for (const mapping of suggestedMappings.slice(0, 30)) {
    console.log(`  '${mapping.id}': '${mapping.category}', // ${mapping.label} (${mapping.count}x)`);
  }
  console.log('};\n');

  // Also output classes that need manual review
  console.log('\n=== Classes Needing Manual Review ===\n');
  const needsReview = suggestions.filter(s => {
    const labelLower = s.label.toLowerCase();
    return !Object.keys(categoryGuesses).some(k => labelLower.includes(k));
  }).slice(0, 20);

  for (const item of needsReview) {
    console.log(`${item.id}: "${item.label}" (${item.count}x)`);
    console.log(`  Examples: ${item.examples.join(', ')}`);
  }
}

main().catch(console.error);
