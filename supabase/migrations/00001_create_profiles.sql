-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    total_points INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    games_played INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for username lookups
CREATE INDEX idx_profiles_username ON profiles(username);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view profiles (for leaderboard)
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_username TEXT;
    username_exists BOOLEAN;
    counter INTEGER := 0;
BEGIN
    -- Generate username from email or display name
    IF NEW.raw_user_meta_data->>'full_name' IS NOT NULL THEN
        new_username := LOWER(REGEXP_REPLACE(NEW.raw_user_meta_data->>'full_name', '[^a-zA-Z0-9]', '', 'g'));
    ELSE
        new_username := SPLIT_PART(NEW.email, '@', 1);
    END IF;

    -- Ensure username is at least 3 characters
    IF LENGTH(new_username) < 3 THEN
        new_username := 'player' || SUBSTRING(NEW.id::TEXT, 1, 8);
    END IF;

    -- Check for uniqueness and add suffix if needed
    LOOP
        IF counter = 0 THEN
            SELECT EXISTS(SELECT 1 FROM profiles WHERE username = new_username) INTO username_exists;
        ELSE
            SELECT EXISTS(SELECT 1 FROM profiles WHERE username = new_username || counter::TEXT) INTO username_exists;
            new_username := new_username || counter::TEXT;
        END IF;

        EXIT WHEN NOT username_exists;
        counter := counter + 1;
    END LOOP;

    -- Insert the new profile
    INSERT INTO profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        new_username,
        COALESCE(NEW.raw_user_meta_data->>'full_name', new_username),
        NEW.raw_user_meta_data->>'avatar_url'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
