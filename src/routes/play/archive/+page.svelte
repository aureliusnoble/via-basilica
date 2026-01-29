<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import Header from '$lib/components/layout/Header.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { getArchiveChallenges } from '$lib/api/challenges.js';
	import { formatDate } from '$lib/utils/date-helpers.js';
	import type { DailyChallenge } from '$lib/types/database.js';

	let challenges = $state<DailyChallenge[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			challenges = await getArchiveChallenges();
		} catch (error) {
			console.error('Error loading archive:', error);
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Archive - Via Basilica</title>
</svelte:head>

<Header title="Archive" backHref="{base}/" />

<main class="max-w-lg mx-auto px-4 py-6">
	{#if loading}
		<div class="flex items-center justify-center py-12">
			<Spinner size="lg" />
		</div>
	{:else if challenges.length === 0}
		<div class="text-center py-12">
			<p class="text-text-dark-muted">No past challenges available yet</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each challenges as challenge}
				<a href="{base}/play/archive/{challenge.challenge_date}" class="block">
					<Card class="hover:ring-2 hover:ring-gold/50 transition-all">
						<div class="flex items-center justify-between">
							<div>
								<div class="flex items-center gap-2 mb-1">
									<Badge size="sm">#{challenge.id}</Badge>
									<span class="text-sm text-text-dark-muted">
										{formatDate(challenge.challenge_date)}
									</span>
								</div>
								<p class="font-medium text-gold">
									{challenge.start_article.replace(/_/g, ' ')}
								</p>
							</div>
							<svg class="w-5 h-5 text-text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</div>
					</Card>
				</a>
			{/each}
		</div>

		<p class="text-center text-sm text-text-dark-muted mt-6">
			Archive challenges earn 50% XP
		</p>
	{/if}
</main>
