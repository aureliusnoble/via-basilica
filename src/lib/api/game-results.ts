import { getSupabase } from './supabase.js';
import type { GameResult, GameMode, PathStep } from '$lib/types/database.js';

export async function createGameResult(
	userId: string,
	mode: GameMode,
	startArticle: string,
	challengeId: number | null
): Promise<GameResult | null> {
	const supabase = getSupabase();

	const { data, error } = await supabase
		.from('game_results')
		.insert({
			user_id: userId,
			mode,
			start_article: startArticle,
			challenge_id: challengeId,
			hops: 0,
			path: [],
			powerups_used: [],
			started_at: new Date().toISOString(),
			points_awarded: 0,
			verified: false
		})
		.select()
		.single();

	if (error) {
		console.error('Error creating game result:', error);
		return null;
	}

	return data;
}

export async function updateGameResult(
	gameId: string,
	updates: {
		hops?: number;
		path?: PathStep[];
		powerups_used?: any[];
		completed_at?: string;
		duration_seconds?: number;
	}
): Promise<boolean> {
	const supabase = getSupabase();

	const { error } = await supabase.from('game_results').update(updates).eq('id', gameId);

	if (error) {
		console.error('Error updating game result:', error);
		return false;
	}

	return true;
}

export async function completeGameResult(
	gameId: string,
	finalPath: PathStep[],
	hops: number,
	durationSeconds: number
): Promise<{ success: boolean; verified: boolean; pointsAwarded: number }> {
	const supabase = getSupabase();

	// Update the result
	const { error: updateError } = await supabase
		.from('game_results')
		.update({
			hops,
			path: finalPath,
			powerups_used: [],
			completed_at: new Date().toISOString(),
			duration_seconds: durationSeconds
		})
		.eq('id', gameId);

	if (updateError) {
		console.error('Error completing game result:', updateError);
		return { success: false, verified: false, pointsAwarded: 0 };
	}

	// Call verification edge function
	const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
		'verify-game-result',
		{
			body: { game_id: gameId }
		}
	);

	if (verifyError) {
		console.error('Error verifying game result:', verifyError);
		return { success: true, verified: false, pointsAwarded: 0 };
	}

	return {
		success: true,
		verified: verifyData?.verified || false,
		pointsAwarded: verifyData?.points_awarded || 0
	};
}

export async function getTodaysResult(userId: string, challengeId?: number): Promise<GameResult | null> {
	const supabase = getSupabase();

	// If challengeId not provided, we can't look up today's result
	if (!challengeId) {
		return null;
	}

	const { data, error } = await supabase
		.from('game_results')
		.select('*')
		.eq('user_id', userId)
		.eq('mode', 'daily')
		.eq('challenge_id', challengeId)
		.single();

	if (error) {
		// No result found is not an error
		if (error.code === 'PGRST116') return null;
		console.error('Error fetching today result:', error);
		return null;
	}

	return data;
}

export async function getUserGameHistory(userId: string, limit: number = 20): Promise<GameResult[]> {
	const supabase = getSupabase();

	const { data, error } = await supabase
		.from('game_results')
		.select('*')
		.eq('user_id', userId)
		.not('completed_at', 'is', null)
		.order('completed_at', { ascending: false })
		.limit(limit);

	if (error) {
		console.error('Error fetching game history:', error);
		return [];
	}

	return data || [];
}

export async function hasCompletedChallenge(
	userId: string,
	challengeId: number
): Promise<boolean> {
	const supabase = getSupabase();

	const { data, error } = await supabase
		.from('game_results')
		.select('id')
		.eq('user_id', userId)
		.eq('challenge_id', challengeId)
		.eq('mode', 'daily')
		.not('completed_at', 'is', null)
		.limit(1);

	if (error) {
		console.error('Error checking challenge completion:', error);
		return false;
	}

	return (data?.length || 0) > 0;
}

export async function awardXp(userId: string, xpEarned: number): Promise<boolean> {
	const supabase = getSupabase();

	const { error } = await supabase.rpc('update_player_xp', {
		p_user_id: userId,
		p_xp_earned: xpEarned
	});

	if (error) {
		console.error('Error awarding XP:', error);
		return false;
	}

	return true;
}

export async function getUserDailyRank(
	userId: string,
	challengeId: number
): Promise<number | null> {
	const supabase = getSupabase();

	// Get all verified results for this challenge, ordered by ranking criteria
	const { data, error } = await supabase
		.from('game_results')
		.select('user_id, hops, duration_seconds')
		.eq('mode', 'daily')
		.eq('challenge_id', challengeId)
		.eq('verified', true)
		.not('completed_at', 'is', null)
		.order('hops', { ascending: true })
		.order('duration_seconds', { ascending: true });

	if (error) {
		console.error('Error fetching daily rank:', error);
		return null;
	}

	if (!data) return null;

	// Find user's position (1-indexed)
	const rank = data.findIndex((row) => row.user_id === userId) + 1;
	return rank > 0 ? rank : null;
}
