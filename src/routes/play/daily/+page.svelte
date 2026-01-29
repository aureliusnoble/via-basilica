<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { Check } from 'lucide-svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import GameHeader from '$lib/components/game/GameHeader.svelte';
	import BreadcrumbTrail from '$lib/components/game/BreadcrumbTrail.svelte';
	import WikiArticleView from '$lib/components/game/WikiArticleView.svelte';
	import VictoryModal from '$lib/components/game/VictoryModal.svelte';
	import PowerupSelectionScreen from '$lib/components/game/PowerupSelectionScreen.svelte';
	import { getAuthState } from '$lib/state/auth.svelte.js';
	import {
		getGameState,
		startGame,
		navigateTo,
		loadFromStorage,
		endGame,
		activatePowerup,
		clearActivePowerup,
		getGameDuration
	} from '$lib/state/game.svelte.js';
	import { loadPlayerPowerups } from '$lib/state/player.svelte.js';
	import { getTodaysChallenge } from '$lib/api/challenges.js';
	import { getTodaysResult, completeGameResult, createGameResult } from '$lib/api/game-results.js';
	import { isTargetArticle } from '$lib/api/wikipedia.js';
	import { toast } from 'svelte-sonner';
	import type { DailyChallenge, GameResult } from '$lib/types/database.js';

	const auth = getAuthState();
	const game = getGameState();

	let challenge = $state<DailyChallenge | null>(null);
	let existingResult = $state<GameResult | null>(null);
	let loading = $state(true);
	let showPowerupSelection = $state(false);
	let showVictory = $state(false);
	let elapsedSeconds = $state(0);
	let timerInterval = $state<ReturnType<typeof setInterval> | null>(null);
	let gameResultId = $state<string | null>(null);

	onMount(async () => {
		try {
			// Load challenge
			challenge = await getTodaysChallenge();

			if (!challenge) {
				toast.error('No daily challenge available');
				goto(`${base}/`);
				return;
			}

			// Check for existing result
			if (auth.user) {
				existingResult = await getTodaysResult(auth.user.id);
				if (existingResult?.completed_at) {
					// Already completed
					loading = false;
					return;
				}

				// Load powerups for selection
				await loadPlayerPowerups();
			}

			// Try to resume from storage
			const resumed = loadFromStorage();
			if (resumed && game.state?.challengeId === challenge.id) {
				// Resume game
				startTimer();
				// Check if we're already on the target article
				if (isTargetArticle(game.currentArticle)) {
					await handleVictory();
				}
			} else {
				// Show powerup selection (or skip if not authenticated)
				if (auth.isAuthenticated) {
					showPowerupSelection = true;
				} else {
					await startNewGame([null, null]);
				}
			}
		} catch (error) {
			console.error('Error loading daily challenge:', error);
			toast.error('Failed to load challenge');
		} finally {
			loading = false;
		}
	});

	onDestroy(() => {
		if (timerInterval) {
			clearInterval(timerInterval);
		}
	});

	function startTimer() {
		elapsedSeconds = getGameDuration();
		timerInterval = setInterval(() => {
			elapsedSeconds = getGameDuration();
		}, 1000);
	}

	async function startNewGame(powerupSlots: [string | null, string | null]) {
		if (!challenge) return;

		showPowerupSelection = false;

		// Create game result in database
		if (auth.user) {
			const result = await createGameResult(auth.user.id, 'daily', challenge.start_article, challenge.id);
			if (result) {
				gameResultId = result.id;
			}
		}

		// Start local game state
		startGame('daily', challenge.start_article, challenge.id, powerupSlots);
		startTimer();
	}

	async function handleNavigate(title: string) {
		navigateTo(title);

		// Check for victory
		if (isTargetArticle(title)) {
			await handleVictory();
		}
	}

	async function handleVictory() {
		if (timerInterval) {
			clearInterval(timerInterval);
		}

		const finalDuration = getGameDuration();

		// Submit result
		if (gameResultId && game.state) {
			try {
				await completeGameResult(
					gameResultId,
					game.state.path,
					game.state.hops,
					game.state.powerupsUsed,
					finalDuration
				);
			} catch (error) {
				console.error('Error completing game:', error);
			}
		}

		showVictory = true;
	}

	function handleActivatePowerup(index: 0 | 1) {
		const powerupId = game.powerupSlots[index];
		if (!powerupId) return;

		// For simple powerups like free-step
		if (powerupId === 'free-step') {
			activatePowerup(powerupId);
			toast.success("Free Step activated! Your next click won't count.");
		} else if (powerupId === 'undo') {
			// Handle undo
			// TODO: Implement undo
			toast.info('Undo not yet implemented');
		} else {
			// For powerups that need UI (category-peek, preview, etc.)
			activatePowerup(powerupId);
			toast.info(`${powerupId} activated`);
		}
	}

	function handleVictoryClose() {
		endGame();
		goto(`${base}/`);
	}
</script>

<svelte:head>
	<title>Daily Challenge - Via Basilica</title>
</svelte:head>

{#if loading}
	<div class="flex items-center justify-center min-h-screen">
		<Spinner size="lg" />
	</div>
{:else if existingResult?.completed_at}
	<!-- Already completed -->
	<main class="max-w-lg mx-auto px-4 py-6">
		<div class="text-center py-12">
			<div class="w-20 h-20 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
				<Check size={40} class="text-success" />
			</div>
			<h1 class="text-2xl font-serif text-gold mb-2">Challenge Complete!</h1>
			<p class="text-text-dark-muted mb-6">You've already completed today's challenge</p>

			<Card class="text-left mb-6">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<p class="text-sm text-text-dark-muted">Your Result</p>
						<p class="text-2xl font-bold text-gold">{existingResult.hops} hops</p>
					</div>
					{#if existingResult.points_awarded}
						<div>
							<p class="text-sm text-text-dark-muted">Points Earned</p>
							<p class="text-2xl font-bold">+{existingResult.points_awarded}</p>
						</div>
					{/if}
				</div>
			</Card>

			<div class="space-y-3">
				<Button href="{base}/leaderboard" class="w-full">View Leaderboard</Button>
				<Button href="{base}/" variant="secondary" class="w-full">Back to Home</Button>
			</div>
		</div>
	</main>
{:else if showPowerupSelection}
	<PowerupSelectionScreen
		onStart={startNewGame}
		onSkip={() => startNewGame([null, null])}
	/>
{:else if game.isPlaying && challenge}
	<!-- Game in progress -->
	<GameHeader
		hops={game.hops}
		{elapsedSeconds}
		powerupSlots={game.powerupSlots}
		activePowerup={game.activePowerup}
		onActivatePowerup={handleActivatePowerup}
	/>

	<BreadcrumbTrail path={game.path} currentArticle={game.currentArticle} />

	<WikiArticleView
		articleTitle={game.currentArticle}
		onNavigate={handleNavigate}
	/>

	<VictoryModal
		bind:open={showVictory}
		hops={game.hops}
		path={game.path}
		duration={elapsedSeconds}
		challengeNumber={challenge.id}
		startArticle={challenge.start_article}
		onClose={handleVictoryClose}
	/>
{:else}
	<!-- Error state -->
	<main class="max-w-lg mx-auto px-4 py-6">
		<div class="text-center py-12">
			<p class="text-text-dark-muted mb-4">Something went wrong</p>
			<Button href="{base}/" variant="secondary">Back to Play</Button>
		</div>
	</main>
{/if}
