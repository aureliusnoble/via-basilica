import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Import the pre-computed class mapping
// This maps Wikidata class IDs (e.g., Q5) to our category names (e.g., "People")
// Updated: Fixed empire/statute mappings
import CLASS_MAPPING from './class-to-category.json' with { type: 'json' };

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';

// Batch size for Wikidata API calls (max 50)
const WIKIDATA_BATCH_SIZE = 50;

// Target article and its aliases - these should NEVER be blocked
// Complete list from Wikipedia redirects
const TARGET_ALIASES = new Set([
	'basil of caesarea',
	'basil_of_caesarea',
	'basil the great',
	'basil_the_great',
	'st. basil the great',
	'st._basil_the_great',
	'saint basil',
	'saint_basil',
	'saint basil the great',
	'saint_basil_the_great',
	'st. basil',
	'st._basil',
	'st basil',
	'st_basil',
	'st. basil of caesarea',
	'st._basil_of_caesarea',
	'saint basil of caesarea',
	'saint_basil_of_caesarea',
	'saint basil\'s day',
	'saint_basil\'s_day',
	'basil of cesareea',
	'basil_of_cesareea',
	'st basil the great',
	'st_basil_the_great',
	'basil, saint',
	'basil,_saint',
	'basil, saint bishop of caesarea',
	'basil,_saint_bishop_of_caesarea',
	'basil of cappadocia',
	'basil_of_cappadocia',
	'basil of neocaesarea',
	'basil_of_neocaesarea'
]);

function isTargetArticle(title: string): boolean {
	const normalized = title.toLowerCase();
	return TARGET_ALIASES.has(normalized) || TARGET_ALIASES.has(normalized.replace(/ /g, '_'));
}

// Wikipedia category keywords that map to our categories
// Used as fallback when P31 values are not available
const CATEGORY_KEYWORDS: Record<string, string[]> = {
	Religion: [
		'religion', 'christianity', 'christian', 'church', 'catholic', 'orthodox',
		'protestant', 'saints', 'popes', 'bishops', 'clergy', 'religious',
		'theology', 'bible', 'biblical', 'jesus', 'god', 'divine', 'sacred',
		'monastery', 'monks', 'nuns', 'prayer', 'worship', 'faith', 'basilica',
		'temple', 'abbey', 'cathedral', 'diocese', 'archdiocese', 'patriarch',
		'pilgrimage', 'relic', 'canonization', 'beatification', 'martyr'
	],
	History: [
		'history', 'historical', 'ancient', 'medieval', 'century', 'war',
		'battle', 'empire', 'dynasty', 'revolution', 'era', 'period',
		'civilization', 'kingdom', 'reign', 'conquest', 'crusade', 'rebellion',
		'siege', 'treaty', 'armistice', 'archaeological', 'antiquity', 'byzantine',
		'roman empire', 'ottoman', 'classical'
	],
	People: [
		'people', 'births', 'deaths', 'living people', 'person', 'biography',
		'writers', 'authors', 'poets', 'politicians', 'scientists', 'artists',
		'actors', 'musicians', 'athletes', 'philosophers', 'monarchs', 'nobility',
		'military personnel', 'clergy', 'lawyers', 'physicians', 'engineers'
	],
	Geography: [
		'geography', 'countries', 'cities', 'places', 'regions', 'mountains',
		'rivers', 'islands', 'continents', 'valleys', 'lakes', 'seas', 'oceans',
		'peninsulas', 'plateaus', 'hills', 'settlements', 'provinces', 'states'
	],
	Science: [
		'science', 'biology', 'chemistry', 'physics', 'mathematics', 'medicine',
		'species', 'genus', 'family', 'disease', 'syndrome', 'disorder', 'compound',
		'element', 'astronomy', 'geology', 'ecology', 'genetics', 'technology'
	],
	Arts: [
		'art', 'arts', 'film', 'music', 'album', 'song', 'literature', 'novel',
		'painting', 'theatre', 'television', 'anime', 'manga', 'video game',
		'sculpture', 'poetry', 'drama', 'comedy', 'opera', 'ballet'
	],
	Sports: [
		'sport', 'sports', 'football', 'basketball', 'olympic', 'championship',
		'league', 'team', 'player', 'athletics', 'soccer', 'cricket', 'rugby',
		'tennis', 'golf', 'hockey', 'baseball', 'stadium', 'tournament'
	],
	Government: [
		'government', 'politics', 'political', 'election', 'president', 'minister',
		'parliament', 'congress', 'senate', 'legislature', 'cabinet', 'ambassador',
		'diplomat', 'governor', 'mayor', 'referendum', 'democracy'
	],
	Education: [
		'education', 'university', 'college', 'school', 'academic', 'library',
		'museum', 'institute', 'academy', 'faculty', 'curriculum', 'degree'
	],
	Philosophy: [
		'philosophy', 'philosophical', 'ethics', 'logic', 'metaphysics',
		'epistemology', 'existentialism', 'rationalism', 'empiricism'
	],
	Culture: [
		'culture', 'cultural', 'festival', 'tradition', 'folklore', 'mythology',
		'cuisine', 'holiday', 'celebration', 'ritual', 'custom', 'heritage'
	],
	Language: [
		'language', 'languages', 'linguistic', 'dialect', 'alphabet', 'script',
		'grammar', 'vocabulary', 'etymology'
	],
	Law: [
		'law', 'legal', 'court', 'justice', 'crime', 'criminal', 'constitution',
		'statute', 'legislation', 'treaty', 'rights', 'judiciary'
	],
	Society: [
		'society', 'social', 'organization', 'company', 'corporation', 'nonprofit',
		'association', 'movement', 'community', 'class'
	],
	Architecture: [
		'architecture', 'building', 'structure', 'castle', 'palace', 'tower',
		'bridge', 'monument', 'landmark', 'heritage site', 'historic building'
	],
	Transportation: [
		'transportation', 'transport', 'railway', 'railroad', 'station', 'airport',
		'port', 'ship', 'vessel', 'aircraft', 'airline', 'road', 'highway'
	],
	Military: [
		'military', 'army', 'navy', 'air force', 'regiment', 'battalion', 'brigade',
		'division', 'corps', 'fleet', 'weapon', 'missile', 'tank', 'warship'
	],
	Economics: [
		'economics', 'economy', 'economic', 'finance', 'financial', 'bank', 'stock',
		'trade', 'commerce', 'industry', 'market', 'currency'
	],
	Humanities: [
		'humanities', 'genre', 'movement', 'style', 'period', 'classical', 'modern',
		'contemporary', 'renaissance', 'baroque', 'romantic'
	]
};

// Cache duration in days
const CACHE_DURATION_DAYS = 30;

// Max depth for P279 chain lookup
const MAX_P279_DEPTH = 3;

// Cache for P279 lookups (within a single request)
const p279Cache: Record<string, string[]> = {};

// Check article_categories cache for pre-classified articles
async function checkCategoryCache(
	supabase: ReturnType<typeof createClient>,
	titles: string[]
): Promise<{ cached: Record<string, string | null>; uncached: string[] }> {
	const cached: Record<string, string | null> = {};
	const uncached: string[] = [];

	try {
		const { data, error } = await supabase
			.from('article_categories')
			.select('title, category')
			.in('title', titles);

		if (error) {
			console.error('Category cache read error:', error);
			return { cached: {}, uncached: titles };
		}

		// Build a map of cached categories
		const cachedTitles = new Set<string>();
		for (const row of data || []) {
			cached[row.title] = row.category;
			cachedTitles.add(row.title);
		}

		// Find uncached titles
		for (const title of titles) {
			if (!cachedTitles.has(title) && !cachedTitles.has(title.replace(/ /g, '_'))) {
				uncached.push(title);
			}
		}

		return { cached, uncached };
	} catch (error) {
		console.error('Category cache error:', error);
		return { cached: {}, uncached: titles };
	}
}

// Store category classifications in cache
// Only cache non-null categories to avoid permanently caching redirect/missing articles
async function updateCategoryCache(
	supabase: ReturnType<typeof createClient>,
	categories: Record<string, string | null>
): Promise<void> {
	try {
		// Only cache articles that have a valid category
		// This allows redirect targets to be re-resolved on next request
		const rows = Object.entries(categories)
			.filter(([_, category]) => category !== null)
			.map(([title, category]) => ({
				title,
				category,
				checked_at: new Date().toISOString()
			}));

		if (rows.length === 0) return;

		// Upsert to handle existing entries
		await supabase.from('article_categories').upsert(rows, { onConflict: 'title' });
	} catch (error) {
		console.error('Category cache update error:', error);
	}
}

// Resolve Wikipedia redirects to get canonical titles
async function resolveWikipediaRedirects(
	titles: string[]
): Promise<Record<string, string>> {
	if (titles.length === 0) return {};

	const params = new URLSearchParams({
		action: 'query',
		titles: titles.join('|'),
		redirects: '1',
		format: 'json',
		origin: '*'
	});

	try {
		const response = await fetch(`${WIKIPEDIA_API}?${params}`);
		const data = await response.json();

		const redirectMap: Record<string, string> = {};

		// Map original titles to themselves first
		for (const title of titles) {
			redirectMap[title] = title;
		}

		// Apply redirects
		const redirects = data.query?.redirects || [];
		for (const redirect of redirects) {
			redirectMap[redirect.from] = redirect.to;
			// Also handle underscore variants
			redirectMap[redirect.from.replace(/ /g, '_')] = redirect.to;
		}

		// Apply normalizations (e.g., first letter capitalization)
		const normalizations = data.query?.normalized || [];
		for (const norm of normalizations) {
			if (redirectMap[norm.to]) {
				redirectMap[norm.from] = redirectMap[norm.to];
			} else {
				redirectMap[norm.from] = norm.to;
			}
		}

		return redirectMap;
	} catch (error) {
		console.error('Error resolving Wikipedia redirects:', error);
		// Return identity mapping on error
		const result: Record<string, string> = {};
		for (const title of titles) {
			result[title] = title;
		}
		return result;
	}
}

// Fetch Wikipedia categories for articles (fallback when no P31)
async function fetchWikipediaCategories(
	titles: string[]
): Promise<Record<string, string[]>> {
	if (titles.length === 0) return {};

	const params = new URLSearchParams({
		action: 'query',
		prop: 'categories',
		titles: titles.join('|'),
		cllimit: '20',
		clshow: '!hidden',
		format: 'json',
		origin: '*'
	});

	try {
		const response = await fetch(`${WIKIPEDIA_API}?${params}`);
		const data = await response.json();

		const results: Record<string, string[]> = {};
		const pages = data.query?.pages || {};

		for (const pageId of Object.keys(pages)) {
			const page = pages[pageId];
			if (page.title && page.categories) {
				const categories = page.categories.map(
					(cat: { title: string }) => cat.title.replace('Category:', '')
				);
				results[page.title] = categories;
			}
		}

		return results;
	} catch (error) {
		console.error('Error fetching Wikipedia categories:', error);
		return {};
	}
}

// Classify using Wikipedia category keywords (fallback)
function classifyWithWikipediaCategories(
	categories: string[],
	blockedCategories: string[]
): string | null {
	const categoriesLower = categories.map(c => c.toLowerCase());

	for (const blockedCat of blockedCategories) {
		const keywords = CATEGORY_KEYWORDS[blockedCat];
		if (!keywords) continue;

		for (const category of categoriesLower) {
			for (const keyword of keywords) {
				if (category.includes(keyword)) {
					return blockedCat;
				}
			}
		}
	}

	return null;
}

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

// Get the category for an article (regardless of blocked status) - for caching
function getArticleCategory(p31Values: string[]): string | null {
	// Check all P31 values against our mapping
	for (const classId of p31Values) {
		const category = (CLASS_MAPPING as Record<string, string>)[classId];
		if (category) {
			return category;
		}
	}
	return null;
}

// Classify using Wikipedia categories and return the category (for caching)
function getWikipediaCategoryClassification(categories: string[]): string | null {
	const categoriesLower = categories.map(c => c.toLowerCase());

	// Check all possible categories, not just blocked ones
	for (const [categoryName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
		for (const category of categoriesLower) {
			for (const keyword of keywords) {
				if (category.includes(keyword)) {
					return categoryName;
				}
			}
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
			return new Response(JSON.stringify({ blockedLinks: {}, categories: {} }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const supabase = getSupabaseClient();
		const blockedLinks: Record<string, string | null> = {};
		const newCategoryClassifications: Record<string, string | null> = {};

		// Step 1: Check article_categories cache first (fastest path)
		let titlesToClassify = titles;
		if (supabase) {
			const categoryCache = await checkCategoryCache(supabase, titles);

			// For cached articles, just check if their category is blocked
			// IMPORTANT: Never block the target article (victory condition)
			for (const [title, category] of Object.entries(categoryCache.cached)) {
				if (isTargetArticle(title)) {
					blockedLinks[title] = null; // Never block target
				} else if (category && blockedCategories.includes(category)) {
					blockedLinks[title] = category;
				} else {
					blockedLinks[title] = null;
				}
			}

			titlesToClassify = categoryCache.uncached;
		}

		// If all titles were cached, return immediately with categories
		if (titlesToClassify.length === 0) {
			// Build categories from cache
			const categories: Record<string, string | null> = {};
			if (supabase) {
				const categoryCache = await checkCategoryCache(supabase, titles);
				for (const [title, category] of Object.entries(categoryCache.cached)) {
					categories[title] = category;
				}
			}
			return new Response(JSON.stringify({ blockedLinks, categories }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// Step 2: For uncached titles, check P31 cache
		let allP31Values: Record<string, string[]> = {};
		let uncachedP31Titles = titlesToClassify;

		if (supabase) {
			const cacheResult = await checkCache(supabase, titlesToClassify);
			allP31Values = { ...cacheResult.cached };
			uncachedP31Titles = cacheResult.uncached;
		}

		// Step 3: Resolve Wikipedia redirects for uncached titles
		// This ensures "Byzantine" resolves to "Byzantine Empire" etc.
		let redirectMap: Record<string, string> = {};
		if (uncachedP31Titles.length > 0) {
			for (let i = 0; i < uncachedP31Titles.length; i += WIKIDATA_BATCH_SIZE) {
				const batch = uncachedP31Titles.slice(i, i + WIKIDATA_BATCH_SIZE);
				const batchRedirects = await resolveWikipediaRedirects(batch);
				Object.assign(redirectMap, batchRedirects);
			}
		}

		// Step 4: Fetch P31 values from Wikidata for uncached titles (using resolved titles)
		if (uncachedP31Titles.length > 0) {
			const fetchedP31: Record<string, string[]> = {};

			// Get unique resolved titles
			const resolvedTitles = [...new Set(Object.values(redirectMap))];

			// Process in batches of 50 (Wikidata API limit)
			for (let i = 0; i < resolvedTitles.length; i += WIKIDATA_BATCH_SIZE) {
				const batch = resolvedTitles.slice(i, i + WIKIDATA_BATCH_SIZE);
				const batchResults = await fetchP31FromWikidata(batch);
				Object.assign(fetchedP31, batchResults);
			}

			// Map results back to original titles
			for (const originalTitle of uncachedP31Titles) {
				const resolvedTitle = redirectMap[originalTitle] || originalTitle;
				if (fetchedP31[resolvedTitle]) {
					allP31Values[originalTitle] = fetchedP31[resolvedTitle];
				} else if (fetchedP31[resolvedTitle.replace(/ /g, '_')]) {
					allP31Values[originalTitle] = fetchedP31[resolvedTitle.replace(/ /g, '_')];
				}
			}

			// Also store under resolved titles for cache
			Object.assign(allP31Values, fetchedP31);

			// Update P31 cache in background
			if (supabase && Object.keys(fetchedP31).length > 0) {
				updateCache(supabase, fetchedP31);
			}
		}

		// Step 4: Classify articles and identify blocked ones
		const titlesNeedingWikipediaFallback: string[] = [];

		for (const title of titlesToClassify) {
			// IMPORTANT: Never block the target article (victory condition)
			if (isTargetArticle(title)) {
				blockedLinks[title] = null;
				continue;
			}

			const p31Values = allP31Values[title] || allP31Values[title.replace(/ /g, '_')] || [];

			if (p31Values.length === 0) {
				// No P31 values - will need Wikipedia category fallback
				titlesNeedingWikipediaFallback.push(title);
				blockedLinks[title] = null; // Placeholder
			} else {
				// Get the category for caching
				const category = getArticleCategory(p31Values);
				newCategoryClassifications[title] = category;

				// Check if blocked
				if (category && blockedCategories.includes(category)) {
					blockedLinks[title] = category;
				} else {
					blockedLinks[title] = null;
				}
			}
		}

		// Step 5: Wikipedia category fallback for articles without P31
		if (titlesNeedingWikipediaFallback.length > 0) {
			for (let i = 0; i < titlesNeedingWikipediaFallback.length; i += WIKIDATA_BATCH_SIZE) {
				const batch = titlesNeedingWikipediaFallback.slice(i, i + WIKIDATA_BATCH_SIZE);
				const wikiCategories = await fetchWikipediaCategories(batch);

				for (const title of batch) {
					// IMPORTANT: Never block the target article (victory condition)
					if (isTargetArticle(title)) {
						blockedLinks[title] = null;
						continue;
					}

					const categories = wikiCategories[title] || wikiCategories[title.replace(/ /g, '_')] || [];
					if (categories.length > 0) {
						// Get the category for caching
						const category = getWikipediaCategoryClassification(categories);
						newCategoryClassifications[title] = category;

						// Check if blocked
						if (category && blockedCategories.includes(category)) {
							blockedLinks[title] = category;
						} else {
							blockedLinks[title] = null;
						}
					} else {
						// No categories found - cache as null
						newCategoryClassifications[title] = null;
					}
				}
			}
		}

		// Step 6: Cache the new category classifications (fire and forget)
		if (supabase && Object.keys(newCategoryClassifications).length > 0) {
			updateCategoryCache(supabase, newCategoryClassifications);
		}

		// Build categories map (all categories, not just blocked)
		const categories: Record<string, string | null> = {};

		// Add cached categories
		if (supabase) {
			const categoryCache = await checkCategoryCache(supabase, titles);
			for (const [title, category] of Object.entries(categoryCache.cached)) {
				categories[title] = category;
			}
		}

		// Add newly classified categories
		for (const [title, category] of Object.entries(newCategoryClassifications)) {
			categories[title] = category;
		}

		return new Response(JSON.stringify({ blockedLinks, categories }), {
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
