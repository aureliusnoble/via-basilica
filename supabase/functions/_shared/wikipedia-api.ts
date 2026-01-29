const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';

export interface RandomArticle {
	title: string;
	pageid: number;
}

export async function fetchRandomArticles(count: number = 5): Promise<RandomArticle[]> {
	const params = new URLSearchParams({
		action: 'query',
		list: 'random',
		rnnamespace: '0',
		rnlimit: count.toString(),
		format: 'json'
	});

	const response = await fetch(`${WIKIPEDIA_API}?${params}`);
	const data = await response.json();

	return data.query?.random || [];
}

export async function fetchArticleInfo(title: string): Promise<{
	length: number;
	categories: string[];
	linksCount: number;
	isStub: boolean;
	isDisambiguation: boolean;
}> {
	const params = new URLSearchParams({
		action: 'query',
		prop: 'revisions|categories|links',
		titles: title,
		rvprop: 'size',
		cllimit: '20',
		pllimit: '50',
		format: 'json'
	});

	const response = await fetch(`${WIKIPEDIA_API}?${params}`);
	const data = await response.json();

	const pages = data.query?.pages;
	if (!pages) {
		return { length: 0, categories: [], linksCount: 0, isStub: false, isDisambiguation: false };
	}

	const pageId = Object.keys(pages)[0];
	const page = pages[pageId];

	const categories = (page.categories || []).map((c: { title: string }) => c.title);
	const isStub = categories.some((c: string) => c.toLowerCase().includes('stub'));
	const isDisambiguation = categories.some((c: string) =>
		c.toLowerCase().includes('disambiguation')
	);

	return {
		length: page.revisions?.[0]?.size || 0,
		categories,
		linksCount: page.links?.length || 0,
		isStub,
		isDisambiguation
	};
}

// All valid target article names for link verification (complete list from Wikipedia redirects)
const TARGET_LINK_VARIANTS = [
	'Basil of Caesarea',
	'Basil the Great',
	'St. Basil the Great',
	'Saint Basil',
	'Saint Basil the Great',
	'St. Basil',
	'St Basil',
	'St. Basil of Caesarea',
	'Saint Basil of Caesarea',
	'Saint Basil\'s day',
	'Basil of Cesareea',
	'St Basil the Great',
	'St Basil The Great',
	'Basil, Saint',
	'Basil, Saint Bishop of Caesarea',
	'Basil of Cappadocia',
	'Basil of Neocaesarea'
];

function isTargetTitle(title: string): boolean {
	const normalized = title.toLowerCase().replace(/_/g, ' ');
	return TARGET_LINK_VARIANTS.some(t => t.toLowerCase() === normalized);
}

export async function verifyLinkExists(fromTitle: string, toTitle: string): Promise<boolean> {
	// Normalize titles: Wikipedia API uses spaces, but we store with underscores
	const normalizedFrom = fromTitle.replace(/_/g, ' ');
	const normalizedTo = toTitle.replace(/_/g, ' ');

	// If this is a link to the target article, check all variants
	const titlesToCheck = isTargetTitle(normalizedTo)
		? TARGET_LINK_VARIANTS
		: [normalizedTo];

	const params = new URLSearchParams({
		action: 'query',
		prop: 'links',
		titles: normalizedFrom,
		pltitles: titlesToCheck.join('|'),
		format: 'json'
	});

	const response = await fetch(`${WIKIPEDIA_API}?${params}`);
	const data = await response.json();

	const pages = data.query?.pages;
	if (!pages) return false;

	const pageId = Object.keys(pages)[0];
	const links = pages[pageId]?.links || [];

	// Check if any of the target variants exist as links
	const titlesToCheckLower = titlesToCheck.map(t => t.toLowerCase());
	return links.some((link: { title: string }) =>
		titlesToCheckLower.includes(link.title.toLowerCase())
	);
}

// Fetch backlinks (pages that link TO the given article)
export async function fetchBacklinks(title: string, limit: number = 50): Promise<string[]> {
	const normalizedTitle = title.replace(/_/g, ' ');

	const params = new URLSearchParams({
		action: 'query',
		list: 'backlinks',
		bltitle: normalizedTitle,
		blnamespace: '0', // Main namespace only
		bllimit: limit.toString(),
		format: 'json'
	});

	const response = await fetch(`${WIKIPEDIA_API}?${params}`);
	const data = await response.json();

	const backlinks = data.query?.backlinks || [];
	return backlinks.map((bl: { title: string }) => bl.title);
}
