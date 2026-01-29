import { browser } from '$app/environment';

export function getItem<T>(key: string, defaultValue: T): T {
	if (!browser) return defaultValue;

	try {
		const item = localStorage.getItem(key);
		if (item === null) return defaultValue;
		return JSON.parse(item);
	} catch {
		return defaultValue;
	}
}

export function setItem<T>(key: string, value: T): void {
	if (!browser) return;

	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (error) {
		console.error('Error saving to localStorage:', error);
	}
}

export function removeItem(key: string): void {
	if (!browser) return;

	try {
		localStorage.removeItem(key);
	} catch (error) {
		console.error('Error removing from localStorage:', error);
	}
}

export function clearAll(): void {
	if (!browser) return;

	try {
		const keysToKeep = ['via_basilica_theme'];
		const savedValues: Record<string, string> = {};

		keysToKeep.forEach((key) => {
			const value = localStorage.getItem(key);
			if (value) savedValues[key] = value;
		});

		localStorage.clear();

		Object.entries(savedValues).forEach(([key, value]) => {
			localStorage.setItem(key, value);
		});
	} catch (error) {
		console.error('Error clearing localStorage:', error);
	}
}
