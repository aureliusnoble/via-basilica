<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { getUIState, setShowWelcomeModal } from '$lib/state/ui.svelte.js';
	import { getRandomQuote } from '$lib/utils/quotes.js';

	const ui = getUIState();

	let currentPage = $state(0);
	const quote = getRandomQuote();

	function nextPage() {
		console.log('[WelcomeModal] Next button clicked, currentPage:', currentPage);
		if (currentPage < 1) {
			currentPage++;
			console.log('[WelcomeModal] Advanced to page:', currentPage);
		} else {
			console.log('[WelcomeModal] Closing modal');
			setShowWelcomeModal(false);
		}
	}
</script>

<Modal open={ui.showWelcomeModal} closeable={false} size="md">
	<div class="text-center">
		{#if currentPage === 0}
			<!-- Page 1: Welcome -->
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

			<Button onclick={nextPage} class="w-full">
				Next
			</Button>
		{:else}
			<!-- Page 2: Daily Quote -->
			<div class="mb-6">
				<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
					<span class="text-2xl">"</span>
				</div>
			</div>

			<blockquote class="text-lg text-text-dark italic mb-4 max-h-48 overflow-y-auto">
				"{quote}"
			</blockquote>

			<p class="text-gold font-serif mb-8">— Basil the Great</p>

			<Button onclick={nextPage} class="w-full">
				Begin
			</Button>
		{/if}
	</div>
</Modal>
