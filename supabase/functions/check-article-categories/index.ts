import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';

// Category keywords for mapping Wikipedia categories to top-level categories
const CATEGORY_KEYWORDS: Record<string, string[]> = {
	Religion: [
		'church',
		'saint',
		'bishop',
		'christian',
		'orthodox',
		'catholic',
		'theology',
		'priest',
		'muslim',
		'buddhist',
		'jewish',
		'religion',
		'religious',
		'monastery',
		'pope',
		'god',
		'jesus',
		'bible'
	],
	History: [
		'empire',
		'ancient',
		'war',
		'century',
		'dynasty',
		'medieval',
		'kingdom',
		'roman',
		'byzantine',
		'battle',
		'civilization',
		'history',
		'historical'
	],
	People: [
		'born',
		'died',
		'people',
		'person',
		'living',
		'deaths',
		'births',
		'politician',
		'writer',
		'artist',
		'scientist'
	],
	Philosophy: ['philosophy', 'philosopher', 'epistemology', 'metaphysics', 'ethics', 'logic'],
	Culture: [
		'culture',
		'cultural',
		'tradition',
		'customs',
		'festival',
		'ceremony',
		'folklore',
		'mythology'
	],
	Education: [
		'university',
		'school',
		'college',
		'education',
		'academic',
		'student',
		'professor',
		'alumni'
	],
	Society: ['society', 'social', 'community', 'organization', 'movement', 'group'],
	Geography: [
		'city',
		'country',
		'river',
		'region',
		'mountain',
		'island',
		'capital',
		'province',
		'ocean',
		'sea',
		'lake',
		'geography'
	],
	Humanities: ['humanities', 'arts', 'literature', 'linguistics'],
	Language: ['language', 'linguistic', 'grammar', 'vocabulary', 'dialect', 'writing'],
	Government: [
		'government',
		'politics',
		'political',
		'ministry',
		'parliament',
		'congress',
		'democracy',
		'election'
	],
	Law: ['law', 'legal', 'court', 'judge', 'attorney', 'legislation', 'constitution', 'crime']
};

// Map a specific Wikipedia category to a top-level category using keyword matching
function mapToTopLevelCategory(categoryTitle: string): string | null {
	const categoryLower = categoryTitle.toLowerCase();

	for (const [topLevel, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
		for (const keyword of keywords) {
			if (categoryLower.includes(keyword)) {
				return topLevel;
			}
		}
	}

	return null;
}

// Fetch categories for multiple articles in batch (max 50 per request)
async function fetchCategoriesForArticles(
	titles: string[]
): Promise<Record<string, string[]>> {
	const params = new URLSearchParams({
		action: 'query',
		prop: 'categories',
		titles: titles.join('|'),
		cllimit: '20',
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
			result[page.title] = page.categories.map(
				(cat: { title: string }) => cat.title.replace('Category:', '')
			);
		}
	}

	return result;
}

// Check which articles belong to blocked categories
function checkBlockedArticles(
	articleCategories: Record<string, string[]>,
	blockedCategories: string[]
): Record<string, string | null> {
	const result: Record<string, string | null> = {};

	for (const [title, categories] of Object.entries(articleCategories)) {
		let blockedCategory: string | null = null;

		for (const cat of categories) {
			const topLevel = mapToTopLevelCategory(cat);
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

		// Batch titles into groups of 50 (Wikipedia API limit)
		const batches: string[][] = [];
		for (let i = 0; i < titles.length; i += 50) {
			batches.push(titles.slice(i, i + 50));
		}

		// Fetch categories for all batches
		const allCategories: Record<string, string[]> = {};
		for (const batch of batches) {
			const batchCategories = await fetchCategoriesForArticles(batch);
			Object.assign(allCategories, batchCategories);
		}

		// Check which articles are blocked
		const blockedLinks = checkBlockedArticles(allCategories, blockedCategories);

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
