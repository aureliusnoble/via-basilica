import { browser } from '$app/environment';
import type { Profile } from '$lib/types/database.js';
import { getSupabaseSafe } from '$lib/api/supabase.js';
import { getSession, onAuthStateChange, type User, type Session } from '$lib/api/auth.js';

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

	console.log('[Auth] Starting auth initialization...');

	try {
		// Get initial session from our direct auth implementation
		console.log('[Auth] Getting initial session...');
		const currentSession = await getSession();

		console.log('[Auth] Session retrieved:', currentSession ? 'User logged in' : 'No session');

		session = currentSession;
		user = currentSession?.user || null;

		if (user) {
			console.log('[Auth] Fetching profile for user:', user.id);
			await fetchProfile(user.id);
		}

		// Listen for auth changes using our event system
		onAuthStateChange(async (newSession) => {
			console.log('[Auth] Auth state changed:', newSession ? 'logged in' : 'logged out');
			session = newSession;
			user = newSession?.user || null;

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
	const supabase = getSupabaseSafe();
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
