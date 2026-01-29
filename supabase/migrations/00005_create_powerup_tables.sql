-- Create powerup_definitions table
CREATE TABLE powerup_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    point_cost INTEGER NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('information', 'navigation', 'strategic'))
);

-- Create player_powerups table
CREATE TABLE player_powerups (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    powerup_id TEXT REFERENCES powerup_definitions(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, powerup_id)
);

-- Create daily_powerup_selections table
CREATE TABLE daily_powerup_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_date DATE NOT NULL,
    slot_1 TEXT REFERENCES powerup_definitions(id),
    slot_2 TEXT REFERENCES powerup_definitions(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, challenge_date)
);

-- Create indexes
CREATE INDEX idx_player_powerups_user ON player_powerups(user_id);
CREATE INDEX idx_daily_powerup_selections_user_date ON daily_powerup_selections(user_id, challenge_date);

-- Enable RLS
ALTER TABLE powerup_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_powerups ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_powerup_selections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for powerup_definitions
CREATE POLICY "Powerup definitions are viewable by everyone"
    ON powerup_definitions FOR SELECT
    USING (true);

-- RLS Policies for player_powerups
CREATE POLICY "Players can view their own powerups"
    ON player_powerups FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Players can insert their own powerups"
    ON player_powerups FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can update their own powerups"
    ON player_powerups FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for daily_powerup_selections
CREATE POLICY "Players can view their own selections"
    ON daily_powerup_selections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Players can insert their own selections"
    ON daily_powerup_selections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can update their own selections"
    ON daily_powerup_selections FOR UPDATE
    USING (auth.uid() = user_id);
