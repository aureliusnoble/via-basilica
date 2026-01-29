<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	interface Props {
		open: boolean;
		title: string;
		extract: string;
		loading: boolean;
		onNavigate: () => void;
		onCancel: () => void;
	}

	let { open = $bindable(), title, extract, loading, onNavigate, onCancel }: Props = $props();

	function handleNavigate() {
		onNavigate();
		open = false;
	}

	function handleCancel() {
		onCancel();
		open = false;
	}
</script>

<Modal bind:open onclose={handleCancel} size="md">
	<div class="space-y-4">
		<h3 class="text-lg font-semibold text-gold">{title.replace(/_/g, ' ')}</h3>

		<div class="border-t border-bg-dark-tertiary pt-4">
			{#if loading}
				<div class="flex items-center justify-center py-8">
					<Spinner />
				</div>
			{:else if extract}
				<p class="text-text-dark leading-relaxed max-h-48 overflow-y-auto">
					{extract}
				</p>
			{:else}
				<p class="text-text-dark-muted italic">No preview available</p>
			{/if}
		</div>

		<div class="flex gap-3 pt-4">
			<Button onclick={handleCancel} variant="ghost" class="flex-1">
				Cancel
			</Button>
			<Button onclick={handleNavigate} class="flex-1">
				Go to page
			</Button>
		</div>
	</div>
</Modal>
