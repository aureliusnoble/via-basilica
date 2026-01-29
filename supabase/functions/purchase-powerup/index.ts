import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient, getSupabaseAdmin } from '../_shared/supabase-client.ts';

serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const authHeader = req.headers.get('Authorization');
		const supabase = getSupabaseClient(authHeader);
		const admin = getSupabaseAdmin();

		// Get current user
		const {
			data: { user },
			error: authError
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const { powerup_id } = await req.json();

		if (!powerup_id) {
			return new Response(JSON.stringify({ error: 'powerup_id required' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// Get powerup definition
		const { data: powerup, error: powerupError } = await admin
			.from('powerup_definitions')
			.select('point_cost')
			.eq('id', powerup_id)
			.single();

		if (powerupError || !powerup) {
			return new Response(JSON.stringify({ error: 'Powerup not found' }), {
				status: 404,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// Get user's current points
		const { data: profile, error: profileError } = await admin
			.from('profiles')
			.select('total_points')
			.eq('id', user.id)
			.single();

		if (profileError || !profile) {
			return new Response(JSON.stringify({ error: 'Profile not found' }), {
				status: 404,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		if (profile.total_points < powerup.point_cost) {
			return new Response(JSON.stringify({ error: 'Insufficient points' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// Atomically deduct points and add powerup
		// First, deduct points
		const { error: deductError } = await admin
			.from('profiles')
			.update({
				total_points: profile.total_points - powerup.point_cost,
				updated_at: new Date().toISOString()
			})
			.eq('id', user.id);

		if (deductError) {
			throw deductError;
		}

		// Then, upsert the powerup
		const { data: existingPowerup } = await admin
			.from('player_powerups')
			.select('quantity')
			.eq('user_id', user.id)
			.eq('powerup_id', powerup_id)
			.single();

		if (existingPowerup) {
			await admin
				.from('player_powerups')
				.update({
					quantity: existingPowerup.quantity + 1,
					updated_at: new Date().toISOString()
				})
				.eq('user_id', user.id)
				.eq('powerup_id', powerup_id);
		} else {
			await admin.from('player_powerups').insert({
				user_id: user.id,
				powerup_id,
				quantity: 1
			});
		}

		return new Response(
			JSON.stringify({
				success: true,
				remaining_points: profile.total_points - powerup.point_cost
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
