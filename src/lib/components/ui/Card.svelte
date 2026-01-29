<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'default' | 'elevated' | 'outline';
		padding?: 'none' | 'sm' | 'md' | 'lg';
		class?: string;
		children: Snippet;
	}

	let { variant = 'default', padding = 'md', class: className = '', children }: Props = $props();

	const baseClasses = 'rounded-xl transition-all duration-200';

	const variantClasses = {
		default: 'bg-bg-dark-secondary',
		elevated: 'bg-bg-dark-secondary shadow-lg shadow-black/20',
		outline: 'bg-transparent border border-bg-dark-tertiary'
	};

	const paddingClasses = {
		none: '',
		sm: 'p-3',
		md: 'p-4',
		lg: 'p-6'
	};
</script>

<div class="{baseClasses} {variantClasses[variant]} {paddingClasses[padding]} {className}">
	{@render children()}
</div>
