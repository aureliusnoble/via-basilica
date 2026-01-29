<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import { getUIState, setShowBiographyModal } from '$lib/state/ui.svelte.js';
	import TimelineItem from '$lib/components/bio/TimelineItem.svelte';
	import StatCard from '$lib/components/bio/StatCard.svelte';
	import QuoteBlock from '$lib/components/bio/QuoteBlock.svelte';
	import SectionCard from '$lib/components/bio/SectionCard.svelte';
	import {
		Baby,
		Cross,
		GraduationCap,
		Hospital,
		Calendar,
		Users,
		Shield,
		Building2,
		Sparkles,
		Gift,
		Cake
	} from 'lucide-svelte';

	const ui = getUIState();

	function close() {
		setShowBiographyModal(false);
	}

	const timelineEvents = [
		{
			year: '330 AD',
			title: 'Born in Caesarea',
			description: 'Born into a wealthy and deeply pious family in Cappadocia. His grandmother Macrina, parents, and four siblings are all venerated as saints.'
		},
		{
			year: '~351 AD',
			title: 'Studies in Athens',
			description: 'Attends the prestigious Academy of Athens alongside Gregory of Nazianzus (lifelong friend) and the future Emperor Julian.'
		},
		{
			year: '~358 AD',
			title: 'Embraces Asceticism',
			description: 'Influenced by his sister Macrina the Younger, he abandons a promising career in rhetoric to pursue the monastic life, founding a community at Annesi.'
		},
		{
			year: '370 AD',
			title: 'Bishop of Caesarea',
			description: 'Elected Bishop despite fierce opposition. Immediately begins defending Nicene Christianity against the Arian Emperor Valens.'
		},
		{
			year: '372 AD',
			title: 'Founds the Basiliad',
			description: 'Completes the world\'s first true hospital complex—providing free medical care, housing, job training, and a pioneering leprosy ward.'
		},
		{
			year: '379 AD',
			title: 'Death',
			description: 'Dies on January 1st, exhausted from years of ascetic living and tireless service. The entire city mourns; crowds throng his funeral.'
		}
	];
</script>

<Modal open={ui.showBiographyModal} onclose={close} title="" size="lg">
	<div class="bio-content space-y-8 -mt-2">
		<!-- Hero Section -->
		<section class="text-center py-4">
			<div class="cross-glow mb-4 flex justify-center">
				<Cross size={48} class="text-gold" />
			</div>
			<h1 class="text-3xl font-serif text-gold mb-2">Basil the Great</h1>
			<p class="text-text-dark-muted font-serif">c. 330 – 379 AD</p>
			<p class="text-sm text-text-dark-muted mt-1">Bishop of Caesarea • Doctor of the Church</p>
		</section>

		<!-- Key Stats -->
		<section class="py-2">
			<div class="stats-scroll">
				<StatCard label="Birth" value="330 AD">
					{#snippet icon()}<Baby size={24} />{/snippet}
				</StatCard>
				<StatCard label="Death" value="379 AD">
					{#snippet icon()}<Cross size={24} />{/snippet}
				</StatCard>
				<StatCard label="Known For" value="Monasticism">
					{#snippet icon()}<Users size={24} />{/snippet}
				</StatCard>
				<StatCard label="Legacy" value="First Hospital">
					{#snippet icon()}<Hospital size={24} />{/snippet}
				</StatCard>
			</div>
		</section>

		<!-- Featured Quote -->
		<section>
			<QuoteBlock
				quote="The bread in your cupboard belongs to the hungry; the coat unused in your closet belongs to the one who needs it; the shoes rotting in your closet belong to the one who has no shoes; the money which you hoard belongs to the poor."
				attribution="Basil the Great"
				context="From his homily on Luke 12:18"
			/>
		</section>

		<!-- Introduction -->
		<section class="prose prose-invert max-w-none">
			<p class="text-text-dark leading-relaxed">
				Born into a family where sanctity was almost hereditary—his grandmother, parents, and four siblings are all venerated as saints—Basil transformed from a brilliant student destined for worldly fame into one of Christianity's most influential figures.
			</p>
			<p class="text-text-dark-muted leading-relaxed">
				As one of the three <strong class="text-gold">Cappadocian Fathers</strong> (alongside his brother Gregory of Nyssa and his friend Gregory of Nazianzus), he shaped the doctrine of the Trinity, defended orthodox Christianity against emperors, invented the hospital, and established the monastic tradition that would influence both East and West for millennia.
			</p>
		</section>

		<!-- Timeline -->
		<section>
			<h2 class="text-xl font-serif text-gold text-center mb-6">Life & Legacy</h2>
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
		</section>

		<!-- Section Cards -->
		<section class="space-y-4">
			<SectionCard title="Father of Communal Monasticism">
				{#snippet icon()}<Users size={28} />{/snippet}
				<p>
					While hermit monks existed before Basil, he revolutionized religious life by establishing <strong class="text-text-dark">communal monasticism</strong>—communities where monks lived, worked, and prayed together while serving the broader society.
				</p>
				<p class="mt-2">
					His monastic rules influenced Saint Benedict, making Basil the spiritual grandfather of virtually every Western monastery, abbey, and religious order that followed.
				</p>
			</SectionCard>

			<SectionCard title="Defender Against Empire">
				{#snippet icon()}<Shield size={28} />{/snippet}
				<p>
					When the Arian Emperor Valens sent his prefect Modestus to intimidate Basil into heresy, threatening confiscation, exile, torture, and death, Basil replied that none of these frightened him—he had nothing but "a few rags and some books," exile couldn't remove him from God's care, and death would only hasten him home.
				</p>
				<p class="mt-2 italic text-text-dark">
					Astonished, Modestus exclaimed: "No one has ever spoken to me with such boldness!"
				</p>
				<p class="mt-1 text-gold font-medium">
					"Perhaps," Basil replied, "you have never met a bishop before."
				</p>
			</SectionCard>

			<SectionCard title="The Basiliad: First Hospital">
				{#snippet icon()}<Building2 size={28} />{/snippet}
				<p>
					During a devastating famine in 368 AD, Basil sold his inheritance to feed the hungry. But he dreamed bigger: a permanent institution to serve the suffering.
				</p>
				<p class="mt-2">
					The <strong class="text-text-dark">Basiliad</strong>, completed around 372 AD, was so vast it was called a "new city." It included a 300-bed hospital with professional physicians, housing for the elderly and travelers, job training workshops, and—revolutionary for its time—a ward for lepers, whom Basil personally tended.
				</p>
				<p class="mt-2">
					Unlike Greek healing temples that charged fees and rejected terminal cases, the Basiliad served everyone freely. It became the model for hospitals throughout the Christian world.
				</p>
			</SectionCard>

			<SectionCard title="Theological Giant">
				{#snippet icon()}<Sparkles size={28} />{/snippet}
				<p>
					Basil's greatest theological contribution was clarifying the doctrine of the <strong class="text-text-dark">Holy Trinity</strong>. He defined the crucial distinction between <em>ousia</em> (essence—one God) and <em>hypostasis</em> (persons—Father, Son, and Holy Spirit).
				</p>
				<p class="mt-2">
					His treatise <em>On the Holy Spirit</em> established the Spirit's full divinity. The <strong class="text-text-dark">Divine Liturgy of Saint Basil</strong> is still celebrated in Eastern churches to this day.
				</p>
			</SectionCard>
		</section>

		<!-- Fun Facts -->
		<section>
			<h2 class="text-lg font-serif text-gold text-center mb-4">Did You Know?</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<div class="fun-fact-card">
					<div class="flex items-center gap-3 mb-2">
						<Gift size={20} class="text-gold" />
						<h3 class="text-gold font-medium">Greek Santa Claus</h3>
					</div>
					<p class="text-text-dark-muted text-sm">
						In Greece, Basil—not Saint Nicholas—brings gifts to children on New Year's Eve, traveling from distant Caesarea.
					</p>
				</div>
				<div class="fun-fact-card">
					<div class="flex items-center gap-3 mb-2">
						<Cake size={20} class="text-gold" />
						<h3 class="text-gold font-medium">Vasilopita</h3>
					</div>
					<p class="text-text-dark-muted text-sm">
						His feast day is celebrated with Vasilopita—a special cake with a hidden coin. Legend says Basil baked coins into bread to secretly return wealth to the poor.
					</p>
				</div>
			</div>
		</section>

		<!-- Footer -->
		<section class="text-center pt-4 border-t border-bg-dark-tertiary">
			<p class="text-text-dark-muted text-xs">
				Saint Basil the Great • One of the Three Holy Hierarchs
			</p>
			<p class="text-text-dark-muted text-xs mt-1">
				Patron of hospital administrators, monks, and Russia
			</p>
		</section>
	</div>
</Modal>
