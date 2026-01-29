<script lang="ts">
	import { goto } from '$app/navigation';
	import Header from '$lib/components/layout/Header.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { signIn, signInWithOAuth, type AuthProvider } from '$lib/api/auth.js';
	import { toast } from 'svelte-sonner';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let oauthLoading = $state<AuthProvider | null>(null);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!email || !password) return;

		loading = true;

		try {
			const { error } = await signIn(email, password);
			if (error) {
				toast.error(error.message);
			} else {
				toast.success('Welcome back!');
				goto('/');
			}
		} catch {
			toast.error('Login failed');
		} finally {
			loading = false;
		}
	}

	async function handleOAuth(provider: AuthProvider) {
		oauthLoading = provider;
		const { error } = await signInWithOAuth(provider);
		if (error) {
			toast.error(error.message);
			oauthLoading = null;
		}
		// Redirect happens automatically
	}

	const oauthProviders: { id: AuthProvider; name: string; icon: string; color: string }[] = [
		{ id: 'google', name: 'Google', icon: 'G', color: 'bg-white text-gray-800' }
	];
</script>

<svelte:head>
	<title>Log In - Via Basilica</title>
</svelte:head>

<Header title="Log In" backHref="/" />

<main class="max-w-lg mx-auto px-4 py-6">
	<Card>
		<!-- OAuth buttons -->
		<div class="space-y-3 mb-6">
			{#each oauthProviders as provider}
				<Button
					onclick={() => handleOAuth(provider.id)}
					loading={oauthLoading === provider.id}
					disabled={oauthLoading !== null}
					variant="secondary"
					class="w-full {provider.color}"
				>
					<span class="mr-2">{provider.icon}</span>
					Continue with {provider.name}
				</Button>
			{/each}
		</div>

		<div class="flex items-center gap-4 mb-6">
			<div class="flex-1 h-px bg-bg-dark-tertiary"></div>
			<span class="text-sm text-text-dark-muted">or</span>
			<div class="flex-1 h-px bg-bg-dark-tertiary"></div>
		</div>

		<!-- Email form -->
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

			<div>
				<label for="password" class="block text-sm font-medium mb-1">Password</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					required
					class="w-full px-4 py-2 bg-bg-dark-tertiary rounded-lg border border-bg-dark-tertiary focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
					placeholder="••••••••"
				/>
			</div>

			<Button type="submit" {loading} class="w-full">
				Log In
			</Button>
		</form>

		<div class="mt-6 text-center text-sm">
			<a href="/auth/reset" class="text-gold hover:underline">Forgot password?</a>
			<span class="text-text-dark-muted mx-2">|</span>
			<a href="/auth/signup" class="text-gold hover:underline">Create account</a>
		</div>
	</Card>
</main>
