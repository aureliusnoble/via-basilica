import type { PathStep, GameMode } from './database.js';

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
}

export interface VictoryData {
	hops: number;
	path: PathStep[];
	duration: number;
	pointsAwarded: number;
	xpEarned: number;
	challengeNumber: number;
}
