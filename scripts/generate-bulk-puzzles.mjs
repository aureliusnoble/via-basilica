#!/usr/bin/env node
/**
 * Bulk generate daily puzzles for Via Basilica
 *
 * Usage:
 *   node scripts/generate-bulk-puzzles.mjs
 *
 * Environment variables required:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (NOT the anon key)
 *
 * Options:
 *   --days=N     Number of days to generate (default: 365)
 *   --start=DATE Start date in YYYY-MM-DD format (default: today)
 *   --delay=MS   Delay between requests in ms (default: 2000)
 *   --dry-run    Show what would be generated without making requests
 */

import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Parse command line arguments
function parseArgs() {
	const args = process.argv.slice(2);
	const options = {
		days: 365,
		start: new Date().toISOString().split('T')[0],
		delay: 2000,
		dryRun: false
	};

	for (const arg of args) {
		if (arg.startsWith('--days=')) {
			options.days = parseInt(arg.split('=')[1], 10);
		} else if (arg.startsWith('--start=')) {
			options.start = arg.split('=')[1];
		} else if (arg.startsWith('--delay=')) {
			options.delay = parseInt(arg.split('=')[1], 10);
		} else if (arg === '--dry-run') {
			options.dryRun = true;
		} else if (arg === '--help' || arg === '-h') {
			console.log(`
Bulk generate daily puzzles for Via Basilica

Usage:
  node scripts/generate-bulk-puzzles.mjs [options]

Options:
  --days=N      Number of days to generate (default: 365)
  --start=DATE  Start date in YYYY-MM-DD format (default: today)
  --delay=MS    Delay between requests in ms (default: 2000)
  --dry-run     Show what would be generated without making requests
  --help, -h    Show this help message

Environment variables:
  SUPABASE_URL              Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY Service role key (required)

Example:
  # Generate next 365 days starting from today
  node scripts/generate-bulk-puzzles.mjs

  # Generate 30 days starting from a specific date
  node scripts/generate-bulk-puzzles.mjs --days=30 --start=2025-02-01

  # Preview what would be generated
  node scripts/generate-bulk-puzzles.mjs --dry-run
`);
			process.exit(0);
		}
	}

	return options;
}

// Add days to a date string
function addDays(dateStr, days) {
	const date = new Date(dateStr);
	date.setDate(date.getDate() + days);
	return date.toISOString().split('T')[0];
}

// Sleep helper
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generate a single puzzle
async function generatePuzzle(date) {
	const url = `${SUPABASE_URL}/functions/v1/generate-daily-challenge`;

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${SERVICE_ROLE_KEY}`
		},
		body: JSON.stringify({ date })
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || `HTTP ${response.status}`);
	}

	return data;
}

// Main function
async function main() {
	const options = parseArgs();

	console.log('╔══════════════════════════════════════════════════════════╗');
	console.log('║          Via Basilica - Bulk Puzzle Generator            ║');
	console.log('╚══════════════════════════════════════════════════════════╝\n');

	// Validate environment
	if (!SUPABASE_URL) {
		console.error('❌ Error: SUPABASE_URL or PUBLIC_SUPABASE_URL environment variable is required');
		process.exit(1);
	}

	if (!SERVICE_ROLE_KEY) {
		console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
		console.error('   This is NOT the anon key. Get it from Supabase Dashboard → Settings → API');
		process.exit(1);
	}

	console.log(`📅 Start date: ${options.start}`);
	console.log(`📊 Days to generate: ${options.days}`);
	console.log(`⏱️  Delay between requests: ${options.delay}ms`);
	console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
	console.log(`${options.dryRun ? '🧪 DRY RUN MODE - No actual requests will be made' : ''}\n`);

	// Generate dates
	const dates = [];
	for (let i = 0; i < options.days; i++) {
		dates.push(addDays(options.start, i));
	}

	console.log(`📆 Date range: ${dates[0]} to ${dates[dates.length - 1]}\n`);

	if (options.dryRun) {
		console.log('Would generate puzzles for:');
		dates.forEach((date) => console.log(`  - ${date}`));
		console.log('\nRun without --dry-run to actually generate puzzles.');
		return;
	}

	// Track results
	const results = {
		success: 0,
		skipped: 0,
		failed: 0,
		errors: []
	};

	console.log('Starting generation...\n');

	for (let i = 0; i < dates.length; i++) {
		const date = dates[i];
		const progress = `[${i + 1}/${dates.length}]`;

		try {
			const result = await generatePuzzle(date);

			if (result.message?.includes('already exists')) {
				console.log(`${progress} ${date}: ⏭️  Already exists (id: ${result.id})`);
				results.skipped++;
			} else if (result.success) {
				const challenge = result.challenge;
				console.log(
					`${progress} ${date}: ✅ Generated - "${challenge.start_article}" (blocked: ${challenge.blocked_categories?.join(', ') || 'none'})`
				);
				results.success++;
			} else {
				console.log(`${progress} ${date}: ⚠️  Unexpected response:`, result);
				results.failed++;
			}
		} catch (error) {
			console.log(`${progress} ${date}: ❌ Failed - ${error.message}`);
			results.failed++;
			results.errors.push({ date, error: error.message });
		}

		// Rate limiting - don't delay after the last request
		if (i < dates.length - 1) {
			await sleep(options.delay);
		}
	}

	// Summary
	console.log('\n╔══════════════════════════════════════════════════════════╗');
	console.log('║                       Summary                            ║');
	console.log('╚══════════════════════════════════════════════════════════╝');
	console.log(`✅ Successfully generated: ${results.success}`);
	console.log(`⏭️  Already existed: ${results.skipped}`);
	console.log(`❌ Failed: ${results.failed}`);

	if (results.errors.length > 0) {
		console.log('\nFailed dates:');
		results.errors.forEach(({ date, error }) => {
			console.log(`  - ${date}: ${error}`);
		});
	}

	console.log('\n✨ Done!');
}

main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
