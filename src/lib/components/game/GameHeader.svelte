<script lang="ts">
	import { X, HelpCircle } from 'lucide-svelte';
	import { base } from '$app/paths';
	import { setShowBiographyModal } from '$lib/state/ui.svelte.js';
	import { formatDuration } from '$lib/utils/date-helpers.js';

	interface Props {
		hops: number;
		elapsedSeconds: number;
		backHref?: string;
	}

	let {
		hops,
		elapsedSeconds,
		backHref = '/'
	}: Props = $props();
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

		<!-- Help button -->
		<div class="flex items-center gap-1">
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
