-- Create game_paths table for detailed path tracking
CREATE TABLE game_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_result_id UUID NOT NULL REFERENCES game_results(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    article_title TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    is_free_step BOOLEAN DEFAULT FALSE,
    is_undone BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE
);

-- Create indexes
CREATE INDEX idx_game_paths_result ON game_paths(game_result_id);
CREATE INDEX idx_game_paths_step ON game_paths(game_result_id, step_number);

-- Enable RLS
ALTER TABLE game_paths ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view paths (for leaderboard path visualization)
CREATE POLICY "Game paths are viewable by everyone"
    ON game_paths FOR SELECT
    USING (true);

-- Users can insert paths for their own games
CREATE POLICY "Users can insert their own paths"
    ON game_paths FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM game_results
            WHERE id = game_result_id AND user_id = auth.uid()
        )
    );
