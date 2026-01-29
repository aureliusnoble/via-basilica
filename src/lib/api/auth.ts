import { browser } from '$app/environment';
import { base } from '$app/paths';
import { supabase } from './supabase.js';

// Helper to build redirect URL
function getRedirectUrl(path: string): string {
	const redirectUrl = `${window.location.origin}${base}${path}`;
	console.log('[Auth] Building redirect URL:', { base, origin: window.location.origin, path, redirectUrl });
	return redirectUrl;
}

// Re-export types from Supabase for convenience
export type User = {
	id: string;
	email?: string;
	user_metadata?: Record<string, unknown>;
	app_metadata?: Record<string, unknown>;
	created_at?: string;
};

export type Session = {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	expires_at?: number;
	token_type: string;
	user: User;
};

export type AuthProvider = 'google' | 'apple';

export interface AuthResult {
	user: User | null;
	session: Session | null;
	error: Error | null;
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
	if (!supabase) {
		return { user: null, session: null, error: new Error('Supabase not configured') };
	}

	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			emailRedirectTo: getRedirectUrl('/auth/callback')
		}
	});

	return {
		user: data.user as User | null,
		session: data.session as Session | null,
		error: error ? new Error(error.message) : null
	};
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
	if (!supabase) {
		return { user: null, session: null, error: new Error('Supabase not configured') };
	}

	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password
	});

	return {
		user: data.user as User | null,
		session: data.session as Session | null,
		error: error ? new Error(error.message) : null
	};
}

export async function signInWithOAuth(
	provider: AuthProvider
): Promise<{ error: Error | null }> {
	if (!browser) {
		return { error: new Error('OAuth is only available in the browser') };
	}

	if (!supabase) {
		return { error: new Error('Supabase not configured') };
	}

	const { error } = await supabase.auth.signInWithOAuth({
		provider,
		options: {
			redirectTo: getRedirectUrl('/auth/callback')
		}
	});

	return { error: error ? new Error(error.message) : null };
}

export async function signOut(): Promise<{ error: Error | null }> {
	if (!supabase) {
		return { error: new Error('Supabase not configured') };
	}

	const { error } = await supabase.auth.signOut();
	return { error: error ? new Error(error.message) : null };
}

export async function resetPassword(email: string): Promise<{ error: Error | null }> {
	if (!supabase) {
		return { error: new Error('Supabase not configured') };
	}

	const { error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: getRedirectUrl('/auth/callback?type=recovery')
	});

	return { error: error ? new Error(error.message) : null };
}

export async function updatePassword(newPassword: string): Promise<{ error: Error | null }> {
	if (!supabase) {
		return { error: new Error('Supabase not configured') };
	}

	const { error } = await supabase.auth.updateUser({
		password: newPassword
	});

	return { error: error ? new Error(error.message) : null };
}

export async function getSession(): Promise<Session | null> {
	if (!supabase) return null;

	const { data } = await supabase.auth.getSession();
	return data.session as Session | null;
}

export async function getUser(): Promise<User | null> {
	if (!supabase) return null;

	const { data } = await supabase.auth.getUser();
	return data.user as User | null;
}

export function onAuthStateChange(
	callback: (session: Session | null) => void
): { data: { subscription: { unsubscribe: () => void } } } {
	if (!supabase) {
		return { data: { subscription: { unsubscribe: () => {} } } };
	}

	const { data } = supabase.auth.onAuthStateChange((_event, session) => {
		callback(session as Session | null);
	});

	return { data };
}

export async function deleteAccount(): Promise<{ error: Error | null }> {
	if (!supabase) {
		return { error: new Error('Supabase not configured') };
	}

	const { data: sessionData } = await supabase.auth.getSession();
	if (!sessionData.session) {
		return { error: new Error('Not authenticated') };
	}

	try {
		// Call the Edge Function to delete the account
		const response = await supabase.functions.invoke('delete-account');

		if (response.error) {
			return { error: new Error(response.error.message || 'Failed to delete account') };
		}

		// Sign out locally
		await signOut();
		return { error: null };
	} catch (err) {
		return { error: err instanceof Error ? err : new Error('Failed to delete account') };
	}
}

// Exchange code for session (for PKCE flow callback)
export async function exchangeCodeForSession(
	code: string
): Promise<{ session: Session | null; error: Error | null }> {
	if (!supabase) {
		return { session: null, error: new Error('Supabase not configured') };
	}

	const { data, error } = await supabase.auth.exchangeCodeForSession(code);

	return {
		session: data.session as Session | null,
		error: error ? new Error(error.message) : null
	};
}

// Handle OAuth callback - for implicit flow (tokens in URL hash)
export function handleAuthCallback(): Session | null {
	if (!browser || !supabase) return null;

	// The SDK automatically handles tokens in URL hash when detectSessionInUrl is true (default)
	// We just need to check if there's a session after the SDK processes it
	// This is a sync check - the actual session will be available via onAuthStateChange
	return null;
}

export async function refreshSession(): Promise<Session | null> {
	if (!supabase) return null;

	const { data, error } = await supabase.auth.refreshSession();
	if (error) return null;

	return data.session as Session | null;
}
