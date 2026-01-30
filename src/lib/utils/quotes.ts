import quotes from '$lib/data/quotes.json';

export function getQuoteForChallenge(challengeNumber: number): string {
	const index = challengeNumber % quotes.length;
	return quotes[index];
}

export function getDailyQuote(): string {
	// Calculate a consistent daily index based on days since epoch
	const today = new Date();
	const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
	const index = daysSinceEpoch % quotes.length;
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
