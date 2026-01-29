<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		icon: Snippet;
		children: Snippet;
	}

	let { title, icon, children }: Props = $props();
</script>

<div class="section-card bg-bg-dark-secondary rounded-xl p-5 border border-bg-dark-tertiary hover:border-gold/30 transition-colors">
	<div class="flex items-start gap-4">
		<div class="text-gold flex-shrink-0">
			{@render icon()}
		</div>
		<div class="flex-1 min-w-0">
			<h3 class="text-lg font-serif text-gold mb-2">{title}</h3>
			<div class="text-text-dark-muted text-sm leading-relaxed">
				{@render children()}
			</div>
		</div>
	</div>
</div>
