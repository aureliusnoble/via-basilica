<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { exchangeCodeForSession, getSession } from '$lib/api/auth.js';
	import { toast } from 'svelte-sonner';

	onMount(async () => {
		const type = page.url.searchParams.get('type');
		const error = page.url.searchParams.get('error');
		const errorDescription = page.url.searchParams.get('error_description');
		const code = page.url.searchParams.get('code');

		if (error) {
			toast.error(errorDescription || error);
			goto(`${base}/auth/login`);
			return;
		}

		// Handle PKCE flow - exchange code for session
		if (code) {
			const { session, error: exchangeError } = await exchangeCodeForSession(code);

			if (exchangeError) {
				console.error('[Auth Callback] Code exchange failed:', exchangeError);
				toast.error(exchangeError.message || 'Authentication failed');
				goto(`${base}/auth/login`);
				return;
			}

			if (session) {
				handleSuccess(type);
				return;
			}
		}

		// Check if SDK already processed the session (implicit flow via hash)
		// The SDK automatically handles tokens in URL hash
		const session = await getSession();
		if (session) {
			handleSuccess(type);
			return;
		}

		// No session found, redirect to home
		console.log('[Auth Callback] No session found, redirecting to home');
		goto(`${base}/`);
	});

	function handleSuccess(type: string | null) {
		if (type === 'recovery') {
			toast.success('You can now set a new password');
			goto(`${base}/profile`);
		} else if (type === 'email_change') {
			toast.success('Email updated successfully');
			goto(`${base}/profile`);
		} else {
			toast.success('Welcome to Via Basilica!');
			goto(`${base}/`);
		}
	}
</script>

<main class="flex items-center justify-center min-h-screen">
	<div class="text-center">
		<Spinner size="lg" />
		<p class="mt-4 text-text-dark-muted">Completing authentication...</p>
	</div>
</main>
