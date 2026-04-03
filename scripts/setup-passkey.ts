// One-time setup: inserts a setup token into D1 for passkey registration.
// Run via: npx tsx scripts/setup-passkey.ts
//
// After running, open the printed URL in your browser to register a passkey.

import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const token = randomUUID();
const dbName = "blog-db";

// Insert setup token into auth_challenges table
const sql = `INSERT INTO auth_challenges (challenge, type) VALUES ('${token}', 'setup')`;

try {
  execSync(`npx wrangler d1 execute ${dbName} --local --command "${sql}"`, {
    encoding: "utf-8",
    stdio: "pipe",
  });
} catch (err) {
  console.error("Failed to insert setup token. Make sure wrangler is configured and D1 tables exist.");
  console.error("Run: npx wrangler d1 execute blog-db --local --file db/migrations/001_passkey_tables.sql");
  if (err instanceof Error) console.error(err.message);
  process.exit(1);
}

const url = `http://localhost:4321/admin/setup?token=${token}`;

console.log("\nPasskey setup token created.\n");
console.log(`Open this URL in your browser (dev server must be running):\n`);
console.log(`  ${url}\n`);

// Try to open browser
try {
  const platform = process.platform;
  if (platform === "darwin") {
    execSync(`open "${url}"`, { stdio: "ignore" });
  } else if (platform === "linux") {
    execSync(`xdg-open "${url}"`, { stdio: "ignore" });
  }
} catch {
  // Browser open is best-effort
}
