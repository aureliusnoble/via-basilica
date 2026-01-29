<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'default' | 'gold' | 'success' | 'warning' | 'error';
		size?: 'sm' | 'md';
		class?: string;
		children: Snippet;
	}

	let { variant = 'default', size = 'md', class: className = '', children }: Props = $props();

	const baseClasses = 'inline-flex items-center font-medium rounded-full';

	const variantClasses = {
		default: 'bg-bg-dark-tertiary text-text-dark',
		gold: 'bg-gold/20 text-gold',
		success: 'bg-success/20 text-success',
		warning: 'bg-warning/20 text-warning',
		error: 'bg-error/20 text-error'
	};

	const sizeClasses = {
		sm: 'px-2 py-0.5 text-xs',
		md: 'px-3 py-1 text-sm'
	};
</script>

<span class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {className}">
	{@render children()}
</span>
