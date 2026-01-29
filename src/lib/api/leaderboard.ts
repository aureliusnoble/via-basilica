import { getSupabase } from './supabase.js';
import type { LeaderboardEntry } from '$lib/types/database.js';
import { format, startOfMonth, subDays } from 'date-fns';

export type LeaderboardType = 'daily' | 'monthly-total' | 'monthly-average';

export async function getDailyLeaderboard(date?: string): Promise<LeaderboardEntry[]> {
	const supabase = getSupabase();
	const targetDate = date || format(new Date(), 'yyyy-MM-dd');

	const { data, error } = await supabase
		.from('game_results')
		.select(
			`
			user_id,
			hops,
			duration_seconds,
			points_awarded,
			path,
			powerups_used,
			profiles!inner(username, display_name, avatar_url),
			daily_powerup_selections(slot_1, slot_2)
		`
		)
		.eq('mode', 'daily')
		.eq('verified', true)
		.not('completed_at', 'is', null)
		.order('hops', { ascending: true })
		.order('duration_seconds', { ascending: true })
		.limit(100);

	if (error) {
		console.error('Error fetching daily leaderboard:', error);
		return [];
	}

	return (data || []).map((row: any) => ({
		user_id: row.user_id,
		username: row.profiles.username,
		display_name: row.profiles.display_name,
		avatar_url: row.profiles.avatar_url,
		hops: row.hops,
		duration_seconds: row.duration_seconds,
		points_awarded: row.points_awarded,
		path: row.path,
		powerups_used: row.powerups_used,
		slot_1: row.daily_powerup_selections?.[0]?.slot_1 || null,
		slot_2: row.daily_powerup_selections?.[0]?.slot_2 || null
	}));
}

// Get monthly total points leaderboard
// Points are assigned daily based on percentile: top 1% = 25pts, top 5% = 15pts, top 25% = 5pts
export async function getMonthlyTotalLeaderboard(): Promise<LeaderboardEntry[]> {
	const supabase = getSupabase();
	const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
	const today = format(new Date(), 'yyyy-MM-dd');
	const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

	// Get current month's total points per user
	const { data: currentData, error: currentError } = await supabase
		.from('game_results')
		.select(
			`
			user_id,
			points_awarded,
			profiles!inner(username, display_name, avatar_url)
		`
		)
		.eq('mode', 'daily')
		.eq('verified', true)
		.not('completed_at', 'is', null)
		.gte('completed_at', monthStart)
		.lte('completed_at', today + 'T23:59:59');

	if (currentError) {
		console.error('Error fetching monthly leaderboard:', currentError);
		return [];
	}

	// Aggregate by user
	const userTotals = new Map<string, {
		user_id: string;
		username: string;
		display_name: string | null;
		avatar_url: string | null;
		total_points: number;
		games_played: number;
	}>();

	for (const row of currentData || []) {
		const existing = userTotals.get(row.user_id);
		if (existing) {
			existing.total_points += row.points_awarded;
			existing.games_played += 1;
		} else {
			const profile = row.profiles as any;
			userTotals.set(row.user_id, {
				user_id: row.user_id,
				username: profile.username,
				display_name: profile.display_name,
				avatar_url: profile.avatar_url,
				total_points: row.points_awarded,
				games_played: 1
			});
		}
	}

	// Sort by total points
	const sorted = Array.from(userTotals.values()).sort((a, b) => b.total_points - a.total_points);

	// Get yesterday's rankings for position change
	const yesterdayRanks = await getYesterdayRanks('total', monthStart, yesterday);

	return sorted.map((row, index) => {
		const currentRank = index + 1;
		const yesterdayRank = yesterdayRanks.get(row.user_id);
		let position_change: number | undefined;

		if (yesterdayRank === undefined) {
			position_change = undefined; // New entry
		} else {
			position_change = yesterdayRank - currentRank; // Positive = moved up
		}

		return {
			user_id: row.user_id,
			username: row.username,
			display_name: row.display_name,
			avatar_url: row.avatar_url,
			hops: 0,
			duration_seconds: 0,
			points_awarded: row.total_points,
			games_played: row.games_played,
			path: [],
			powerups_used: [],
			slot_1: null,
			slot_2: null,
			position_change
		};
	});
}

// Get monthly average points leaderboard
export async function getMonthlyAverageLeaderboard(): Promise<LeaderboardEntry[]> {
	const supabase = getSupabase();
	const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
	const today = format(new Date(), 'yyyy-MM-dd');
	const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

	// Get current month's points per user
	const { data: currentData, error: currentError } = await supabase
		.from('game_results')
		.select(
			`
			user_id,
			points_awarded,
			profiles!inner(username, display_name, avatar_url)
		`
		)
		.eq('mode', 'daily')
		.eq('verified', true)
		.not('completed_at', 'is', null)
		.gte('completed_at', monthStart)
		.lte('completed_at', today + 'T23:59:59');

	if (currentError) {
		console.error('Error fetching monthly average leaderboard:', currentError);
		return [];
	}

	// Aggregate by user
	const userTotals = new Map<string, {
		user_id: string;
		username: string;
		display_name: string | null;
		avatar_url: string | null;
		total_points: number;
		games_played: number;
	}>();

	for (const row of currentData || []) {
		const existing = userTotals.get(row.user_id);
		if (existing) {
			existing.total_points += row.points_awarded;
			existing.games_played += 1;
		} else {
			const profile = row.profiles as any;
			userTotals.set(row.user_id, {
				user_id: row.user_id,
				username: profile.username,
				display_name: profile.display_name,
				avatar_url: profile.avatar_url,
				total_points: row.points_awarded,
				games_played: 1
			});
		}
	}

	// Calculate averages and sort
	const withAverages = Array.from(userTotals.values()).map(row => ({
		...row,
		average_points: row.total_points / row.games_played
	}));

	const sorted = withAverages.sort((a, b) => b.average_points - a.average_points);

	// Get yesterday's rankings for position change
	const yesterdayRanks = await getYesterdayRanks('average', monthStart, yesterday);

	return sorted.map((row, index) => {
		const currentRank = index + 1;
		const yesterdayRank = yesterdayRanks.get(row.user_id);
		let position_change: number | undefined;

		if (yesterdayRank === undefined) {
			position_change = undefined; // New entry
		} else {
			position_change = yesterdayRank - currentRank; // Positive = moved up
		}

		return {
			user_id: row.user_id,
			username: row.username,
			display_name: row.display_name,
			avatar_url: row.avatar_url,
			hops: 0,
			duration_seconds: 0,
			points_awarded: row.total_points,
			games_played: row.games_played,
			average_hops: row.average_points,
			path: [],
			powerups_used: [],
			slot_1: null,
			slot_2: null,
			position_change
		};
	});
}

// Helper to get yesterday's rankings for position change calculation
async function getYesterdayRanks(
	type: 'total' | 'average',
	monthStart: string,
	yesterday: string
): Promise<Map<string, number>> {
	const supabase = getSupabase();
	const ranks = new Map<string, number>();

	const { data, error } = await supabase
		.from('game_results')
		.select('user_id, points_awarded')
		.eq('mode', 'daily')
		.eq('verified', true)
		.not('completed_at', 'is', null)
		.gte('completed_at', monthStart)
		.lte('completed_at', yesterday + 'T23:59:59');

	if (error || !data) {
		return ranks;
	}

	// Aggregate by user
	const userTotals = new Map<string, { total: number; count: number }>();
	for (const row of data) {
		const existing = userTotals.get(row.user_id);
		if (existing) {
			existing.total += row.points_awarded;
			existing.count += 1;
		} else {
			userTotals.set(row.user_id, { total: row.points_awarded, count: 1 });
		}
	}

	// Sort based on type
	const entries = Array.from(userTotals.entries());
	if (type === 'total') {
		entries.sort((a, b) => b[1].total - a[1].total);
	} else {
		entries.sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count));
	}

	// Assign ranks
	entries.forEach(([userId], index) => {
		ranks.set(userId, index + 1);
	});

	return ranks;
}
