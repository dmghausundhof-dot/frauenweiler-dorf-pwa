-- Optionale Social-/Web-Links pro News (Array von URLs, z. B. Instagram/Facebook)
ALTER TABLE news
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN news.social_links IS 'Liste von URLs (JSON-Array), z. B. Social-Media-Posts zur News';
