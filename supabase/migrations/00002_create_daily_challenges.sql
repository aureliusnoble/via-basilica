-- Create daily_challenges table
CREATE TABLE daily_challenges (
    id SERIAL PRIMARY KEY,
    challenge_date DATE UNIQUE NOT NULL,
    start_article TEXT NOT NULL,
    start_article_url TEXT NOT NULL,
    target_article TEXT DEFAULT 'Basil_of_Caesarea',
    article_length INTEGER,
    article_quality TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for date lookups
CREATE INDEX idx_daily_challenges_date ON daily_challenges(challenge_date);

-- Enable RLS
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view challenges
CREATE POLICY "Daily challenges are viewable by everyone"
    ON daily_challenges FOR SELECT
    USING (true);

-- Only service role can insert/update (via Edge Functions)
CREATE POLICY "Only service role can insert challenges"
    ON daily_challenges FOR INSERT
    WITH CHECK (false);

CREATE POLICY "Only service role can update challenges"
    ON daily_challenges FOR UPDATE
    USING (false);
