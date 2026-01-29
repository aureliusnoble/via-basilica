<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		onclose?: () => void;
		title?: string;
		height?: 'auto' | 'half' | 'full';
		children: Snippet;
	}

	let { open = $bindable(), onclose, title, height = 'auto', children }: Props = $props();

	function handleClose() {
		open = false;
		onclose?.();
	}

	const heightClasses = {
		auto: 'max-h-[85vh]',
		half: 'h-[60vh]',
		full: 'h-[95vh]'
	};
</script>

{#if open}
	<div class="fixed inset-0 z-50">
		<!-- Backdrop -->
		<button
			class="modal-backdrop absolute inset-0"
			onclick={handleClose}
			aria-label="Close"
		></button>

		<!-- Sheet -->
		<div
			class="bottom-sheet {heightClasses[height]} {open ? '' : 'closed'}"
			role="dialog"
			aria-modal="true"
		>
			<!-- Handle -->
			<div class="flex justify-center pt-3 pb-2">
				<div class="w-10 h-1 rounded-full bg-bg-dark-tertiary"></div>
			</div>

			{#if title}
				<div class="px-4 pb-3 border-b border-bg-dark-tertiary">
					<h3 class="text-lg font-semibold text-text-dark">{title}</h3>
				</div>
			{/if}

			<div class="flex-1 overflow-y-auto p-4">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
