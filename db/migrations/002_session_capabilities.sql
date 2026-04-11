-- Per-session capability scoping.
-- NULL means the session has all capabilities (full admin, current behavior).
-- A JSON array like '["read:posts","read:projects"]' restricts the session
-- to just those capabilities; withAdmin() enforces this at request time.

ALTER TABLE admin_sessions ADD COLUMN capabilities TEXT;
