<script lang="ts">
	import { X, HelpCircle, Ban } from 'lucide-svelte';
	import { base } from '$app/paths';
	import { setShowBiographyModal } from '$lib/state/ui.svelte.js';
	import { formatDuration } from '$lib/utils/date-helpers.js';
	import { BLOCKED_CATEGORY_COLORS, BLOCKED_CATEGORY_NAMES } from '$lib/utils/blocked-categories.js';

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

	let showBlockedTooltip = $state(false);
</script>

<header class="sticky top-0 z-30 bg-bg-dark/95 backdrop-blur-sm border-b border-bg-dark-tertiary">
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

		<!-- Right side buttons -->
		<div class="flex items-center gap-1">
			<!-- Blocked categories indicator -->
			{#if blockedCategories.length > 0}
				<div class="relative">
					<button
						onclick={() => showBlockedTooltip = !showBlockedTooltip}
						onblur={() => setTimeout(() => showBlockedTooltip = false, 150)}
						class="p-2 rounded-lg hover:bg-bg-dark-tertiary transition-colors flex items-center gap-1"
						aria-label="Blocked categories"
					>
						<Ban size={16} class="text-error" />
						<span class="text-xs text-error font-medium">{blockedCategories.length}</span>
					</button>

					<!-- Tooltip -->
					{#if showBlockedTooltip}
						<div class="absolute right-0 top-full mt-2 bg-bg-dark-secondary border border-bg-dark-tertiary rounded-lg p-3 shadow-lg min-w-48 z-50">
							<p class="text-xs text-text-dark-muted mb-2">Blocked Categories</p>
							<div class="flex flex-wrap gap-1.5">
								{#each blockedCategories as category}
									<span class="inline-flex items-center gap-1 px-2 py-1 bg-bg-dark-tertiary rounded text-xs">
										<span>{BLOCKED_CATEGORY_COLORS[category] || '🚫'}</span>
										<span>{BLOCKED_CATEGORY_NAMES[category] || category}</span>
									</span>
								{/each}
							</div>
							<p class="text-xs text-text-dark-muted mt-2">Links to these categories are disabled</p>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Help button -->
			<button
				onclick={() => setShowBiographyModal(true)}
				class="p-2 rounded-lg hover:bg-bg-dark-tertiary transition-colors"
				aria-label="About Basil"
			>
				<HelpCircle size={20} class="text-gold" />
			</button>
		</div>
	</div>
</header>
