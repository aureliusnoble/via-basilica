import { format, formatDistanceToNow, parseISO, differenceInSeconds } from 'date-fns';

export function formatDate(date: string | Date): string {
	const d = typeof date === 'string' ? parseISO(date) : date;
	return format(d, 'MMM d, yyyy');
}

export function formatTime(date: string | Date): string {
	const d = typeof date === 'string' ? parseISO(date) : date;
	return format(d, 'h:mm a');
}

export function formatDateTime(date: string | Date): string {
	const d = typeof date === 'string' ? parseISO(date) : date;
	return format(d, 'MMM d, yyyy h:mm a');
}

export function formatRelative(date: string | Date): string {
	const d = typeof date === 'string' ? parseISO(date) : date;
	return formatDistanceToNow(d, { addSuffix: true });
}

export function formatDuration(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDurationLong(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;

	if (mins === 0) {
		return `${secs} second${secs !== 1 ? 's' : ''}`;
	}

	if (secs === 0) {
		return `${mins} minute${mins !== 1 ? 's' : ''}`;
	}

	return `${mins}m ${secs}s`;
}

export function getTodayString(): string {
	return format(new Date(), 'yyyy-MM-dd');
}

export function calculateDuration(start: string | Date, end: string | Date): number {
	const startDate = typeof start === 'string' ? parseISO(start) : start;
	const endDate = typeof end === 'string' ? parseISO(end) : end;
	return differenceInSeconds(endDate, startDate);
}
