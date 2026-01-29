import { getSupabase } from './supabase.js';
import type { User, Session, Provider } from '@supabase/supabase-js';

export type AuthProvider = 'google' | 'apple';

export interface AuthResult {
	user: User | null;
	session: Session | null;
	error: Error | null;
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
	const supabase = getSupabase();

	const { data, error } = await supabase.auth.signUp({
		email,
		password
	});

	return {
		user: data.user,
		session: data.session,
		error: error ? new Error(error.message) : null
	};
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
	const supabase = getSupabase();

	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password
	});

	return {
		user: data.user,
		session: data.session,
		error: error ? new Error(error.message) : null
	};
}

export async function signInWithOAuth(provider: AuthProvider): Promise<{ error: Error | null }> {
	const supabase = getSupabase();

	// Get the base path from the current URL (handles both local dev and deployed paths)
	const basePath = import.meta.env.BASE_URL || '';
	const redirectUrl = `${window.location.origin}${basePath}auth/callback`;

	const { error } = await supabase.auth.signInWithOAuth({
		provider: provider as Provider,
		options: {
			redirectTo: redirectUrl
		}
	});

	return {
		error: error ? new Error(error.message) : null
	};
}

export async function signOut(): Promise<{ error: Error | null }> {
	const supabase = getSupabase();

	const { error } = await supabase.auth.signOut();

	return {
		error: error ? new Error(error.message) : null
	};
}

export async function resetPassword(email: string): Promise<{ error: Error | null }> {
	const supabase = getSupabase();

	const basePath = import.meta.env.BASE_URL || '';
	const redirectUrl = `${window.location.origin}${basePath}auth/callback?type=recovery`;

	const { error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: redirectUrl
	});

	return {
		error: error ? new Error(error.message) : null
	};
}

export async function updatePassword(newPassword: string): Promise<{ error: Error | null }> {
	const supabase = getSupabase();

	const { error } = await supabase.auth.updateUser({
		password: newPassword
	});

	return {
		error: error ? new Error(error.message) : null
	};
}

export async function getSession(): Promise<Session | null> {
	const supabase = getSupabase();

	const { data } = await supabase.auth.getSession();
	return data.session;
}

export async function getUser(): Promise<User | null> {
	const supabase = getSupabase();

	const { data } = await supabase.auth.getUser();
	return data.user;
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
	const supabase = getSupabase();

	return supabase.auth.onAuthStateChange((event, session) => {
		callback(session);
	});
}

export async function deleteAccount(): Promise<{ error: Error | null }> {
	const supabase = getSupabase();

	// This calls an Edge Function that uses the service role to delete the user
	const { error } = await supabase.functions.invoke('delete-account');

	if (error) {
		return { error: new Error(error.message) };
	}

	// Sign out locally
	await signOut();

	return { error: null };
}
