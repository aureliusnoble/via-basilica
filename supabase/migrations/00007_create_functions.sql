-- Function to get average hops leaderboard
CREATE OR REPLACE FUNCTION get_average_hops_leaderboard(min_games INTEGER DEFAULT 5)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    average_hops NUMERIC,
    games_played BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS user_id,
        p.username,
        p.display_name,
        p.avatar_url,
        ROUND(AVG(gr.hops)::NUMERIC, 2) AS average_hops,
        COUNT(*) AS games_played
    FROM profiles p
    INNER JOIN game_results gr ON gr.user_id = p.id
    WHERE gr.mode = 'daily'
        AND gr.completed_at IS NOT NULL
        AND gr.verified = TRUE
    GROUP BY p.id, p.username, p.display_name, p.avatar_url
    HAVING COUNT(*) >= min_games
    ORDER BY average_hops ASC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- Function to update player stats after game completion
CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Only run on completion (when completed_at changes from NULL to a value)
    IF OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL THEN
        UPDATE profiles
        SET
            games_played = games_played + 1,
            total_points = total_points + NEW.points_awarded,
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating stats
CREATE TRIGGER game_results_update_stats
    AFTER UPDATE ON game_results
    FOR EACH ROW
    EXECUTE FUNCTION update_player_stats();

-- Function to calculate XP and level
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
    lvl INTEGER := 1;
    threshold INTEGER;
BEGIN
    LOOP
        threshold := FLOOR(100 * POWER(lvl + 1, 1.5))::INTEGER;
        EXIT WHEN xp < threshold;
        lvl := lvl + 1;
    END LOOP;
    RETURN lvl;
END;
$$ LANGUAGE plpgsql;

-- Function to update XP and level
CREATE OR REPLACE FUNCTION update_player_xp(
    p_user_id UUID,
    p_xp_earned INTEGER
)
RETURNS VOID AS $$
DECLARE
    new_xp INTEGER;
    new_level INTEGER;
BEGIN
    SELECT total_xp + p_xp_earned INTO new_xp
    FROM profiles
    WHERE id = p_user_id;

    new_level := calculate_level(new_xp);

    UPDATE profiles
    SET
        total_xp = new_xp,
        level = new_level,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
