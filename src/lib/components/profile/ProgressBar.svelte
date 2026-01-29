<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import { getXpProgress, getLevelTitle } from '$lib/utils/constants.js';

	interface Props {
		level: number;
		totalXp: number;
		variant?: 'compact' | 'full';
	}

	let { level, totalXp, variant = 'full' }: Props = $props();

	const progress = $derived(getXpProgress(totalXp));
	const levelTitle = $derived(getLevelTitle(level));
</script>

{#if variant === 'full'}
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<Badge variant="gold">Level {level} {levelTitle}</Badge>
			<span class="text-sm text-text-dark-muted">
				{progress.current} / {progress.required} XP
			</span>
		</div>
		<div class="progress-bar">
			<div class="progress-bar-fill" style="width: {progress.percentage}%"></div>
		</div>
	</div>
{:else}
	<div class="flex items-center gap-3">
		<Badge variant="gold" size="sm">Lvl {level}</Badge>
		<div class="flex-1 progress-bar h-2">
			<div class="progress-bar-fill" style="width: {progress.percentage}%"></div>
		</div>
		<span class="text-xs text-text-dark-muted">{progress.percentage}%</span>
	</div>
{/if}
