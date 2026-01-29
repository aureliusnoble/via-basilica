import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient, getSupabaseAdmin } from '../_shared/supabase-client.ts';
import { verifyLinkExists } from '../_shared/wikipedia-api.ts';

const TARGET_ARTICLE = 'Basil_of_Caesarea';
const MIN_SECONDS_PER_HOP = 2;

serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const authHeader = req.headers.get('Authorization');
		const supabase = getSupabaseClient(authHeader);
		const admin = getSupabaseAdmin();

		const { game_id } = await req.json();

		if (!game_id) {
			return new Response(JSON.stringify({ error: 'game_id required' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// Get the game result
		const { data: game, error: fetchError } = await supabase
			.from('game_results')
			.select('*, daily_challenges(start_article)')
			.eq('id', game_id)
			.single();

		if (fetchError || !game) {
			return new Response(JSON.stringify({ error: 'Game not found' }), {
				status: 404,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const path = game.path as { article_title: string; is_free_step: boolean }[];
		let verified = true;
		const issues: string[] = [];

		// Verify path starts with correct article
		const expectedStart = game.daily_challenges?.start_article || game.start_article;
		if (path.length === 0 || path[0].article_title !== expectedStart) {
			verified = false;
			issues.push('Invalid start article');
		}

		// Verify path ends with target
		const lastStep = path[path.length - 1];
		const normalizedLast = lastStep?.article_title.replace(/ /g, '_');
		if (normalizedLast !== TARGET_ARTICLE && normalizedLast !== 'Basil_the_Great') {
			verified = false;
			issues.push('Did not reach target article');
		}

		// Verify each link exists (sample a few for performance)
		if (verified && path.length > 1) {
			const pairsToCheck = Math.min(3, path.length - 1);
			const indices = [];

			// Always check first and last transition
			indices.push(0);
			if (path.length > 2) {
				indices.push(path.length - 2);
			}

			// Add a random middle one if path is long
			if (path.length > 4) {
				indices.push(Math.floor(path.length / 2));
			}

			for (const i of indices) {
				const exists = await verifyLinkExists(path[i].article_title, path[i + 1].article_title);
				if (!exists) {
					verified = false;
					issues.push(`Link from "${path[i].article_title}" to "${path[i + 1].article_title}" not found`);
					break;
				}
			}
		}

		// Check timing (flag suspicious if too fast)
		if (game.duration_seconds && game.hops > 0) {
			const avgSecondsPerHop = game.duration_seconds / game.hops;
			if (avgSecondsPerHop < MIN_SECONDS_PER_HOP) {
				issues.push('Suspiciously fast completion');
				// Don't fail verification, just flag
			}
		}

		// Update the game result
		const { error: updateError } = await admin
			.from('game_results')
			.update({ verified })
			.eq('id', game_id);

		if (updateError) {
			throw updateError;
		}

		// Calculate and award points if verified (daily mode only)
		let pointsAwarded = game.points_awarded;
		if (verified && game.mode === 'daily' && game.points_awarded === 0) {
			const points = 5 + Math.max(0, 15 - game.hops);

			// Update game_results with points
			await admin
				.from('game_results')
				.update({ points_awarded: points })
				.eq('id', game_id);

			// Update profile total_points
			const { data: profile } = await admin
				.from('profiles')
				.select('total_points')
				.eq('id', game.user_id)
				.single();

			if (profile) {
				await admin
					.from('profiles')
					.update({ total_points: (profile.total_points || 0) + points })
					.eq('id', game.user_id);
			}

			pointsAwarded = points;
		}

		return new Response(
			JSON.stringify({
				verified,
				issues,
				points_awarded: pointsAwarded
			}),
			{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
});
