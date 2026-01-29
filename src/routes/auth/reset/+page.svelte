<script lang="ts">
	import { base } from '$app/paths';
	import Header from '$lib/components/layout/Header.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { resetPassword } from '$lib/api/auth.js';
	import { toast } from 'svelte-sonner';

	let email = $state('');
	let loading = $state(false);
	let sent = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!email) return;

		loading = true;

		try {
			const { error } = await resetPassword(email);
			if (error) {
				toast.error(error.message);
			} else {
				sent = true;
			}
		} catch {
			toast.error('Failed to send reset email');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Reset Password - Via Basilica</title>
</svelte:head>

<Header title="Reset Password" backHref="{base}/auth/login" />

<main class="max-w-lg mx-auto px-4 py-6">
	<Card>
		{#if sent}
			<div class="text-center py-8">
				<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
					<svg class="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h2 class="text-xl font-semibold mb-2">Check your email</h2>
				<p class="text-text-dark-muted mb-4">
					We've sent a password reset link to <span class="text-gold">{email}</span>
				</p>
				<Button href="/auth/login" variant="secondary">
					Back to Login
				</Button>
			</div>
		{:else}
			<div class="mb-6">
				<h2 class="text-xl font-semibold mb-2">Forgot your password?</h2>
				<p class="text-text-dark-muted">
					Enter your email and we'll send you a link to reset your password.
				</p>
			</div>

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="email" class="block text-sm font-medium mb-1">Email</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						required
						class="w-full px-4 py-2 bg-bg-dark-tertiary rounded-lg border border-bg-dark-tertiary focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
						placeholder="you@example.com"
					/>
				</div>

				<Button type="submit" {loading} class="w-full">
					Send Reset Link
				</Button>
			</form>

			<div class="mt-6 text-center text-sm">
				<a href="{base}/auth/login" class="text-gold hover:underline">Back to login</a>
			</div>
		{/if}
	</Card>
</main>
