<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { handleAuthCallback } from '$lib/api/auth.js';
	import { toast } from 'svelte-sonner';

	onMount(async () => {
		const type = page.url.searchParams.get('type');
		const error = page.url.searchParams.get('error');
		const errorDescription = page.url.searchParams.get('error_description');

		if (error) {
			toast.error(errorDescription || error);
			goto(`${base}/auth/login`);
			return;
		}

		// Handle OAuth callback - tokens may be in URL hash or query params
		const session = handleAuthCallback();

		if (session) {
			// Handle different callback types
			if (type === 'recovery') {
				// Password recovery - redirect to password change page
				toast.success('You can now set a new password');
				goto(`${base}/profile`);
			} else if (type === 'email_change') {
				toast.success('Email updated successfully');
				goto(`${base}/profile`);
			} else {
				// Default: OAuth or email verification
				toast.success('Welcome to Via Basilica!');
				goto(`${base}/`);
			}
		} else {
			// No tokens found, redirect to home
			goto(`${base}/`);
		}
	});
</script>

<main class="flex items-center justify-center min-h-screen">
	<div class="text-center">
		<Spinner size="lg" />
		<p class="mt-4 text-text-dark-muted">Completing authentication...</p>
	</div>
</main>
