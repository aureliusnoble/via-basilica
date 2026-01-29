export interface WikipediaArticle {
	title: string;
	html: string;
	extract?: string;
	categories?: string[];
	links?: string[];
}

export interface WikipediaLink {
	title: string;
	href: string;
}

export interface WikipediaCategory {
	title: string;
}

export interface WikipediaBacklink {
	title: string;
	pageid: number;
}

export interface WikipediaExtract {
	title: string;
	extract: string;
}

export interface WikipediaLinksResponse {
	title: string;
	links: string[];
}
