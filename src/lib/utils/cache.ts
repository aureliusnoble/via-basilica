import { browser } from '$app/environment';

interface CacheEntry<T> {
	data: T;
	expiresAt: number;
}

const CACHE_PREFIX = 'via_basilica_cache_';

export function getCached<T>(key: string): T | null {
	if (!browser) return null;

	try {
		const raw = localStorage.getItem(CACHE_PREFIX + key);
		if (!raw) return null;

		const entry: CacheEntry<T> = JSON.parse(raw);

		if (Date.now() > entry.expiresAt) {
			localStorage.removeItem(CACHE_PREFIX + key);
			return null;
		}

		return entry.data;
	} catch {
		return null;
	}
}

export function setCache<T>(key: string, data: T, ttlMs: number): void {
	if (!browser) return;

	try {
		const entry: CacheEntry<T> = {
			data,
			expiresAt: Date.now() + ttlMs
		};
		localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
	} catch {
		// Ignore storage errors (quota exceeded, etc.)
	}
}

export function clearCache(key: string): void {
	if (!browser) return;
	localStorage.removeItem(CACHE_PREFIX + key);
}

export function getTTLUntilEndOfDay(): number {
	const now = new Date();
	const endOfDay = new Date(now);
	endOfDay.setHours(23, 59, 59, 999);
	return endOfDay.getTime() - now.getTime();
}

export function getTTLUntilMidnight(): number {
	const now = new Date();
	const midnight = new Date(now);
	midnight.setDate(midnight.getDate() + 1);
	midnight.setHours(0, 0, 0, 0);
	return midnight.getTime() - now.getTime();
}
