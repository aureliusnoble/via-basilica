import { browser } from '$app/environment';
import { getSupabaseSafe } from './supabase.js';

export type BlockedLinksMap = Record<string, string | null>;

const CACHE_KEY = 'via_basilica_blocked_cache';
const CACHE_VERSION = 2; // Increment to invalidate old cache entries
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
	blockedCategory: string | null;
	timestamp: number;
}

interface Cache {
	version: number;
	entries: Record<string, CacheEntry>;
}

function getCache(): Cache {
	if (!browser) return { version: CACHE_VERSION, entries: {} };

	try {
		const cached = localStorage.getItem(CACHE_KEY);
		if (cached) {
			const parsed = JSON.parse(cached);
			// Invalidate cache if version mismatch
			if (parsed.version !== CACHE_VERSION) {
				console.log('[BlockedCategories] Cache version mismatch, clearing old cache');
				localStorage.removeItem(CACHE_KEY);
				return { version: CACHE_VERSION, entries: {} };
			}
			return parsed;
		}
	} catch {
		// Ignore parse errors
	}
	return { version: CACHE_VERSION, entries: {} };
}

function saveCache(cache: Cache): void {
	if (!browser) return;

	try {
		// Clean up old entries before saving
		const now = Date.now();
		for (const [key, entry] of Object.entries(cache.entries)) {
			if (now - entry.timestamp > CACHE_DURATION_MS) {
				delete cache.entries[key];
			}
		}
		// Ensure version is set
		cache.version = CACHE_VERSION;
		localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
	} catch {
		// Ignore storage errors
	}
}

function getCacheKey(title: string, blockedCategories: string[]): string {
	return `${title}|${blockedCategories.sort().join(',')}`;
}

export async function checkBlockedLinks(
	titles: string[],
	blockedCategories: string[]
): Promise<BlockedLinksMap> {
	if (!browser || blockedCategories.length === 0 || titles.length === 0) {
		console.log('[BlockedCategories] Early return:', { browser, blockedCategories, titlesCount: titles.length });
		return {};
	}
	console.log(`[BlockedCategories] Checking ${titles.length} titles...`);

	const cache = getCache();
	const result: BlockedLinksMap = {};
	const uncachedTitles: string[] = [];

	// Check cache first
	for (const title of titles) {
		const cacheKey = getCacheKey(title, blockedCategories);
		const cached = cache.entries[cacheKey];

		if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
			result[title] = cached.blockedCategory;
		} else {
			uncachedTitles.push(title);
		}
	}

	// If all titles were cached, return early
	if (uncachedTitles.length === 0) {
		return result;
	}

	// Call edge function for uncached titles
	const supabase = getSupabaseSafe();
	if (!supabase) {
		return result;
	}

	try {
		console.log(`[BlockedCategories] Checking ${uncachedTitles.length} uncached titles with categories:`, blockedCategories);

		const { data, error } = await supabase.functions.invoke('check-article-categories', {
			body: {
				titles: uncachedTitles,
				blockedCategories
			}
		});

		if (error) {
			console.error('[BlockedCategories] Error checking blocked categories:', error);
			return result;
		}

		const blockedLinks: BlockedLinksMap = data?.blockedLinks || {};

		// Log how many were blocked
		const blockedCount = Object.values(blockedLinks).filter(v => v !== null).length;
		console.log(`[BlockedCategories] Result: ${blockedCount}/${uncachedTitles.length} blocked`);

		// Update cache and result
		const now = Date.now();
		for (const title of uncachedTitles) {
			// Try multiple title formats for lookup (Wikipedia normalizes titles)
			const blockedCategory =
				blockedLinks[title] ??
				blockedLinks[title.charAt(0).toUpperCase() + title.slice(1)] ??
				blockedLinks[title.replace(/ /g, '_')] ??
				null;
			result[title] = blockedCategory;

			// Cache this result
			const cacheKey = getCacheKey(title, blockedCategories);
			cache.entries[cacheKey] = {
				blockedCategory,
				timestamp: now
			};
		}

		saveCache(cache);
	} catch (err) {
		console.error('Error calling check-article-categories:', err);
	}

	return result;
}

export function clearBlockedCategoriesCache(): void {
	if (!browser) return;
	try {
		localStorage.removeItem(CACHE_KEY);
	} catch {
		// Ignore errors
	}
}
