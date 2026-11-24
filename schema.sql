-- SM Studios Database Schema
-- Safe to re-run: every statement is idempotent.
-- Run this in the Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  short_description TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  screenshots TEXT[] DEFAULT '{}',
  download_link TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  content_format TEXT DEFAULT 'html',
  featured_image TEXT DEFAULT '',
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft',
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Upgrade older installs that predate these columns.
ALTER TABLE games ADD COLUMN IF NOT EXISTS screenshots TEXT[] DEFAULT '{}';
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- Constraints (guarded so re-running is safe)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  ALTER TABLE news_articles
    ADD CONSTRAINT news_articles_status_check
    CHECK (status IN ('draft', 'published'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE news_articles
    ADD CONSTRAINT news_articles_content_format_check
    CHECK (content_format IN ('html', 'markdown'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS games_created_at_idx
  ON games (created_at DESC);

CREATE INDEX IF NOT EXISTS news_articles_status_published_at_idx
  ON news_articles (status, published_at DESC);

CREATE INDEX IF NOT EXISTS news_articles_game_id_idx
  ON news_articles (game_id);

CREATE INDEX IF NOT EXISTS news_articles_created_at_idx
  ON news_articles (created_at DESC);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS games_updated_at ON games;
CREATE TRIGGER games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS news_articles_updated_at ON news_articles;
CREATE TRIGGER news_articles_updated_at
  BEFORE UPDATE ON news_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- published_at: stamped once, never rewritten on later edits
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS news_articles_published_at ON news_articles;
CREATE TRIGGER news_articles_published_at
  BEFORE INSERT OR UPDATE ON news_articles
  FOR EACH ROW
  EXECUTE FUNCTION set_published_at();

-- Backfill rows published before this trigger existed.
UPDATE news_articles
SET published_at = created_at
WHERE status = 'published' AND published_at IS NULL;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published articles" ON news_articles;
CREATE POLICY "Public can read published articles"
  ON news_articles FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "Public can read games" ON games;
CREATE POLICY "Public can read games"
  ON games FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage articles" ON news_articles;
CREATE POLICY "Authenticated users can manage articles"
  ON news_articles FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can manage games" ON games;
CREATE POLICY "Authenticated users can manage games"
  ON games FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- NOTE: these policies allow *any* signed-in account to edit content. If email
-- signups are enabled in Supabase Auth, run `harden-rls.sql` afterwards to
-- restrict writes to an explicit admins list.

-- ---------------------------------------------------------------------------
-- Storage bucket for editor image uploads
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  true,
  8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read uploads" ON storage.objects;
CREATE POLICY "Public can read uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'uploads');

DROP POLICY IF EXISTS "Authenticated users can update uploads" ON storage.objects;
CREATE POLICY "Authenticated users can update uploads"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'uploads')
  WITH CHECK (bucket_id = 'uploads');

DROP POLICY IF EXISTS "Authenticated users can delete uploads" ON storage.objects;
CREATE POLICY "Authenticated users can delete uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'uploads');
