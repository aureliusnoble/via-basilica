<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import GameHeader from '$lib/components/game/GameHeader.svelte';
	import BreadcrumbTrail from '$lib/components/game/BreadcrumbTrail.svelte';
	import WikiArticleView from '$lib/components/game/WikiArticleView.svelte';
	import VictoryModal from '$lib/components/game/VictoryModal.svelte';
	import {
		getGameState,
		startGame,
		navigateTo,
		endGame,
		getGameDuration,
		pauseTimer,
		resumeTimer
	} from '$lib/state/game.svelte.js';
	import { fetchRandomArticle, isTargetArticle } from '$lib/api/wikipedia.js';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	const game = getGameState();

	let loading = $state(true);
	let showVictory = $state(false);
	let elapsedSeconds = $state(0);
	let timerInterval = $state<ReturnType<typeof setInterval> | null>(null);
	let startArticle = $state('');
	let gameStartDate = $state(new Date());

	onMount(async () => {
		try {
			let article: { title: string };

			// Use preset start if provided via URL, otherwise fetch random
			if (data.presetStart) {
				article = { title: data.presetStart };
			} else {
				article = await fetchRandomArticle();
			}

			startArticle = article.title;
			gameStartDate = new Date();
			startGame('random', article.title, null);
			startTimer();
		} catch (error) {
			console.error('Error starting random game:', error);
			toast.error('Failed to load random article');
			goto(`${base}/`);
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
		elapsedSeconds = 0;
		timerInterval = setInterval(() => {
			elapsedSeconds = getGameDuration();
		}, 1000);
	}

	async function handleNavigate(title: string) {
		navigateTo(title);

		if (isTargetArticle(title)) {
			handleVictory();
		}
	}

	function handleVictory() {
		if (timerInterval) {
			clearInterval(timerInterval);
		}
		showVictory = true;
	}

	function handleVictoryClose() {
		endGame();
		goto(`${base}/`);
	}

	function handleLoadingChange(isLoading: boolean) {
		if (isLoading) {
			pauseTimer();
		} else {
			resumeTimer();
		}
	}

	async function handleNewGame() {
		loading = true;
		endGame();
		try {
			const article = await fetchRandomArticle();
			startArticle = article.title;
			gameStartDate = new Date();
			startGame('random', article.title, null);
			startTimer();
			showVictory = false;
		} catch (error) {
			toast.error('Failed to load new article');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Random Mode - Via Basilica</title>
</svelte:head>

{#if loading}
	<div class="flex items-center justify-center min-h-screen">
		<Spinner size="lg" />
	</div>
{:else if game.isPlaying}
	<GameHeader
		hops={game.hops}
		{elapsedSeconds}
		backHref="/"
	/>

	<BreadcrumbTrail path={game.path} currentArticle={game.currentArticle} />

	<WikiArticleView
		articleTitle={game.currentArticle}
		onNavigate={handleNavigate}
		onLoadingChange={handleLoadingChange}
	/>

	<VictoryModal
		bind:open={showVictory}
		hops={game.hops}
		path={game.path}
		duration={elapsedSeconds}
		challengeNumber={0}
		{startArticle}
		challengeDate={gameStartDate}
		mode="random"
		onClose={handleVictoryClose}
	/>

	{#if showVictory}
		<div class="fixed bottom-24 left-0 right-0 px-4">
			<Button onclick={handleNewGame} class="w-full max-w-lg mx-auto block">
				Play Again
			</Button>
		</div>
	{/if}
{:else}
	<main class="max-w-lg mx-auto px-4 py-6">
		<div class="text-center py-12">
			<p class="text-text-dark-muted mb-4">Something went wrong</p>
			<Button href="/" variant="secondary">Back to Play</Button>
		</div>
	</main>
{/if}
