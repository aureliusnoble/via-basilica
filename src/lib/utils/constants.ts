export const TARGET_ARTICLE = 'Basil_of_Caesarea';
export const TARGET_ARTICLE_DISPLAY = 'Basil of Caesarea';
export const GAME_NAME = 'Via Basilica';

// Level titles based on Basil's life
export const LEVEL_TITLES: Record<number, string> = {
	1: 'Novice',
	3: 'Student',
	6: 'Pilgrim',
	11: 'Scholar',
	21: 'Deacon',
	36: 'Presbyter',
	51: 'Bishop'
};

export function getLevelTitle(level: number): string {
	const thresholds = Object.keys(LEVEL_TITLES)
		.map(Number)
		.sort((a, b) => b - a);

	for (const threshold of thresholds) {
		if (level >= threshold) {
			return LEVEL_TITLES[threshold];
		}
	}

	return 'Novice';
}

// XP thresholds for levels (100 * level^1.5)
export function getXpForLevel(level: number): number {
	if (level <= 1) return 0;
	return Math.floor(100 * Math.pow(level, 1.5));
}

export function getLevelFromXp(xp: number): number {
	let level = 1;
	while (getXpForLevel(level + 1) <= xp) {
		level++;
	}
	return level;
}

export function getXpProgress(xp: number): { current: number; required: number; percentage: number } {
	const level = getLevelFromXp(xp);
	const currentLevelXp = getXpForLevel(level);
	const nextLevelXp = getXpForLevel(level + 1);
	const progressXp = xp - currentLevelXp;
	const requiredXp = nextLevelXp - currentLevelXp;

	return {
		current: progressXp,
		required: requiredXp,
		percentage: Math.min(100, Math.floor((progressXp / requiredXp) * 100))
	};
}
