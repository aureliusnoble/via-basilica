<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		icon: string;
		children: Snippet;
	}

	let { title, icon, children }: Props = $props();
</script>

<div class="section-card bg-bg-dark-secondary rounded-xl p-5 border border-bg-dark-tertiary hover:border-gold/30 transition-colors">
	<div class="flex items-start gap-4">
		<div class="text-3xl drop-shadow-[0_0_10px_rgba(212,175,55,0.5)] flex-shrink-0">{icon}</div>
		<div class="flex-1 min-w-0">
			<h3 class="text-lg font-serif text-gold mb-2">{title}</h3>
			<div class="text-text-dark-muted text-sm leading-relaxed">
				{@render children()}
			</div>
		</div>
	</div>
</div>
