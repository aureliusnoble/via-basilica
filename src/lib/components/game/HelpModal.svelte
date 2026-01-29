<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { Target, MousePointerClick, Ban, Trophy, Cross } from 'lucide-svelte';
	import { getUIState, setShowHelpModal } from '$lib/state/ui.svelte.js';

	const ui = getUIState();
</script>

<Modal open={ui.showHelpModal} closeable={true} onclose={() => setShowHelpModal(false)} size="md">
	<div class="text-center">
		<div class="mb-6">
			<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
				<Cross size={32} class="text-gold" />
			</div>
			<h2 class="text-xl font-serif text-gold mb-2">How to Play</h2>
		</div>

		<div class="space-y-4 text-left mb-6">
			<div class="flex gap-3">
				<div class="flex-shrink-0 w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
					<Target size={16} class="text-success" />
				</div>
				<div>
					<p class="font-medium text-text-dark">Goal</p>
					<p class="text-sm text-text-dark-muted">Navigate from the starting Wikipedia article to <span class="text-gold">Basil the Great</span></p>
				</div>
			</div>

			<div class="flex gap-3">
				<div class="flex-shrink-0 w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
					<MousePointerClick size={16} class="text-gold" />
				</div>
				<div>
					<p class="font-medium text-text-dark">How to Navigate</p>
					<p class="text-sm text-text-dark-muted">Click on any <span class="text-gold underline">gold link</span> to move to that article. Each click counts as one hop.</p>
				</div>
			</div>

			<div class="flex gap-3">
				<div class="flex-shrink-0 w-8 h-8 rounded-full bg-error/20 flex items-center justify-center">
					<Ban size={16} class="text-error" />
				</div>
				<div>
					<p class="font-medium text-text-dark">Blocked Categories</p>
					<p class="text-sm text-text-dark-muted">Some Wikipedia categories are blocked each day. Links to blocked articles appear <span class="text-error font-bold line-through">red and crossed out</span> and cannot be clicked.</p>
				</div>
			</div>

			<div class="flex gap-3">
				<div class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
					<Trophy size={16} class="text-purple-400" />
				</div>
				<div>
					<p class="font-medium text-text-dark">Scoring</p>
					<p class="text-sm text-text-dark-muted">Fewer hops = better score. Complete the daily challenge to earn XP and compete on the leaderboard.</p>
				</div>
			</div>
		</div>

		<Button onclick={() => setShowHelpModal(false)} class="w-full">
			Got it!
		</Button>
	</div>
</Modal>
