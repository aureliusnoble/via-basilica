#!/usr/bin/env node
/**
 * Test Wikidata P31 Classification Coverage on Random Wikipedia Articles
 *
 * This script tests the categorization coverage by:
 * 1. Fetching 100 random Wikipedia articles
 * 2. Getting outgoing links from each article
 * 3. Checking how many links can be categorized using P31 values
 *
 * Run with: node scripts/test-random-100.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

// Load the pre-computed class mapping
const mappingPath = new URL('../src/lib/data/class-to-category.json', import.meta.url);
const CLASS_MAPPING = JSON.parse(readFileSync(mappingPath, 'utf8'));

const NUM_RANDOM_ARTICLES = 20; // Test 20 articles (adjust for speed vs coverage)
const MAX_LINKS_PER_ARTICLE = 50; // Limit links per article to avoid rate limiting

// Fetch random Wikipedia articles
async function getRandomArticles(count) {
  const params = new URLSearchParams({
    action: 'query',
    list: 'random',
    rnnamespace: '0', // Main namespace only
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

// Classify using pre-computed mapping
function classifyArticle(p31Values) {
  for (const classId of p31Values) {
    if (CLASS_MAPPING[classId]) {
      return CLASS_MAPPING[classId];
    }
  }
  return null;
}

// Process a single article and return coverage stats
async function processArticle(title) {
  const links = await getOutgoingLinks(title);

  if (links.length === 0) {
    return {
      title,
      totalLinks: 0,
      categorized: 0,
      coverage: 0,
      categories: {}
    };
  }

  // Fetch P31 values in batches of 50
  const allP31 = {};
  for (let i = 0; i < links.length; i += 50) {
    const batch = links.slice(i, i + 50);
    const batchP31 = await getP31Values(batch);
    Object.assign(allP31, batchP31);
  }

  // Classify each link
  const categories = {};
  let categorized = 0;

  for (const link of links) {
    const p31s = allP31[link] || [];
    const category = classifyArticle(p31s);
    if (category) {
      categorized++;
      categories[category] = (categories[category] || 0) + 1;
    }
  }

  const coverage = links.length > 0 ? (categorized / links.length) * 100 : 0;

  return {
    title,
    totalLinks: links.length,
    categorized,
    coverage,
    categories
  };
}

async function main() {
  console.log('=== Wikidata P31 Coverage Test ===\n');
  console.log(`Testing ${NUM_RANDOM_ARTICLES} random Wikipedia articles...\n`);

  // Fetch random articles
  console.log('Fetching random articles...');
  const articles = await getRandomArticles(NUM_RANDOM_ARTICLES);
  console.log(`Got ${articles.length} articles\n`);

  // Process each article
  const results = [];
  const allCategories = {};
  let totalLinks = 0;
  let totalCategorized = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    process.stdout.write(`[${i + 1}/${articles.length}] Processing "${article}"... `);

    try {
      const result = await processArticle(article);
      results.push(result);

      totalLinks += result.totalLinks;
      totalCategorized += result.categorized;

      // Merge categories
      for (const [cat, count] of Object.entries(result.categories)) {
        allCategories[cat] = (allCategories[cat] || 0) + count;
      }

      console.log(`${result.coverage.toFixed(0)}% (${result.categorized}/${result.totalLinks})`);

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.log(`Error: ${err.message}`);
      results.push({
        title: article,
        totalLinks: 0,
        categorized: 0,
        coverage: 0,
        categories: {},
        error: err.message
      });
    }
  }

  // Calculate statistics
  const coverages = results.filter(r => r.totalLinks > 0).map(r => r.coverage);
  const avgCoverage = coverages.length > 0
    ? coverages.reduce((a, b) => a + b, 0) / coverages.length
    : 0;
  const minCoverage = coverages.length > 0 ? Math.min(...coverages) : 0;
  const maxCoverage = coverages.length > 0 ? Math.max(...coverages) : 0;

  // Print results
  console.log('\n=== Results ===\n');

  console.log('--- Coverage Statistics ---');
  console.log(`Total articles tested: ${results.length}`);
  console.log(`Total links checked: ${totalLinks}`);
  console.log(`Total categorized: ${totalCategorized} (${(totalCategorized / totalLinks * 100).toFixed(1)}%)`);
  console.log(`\nPer-article coverage:`);
  console.log(`  Average: ${avgCoverage.toFixed(1)}%`);
  console.log(`  Min: ${minCoverage.toFixed(1)}%`);
  console.log(`  Max: ${maxCoverage.toFixed(1)}%`);

  console.log('\n--- Category Distribution ---');
  const sortedCategories = Object.entries(allCategories)
    .sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sortedCategories) {
    const pct = (count / totalCategorized * 100).toFixed(1);
    console.log(`  ${cat}: ${count} (${pct}%)`);
  }

  console.log('\n--- Coverage Distribution ---');
  const buckets = {
    '0-20%': 0,
    '20-40%': 0,
    '40-60%': 0,
    '60-80%': 0,
    '80-100%': 0
  };
  for (const cov of coverages) {
    if (cov < 20) buckets['0-20%']++;
    else if (cov < 40) buckets['20-40%']++;
    else if (cov < 60) buckets['40-60%']++;
    else if (cov < 80) buckets['60-80%']++;
    else buckets['80-100%']++;
  }
  for (const [range, count] of Object.entries(buckets)) {
    const bar = '█'.repeat(Math.ceil(count / results.length * 20));
    console.log(`  ${range}: ${bar} ${count} articles`);
  }

  // Print low-coverage articles for debugging
  const lowCoverage = results
    .filter(r => r.totalLinks > 5 && r.coverage < 50)
    .slice(0, 5);
  if (lowCoverage.length > 0) {
    console.log('\n--- Low Coverage Articles (for debugging) ---');
    for (const r of lowCoverage) {
      console.log(`  "${r.title}": ${r.coverage.toFixed(1)}% (${r.categorized}/${r.totalLinks})`);
    }
  }

  console.log('\n=== Assessment ===\n');
  if (avgCoverage >= 70) {
    console.log('✓ EXCELLENT: Average coverage ≥70%');
  } else if (avgCoverage >= 50) {
    console.log('⚠ GOOD: Average coverage 50-70%');
  } else {
    console.log('✗ NEEDS IMPROVEMENT: Average coverage <50%');
  }
}

main().catch(console.error);
