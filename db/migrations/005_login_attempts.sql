-- Login attempt tracking for the password login rate limit (src/lib/auth.ts).
-- db/schema.sql defines this table, but no migration created it, so databases
-- built from migrations lacked it and every password login failed with a 500.
CREATE TABLE IF NOT EXISTS login_attempts (
  ip_address   TEXT NOT NULL,
  attempted_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address, attempted_at);
