/**
 * Test script to measure the speed and accuracy of category blocking
 * in a real game scenario.
 *
 * Scenario: Navigate from "Cass Township, Clay County, Indiana" to "Basil the Great"
 * with History and Religion blocked.
 */

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const SUPABASE_FUNCTION_URL = 'https://myqirnopmypcgonszouc.supabase.co/functions/v1/check-article-categories';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cWlybm9wbXlwY2dvbnN6b3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDc2NzIsImV4cCI6MjA4NTIyMzY3Mn0.VwPa7VOKYc3cdmurRjMUgoZ3fNA0gk5Z58avAULfENc';

const STARTING_ARTICLE = 'Cass Township, Clay County, Indiana';
const BLOCKED_CATEGORIES = ['History', 'Religion'];

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

// Call the Supabase edge function to check blocked categories
async function checkBlockedCategories(titles, blockedCategories) {
  const startTime = Date.now();

  const res = await fetch(SUPABASE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ titles, blockedCategories })
  });

  const data = await res.json();
  const elapsed = Date.now() - startTime;

  return { data, elapsed };
}

// Get article categories directly for verification
async function getArticleCategories(title) {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'categories',
    titles: title,
    cllimit: '50',
    format: 'json',
    origin: '*'
  });

  const res = await fetch(`${WIKIPEDIA_API}?${params}`);
  const data = await res.json();
  const pages = data.query?.pages || {};
  const pageId = Object.keys(pages)[0];
  const cats = pages[pageId]?.categories;
  if (!cats) return [];
  return cats.map(c => c.title.replace('Category:', ''));
}

async function main() {
  // First, test with known articles that should definitely be blocked
  console.log('=== Sanity Check: Testing Known Articles ===\n');
  const knownArticles = [
    'Saint Peter',      // Should be Religion
    'Roman Empire',     // Should be History
    'France',           // Should be Geography (not blocked)
    'Christianity',     // Should be Religion
    'World War II',     // Should be History
    'Dog',              // Should not be blocked
  ];

  const { data: sanityData, elapsed: sanityElapsed } = await checkBlockedCategories(knownArticles, BLOCKED_CATEGORIES);
  console.log(`Sanity check took ${sanityElapsed}ms\n`);
  console.log('Raw response:', JSON.stringify(sanityData, null, 2));

  if (sanityData.error) {
    console.error('Error:', sanityData.error);
  } else {
    for (const article of knownArticles) {
      const blocked = sanityData.blockedLinks?.[article];
      console.log(`  ${article}: ${blocked ? `BLOCKED (${blocked})` : 'allowed'}`);
    }
  }

  console.log('\n=== Game Scenario Test ===\n');
  console.log(`Starting article: ${STARTING_ARTICLE}`);
  console.log(`Blocked categories: ${BLOCKED_CATEGORIES.join(', ')}\n`);

  // Step 1: Get outgoing links from the starting article
  console.log('Fetching outgoing links...');
  const linksStartTime = Date.now();
  const links = await getOutgoingLinks(STARTING_ARTICLE);
  const linksFetchTime = Date.now() - linksStartTime;
  console.log(`Found ${links.length} outgoing links (took ${linksFetchTime}ms)\n`);

  if (links.length === 0) {
    console.log('No links found. Exiting.');
    return;
  }

  // Step 2: Check blocked categories via edge function
  console.log(`Checking ${links.length} links for blocked categories...`);
  const { data, elapsed } = await checkBlockedCategories(links, BLOCKED_CATEGORIES);

  if (data.error) {
    console.error('Error from edge function:', data.error);
    return;
  }

  const blockedLinks = data.blockedLinks || {};

  // Step 3: Analyze results
  const blocked = [];
  const allowed = [];

  for (const link of links) {
    const blockedCategory = blockedLinks[link];
    if (blockedCategory) {
      blocked.push({ title: link, category: blockedCategory });
    } else {
      allowed.push(link);
    }
  }

  console.log('\n=== Results ===\n');
  console.log(`Total time for category check: ${elapsed}ms`);
  console.log(`Average time per link: ${(elapsed / links.length).toFixed(1)}ms`);
  console.log(`\nBlocked: ${blocked.length} links`);
  console.log(`Allowed: ${allowed.length} links`);
  console.log(`Block rate: ${((blocked.length / links.length) * 100).toFixed(1)}%`);

  // Show blocked links by category
  console.log('\n=== Blocked Links by Category ===\n');
  const byCategory = {};
  for (const item of blocked) {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item.title);
  }

  for (const [cat, titles] of Object.entries(byCategory)) {
    console.log(`${cat} (${titles.length}):`);
    for (const title of titles.slice(0, 10)) {
      console.log(`  - ${title}`);
    }
    if (titles.length > 10) {
      console.log(`  ... and ${titles.length - 10} more`);
    }
    console.log('');
  }

  // Show some allowed links
  console.log('=== Sample Allowed Links ===\n');
  for (const title of allowed.slice(0, 15)) {
    console.log(`  - ${title}`);
  }
  if (allowed.length > 15) {
    console.log(`  ... and ${allowed.length - 15} more`);
  }

  // Verify a few blocked links by fetching their categories directly
  console.log('\n=== Verification (checking actual Wikipedia categories) ===\n');
  const samplesToVerify = blocked.slice(0, 3);
  for (const item of samplesToVerify) {
    const cats = await getArticleCategories(item.title);
    console.log(`${item.title} (blocked as ${item.category}):`);
    console.log(`  Categories: ${cats.slice(0, 5).join(', ')}${cats.length > 5 ? '...' : ''}`);
    console.log('');
  }

  // Performance assessment
  console.log('=== Performance Assessment ===\n');
  if (elapsed < 2000) {
    console.log('✓ FAST: Page load would feel responsive (<2s)');
  } else if (elapsed < 5000) {
    console.log('⚠ MODERATE: Page load might feel slightly slow (2-5s)');
  } else {
    console.log('✗ SLOW: Page load would feel sluggish (>5s)');
  }
  console.log(`  Recommendation: ${elapsed > 3000 ? 'Consider caching or reducing traversal depth' : 'Current performance is acceptable'}`);
}

main().catch(console.error);
