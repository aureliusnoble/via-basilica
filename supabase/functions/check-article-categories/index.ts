import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';

// Maximum depth to traverse up the category tree
const MAX_CATEGORY_DEPTH = 6;

// Our top-level categories mapped to Wikipedia category names
// These are the actual Wikipedia categories we'll look for in the tree
// More specific categories are listed to catch matches earlier in traversal
const TOP_LEVEL_CATEGORIES: Record<string, string[]> = {
	Religion: [
		'Religion',
		'Theology',
		'Religious belief and doctrine',
		'Spirituality',
		'Deities',
		'Religious faiths, traditions, and movements',
		'Christianity',
		'Islam',
		'Buddhism',
		'Hinduism',
		'Judaism',
		'Saints',
		'Popes',
		'Religious leaders',
		// More specific categories to catch earlier
		'Christian saints',
		'Christian martyrs',
		'Christians',
		'Early Christianity',
		'History of Christianity',
		'Christian denominations',
		'Catholic Church',
		'Eastern Orthodox Church',
		'Protestantism',
		'Religious texts',
		'Bible',
		'Quran',
		'Religious buildings',
		'Churches',
		'Mosques',
		'Temples',
		'Monasteries',
		'Clergy',
		'Bishops',
		'Priests',
		'Monks'
	],
	History: [
		'History',
		'History by period',
		'History by region',
		'Historical events',
		'Ancient history',
		'Medieval history',
		'Modern history',
		'Military history',
		'Wars',
		'Empires',
		'Dynasties',
		'Battles',
		'Revolutions',
		'Historical eras'
	],
	People: [
		'People',
		'Living people',
		'Births',
		'Deaths',
		'People by occupation',
		'People by nationality'
	],
	Philosophy: [
		'Philosophy',
		'Philosophical theories',
		'Philosophical concepts',
		'Philosophers',
		'Ethics',
		'Logic',
		'Metaphysics',
		'Epistemology',
		'Philosophy by topic'
	],
	Culture: [
		'Culture',
		'Cultural heritage',
		'Traditions',
		'Folklore',
		'Mythology',
		'Customs',
		'Festivals',
		'Cultural events',
		'Myths',
		'Legends'
	],
	Education: [
		'Education',
		'Educational institutions',
		'Universities and colleges',
		'Schools',
		'Academia',
		'Academic disciplines',
		'Universities',
		'Colleges'
	],
	Society: [
		'Society',
		'Social groups',
		'Organizations',
		'Social movements',
		'Communities',
		'Social institutions'
	],
	Geography: [
		'Geography',
		'Countries',
		'Cities',
		'Capitals',
		'Continents',
		'Regions',
		'Rivers',
		'Mountains',
		'Islands',
		'Oceans',
		'Seas',
		'Lakes',
		'Places',
		'Populated places',
		'Countries by continent',
		'Cities by country',
		'Landforms',
		'Bodies of water'
	],
	Humanities: [
		'Humanities',
		'Arts',
		'Literature',
		'Linguistics',
		'Visual arts',
		'Performing arts',
		'Music',
		'Theatre',
		'Dance',
		'Film'
	],
	Language: [
		'Language',
		'Languages',
		'Linguistics',
		'Grammar',
		'Writing systems',
		'Languages by family'
	],
	Government: [
		'Government',
		'Politics',
		'Political systems',
		'Heads of state',
		'Politicians',
		'Elections',
		'Parliaments',
		'Democracy',
		'Heads of government',
		'Political parties'
	],
	Law: [
		'Law',
		'Legal concepts',
		'Courts',
		'Judges',
		'Crime',
		'Criminal law',
		'Constitutional law',
		'Legal systems',
		'Lawyers'
	]
};

// Build a reverse lookup: Wikipedia category -> our top-level category
const CATEGORY_TO_TOP_LEVEL: Record<string, string> = {};
for (const [topLevel, wikiCategories] of Object.entries(TOP_LEVEL_CATEGORIES)) {
	for (const wikiCat of wikiCategories) {
		CATEGORY_TO_TOP_LEVEL[wikiCat.toLowerCase()] = topLevel;
	}
}

// Cache for category -> top-level mappings (persists during request)
const categoryCache: Record<string, string | null> = {};

// Check if a category name matches one of our top-level categories
function checkDirectMatch(categoryName: string): string | null {
	const lowerName = categoryName.toLowerCase();
	return CATEGORY_TO_TOP_LEVEL[lowerName] || null;
}

// Fetch parent categories for a list of categories
async function fetchParentCategories(categoryNames: string[]): Promise<Record<string, string[]>> {
	if (categoryNames.length === 0) return {};

	const titles = categoryNames.map(name =>
		name.startsWith('Category:') ? name : `Category:${name}`
	);

	const params = new URLSearchParams({
		action: 'query',
		prop: 'categories',
		titles: titles.join('|'),
		cllimit: '50',
		clshow: '!hidden',
		format: 'json'
	});

	const response = await fetch(`${WIKIPEDIA_API}?${params}`);
	const data = await response.json();

	const result: Record<string, string[]> = {};
	const pages = data.query?.pages;
	if (!pages) return result;

	for (const pageId of Object.keys(pages)) {
		const page = pages[pageId];
		if (page.title && page.categories) {
			const categoryName = page.title.replace('Category:', '');
			result[categoryName] = page.categories.map(
				(cat: { title: string }) => cat.title.replace('Category:', '')
			);
		}
	}

	return result;
}

// Traverse up the category tree using BFS to find the closest top-level category match
async function findTopLevelCategory(categoryName: string): Promise<string | null> {
	// Check cache first
	if (categoryName in categoryCache) {
		return categoryCache[categoryName];
	}

	// Check for direct match
	const directMatch = checkDirectMatch(categoryName);
	if (directMatch) {
		categoryCache[categoryName] = directMatch;
		return directMatch;
	}

	// BFS: queue of categories to check, with their depth
	const queue: Array<{ name: string; depth: number }> = [{ name: categoryName, depth: 0 }];
	const visited = new Set<string>([categoryName]);

	while (queue.length > 0) {
		// Process categories at the current depth level
		const currentDepth = queue[0].depth;
		const currentLevel: string[] = [];

		// Gather all categories at this depth
		while (queue.length > 0 && queue[0].depth === currentDepth) {
			currentLevel.push(queue.shift()!.name);
		}

		// Stop if we've gone too deep
		if (currentDepth >= MAX_CATEGORY_DEPTH) {
			break;
		}

		// Fetch parent categories for all categories at this level (batch)
		const parentsMap = await fetchParentCategories(currentLevel);

		// Check all parents for direct matches first
		for (const cat of currentLevel) {
			const parents = parentsMap[cat] || [];
			for (const parent of parents) {
				const match = checkDirectMatch(parent);
				if (match) {
					// Found a match - cache it for the original category and return
					categoryCache[categoryName] = match;
					categoryCache[cat] = match;
					categoryCache[parent] = match;
					return match;
				}
			}
		}

		// No matches at this level - add all unvisited parents to the queue
		for (const cat of currentLevel) {
			const parents = parentsMap[cat] || [];
			for (const parent of parents) {
				if (!visited.has(parent)) {
					visited.add(parent);
					queue.push({ name: parent, depth: currentDepth + 1 });
				}
			}
		}
	}

	// No match found
	categoryCache[categoryName] = null;
	return null;
}

// Fetch direct categories for multiple articles in batch (max 50 per request)
async function fetchCategoriesForArticles(
	titles: string[],
	inputTitles: string[]
): Promise<Record<string, string[]>> {
	const params = new URLSearchParams({
		action: 'query',
		prop: 'categories',
		titles: titles.join('|'),
		cllimit: '50',
		clshow: '!hidden',
		format: 'json',
		redirects: '1'
	});

	const response = await fetch(`${WIKIPEDIA_API}?${params}`);
	const data = await response.json();

	const result: Record<string, string[]> = {};

	// Build a map from normalized titles to input titles
	const normalizedToInput: Record<string, string> = {};
	for (const title of inputTitles) {
		const normalized = title.charAt(0).toUpperCase() + title.slice(1);
		normalizedToInput[normalized] = title;
		normalizedToInput[title] = title;
	}

	// Handle redirects
	const redirectMap: Record<string, string> = {};
	if (data.query?.redirects) {
		for (const redirect of data.query.redirects) {
			redirectMap[redirect.to] = redirect.from;
		}
	}

	// Handle normalized titles
	if (data.query?.normalized) {
		for (const norm of data.query.normalized) {
			normalizedToInput[norm.to] = norm.from;
		}
	}

	const pages = data.query?.pages;
	if (!pages) return result;

	for (const pageId of Object.keys(pages)) {
		const page = pages[pageId];
		if (page.title) {
			const categories = page.categories?.map(
				(cat: { title: string }) => cat.title.replace('Category:', '')
			) || [];

			let originalTitle = page.title;
			if (redirectMap[page.title]) {
				originalTitle = redirectMap[page.title];
			}
			if (normalizedToInput[originalTitle]) {
				originalTitle = normalizedToInput[originalTitle];
			}

			result[originalTitle] = categories;
			if (originalTitle !== page.title) {
				result[page.title] = categories;
			}
		}
	}

	return result;
}

// Check which articles belong to blocked categories using tree traversal
async function checkBlockedArticles(
	articleCategories: Record<string, string[]>,
	blockedCategories: string[]
): Promise<Record<string, string | null>> {
	const result: Record<string, string | null> = {};

	for (const [title, categories] of Object.entries(articleCategories)) {
		let blockedCategory: string | null = null;

		for (const cat of categories) {
			// First check for direct match (fast path)
			const directMatch = checkDirectMatch(cat);
			if (directMatch && blockedCategories.includes(directMatch)) {
				blockedCategory = directMatch;
				break;
			}

			// Otherwise traverse up the tree
			const topLevel = await findTopLevelCategory(cat);
			if (topLevel && blockedCategories.includes(topLevel)) {
				blockedCategory = topLevel;
				break;
			}
		}

		result[title] = blockedCategory;
	}

	return result;
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

		// Clear cache for new request
		Object.keys(categoryCache).forEach(key => delete categoryCache[key]);

		// Batch titles into groups of 50 (Wikipedia API limit)
		const batches: string[][] = [];
		for (let i = 0; i < titles.length; i += 50) {
			batches.push(titles.slice(i, i + 50));
		}

		// Fetch categories for all batches
		const allCategories: Record<string, string[]> = {};
		for (const batch of batches) {
			const batchCategories = await fetchCategoriesForArticles(batch, batch);
			Object.assign(allCategories, batchCategories);
		}

		// Check which articles are blocked (with tree traversal)
		const blockedLinks = await checkBlockedArticles(allCategories, blockedCategories);

		return new Response(JSON.stringify({ blockedLinks }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
});
