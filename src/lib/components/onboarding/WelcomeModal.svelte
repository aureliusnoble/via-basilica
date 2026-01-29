<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { getUIState, setShowWelcomeModal } from '$lib/state/ui.svelte.js';

	const ui = getUIState();
</script>

<Modal open={ui.showWelcomeModal} closeable={false} size="md">
	<div class="text-center">
		<div class="mb-6">
			<div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
				<span class="text-4xl">&#x2628;</span>
			</div>
			<h2 class="text-2xl font-serif text-gold mb-2">Welcome to Via Basilica</h2>
		</div>

		<div class="space-y-4 text-text-dark-muted mb-8">
			<p>Navigate Wikipedia to reach <span class="text-gold font-medium">Basil the Great</span></p>
			<p>Every day, a new starting article. One attempt only.</p>
			<p class="text-gold">Fewest clicks wins.</p>
		</div>

		<Button onclick={() => setShowWelcomeModal(false)} class="w-full">
			Begin
		</Button>
	</div>
</Modal>
