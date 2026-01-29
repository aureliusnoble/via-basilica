<script lang="ts">
	import { Sun, Moon } from 'lucide-svelte';
	import { ui, toggleDarkMode } from '$lib/state/ui.svelte.js';
</script>

<button
	onclick={toggleDarkMode}
	class="p-2 rounded-lg hover:bg-bg-dark-tertiary transition-colors touch-target"
	aria-label={ui.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
>
	{#if ui.darkMode}
		<Sun size={20} class="text-gold" />
	{:else}
		<Moon size={20} />
	{/if}
</button>
