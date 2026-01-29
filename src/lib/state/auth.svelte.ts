import { browser } from '$app/environment';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '$lib/types/database.js';
import { getSupabase } from '$lib/api/supabase.js';

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

	const supabase = getSupabase();

	// Get initial session
	const { data } = await supabase.auth.getSession();
	session = data.session;
	user = data.session?.user || null;

	if (user) {
		await fetchProfile(user.id);
	}

	// Listen for auth changes
	supabase.auth.onAuthStateChange(async (event, newSession) => {
		session = newSession;
		user = newSession?.user || null;

		if (user) {
			await fetchProfile(user.id);
		} else {
			profile = null;
		}
	});

	loading = false;
	initialized = true;
}

async function fetchProfile(userId: string) {
	const supabase = getSupabase();

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
