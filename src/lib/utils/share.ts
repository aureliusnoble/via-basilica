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

	// Generate path as vertical list with icons
	const pathList = path.map((step, i) => {
		const title = step.article_title.replace(/_/g, ' ');
		if (i === 0) {
			return `📍 ${title}`;
		}
		if (i === path.length - 1) {
			return `☦️ ${title}`;
		}
		return `   ↓\n○ ${title}`;
	}).join('\n   ↓\n');

	return `╔═══════════════════════════════╗
     ☦️  VIA BASILICA #${challengeNumber}
╠═══════════════════════════════╣
  ⏱️ ${timeStr}   •   👣 ${hops} hops
╚═══════════════════════════════╝

${pathList}

🔗 aureliusnoble.github.io/via-basilica`;
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
