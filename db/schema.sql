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
  expires_at TEXT NOT NULL,
  last_used  TEXT DEFAULT (datetime('now'))
);

-- Login attempt tracking for rate limiting
CREATE TABLE IF NOT EXISTS login_attempts (
  ip_address   TEXT NOT NULL,
  attempted_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address, attempted_at);

-- Passkey credentials
CREATE TABLE IF NOT EXISTS admin_credentials (
  credential_id TEXT PRIMARY KEY,
  public_key    TEXT NOT NULL,
  counter       INTEGER NOT NULL DEFAULT 0,
  transports    TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);

-- Ephemeral WebAuthn challenges
CREATE TABLE IF NOT EXISTS auth_challenges (
  challenge   TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  created_at  TEXT DEFAULT (datetime('now'))
);
