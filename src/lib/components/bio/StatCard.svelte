<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		value: string;
		icon: Snippet;
	}

	let { label, value, icon }: Props = $props();
</script>

<div class="stat-card flex-shrink-0 w-36 bg-bg-dark-secondary rounded-xl p-4 text-center border border-bg-dark-tertiary">
	<div class="text-gold mb-2 flex justify-center">
		{@render icon()}
	</div>
	<div class="text-gold font-serif text-lg font-medium leading-tight">{value}</div>
	<div class="text-text-dark-muted text-xs mt-1 uppercase tracking-wider">{label}</div>
</div>
