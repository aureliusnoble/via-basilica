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

export function calculatePercentilePoints(rank: number, totalPlayers: number): number {
	if (totalPlayers === 0) return 0;

	const percentile = (rank / totalPlayers) * 100;

	if (percentile <= 10) return 10;
	if (percentile <= 20) return 9;
	if (percentile <= 30) return 8;
	if (percentile <= 40) return 7;
	if (percentile <= 50) return 6;
	if (percentile <= 60) return 5;
	if (percentile <= 70) return 4;
	if (percentile <= 80) return 3;
	if (percentile <= 90) return 2;
	return 1;
}
