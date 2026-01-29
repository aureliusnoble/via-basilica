const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const MAX_DEPTH = 6;

const TOP_LEVEL_CATEGORIES = {
  Religion: ['Religion', 'Theology', 'Christianity', 'Islam', 'Buddhism', 'Saints', 'Popes',
    'Christian saints', 'Christian martyrs', 'Christians', 'Early Christianity', 'History of Christianity',
    'Churches', 'Mosques', 'Temples', 'Clergy', 'Bishops', 'Priests', 'Monks', 'Religious leaders',
    'Hinduism', 'Judaism', 'Religious belief and doctrine', 'Spirituality', 'Deities'],
  History: ['History', 'History by period', 'Ancient history', 'Wars', 'Empires', 'Medieval history',
    'Modern history', 'Military history', 'Dynasties', 'Battles', 'Revolutions', 'Historical events'],
  Geography: ['Geography', 'Countries', 'Cities', 'Places', 'Populated places', 'Countries by continent',
    'Capitals', 'Continents', 'Regions', 'Rivers', 'Mountains', 'Islands', 'Oceans', 'Seas', 'Lakes',
    'Landforms', 'Bodies of water', 'Cities by country'],
  People: ['People', 'Living people', 'Births', 'Deaths', 'People by occupation', 'People by nationality'],
  Culture: ['Culture', 'Cultural heritage', 'Traditions', 'Folklore', 'Mythology', 'Festivals', 'Customs'],
  Education: ['Education', 'Educational institutions', 'Universities and colleges', 'Schools', 'Academia', 'Universities'],
  Government: ['Government', 'Politics', 'Political systems', 'Heads of state', 'Politicians', 'Elections', 'Parliaments'],
  Law: ['Law', 'Legal concepts', 'Courts', 'Judges', 'Crime', 'Criminal law'],
  Philosophy: ['Philosophy', 'Philosophical theories', 'Philosophers', 'Ethics', 'Logic', 'Metaphysics'],
  Language: ['Language', 'Languages', 'Linguistics', 'Grammar', 'Writing systems'],
  Humanities: ['Humanities', 'Arts', 'Literature', 'Visual arts', 'Performing arts', 'Music', 'Theatre', 'Film'],
  Society: ['Society', 'Social groups', 'Organizations', 'Social movements', 'Communities'],
};

const CATEGORY_TO_TOP_LEVEL = {};
for (const [topLevel, cats] of Object.entries(TOP_LEVEL_CATEGORIES)) {
  for (const cat of cats) {
    CATEGORY_TO_TOP_LEVEL[cat.toLowerCase()] = topLevel;
  }
}

const cache = {};

function checkDirectMatch(name) {
  return CATEGORY_TO_TOP_LEVEL[name.toLowerCase()] || null;
}

async function fetchParentCategories(categoryName) {
  const title = 'Category:' + categoryName;
  const params = new URLSearchParams({
    action: 'query',
    prop: 'categories',
    titles: title,
    cllimit: '50',
    format: 'json',
    origin: '*'
  });
  try {
    const res = await fetch(WIKIPEDIA_API + '?' + params);
    const text = await res.text();
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<')) {
      // Rate limited or error - wait and return empty
      await new Promise(r => setTimeout(r, 1000));
      return [];
    }
    const data = JSON.parse(text);
    const pages = data.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    const cats = pages[pageId]?.categories;
    if (!cats) return [];
    return cats.map(c => c.title.replace('Category:', ''));
  } catch (e) {
    return [];
  }
}

async function findTopLevel(categoryName) {
  if (cache[categoryName] !== undefined) return cache[categoryName];

  const direct = checkDirectMatch(categoryName);
  if (direct) {
    cache[categoryName] = direct;
    return direct;
  }

  const queue = [{ name: categoryName, depth: 0 }];
  const visited = new Set([categoryName]);

  while (queue.length > 0) {
    const currentDepth = queue[0].depth;
    const currentLevel = [];

    while (queue.length > 0 && queue[0].depth === currentDepth) {
      currentLevel.push(queue.shift().name);
    }

    if (currentDepth >= MAX_DEPTH) break;

    const parentsMap = {};
    for (const cat of currentLevel) {
      parentsMap[cat] = await fetchParentCategories(cat);
    }

    for (const cat of currentLevel) {
      const parents = parentsMap[cat] || [];
      for (const p of parents) {
        const match = checkDirectMatch(p);
        if (match) {
          cache[categoryName] = match;
          return match;
        }
      }
    }

    for (const cat of currentLevel) {
      const parents = parentsMap[cat] || [];
      for (const p of parents) {
        if (!visited.has(p)) {
          visited.add(p);
          queue.push({ name: p, depth: currentDepth + 1 });
        }
      }
    }
  }

  cache[categoryName] = null;
  return null;
}

async function getRandomArticle() {
  const params = new URLSearchParams({
    action: 'query', list: 'random', rnnamespace: '0', rnlimit: '1', format: 'json'
  });
  const res = await fetch(WIKIPEDIA_API + '?' + params);
  const data = await res.json();
  return data.query.random[0].title;
}

async function getOutgoingLinks(title, limit = 30) {
  const params = new URLSearchParams({
    action: 'query', prop: 'links', titles: title, plnamespace: '0', pllimit: limit.toString(), format: 'json'
  });
  const res = await fetch(WIKIPEDIA_API + '?' + params);
  const data = await res.json();
  const pages = data.query?.pages || {};
  const pageId = Object.keys(pages)[0];
  return (pages[pageId]?.links || []).map(l => l.title);
}

async function getArticleCategories(title) {
  const params = new URLSearchParams({
    action: 'query', prop: 'categories', titles: title, cllimit: '30', format: 'json', origin: '*'
  });
  try {
    const res = await fetch(WIKIPEDIA_API + '?' + params);
    const text = await res.text();
    if (text.startsWith('<')) return [];
    const data = JSON.parse(text);
    const pages = data.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    const cats = pages[pageId]?.categories;
    if (!cats) return [];
    return cats.map(c => c.title.replace('Category:', ''));
  } catch (e) {
    return [];
  }
}

async function findArticleTopLevel(title) {
  const categories = await getArticleCategories(title);
  for (const cat of categories) {
    const match = await findTopLevel(cat);
    if (match) return match;
  }
  return null;
}

async function main() {
  console.log('Testing category coverage on random article links...\n');

  const randomArticle = await getRandomArticle();
  console.log('Random article: ' + randomArticle);

  const links = await getOutgoingLinks(randomArticle, 30);
  console.log('Checking ' + links.length + ' outgoing links...\n');

  let matched = 0;
  let unmatched = 0;
  const unmatchedList = [];
  const matchedByCategory = {};

  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    process.stdout.write('  Checking ' + (i+1) + '/' + links.length + ': ' + link.substring(0, 30) + '...\r');
    const topLevel = await findArticleTopLevel(link);
    if (topLevel) {
      matched++;
      matchedByCategory[topLevel] = (matchedByCategory[topLevel] || 0) + 1;
    } else {
      unmatched++;
      unmatchedList.push(link);
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }
  console.log(''); // Clear progress line

  const total = matched + unmatched;
  const pct = ((matched / total) * 100).toFixed(1);

  console.log('Results:');
  console.log('  Matched: ' + matched + '/' + total + ' (' + pct + '%)');
  console.log('  By category:', matchedByCategory);
  if (unmatchedList.length > 0 && unmatchedList.length <= 10) {
    console.log('  Unmatched:', unmatchedList);
  }
}

main().catch(console.error);
