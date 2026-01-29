<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { MapPin, Circle, MoreHorizontal, Ban, Cross } from 'lucide-svelte';
	import type { PathStep } from '$lib/types/database.js';
	import { formatDuration } from '$lib/utils/date-helpers.js';
	import { shareResult } from '$lib/utils/share.js';
	import { getLevelTitle, getXpProgress, LEVEL_TITLES } from '$lib/utils/constants.js';
	import { BLOCKED_CATEGORY_BG_COLORS, BLOCKED_CATEGORY_NAMES } from '$lib/utils/blocked-categories.js';
	import { toast } from 'svelte-sonner';

	interface Props {
		open: boolean;
		hops: number;
		path: PathStep[];
		duration: number;
		challengeNumber: number;
		startArticle: string;
		challengeDate: string | Date;
		mode?: 'daily' | 'random' | 'archive';
		blockedCategories?: string[];
		pointsAwarded?: number;
		xpEarned?: number;
		previousXp?: number;
		rank?: number | null;
		userLevel?: number;
		userTotalXp?: number;
		onClose: () => void;
	}

	let {
		open = $bindable(),
		hops,
		path,
		duration,
		challengeNumber,
		startArticle,
		challengeDate,
		mode = 'daily',
		blockedCategories = [],
		pointsAwarded = 0,
		xpEarned = 0,
		previousXp = 0,
		rank = null,
		userLevel,
		userTotalXp,
		onClose
	}: Props = $props();

	const nextRankTitle = $derived.by(() => {
		if (!userLevel) return null;
		const thresholds = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => a - b);
		for (const threshold of thresholds) {
			if (threshold > userLevel) return LEVEL_TITLES[threshold];
		}
		return 'Bishop'; // Max rank
	});

	function formatRank(n: number): string {
		const suffixes = ['th', 'st', 'nd', 'rd'];
		const v = n % 100;
		return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
	}

	let sharing = $state(false);

	type DisplayStep =
		| { type: 'start' | 'step' | 'target'; article_title: string }
		| { type: 'collapsed'; count: number };

	let displaySteps: DisplayStep[] = $derived.by(() => {
		if (path.length <= 5) {
			return path.map((step, i) => ({
				type: i === 0 ? 'start' : i === path.length - 1 ? 'target' : 'step',
				article_title: step.article_title
			})) as DisplayStep[];
		}

		return [
			{ type: 'start', article_title: path[0].article_title },
			{ type: 'step', article_title: path[1].article_title },
			{ type: 'collapsed', count: path.length - 4 },
			{ type: 'step', article_title: path[path.length - 2].article_title },
			{ type: 'target', article_title: path[path.length - 1].article_title }
		] as DisplayStep[];
	});

	async function handleShare() {
		sharing = true;
		try {
			const success = await shareResult(
				challengeNumber,
				hops,
				duration,
				startArticle,
				path,
				challengeDate,
				mode,
				blockedCategories
			);
			if (success) {
				toast.success('Copied to clipboard!');
			}
		} catch {
			toast.error('Failed to share');
		} finally {
			sharing = false;
		}
	}

	function handleClose() {
		open = false;
		onClose();
	}
</script>

<Modal bind:open closeable={true} onclose={handleClose} size="md">
	<div class="text-center">
		<!-- Victory animation -->
		<div class="mb-6">
			<div class="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center animate-bounce">
				<Cross size={48} class="text-bg-dark" />
			</div>
			<h2 class="text-2xl font-serif text-gold">Victory!</h2>
			<p class="text-text-dark-muted">You reached Basil the Great</p>
		</div>

		<!-- Stats -->
		<div class="grid grid-cols-2 gap-4 mb-6">
			<div class="bg-bg-dark-tertiary rounded-lg p-4">
				<p class="text-3xl font-bold text-gold">{hops}</p>
				<p class="text-sm text-text-dark-muted">Hops</p>
			</div>
			<div class="bg-bg-dark-tertiary rounded-lg p-4">
				<p class="text-3xl font-bold">{formatDuration(duration)}</p>
				<p class="text-sm text-text-dark-muted">Time</p>
			</div>
		</div>

		<!-- Blocked categories (if any) -->
		{#if blockedCategories.length > 0}
			<div class="mb-6">
				<div class="flex items-center justify-center gap-2 text-sm text-text-dark-muted mb-2">
					<Ban size={14} class="text-error" />
					<span>Blocked Categories</span>
				</div>
				<div class="flex flex-wrap justify-center gap-1.5">
					{#each blockedCategories as category}
						<span
							class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border {BLOCKED_CATEGORY_BG_COLORS[category] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}"
						>
							{BLOCKED_CATEGORY_NAMES[category] || category}
						</span>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Rewards -->
		{#if pointsAwarded > 0 || xpEarned > 0}
			<div class="flex justify-center gap-4 mb-6">
				{#if pointsAwarded > 0}
					<Badge variant="gold" size="md">+{pointsAwarded} pts</Badge>
				{/if}
				{#if xpEarned > 0}
					<Badge variant="success" size="md">+{xpEarned} XP</Badge>
				{/if}
			</div>
		{/if}

		<!-- Journey visualization -->
		<div class="mb-6">
			{#if rank}
				<p class="text-lg font-serif text-gold mb-1">{formatRank(rank)} Place</p>
			{/if}
			<p class="text-sm text-text-dark-muted mb-4">Your Journey</p>
			<div class="flex flex-col items-start text-left max-w-xs mx-auto">
				{#each displaySteps as step, index}
					<div class="flex items-center gap-3 w-full">
						<!-- Icon -->
						{#if step.type === 'start'}
							<div class="flex-shrink-0 w-6 h-6 flex items-center justify-center text-success">
								<MapPin size={20} />
							</div>
						{:else if step.type === 'collapsed'}
							<div class="flex-shrink-0 w-6 h-6 flex items-center justify-center text-text-dark-muted">
								<MoreHorizontal size={16} />
							</div>
						{:else if step.type === 'target'}
							<div class="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gold">
								<Cross size={16} />
							</div>
						{:else}
							<div class="flex-shrink-0 w-6 h-6 flex items-center justify-center text-text-dark-muted">
								<Circle size={10} fill="currentColor" />
							</div>
						{/if}

						<!-- Article name or collapsed text -->
						{#if step.type === 'collapsed'}
							<span class="text-sm text-text-dark-muted italic">{step.count} more steps</span>
						{:else}
							<span
								class="text-sm truncate
									{step.type === 'start' ? 'text-success font-medium' : ''}
									{step.type === 'target' ? 'text-gold font-medium' : ''}
									{step.type === 'step' ? 'text-text-dark' : ''}"
							>
								{step.article_title.replace(/_/g, ' ')}
							</span>
						{/if}
					</div>

					<!-- Connector line (not after last item) -->
					{#if index < displaySteps.length - 1}
						<div class="ml-[11px] h-4 border-l-2 border-dashed border-bg-dark-tertiary"></div>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Rank Progress Bar -->
		{#if userLevel && userTotalXp !== undefined}
			{@const currentTitle = getLevelTitle(userLevel)}
			{@const progress = getXpProgress(userTotalXp)}
			{@const previousProgress = getXpProgress(previousXp)}
			<div class="mb-6">
				<div class="flex justify-between text-sm mb-2">
					<span class="text-gold font-medium">{currentTitle}</span>
					<span class="text-text-dark-muted">{nextRankTitle}</span>
				</div>
				<div class="h-2 bg-bg-dark-tertiary rounded-full overflow-hidden">
					{#key open}
						<div
							class="h-full bg-gradient-to-r from-gold to-gold-dark animate-progress-fill"
							style="--start-width: {previousProgress.percentage}%; --target-width: {progress.percentage}%"
						></div>
					{/key}
				</div>
				<p class="text-xs text-text-dark-muted mt-1">
					{progress.current} / {progress.required} XP to next rank
				</p>
			</div>
		{:else}
			<!-- Fallback for anonymous users -->
			<div class="mb-6">
				<p class="text-xs text-text-dark-muted">Sign in to track your rank progress</p>
			</div>
		{/if}

		<!-- Actions -->
		<div class="space-y-3">
			<Button onclick={handleShare} loading={sharing} class="w-full">
				Share Result
			</Button>
			<Button href="/leaderboard" variant="secondary" class="w-full">
				View Leaderboard
			</Button>
			<Button onclick={handleClose} variant="ghost" class="w-full">
				Close
			</Button>
		</div>
	</div>
</Modal>

<style>
	@keyframes progress-fill {
		from {
			width: var(--start-width, 0%);
		}
		to {
			width: var(--target-width, 100%);
		}
	}

	:global(.animate-progress-fill) {
		animation: progress-fill 1s ease-out 0.5s forwards;
		width: var(--start-width, 0%);
	}
</style>
