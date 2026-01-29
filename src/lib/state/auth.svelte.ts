import { browser } from '$app/environment';
import type { Profile } from '$lib/types/database.js';
import { supabase } from '$lib/api/supabase.js';
import type { User, Session } from '$lib/api/auth.js';

// Auth state using Svelte 5 runes
let user = $state<User | null>(null);
let session = $state<Session | null>(null);
let profile = $state<Profile | null>(null);
let loading = $state(true);
let initialized = $state(false);

export function getAuthState() {
	return {
		get user() {
			return user;
		},
		get session() {
			return session;
		},
		get profile() {
			return profile;
		},
		get loading() {
			return loading;
		},
		get isAuthenticated() {
			return !!session;
		},
		get initialized() {
			return initialized;
		}
	};
}

export async function initAuth() {
	if (!browser || initialized) return;
	if (!supabase) {
		console.warn('[Auth] Supabase client not available');
		loading = false;
		initialized = true;
		return;
	}

	console.log('[Auth] Starting auth initialization...');

	try {
		// Get initial session using SDK
		console.log('[Auth] Getting initial session...');
		const { data } = await supabase.auth.getSession();
		const currentSession = data.session;

		console.log('[Auth] Session retrieved:', currentSession ? 'User logged in' : 'No session');

		session = currentSession as Session | null;
		user = (currentSession?.user as User) || null;

		if (user) {
			console.log('[Auth] Fetching profile for user:', user.id);
			await fetchProfile(user.id);
		}

		// Listen for auth changes using SDK's built-in listener
		supabase.auth.onAuthStateChange(async (event, newSession) => {
			console.log('[Auth] Auth state changed:', event, newSession ? 'logged in' : 'logged out');

			// Clear game state on login/logout to prevent stale data issues
			if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
				localStorage.removeItem('via_basilica_game_state');
				console.log('[Auth] Cleared game state on auth change');
			}

			session = newSession as Session | null;
			user = (newSession?.user as User) || null;

			if (user) {
				await fetchProfile(user.id);
			} else {
				profile = null;
			}
		});

		console.log('[Auth] Auth initialization complete');
	} catch (error) {
		console.error('[Auth] Error during auth initialization:', error);
	}

	loading = false;
	initialized = true;
}

async function fetchProfile(userId: string) {
	if (!supabase) {
		console.warn('[Auth] Supabase client not available for profile fetch');
		return;
	}

	const { data, error } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', userId)
		.single();

	if (error) {
		console.error('Error fetching profile:', error);
		return;
	}

	profile = data;
}

export async function refreshProfile() {
	if (!user) return;
	await fetchProfile(user.id);
}

export function setProfile(newProfile: Profile) {
	profile = newProfile;
}
