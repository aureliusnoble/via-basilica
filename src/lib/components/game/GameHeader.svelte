<script lang="ts">
	import { X, HelpCircle } from 'lucide-svelte';
	import { base } from '$app/paths';
	import { setShowHelpModal } from '$lib/state/ui.svelte.js';
	import { formatDuration } from '$lib/utils/date-helpers.js';
	import { BLOCKED_CATEGORY_BG_COLORS, BLOCKED_CATEGORY_NAMES } from '$lib/utils/blocked-categories.js';

	interface Props {
		hops: number;
		elapsedSeconds: number;
		blockedCategories?: string[];
		backHref?: string;
	}

	let {
		hops,
		elapsedSeconds,
		blockedCategories = [],
		backHref = '/'
	}: Props = $props();
</script>

<header class="bg-bg-dark/95 backdrop-blur-sm border-b border-bg-dark-tertiary">
	<div class="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
		<!-- Back button -->
		<a
			href="{base}{backHref}"
			class="p-2 -ml-2 rounded-lg hover:bg-bg-dark-tertiary transition-colors touch-target"
			aria-label="Exit game"
		>
			<X size={20} />
		</a>

		<!-- Stats -->
		<div class="flex items-center gap-4">
			<div class="text-center">
				<p class="text-2xl font-bold text-gold">{hops}</p>
				<p class="text-xs text-text-dark-muted">hops</p>
			</div>
			<div class="text-center">
				<p class="text-lg font-medium text-text-dark">{formatDuration(elapsedSeconds)}</p>
				<p class="text-xs text-text-dark-muted">time</p>
			</div>
		</div>

		<!-- Help button -->
		<button
			onclick={() => setShowHelpModal(true)}
			class="p-2 rounded-lg hover:bg-bg-dark-tertiary transition-colors"
			aria-label="Game help"
		>
			<HelpCircle size={20} class="text-gold" />
		</button>
	</div>

	<!-- Blocked categories bar -->
	{#if blockedCategories.length > 0}
		<div class="px-4 pb-2 max-w-lg mx-auto">
			<div class="flex items-center gap-2 flex-wrap">
				<span class="text-xs text-text-dark-muted">Blocked:</span>
				{#each blockedCategories as category}
					<span
						class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border {BLOCKED_CATEGORY_BG_COLORS[category] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}"
					>
						{BLOCKED_CATEGORY_NAMES[category] || category}
					</span>
				{/each}
			</div>
		</div>
	{/if}
</header>
