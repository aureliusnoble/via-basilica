<script lang="ts">
	import { Link, X } from 'lucide-svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	interface Props {
		open: boolean;
		backlinks: string[];
		loading: boolean;
		onSelect: (title: string) => void;
		onClose: () => void;
	}

	let { open, backlinks, loading, onSelect, onClose }: Props = $props();
</script>

{#if open}
	<div class="sticky top-14 z-20 bg-bg-dark-secondary border-b border-bg-dark-tertiary">
		<div class="max-w-lg mx-auto px-4 py-3">
			<div class="flex items-center justify-between mb-2">
				<div class="flex items-center gap-2">
					<Link size={16} class="text-gold" />
					<span class="text-sm font-medium">Pages linking here:</span>
				</div>
				<button
					onclick={onClose}
					class="p-1 rounded hover:bg-bg-dark-tertiary transition-colors"
					aria-label="Close"
				>
					<X size={16} />
				</button>
			</div>

			{#if loading}
				<div class="flex items-center justify-center py-2">
					<Spinner size="sm" />
				</div>
			{:else if backlinks.length === 0}
				<p class="text-sm text-text-dark-muted">No backlinks found</p>
			{:else}
				<div class="flex flex-wrap gap-2">
					{#each backlinks as link}
						<button
							onclick={() => onSelect(link)}
							class="px-3 py-1 text-sm bg-bg-dark-tertiary rounded-full text-gold hover:bg-gold/20 transition-colors"
						>
							{link.replace(/_/g, ' ')}
						</button>
					{/each}
				</div>
				<p class="text-xs text-text-dark-muted mt-2">Tap to navigate (counts as hop)</p>
			{/if}
		</div>
	</div>
{/if}
