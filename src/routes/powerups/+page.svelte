<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { getAuthState } from '$lib/state/auth.svelte.js';
	import { getPlayerState, loadPlayerPowerups, incrementLocalPowerup } from '$lib/state/player.svelte.js';
	import { purchasePowerup } from '$lib/api/powerups.js';
	import { refreshProfile } from '$lib/state/auth.svelte.js';
	import { POWERUPS, type PowerupId } from '$lib/types/powerup.js';
	import { toast } from 'svelte-sonner';

	const auth = getAuthState();
	const player = getPlayerState();

	let purchasing = $state<string | null>(null);

	onMount(() => {
		if (auth.user) {
			loadPlayerPowerups();
		}
	});

	function getQuantity(powerupId: string): number {
		const powerup = player.powerups.find((p) => p.powerup_id === powerupId);
		return powerup?.quantity || 0;
	}

	function canAfford(cost: number): boolean {
		return (auth.profile?.total_points || 0) >= cost;
	}

	async function handlePurchase(powerupId: string) {
		if (!auth.user || !auth.profile) return;

		const powerup = POWERUPS[powerupId as PowerupId];
		if (!powerup || !canAfford(powerup.cost)) return;

		purchasing = powerupId;

		try {
			const { success, error } = await purchasePowerup(powerupId);
			if (success) {
				incrementLocalPowerup(powerupId, auth.user.id);
				await refreshProfile();
				toast.success(`Purchased ${powerup.name}!`);
			} else {
				toast.error(error || 'Purchase failed');
			}
		} catch {
			toast.error('Purchase failed');
		} finally {
			purchasing = null;
		}
	}

	const powerupsByCategory = $derived({
		information: Object.values(POWERUPS).filter((p) => p.category === 'information'),
		navigation: Object.values(POWERUPS).filter((p) => p.category === 'navigation'),
		strategic: Object.values(POWERUPS).filter((p) => p.category === 'strategic')
	});
</script>

<svelte:head>
	<title>Powerups - Via Basilica</title>
</svelte:head>

<Header title="Powerups" backHref="/profile" />

<main class="max-w-lg mx-auto px-4 py-6">
	{#if !auth.isAuthenticated}
		<Card class="text-center py-8">
			<p class="text-text-dark-muted mb-4">Sign in to purchase and use powerups</p>
			<Button href="/auth/login">Sign In</Button>
		</Card>
	{:else}
		<!-- Points balance -->
		<Card class="mb-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-text-dark-muted">Your Points</p>
					<p class="text-3xl font-bold text-gold">{auth.profile?.total_points || 0}</p>
				</div>
				<div class="text-right">
					<p class="text-sm text-text-dark-muted">Available</p>
					<p class="text-lg">for powerups</p>
				</div>
			</div>
		</Card>

		{#if player.powerupsLoading}
			<div class="flex items-center justify-center py-12">
				<Spinner size="lg" />
			</div>
		{:else}
			<!-- Information powerups -->
			<div class="mb-6">
				<h2 class="text-sm font-medium text-text-dark-muted mb-3">INFORMATION</h2>
				<div class="space-y-3">
					{#each powerupsByCategory.information as powerup}
						{@const quantity = getQuantity(powerup.id)}
						{@const affordable = canAfford(powerup.cost)}
						<Card>
							<div class="flex items-start gap-4">
								<div class="w-12 h-12 rounded-lg bg-bg-dark-tertiary flex items-center justify-center flex-shrink-0">
									<span class="text-2xl">{powerup.icon}</span>
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-1">
										<p class="font-medium">{powerup.name}</p>
										<Badge size="sm" variant="gold">{powerup.cost} pts</Badge>
									</div>
									<p class="text-sm text-text-dark-muted">{powerup.description}</p>
									<p class="text-sm mt-2">
										Owned: <span class="font-medium text-gold">{quantity}</span>
									</p>
								</div>
								<Button
									onclick={() => handlePurchase(powerup.id)}
									disabled={!affordable || purchasing === powerup.id}
									loading={purchasing === powerup.id}
									size="sm"
									variant={affordable ? 'primary' : 'secondary'}
								>
									{affordable ? 'Buy' : `Need ${powerup.cost - (auth.profile?.total_points || 0)}`}
								</Button>
							</div>
						</Card>
					{/each}
				</div>
			</div>

			<!-- Navigation powerups -->
			<div class="mb-6">
				<h2 class="text-sm font-medium text-text-dark-muted mb-3">NAVIGATION</h2>
				<div class="space-y-3">
					{#each powerupsByCategory.navigation as powerup}
						{@const quantity = getQuantity(powerup.id)}
						{@const affordable = canAfford(powerup.cost)}
						<Card>
							<div class="flex items-start gap-4">
								<div class="w-12 h-12 rounded-lg bg-bg-dark-tertiary flex items-center justify-center flex-shrink-0">
									<span class="text-2xl">{powerup.icon}</span>
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-1">
										<p class="font-medium">{powerup.name}</p>
										<Badge size="sm" variant="gold">{powerup.cost} pts</Badge>
									</div>
									<p class="text-sm text-text-dark-muted">{powerup.description}</p>
									<p class="text-sm mt-2">
										Owned: <span class="font-medium text-gold">{quantity}</span>
									</p>
								</div>
								<Button
									onclick={() => handlePurchase(powerup.id)}
									disabled={!affordable || purchasing === powerup.id}
									loading={purchasing === powerup.id}
									size="sm"
									variant={affordable ? 'primary' : 'secondary'}
								>
									{affordable ? 'Buy' : `Need ${powerup.cost - (auth.profile?.total_points || 0)}`}
								</Button>
							</div>
						</Card>
					{/each}
				</div>
			</div>

			<!-- Strategic powerups -->
			<div class="mb-6">
				<h2 class="text-sm font-medium text-text-dark-muted mb-3">STRATEGIC</h2>
				<div class="space-y-3">
					{#each powerupsByCategory.strategic as powerup}
						{@const quantity = getQuantity(powerup.id)}
						{@const affordable = canAfford(powerup.cost)}
						<Card>
							<div class="flex items-start gap-4">
								<div class="w-12 h-12 rounded-lg bg-bg-dark-tertiary flex items-center justify-center flex-shrink-0">
									<span class="text-2xl">{powerup.icon}</span>
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-1">
										<p class="font-medium">{powerup.name}</p>
										<Badge size="sm" variant="gold">{powerup.cost} pts</Badge>
									</div>
									<p class="text-sm text-text-dark-muted">{powerup.description}</p>
									<p class="text-sm mt-2">
										Owned: <span class="font-medium text-gold">{quantity}</span>
									</p>
								</div>
								<Button
									onclick={() => handlePurchase(powerup.id)}
									disabled={!affordable || purchasing === powerup.id}
									loading={purchasing === powerup.id}
									size="sm"
									variant={affordable ? 'primary' : 'secondary'}
								>
									{affordable ? 'Buy' : `Need ${powerup.cost - (auth.profile?.total_points || 0)}`}
								</Button>
							</div>
						</Card>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</main>
