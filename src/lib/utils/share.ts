import type { PathStep } from '$lib/types/database.js';
import { formatDate, formatDuration } from './date-helpers.js';
import {
	formatBlockedCategoriesForShare,
	BLOCKED_CATEGORY_EMOJIS,
	BLOCKED_CATEGORY_NAMES
} from './blocked-categories.js';
import { getArticleCategories } from '$lib/api/blocked-categories.js';

// Target article name (normalized)
const TARGET_ARTICLE = 'Basil the Great';

function isTargetArticle(title: string): boolean {
	const normalized = title.replace(/_/g, ' ').toLowerCase();
	return normalized === 'basil the great' || normalized === 'basil of caesarea';
}

export async function generateShareText(
	challengeNumber: number | null,
	hops: number,
	durationSeconds: number,
	startArticle: string,
	path: PathStep[],
	challengeDate: Date | string,
	mode: 'daily' | 'random' | 'archive' = 'daily',
	blockedCategories: string[] = []
): Promise<string> {
	const dateStr = formatDate(challengeDate);
	const timeStr = formatDuration(durationSeconds);

	// Clean article names
	const cleanStart = startArticle.replace(/_/g, ' ');
	const targetArticle = TARGET_ARTICLE;

	// Truncate long start name (max 25 chars)
	const maxLen = 25;
	const start =
		cleanStart.length > maxLen ? cleanStart.slice(0, maxLen - 3) + '...' : cleanStart;

	// Get the journey steps (excluding start article, it's shown explicitly)
	const journeySteps = path.slice(1);

	// Fetch categories for all journey steps using server-side classification
	const titles = journeySteps.map((step) => step.article_title);
	const categoriesMap = await getArticleCategories(titles);

	// Build category list, with special handling for the target (Basil)
	const categories: string[] = journeySteps.map((step, index) => {
		// Last step is always Basil
		if (index === journeySteps.length - 1 && isTargetArticle(step.article_title)) {
			return 'Basil';
		}
		return categoriesMap[step.article_title] || categoriesMap[step.article_title.replace(/ /g, '_')] || 'Other';
	});

	// Convert categories to emoji squares (show ALL hops, no truncation)
	const categoryColors = categories.map((cat) => BLOCKED_CATEGORY_EMOJIS[cat] || BLOCKED_CATEGORY_EMOJIS['Other']);
	const categoryChain = categoryColors.join('');

	// Generate legend for unique categories that appeared in the journey
	// Always put Basil last in the legend if present
	const uniqueCategories = [...new Set(categories)];
	const sortedCategories = uniqueCategories
		.filter((cat) => cat !== 'Basil')
		.concat(uniqueCategories.includes('Basil') ? ['Basil'] : []);

	const legendLines = sortedCategories.map(
		(cat) => `${BLOCKED_CATEGORY_EMOJIS[cat] || '⬜'} ${BLOCKED_CATEGORY_NAMES[cat] || cat}`
	);

	// Title based on mode
	const title =
		mode === 'random'
			? 'Via Basilica (Random)'
			: mode === 'archive'
				? `Via Basilica Archive #${challengeNumber}`
				: `Via Basilica #${challengeNumber}`;

	// Blocked categories line
	const blockedLine = formatBlockedCategoriesForShare(blockedCategories);

	// Generate shareable URL
	let shareUrl: string;
	if (mode === 'random') {
		// Include start article in URL for friends to play same game
		const encodedStart = encodeURIComponent(startArticle.replace(/ /g, '_'));
		shareUrl = `Try it: aureliusnoble.github.io/via-basilica/play/random?start=${encodedStart}`;
	} else {
		shareUrl = 'aureliusnoble.github.io/via-basilica';
	}

	// Build share text in order:
	// 1. Delimiter
	// 2. Title and date
	// 3. Start -> Target
	// 4. Blocked categories (if any)
	// 5. Category chain
	// 6. Hops and time
	// 7. Legend
	// 8. URL
	// 9. Delimiter
	const delimiter = '════════════════════';
	const lines = [delimiter, title, dateStr, '', `${start} → ${targetArticle}`];

	if (blockedLine) {
		lines.push(blockedLine);
	}

	lines.push(categoryChain);
	lines.push(`${hops} steps | ${timeStr}`);

	// Add legend
	if (legendLines.length > 0) {
		lines.push('');
		lines.push(...legendLines);
	}

	lines.push('');
	lines.push(shareUrl);
	lines.push(delimiter);

	return lines.join('\n');
}

export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		// Fallback for older browsers
		const textArea = document.createElement('textarea');
		textArea.value = text;
		textArea.style.position = 'fixed';
		textArea.style.left = '-999999px';
		document.body.appendChild(textArea);
		textArea.select();

		try {
			document.execCommand('copy');
			document.body.removeChild(textArea);
			return true;
		} catch {
			document.body.removeChild(textArea);
			return false;
		}
	}
}

export async function shareResult(
	challengeNumber: number | null,
	hops: number,
	durationSeconds: number,
	startArticle: string,
	path: PathStep[],
	challengeDate: Date | string,
	mode: 'daily' | 'random' | 'archive' = 'daily',
	blockedCategories: string[] = []
): Promise<boolean> {
	const text = await generateShareText(
		challengeNumber,
		hops,
		durationSeconds,
		startArticle,
		path,
		challengeDate,
		mode,
		blockedCategories
	);

	// Try native share if available
	if (navigator.share) {
		try {
			await navigator.share({
				title: 'Via Basilica',
				text
			});
			return true;
		} catch {
			// User cancelled or error, fall back to clipboard
		}
	}

	return copyToClipboard(text);
}
