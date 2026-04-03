-- Passkey (WebAuthn) authentication tables

-- Stored passkey credentials for the admin user
CREATE TABLE IF NOT EXISTS admin_credentials (
  credential_id TEXT PRIMARY KEY,
  public_key    TEXT NOT NULL,
  counter       INTEGER NOT NULL DEFAULT 0,
  transports    TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);

-- Ephemeral WebAuthn challenges (5-min TTL, cleaned up on session creation)
CREATE TABLE IF NOT EXISTS auth_challenges (
  challenge   TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  created_at  TEXT DEFAULT (datetime('now'))
);
