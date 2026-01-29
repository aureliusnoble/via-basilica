<script lang="ts">
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { fetchArticleHtml, fetchRawArticleHtml, extractLinkTitles } from '$lib/api/wikipedia.js';
	import { checkBlockedLinks, type BlockedLinksMap } from '$lib/api/blocked-categories.js';

	interface Props {
		articleTitle: string;
		onNavigate: (title: string) => void;
		blockedCategories?: string[];
		previewMode?: boolean;
		onPreviewClick?: (title: string) => void;
		onLoadingChange?: (loading: boolean) => void;
	}

	let {
		articleTitle,
		onNavigate,
		blockedCategories = [],
		previewMode = false,
		onPreviewClick,
		onLoadingChange
	}: Props = $props();

	let content = $state('');
	let loading = $state(true);
	let error = $state<string | null>(null);
	let containerRef = $state<HTMLElement | null>(null);
	let currentlyLoadedTitle = $state('');

	$effect(() => {
		// Only load if the title has actually changed
		if (articleTitle && articleTitle !== currentlyLoadedTitle) {
			loadArticle(articleTitle);
		}
	});

	async function loadArticle(title: string) {
		loading = true;
		error = null;
		currentlyLoadedTitle = title;
		onLoadingChange?.(true);

		try {
			// If we have blocked categories, we need to do a two-step process:
			// 1. Fetch raw HTML and extract link titles
			// 2. Check which links are blocked
			// 3. Re-process HTML with blocked links map
			if (blockedCategories.length > 0) {
				// Fetch raw HTML
				const rawHtml = await fetchRawArticleHtml(title);

				// Only update if this is still the article we want
				if (title !== currentlyLoadedTitle) return;

				// Extract link titles
				const linkTitles = extractLinkTitles(rawHtml);

				// Check blocked links in background (show article immediately)
				const article = await fetchArticleHtml(title);
				if (title !== currentlyLoadedTitle) return;

				content = article.html;

				// Scroll to top
				if (containerRef) {
					containerRef.scrollTop = 0;
				}

				// Now check blocked categories and re-process if needed
				if (linkTitles.length > 0) {
					const blockedLinksMap = await checkBlockedLinks(linkTitles, blockedCategories);

					// Only update if still the same article and we have blocked links
					if (title === currentlyLoadedTitle && Object.keys(blockedLinksMap).length > 0) {
						// Re-fetch with blocked links map
						const articleWithBlocked = await fetchArticleHtml(title, blockedLinksMap);
						if (title === currentlyLoadedTitle) {
							content = articleWithBlocked.html;
						}
					}
				}
			} else {
				// No blocked categories - simple path
				const article = await fetchArticleHtml(title);
				// Only update if this is still the article we want
				if (title === currentlyLoadedTitle) {
					content = article.html;

					// Scroll to top
					if (containerRef) {
						containerRef.scrollTop = 0;
					}
				}
			}
		} catch (err) {
			if (title === currentlyLoadedTitle) {
				error = err instanceof Error ? err.message : 'Failed to load article';
			}
		} finally {
			if (title === currentlyLoadedTitle) {
				loading = false;
				onLoadingChange?.(false);
			}
		}
	}

	function handleClick(e: MouseEvent) {
		const target = e.target as HTMLElement;

		// Check for blocked links first
		const blockedLink = target.closest('a[data-blocked-category]');
		if (blockedLink) {
			e.preventDefault();
			// Blocked link - do nothing
			return;
		}

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

			// Check for blocked links first
			if (target.matches('a[data-blocked-category]')) {
				e.preventDefault();
				return;
			}

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
