<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { base } from '$app/paths';
	import { Dice5, Calendar, HelpCircle, Share2 } from 'lucide-svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import ThemeToggle from '$lib/components/layout/ThemeToggle.svelte';
	import { getAuthState } from '$lib/state/auth.svelte.js';
	import { setShowBiographyModal } from '$lib/state/ui.svelte.js';
	import { getTodaysChallenge } from '$lib/api/challenges.js';
	import { getTodaysResult } from '$lib/api/game-results.js';
	import { getXpProgress, getLevelTitle } from '$lib/utils/constants.js';
	import { shareResult } from '$lib/utils/share.js';
	import { toast } from 'svelte-sonner';
	import type { DailyChallenge, GameResult } from '$lib/types/database.js';
	import { BLOCKED_CATEGORY_BG_COLORS, BLOCKED_CATEGORY_NAMES } from '$lib/utils/blocked-categories.js';

	const auth = getAuthState();

	let challenge = $state<DailyChallenge | null>(null);
	let todaysResult = $state<GameResult | null>(null);
	let challengeLoading = $state(true);
	let resultLoading = $state(false);
	let isSharing = $state(false);

	async function handleShare() {
		if (!todaysResult || !challenge) return;

		isSharing = true;
		try {
			const success = await shareResult(
				challenge.id,
				todaysResult.hops,
				todaysResult.duration_seconds ?? 0,
				challenge.start_article,
				todaysResult.path,
				challenge.challenge_date,
				'daily',
				challenge.blocked_categories || []
			);

			if (success) {
				toast.success('Copied to clipboard!');
			}
		} catch (error) {
			console.error('Error sharing:', error);
			toast.error('Failed to share');
		} finally {
			isSharing = false;
		}
	}

	async function loadResult(userId: string, challengeId: number) {
		resultLoading = true;
		try {
			todaysResult = await getTodaysResult(userId, challengeId);
		} catch (error) {
			console.error('Error loading result:', error);
		} finally {
			resultLoading = false;
		}
	}

	onMount(async () => {
		console.log('[HomePage] Component mounted');
		try {
			// Load challenge (may be cached for instant load)
			console.log('[HomePage] Loading today\'s challenge...');
			challenge = await getTodaysChallenge();
			console.log('[HomePage] Challenge loaded:', challenge ? challenge.id : 'null');

			// Load result in parallel if user is already authenticated
			if (auth.user && challenge) {
				console.log('[HomePage] User authenticated, loading result');
				loadResult(auth.user.id, challenge.id);
			}
		} catch (error) {
			console.error('[HomePage] Error loading home data:', error);
		} finally {
			challengeLoading = false;
			console.log('[HomePage] Loading complete');
		}
	});

	// React to auth state changes (for when user logs in after page load)
	$effect(() => {
		const user = auth.user;
		const currentChallenge = untrack(() => challenge);
		if (user && currentChallenge && !todaysResult && !resultLoading) {
			loadResult(user.id, currentChallenge.id);
		}
	});

	const xpProgress = $derived(auth.profile ? getXpProgress(auth.profile.total_xp) : null);
	const levelTitle = $derived(auth.profile ? getLevelTitle(auth.profile.level) : null);
</script>

<svelte:head>
	<title>Via Basilica - Daily Wikipedia Game</title>
</svelte:head>

<main class="max-w-lg mx-auto px-4 py-6">
	<!-- Theme toggle -->
	<div class="flex justify-end mb-2">
		<ThemeToggle />
	</div>

	<!-- Hero Section -->
	<div class="text-center mb-8">
		<div class="w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden ring-4 ring-gold/30 shadow-lg">
			<img
				src="{base}/basil.jpg"
				alt="Basil the Great"
				class="w-full h-full object-cover"
			/>
		</div>
		<h1 class="text-3xl font-serif text-gold mb-2">Via Basilica</h1>
		<p class="text-text-dark-muted">Navigate Wikipedia to Basil the Great</p>
	</div>

	<!-- Quick Stats (if logged in) -->
	{#if auth.isAuthenticated && auth.profile}
		<Card class="mb-6">
			<div class="flex items-center justify-between mb-3">
				<div>
					<p class="text-sm text-text-dark-muted">Welcome back,</p>
					<p class="font-medium text-gold">{auth.profile.display_name || auth.profile.username}</p>
				</div>
				<Badge variant="gold">
					Lvl {auth.profile.level} {levelTitle}
				</Badge>
			</div>

			{#if xpProgress}
				<div class="progress-bar mb-2">
					<div class="progress-bar-fill" style="width: {xpProgress.percentage}%"></div>
				</div>
				<p class="text-xs text-text-dark-muted text-right">
					{xpProgress.current} / {xpProgress.required} XP
				</p>
			{/if}

			<div class="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-bg-dark-tertiary">
				<div class="text-center">
					<p class="text-lg font-semibold text-gold">{auth.profile.total_points}</p>
					<p class="text-xs text-text-dark-muted">Points</p>
				</div>
				<div class="text-center">
					<p class="text-lg font-semibold">{auth.profile.games_played}</p>
					<p class="text-xs text-text-dark-muted">Games</p>
				</div>
				<div class="text-center">
					<p class="text-lg font-semibold">{auth.profile.level}</p>
					<p class="text-xs text-text-dark-muted">Level</p>
				</div>
			</div>
		</Card>
	{/if}

	<!-- Daily Challenge Card -->
	<Card variant="elevated" class="mb-6 relative overflow-hidden">
		<div class="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>

		{#if challengeLoading}
			<!-- Skeleton UI for instant perceived load -->
			<div class="relative">
				<div class="flex items-center justify-between mb-4">
					<Skeleton width="120px" height="24px" rounded="full" />
				</div>
				<Skeleton width="180px" height="24px" class="mb-2" />
				<Skeleton width="140px" height="20px" class="mb-4" />
				<Skeleton width="100%" height="44px" rounded="lg" />
			</div>
		{:else if challenge}
			<div class="relative">
				<div class="flex items-center justify-between mb-4">
					<Badge variant="gold">Challenge #{challenge.id}</Badge>
					{#if todaysResult?.completed_at}
						<Badge variant="success">Completed</Badge>
					{/if}
				</div>

				<h2 class="text-xl font-serif text-text-dark mb-2">Today's Starting Point</h2>
				<p class="text-gold font-medium mb-2">{challenge.start_article.replace(/_/g, ' ')}</p>

				{#if challenge.blocked_categories && challenge.blocked_categories.length > 0}
					<div class="flex items-center gap-2 flex-wrap mb-4">
						<span class="text-xs text-text-dark-muted">Blocked:</span>
						{#each challenge.blocked_categories as category}
							<span
								class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border {BLOCKED_CATEGORY_BG_COLORS[category] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}"
							>
								{BLOCKED_CATEGORY_NAMES[category] || category}
							</span>
						{/each}
					</div>
				{:else}
					<div class="mb-4"></div>
				{/if}

				{#if todaysResult?.completed_at}
					<div class="bg-bg-dark-tertiary/50 rounded-lg p-4 mb-4">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm text-text-dark-muted">Your Result</p>
								<p class="text-2xl font-semibold text-gold">{todaysResult.hops} hops</p>
							</div>
							{#if todaysResult.points_awarded > 0}
								<div class="text-right">
									<p class="text-sm text-text-dark-muted">Points Earned</p>
									<p class="text-lg font-semibold text-gold">+{todaysResult.points_awarded}</p>
								</div>
							{/if}
						</div>
					</div>
					<div class="flex gap-3">
						<Button href="/leaderboard" variant="secondary" class="flex-1">
							View Leaderboard
						</Button>
						<button
							onclick={handleShare}
							disabled={isSharing}
							class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 transition-colors disabled:opacity-50"
							aria-label="Share your result"
						>
							<Share2 size={18} />
							<span class="sr-only sm:not-sr-only">Share</span>
						</button>
					</div>
				{:else}
					<Button href="/play/daily" class="w-full">
						Start Today's Challenge
					</Button>
				{/if}
			</div>
		{:else}
			<div class="text-center py-8">
				<p class="text-text-dark-muted">No challenge available today</p>
				<Button href="/play/random" variant="secondary" class="mt-4">
					Play Random Mode
				</Button>
			</div>
		{/if}
	</Card>

	<!-- Other Modes -->
	<div class="grid grid-cols-2 gap-4 mb-6">
		<Card padding="sm">
			<a href="{base}/play/random" class="block text-center py-2">
				<div class="flex justify-center mb-2">
					<Dice5 size={28} class="text-gold" />
				</div>
				<p class="font-medium">Random</p>
				<p class="text-xs text-text-dark-muted">Practice mode</p>
			</a>
		</Card>
		<Card padding="sm">
			<a href="{base}/play/archive" class="block text-center py-2">
				<div class="flex justify-center mb-2">
					<Calendar size={28} class="text-gold" />
				</div>
				<p class="font-medium">Archive</p>
				<p class="text-xs text-text-dark-muted">Past challenges</p>
			</a>
		</Card>
	</div>

	<!-- Who was Basil -->
	<button
		onclick={() => setShowBiographyModal(true)}
		class="w-full text-left"
	>
		<Card variant="outline" class="hover:border-gold/50 transition-colors">
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
					<HelpCircle size={24} class="text-gold" />
				</div>
				<div>
					<p class="font-medium">Who was Basil the Great?</p>
					<p class="text-sm text-text-dark-muted">Learn about the saint behind the game</p>
				</div>
			</div>
		</Card>
	</button>

	<!-- Login prompt (if not authenticated) -->
	{#if !auth.isAuthenticated && !auth.loading}
		<Card class="mt-6">
			<div class="text-center">
				<p class="text-text-dark-muted mb-4">Sign in to save your progress and compete on the leaderboard</p>
				<div class="flex gap-3 justify-center">
					<Button href="/auth/login" variant="secondary">Log In</Button>
					<Button href="/auth/signup">Sign Up</Button>
				</div>
			</div>
		</Card>
	{/if}
</main>
