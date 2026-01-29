import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseAdmin } from '../_shared/supabase-client.ts';
import { fetchRandomArticles, fetchArticleInfo, fetchBacklinks } from '../_shared/wikipedia-api.ts';

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

// Target article
const TARGET_ARTICLE = 'Basil_of_Caesarea';

// Max attempts to find valid blocked categories
const MAX_VALIDATION_ATTEMPTS = 10;

function selectBlockedCategories(): string[] {
	const count = Math.floor(Math.random() * 3) + 1; // 1-3 categories
	const shuffled = [...BLOCKABLE_CATEGORIES].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, count);
}

// Validate that the game is winnable with the given blocked categories
// At least one backlink to Basil the Great must not be blocked
async function validateBlockedCategories(
	blockedCategories: string[],
	supabaseUrl: string
): Promise<boolean> {
	try {
		// Get backlinks to target article (pages that link TO Basil the Great)
		const backlinks = await fetchBacklinks(TARGET_ARTICLE, 50);

		if (backlinks.length === 0) {
			console.log('No backlinks found for target article');
			return true; // Can't validate, assume OK
		}

		// Check which backlinks are blocked using our edge function
		const checkUrl = `${supabaseUrl}/functions/v1/check-article-categories`;
		const response = await fetch(checkUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
			},
			body: JSON.stringify({
				titles: backlinks,
				blockedCategories
			})
		});

		if (!response.ok) {
			console.error('Failed to check backlink categories:', response.statusText);
			return true; // Can't validate, assume OK
		}

		const { blockedLinks } = await response.json();

		// Count how many backlinks are NOT blocked
		let unblockedCount = 0;
		for (const title of backlinks) {
			const blocked = blockedLinks[title] || blockedLinks[title.replace(/ /g, '_')];
			if (!blocked) {
				unblockedCount++;
			}
		}

		console.log(`Validation: ${unblockedCount}/${backlinks.length} backlinks are unblocked`);

		// Need at least one unblocked path to the target
		return unblockedCount > 0;
	} catch (error) {
		console.error('Error validating blocked categories:', error);
		return true; // Can't validate, assume OK
	}
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
		// Validate that the game is still winnable (at least one path to target exists)
		let blockedCategories: string[] = [];
		const supabaseUrl = Deno.env.get('SUPABASE_URL');

		for (let attempt = 0; attempt < MAX_VALIDATION_ATTEMPTS; attempt++) {
			blockedCategories = selectBlockedCategories();
			console.log(`Attempt ${attempt + 1}: Testing blocked categories:`, blockedCategories);

			if (!supabaseUrl) {
				console.log('No Supabase URL, skipping validation');
				break;
			}

			const isValid = await validateBlockedCategories(blockedCategories, supabaseUrl);
			if (isValid) {
				console.log('Blocked categories validated successfully');
				break;
			}

			console.log('Invalid blocked categories (game would be impossible), retrying...');
		}

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
