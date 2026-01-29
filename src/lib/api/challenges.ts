import { getSupabase } from './supabase.js';
import type { DailyChallenge } from '$lib/types/database.js';
import { format } from 'date-fns';
import { getCached, setCache, getTTLUntilMidnight } from '$lib/utils/cache.js';

const DAILY_CHALLENGE_CACHE_KEY = 'daily_challenge';

export async function getTodaysChallenge(): Promise<DailyChallenge | null> {
	const today = format(new Date(), 'yyyy-MM-dd');

	// Check cache first
	const cached = getCached<DailyChallenge>(DAILY_CHALLENGE_CACHE_KEY);
	if (cached && cached.challenge_date === today) {
		return cached;
	}

	const supabase = getSupabase();

	const { data, error } = await supabase
		.from('daily_challenges')
		.select('*')
		.eq('challenge_date', today)
		.single();

	if (error) {
		console.error('Error fetching daily challenge:', error);
		return null;
	}

	// Cache until midnight
	if (data) {
		setCache(DAILY_CHALLENGE_CACHE_KEY, data, getTTLUntilMidnight());
	}

	return data;
}

export async function getChallengeByDate(date: string): Promise<DailyChallenge | null> {
	const supabase = getSupabase();

	const { data, error } = await supabase
		.from('daily_challenges')
		.select('*')
		.eq('challenge_date', date)
		.single();

	if (error) {
		console.error('Error fetching challenge:', error);
		return null;
	}

	return data;
}

export async function getChallengeById(id: number): Promise<DailyChallenge | null> {
	const supabase = getSupabase();

	const { data, error } = await supabase
		.from('daily_challenges')
		.select('*')
		.eq('id', id)
		.single();

	if (error) {
		console.error('Error fetching challenge:', error);
		return null;
	}

	return data;
}

export async function getArchiveChallenges(): Promise<DailyChallenge[]> {
	const supabase = getSupabase();
	const today = format(new Date(), 'yyyy-MM-dd');

	const { data, error } = await supabase
		.from('daily_challenges')
		.select('*')
		.lt('challenge_date', today)
		.order('challenge_date', { ascending: false })
		.limit(30);

	if (error) {
		console.error('Error fetching archive challenges:', error);
		return [];
	}

	return data || [];
}

export function getChallengeNumber(challenge: DailyChallenge): number {
	return challenge.id;
}
