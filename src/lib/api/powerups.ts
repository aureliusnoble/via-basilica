import { getSupabase } from './supabase.js';
import type { PlayerPowerup, PowerupDefinition } from '$lib/types/database.js';

export async function getPlayerPowerups(userId: string): Promise<PlayerPowerup[]> {
	const supabase = getSupabase();

	const { data, error } = await supabase
		.from('player_powerups')
		.select('*')
		.eq('user_id', userId);

	if (error) {
		console.error('Error fetching player powerups:', error);
		return [];
	}

	return data || [];
}

export async function getPowerupDefinitions(): Promise<PowerupDefinition[]> {
	const supabase = getSupabase();

	const { data, error } = await supabase
		.from('powerup_definitions')
		.select('*')
		.order('point_cost', { ascending: true });

	if (error) {
		console.error('Error fetching powerup definitions:', error);
		return [];
	}

	return data || [];
}

export async function purchasePowerup(
	powerupId: string
): Promise<{ success: boolean; error?: string }> {
	const supabase = getSupabase();

	const { data, error } = await supabase.functions.invoke('purchase-powerup', {
		body: { powerup_id: powerupId }
	});

	if (error) {
		return { success: false, error: error.message };
	}

	return { success: true };
}

export async function getDailyPowerupSelection(
	userId: string,
	challengeDate: string
): Promise<{ slot_1: string | null; slot_2: string | null }> {
	const supabase = getSupabase();

	const { data, error } = await supabase
		.from('daily_powerup_selections')
		.select('slot_1, slot_2')
		.eq('user_id', userId)
		.eq('challenge_date', challengeDate)
		.single();

	if (error || !data) {
		return { slot_1: null, slot_2: null };
	}

	return data;
}

export async function saveDailyPowerupSelection(
	userId: string,
	challengeDate: string,
	slot1: string | null,
	slot2: string | null
): Promise<{ success: boolean; error?: string }> {
	const supabase = getSupabase();

	const { error } = await supabase.from('daily_powerup_selections').upsert(
		{
			user_id: userId,
			challenge_date: challengeDate,
			slot_1: slot1,
			slot_2: slot2
		},
		{
			onConflict: 'user_id,challenge_date'
		}
	);

	if (error) {
		return { success: false, error: error.message };
	}

	return { success: true };
}

export async function decrementPowerup(
	userId: string,
	powerupId: string
): Promise<{ success: boolean; error?: string }> {
	const supabase = getSupabase();

	// Get current quantity
	const { data: current, error: fetchError } = await supabase
		.from('player_powerups')
		.select('quantity')
		.eq('user_id', userId)
		.eq('powerup_id', powerupId)
		.single();

	if (fetchError || !current || current.quantity <= 0) {
		return { success: false, error: 'No powerups available' };
	}

	// Decrement
	const { error } = await supabase
		.from('player_powerups')
		.update({ quantity: current.quantity - 1, updated_at: new Date().toISOString() })
		.eq('user_id', userId)
		.eq('powerup_id', powerupId);

	if (error) {
		return { success: false, error: error.message };
	}

	return { success: true };
}
