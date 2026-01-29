<script lang="ts">
	import { goto } from '$app/navigation';
	import Header from '$lib/components/layout/Header.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { signUp, signInWithOAuth, type AuthProvider } from '$lib/api/auth.js';
	import { toast } from 'svelte-sonner';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let oauthLoading = $state<AuthProvider | null>(null);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!email || !password) return;

		if (password !== confirmPassword) {
			toast.error('Passwords do not match');
			return;
		}

		if (password.length < 6) {
			toast.error('Password must be at least 6 characters');
			return;
		}

		loading = true;

		try {
			const { error } = await signUp(email, password);
			if (error) {
				toast.error(error.message);
			} else {
				toast.success('Check your email to confirm your account');
				goto('/auth/login');
			}
		} catch {
			toast.error('Signup failed');
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
	}

	const oauthProviders: { id: AuthProvider; name: string; icon: string; color: string }[] = [
		{ id: 'google', name: 'Google', icon: 'G', color: 'bg-white text-gray-800' },
		{ id: 'github', name: 'GitHub', icon: '🐙', color: 'bg-gray-800 text-white' },
		{ id: 'discord', name: 'Discord', icon: '💬', color: 'bg-indigo-600 text-white' }
	];
</script>

<svelte:head>
	<title>Sign Up - Via Basilica</title>
</svelte:head>

<Header title="Sign Up" backHref="/" />

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
					minlength="6"
					class="w-full px-4 py-2 bg-bg-dark-tertiary rounded-lg border border-bg-dark-tertiary focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
					placeholder="••••••••"
				/>
			</div>

			<div>
				<label for="confirmPassword" class="block text-sm font-medium mb-1">Confirm Password</label>
				<input
					type="password"
					id="confirmPassword"
					bind:value={confirmPassword}
					required
					class="w-full px-4 py-2 bg-bg-dark-tertiary rounded-lg border border-bg-dark-tertiary focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
					placeholder="••••••••"
				/>
			</div>

			<Button type="submit" {loading} class="w-full">
				Create Account
			</Button>
		</form>

		<div class="mt-6 text-center text-sm">
			<span class="text-text-dark-muted">Already have an account?</span>
			<a href="/auth/login" class="text-gold hover:underline ml-1">Log in</a>
		</div>
	</Card>
</main>
