<script lang="ts">
	import { ChevronLeft, HelpCircle } from 'lucide-svelte';
	import { setShowBiographyModal } from '$lib/state/ui.svelte.js';

	interface Props {
		title?: string;
		showBiographyButton?: boolean;
		backHref?: string;
	}

	let { title = 'Via Basilica', showBiographyButton = false, backHref }: Props = $props();
</script>

<header class="sticky top-0 z-30 bg-bg-dark/95 backdrop-blur-sm border-b border-bg-dark-tertiary">
	<div class="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
		<div class="flex items-center gap-3">
			{#if backHref}
				<a
					href={backHref}
					class="p-2 -ml-2 rounded-lg hover:bg-bg-dark-tertiary transition-colors touch-target"
					aria-label="Go back"
				>
					<ChevronLeft size={20} />
				</a>
			{/if}
			<h1 class="text-lg font-semibold text-gold font-serif">{title}</h1>
		</div>

		{#if showBiographyButton}
			<button
				onclick={() => setShowBiographyModal(true)}
				class="p-2 rounded-lg hover:bg-bg-dark-tertiary transition-colors touch-target"
				aria-label="About Basil the Great"
				title="Who was Basil?"
			>
				<HelpCircle size={20} class="text-gold" />
			</button>
		{/if}
	</div>
</header>
