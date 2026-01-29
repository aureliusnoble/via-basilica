<script lang="ts">
	import { X } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		onclose?: () => void;
		title?: string;
		size?: 'sm' | 'md' | 'lg' | 'full';
		closeable?: boolean;
		children: Snippet;
	}

	let {
		open = $bindable(),
		onclose,
		title,
		size = 'md',
		closeable = true,
		children
	}: Props = $props();

	// Debug: log when modal state changes
	$effect(() => {
		console.log('[Modal] State changed - open:', open, 'title:', title || '(no title)');
	});

	function handleClose() {
		console.log('[Modal] handleClose called, closeable:', closeable);
		if (closeable) {
			open = false;
			onclose?.();
			console.log('[Modal] Modal closed');
		} else {
			console.log('[Modal] Modal not closeable, ignoring');
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open && closeable) {
			handleClose();
		}
	}

	const sizeClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		full: 'max-w-full mx-4'
	};
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<!-- Backdrop -->
		<button
			class="modal-backdrop absolute inset-0"
			onclick={handleClose}
			aria-label="Close modal"
		></button>

		<!-- Modal content -->
		<div
			class="relative z-50 w-full {sizeClasses[size]} bg-bg-dark-secondary rounded-2xl shadow-2xl overflow-hidden"
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? 'modal-title' : undefined}
		>
			{#if title || closeable}
				<div class="flex items-center justify-between p-4 border-b border-bg-dark-tertiary">
					{#if title}
						<h2 id="modal-title" class="text-lg font-semibold text-text-dark">{title}</h2>
					{:else}
						<div></div>
					{/if}
					{#if closeable}
						<button
							onclick={handleClose}
							class="p-2 rounded-lg hover:bg-bg-dark-tertiary transition-colors touch-target"
							aria-label="Close"
						>
							<X size={20} />
						</button>
					{/if}
				</div>
			{/if}

			<div class="p-4 max-h-[80vh] overflow-y-auto">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
