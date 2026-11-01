-- Daily count of failed admin sign-ins (password and passkey) for the admin
-- Telemetry page. login_attempts keeps client IPs for one hour of rate limiting;
-- this table keeps only a date and a count, so history needs no IP retention.
CREATE TABLE IF NOT EXISTS auth_failures_daily (
  day   TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);
