-- Cache table for article P31 (instance of) values from Wikidata
-- This allows instant lookups for repeat visits to the same articles

CREATE TABLE IF NOT EXISTS article_p31 (
  title TEXT PRIMARY KEY,
  p31_classes TEXT[] NOT NULL DEFAULT '{}',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by title (already primary key, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_article_p31_title ON article_p31(title);

-- Index for cleanup of old entries
CREATE INDEX IF NOT EXISTS idx_article_p31_fetched_at ON article_p31(fetched_at);

-- Function to clean up entries older than 30 days
CREATE OR REPLACE FUNCTION cleanup_old_p31_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM article_p31
  WHERE fetched_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Grant permissions for edge functions
ALTER TABLE article_p31 ENABLE ROW LEVEL SECURITY;

-- Allow edge functions (service role) full access
CREATE POLICY "Service role can manage p31 cache"
  ON article_p31
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anonymous reads for faster lookups
CREATE POLICY "Allow anonymous read access"
  ON article_p31
  FOR SELECT
  TO anon
  USING (true);

COMMENT ON TABLE article_p31 IS 'Cache for Wikidata P31 (instance of) values. Entries expire after 30 days.';
