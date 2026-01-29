<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { Ban } from 'lucide-svelte';
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

		<div class="space-y-4 text-text-dark-muted mb-6">
			<p>Navigate Wikipedia to reach <span class="text-gold font-medium">Basil the Great</span></p>
			<p>Every day, a new starting article. One attempt only.</p>
			<p class="text-gold">Fewest clicks wins.</p>
		</div>

		<!-- Blocked categories explanation -->
		<div class="bg-bg-dark-tertiary rounded-lg p-4 mb-6 text-left">
			<div class="flex items-center gap-2 mb-2">
				<Ban size={16} class="text-error" />
				<span class="text-sm font-medium">Daily Challenge</span>
			</div>
			<p class="text-sm text-text-dark-muted">
				Each day, 1-3 Wikipedia categories are <span class="text-error">blocked</span>.
				Links to articles in blocked categories will be disabled and shown with a strikethrough.
			</p>
		</div>

		<Button onclick={() => setShowWelcomeModal(false)} class="w-full">
			Begin
		</Button>
	</div>
</Modal>
