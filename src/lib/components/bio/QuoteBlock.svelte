<script lang="ts">
	interface Props {
		quote: string;
		attribution: string;
		context?: string;
	}

	let { quote, attribution, context }: Props = $props();
</script>

<div class="quote-block relative py-12 px-6 bg-gradient-to-br from-crimson/20 via-crimson/10 to-transparent rounded-2xl overflow-hidden">
	<!-- Decorative quotation mark -->
	<div class="absolute top-4 left-4 text-6xl font-serif text-gold/30 leading-none select-none">"</div>

	<!-- Quote content -->
	<blockquote class="relative z-10 text-center">
		<p class="text-xl md:text-2xl font-serif text-text-dark italic leading-relaxed mb-4">
			"{quote}"
		</p>
		<footer class="text-gold font-medium">
			— {attribution}
		</footer>
		{#if context}
			<p class="text-text-dark-muted text-sm mt-2">{context}</p>
		{/if}
	</blockquote>

	<!-- Decorative closing quotation mark -->
	<div class="absolute bottom-4 right-4 text-6xl font-serif text-gold/30 leading-none select-none rotate-180">"</div>
</div>
