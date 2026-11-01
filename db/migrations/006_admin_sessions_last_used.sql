-- requireAuth() in src/lib/auth.ts updates admin_sessions.last_used on every
-- admin request. db/schema.sql defines the column, but no migration added it.
-- SQLite cannot add a column with a non-constant default, so existing and new
-- rows start as NULL until the session is next used.
ALTER TABLE admin_sessions ADD COLUMN last_used TEXT;
