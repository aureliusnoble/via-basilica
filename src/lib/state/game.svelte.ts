import { browser } from '$app/environment';
import type { GameState, StoredGameState } from '$lib/types/game.js';
import type { PathStep, PowerupUsage, GameMode } from '$lib/types/database.js';
import { TARGET_ARTICLE } from '$lib/api/wikipedia.js';
import { format } from 'date-fns';

const STORAGE_KEY = 'via_basilica_game_state';

// Game state using Svelte 5 runes
let gameState = $state<GameState | null>(null);

export function getGameState() {
	return {
		get state() {
			return gameState;
		},
		get isPlaying() {
			return gameState?.isPlaying || false;
		},
		get isComplete() {
			return gameState?.isComplete || false;
		},
		get hops() {
			return gameState?.hops || 0;
		},
		get path() {
			return gameState?.path || [];
		},
		get currentArticle() {
			return gameState?.currentArticle || '';
		},
		get activePowerup() {
			return gameState?.activePowerup || null;
		},
		get freeStepActive() {
			return gameState?.freeStepActive || false;
		},
		get powerupSlots() {
			return gameState?.powerupSlots || [null, null];
		}
	};
}

export function startGame(
	mode: GameMode,
	startArticle: string,
	challengeId: number | null,
	powerupSlots: [string | null, string | null] = [null, null]
) {
	gameState = {
		mode,
		challengeId,
		startArticle,
		targetArticle: TARGET_ARTICLE,
		currentArticle: startArticle,
		path: [
			{
				article_title: startArticle,
				timestamp: new Date().toISOString(),
				is_free_step: false,
				is_undone: false
			}
		],
		hops: 0,
		startedAt: new Date(),
		isComplete: false,
		isPlaying: true,
		powerupSlots,
		activePowerup: null,
		freeStepActive: false,
		powerupsUsed: []
	};

	saveToStorage();
}

export function navigateTo(articleTitle: string) {
	if (!gameState || gameState.isComplete) return;

	const isFreeStep = gameState.freeStepActive;

	// Add to path
	gameState.path = [
		...gameState.path,
		{
			article_title: articleTitle,
			timestamp: new Date().toISOString(),
			is_free_step: isFreeStep,
			is_undone: false
		}
	];

	// Update current article
	gameState.currentArticle = articleTitle;

	// Increment hops (unless free step)
	if (!isFreeStep) {
		gameState.hops++;
	}

	// Clear free step flag
	gameState.freeStepActive = false;

	// Check for victory
	const normalizedTitle = articleTitle.replace(/ /g, '_');
	if (normalizedTitle === TARGET_ARTICLE || normalizedTitle === 'Basil_the_Great') {
		gameState.isComplete = true;
		gameState.isPlaying = false;
	}

	saveToStorage();
}

export function undoLastStep(): string | null {
	if (!gameState || gameState.path.length <= 1) return null;

	// Get the step we're undoing
	const undoneStep = gameState.path[gameState.path.length - 1];

	// Mark it as undone
	gameState.path = gameState.path.map((step, i) =>
		i === gameState!.path.length - 1 ? { ...step, is_undone: true } : step
	);

	// If it wasn't a free step, decrement hops
	if (!undoneStep.is_free_step) {
		gameState.hops = Math.max(0, gameState.hops - 1);
	}

	// Go back to previous article
	const previousStep = gameState.path[gameState.path.length - 2];
	gameState.currentArticle = previousStep.article_title;

	saveToStorage();

	return previousStep.article_title;
}

export function activatePowerup(powerupId: string) {
	if (!gameState) return;

	if (powerupId === 'free-step') {
		gameState.freeStepActive = true;
	} else {
		gameState.activePowerup = powerupId;
	}

	// Record usage
	gameState.powerupsUsed = [
		...gameState.powerupsUsed,
		{
			powerup_id: powerupId,
			used_at: new Date().toISOString(),
			step_number: gameState.path.length - 1
		}
	];

	saveToStorage();
}

export function clearActivePowerup() {
	if (!gameState) return;
	gameState.activePowerup = null;
	saveToStorage();
}

export function endGame() {
	gameState = null;
	clearStorage();
}

export function getGameDuration(): number {
	if (!gameState) return 0;
	return Math.floor((Date.now() - gameState.startedAt.getTime()) / 1000);
}

// Storage functions
function saveToStorage() {
	if (!browser || !gameState) return;

	const stored: StoredGameState = {
		mode: gameState.mode,
		challengeId: gameState.challengeId,
		challengeDate: format(new Date(), 'yyyy-MM-dd'),
		startArticle: gameState.startArticle,
		targetArticle: gameState.targetArticle,
		currentArticle: gameState.currentArticle,
		path: gameState.path,
		hops: gameState.hops,
		startedAt: gameState.startedAt.toISOString(),
		powerupSlots: gameState.powerupSlots,
		freeStepActive: gameState.freeStepActive,
		powerupsUsed: gameState.powerupsUsed
	};

	localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

function clearStorage() {
	if (!browser) return;
	localStorage.removeItem(STORAGE_KEY);
}

export function loadFromStorage(): boolean {
	if (!browser) return false;

	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return false;

	try {
		const data: StoredGameState = JSON.parse(stored);

		// Check if it's from today (for daily mode)
		const today = format(new Date(), 'yyyy-MM-dd');
		if (data.mode === 'daily' && data.challengeDate !== today) {
			clearStorage();
			return false;
		}

		gameState = {
			mode: data.mode,
			challengeId: data.challengeId,
			startArticle: data.startArticle,
			targetArticle: data.targetArticle,
			currentArticle: data.currentArticle,
			path: data.path,
			hops: data.hops,
			startedAt: new Date(data.startedAt),
			isComplete: false,
			isPlaying: true,
			powerupSlots: data.powerupSlots,
			activePowerup: null,
			freeStepActive: data.freeStepActive,
			powerupsUsed: data.powerupsUsed
		};

		return true;
	} catch {
		clearStorage();
		return false;
	}
}
