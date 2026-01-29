// Category colors/emojis for share text only
export const BLOCKED_CATEGORY_EMOJIS: Record<string, string> = {
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
	Law: '⬜'
};

// CSS background colors for category bubbles
// Uses category-bubble class for theme-aware text colors (defined in app.css)
export const BLOCKED_CATEGORY_BG_COLORS: Record<string, string> = {
	Religion: 'category-bubble bg-purple-500/20 border-purple-500/40',
	History: 'category-bubble bg-amber-600/20 border-amber-600/40',
	People: 'category-bubble bg-red-500/20 border-red-500/40',
	Philosophy: 'category-bubble bg-yellow-500/20 border-yellow-500/40',
	Culture: 'category-bubble bg-orange-500/20 border-orange-500/40',
	Education: 'category-bubble bg-blue-500/20 border-blue-500/40',
	Society: 'category-bubble bg-sky-500/20 border-sky-500/40',
	Geography: 'category-bubble bg-green-500/20 border-green-500/40',
	Humanities: 'category-bubble bg-orange-600/20 border-orange-600/40',
	Language: 'category-bubble bg-emerald-500/20 border-emerald-500/40',
	Government: 'category-bubble bg-slate-500/20 border-slate-500/40',
	Law: 'category-bubble bg-gray-500/20 border-gray-500/40'
};

// Inline CSS colors for blocked links (used in HTML attributes)
// These use moderate opacity to work well in both light and dark modes
export const BLOCKED_CATEGORY_LINK_COLORS: Record<string, string> = {
	Religion: 'rgba(168, 85, 247, 0.2)',
	History: 'rgba(180, 83, 9, 0.2)',
	People: 'rgba(239, 68, 68, 0.2)',
	Philosophy: 'rgba(234, 179, 8, 0.2)',
	Culture: 'rgba(249, 115, 22, 0.2)',
	Education: 'rgba(37, 99, 235, 0.2)',
	Society: 'rgba(59, 130, 246, 0.2)',
	Geography: 'rgba(34, 197, 94, 0.2)',
	Humanities: 'rgba(234, 88, 12, 0.2)',
	Language: 'rgba(22, 163, 74, 0.2)',
	Government: 'rgba(107, 114, 128, 0.25)',
	Law: 'rgba(107, 114, 128, 0.2)'
};

// Category display names
export const BLOCKED_CATEGORY_NAMES: Record<string, string> = {
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
	Law: 'Law'
};

// All blockable categories
export const BLOCKABLE_CATEGORIES = [
	'Religion',
	'History',
	'People',
	'Philosophy',
	'Culture',
	'Education',
	'Society',
	'Geography',
	'Humanities',
	'Language',
	'Government',
	'Law'
] as const;

export type BlockableCategory = (typeof BLOCKABLE_CATEGORIES)[number];

// Format blocked categories for share text
export function formatBlockedCategoriesForShare(blockedCategories: string[]): string {
	if (blockedCategories.length === 0) return '';

	const formatted = blockedCategories
		.map((cat) => BLOCKED_CATEGORY_NAMES[cat] || cat)
		.join(', ');

	return `🚫 Blocked: ${formatted}`;
}
