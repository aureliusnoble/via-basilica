import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { browser } from '$app/environment';

// Direct fetch implementation to bypass Supabase JS client's eval() usage
// which is blocked by GitHub Pages' CSP headers

export type AuthProvider = 'google' | 'apple';

export interface User {
	id: string;
	email?: string;
	user_metadata?: Record<string, unknown>;
	app_metadata?: Record<string, unknown>;
	created_at?: string;
}

export interface Session {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	expires_at?: number;
	token_type: string;
	user: User;
}

export interface AuthResult {
	user: User | null;
	session: Session | null;
	error: Error | null;
}

const AUTH_STORAGE_KEY = 'via_basilica_auth';

function getAuthHeaders(): HeadersInit {
	return {
		'Content-Type': 'application/json',
		'apikey': PUBLIC_SUPABASE_ANON_KEY,
		'Authorization': `Bearer ${PUBLIC_SUPABASE_ANON_KEY}`
	};
}

function getAuthHeadersWithToken(accessToken: string): HeadersInit {
	return {
		'Content-Type': 'application/json',
		'apikey': PUBLIC_SUPABASE_ANON_KEY,
		'Authorization': `Bearer ${accessToken}`
	};
}

function saveSession(session: Session | null): void {
	if (!browser) return;
	if (session) {
		// Calculate expires_at if not present
		if (!session.expires_at) {
			session.expires_at = Math.floor(Date.now() / 1000) + session.expires_in;
		}
		localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
	} else {
		localStorage.removeItem(AUTH_STORAGE_KEY);
	}
}

function loadSession(): Session | null {
	if (!browser) return null;
	try {
		const stored = localStorage.getItem(AUTH_STORAGE_KEY);
		if (!stored) return null;
		const session = JSON.parse(stored) as Session;
		// Check if expired
		if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
			localStorage.removeItem(AUTH_STORAGE_KEY);
			return null;
		}
		return session;
	} catch {
		return null;
	}
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
	try {
		const response = await fetch(`${PUBLIC_SUPABASE_URL}/auth/v1/signup`, {
			method: 'POST',
			headers: getAuthHeaders(),
			body: JSON.stringify({ email, password })
		});

		const data = await response.json();

		if (!response.ok) {
			return {
				user: null,
				session: null,
				error: new Error(data.error_description || data.msg || data.message || 'Signup failed')
			};
		}

		// If email confirmation is required, user will be returned but no session
		if (data.user && !data.access_token) {
			return {
				user: data.user,
				session: null,
				error: null
			};
		}

		const session: Session = {
			access_token: data.access_token,
			refresh_token: data.refresh_token,
			expires_in: data.expires_in,
			token_type: data.token_type,
			user: data.user
		};

		saveSession(session);

		return {
			user: data.user,
			session,
			error: null
		};
	} catch (err) {
		return {
			user: null,
			session: null,
			error: err instanceof Error ? err : new Error('Signup failed')
		};
	}
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
	try {
		const response = await fetch(`${PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
			method: 'POST',
			headers: getAuthHeaders(),
			body: JSON.stringify({ email, password })
		});

		const data = await response.json();

		if (!response.ok) {
			return {
				user: null,
				session: null,
				error: new Error(data.error_description || data.msg || data.message || 'Login failed')
			};
		}

		const session: Session = {
			access_token: data.access_token,
			refresh_token: data.refresh_token,
			expires_in: data.expires_in,
			token_type: data.token_type,
			user: data.user
		};

		saveSession(session);

		return {
			user: data.user,
			session,
			error: null
		};
	} catch (err) {
		return {
			user: null,
			session: null,
			error: err instanceof Error ? err : new Error('Login failed')
		};
	}
}

export async function signInWithOAuth(provider: AuthProvider): Promise<{ error: Error | null }> {
	if (!browser) {
		return { error: new Error('OAuth is only available in the browser') };
	}

	try {
		const basePath = import.meta.env.BASE_URL || '';
		const redirectUrl = `${window.location.origin}${basePath}/auth/callback`;

		// Redirect to Supabase OAuth endpoint
		const params = new URLSearchParams({
			provider,
			redirect_to: redirectUrl
		});

		window.location.href = `${PUBLIC_SUPABASE_URL}/auth/v1/authorize?${params.toString()}`;

		return { error: null };
	} catch (err) {
		return { error: err instanceof Error ? err : new Error('OAuth failed') };
	}
}

export async function signOut(): Promise<{ error: Error | null }> {
	const session = loadSession();

	if (session) {
		try {
			await fetch(`${PUBLIC_SUPABASE_URL}/auth/v1/logout`, {
				method: 'POST',
				headers: getAuthHeadersWithToken(session.access_token)
			});
		} catch {
			// Ignore errors on logout - we'll clear local session anyway
		}
	}

	saveSession(null);
	notifyAuthChange(null);

	return { error: null };
}

export async function resetPassword(email: string): Promise<{ error: Error | null }> {
	try {
		const basePath = import.meta.env.BASE_URL || '';
		const redirectUrl = `${window.location.origin}${basePath}/auth/callback?type=recovery`;

		const response = await fetch(`${PUBLIC_SUPABASE_URL}/auth/v1/recover`, {
			method: 'POST',
			headers: getAuthHeaders(),
			body: JSON.stringify({ email, redirect_to: redirectUrl })
		});

		if (!response.ok) {
			const data = await response.json();
			return {
				error: new Error(data.error_description || data.msg || data.message || 'Password reset failed')
			};
		}

		return { error: null };
	} catch (err) {
		return { error: err instanceof Error ? err : new Error('Password reset failed') };
	}
}

export async function updatePassword(newPassword: string): Promise<{ error: Error | null }> {
	const session = loadSession();

	if (!session) {
		return { error: new Error('Not authenticated') };
	}

	try {
		const response = await fetch(`${PUBLIC_SUPABASE_URL}/auth/v1/user`, {
			method: 'PUT',
			headers: getAuthHeadersWithToken(session.access_token),
			body: JSON.stringify({ password: newPassword })
		});

		if (!response.ok) {
			const data = await response.json();
			return {
				error: new Error(data.error_description || data.msg || data.message || 'Password update failed')
			};
		}

		return { error: null };
	} catch (err) {
		return { error: err instanceof Error ? err : new Error('Password update failed') };
	}
}

export async function getSession(): Promise<Session | null> {
	return loadSession();
}

export async function getUser(): Promise<User | null> {
	const session = loadSession();
	return session?.user ?? null;
}

// Simple event system for auth state changes
type AuthCallback = (session: Session | null) => void;
const authCallbacks: Set<AuthCallback> = new Set();

function notifyAuthChange(session: Session | null): void {
	authCallbacks.forEach(cb => cb(session));
}

export function onAuthStateChange(callback: (session: Session | null) => void): { data: { subscription: { unsubscribe: () => void } } } {
	authCallbacks.add(callback);

	// Call immediately with current session
	const session = loadSession();
	callback(session);

	return {
		data: {
			subscription: {
				unsubscribe: () => {
					authCallbacks.delete(callback);
				}
			}
		}
	};
}

export async function deleteAccount(): Promise<{ error: Error | null }> {
	const session = loadSession();

	if (!session) {
		return { error: new Error('Not authenticated') };
	}

	try {
		// Call the Edge Function to delete the account
		const response = await fetch(`${PUBLIC_SUPABASE_URL}/functions/v1/delete-account`, {
			method: 'POST',
			headers: getAuthHeadersWithToken(session.access_token)
		});

		if (!response.ok) {
			const data = await response.json();
			return {
				error: new Error(data.error || data.message || 'Failed to delete account')
			};
		}

		// Sign out locally
		await signOut();

		return { error: null };
	} catch (err) {
		return { error: err instanceof Error ? err : new Error('Failed to delete account') };
	}
}

// Handle OAuth callback - extract tokens from URL hash
export function handleAuthCallback(): Session | null {
	if (!browser) return null;

	// Check for tokens in URL hash (implicit flow) or query params
	const hash = window.location.hash.substring(1);
	const params = new URLSearchParams(hash || window.location.search);

	const accessToken = params.get('access_token');
	const refreshToken = params.get('refresh_token');
	const expiresIn = params.get('expires_in');
	const tokenType = params.get('token_type');

	if (accessToken) {
		// We need to fetch user info
		const session: Session = {
			access_token: accessToken,
			refresh_token: refreshToken || '',
			expires_in: expiresIn ? parseInt(expiresIn) : 3600,
			token_type: tokenType || 'bearer',
			user: { id: '' } // Will be populated by getUser call
		};

		saveSession(session);

		// Clear the URL hash/params
		window.history.replaceState(null, '', window.location.pathname);

		// Fetch actual user data
		fetchAndUpdateUser(accessToken);

		return session;
	}

	return null;
}

async function fetchAndUpdateUser(accessToken: string): Promise<void> {
	try {
		const response = await fetch(`${PUBLIC_SUPABASE_URL}/auth/v1/user`, {
			headers: getAuthHeadersWithToken(accessToken)
		});

		if (response.ok) {
			const user = await response.json();
			const session = loadSession();
			if (session) {
				session.user = user;
				saveSession(session);
				notifyAuthChange(session);
			}
		}
	} catch {
		// Ignore errors fetching user
	}
}

// Refresh token if needed
export async function refreshSession(): Promise<Session | null> {
	const session = loadSession();
	if (!session?.refresh_token) return null;

	try {
		const response = await fetch(`${PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
			method: 'POST',
			headers: getAuthHeaders(),
			body: JSON.stringify({ refresh_token: session.refresh_token })
		});

		if (!response.ok) {
			saveSession(null);
			return null;
		}

		const data = await response.json();
		const newSession: Session = {
			access_token: data.access_token,
			refresh_token: data.refresh_token,
			expires_in: data.expires_in,
			token_type: data.token_type,
			user: data.user
		};

		saveSession(newSession);
		notifyAuthChange(newSession);

		return newSession;
	} catch {
		return null;
	}
}
