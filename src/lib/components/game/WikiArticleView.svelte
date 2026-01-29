<script lang="ts">
	import { tick } from 'svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { fetchArticleHtml } from '$lib/api/wikipedia.js';
	import { checkBlockedLinks } from '$lib/api/blocked-categories.js';
	import { BLOCKED_CATEGORY_LINK_COLORS } from '$lib/utils/blocked-categories.js';

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

	// Link checking progress state
	let isCheckingLinks = $state(false);
	let totalLinks = $state(0);
	let checkedLinks = $state(0);
	let checkProgress = $derived(totalLinks > 0 ? Math.round((checkedLinks / totalLinks) * 100) : 0);

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
			// Fetch and show article immediately
			const article = await fetchArticleHtml(title);

			// Only update if this is still the article we want
			if (title !== currentlyLoadedTitle) return;

			content = article.html;
			loading = false;
			onLoadingChange?.(false);

			// Scroll to top
			if (containerRef) {
				containerRef.scrollTop = 0;
			}

			// If we have blocked categories, check links in background and apply styles via DOM
			// Wait for Svelte to render the HTML to the DOM before querying it
			await tick();
			if (blockedCategories.length > 0 && containerRef) {
				applyBlockedStylesAsync(title);
			}
		} catch (err) {
			if (title === currentlyLoadedTitle) {
				error = err instanceof Error ? err.message : 'Failed to load article';
				loading = false;
				onLoadingChange?.(false);
			}
		}
	}

	async function applyBlockedStylesAsync(title: string) {
		if (!containerRef) return;

		// Extract link titles from current DOM
		const links = containerRef.querySelectorAll('a[data-wiki-link]');
		const linkTitles: string[] = [];
		const linkMap = new Map<string, HTMLElement[]>();

		links.forEach((link) => {
			const linkTitle = link.getAttribute('data-wiki-title');
			if (linkTitle) {
				const normalized = linkTitle.replace(/_/g, ' ');
				if (!linkMap.has(normalized)) {
					linkMap.set(normalized, []);
					linkTitles.push(normalized);
				}
				linkMap.get(normalized)!.push(link as HTMLElement);
			}
		});

		if (linkTitles.length === 0) return;

		// Show progress bar
		isCheckingLinks = true;
		totalLinks = linkTitles.length;
		checkedLinks = 0;

		// Process ALL batches in parallel for speed
		const BATCH_SIZE = 50;
		const allBlockedLinks: Record<string, string | null> = {};
		const batches: string[][] = [];

		for (let i = 0; i < linkTitles.length; i += BATCH_SIZE) {
			batches.push(linkTitles.slice(i, i + BATCH_SIZE));
		}

		// Fire all batch requests in parallel
		const batchPromises = batches.map(async (batch, index) => {
			const result = await checkBlockedLinks(batch, blockedCategories);
			// Update progress as each batch completes
			checkedLinks += batch.length;
			return result;
		});

		// Wait for all batches to complete
		const results = await Promise.all(batchPromises);

		// Check if still the same article
		if (title !== currentlyLoadedTitle || !containerRef) {
			isCheckingLinks = false;
			return;
		}

		// Merge all results
		for (const result of results) {
			Object.assign(allBlockedLinks, result);
		}

		// Hide progress bar
		isCheckingLinks = false;

		// Apply styles to blocked links via DOM manipulation
		for (const [linkTitle, blockedCategory] of Object.entries(allBlockedLinks)) {
			if (!blockedCategory) continue;

			const elements = linkMap.get(linkTitle) || linkMap.get(linkTitle.replace(/ /g, '_'));
			if (!elements) continue;

			for (const link of elements) {
				// Remove game link attributes
				link.removeAttribute('data-wiki-link');
				link.removeAttribute('href');
				link.classList.remove('wiki-game-link');

				// Add blocked attributes and styles
				link.setAttribute('data-blocked-category', blockedCategory);
				link.classList.add('wiki-blocked-link');

				// Apply inline background color
				const bgColor = BLOCKED_CATEGORY_LINK_COLORS[blockedCategory] || 'rgba(239, 68, 68, 0.2)';
				link.style.backgroundColor = bgColor;
			}
		}
	}

	function handleClick(e: MouseEvent) {
		const target = e.target as HTMLElement;

		// Check for blocked links first
		const blockedLink = target.closest('a[data-blocked-category]');
		if (blockedLink) {
			e.preventDefault();
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
		<h1 class="text-2xl font-serif text-text-dark font-semibold mb-4 border-b border-bg-dark-tertiary pb-2">{articleTitle.replace(/_/g, ' ')}</h1>

		{#if isCheckingLinks}
			<div class="mb-4 p-3 bg-bg-dark-secondary rounded-lg">
				<div class="flex items-center justify-between mb-2">
					<span class="text-sm text-text-dark-muted">Checking links...</span>
					<span class="text-sm text-text-dark-muted">{checkedLinks}/{totalLinks}</span>
				</div>
				<div class="progress-bar h-2">
					<div
						class="progress-bar-fill transition-all duration-300"
						style="width: {checkProgress}%"
					></div>
				</div>
			</div>
		{/if}

		{@html content}
	{/if}
</div>
