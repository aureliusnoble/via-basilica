import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

let supabaseInstance: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient | null {
	if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
		console.warn('Supabase environment variables are not configured');
		return null;
	}
	try {
		return createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			auth: {
				persistSession: true,
				autoRefreshToken: true
			}
		});
	} catch (error) {
		console.error('Failed to create Supabase client:', error);
		return null;
	}
}

export const supabase = browser ? createSupabaseClient() : null;

export function getSupabase(): SupabaseClient {
	if (!browser) {
		throw new Error('Supabase client is only available in the browser');
	}
	if (!supabase) {
		throw new Error('Supabase client is not configured');
	}
	return supabase;
}
