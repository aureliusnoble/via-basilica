<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { getUIState, setShowDailyQuoteModal } from '$lib/state/ui.svelte.js';
	import { getDailyQuote } from '$lib/utils/quotes.js';

	const ui = getUIState();
	const quote = getDailyQuote();

	function close() {
		console.log('[DailyQuoteModal] Close button clicked');
		setShowDailyQuoteModal(false);
	}
</script>

<Modal open={ui.showDailyQuoteModal} onclose={close} size="md">
	<div class="text-center">
		<div class="mb-6">
			<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
				<span class="text-2xl">"</span>
			</div>
			<p class="text-sm text-text-dark-muted">Today's Wisdom</p>
		</div>

		<blockquote class="text-lg text-text-dark italic mb-4 max-h-48 overflow-y-auto">
			"{quote}"
		</blockquote>

		<p class="text-gold font-serif mb-8">— Basil the Great</p>

		<Button onclick={close} class="w-full">
			Continue
		</Button>
	</div>
</Modal>
