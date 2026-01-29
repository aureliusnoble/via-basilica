<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { Gift, BookOpen } from 'lucide-svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import ThemeToggle from '$lib/components/layout/ThemeToggle.svelte';
	import { getAuthState } from '$lib/state/auth.svelte.js';
	import { signOut } from '$lib/api/auth.js';
	import { getXpProgress, getLevelTitle } from '$lib/utils/constants.js';
	import { toast } from 'svelte-sonner';

	const auth = getAuthState();

	const xpProgress = $derived(auth.profile ? getXpProgress(auth.profile.total_xp) : null);
	const levelTitle = $derived(auth.profile ? getLevelTitle(auth.profile.level) : null);

	async function handleSignOut() {
		const { error } = await signOut();
		if (error) {
			toast.error('Failed to sign out');
		} else {
			goto(`${base}/`);
		}
	}
</script>

<svelte:head>
	<title>Profile - Via Basilica</title>
</svelte:head>

<Header title="Profile" />

<main class="max-w-lg mx-auto px-4 py-6">
	{#if auth.loading}
		<div class="text-center py-12">
			<p class="text-text-dark-muted">Loading...</p>
		</div>
	{:else if !auth.isAuthenticated}
		<!-- Not logged in -->
		<Card class="text-center py-8">
			<div class="w-20 h-20 mx-auto mb-4 rounded-full bg-bg-dark-tertiary flex items-center justify-center">
				<svg class="w-10 h-10 text-text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
				</svg>
			</div>
			<h2 class="text-xl font-semibold mb-2">Sign in to track progress</h2>
			<p class="text-text-dark-muted mb-6">
				Save your game history, earn points, and compete on the leaderboard
			</p>
			<div class="flex gap-3 justify-center">
				<Button href="/auth/login" variant="secondary">Log In</Button>
				<Button href="/auth/signup">Sign Up</Button>
			</div>
		</Card>
	{:else if auth.profile}
		<!-- Logged in -->
		<div class="space-y-6">
			<!-- Profile header -->
			<Card>
				<div class="flex items-center gap-4 mb-4">
					<div class="w-16 h-16 rounded-full bg-gradient-to-br from-gold/30 to-crimson/20 flex items-center justify-center">
						<span class="text-2xl font-serif text-gold">
							{auth.profile.username.charAt(0).toUpperCase()}
						</span>
					</div>
					<div>
						<h2 class="text-xl font-semibold">{auth.profile.display_name || auth.profile.username}</h2>
						<p class="text-text-dark-muted">@{auth.profile.username}</p>
					</div>
				</div>

				<!-- Level progress -->
				<div class="mb-4">
					<div class="flex items-center justify-between mb-2">
						<Badge variant="gold">Level {auth.profile.level} {levelTitle}</Badge>
						{#if xpProgress}
							<span class="text-sm text-text-dark-muted">
								{xpProgress.current} / {xpProgress.required} XP
							</span>
						{/if}
					</div>
					{#if xpProgress}
						<div class="progress-bar">
							<div class="progress-bar-fill" style="width: {xpProgress.percentage}%"></div>
						</div>
					{/if}
				</div>

				<!-- Stats grid -->
				<div class="grid grid-cols-3 gap-4 pt-4 border-t border-bg-dark-tertiary">
					<div class="text-center">
						<p class="text-2xl font-bold text-gold">{auth.profile.total_points}</p>
						<p class="text-xs text-text-dark-muted">Total Points</p>
					</div>
					<div class="text-center">
						<p class="text-2xl font-bold">{auth.profile.games_played}</p>
						<p class="text-xs text-text-dark-muted">Games Played</p>
					</div>
					<div class="text-center">
						<p class="text-2xl font-bold">{auth.profile.total_xp}</p>
						<p class="text-xs text-text-dark-muted">Total XP</p>
					</div>
				</div>
			</Card>

			<!-- Quick links -->
			<div class="grid grid-cols-2 gap-4">
				<a href="{base}/powerups">
					<Card padding="sm" class="text-center hover:ring-2 hover:ring-gold/50 transition-all">
						<div class="flex justify-center mb-2">
							<Gift size={28} class="text-gold" />
						</div>
						<p class="font-medium">Powerups</p>
					</Card>
				</a>
				<a href="{base}/about">
					<Card padding="sm" class="text-center hover:ring-2 hover:ring-gold/50 transition-all">
						<div class="flex justify-center mb-2">
							<BookOpen size={28} class="text-gold" />
						</div>
						<p class="font-medium">About Basil</p>
					</Card>
				</a>
			</div>

			<!-- Settings -->
			<Card>
				<h3 class="font-semibold mb-4">Settings</h3>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<span>Theme</span>
						<ThemeToggle />
					</div>
				</div>
			</Card>

			<!-- Sign out -->
			<Button onclick={handleSignOut} variant="ghost" class="w-full">
				Sign Out
			</Button>
		</div>
	{/if}
</main>
