<script lang="ts">
	import { Star } from 'lucide-svelte';
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { TARGET_ARTICLE } from '$lib/api/wikipedia.js';

	interface Props {
		open: boolean;
		targetTitle: string;
		outgoingLinks: string[];
		loading: boolean;
		onNavigate: () => void;
		onBack: () => void;
	}

	let { open = $bindable(), targetTitle, outgoingLinks, loading, onNavigate, onBack }: Props = $props();

	const hasTarget = $derived(
		outgoingLinks.some(
			(link) => link.replace(/ /g, '_') === TARGET_ARTICLE || link === 'Basil the Great'
		)
	);

	function handleNavigate() {
		onNavigate();
		open = false;
	}

	function handleBack() {
		onBack();
		open = false;
	}
</script>

<BottomSheet bind:open onclose={handleBack} title="Scout Preview" height="half">
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<span class="text-gold font-medium">{targetTitle.replace(/_/g, ' ')}</span>
			<span class="text-text-dark-muted">has these links:</span>
		</div>

		{#if loading}
			<div class="flex items-center justify-center py-8">
				<Spinner />
			</div>
		{:else if outgoingLinks.length === 0}
			<p class="text-center text-text-dark-muted py-4">No outgoing links found</p>
		{:else}
			{#if hasTarget}
				<div class="bg-success/20 text-success px-3 py-2 rounded-lg text-sm flex items-center gap-2">
					<Star size={16} class="fill-current" />
					<span>Basil of Caesarea is linked from this page!</span>
				</div>
			{/if}

			<div class="max-h-48 overflow-y-auto space-y-1">
				{#each outgoingLinks.slice(0, 30) as link}
					{@const isTarget = link.replace(/ /g, '_') === TARGET_ARTICLE || link === 'Basil the Great'}
					<div
						class="px-3 py-1.5 rounded text-sm flex items-center gap-2
							{isTarget ? 'bg-gold/20 text-gold font-medium' : 'text-text-dark'}"
					>
						{#if isTarget}
							<Star size={14} class="fill-current" />
						{:else}
							<span class="text-text-dark-muted">•</span>
						{/if}
						{link}
					</div>
				{/each}

				{#if outgoingLinks.length > 30}
					<p class="text-center text-text-dark-muted py-2 text-sm">
						+ {outgoingLinks.length - 30} more links
					</p>
				{/if}
			</div>
		{/if}

		<div class="flex gap-3 pt-2">
			<Button onclick={handleBack} variant="ghost" class="flex-1">
				Back
			</Button>
			<Button onclick={handleNavigate} class="flex-1">
				Go to page
			</Button>
		</div>
	</div>
</BottomSheet>
