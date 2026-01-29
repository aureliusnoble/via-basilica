<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TimelineItem from '$lib/components/bio/TimelineItem.svelte';
	import StatCard from '$lib/components/bio/StatCard.svelte';
	import QuoteBlock from '$lib/components/bio/QuoteBlock.svelte';
	import SectionCard from '$lib/components/bio/SectionCard.svelte';

	const timelineEvents = [
		{
			year: '330 AD',
			title: 'Birth in Caesarea',
			description: 'Born into a family of saints in Caesarea, Cappadocia (modern-day Turkey).'
		},
		{
			year: '~350 AD',
			title: 'University of Athens',
			description: 'Studies rhetoric and philosophy alongside future emperor Julian the Apostate.'
		},
		{
			year: '~358 AD',
			title: 'Founds Monasticism',
			description: 'Abandons a promising legal career to establish communal monasticism in the East.'
		},
		{
			year: '~370 AD',
			title: 'Bishop of Caesarea',
			description: 'Becomes Bishop and fearlessly defends orthodox Christianity against Emperor Valens.'
		},
		{
			year: '~372 AD',
			title: 'Builds the Basiliad',
			description: 'Establishes the world\'s first true hospital, providing free care to all.'
		},
		{
			year: '379 AD',
			title: 'Death',
			description: 'Dies on January 1st, aged 49. Remembered as one of the Cappadocian Fathers.'
		}
	];
</script>

<svelte:head>
	<title>About Basil - Via Basilica</title>
</svelte:head>

<Header title="About Basil" backHref="/profile" />

<main class="min-h-screen">
	<!-- Hero Section -->
	<section class="byzantine-pattern relative py-16 px-4 text-center overflow-hidden">
		<!-- Background radial gradient -->
		<div class="absolute inset-0 bg-gradient-radial from-gold/5 via-transparent to-transparent"></div>

		<!-- Large Byzantine Cross -->
		<div class="cross-glow text-8xl md:text-9xl mb-6 text-gold">&#x2628;</div>

		<!-- Title -->
		<h1 class="text-4xl md:text-5xl font-serif text-gold-gradient mb-3">Basil the Great</h1>

		<!-- Dates -->
		<p class="text-xl text-text-dark-muted font-serif mb-4">c. 330 – 379 AD</p>

		<!-- Location Badge -->
		<Badge variant="gold">
			<span class="flex items-center gap-1.5">
				<span>📍</span>
				<span>Caesarea, Cappadocia</span>
			</span>
		</Badge>
	</section>

	<!-- Key Facts Strip -->
	<section class="py-6 px-4">
		<div class="stats-scroll max-w-4xl mx-auto">
			<StatCard label="Birth" value="330 AD" icon="👶" />
			<StatCard label="Death (Age 49)" value="379 AD" icon="✝️" />
			<StatCard label="Known For" value="Father of Monasticism" icon="🏛️" />
			<StatCard label="Legacy" value="First Hospital" icon="🏥" />
		</div>
	</section>

	<!-- Featured Quote Section -->
	<section class="py-8 px-4">
		<div class="max-w-2xl mx-auto">
			<QuoteBlock
				quote="Perhaps you have never met a bishop before."
				attribution="Basil's response to Prefect Modestus"
				context="When threatened with confiscation, exile, torture, and death"
			/>
		</div>
	</section>

	<!-- Timeline Section -->
	<section class="py-8 px-4">
		<div class="max-w-2xl mx-auto">
			<h2 class="text-2xl font-serif text-gold text-center mb-8">Life & Legacy</h2>
			<div class="pl-2">
				{#each timelineEvents as event, i}
					<TimelineItem
						year={event.year}
						title={event.title}
						description={event.description}
						isLast={i === timelineEvents.length - 1}
					/>
				{/each}
			</div>
		</div>
	</section>

	<!-- Life Section Cards -->
	<section class="py-8 px-4">
		<div class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
			<SectionCard title="Father of Communal Monasticism" icon="📿">
				<p>
					Basil founded communal monasticism in the East, establishing rules that emphasized
					service to society alongside prayer. His revolutionary approach inspired both
					Eastern Orthodox monasticism and, through Saint Benedict, Western religious orders
					still active today.
				</p>
			</SectionCard>

			<SectionCard title="Defender of the Faith" icon="⚔️">
				<p>
					As Bishop of Caesarea, Basil fearlessly defended orthodox Christianity against
					Emperor Valens and his Arian heresy. When threatened, he replied that confiscation
					meant nothing to a man with only "wretched rags and a few books."
				</p>
			</SectionCard>

			<SectionCard title="The Basiliad" icon="🏥">
				<p>
					His greatest legacy was the Basiliad, considered the world's first true hospital.
					This massive complex provided free medical care, housing for travelers, an orphanage,
					job training, and leprosy treatment. Basil himself served in the leprosy ward.
				</p>
			</SectionCard>

			<SectionCard title="Lasting Legacy" icon="🌟">
				<p>
					Honored as one of the Three Holy Hierarchs alongside Gregory the Theologian and
					John Chrysostom. His liturgy is still celebrated in Eastern churches, and his
					theological writings shaped Christian doctrine for centuries.
				</p>
			</SectionCard>
		</div>
	</section>

	<!-- Fun Facts Section -->
	<section class="py-8 px-4">
		<div class="max-w-2xl mx-auto">
			<h2 class="text-xl font-serif text-gold text-center mb-6">Did You Know?</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="fun-fact-card">
					<div class="text-2xl mb-2">🎅</div>
					<h3 class="text-gold font-medium mb-1">Greek Santa Claus</h3>
					<p class="text-text-dark-muted text-sm">
						In Greece, Basil serves as the equivalent of Santa Claus, visiting children
						on New Year's Eve from distant Caesarea.
					</p>
				</div>
				<div class="fun-fact-card">
					<div class="text-2xl mb-2">🪙</div>
					<h3 class="text-gold font-medium mb-1">Vasilopita</h3>
					<p class="text-text-dark-muted text-sm">
						His feast day is celebrated with Vasilopita, a special cake containing a
						hidden lucky coin honoring his legendary generosity.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<section class="py-12 px-4">
		<div class="max-w-2xl mx-auto text-center">
			<div class="border-t border-bg-dark-tertiary pt-8">
				<Button
					href="https://en.wikipedia.org/wiki/Basil_of_Caesarea"
					variant="secondary"
				>
					<span class="flex items-center gap-2">
						<span>📖</span>
						<span>Read More on Wikipedia</span>
					</span>
				</Button>
				<p class="text-text-dark-muted text-xs mt-6">
					Saint Basil the Great • Doctor of the Church • c. 330–379 AD
				</p>
			</div>
		</div>
	</section>
</main>
