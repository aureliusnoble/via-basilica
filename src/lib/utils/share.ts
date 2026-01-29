import type { PathStep } from '$lib/types/database.js';
import { formatDate, formatDuration } from './date-helpers.js';
import { formatBlockedCategoriesForShare } from './blocked-categories.js';

// Expanded category types to match blocked categories
type Category =
	| 'Religion'
	| 'History'
	| 'People'
	| 'Philosophy'
	| 'Culture'
	| 'Education'
	| 'Society'
	| 'Geography'
	| 'Humanities'
	| 'Language'
	| 'Government'
	| 'Law'
	| '*';

// Colored squares for each category
const CATEGORY_COLORS: Record<Category, string> = {
	Religion: '🟣',
	History: '🟫',
	People: '🔴',
	Philosophy: '🟡',
	Culture: '🟠',
	Education: '📘',
	Society: '🔵',
	Geography: '🟢',
	Humanities: '📙',
	Language: '📗',
	Government: '⬛',
	Law: '⬜',
	'*': '⬜' // Other - white
};

// Category names for legend
const CATEGORY_NAMES: Record<Category, string> = {
	Religion: 'Religion',
	History: 'History',
	People: 'People',
	Philosophy: 'Philosophy',
	Culture: 'Culture',
	Education: 'Education',
	Society: 'Society',
	Geography: 'Geography',
	Humanities: 'Humanities',
	Language: 'Language',
	Government: 'Government',
	Law: 'Law',
	'*': 'Other'
};

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
	Religion: [
		'church',
		'saint',
		'bishop',
		'christian',
		'orthodox',
		'catholic',
		'theology',
		'priest',
		'muslim',
		'buddhist',
		'jewish',
		'religion',
		'religious',
		'monastery',
		'pope',
		'god',
		'jesus',
		'bible'
	],
	History: [
		'empire',
		'ancient',
		'war',
		'century',
		'dynasty',
		'medieval',
		'kingdom',
		'roman',
		'byzantine',
		'battle',
		'civilization',
		'history',
		'historical'
	],
	People: [
		'born',
		'died',
		'people',
		'person',
		'living',
		'deaths',
		'births',
		'politician',
		'writer',
		'artist',
		'scientist'
	],
	Philosophy: ['philosophy', 'philosopher', 'epistemology', 'metaphysics', 'ethics', 'logic'],
	Culture: [
		'culture',
		'cultural',
		'tradition',
		'customs',
		'festival',
		'ceremony',
		'folklore',
		'mythology'
	],
	Education: [
		'university',
		'school',
		'college',
		'education',
		'academic',
		'student',
		'professor',
		'alumni'
	],
	Society: ['society', 'social', 'community', 'organization', 'movement', 'group'],
	Geography: [
		'city',
		'country',
		'river',
		'region',
		'mountain',
		'island',
		'capital',
		'province',
		'ocean',
		'sea',
		'lake',
		'geography'
	],
	Humanities: ['humanities', 'arts', 'literature', 'linguistics'],
	Language: ['language', 'linguistic', 'grammar', 'vocabulary', 'dialect', 'writing'],
	Government: [
		'government',
		'politics',
		'political',
		'ministry',
		'parliament',
		'congress',
		'democracy',
		'election'
	],
	Law: ['law', 'legal', 'court', 'judge', 'attorney', 'legislation', 'constitution', 'crime'],
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
	mode: 'daily' | 'random' | 'archive' = 'daily',
	blockedCategories: string[] = []
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

	// Generate legend for unique categories that appeared in the journey
	const uniqueCategories = [...new Set(categories)].filter((cat) => cat !== '*');
	const legend =
		uniqueCategories.length > 0
			? uniqueCategories.map((cat) => `${CATEGORY_COLORS[cat]}=${CATEGORY_NAMES[cat]}`).join(' ')
			: '';

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
	// 1. Title and date
	// 2. Start -> Target
	// 3. Blocked categories (if any)
	// 4. Category chain
	// 5. Hops and time
	// 6. Legend (if any)
	// 7. URL
	const lines = [
		title,
		dateStr,
		'',
		`${start} → ${targetArticle}`
	];

	if (blockedLine) {
		lines.push(blockedLine);
	}

	lines.push(categoryChain);
	lines.push(`${hops} hops | ${timeStr}`);

	if (legend) {
		lines.push(legend);
	}

	lines.push('');
	lines.push(shareUrl);

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
	const text = generateShareText(
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
