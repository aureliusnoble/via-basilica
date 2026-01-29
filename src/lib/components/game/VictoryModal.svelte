<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import type { PathStep } from '$lib/types/database.js';
	import { formatDuration } from '$lib/utils/date-helpers.js';
	import { shareResult } from '$lib/utils/share.js';
	import { toast } from 'svelte-sonner';

	interface Props {
		open: boolean;
		hops: number;
		path: PathStep[];
		duration: number;
		challengeNumber: number;
		startArticle: string;
		pointsAwarded?: number;
		xpEarned?: number;
		onClose: () => void;
	}

	let {
		open = $bindable(),
		hops,
		path,
		duration,
		challengeNumber,
		startArticle,
		pointsAwarded = 0,
		xpEarned = 0,
		onClose
	}: Props = $props();

	let sharing = $state(false);

	async function handleShare() {
		sharing = true;
		try {
			const success = await shareResult(challengeNumber, hops, duration, startArticle, path);
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
				<span class="text-5xl">&#x2628;</span>
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

		<!-- Path preview -->
		<div class="mb-6">
			<p class="text-sm text-text-dark-muted mb-2">Your Path</p>
			<div class="flex flex-wrap justify-center gap-1">
				{#each path as step, index}
					{@const isStart = index === 0}
					{@const isEnd = index === path.length - 1}
					<div
						class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
							{isStart ? 'bg-success/20 text-success ring-2 ring-success' : ''}
							{isEnd ? 'bg-gold ring-2 ring-gold text-bg-dark' : ''}
							{!isStart && !isEnd ? 'bg-bg-dark-tertiary' : ''}"
						title={step.article_title.replace(/_/g, ' ')}
					>
						{step.article_title.charAt(0).toUpperCase()}
					</div>
				{/each}
			</div>
		</div>

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
