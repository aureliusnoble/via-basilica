import DOMPurify from 'dompurify';
import type {
	WikipediaArticle,
	WikipediaCategory,
	WikipediaBacklink,
	WikipediaExtract,
	WikipediaLinksResponse
} from '$lib/types/wikipedia.js';
import type { BlockedLinksMap } from './blocked-categories.js';
import { BLOCKED_CATEGORY_LINK_COLORS } from '$lib/utils/blocked-categories.js';

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const WIKIPEDIA_REST = 'https://en.wikipedia.org/api/rest_v1';

// Elements to strip from Wikipedia HTML
const STRIP_SELECTORS = [
	'.mw-editsection',
	'.reflist',
	'.navbox',
	'.sistersitebox',
	'.noprint',
	'#toc',
	'.mw-references-wrap',
	'.metadata',
	'.ambox',
	'.dmbox',
	'.tmbox',
	'.mbox-small',
	'.portal',
	'.authority-control',
	'style',
	'script',
	'.mw-empty-elt',
	'.hatnote',
	'.shortdescription',
	'.infobox .ib-settlement-cols-cell'
];

// Target article
export const TARGET_ARTICLE = 'Basil_of_Caesarea';

export async function fetchArticleHtml(
	title: string,
	blockedLinksMap?: BlockedLinksMap
): Promise<WikipediaArticle> {
	const encodedTitle = encodeURIComponent(title.replace(/ /g, '_'));
	const response = await fetch(`${WIKIPEDIA_REST}/page/html/${encodedTitle}`);

	if (!response.ok) {
		throw new Error(`Failed to fetch article: ${response.statusText}`);
	}

	const rawHtml = await response.text();
	const processedHtml = processWikipediaHtml(rawHtml, title, blockedLinksMap);

	return {
		title: title.replace(/_/g, ' '),
		html: processedHtml
	};
}

function processWikipediaHtml(
	html: string,
	currentTitle: string,
	blockedLinksMap?: BlockedLinksMap
): string {
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');

	// Strip unwanted elements
	STRIP_SELECTORS.forEach((selector) => {
		doc.querySelectorAll(selector).forEach((el) => el.remove());
	});

	// Transform internal wiki links
	doc.querySelectorAll('a[rel="mw:WikiLink"]').forEach((link) => {
		const href = link.getAttribute('href');
		if (!href) return;

		// Extract title from href
		const titleMatch = href.match(/^\.\/(.+)$/);
		if (titleMatch) {
			const linkedTitle = decodeURIComponent(titleMatch[1]);

			// Skip special namespaces
			if (
				linkedTitle.includes(':') &&
				(linkedTitle.startsWith('Category:') ||
					linkedTitle.startsWith('File:') ||
					linkedTitle.startsWith('Wikipedia:') ||
					linkedTitle.startsWith('Help:') ||
					linkedTitle.startsWith('Template:') ||
					linkedTitle.startsWith('Portal:') ||
					linkedTitle.startsWith('Special:'))
			) {
				link.removeAttribute('href');
				link.classList.add('wiki-disabled-link');
				return;
			}

			// Check if this link is blocked
			const blockedCategory = blockedLinksMap?.[linkedTitle] || blockedLinksMap?.[linkedTitle.replace(/_/g, ' ')];
			if (blockedCategory) {
				link.removeAttribute('href');
				link.setAttribute('data-blocked-category', blockedCategory);
				link.classList.add('wiki-blocked-link');
				// Add inline background color based on category
				const bgColor = BLOCKED_CATEGORY_LINK_COLORS[blockedCategory] || 'rgba(239, 68, 68, 0.2)';
				(link as HTMLElement).style.backgroundColor = bgColor;
				return;
			}

			// Mark as game link
			link.setAttribute('data-wiki-link', 'true');
			link.setAttribute('data-wiki-title', linkedTitle);
			link.setAttribute('href', '#');
			link.classList.add('wiki-game-link');
		}
	});

	// Transform external links
	doc.querySelectorAll('a[rel="mw:ExtLink"]').forEach((link) => {
		link.setAttribute('target', '_blank');
		link.setAttribute('rel', 'noopener noreferrer');
		link.classList.add('wiki-external-link');
	});

	// Transform images
	doc.querySelectorAll('img').forEach((img) => {
		const src = img.getAttribute('src');
		if (src && src.startsWith('//')) {
			img.setAttribute('src', `https:${src}`);
		} else if (src && src.startsWith('/')) {
			img.setAttribute('src', `https://en.wikipedia.org${src}`);
		}
		img.setAttribute('loading', 'lazy');
		img.classList.add('wiki-image');
	});

	// Wrap tables in scrollable container
	doc.querySelectorAll('table').forEach((table) => {
		if (!table.parentElement?.classList.contains('table-wrapper')) {
			const wrapper = doc.createElement('div');
			wrapper.className = 'table-wrapper overflow-x-auto';
			table.parentNode?.insertBefore(wrapper, table);
			wrapper.appendChild(table);
		}
	});

	// Sanitize
	const sanitized = DOMPurify.sanitize(doc.body.innerHTML, {
		ADD_ATTR: ['data-wiki-link', 'data-wiki-title', 'data-blocked-category', 'loading', 'target', 'rel', 'style'],
		ADD_TAGS: ['section', 'figure', 'figcaption'],
		FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
		FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
	});

	return sanitized;
}

export async function fetchArticleCategories(title: string): Promise<string[]> {
	const params = new URLSearchParams({
		action: 'query',
		prop: 'categories',
		titles: title,
		cllimit: '20',
		clshow: '!hidden',
		format: 'json',
		origin: '*'
	});

	const response = await fetch(`${WIKIPEDIA_API}?${params}`);
	const data = await response.json();

	const pages = data.query?.pages;
	if (!pages) return [];

	const pageId = Object.keys(pages)[0];
	const categories: WikipediaCategory[] = pages[pageId]?.categories || [];

	return categories.map((cat) => cat.title.replace('Category:', ''));
}

export async function fetchArticleExtract(title: string): Promise<string> {
	const params = new URLSearchParams({
		action: 'query',
		prop: 'extracts',
		titles: title,
		exintro: '1',
		explaintext: '1',
		format: 'json',
		origin: '*'
	});

	const response = await fetch(`${WIKIPEDIA_API}?${params}`);
	const data = await response.json();

	const pages = data.query?.pages;
	if (!pages) return '';

	const pageId = Object.keys(pages)[0];
	return pages[pageId]?.extract || '';
}

export async function fetchBacklinks(title: string, limit: number = 5): Promise<string[]> {
	const params = new URLSearchParams({
		action: 'query',
		list: 'backlinks',
		bltitle: title,
		blnamespace: '0',
		bllimit: limit.toString(),
		format: 'json',
		origin: '*'
	});

	const response = await fetch(`${WIKIPEDIA_API}?${params}`);
	const data = await response.json();

	const backlinks: WikipediaBacklink[] = data.query?.backlinks || [];
	return backlinks.map((bl) => bl.title);
}

export async function fetchOutgoingLinks(title: string, limit: number = 50): Promise<string[]> {
	const params = new URLSearchParams({
		action: 'query',
		prop: 'links',
		titles: title,
		plnamespace: '0',
		pllimit: limit.toString(),
		format: 'json',
		origin: '*'
	});

	const response = await fetch(`${WIKIPEDIA_API}?${params}`);
	const data = await response.json();

	const pages = data.query?.pages;
	if (!pages) return [];

	const pageId = Object.keys(pages)[0];
	const links = pages[pageId]?.links || [];

	return links.map((link: { title: string }) => link.title);
}

export async function verifyLinkExists(fromTitle: string, toTitle: string): Promise<boolean> {
	const params = new URLSearchParams({
		action: 'query',
		prop: 'links',
		titles: fromTitle,
		pltitles: toTitle,
		format: 'json',
		origin: '*'
	});

	const response = await fetch(`${WIKIPEDIA_API}?${params}`);
	const data = await response.json();

	const pages = data.query?.pages;
	if (!pages) return false;

	const pageId = Object.keys(pages)[0];
	const links = pages[pageId]?.links || [];

	return links.some((link: { title: string }) => link.title === toTitle);
}

export async function fetchRandomArticle(): Promise<{ title: string; url: string }> {
	const params = new URLSearchParams({
		action: 'query',
		list: 'random',
		rnnamespace: '0',
		rnlimit: '1',
		format: 'json',
		origin: '*'
	});

	const response = await fetch(`${WIKIPEDIA_API}?${params}`);
	const data = await response.json();

	const article = data.query?.random?.[0];
	if (!article) {
		throw new Error('Failed to fetch random article');
	}

	return {
		title: article.title,
		url: `https://en.wikipedia.org/wiki/${encodeURIComponent(article.title.replace(/ /g, '_'))}`
	};
}

// All known titles/redirects for the target article (from Wikipedia redirect list)
const TARGET_ALIASES = [
	'basil_of_caesarea',
	'basil_the_great',
	'st._basil_the_great',
	'saint_basil',
	'saint_basil_the_great',
	'st._basil',
	'st_basil',
	'st._basil_of_caesarea',
	'saint_basil_of_caesarea',
	'saint_basil\'s_day',
	'basil_of_cesareea',
	'saint_basil_the_great',
	'st_basil_the_great',
	'basil,_saint',
	'basil,_saint_bishop_of_caesarea',
	'basil_of_cappadocia',
	'basil_of_neocaesarea'
];

export function isTargetArticle(title: string): boolean {
	const normalized = title.replace(/ /g, '_').toLowerCase();
	return TARGET_ALIASES.includes(normalized);
}

// Extract all link titles from raw Wikipedia HTML (before processing)
export function extractLinkTitles(html: string): string[] {
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');

	const titles: string[] = [];
	const seen = new Set<string>();

	doc.querySelectorAll('a[rel="mw:WikiLink"]').forEach((link) => {
		const href = link.getAttribute('href');
		if (!href) return;

		const titleMatch = href.match(/^\.\/(.+)$/);
		if (titleMatch) {
			const linkedTitle = decodeURIComponent(titleMatch[1]);

			// Skip special namespaces
			if (
				linkedTitle.includes(':') &&
				(linkedTitle.startsWith('Category:') ||
					linkedTitle.startsWith('File:') ||
					linkedTitle.startsWith('Wikipedia:') ||
					linkedTitle.startsWith('Help:') ||
					linkedTitle.startsWith('Template:') ||
					linkedTitle.startsWith('Portal:') ||
					linkedTitle.startsWith('Special:'))
			) {
				return;
			}

			// Normalize and dedupe
			const normalized = linkedTitle.replace(/_/g, ' ');
			if (!seen.has(normalized)) {
				seen.add(normalized);
				titles.push(normalized);
			}
		}
	});

	return titles;
}

// Fetch raw article HTML without processing (for extracting link titles)
export async function fetchRawArticleHtml(title: string): Promise<string> {
	const encodedTitle = encodeURIComponent(title.replace(/ /g, '_'));
	const response = await fetch(`${WIKIPEDIA_REST}/page/html/${encodedTitle}`);

	if (!response.ok) {
		throw new Error(`Failed to fetch article: ${response.statusText}`);
	}

	return response.text();
}
