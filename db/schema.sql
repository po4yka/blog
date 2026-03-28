-- Blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
  slug         TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  date         TEXT NOT NULL,
  summary      TEXT NOT NULL,
  tags         TEXT NOT NULL DEFAULT '[]',
  category     TEXT NOT NULL,
  content      TEXT NOT NULL,
  featured     INTEGER DEFAULT 0,
  reading_time INTEGER,
  created_at   TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now'))
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  platforms   TEXT NOT NULL DEFAULT '[]',
  tags        TEXT NOT NULL DEFAULT '[]',
  links       TEXT NOT NULL DEFAULT '[]',
  featured    INTEGER DEFAULT 0,
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- Roles (experience)
CREATE TABLE IF NOT EXISTS roles (
  id          TEXT PRIMARY KEY,
  period      TEXT NOT NULL,
  company     TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  tags        TEXT DEFAULT '[]',
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  name TEXT PRIMARY KEY
);

-- Site settings (single-row table)
CREATE TABLE IF NOT EXISTS site_settings (
  id         INTEGER PRIMARY KEY CHECK (id = 1),
  name       TEXT NOT NULL,
  handle     TEXT NOT NULL,
  role       TEXT NOT NULL,
  bio        TEXT NOT NULL,
  github     TEXT NOT NULL,
  email      TEXT NOT NULL,
  telegram   TEXT NOT NULL,
  linkedin   TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Admin sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
  token      TEXT PRIMARY KEY,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
