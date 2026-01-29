import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Create Supabase client with full auth support (following GoA-Timer pattern)
export const supabase: SupabaseClient | null =
	browser && PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_ANON_KEY
		? createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
				auth: {
					autoRefreshToken: true,
					persistSession: true,
					storageKey: 'via_basilica_auth',
					storage: localStorage
				}
			})
		: null;

export function getSupabase(): SupabaseClient {
	if (!browser) {
		throw new Error('Supabase client is only available in the browser');
	}
	if (!supabase) {
		throw new Error('Supabase client is not configured. Check that PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are set.');
	}
	return supabase;
}

// Safe version that returns null instead of throwing
export function getSupabaseSafe(): SupabaseClient | null {
	if (!browser) {
		return null;
	}
	return supabase;
}
