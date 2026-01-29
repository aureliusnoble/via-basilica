/**
 * Test Wikidata SPARQL approach for checking subclass hierarchy
 *
 * The idea: Instead of mapping every specific class, we check if a class
 * is a subclass of broad categories like "human settlement" or "religious organization"
 */

const WIKIDATA_SPARQL = 'https://query.wikidata.org/sparql';

// Our broad target classes that we'll check subclass membership for
const TARGET_CLASSES = {
  // Geography - anything that's a human settlement, administrative area, or geographical feature
  Geography: [
    'Q486972',    // human settlement
    'Q56061',     // administrative territorial entity
    'Q2221906',   // geographic location
    'Q15642541',  // human-geographic territorial entity
  ],

  // Religion
  Religion: [
    'Q9174',      // religion
    'Q1530022',   // religious organization
    'Q24398318',  // religious building
    'Q1841152',   // religious concept
  ],

  // History
  History: [
    'Q13418847',  // historical event
    'Q17524420',  // aspect of history
    'Q11514315',  // historical period
    'Q28640',     // profession (historical figures)
  ],

  // People
  People: [
    'Q5',         // human
  ],
};

// Build a SPARQL query to check if classes are subclasses of our targets
function buildSubclassQuery(classIds, targetClassId) {
  const values = classIds.map(id => `wd:${id}`).join(' ');
  return `
    SELECT ?class WHERE {
      VALUES ?class { ${values} }
      ?class wdt:P279* wd:${targetClassId} .
    }
  `;
}

// Query the SPARQL endpoint
async function querySparql(query) {
  const params = new URLSearchParams({
    query,
    format: 'json'
  });

  const res = await fetch(`${WIKIDATA_SPARQL}?${params}`, {
    headers: {
      'Accept': 'application/sparql-results+json',
      'User-Agent': 'WikiGame/1.0 (testing category classification)'
    }
  });

  if (!res.ok) {
    throw new Error(`SPARQL query failed: ${res.status}`);
  }

  return res.json();
}

// Check which of our classes are subclasses of a target
async function checkSubclasses(classIds, targetClassId) {
  const query = buildSubclassQuery(classIds, targetClassId);
  const result = await querySparql(query);

  const matches = new Set();
  for (const binding of result.results?.bindings || []) {
    const classUri = binding.class?.value;
    if (classUri) {
      const classId = classUri.split('/').pop();
      matches.add(classId);
    }
  }

  return matches;
}

// Alternative: Use a single SPARQL query to categorize all classes at once
async function categorizeClassesSparql(classIds) {
  // Build UNION query to check all target categories at once
  const values = classIds.map(id => `wd:${id}`).join(' ');

  const query = `
    SELECT ?class ?category WHERE {
      VALUES ?class { ${values} }
      VALUES (?target ?category) {
        (wd:Q486972 "Geography")
        (wd:Q56061 "Geography")
        (wd:Q6256 "Geography")
        (wd:Q515 "Geography")
        (wd:Q5 "People")
        (wd:Q9174 "Religion")
        (wd:Q1530022 "Religion")
        (wd:Q13418847 "History")
        (wd:Q198 "War")
        (wd:Q11514315 "History")
        (wd:Q48349 "History")
      }
      ?class wdt:P279* ?target .
    }
    GROUP BY ?class ?category
  `;

  const result = await querySparql(query);

  const categories = {};
  for (const binding of result.results?.bindings || []) {
    const classId = binding.class?.value?.split('/').pop();
    const category = binding.category?.value;
    if (classId && category) {
      categories[classId] = category;
    }
  }

  return categories;
}

async function main() {
  console.log('=== SPARQL Subclass Hierarchy Test ===\n');

  // Test classes from our earlier run
  const testClasses = [
    'Q17343829', // unincorporated community in the United States
    'Q17201685', // township of Indiana
    'Q20857065', // United States federal agency
    'Q48349',    // empire
    'Q11514315', // historical period
    'Q3624078',  // sovereign state
    'Q6957341',  // major religious group
    'Q15127012', // town
    'Q1093829',  // city in the United States
    'Q5',        // human
    'Q178561',   // battle
    'Q198',      // war
    'Q9174',     // religion
  ];

  console.log('Testing', testClasses.length, 'classes...\n');

  // Method 1: Check each target category separately
  console.log('--- Method 1: Separate queries per target ---\n');

  const startTime1 = Date.now();
  const results = {};

  // Check Geography
  console.log('Checking Geography (Q486972 - human settlement)...');
  const geoMatches = await checkSubclasses(testClasses, 'Q486972');
  console.log('  Matches:', [...geoMatches].join(', ') || 'none');

  // Check People
  console.log('Checking People (Q5 - human)...');
  const peopleMatches = await checkSubclasses(testClasses, 'Q5');
  console.log('  Matches:', [...peopleMatches].join(', ') || 'none');

  // Check Religion
  console.log('Checking Religion (Q9174 - religion)...');
  const religionMatches = await checkSubclasses(testClasses, 'Q9174');
  console.log('  Matches:', [...religionMatches].join(', ') || 'none');

  // Check History (historical event)
  console.log('Checking History (Q13418847 - historical event)...');
  const historyMatches = await checkSubclasses(testClasses, 'Q13418847');
  console.log('  Matches:', [...historyMatches].join(', ') || 'none');

  console.log(`\nMethod 1 total time: ${Date.now() - startTime1}ms`);

  // Method 2: Single combined query
  console.log('\n--- Method 2: Single combined SPARQL query ---\n');

  const startTime2 = Date.now();
  const categorized = await categorizeClassesSparql(testClasses);
  console.log('Categorization results:');
  for (const classId of testClasses) {
    const category = categorized[classId] || 'UNCATEGORIZED';
    console.log(`  ${classId}: ${category}`);
  }
  console.log(`\nMethod 2 time: ${Date.now() - startTime2}ms`);

  // Performance summary
  console.log('\n=== Summary ===\n');
  const categorizedCount = Object.keys(categorized).length;
  console.log(`Categorized: ${categorizedCount}/${testClasses.length} (${(categorizedCount/testClasses.length*100).toFixed(1)}%)`);
}

main().catch(console.error);
