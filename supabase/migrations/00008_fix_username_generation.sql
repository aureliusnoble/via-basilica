-- Fix username generation to use proper incrementing suffix
-- The original trigger had a bug where counter was appended cumulatively:
-- "foo" → "foo1" → "foo12" → "foo123" instead of "foo" → "foo1" → "foo2" → "foo3"

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    base_username TEXT;
    new_username TEXT;
    username_exists BOOLEAN;
    counter INTEGER := 0;
BEGIN
    -- Generate base username from email or display name
    IF NEW.raw_user_meta_data->>'full_name' IS NOT NULL THEN
        base_username := LOWER(REGEXP_REPLACE(NEW.raw_user_meta_data->>'full_name', '[^a-zA-Z0-9]', '', 'g'));
    ELSE
        base_username := SPLIT_PART(NEW.email, '@', 1);
    END IF;

    -- Ensure username is at least 3 characters
    IF LENGTH(base_username) < 3 THEN
        base_username := 'player' || SUBSTRING(NEW.id::TEXT, 1, 8);
    END IF;

    new_username := base_username;

    -- Check for uniqueness and add suffix if needed
    LOOP
        SELECT EXISTS(SELECT 1 FROM profiles WHERE username = new_username) INTO username_exists;
        EXIT WHEN NOT username_exists;
        counter := counter + 1;
        new_username := base_username || counter::TEXT;
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
