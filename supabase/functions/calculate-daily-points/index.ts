import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseAdmin } from '../_shared/supabase-client.ts';

serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const admin = getSupabaseAdmin();

		// Get target date (today or specified)
		const { date } = await req.json().catch(() => ({}));
		const targetDate = date || new Date().toISOString().split('T')[0];

		// Get today's challenge
		const { data: challenge, error: challengeError } = await admin
			.from('daily_challenges')
			.select('id')
			.eq('challenge_date', targetDate)
			.single();

		if (challengeError || !challenge) {
			return new Response(JSON.stringify({ error: 'No challenge found for date' }), {
				status: 404,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// Get all verified results for this challenge
		const { data: results, error: resultsError } = await admin
			.from('game_results')
			.select('id, user_id, hops, duration_seconds')
			.eq('challenge_id', challenge.id)
			.eq('mode', 'daily')
			.eq('verified', true)
			.not('completed_at', 'is', null)
			.order('hops', { ascending: true })
			.order('duration_seconds', { ascending: true });

		if (resultsError) {
			throw resultsError;
		}

		if (!results || results.length === 0) {
			return new Response(JSON.stringify({ message: 'No results to process' }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const totalPlayers = results.length;
		const updates: { id: string; points: number; userId: string }[] = [];

		// Calculate percentile-based points (more granular at the top)
		for (let i = 0; i < results.length; i++) {
			const rank = i + 1;
			const percentile = (rank / totalPlayers) * 100;

			let points: number;
			if (percentile <= 1) points = 30;        // Top 1%
			else if (percentile <= 2) points = 27;   // Top 2%
			else if (percentile <= 5) points = 24;   // Top 5%
			else if (percentile <= 10) points = 20;  // Top 10%
			else if (percentile <= 20) points = 16;  // Top 20%
			else if (percentile <= 30) points = 13;  // Top 30%
			else if (percentile <= 40) points = 10;  // Top 40%
			else if (percentile <= 50) points = 8;   // Top 50%
			else if (percentile <= 60) points = 6;   // Top 60%
			else if (percentile <= 70) points = 5;   // Top 70%
			else if (percentile <= 80) points = 4;   // Top 80%
			else if (percentile <= 90) points = 3;   // Top 90%
			else points = 2;                         // Everyone else

			updates.push({
				id: results[i].id,
				points,
				userId: results[i].user_id
			});
		}

		// Update game results with points
		for (const update of updates) {
			await admin
				.from('game_results')
				.update({ points_awarded: update.points })
				.eq('id', update.id);

			// Update profile total_points
			const { data: profile } = await admin
				.from('profiles')
				.select('total_points')
				.eq('id', update.userId)
				.single();

			if (profile) {
				await admin
					.from('profiles')
					.update({
						total_points: profile.total_points + update.points,
						updated_at: new Date().toISOString()
					})
					.eq('id', update.userId);
			}
		}

		return new Response(
			JSON.stringify({
				success: true,
				processed: updates.length,
				date: targetDate
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
