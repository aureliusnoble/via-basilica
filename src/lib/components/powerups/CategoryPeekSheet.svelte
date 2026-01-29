<script lang="ts">
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	interface Props {
		open: boolean;
		categories: string[];
		loading: boolean;
		onClose: () => void;
	}

	let { open = $bindable(), categories, loading, onClose }: Props = $props();
</script>

<BottomSheet bind:open onclose={onClose} title="Page Categories" height="auto">
	<div class="space-y-4">
		{#if loading}
			<div class="flex items-center justify-center py-8">
				<Spinner />
			</div>
		{:else if categories.length === 0}
			<p class="text-center text-text-dark-muted py-4">No categories found</p>
		{:else}
			<ul class="space-y-2">
				{#each categories as category}
					<li class="flex items-center gap-2 text-text-dark">
						<span class="text-gold">•</span>
						{category}
					</li>
				{/each}
			</ul>
		{/if}

		<Button onclick={onClose} class="w-full">
			Got it
		</Button>
	</div>
</BottomSheet>
