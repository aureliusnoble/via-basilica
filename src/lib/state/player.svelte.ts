import { browser } from '$app/environment';
import type { PlayerPowerup, DailyChallenge } from '$lib/types/database.js';
import { getPlayerPowerups } from '$lib/api/powerups.js';
import { getAuthState } from './auth.svelte.js';

// Player state using Svelte 5 runes
let powerups = $state<PlayerPowerup[]>([]);
let powerupsLoading = $state(false);

export function getPlayerState() {
	return {
		get powerups() {
			return powerups;
		},
		get powerupsLoading() {
			return powerupsLoading;
		}
	};
}

export async function loadPlayerPowerups() {
	const auth = getAuthState();
	if (!auth.user) return;

	powerupsLoading = true;

	try {
		const data = await getPlayerPowerups(auth.user.id);
		powerups = data;
	} catch (error) {
		console.error('Error loading powerups:', error);
	} finally {
		powerupsLoading = false;
	}
}

export function getPowerupQuantity(powerupId: string): number {
	const powerup = powerups.find((p) => p.powerup_id === powerupId);
	return powerup?.quantity || 0;
}

export function decrementLocalPowerup(powerupId: string) {
	powerups = powerups.map((p) =>
		p.powerup_id === powerupId ? { ...p, quantity: Math.max(0, p.quantity - 1) } : p
	);
}

export function incrementLocalPowerup(powerupId: string, userId: string) {
	const existing = powerups.find((p) => p.powerup_id === powerupId);
	if (existing) {
		powerups = powerups.map((p) =>
			p.powerup_id === powerupId ? { ...p, quantity: p.quantity + 1 } : p
		);
	} else {
		powerups = [
			...powerups,
			{
				user_id: userId,
				powerup_id: powerupId,
				quantity: 1,
				updated_at: new Date().toISOString()
			}
		];
	}
}
