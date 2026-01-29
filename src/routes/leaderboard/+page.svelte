<script lang="ts">
	import { onMount } from 'svelte';
	import { Medal, TrendingUp, TrendingDown, Minus } from 'lucide-svelte';
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

	let activeTab = $state<LeaderboardType>('daily');
	let entries = $state<LeaderboardEntry[]>([]);
	let loading = $state(true);

	const currentMonth = format(new Date(), 'MMMM yyyy');

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
				{#each entries as entry, index}
					{@const rank = index + 1}
					<Card padding="sm">
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
									<p class="font-medium truncate">
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
				{/each}
			</div>
		{/if}
	</div>

	<!-- Scoring explanation -->
	{#if activeTab !== 'daily'}
		<div class="px-4 pb-4">
			<Card padding="sm" variant="outline">
				<p class="text-xs text-text-dark-muted text-center mb-2">
					Daily points by percentile rank:
				</p>
				<div class="grid grid-cols-4 gap-1 text-xs text-center">
					<span class="text-gold">1%: 30</span>
					<span class="text-gold">2%: 27</span>
					<span class="text-gold">5%: 24</span>
					<span>10%: 20</span>
					<span>20%: 16</span>
					<span>30%: 13</span>
					<span>40%: 10</span>
					<span>50%: 8</span>
					<span class="text-text-dark-muted">60%: 6</span>
					<span class="text-text-dark-muted">70%: 5</span>
					<span class="text-text-dark-muted">80%: 4</span>
					<span class="text-text-dark-muted">90%+: 2-3</span>
				</div>
			</Card>
		</div>
	{/if}
</main>
