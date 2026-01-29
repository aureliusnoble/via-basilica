import type { PathStep, PowerupUsage, GameMode } from './database.js';

export interface GameState {
	mode: GameMode;
	challengeId: number | null;
	startArticle: string;
	targetArticle: string;
	currentArticle: string;
	path: PathStep[];
	hops: number;
	startedAt: Date;
	isComplete: boolean;
	isPlaying: boolean;
	powerupSlots: [string | null, string | null];
	activePowerup: string | null;
	freeStepActive: boolean;
	powerupsUsed: PowerupUsage[];
}

export interface StoredGameState {
	mode: GameMode;
	challengeId: number | null;
	challengeDate: string;
	startArticle: string;
	targetArticle: string;
	currentArticle: string;
	path: PathStep[];
	hops: number;
	startedAt: string;
	powerupSlots: [string | null, string | null];
	freeStepActive: boolean;
	powerupsUsed: PowerupUsage[];
}

export interface VictoryData {
	hops: number;
	path: PathStep[];
	duration: number;
	pointsAwarded: number;
	xpEarned: number;
	challengeNumber: number;
}

export type PowerupSlotIndex = 0 | 1;
