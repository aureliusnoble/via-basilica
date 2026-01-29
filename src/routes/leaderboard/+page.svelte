<script lang="ts">
	import { onMount } from 'svelte';
	import { Medal, TrendingUp, TrendingDown, Minus, MoreHorizontal } from 'lucide-svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import {
		getDailyLeaderboard,
		getMonthlyTotalLeaderboard,
		getMonthlyAverageLeaderboard,
		type LeaderboardType
	} from '$lib/api/leaderboard.js';
	import { formatDuration } from '$lib/utils/date-helpers.js';
	import { getLevelTitle } from '$lib/utils/constants.js';
	import { format } from 'date-fns';
	import type { LeaderboardEntry } from '$lib/types/database.js';
	import { getAuthState } from '$lib/state/auth.svelte.js';

	type DisplayEntry = { type: 'entry'; entry: LeaderboardEntry; rank: number } | { type: 'ellipsis' };

	const TOP_COUNT = 3;
	const CONTEXT_AROUND_USER = 2;
	const MIN_ENTRIES_TO_COLLAPSE = 10;

	let activeTab = $state<LeaderboardType>('daily');
	let entries = $state<LeaderboardEntry[]>([]);
	let loading = $state(true);

	const auth = getAuthState();
	const currentMonth = format(new Date(), 'MMMM yyyy');

	// Compute display entries: top 3 + ellipsis + context around current user
	const displayEntries = $derived.by(() => {
		if (entries.length <= MIN_ENTRIES_TO_COLLAPSE) {
			return entries.map((entry, index) => ({ type: 'entry' as const, entry, rank: index + 1 }));
		}

		const userId = auth.user?.id;
		const userIndex = userId ? entries.findIndex(e => e.user_id === userId) : -1;

		// If user not found or in top positions, show all entries up to a reasonable limit
		if (userIndex === -1 || userIndex < TOP_COUNT + CONTEXT_AROUND_USER) {
			return entries.map((entry, index) => ({ type: 'entry' as const, entry, rank: index + 1 }));
		}

		const result: DisplayEntry[] = [];

		// Add top 3
		for (let i = 0; i < TOP_COUNT; i++) {
			result.push({ type: 'entry', entry: entries[i], rank: i + 1 });
		}

		// Calculate context range around user
		const contextStart = Math.max(TOP_COUNT, userIndex - CONTEXT_AROUND_USER);
		const contextEnd = Math.min(entries.length - 1, userIndex + CONTEXT_AROUND_USER);

		// Add ellipsis if there's a gap
		if (contextStart > TOP_COUNT) {
			result.push({ type: 'ellipsis' });
		}

		// Add entries around user
		for (let i = contextStart; i <= contextEnd; i++) {
			result.push({ type: 'entry', entry: entries[i], rank: i + 1 });
		}

		// Add trailing ellipsis if there are more entries after
		if (contextEnd < entries.length - 1) {
			result.push({ type: 'ellipsis' });
		}

		return result;
	});

	onMount(() => {
		loadLeaderboard('daily');
	});

	async function loadLeaderboard(type: LeaderboardType) {
		loading = true;
		activeTab = type;

		try {
			if (type === 'daily') {
				entries = await getDailyLeaderboard();
			} else if (type === 'monthly-total') {
				entries = await getMonthlyTotalLeaderboard();
			} else if (type === 'monthly-average') {
				entries = await getMonthlyAverageLeaderboard();
			}
		} catch (error) {
			console.error('Error loading leaderboard:', error);
		} finally {
			loading = false;
		}
	}

	function getRankColor(rank: number): string {
		if (rank === 1) return 'text-yellow-400';
		if (rank === 2) return 'text-gray-300';
		if (rank === 3) return 'text-amber-600';
		return '';
	}
</script>

<svelte:head>
	<title>Leaderboard - Via Basilica</title>
</svelte:head>

<Header title="Leaderboard" />

<main class="max-w-lg mx-auto">
	<!-- Tabs -->
	<div class="flex border-b border-bg-dark-tertiary px-4">
		<button
			onclick={() => loadLeaderboard('daily')}
			class="flex-1 py-3 text-center text-sm font-medium transition-colors relative
				{activeTab === 'daily' ? 'text-gold' : 'text-text-dark-muted hover:text-text-dark'}"
		>
			Daily
			{#if activeTab === 'daily'}
				<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"></div>
			{/if}
		</button>
		<button
			onclick={() => loadLeaderboard('monthly-total')}
			class="flex-1 py-3 text-center text-sm font-medium transition-colors relative
				{activeTab === 'monthly-total' ? 'text-gold' : 'text-text-dark-muted hover:text-text-dark'}"
		>
			Monthly
			{#if activeTab === 'monthly-total'}
				<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"></div>
			{/if}
		</button>
		<button
			onclick={() => loadLeaderboard('monthly-average')}
			class="flex-1 py-3 text-center text-sm font-medium transition-colors relative
				{activeTab === 'monthly-average' ? 'text-gold' : 'text-text-dark-muted hover:text-text-dark'}"
		>
			Average
			{#if activeTab === 'monthly-average'}
				<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"></div>
			{/if}
		</button>
	</div>

	<!-- Month indicator for monthly tabs -->
	{#if activeTab !== 'daily'}
		<div class="px-4 py-2 text-center text-sm text-text-dark-muted border-b border-bg-dark-tertiary">
			{currentMonth}
		</div>
	{/if}

	<div class="px-4 py-4">
		{#if loading}
			<div class="flex items-center justify-center py-12">
				<Spinner size="lg" />
			</div>
		{:else if entries.length === 0}
			<div class="text-center py-12">
				<p class="text-text-dark-muted">No entries yet</p>
				{#if activeTab === 'daily'}
					<p class="text-sm text-text-dark-muted mt-2">Be the first to complete today's challenge!</p>
				{:else}
					<p class="text-sm text-text-dark-muted mt-2">Complete daily challenges to appear here</p>
				{/if}
			</div>
		{:else}
			<div class="space-y-2">
				{#each displayEntries as item}
					{#if item.type === 'ellipsis'}
						<!-- Ellipsis separator -->
						<div class="flex items-center justify-center py-2 text-text-dark-muted">
							<MoreHorizontal size={24} />
						</div>
					{:else}
						{@const entry = item.entry}
						{@const rank = item.rank}
						{@const isCurrentUser = auth.user?.id === entry.user_id}
						<Card padding="sm" class={isCurrentUser ? 'ring-1 ring-gold' : ''}>
							<div class="flex items-center gap-3">
								<!-- Rank -->
								<div class="w-8 text-center flex-shrink-0">
									{#if rank <= 3}
										<Medal size={24} class={getRankColor(rank)} />
									{:else}
										<span class="text-text-dark-muted font-medium">{rank}</span>
									{/if}
								</div>

								<!-- User info -->
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										<p class="font-medium truncate {isCurrentUser ? 'text-gold' : ''}">
											{entry.display_name || entry.username}
										</p>
										{#if entry.level}
											<span class="text-xs text-gold/80 px-1.5 py-0.5 bg-gold/10 rounded">
												{getLevelTitle(entry.level)}
											</span>
										{/if}
										<!-- Position change indicator (monthly only) -->
										{#if activeTab !== 'daily' && entry.position_change !== undefined}
											{#if entry.position_change > 0}
												<span class="flex items-center text-xs text-success">
													<TrendingUp size={12} />
													<span class="ml-0.5">{entry.position_change}</span>
												</span>
											{:else if entry.position_change < 0}
												<span class="flex items-center text-xs text-error">
													<TrendingDown size={12} />
													<span class="ml-0.5">{Math.abs(entry.position_change)}</span>
												</span>
											{:else}
												<span class="flex items-center text-xs text-text-dark-muted">
													<Minus size={12} />
												</span>
											{/if}
										{:else if activeTab !== 'daily' && entry.position_change === undefined}
											<span class="text-xs text-gold px-1.5 py-0.5 bg-gold/10 rounded">NEW</span>
										{/if}
									</div>

									{#if activeTab === 'daily' && entry.path.length > 0}
										<!-- Path visualization -->
										<div class="flex gap-0.5 mt-1 overflow-x-auto">
											{#each entry.path.slice(0, 10) as step, i}
												<div
													class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0
														{i === 0 ? 'bg-success/20 text-success' : ''}
														{i === entry.path.length - 1 ? 'bg-gold text-bg-dark' : ''}
														{i > 0 && i < entry.path.length - 1 ? 'bg-bg-dark-tertiary' : ''}"
													title={step.article_title}
												>
													{step.article_title.charAt(0)}
												</div>
											{/each}
											{#if entry.path.length > 10}
												<span class="text-xs text-text-dark-muted self-center">+{entry.path.length - 10}</span>
											{/if}
										</div>
									{:else if activeTab !== 'daily'}
										<p class="text-xs text-text-dark-muted">
											{entry.games_played} {entry.games_played === 1 ? 'day' : 'days'} played
										</p>
									{/if}
								</div>

								<!-- Stats -->
								<div class="text-right flex-shrink-0">
									{#if activeTab === 'daily'}
										<p class="text-lg font-bold text-gold">{entry.hops}</p>
										<p class="text-xs text-text-dark-muted">{formatDuration(entry.duration_seconds)}</p>
									{:else if activeTab === 'monthly-total'}
										<p class="text-lg font-bold text-gold">{entry.points_awarded}</p>
										<p class="text-xs text-text-dark-muted">pts</p>
									{:else}
										<p class="text-lg font-bold text-gold">{entry.average_hops?.toFixed(1)}</p>
										<p class="text-xs text-text-dark-muted">avg pts</p>
									{/if}
								</div>
							</div>
						</Card>
					{/if}
				{/each}
			</div>
		{/if}
	</div>

	<!-- Scoring explanation -->
	{#if activeTab !== 'daily'}
		<div class="px-4 pb-4">
			<Card padding="sm" variant="outline">
				<p class="text-xs text-text-dark-muted text-center mb-2">
					Daily points by hop count:
				</p>
				<div class="grid grid-cols-4 gap-1 text-xs text-center">
					<span class="text-gold">1 hop: 20</span>
					<span class="text-gold">2 hops: 18</span>
					<span class="text-gold">3 hops: 17</span>
					<span>5 hops: 15</span>
					<span>7 hops: 13</span>
					<span>10 hops: 10</span>
					<span>12 hops: 8</span>
					<span class="text-text-dark-muted">15+ hops: 5</span>
				</div>
			</Card>
		</div>
	{/if}
</main>
