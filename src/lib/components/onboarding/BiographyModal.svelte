<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import { getUIState, setShowBiographyModal } from '$lib/state/ui.svelte.js';

	const ui = getUIState();

	function close() {
		setShowBiographyModal(false);
	}
</script>

<Modal bind:open={ui.showBiographyModal} onclose={close} title="Basil the Great" size="lg">
	<article class="prose prose-invert prose-gold max-w-none">
		<p class="lead">
			Born around 330 AD into a family of saints in Caesarea, Cappadocia, Basil the Great
			transformed from a brilliant scholar destined for worldly success into one of history's most
			influential religious leaders.
		</p>

		<p>
			After studying at the renowned University of Athens alongside future emperor Julian the
			Apostate, he abandoned a promising legal career when his sister Macrina challenged his
			worldly ambitions.
		</p>

		<h3 class="text-gold font-serif">Father of Communal Monasticism</h3>
		<p>
			Basil founded communal monasticism in the East, establishing rules that emphasized service to
			society alongside prayer. His revolutionary approach inspired both Eastern Orthodox
			monasticism and, through Saint Benedict, Western religious orders still active today.
		</p>

		<h3 class="text-gold font-serif">Defender of the Faith</h3>
		<p>
			As Bishop of Caesarea, Basil fearlessly defended orthodox Christianity against Emperor Valens
			and his Arian heresy. When the imperial prefect Modestus threatened him with confiscation,
			exile, torture, and death, Basil famously replied that these threats meant nothing to a man
			with only "wretched rags and a few books."
		</p>
		<p>
			Astonished, Modestus exclaimed no one had ever defied him so boldly. Basil's response:
			<em>"Perhaps you have never met a bishop before."</em>
		</p>

		<h3 class="text-gold font-serif">The Basiliad</h3>
		<p>
			His greatest legacy was the Basiliad, considered the world's first true hospital. This
			massive complex outside Caesarea provided free medical care, housing for travelers, an
			orphanage, job training, and leprosy treatment. Basil himself served in the leprosy ward,
			personally caring for patients society had abandoned.
		</p>

		<h3 class="text-gold font-serif">Legacy</h3>
		<p>
			Basil died on January 1, 379 AD at age 49. In Greece, he serves as the equivalent of Santa
			Claus, visiting children on New Year's Eve from distant Caesarea. His feast day is celebrated
			with Vasilopita, a special cake containing a hidden lucky coin honoring his legendary
			generosity to the poor.
		</p>
	</article>
</Modal>
