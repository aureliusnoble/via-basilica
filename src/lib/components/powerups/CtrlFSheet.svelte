<script lang="ts">
	import { Search } from 'lucide-svelte';
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		open: boolean;
		links: { title: string; element: HTMLElement }[];
		onSelect: (title: string) => void;
		onClose: () => void;
	}

	let { open = $bindable(), links, onSelect, onClose }: Props = $props();

	let searchQuery = $state('');
	let inputRef = $state<HTMLInputElement | null>(null);

	const filteredLinks = $derived(
		searchQuery.trim()
			? links.filter((link) =>
					link.title.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: links
	);

	$effect(() => {
		if (open && inputRef) {
			inputRef.focus();
		}
	});

	function handleSelect(title: string) {
		onSelect(title);
		open = false;
	}

	function handleClose() {
		searchQuery = '';
		onClose();
	}
</script>

<BottomSheet bind:open onclose={handleClose} title="Search Links" height="half">
	<div class="space-y-4">
		<div class="relative">
			<span class="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark-muted">
				<Search size={18} />
			</span>
			<input
				bind:this={inputRef}
				bind:value={searchQuery}
				type="text"
				placeholder="Type to search links..."
				class="w-full pl-10 pr-4 py-3 bg-bg-dark-tertiary rounded-lg border border-bg-dark-tertiary focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
			/>
		</div>

		<div class="text-sm text-text-dark-muted">
			Matching links ({filteredLinks.length}):
		</div>

		<div class="max-h-60 overflow-y-auto space-y-1">
			{#each filteredLinks.slice(0, 50) as link}
				<button
					onclick={() => handleSelect(link.title)}
					class="w-full text-left px-3 py-2 rounded-lg hover:bg-bg-dark-tertiary transition-colors text-gold"
				>
					{link.title.replace(/_/g, ' ')}
				</button>
			{/each}

			{#if filteredLinks.length === 0}
				<p class="text-center text-text-dark-muted py-4">No matching links found</p>
			{/if}

			{#if filteredLinks.length > 50}
				<p class="text-center text-text-dark-muted py-2 text-sm">
					Showing first 50 of {filteredLinks.length} results
				</p>
			{/if}
		</div>

		<Button onclick={handleClose} variant="ghost" class="w-full">
			Cancel
		</Button>
	</div>
</BottomSheet>
