import { browser } from '$app/environment';
import type { GameState, StoredGameState } from '$lib/types/game.js';
import type { PathStep, GameMode } from '$lib/types/database.js';
import { TARGET_ARTICLE, isTargetArticle } from '$lib/api/wikipedia.js';
import { format } from 'date-fns';

const STORAGE_KEY = 'via_basilica_game_state';

// Game state using Svelte 5 runes
let gameState = $state<GameState | null>(null);

// Timer pause tracking (not persisted)
let pausedTime = $state(0); // Total milliseconds spent paused
let pauseStartTime = $state<number | null>(null); // When current pause started

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
		}
	};
}

export function startGame(
	mode: GameMode,
	startArticle: string,
	challengeId: number | null
) {
	// Reset pause tracking
	pausedTime = 0;
	pauseStartTime = null;

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
		isPlaying: true
	};

	saveToStorage();
}

export function navigateTo(articleTitle: string) {
	if (!gameState || gameState.isComplete) return;

	// Add to path
	gameState.path = [
		...gameState.path,
		{
			article_title: articleTitle,
			timestamp: new Date().toISOString(),
			is_free_step: false,
			is_undone: false
		}
	];

	// Update current article
	gameState.currentArticle = articleTitle;

	// Increment hops
	gameState.hops++;

	// Check for victory - only set isComplete, not isPlaying
	// isPlaying should remain true so the UI shows the victory modal
	// instead of the error state. The game ends when user closes the modal.
	if (isTargetArticle(articleTitle)) {
		gameState.isComplete = true;
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

	// Decrement hops
	if (!undoneStep.is_free_step) {
		gameState.hops = Math.max(0, gameState.hops - 1);
	}

	// Go back to previous article
	const previousStep = gameState.path[gameState.path.length - 2];
	gameState.currentArticle = previousStep.article_title;

	saveToStorage();

	return previousStep.article_title;
}

export function endGame() {
	gameState = null;
	clearStorage();
}

export function getGameDuration(): number {
	if (!gameState) return 0;

	let totalElapsed = Date.now() - gameState.startedAt.getTime();

	// Subtract time spent paused
	let totalPaused = pausedTime;
	if (pauseStartTime !== null) {
		// Currently paused, add current pause duration
		totalPaused += Date.now() - pauseStartTime;
	}

	return Math.floor((totalElapsed - totalPaused) / 1000);
}

export function pauseTimer() {
	if (pauseStartTime === null) {
		pauseStartTime = Date.now();
	}
}

export function resumeTimer() {
	if (pauseStartTime !== null) {
		pausedTime += Date.now() - pauseStartTime;
		pauseStartTime = null;
	}
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
		startedAt: gameState.startedAt.toISOString()
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

		// Reset pause tracking for resumed games
		pausedTime = 0;
		pauseStartTime = null;

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
			isPlaying: true
		};

		return true;
	} catch {
		clearStorage();
		return false;
	}
}
