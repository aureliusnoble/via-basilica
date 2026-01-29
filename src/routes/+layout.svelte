<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import '../app.css';
	import BottomNav from '$lib/components/layout/BottomNav.svelte';
	import WelcomeModal from '$lib/components/onboarding/WelcomeModal.svelte';
	import DailyQuoteModal from '$lib/components/onboarding/DailyQuoteModal.svelte';
	import BiographyModal from '$lib/components/onboarding/BiographyModal.svelte';
	import { initUI, getUIState } from '$lib/state/ui.svelte.js';
	import { initAuth, getAuthState } from '$lib/state/auth.svelte.js';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();

	const ui = getUIState();
	const auth = getAuthState();

	// Debug state
	let showDebug = $state(false);
	let errors = $state<string[]>([]);
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
		console.log('[Layout] Component mounted, browser:', browser);

		// Check URL for debug flag
		if (browser && window.location.search.includes('debug=true')) {
			showDebug = true;
		}

		if (browser) {
			// Capture global errors
			const errorHandler = (e: ErrorEvent) => {
				errors = [...errors, `Error: ${e.message}`];
			};
			const rejectionHandler = (e: PromiseRejectionEvent) => {
				errors = [...errors, `Promise: ${String(e.reason)}`];
			};
			window.addEventListener('error', errorHandler);
			window.addEventListener('unhandledrejection', rejectionHandler);

			console.log('[Layout] Initializing UI...');
			try {
				initUI();
				console.log('[Layout] UI initialized successfully');
			} catch (error) {
				console.error('[Layout] Error initializing UI:', error);
				errors = [...errors, `UI Init: ${String(error)}`];
			}

			console.log('[Layout] Initializing Auth...');
			initAuth().then(() => {
				console.log('[Layout] Auth initialized successfully');
			}).catch((error) => {
				console.error('[Layout] Error initializing Auth:', error);
				errors = [...errors, `Auth Init: ${String(error)}`];
			});
		}
	});
</script>

<svelte:head>
	<meta name="theme-color" content={ui.darkMode ? '#0F0E0C' : '#FAFAF8'} />
</svelte:head>

<div class="min-h-screen pb-20">
	{@render children()}
</div>

<BottomNav />

<!-- Global Modals -->
<WelcomeModal />
<DailyQuoteModal />
<BiographyModal />

<!-- Toast notifications -->
<Toaster
	position="top-center"
	toastOptions={{
		style: 'background: var(--color-bg-dark-secondary); color: var(--color-text-dark); border: 1px solid var(--color-bg-dark-tertiary);'
	}}
/>

<!-- Debug Panel - Add ?debug=true to URL to show -->
{#if showDebug || errors.length > 0}
	<div class="fixed bottom-24 left-2 right-2 z-[9999] bg-black/90 text-green-400 text-xs p-3 rounded-lg font-mono max-h-48 overflow-auto">
		<div class="flex justify-between items-center mb-2">
			<strong>Debug Panel</strong>
			<button onclick={() => showDebug = false} class="text-red-400">×</button>
		</div>
		<div class="space-y-1">
			<div>Mounted: {mounted}</div>
			<div>WelcomeModal: {ui.showWelcomeModal}</div>
			<div>DailyQuoteModal: {ui.showDailyQuoteModal}</div>
			<div>BiographyModal: {ui.showBiographyModal}</div>
			<div>Auth Loading: {auth.loading}</div>
			<div>Auth Initialized: {auth.initialized}</div>
			<div>Is Authenticated: {auth.isAuthenticated}</div>
			{#if errors.length > 0}
				<div class="text-red-400 mt-2">
					<strong>Errors:</strong>
					{#each errors as error}
						<div class="ml-2">• {error}</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
