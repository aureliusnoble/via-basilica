import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputPath = join(__dirname, '..', 'basil.csv');
const outputPath = join(__dirname, '..', 'src', 'lib', 'data', 'quotes.json');

// Read the CSV file
const content = readFileSync(inputPath, 'utf-8');

// Split by lines and process
const lines = content.split('\n');
const quotes = new Set();

for (const line of lines) {
	let quote = line.trim();

	// Skip empty lines
	if (!quote) continue;

	// Remove surrounding quote marks (various types)
	quote = quote.replace(/^[""]/, '').replace(/[""]$/, '');
	quote = quote.replace(/^"""/, '').replace(/"""$/, '');
	quote = quote.replace(/^"/, '').replace(/"$/, '');

	// Skip if still empty or too short
	quote = quote.trim();
	if (!quote || quote.length < 20) continue;

	// Skip lines that are just quote marks or punctuation
	if (/^["""'\s]+$/.test(quote)) continue;

	// Add to set (deduplication)
	quotes.add(quote);
}

// Convert to array and sort by length (for variety)
const quotesArray = Array.from(quotes).sort((a, b) => a.length - b.length);

// Write to JSON
writeFileSync(outputPath, JSON.stringify(quotesArray, null, 2));

console.log(`Processed ${quotesArray.length} unique quotes`);
console.log(`Output written to ${outputPath}`);
