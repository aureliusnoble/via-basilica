<script lang="ts">
	import { onMount } from 'svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { fetchArticleHtml } from '$lib/api/wikipedia.js';

	interface Props {
		articleTitle: string;
		onNavigate: (title: string) => void;
		previewMode?: boolean;
		onPreviewClick?: (title: string) => void;
	}

	let { articleTitle, onNavigate, previewMode = false, onPreviewClick }: Props = $props();

	let content = $state('');
	let loading = $state(true);
	let error = $state<string | null>(null);
	let containerRef = $state<HTMLElement | null>(null);

	$effect(() => {
		loadArticle(articleTitle);
	});

	async function loadArticle(title: string) {
		loading = true;
		error = null;

		try {
			const article = await fetchArticleHtml(title);
			content = article.html;

			// Scroll to top
			if (containerRef) {
				containerRef.scrollTop = 0;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load article';
		} finally {
			loading = false;
		}
	}

	function handleClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		const link = target.closest('a[data-wiki-link]');

		if (link) {
			e.preventDefault();
			const title = link.getAttribute('data-wiki-title');

			if (title) {
				if (previewMode && onPreviewClick) {
					onPreviewClick(title);
				} else {
					onNavigate(title);
				}
			}
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			const target = e.target as HTMLElement;
			if (target.matches('a[data-wiki-link]')) {
				e.preventDefault();
				const title = target.getAttribute('data-wiki-title');
				if (title) {
					if (previewMode && onPreviewClick) {
						onPreviewClick(title);
					} else {
						onNavigate(title);
					}
				}
			}
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	bind:this={containerRef}
	class="wiki-content px-4 py-4 overflow-y-auto max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto"
	onclick={handleClick}
	onkeydown={handleKeyDown}
>
	{#if loading}
		<div class="flex items-center justify-center py-20">
			<Spinner size="lg" />
		</div>
	{:else if error}
		<div class="text-center py-20">
			<p class="text-error mb-4">{error}</p>
			<button
				onclick={() => loadArticle(articleTitle)}
				class="text-gold hover:underline"
			>
				Try again
			</button>
		</div>
	{:else}
		<h1 class="text-2xl font-serif text-gold mb-4">{articleTitle.replace(/_/g, ' ')}</h1>
		{@html content}
	{/if}
</div>
