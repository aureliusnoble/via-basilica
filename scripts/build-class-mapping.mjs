#!/usr/bin/env node
/**
 * Build Pre-computed Wikidata Class Mapping
 *
 * This script queries Wikidata SPARQL endpoint to get all subclasses
 * of our target categories and builds a mapping file for instant lookups.
 *
 * Run with: node scripts/build-class-mapping.mjs
 * Output: src/lib/data/class-to-category.json
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const WIKIDATA_SPARQL = 'https://query.wikidata.org/sparql';
const OUTPUT_PATH = new URL('../src/lib/data/class-to-category.json', import.meta.url).pathname;

// Target classes for each category
// These are the root classes whose subclasses we'll fetch
// Note: Limit parameter controls max subclasses per target to keep file size manageable
const TARGET_CLASSES = [
  // Geography - human settlements and administrative territories (core for the game)
  { id: 'Q486972', category: 'Geography', label: 'human settlement', limit: 5000 },
  { id: 'Q56061', category: 'Geography', label: 'administrative territorial entity', limit: 5000 },
  { id: 'Q15642541', category: 'Geography', label: 'human-geographic territorial entity', limit: 3000 },
  { id: 'Q82794', category: 'Geography', label: 'geographic region', limit: 3000 },
  { id: 'Q35145263', category: 'Geography', label: 'natural geographic object', limit: 2000 },

  // People (core for the game - Q5 is "human")
  { id: 'Q5', category: 'People', label: 'human', limit: 3000 },

  // Religion (core for the game)
  { id: 'Q9174', category: 'Religion', label: 'religion', limit: 5000 },
  { id: 'Q1530022', category: 'Religion', label: 'religious organization', limit: 2000 },
  { id: 'Q24398318', category: 'Religion', label: 'religious building', limit: 2000 },
  { id: 'Q1841533', category: 'Religion', label: 'religious text', limit: 500 },
  { id: 'Q3220391', category: 'Religion', label: 'religious concept', limit: 500 },
  { id: 'Q1068640', category: 'Religion', label: 'deity', limit: 500 },

  // History (core for the game)
  { id: 'Q13418847', category: 'History', label: 'historical event', limit: 500 },
  { id: 'Q11514315', category: 'History', label: 'historical period', limit: 500 },
  { id: 'Q48349', category: 'History', label: 'empire', limit: 200 },
  { id: 'Q198', category: 'History', label: 'war', limit: 500 },
  { id: 'Q178561', category: 'History', label: 'battle', limit: 500 },
  { id: 'Q8016240', category: 'History', label: 'historical country', limit: 1000 },
  { id: 'Q164950', category: 'History', label: 'revolution', limit: 200 },
  { id: 'Q3024240', category: 'History', label: 'historical administrative territorial entity', limit: 500 },

  // Science & Technology (limited - less relevant for saint game)
  { id: 'Q11862829', category: 'Science', label: 'academic discipline', limit: 2000 },
  { id: 'Q16521', category: 'Science', label: 'taxon', limit: 1500 },
  { id: 'Q523', category: 'Science', label: 'star', limit: 500 },
  { id: 'Q318', category: 'Science', label: 'galaxy', limit: 200 },
  // Skip gene/protein/compound - too many and not relevant to game

  // Arts
  { id: 'Q11424', category: 'Arts', label: 'film', limit: 1000 },
  { id: 'Q482994', category: 'Arts', label: 'album', limit: 500 },
  { id: 'Q7366', category: 'Arts', label: 'song', limit: 1000 },
  { id: 'Q5398426', category: 'Arts', label: 'television series', limit: 500 },
  { id: 'Q7725634', category: 'Arts', label: 'literary work', limit: 3000 },

  // Sports
  { id: 'Q349', category: 'Sports', label: 'sport', limit: 3000 },
  { id: 'Q476028', category: 'Sports', label: 'football club', limit: 200 },
  { id: 'Q847017', category: 'Sports', label: 'sports club', limit: 500 },
  { id: 'Q18536594', category: 'Sports', label: 'sports competition', limit: 500 },

  // Government
  { id: 'Q7188', category: 'Government', label: 'government', limit: 1500 },
  { id: 'Q327333', category: 'Government', label: 'government agency', limit: 2000 },
  { id: 'Q7278', category: 'Government', label: 'political party', limit: 500 },

  // Philosophy
  { id: 'Q5891', category: 'Philosophy', label: 'philosophy', limit: 2000 },
  { id: 'Q1387659', category: 'Philosophy', label: 'philosophical concept', limit: 1000 },

  // Culture
  { id: 'Q132241', category: 'Culture', label: 'festival', limit: 1000 },
  { id: 'Q9134', category: 'Culture', label: 'mythology', limit: 500 },

  // Education
  { id: 'Q3918', category: 'Education', label: 'university', limit: 500 },
  { id: 'Q38723', category: 'Education', label: 'higher education institution', limit: 1000 },
  { id: 'Q3914', category: 'Education', label: 'school', limit: 2000 },

  // Language
  { id: 'Q34770', category: 'Language', label: 'language', limit: 3000 },
  { id: 'Q33742', category: 'Language', label: 'natural language', limit: 500 },
  { id: 'Q315', category: 'Language', label: 'language family', limit: 500 },

  // Law
  { id: 'Q7748', category: 'Law', label: 'law', limit: 2000 },
  { id: 'Q820655', category: 'Law', label: 'statute', limit: 1000 },
  { id: 'Q40348', category: 'Law', label: 'legal case', limit: 500 },
  { id: 'Q11204', category: 'Law', label: 'court', limit: 500 },

  // Society
  { id: 'Q43229', category: 'Society', label: 'organization', limit: 3000 },
  { id: 'Q49773', category: 'Society', label: 'social movement', limit: 1500 },

  // Humanities
  { id: 'Q7058673', category: 'Humanities', label: 'art genre', limit: 200 },
  { id: 'Q483394', category: 'Humanities', label: 'genre', limit: 1000 },
];

// Query SPARQL endpoint with retry
async function querySparql(query, retries = 3) {
  const params = new URLSearchParams({ query, format: 'json' });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${WIKIDATA_SPARQL}?${params}`, {
        headers: {
          'Accept': 'application/sparql-results+json',
          'User-Agent': 'ViaBasilica/1.0 (https://github.com/viabasilica; contact@viabasilica.com)'
        }
      });

      if (!res.ok) {
        if (res.status === 429 || res.status === 503) {
          // Rate limited or service unavailable - wait and retry
          const waitTime = attempt * 5000;
          console.log(`  Rate limited, waiting ${waitTime / 1000}s...`);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }
        throw new Error(`SPARQL failed: ${res.status} ${res.statusText}`);
      }

      return res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(`  Attempt ${attempt} failed: ${err.message}, retrying...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// Get all subclasses of a target class
async function getAllSubclasses(targetClassId, label, limit = 5000) {
  console.log(`Fetching subclasses of ${label} (${targetClassId})...`);

  // Use wdt:P279* for transitive subclass lookup
  const query = `
    SELECT DISTINCT ?class WHERE {
      ?class wdt:P279* wd:${targetClassId} .
    }
    LIMIT ${limit}
  `;

  const startTime = Date.now();

  try {
    const result = await querySparql(query);
    const elapsed = Date.now() - startTime;

    const classes = (result.results?.bindings || [])
      .map(b => b.class?.value?.split('/').pop())
      .filter(Boolean);

    console.log(`  Found ${classes.length} subclasses in ${elapsed}ms`);
    return classes;
  } catch (err) {
    console.error(`  Error fetching ${label}: ${err.message}`);
    return [];
  }
}

// Build the complete mapping
async function buildClassMapping() {
  const mapping = {};
  const stats = {
    totalClasses: 0,
    byCategory: {}
  };

  console.log('\n=== Building Wikidata Class Mapping ===\n');
  console.log(`Processing ${TARGET_CLASSES.length} target classes...\n`);

  for (const target of TARGET_CLASSES) {
    const subclasses = await getAllSubclasses(target.id, target.label, target.limit || 5000);

    let newClasses = 0;
    for (const classId of subclasses) {
      // First match wins (in case of overlap between categories)
      if (!mapping[classId]) {
        mapping[classId] = target.category;
        newClasses++;
      }
    }

    stats.byCategory[target.category] = (stats.byCategory[target.category] || 0) + newClasses;

    // Small delay to be nice to the API
    await new Promise(r => setTimeout(r, 500));
  }

  stats.totalClasses = Object.keys(mapping).length;
  return { mapping, stats };
}

// Main execution
async function main() {
  const startTime = Date.now();

  try {
    const { mapping, stats } = await buildClassMapping();

    // Ensure output directory exists
    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });

    // Write the mapping file
    writeFileSync(OUTPUT_PATH, JSON.stringify(mapping, null, 2));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const fileSize = (JSON.stringify(mapping).length / 1024).toFixed(1);

    console.log('\n=== Build Complete ===\n');
    console.log(`Total classes mapped: ${stats.totalClasses}`);
    console.log(`File size: ${fileSize} KB`);
    console.log(`Time: ${elapsed}s`);
    console.log(`Output: ${OUTPUT_PATH}`);

    console.log('\nCategory distribution:');
    const sorted = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);
    for (const [category, count] of sorted) {
      console.log(`  ${category}: ${count} classes`);
    }

    console.log('\n To rebuild: node scripts/build-class-mapping.mjs');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

main();
