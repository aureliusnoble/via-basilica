<script lang="ts">
	import type { Snippet } from 'svelte';
	import { base } from '$app/paths';

	interface Props {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		loading?: boolean;
		type?: 'button' | 'submit' | 'reset';
		href?: string;
		class?: string;
		onclick?: () => void;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		type = 'button',
		href,
		class: className = '',
		onclick,
		children
	}: Props = $props();

	// Prepend base path to internal links
	const resolvedHref = $derived(
		href && href.startsWith('/') ? `${base}${href}` : href
	);

	const baseClasses =
		'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-50 disabled:cursor-not-allowed touch-target';

	const variantClasses = {
		primary: 'bg-gold text-bg-dark hover:bg-gold-light active:bg-gold-dark',
		secondary:
			'bg-bg-dark-tertiary text-text-dark border border-bg-dark-tertiary hover:border-gold/50',
		ghost: 'text-text-dark hover:bg-bg-dark-tertiary',
		danger: 'bg-crimson text-white hover:bg-crimson-light active:bg-crimson-dark'
	};

	const sizeClasses = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-base',
		lg: 'px-6 py-3 text-lg'
	};

	const combinedClasses = $derived(`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`);
</script>

{#if href}
	<a
		href={resolvedHref}
		class={combinedClasses}
		class:opacity-50={disabled}
		class:pointer-events-none={disabled}
	>
		{#if loading}
			<span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
		{/if}
		{@render children()}
	</a>
{:else}
	<button
		{type}
		disabled={disabled || loading}
		class={combinedClasses}
		onclick={() => {
			console.log('[Button] clicked, onclick:', typeof onclick);
			onclick?.();
		}}
	>
		{#if loading}
			<span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
		{/if}
		{@render children()}
	</button>
{/if}
