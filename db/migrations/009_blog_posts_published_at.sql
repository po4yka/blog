-- The ISO publication day (YYYY-MM-DD) that orders posts in the admin. The `date` column holds the
-- "Mon YYYY" display label, which sorts alphabetically ("Sep 2025" above "Jun 2026").
-- The deploy job reloads blog_posts from db/seed.sql after this migration, and the seed fills the column.
ALTER TABLE blog_posts ADD COLUMN published_at TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
