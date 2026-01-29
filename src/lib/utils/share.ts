import type { PathStep } from '$lib/types/database.js';

export function generateShareText(
	challengeNumber: number,
	hops: number,
	durationSeconds: number,
	startArticle: string,
	path: PathStep[]
): string {
	const minutes = Math.floor(durationSeconds / 60);
	const seconds = durationSeconds % 60;
	const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

	// Generate path visualization with colored blocks
	// Using simple blocks since we can't compute category overlap client-side easily
	const pathBlocks = path.slice(1).map(() => '🟨').join(' ');

	return `Via Basilica #${challengeNumber}
${hops} hops in ${timeStr}

Start: ${startArticle}
Path: ${pathBlocks}

viabasilica.github.io`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		// Fallback for older browsers
		const textArea = document.createElement('textarea');
		textArea.value = text;
		textArea.style.position = 'fixed';
		textArea.style.left = '-999999px';
		document.body.appendChild(textArea);
		textArea.select();

		try {
			document.execCommand('copy');
			document.body.removeChild(textArea);
			return true;
		} catch {
			document.body.removeChild(textArea);
			return false;
		}
	}
}

export async function shareResult(
	challengeNumber: number,
	hops: number,
	durationSeconds: number,
	startArticle: string,
	path: PathStep[]
): Promise<boolean> {
	const text = generateShareText(challengeNumber, hops, durationSeconds, startArticle, path);

	// Try native share if available
	if (navigator.share) {
		try {
			await navigator.share({
				title: 'Via Basilica',
				text
			});
			return true;
		} catch {
			// User cancelled or error, fall back to clipboard
		}
	}

	return copyToClipboard(text);
}
