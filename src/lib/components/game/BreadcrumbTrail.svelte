<script lang="ts">
	import { Footprints, ChevronRight } from 'lucide-svelte';
	import type { PathStep } from '$lib/types/database.js';

	interface Props {
		path: PathStep[];
		currentArticle: string;
	}

	let { path, currentArticle }: Props = $props();

	function truncateTitle(title: string, maxLength: number = 20): string {
		const display = title.replace(/_/g, ' ');
		if (display.length <= maxLength) return display;
		return display.slice(0, maxLength - 3) + '...';
	}
</script>

<div class="bg-bg-dark-secondary border-b border-bg-dark-tertiary">
	<div class="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide max-w-lg mx-auto">
		{#each path as step, index}
			{@const isStart = index === 0}
			{@const isCurrent = step.article_title === currentArticle}
			{@const isUndone = step.is_undone}

			{#if index > 0}
				<ChevronRight size={16} class="text-text-dark-muted flex-shrink-0" />
			{/if}

			<div
				class="flex-shrink-0 px-2 py-1 rounded text-sm whitespace-nowrap flex items-center gap-1
					{isStart ? 'bg-success/20 text-success ring-1 ring-success/30' : ''}
					{isCurrent && !isStart ? 'bg-gold/20 text-gold ring-1 ring-gold/30' : ''}
					{!isStart && !isCurrent ? 'text-text-dark-muted' : ''}
					{isUndone ? 'line-through opacity-50' : ''}
					{step.is_free_step ? 'italic' : ''}"
				title={step.article_title.replace(/_/g, ' ')}
			>
				{truncateTitle(step.article_title)}
				{#if step.is_free_step && !isStart}
					<Footprints size={12} />
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
