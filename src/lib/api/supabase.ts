import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

let supabaseInstance: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient {
	if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
		throw new Error('Supabase environment variables are not configured');
	}
	return createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		auth: {
			persistSession: true,
			autoRefreshToken: true
		}
	});
}

export const supabase = browser ? createSupabaseClient() : null!;

export function getSupabase() {
	if (!browser) {
		throw new Error('Supabase client is only available in the browser');
	}
	return supabase;
}
