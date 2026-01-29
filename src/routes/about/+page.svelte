<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
</script>

<svelte:head>
	<title>About Basil - Via Basilica</title>
</svelte:head>

<Header title="About Basil" backHref="/profile" />

<main class="max-w-lg mx-auto px-4 py-6">
	<article class="prose prose-invert prose-gold max-w-none">
		<div class="text-center mb-8">
			<div class="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-gold/30 to-crimson/20 flex items-center justify-center">
				<span class="text-5xl">&#x2628;</span>
			</div>
		</div>

		<h1 class="text-2xl font-serif text-gold text-center mb-6">Basil the Great</h1>

		<p class="lead text-lg">
			Born around 330 AD into a family of saints in Caesarea, Cappadocia, Basil the Great
			transformed from a brilliant scholar destined for worldly success into one of history's most
			influential religious leaders.
		</p>

		<p>
			After studying at the renowned University of Athens alongside future emperor Julian the
			Apostate, he abandoned a promising legal career when his sister Macrina challenged his
			worldly ambitions.
		</p>

		<h2 class="text-xl font-serif text-gold mt-8 mb-4">Father of Communal Monasticism</h2>
		<p>
			Basil founded communal monasticism in the East, establishing rules that emphasized service to
			society alongside prayer. His revolutionary approach inspired both Eastern Orthodox
			monasticism and, through Saint Benedict, Western religious orders still active today.
		</p>

		<h2 class="text-xl font-serif text-gold mt-8 mb-4">Defender of the Faith</h2>
		<p>
			As Bishop of Caesarea, Basil fearlessly defended orthodox Christianity against Emperor Valens
			and his Arian heresy. When the imperial prefect Modestus threatened him with confiscation,
			exile, torture, and death, Basil famously replied that these threats meant nothing to a man
			with only "wretched rags and a few books."
		</p>
		<blockquote class="border-l-4 border-gold pl-4 my-6 italic text-text-dark-muted">
			"Perhaps you have never met a bishop before."
			<footer class="text-gold not-italic mt-2">— Basil's response to Prefect Modestus</footer>
		</blockquote>

		<h2 class="text-xl font-serif text-gold mt-8 mb-4">The Basiliad</h2>
		<p>
			His greatest legacy was the Basiliad, considered the world's first true hospital. This
			massive complex outside Caesarea provided free medical care, housing for travelers, an
			orphanage, job training, and leprosy treatment. Basil himself served in the leprosy ward,
			personally caring for patients society had abandoned.
		</p>

		<h2 class="text-xl font-serif text-gold mt-8 mb-4">Legacy</h2>
		<p>
			Basil died on January 1, 379 AD at age 49. In Greece, he serves as the equivalent of Santa
			Claus, visiting children on New Year's Eve from distant Caesarea. His feast day is celebrated
			with Vasilopita, a special cake containing a hidden lucky coin honoring his legendary
			generosity to the poor.
		</p>

		<div class="text-center mt-8 pt-8 border-t border-bg-dark-tertiary">
			<p class="text-sm text-text-dark-muted">
				Learn more at <a href="https://en.wikipedia.org/wiki/Basil_of_Caesarea" target="_blank" rel="noopener" class="text-gold hover:underline">Wikipedia</a>
			</p>
		</div>
	</article>
</main>
