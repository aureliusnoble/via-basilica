import type { PathStep } from '$lib/types/database.js';
import { formatDate, formatDuration } from './date-helpers.js';

type Category = 'H' | 'R' | 'G' | 'S' | 'A' | 'P' | '*';

// Colored squares for each category
const CATEGORY_COLORS: Record<Category, string> = {
	H: '🟫', // History - brown
	R: '🟣', // Religion - purple
	G: '🟢', // Geography - green
	S: '🔵', // Science - blue
	A: '🟡', // Art - yellow
	P: '🔴', // Politics - red
	'*': '⬜' // Other - white
};

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
	H: [
		'empire',
		'ancient',
		'war',
		'century',
		'dynasty',
		'medieval',
		'kingdom',
		'roman',
		'byzantine',
		'history',
		'battle',
		'civilization'
	],
	R: [
		'church',
		'saint',
		'bishop',
		'christian',
		'orthodox',
		'catholic',
		'pope',
		'monastery',
		'theology',
		'religion',
		'god',
		'jesus',
		'bible',
		'priest'
	],
	G: [
		'city',
		'country',
		'river',
		'region',
		'mountain',
		'island',
		'continent',
		'capital',
		'province',
		'geography',
		'ocean',
		'sea',
		'lake'
	],
	S: [
		'theory',
		'physics',
		'chemistry',
		'biology',
		'mathematics',
		'scientist',
		'experiment',
		'science',
		'atom',
		'cell',
		'evolution',
		'quantum'
	],
	A: [
		'painting',
		'music',
		'artist',
		'composer',
		'literature',
		'author',
		'poet',
		'novel',
		'art',
		'sculpture',
		'opera',
		'symphony',
		'film'
	],
	P: [
		'politician',
		'emperor',
		'king',
		'queen',
		'president',
		'leader',
		'minister',
		'general',
		'ruler',
		'monarch',
		'dictator'
	],
	'*': [] // fallback, no keywords
};

export function detectCategory(articleTitle: string): Category {
	const titleLower = articleTitle.toLowerCase().replace(/_/g, ' ');

	// Check each category's keywords
	for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
		if (category === '*') continue;
		for (const keyword of keywords) {
			if (titleLower.includes(keyword)) {
				return category as Category;
			}
		}
	}

	return '*'; // fallback
}

export function generateShareText(
	challengeNumber: number | null,
	hops: number,
	durationSeconds: number,
	startArticle: string,
	path: PathStep[],
	challengeDate: Date | string,
	mode: 'daily' | 'random' | 'archive' = 'daily'
): string {
	const dateStr = formatDate(challengeDate);
	const timeStr = formatDuration(durationSeconds);

	// Clean article names
	const cleanStart = startArticle.replace(/_/g, ' ');
	const targetArticle = 'Basil the Great'; // Always the same

	// Truncate long names (max 25 chars)
	const maxLen = 25;
	const start =
		cleanStart.length > maxLen ? cleanStart.slice(0, maxLen - 3) + '...' : cleanStart;

	// Generate category chain from path (excluding start, it's shown explicitly)
	const categories = path.slice(1).map((step) => detectCategory(step.article_title));
	const categoryColors = categories.map((cat) => CATEGORY_COLORS[cat]);

	// Format category chain as colored boxes (truncate if > 8 steps)
	let categoryChain: string;
	if (categoryColors.length <= 8) {
		categoryChain = categoryColors.join('');
	} else {
		// Show first 4, ellipsis, last 3
		const first = categoryColors.slice(0, 4).join('');
		const last = categoryColors.slice(-3).join('');
		categoryChain = `${first}...${last}`;
	}

	// Title based on mode
	const title =
		mode === 'random'
			? 'Via Basilica (Random)'
			: mode === 'archive'
				? `Via Basilica Archive #${challengeNumber}`
				: `Via Basilica #${challengeNumber}`;

	// Generate shareable URL
	let shareUrl: string;
	if (mode === 'random') {
		// Include start article in URL for friends to play same game
		const encodedStart = encodeURIComponent(startArticle.replace(/ /g, '_'));
		shareUrl = `Try it: aureliusnoble.github.io/via-basilica/play/random?start=${encodedStart}`;
	} else {
		shareUrl = 'aureliusnoble.github.io/via-basilica';
	}

	return `${title}
${dateStr}

${start} → ${targetArticle}
${categoryChain}
${hops} hops | ${timeStr}

${shareUrl}`;
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
	mode: 'daily' | 'random' | 'archive' = 'daily'
): Promise<boolean> {
	const text = generateShareText(
		challengeNumber,
		hops,
		durationSeconds,
		startArticle,
		path,
		challengeDate,
		mode
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
