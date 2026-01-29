<script lang="ts">
	interface Props {
		label: string;
		value: string;
		icon: string;
	}

	let { label, value, icon }: Props = $props();
</script>

<div class="stat-card flex-shrink-0 w-36 bg-bg-dark-secondary rounded-xl p-4 text-center border border-bg-dark-tertiary">
	<div class="text-2xl mb-2 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">{icon}</div>
	<div class="text-gold font-serif text-lg font-medium leading-tight">{value}</div>
	<div class="text-text-dark-muted text-xs mt-1 uppercase tracking-wider">{label}</div>
</div>
