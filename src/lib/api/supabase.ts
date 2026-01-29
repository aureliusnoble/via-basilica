import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

let supabaseInstance: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient | null {
	console.log('[Supabase] Creating client with @supabase/ssr...');
	console.log('[Supabase] URL configured:', !!PUBLIC_SUPABASE_URL);
	console.log('[Supabase] Key configured:', !!PUBLIC_SUPABASE_ANON_KEY);

	if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
		console.warn('[Supabase] Environment variables are not configured');
		console.warn('[Supabase] PUBLIC_SUPABASE_URL:', PUBLIC_SUPABASE_URL || '(empty)');
		console.warn('[Supabase] PUBLIC_SUPABASE_ANON_KEY:', PUBLIC_SUPABASE_ANON_KEY ? '(set but hidden)' : '(empty)');
		return null;
	}
	try {
		// Use createBrowserClient from @supabase/ssr for CSP-friendly auth
		const client = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
		console.log('[Supabase] Client created successfully');
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
