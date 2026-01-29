<script lang="ts">
	import { Footprints, ChevronRight } from 'lucide-svelte';
	import type { PathStep } from '$lib/types/database.js';
	import { BLOCKED_CATEGORY_BG_COLORS } from '$lib/utils/blocked-categories.js';

	interface Props {
		path: PathStep[];
		currentArticle: string;
		currentCategory?: string | null;
	}

	let { path, currentArticle, currentCategory = null }: Props = $props();

	// Only show the 3 most recent steps
	let displayPath = $derived(path.slice(-3));
	let hasHiddenSteps = $derived(path.length > 3);

	function truncateTitle(title: string, maxLength: number = 20): string {
		const display = title.replace(/_/g, ' ');
		if (display.length <= maxLength) return display;
		return display.slice(0, maxLength - 3) + '...';
	}
</script>

<div class="bg-bg-dark-secondary border-b border-bg-dark-tertiary">
	<div class="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto">
		{#if hasHiddenSteps}
			<div class="flex-shrink-0 px-2 py-1 text-sm text-text-dark-muted" title="Earlier steps hidden">
				...
			</div>
			<ChevronRight size={16} class="text-text-dark-muted flex-shrink-0" />
		{/if}

		{#each displayPath as step, index}
			{@const isStart = index === 0 && !hasHiddenSteps}
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

		<!-- Category badge for current article -->
		{#if currentCategory}
			<div class="flex-shrink-0 ml-auto pl-2">
				<span class="text-xs px-2 py-1 rounded-full border whitespace-nowrap {BLOCKED_CATEGORY_BG_COLORS[currentCategory] || 'bg-bg-dark-tertiary text-text-dark-muted'}">
					{currentCategory}
				</span>
			</div>
		{/if}
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
