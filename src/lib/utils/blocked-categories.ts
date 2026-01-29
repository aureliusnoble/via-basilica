// Category colors/emojis for display
export const BLOCKED_CATEGORY_COLORS: Record<string, string> = {
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

// Category display names (same as key in this case, but allows for customization)
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
