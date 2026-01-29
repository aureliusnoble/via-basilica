<script lang="ts">
	import { X, HelpCircle } from 'lucide-svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import PowerupIcon from '$lib/components/ui/PowerupIcon.svelte';
	import { setShowBiographyModal } from '$lib/state/ui.svelte.js';
	import { formatDuration } from '$lib/utils/date-helpers.js';
	import { POWERUPS, type PowerupId } from '$lib/types/powerup.js';

	interface Props {
		hops: number;
		elapsedSeconds: number;
		powerupSlots: [string | null, string | null];
		activePowerup: string | null;
		onActivatePowerup: (index: 0 | 1) => void;
		backHref?: string;
	}

	let {
		hops,
		elapsedSeconds,
		powerupSlots,
		activePowerup,
		onActivatePowerup,
		backHref = '/play'
	}: Props = $props();

	function getPowerupInfo(id: string | null) {
		if (!id) return null;
		return POWERUPS[id as PowerupId] || null;
	}
</script>

<header class="sticky top-0 z-30 bg-bg-dark/95 backdrop-blur-sm border-b border-bg-dark-tertiary">
	<div class="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
		<!-- Back button -->
		<a
			href={backHref}
			class="p-2 -ml-2 rounded-lg hover:bg-bg-dark-tertiary transition-colors touch-target"
			aria-label="Exit game"
		>
			<X size={20} />
		</a>

		<!-- Stats -->
		<div class="flex items-center gap-4">
			<div class="text-center">
				<p class="text-2xl font-bold text-gold">{hops}</p>
				<p class="text-xs text-text-dark-muted">hops</p>
			</div>
			<div class="text-center">
				<p class="text-lg font-medium text-text-dark">{formatDuration(elapsedSeconds)}</p>
				<p class="text-xs text-text-dark-muted">time</p>
			</div>
		</div>

		<!-- Powerup slots + help -->
		<div class="flex items-center gap-1">
			{#each powerupSlots as slotId, index}
				{@const powerup = getPowerupInfo(slotId)}
				<button
					onclick={() => onActivatePowerup(index as 0 | 1)}
					disabled={!powerup}
					class="w-10 h-10 rounded-lg flex items-center justify-center transition-all
						{powerup ? 'bg-bg-dark-tertiary hover:bg-gold/20' : 'bg-bg-dark-tertiary/50 opacity-50'}
						{activePowerup === slotId ? 'ring-2 ring-gold animate-pulse' : ''}"
					title={powerup?.name || 'Empty slot'}
				>
					{#if powerup}
						<PowerupIcon icon={powerup.icon} size={18} class="text-gold" />
					{:else}
						<span class="text-text-dark-muted">-</span>
					{/if}
				</button>
			{/each}

			<button
				onclick={() => setShowBiographyModal(true)}
				class="p-2 rounded-lg hover:bg-bg-dark-tertiary transition-colors"
				aria-label="About Basil"
			>
				<HelpCircle size={20} class="text-gold" />
			</button>
		</div>
	</div>
</header>
