-- Create game_results table
CREATE TABLE game_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id INTEGER REFERENCES daily_challenges(id) ON DELETE SET NULL,
    mode TEXT NOT NULL CHECK (mode IN ('daily', 'random', 'archive')),
    start_article TEXT NOT NULL,
    hops INTEGER DEFAULT 0,
    path JSONB DEFAULT '[]'::JSONB,
    powerups_used JSONB DEFAULT '[]'::JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    points_awarded INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_game_results_user ON game_results(user_id);
CREATE INDEX idx_game_results_challenge ON game_results(challenge_id);
CREATE INDEX idx_game_results_mode ON game_results(mode);
CREATE INDEX idx_game_results_completed ON game_results(completed_at);

-- Unique partial index: one daily attempt per user per challenge
CREATE UNIQUE INDEX idx_unique_daily_attempt
    ON game_results(user_id, challenge_id)
    WHERE mode = 'daily' AND challenge_id IS NOT NULL;

-- Enable RLS
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view completed results (for leaderboard)
CREATE POLICY "Completed results are viewable by everyone"
    ON game_results FOR SELECT
    USING (completed_at IS NOT NULL OR auth.uid() = user_id);

-- Users can insert their own results
CREATE POLICY "Users can insert their own results"
    ON game_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own in-progress results
CREATE POLICY "Users can update their own results"
    ON game_results FOR UPDATE
    USING (auth.uid() = user_id);
