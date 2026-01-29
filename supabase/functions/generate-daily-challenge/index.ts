import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseAdmin } from '../_shared/supabase-client.ts';
import { fetchRandomArticles, fetchArticleInfo } from '../_shared/wikipedia-api.ts';

// Categories that can be blocked during daily challenges
const BLOCKABLE_CATEGORIES = [
	'Religion',
	'History',
	'People',
	'Philosophy',
	'Culture',
	'Education',
	'Society',
	'Geography',
	'Humanities',
	'Language',
	'Government',
	'Law'
];

function selectBlockedCategories(): string[] {
	const count = Math.floor(Math.random() * 3) + 1; // 1-3 categories
	const shuffled = [...BLOCKABLE_CATEGORIES].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, count);
}

serve(async (req) => {
	// Handle CORS preflight
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const supabase = getSupabaseAdmin();

		// Get target date (today or specified)
		const { date } = await req.json().catch(() => ({}));
		const targetDate = date || new Date().toISOString().split('T')[0];

		// Check if challenge already exists for this date
		const { data: existing } = await supabase
			.from('daily_challenges')
			.select('id')
			.eq('challenge_date', targetDate)
			.single();

		if (existing) {
			return new Response(JSON.stringify({ message: 'Challenge already exists', id: existing.id }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// Fetch random articles and validate
		const candidates = await fetchRandomArticles(10);
		let selectedArticle = null;

		for (const candidate of candidates) {
			const info = await fetchArticleInfo(candidate.title);

			// Validation criteria
			if (
				info.length >= 5000 &&
				info.linksCount >= 20 &&
				!info.isStub &&
				!info.isDisambiguation &&
				!candidate.title.toLowerCase().includes('list of') &&
				!candidate.title.toLowerCase().includes('index of')
			) {
				selectedArticle = {
					title: candidate.title,
					length: info.length
				};
				break;
			}
		}

		if (!selectedArticle) {
			// Fallback: use first non-stub article
			for (const candidate of candidates) {
				const info = await fetchArticleInfo(candidate.title);
				if (!info.isStub && !info.isDisambiguation) {
					selectedArticle = {
						title: candidate.title,
						length: info.length
					};
					break;
				}
			}
		}

		if (!selectedArticle) {
			return new Response(JSON.stringify({ error: 'No suitable article found' }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// Select blocked categories for this challenge
		const blockedCategories = selectBlockedCategories();

		// Insert the challenge
		const { data, error } = await supabase
			.from('daily_challenges')
			.insert({
				challenge_date: targetDate,
				start_article: selectedArticle.title,
				start_article_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(selectedArticle.title.replace(/ /g, '_'))}`,
				article_length: selectedArticle.length,
				blocked_categories: blockedCategories
			})
			.select()
			.single();

		if (error) {
			throw error;
		}

		return new Response(JSON.stringify({ success: true, challenge: data }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
});
