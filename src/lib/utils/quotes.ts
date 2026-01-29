import quotes from '$lib/data/quotes.json';

export function getQuoteForChallenge(challengeNumber: number): string {
	const index = challengeNumber % quotes.length;
	return quotes[index];
}

export function getRandomQuote(): string {
	const index = Math.floor(Math.random() * quotes.length);
	return quotes[index];
}

export function getAllQuotes(): string[] {
	return quotes;
}

export function getQuoteCount(): number {
	return quotes.length;
}
