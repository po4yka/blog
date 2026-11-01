-- History for the admin Telemetry page, written by the deploy job (.github/workflows/ci-cd.yml)
-- after `wrangler d1 migrations apply` has created these tables.
--   deploys: one row per commit that `wrangler deploy` put live (the deploy markers)
--   lighthouse_runs: Lighthouse results per deploy (scripts/lighthouse-to-sql.ts)
CREATE TABLE IF NOT EXISTS deploys (
  commit_sha  TEXT PRIMARY KEY,
  deployed_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_deploys_at ON deploys(deployed_at);

CREATE TABLE IF NOT EXISTS lighthouse_runs (
  commit_sha     TEXT NOT NULL,
  measured_at    TEXT NOT NULL,
  form_factor    TEXT NOT NULL,
  path           TEXT NOT NULL,
  performance    REAL,
  accessibility  REAL,
  best_practices REAL,
  lcp_ms         REAL,
  cls            REAL,
  tbt_ms         REAL,
  PRIMARY KEY (commit_sha, form_factor, path)
);
CREATE INDEX IF NOT EXISTS idx_lighthouse_runs_measured ON lighthouse_runs(measured_at);
