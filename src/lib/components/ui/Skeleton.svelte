<script lang="ts">
	interface Props {
		class?: string;
		width?: string;
		height?: string;
		rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
	}

	let { class: className = '', width = '100%', height = '1rem', rounded = 'md' }: Props = $props();

	const roundedClasses = {
		none: '',
		sm: 'rounded-sm',
		md: 'rounded-md',
		lg: 'rounded-lg',
		full: 'rounded-full'
	};
</script>

<div
	class="animate-pulse bg-bg-dark-tertiary {roundedClasses[rounded]} {className}"
	style="width: {width}; height: {height};"
></div>
