-- Add lang column and convert blog_posts primary key to composite (slug, lang).
-- SQLite does not support ALTER TABLE ADD PRIMARY KEY, so we recreate the table.

-- 1. Create the new table with the composite primary key.
CREATE TABLE IF NOT EXISTS blog_posts_new (
  slug         TEXT NOT NULL,
  lang         TEXT NOT NULL DEFAULT 'en',
  title        TEXT NOT NULL,
  date         TEXT NOT NULL,
  summary      TEXT NOT NULL,
  tags         TEXT NOT NULL DEFAULT '[]',
  category     TEXT NOT NULL,
  content      TEXT NOT NULL,
  featured     INTEGER DEFAULT 0,
  reading_time INTEGER,
  created_at   TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (slug, lang)
);

-- 2. Copy existing rows, defaulting lang to 'en'.
INSERT INTO blog_posts_new (slug, lang, title, date, summary, tags, category, content, featured, reading_time, created_at, updated_at)
SELECT slug, 'en', title, date, summary, tags, category, content, featured, reading_time, created_at, updated_at
FROM blog_posts;

-- 3. Drop old table and rename.
DROP TABLE blog_posts;
ALTER TABLE blog_posts_new RENAME TO blog_posts;

-- 4. Recreate indexes that referenced blog_posts.
CREATE INDEX IF NOT EXISTS idx_blog_posts_date ON blog_posts(date DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured DESC, date DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_lang ON blog_posts(lang);
