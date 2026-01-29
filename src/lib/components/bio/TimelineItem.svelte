<script lang="ts">
	interface Props {
		year: string;
		title: string;
		description: string;
		isLast?: boolean;
	}

	let { year, title, description, isLast = false }: Props = $props();
</script>

<div class="timeline-item relative pl-8 pb-8" class:pb-0={isLast}>
	<!-- Timeline connector line -->
	{#if !isLast}
		<div class="absolute left-[7px] top-4 bottom-0 w-0.5 bg-gradient-to-b from-gold to-gold/30"></div>
	{/if}

	<!-- Timeline dot -->
	<div class="absolute left-0 top-1 w-4 h-4 rounded-full bg-bg-dark border-2 border-gold shadow-[0_0_8px_rgba(212,175,55,0.5)]"></div>

	<!-- Content -->
	<div class="space-y-1">
		<span class="text-sm font-medium text-gold">{year}</span>
		<h3 class="text-lg font-serif text-text-dark">{title}</h3>
		<p class="text-text-dark-muted text-sm leading-relaxed">{description}</p>
	</div>
</div>
