-- Cache the final category classification for articles
-- This stores the result of P31 classification so we don't need to re-classify
CREATE TABLE article_categories (
    title TEXT PRIMARY KEY,
    category TEXT, -- The category (e.g., "Religion", "History") or NULL if uncategorized
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_article_categories_title ON article_categories(title);

-- Enable RLS
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;

-- Allow edge functions to read/write (service role)
CREATE POLICY "Service role can manage article_categories"
    ON article_categories
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow anonymous read access for lookups
CREATE POLICY "Anyone can read article_categories"
    ON article_categories
    FOR SELECT
    USING (true);
