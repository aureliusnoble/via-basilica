import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Import the pre-computed class mapping
// This maps Wikidata class IDs (e.g., Q5) to our category names (e.g., "People")
import CLASS_MAPPING from './class-to-category.json' with { type: 'json' };

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

// Batch size for Wikidata API calls (max 50)
const WIKIDATA_BATCH_SIZE = 50;

// Cache duration in days
const CACHE_DURATION_DAYS = 30;

// Max depth for P279 chain lookup
const MAX_P279_DEPTH = 3;

// Cache for P279 lookups (within a single request)
const p279Cache: Record<string, string[]> = {};

// Initialize Supabase client for caching
function getSupabaseClient() {
	const supabaseUrl = Deno.env.get('SUPABASE_URL');
	const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

	if (!supabaseUrl || !supabaseKey) {
		return null;
	}

	return createClient(supabaseUrl, supabaseKey);
}

// Fetch P31 values from Wikidata for a batch of Wikipedia titles
async function fetchP31FromWikidata(
	titles: string[]
): Promise<Record<string, string[]>> {
	const normalizedTitles = titles.map((t) => t.replace(/ /g, '_'));

	const params = new URLSearchParams({
		action: 'wbgetentities',
		sites: 'enwiki',
		titles: normalizedTitles.join('|'),
		props: 'claims|sitelinks',
		format: 'json',
		origin: '*'
	});

	try {
		const response = await fetch(`${WIKIDATA_API}?${params}`);
		const data = await response.json();

		const results: Record<string, string[]> = {};
		const entities = data.entities || {};

		for (const [id, entity] of Object.entries(entities)) {
			// Skip missing entities
			if (id.startsWith('-') || (entity as { missing?: boolean }).missing) {
				continue;
			}

			// Get the Wikipedia title from sitelinks
			const typedEntity = entity as {
				sitelinks?: { enwiki?: { title: string } };
				claims?: { P31?: Array<{ mainsnak?: { datavalue?: { value?: { id: string } } } }> };
			};
			const sitelink = typedEntity.sitelinks?.enwiki;
			const title = sitelink?.title;
			if (!title) continue;

			// Extract P31 (instance of) values
			const claims = typedEntity.claims?.P31 || [];
			const p31Values = claims
				.map((c) => c?.mainsnak?.datavalue?.value?.id)
				.filter((id): id is string => Boolean(id));

			results[title] = p31Values;
		}

		return results;
	} catch (error) {
		console.error('Error fetching from Wikidata:', error);
		return {};
	}
}

// Fetch P279 (subclass of) values for a batch of class IDs
async function fetchP279FromWikidata(
	classIds: string[]
): Promise<Record<string, string[]>> {
	if (classIds.length === 0) return {};

	const params = new URLSearchParams({
		action: 'wbgetentities',
		ids: classIds.join('|'),
		props: 'claims',
		format: 'json',
		origin: '*'
	});

	try {
		const response = await fetch(`${WIKIDATA_API}?${params}`);
		const data = await response.json();

		const results: Record<string, string[]> = {};
		const entities = data.entities || {};

		for (const [id, entity] of Object.entries(entities)) {
			if ((entity as { missing?: boolean }).missing) continue;

			const typedEntity = entity as {
				claims?: { P279?: Array<{ mainsnak?: { datavalue?: { value?: { id: string } } } }> };
			};

			// Extract P279 (subclass of) values
			const claims = typedEntity.claims?.P279 || [];
			const p279Values = claims
				.map((c) => c?.mainsnak?.datavalue?.value?.id)
				.filter((id): id is string => Boolean(id));

			results[id] = p279Values;
			p279Cache[id] = p279Values; // Cache within request
		}

		return results;
	} catch (error) {
		console.error('Error fetching P279 from Wikidata:', error);
		return {};
	}
}

// Check Supabase cache for P31 values
async function checkCache(
	supabase: ReturnType<typeof createClient>,
	titles: string[]
): Promise<{ cached: Record<string, string[]>; uncached: string[] }> {
	const cached: Record<string, string[]> = {};
	const uncached: string[] = [];

	try {
		const { data, error } = await supabase
			.from('article_p31')
			.select('title, p31_classes, fetched_at')
			.in('title', titles);

		if (error) {
			console.error('Cache read error:', error);
			return { cached: {}, uncached: titles };
		}

		const now = new Date();
		const cacheValidUntil = new Date(
			now.getTime() - CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000
		);

		// Build a set of cached titles
		const cachedTitles = new Set<string>();
		for (const row of data || []) {
			const fetchedAt = new Date(row.fetched_at);
			if (fetchedAt >= cacheValidUntil) {
				cached[row.title] = row.p31_classes;
				cachedTitles.add(row.title);
			}
		}

		// Find uncached titles
		for (const title of titles) {
			if (!cachedTitles.has(title)) {
				uncached.push(title);
			}
		}

		return { cached, uncached };
	} catch (error) {
		console.error('Cache error:', error);
		return { cached: {}, uncached: titles };
	}
}

// Store P31 values in cache (fire and forget)
async function updateCache(
	supabase: ReturnType<typeof createClient>,
	p31Values: Record<string, string[]>
): Promise<void> {
	try {
		const rows = Object.entries(p31Values).map(([title, p31_classes]) => ({
			title,
			p31_classes,
			fetched_at: new Date().toISOString()
		}));

		// Upsert to handle existing entries
		await supabase.from('article_p31').upsert(rows, { onConflict: 'title' });
	} catch (error) {
		// Don't fail the request if cache update fails
		console.error('Cache update error:', error);
	}
}

// Classify an article based on its P31 values using the pre-computed mapping
// Returns the category if found in blockedCategories, null otherwise
function classifyWithDirectLookup(
	p31Values: string[],
	blockedCategories: string[]
): string | null {
	for (const classId of p31Values) {
		const category = (CLASS_MAPPING as Record<string, string>)[classId];
		if (category && blockedCategories.includes(category)) {
			return category;
		}
	}
	return null;
}

// Get category for a class ID from our mapping (without checking blockedCategories)
function getCategoryForClass(classId: string): string | null {
	return (CLASS_MAPPING as Record<string, string>)[classId] || null;
}

// Traverse P279 chain to find a category for unknown classes
async function classifyWithP279Chain(
	unknownClassIds: string[],
	blockedCategories: string[],
	depth: number = 0
): Promise<Record<string, string>> {
	const results: Record<string, string> = {};

	if (depth >= MAX_P279_DEPTH || unknownClassIds.length === 0) {
		return results;
	}

	// Filter out classes we've already cached
	const toFetch = unknownClassIds.filter(id => !p279Cache[id]);

	// Fetch P279 values for unknown classes in batches
	if (toFetch.length > 0) {
		for (let i = 0; i < toFetch.length; i += WIKIDATA_BATCH_SIZE) {
			const batch = toFetch.slice(i, i + WIKIDATA_BATCH_SIZE);
			await fetchP279FromWikidata(batch);
		}
	}

	// Check parent classes
	const nextLevelUnknown: string[] = [];

	for (const classId of unknownClassIds) {
		const parentClasses = p279Cache[classId] || [];

		for (const parentId of parentClasses) {
			const category = getCategoryForClass(parentId);
			if (category && blockedCategories.includes(category)) {
				results[classId] = category;
				break;
			}
		}

		// If still not found, add parent classes to next level lookup
		if (!results[classId]) {
			for (const parentId of parentClasses) {
				if (!getCategoryForClass(parentId) && !nextLevelUnknown.includes(parentId)) {
					nextLevelUnknown.push(parentId);
				}
			}
		}
	}

	// Recursively check next level
	if (nextLevelUnknown.length > 0) {
		const nextResults = await classifyWithP279Chain(
			nextLevelUnknown,
			blockedCategories,
			depth + 1
		);

		// Map back to original classes
		for (const classId of unknownClassIds) {
			if (results[classId]) continue;

			const parentClasses = p279Cache[classId] || [];
			for (const parentId of parentClasses) {
				if (nextResults[parentId]) {
					results[classId] = nextResults[parentId];
					break;
				}
			}
		}
	}

	return results;
}

// Full classification: direct lookup + P279 chain for unknown classes
async function classifyArticle(
	p31Values: string[],
	blockedCategories: string[]
): Promise<string | null> {
	// Step 1: Try direct lookup first (fast path)
	const directResult = classifyWithDirectLookup(p31Values, blockedCategories);
	if (directResult) {
		return directResult;
	}

	// Step 2: Collect unknown classes (not in our mapping)
	const unknownClasses = p31Values.filter(id => !getCategoryForClass(id));

	if (unknownClasses.length === 0) {
		// All classes are known but none match blocked categories
		return null;
	}

	// Step 3: Try P279 chain lookup for unknown classes
	const chainResults = await classifyWithP279Chain(unknownClasses, blockedCategories);

	// Return first match
	for (const classId of unknownClasses) {
		if (chainResults[classId]) {
			return chainResults[classId];
		}
	}

	return null;
}

serve(async (req) => {
	// Handle CORS preflight
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const { titles, blockedCategories } = await req.json();

		if (!Array.isArray(titles) || !Array.isArray(blockedCategories)) {
			return new Response(
				JSON.stringify({ error: 'titles and blockedCategories must be arrays' }),
				{
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
		}

		if (titles.length === 0 || blockedCategories.length === 0) {
			return new Response(JSON.stringify({ blockedLinks: {} }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const supabase = getSupabaseClient();
		let allP31Values: Record<string, string[]> = {};

		// Step 1: Check cache for existing P31 values
		let uncachedTitles = titles;
		if (supabase) {
			const cacheResult = await checkCache(supabase, titles);
			allP31Values = { ...cacheResult.cached };
			uncachedTitles = cacheResult.uncached;
		}

		// Step 2: Fetch P31 values from Wikidata for uncached titles
		if (uncachedTitles.length > 0) {
			const fetchedP31: Record<string, string[]> = {};

			// Process in batches of 50 (Wikidata API limit)
			for (let i = 0; i < uncachedTitles.length; i += WIKIDATA_BATCH_SIZE) {
				const batch = uncachedTitles.slice(i, i + WIKIDATA_BATCH_SIZE);
				const batchResults = await fetchP31FromWikidata(batch);
				Object.assign(fetchedP31, batchResults);
			}

			// Merge fetched results
			Object.assign(allP31Values, fetchedP31);

			// Step 3: Update cache in background (don't await)
			if (supabase && Object.keys(fetchedP31).length > 0) {
				updateCache(supabase, fetchedP31);
			}
		}

		// Step 4: Classify articles and identify blocked ones
		// Use P279 chain lookup for unknown classes
		const blockedLinks: Record<string, string | null> = {};

		for (const title of titles) {
			const p31Values = allP31Values[title] || allP31Values[title.replace(/ /g, '_')] || [];
			const blockedCategory = await classifyArticle(p31Values, blockedCategories);
			blockedLinks[title] = blockedCategory;
		}

		return new Response(JSON.stringify({ blockedLinks }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Edge function error:', error);
		return new Response(
			JSON.stringify({ error: (error as Error).message }),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	}
});
