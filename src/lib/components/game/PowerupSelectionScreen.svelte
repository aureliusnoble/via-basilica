<script lang="ts">
	import { Check } from 'lucide-svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import PowerupIcon from '$lib/components/ui/PowerupIcon.svelte';
	import { POWERUPS, type PowerupId } from '$lib/types/powerup.js';
	import { getPlayerState, getPowerupQuantity } from '$lib/state/player.svelte.js';

	interface Props {
		onStart: (slots: [string | null, string | null]) => void;
		onSkip: () => void;
	}

	let { onStart, onSkip }: Props = $props();

	const player = getPlayerState();

	let selectedSlots = $state<[string | null, string | null]>([null, null]);

	const powerupList = Object.values(POWERUPS);

	function togglePowerup(id: string) {
		const quantity = getPowerupQuantity(id);
		if (quantity <= 0) return;

		// Check if already selected
		const currentIndex = selectedSlots.indexOf(id);
		if (currentIndex !== -1) {
			// Deselect
			selectedSlots[currentIndex] = null;
			selectedSlots = [...selectedSlots] as [string | null, string | null];
		} else {
			// Select in first empty slot
			const emptyIndex = selectedSlots.indexOf(null);
			if (emptyIndex !== -1) {
				selectedSlots[emptyIndex] = id;
				selectedSlots = [...selectedSlots] as [string | null, string | null];
			}
		}
	}

	function isSelected(id: string): boolean {
		return selectedSlots.includes(id);
	}

	function handleStart() {
		onStart(selectedSlots);
	}
</script>

<div class="max-w-lg mx-auto px-4 py-6">
	<div class="text-center mb-6">
		<h2 class="text-xl font-serif text-gold mb-2">Select Powerups</h2>
		<p class="text-text-dark-muted">Choose up to 2 powerups for this challenge</p>
	</div>

	<!-- Selected slots preview -->
	<div class="flex justify-center gap-4 mb-6">
		{#each selectedSlots as slotId, index}
			{@const powerup = slotId ? POWERUPS[slotId as PowerupId] : null}
			<div
				class="w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center
					{powerup ? 'border-gold bg-gold/10' : 'border-bg-dark-tertiary'}"
			>
				{#if powerup}
					<PowerupIcon icon={powerup.icon} size={28} class="text-gold" />
				{:else}
					<span class="text-text-dark-muted text-xs">Slot {index + 1}</span>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Powerup list -->
	<div class="space-y-3 mb-6">
		{#each powerupList as powerup}
			{@const quantity = getPowerupQuantity(powerup.id)}
			{@const selected = isSelected(powerup.id)}
			{@const disabled = quantity <= 0 && !selected}

			<button
				onclick={() => togglePowerup(powerup.id)}
				disabled={disabled}
				class="w-full text-left"
			>
				<Card
					variant={selected ? 'elevated' : 'default'}
					class="transition-all {selected ? 'ring-2 ring-gold' : ''} {disabled ? 'opacity-50' : 'hover:bg-bg-dark-tertiary'}"
				>
					<div class="flex items-center gap-4">
						<div class="w-12 h-12 rounded-lg bg-bg-dark-tertiary flex items-center justify-center flex-shrink-0">
							<PowerupIcon icon={powerup.icon} size={24} class="text-gold" />
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2">
								<p class="font-medium">{powerup.name}</p>
								<Badge size="sm" variant={quantity > 0 ? 'gold' : 'default'}>
									{quantity}
								</Badge>
							</div>
							<p class="text-sm text-text-dark-muted truncate">{powerup.description}</p>
						</div>
						{#if selected}
							<Check size={24} class="text-gold flex-shrink-0" />
						{/if}
					</div>
				</Card>
			</button>
		{/each}
	</div>

	<!-- Actions -->
	<div class="space-y-3">
		<Button onclick={handleStart} class="w-full">
			{selectedSlots.some(s => s !== null) ? 'Start with Powerups' : 'Start without Powerups'}
		</Button>
		<Button onclick={onSkip} variant="ghost" class="w-full">
			Skip Selection
		</Button>
	</div>

	<!-- Link to shop -->
	<div class="text-center mt-4">
		<a href="/powerups" class="text-sm text-gold hover:underline">
			Need more powerups? Visit the shop
		</a>
	</div>
</div>
