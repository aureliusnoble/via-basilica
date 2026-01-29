import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

let supabaseInstance: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient | null {
	console.log('[Supabase] Creating client for data operations...');
	console.log('[Supabase] URL configured:', !!PUBLIC_SUPABASE_URL);
	console.log('[Supabase] Key configured:', !!PUBLIC_SUPABASE_ANON_KEY);

	if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
		console.warn('[Supabase] Environment variables are not configured');
		console.warn('[Supabase] PUBLIC_SUPABASE_URL:', PUBLIC_SUPABASE_URL || '(empty)');
		console.warn('[Supabase] PUBLIC_SUPABASE_ANON_KEY:', PUBLIC_SUPABASE_ANON_KEY ? '(set but hidden)' : '(empty)');
		return null;
	}
	try {
		// Create client for data operations only (auth is handled separately via direct fetch)
		// Disable auth features to avoid eval() usage that triggers CSP issues
		const client = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
				detectSessionInUrl: false
			}
		});
		console.log('[Supabase] Client created successfully (data only)');
		return client;
	} catch (error) {
		console.error('[Supabase] Failed to create client:', error);
		return null;
	}
}

export const supabase = browser ? createSupabaseClient() : null;

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
