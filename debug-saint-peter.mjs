/**
 * Debug why Saint Peter isn't being detected as Religion
 */

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';

// Same categories as in the edge function
const TOP_LEVEL_CATEGORIES = {
  Religion: [
    'Religion', 'Theology', 'Religious belief and doctrine', 'Spirituality', 'Deities',
    'Religious faiths, traditions, and movements', 'Christianity', 'Islam', 'Buddhism',
    'Hinduism', 'Judaism', 'Saints', 'Popes', 'Religious leaders',
    'Christian saints', 'Christian martyrs', 'Christians', 'Early Christianity',
    'History of Christianity', 'Christian denominations', 'Catholic Church',
    'Eastern Orthodox Church', 'Protestantism', 'Religious texts', 'Bible', 'Quran',
    'Religious buildings', 'Churches', 'Mosques', 'Temples', 'Monasteries',
    'Clergy', 'Bishops', 'Priests', 'Monks'
  ],
  History: [
    'History', 'History by period', 'History by region', 'Historical events',
    'Ancient history', 'Medieval history', 'Modern history', 'Military history',
    'Wars', 'Empires', 'Dynasties', 'Battles', 'Revolutions', 'Historical eras'
  ],
};

const CATEGORY_TO_TOP_LEVEL = {};
for (const [topLevel, cats] of Object.entries(TOP_LEVEL_CATEGORIES)) {
  for (const cat of cats) {
    CATEGORY_TO_TOP_LEVEL[cat.toLowerCase()] = topLevel;
  }
}

async function getArticleCategories(title) {
  const params = new URLSearchParams({
    action: 'query', prop: 'categories', titles: title, cllimit: '50', format: 'json', origin: '*'
  });
  const res = await fetch(`${WIKIPEDIA_API}?${params}`);
  const data = await res.json();
  const pages = data.query?.pages || {};
  const pageId = Object.keys(pages)[0];
  return (pages[pageId]?.categories || []).map(c => c.title.replace('Category:', ''));
}

async function getParentCategories(catName) {
  const params = new URLSearchParams({
    action: 'query', prop: 'categories', titles: 'Category:' + catName, cllimit: '50', format: 'json', origin: '*'
  });
  const res = await fetch(`${WIKIPEDIA_API}?${params}`);
  const data = await res.json();
  const pages = data.query?.pages || {};
  const pageId = Object.keys(pages)[0];
  return (pages[pageId]?.categories || []).map(c => c.title.replace('Category:', ''));
}

function checkDirectMatch(name) {
  return CATEGORY_TO_TOP_LEVEL[name.toLowerCase()] || null;
}

async function main() {
  console.log('=== Debugging Saint Peter Category Detection ===\n');

  // Get Saint Peter's direct categories
  const categories = await getArticleCategories('Saint Peter');
  console.log('Saint Peter direct categories:');
  for (const cat of categories) {
    const match = checkDirectMatch(cat);
    console.log(`  ${cat} ${match ? `-> ${match}` : ''}`);
  }

  // Check the first few categories' parents
  console.log('\n=== Traversing category tree ===\n');

  for (const cat of categories.slice(0, 5)) {
    console.log(`\nCategory: ${cat}`);
    const parents = await getParentCategories(cat);
    console.log('  Parents:');
    for (const p of parents.slice(0, 8)) {
      const match = checkDirectMatch(p);
      console.log(`    ${p} ${match ? `-> ${match}` : ''}`);
    }
  }

  // Specifically check "Christian saints from the New Testament"
  console.log('\n=== Deep dive: Christian saints from the New Testament ===\n');
  let catName = 'Christian saints from the New Testament';
  for (let depth = 0; depth < 4; depth++) {
    console.log(`Depth ${depth}: ${catName}`);
    const match = checkDirectMatch(catName);
    if (match) {
      console.log(`  MATCH: ${match}`);
      break;
    }
    const parents = await getParentCategories(catName);
    console.log(`  Parents: ${parents.slice(0, 5).join(', ')}`);
    if (parents.length > 0) {
      catName = parents[0]; // Follow first parent
    } else {
      break;
    }
  }
}

main().catch(console.error);
