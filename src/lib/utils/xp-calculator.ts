import type { GameMode } from '$lib/types/database.js';

export interface XpBreakdown {
	base: number;
	hopBonus: number;
	percentileBonus: number;
	total: number;
}

export function calculateXp(
	mode: GameMode,
	hops: number,
	percentilePoints: number = 0
): XpBreakdown {
	let base = 0;
	let hopBonus = 0;

	switch (mode) {
		case 'daily':
			base = 50;
			hopBonus = Math.max(0, (10 - hops) * 10);
			break;
		case 'archive':
			base = 25;
			hopBonus = Math.max(0, (10 - hops) * 5); // Half bonus
			break;
		case 'random':
			base = 10;
			hopBonus = 0;
			break;
	}

	return {
		base,
		hopBonus,
		percentileBonus: percentilePoints,
		total: base + hopBonus + percentilePoints
	};
}

