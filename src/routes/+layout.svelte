<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import '../app.css';
	import BottomNav from '$lib/components/layout/BottomNav.svelte';
	import WelcomeModal from '$lib/components/onboarding/WelcomeModal.svelte';
	import DailyQuoteModal from '$lib/components/onboarding/DailyQuoteModal.svelte';
	import BiographyModal from '$lib/components/onboarding/BiographyModal.svelte';
	import { initUI, getUIState } from '$lib/state/ui.svelte.js';
	import { initAuth } from '$lib/state/auth.svelte.js';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();

	const ui = getUIState();

	onMount(() => {
		if (browser) {
			initUI();
			initAuth();
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

