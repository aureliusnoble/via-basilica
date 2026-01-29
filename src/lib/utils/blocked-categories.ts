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
export const BLOCKED_CATEGORY_BG_COLORS: Record<string, string> = {
	Religion: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
	History: 'bg-amber-700/20 text-amber-300 border-amber-700/30',
	People: 'bg-red-500/20 text-red-300 border-red-500/30',
	Philosophy: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
	Culture: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
	Education: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
	Society: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
	Geography: 'bg-green-500/20 text-green-300 border-green-500/30',
	Humanities: 'bg-orange-600/20 text-orange-300 border-orange-600/30',
	Language: 'bg-green-600/20 text-green-300 border-green-600/30',
	Government: 'bg-gray-700/20 text-gray-300 border-gray-700/30',
	Law: 'bg-gray-400/20 text-gray-200 border-gray-400/30'
};

// Inline CSS colors for blocked links (used in HTML attributes)
export const BLOCKED_CATEGORY_LINK_COLORS: Record<string, string> = {
	Religion: 'rgba(168, 85, 247, 0.25)',
	History: 'rgba(180, 83, 9, 0.25)',
	People: 'rgba(239, 68, 68, 0.25)',
	Philosophy: 'rgba(234, 179, 8, 0.25)',
	Culture: 'rgba(249, 115, 22, 0.25)',
	Education: 'rgba(37, 99, 235, 0.25)',
	Society: 'rgba(59, 130, 246, 0.25)',
	Geography: 'rgba(34, 197, 94, 0.25)',
	Humanities: 'rgba(234, 88, 12, 0.25)',
	Language: 'rgba(22, 163, 74, 0.25)',
	Government: 'rgba(55, 65, 81, 0.4)',
	Law: 'rgba(156, 163, 175, 0.25)'
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
