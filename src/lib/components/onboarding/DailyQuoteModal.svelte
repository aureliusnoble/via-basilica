<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { getUIState, setShowDailyQuoteModal } from '$lib/state/ui.svelte.js';
	import { getQuoteForChallenge } from '$lib/utils/quotes.js';

	interface Props {
		challengeNumber?: number;
	}

	let { challengeNumber = 1 }: Props = $props();

	const ui = getUIState();
	const quote = $derived(getQuoteForChallenge(challengeNumber));

	function close() {
		setShowDailyQuoteModal(false);
	}
</script>

<Modal bind:open={ui.showDailyQuoteModal} onclose={close} size="md">
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
