export interface PowerupInfo {
	id: string;
	name: string;
	description: string;
	icon: string; // Lucide icon name
	cost: number;
	category: 'information' | 'navigation' | 'strategic';
}

export const POWERUPS: Record<string, PowerupInfo> = {
	'category-peek': {
		id: 'category-peek',
		name: 'Category Peek',
		description: "See the current page's Wikipedia categories",
		icon: 'folder-open',
		cost: 10,
		category: 'information'
	},
	'ctrl-f': {
		id: 'ctrl-f',
		name: 'Ctrl+F',
		description: 'Search/filter visible links on the current page',
		icon: 'search',
		cost: 10,
		category: 'information'
	},
	preview: {
		id: 'preview',
		name: 'Preview',
		description: 'See the first paragraph of any link before clicking',
		icon: 'eye',
		cost: 15,
		category: 'navigation'
	},
	'free-step': {
		id: 'free-step',
		name: 'Free Step',
		description: "Your next click doesn't count as a hop",
		icon: 'footprints',
		cost: 20,
		category: 'navigation'
	},
	undo: {
		id: 'undo',
		name: 'Undo',
		description: 'Go back one page without it counting',
		icon: 'undo-2',
		cost: 20,
		category: 'navigation'
	},
	backlinks: {
		id: 'backlinks',
		name: 'Backlinks',
		description: 'See 5 articles that link TO the current page',
		icon: 'link',
		cost: 20,
		category: 'strategic'
	},
	scout: {
		id: 'scout',
		name: 'Scout',
		description: "Preview any link's outgoing links before committing",
		icon: 'telescope',
		cost: 25,
		category: 'strategic'
	}
};

export type PowerupId = keyof typeof POWERUPS;
