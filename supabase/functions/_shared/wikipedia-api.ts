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

export async function verifyLinkExists(fromTitle: string, toTitle: string): Promise<boolean> {
	const params = new URLSearchParams({
		action: 'query',
		prop: 'links',
		titles: fromTitle,
		pltitles: toTitle,
		format: 'json'
	});

	const response = await fetch(`${WIKIPEDIA_API}?${params}`);
	const data = await response.json();

	const pages = data.query?.pages;
	if (!pages) return false;

	const pageId = Object.keys(pages)[0];
	const links = pages[pageId]?.links || [];

	return links.some((link: { title: string }) => link.title === toTitle);
}
