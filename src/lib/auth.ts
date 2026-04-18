// Simple token-based auth for the admin API.
// Sessions are stored in D1 with a 24-hour expiry.

const PROD_ORIGINS = ["https://po4yka.dev"];
const DEV_ORIGINS = ["https://po4yka.dev", "http://localhost:4321", "http://localhost:3000"];

function getAllowedOrigins(): string[] {
  return import.meta.env.PROD ? PROD_ORIGINS : DEV_ORIGINS;
}

export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [digestA, digestB] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(a)),
    crypto.subtle.digest("SHA-256", encoder.encode(b)),
  ]);
  const viewA = new Uint8Array(digestA);
  const viewB = new Uint8Array(digestB);
  if (viewA.length !== viewB.length) return false;
  let result = 0;
  for (let i = 0; i < viewA.length; i++) {
    result |= (viewA[i] as number) ^ (viewB[i] as number);
  }
  return result === 0;
}

export async function checkRateLimit(db: D1Database, ip: string): Promise<boolean> {
  const row = await db
    .prepare(
      "SELECT COUNT(*) as cnt FROM login_attempts WHERE ip_address = ? AND attempted_at > datetime('now', '-15 minutes')",
    )
    .bind(ip)
    .first<{ cnt: number }>();
  return (row?.cnt ?? 0) < 5;
}

export async function recordLoginAttempt(db: D1Database, ip: string): Promise<void> {
  await db.prepare("INSERT INTO login_attempts (ip_address) VALUES (?)").bind(ip).run();
}

export async function clearLoginAttempts(db: D1Database, ip: string): Promise<void> {
  await db.prepare("DELETE FROM login_attempts WHERE ip_address = ?").bind(ip).run();
}

export function validateOrigin(request: Request): void {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD") return;

  const origin = request.headers.get("Origin");

  // If no Origin header, require X-Requested-With as CSRF defense-in-depth.
  // Simple HTML forms cannot set custom headers, so this blocks CSRF from
  // non-browser clients that omit Origin.
  if (!origin) {
    if (!request.headers.get("X-Requested-With")) {
      throw new Response(JSON.stringify({ error: "Missing origin or X-Requested-With header" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return;
  }

  if (!getAllowedOrigins().includes(origin)) {
    throw new Response(JSON.stringify({ error: "Forbidden origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
}


/**
 * Create a new admin session.
 * @param capabilities  Optional capability allowlist for scoped tokens.
 *                      Omit (or pass undefined) for a full-admin session.
 */
export async function createSession(
  db: D1Database,
  capabilities?: readonly string[],
): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const capsJson = capabilities ? JSON.stringify(capabilities) : null;

  // Clean up expired sessions, old login attempts, and stale WebAuthn challenges
  await db.batch([
    db.prepare("DELETE FROM admin_sessions WHERE expires_at < datetime('now')"),
    db.prepare("DELETE FROM login_attempts WHERE attempted_at < datetime('now', '-1 hour')"),
    db.prepare("DELETE FROM auth_challenges WHERE created_at < datetime('now', '-5 minutes')"),
  ]);

  await db
    .prepare("INSERT INTO admin_sessions (token, expires_at, capabilities) VALUES (?, ?, ?)")
    .bind(token, expiresAt, capsJson)
    .run();

  return token;
}

export async function deleteSession(db: D1Database, token: string): Promise<void> {
  await db.prepare("DELETE FROM admin_sessions WHERE token = ?").bind(token).run();
}

// --- Session cookie helpers ---

const COOKIE_NAME = "__session";
const COOKIE_MAX_AGE = 86400; // 24h, matches session expiry

export function makeSessionCookie(token: string, isSecure: boolean): string {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/api",
    `Max-Age=${COOKIE_MAX_AGE}`,
  ];
  if (isSecure) parts.push("Secure");
  return parts.join("; ");
}

export function makeClearCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/api; Max-Age=0`;
}

function extractSessionToken(request: Request): string | null {
  // Prefer HttpOnly cookie, fall back to Bearer header for backward compat
  const cookies = request.headers.get("Cookie") ?? "";
  const match = cookies.match(/__session=([^;]+)/);
  if (match?.[1]) return match[1];

  const header = request.headers.get("Authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7);

  return null;
}

/**
 * A resolved session returned by requireAuth().
 * capabilities is null for full-admin tokens; otherwise it is the parsed
 * capability allowlist stored with the session row.
 */
export interface Session {
  capabilities: readonly string[] | null;
}

/**
 * Validates the request's session token (cookie or Bearer header) and
 * returns the session record (including per-token capabilities).
 * Updates last_used timestamp on success.
 * @throws {Response} 401 response if unauthorized (Astro convention)
 */
export async function requireAuth(request: Request, db: D1Database): Promise<Session> {
  const token = extractSessionToken(request);
  if (!token) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const row = await db
    .prepare(
      "SELECT token, capabilities FROM admin_sessions WHERE token = ? AND expires_at > datetime('now')",
    )
    .bind(token)
    .first<{ token: string; capabilities: string | null }>();

  if (!row) {
    throw new Response(JSON.stringify({ error: "Session expired" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  await db
    .prepare("UPDATE admin_sessions SET last_used = datetime('now') WHERE token = ?")
    .bind(token)
    .run();

  let capabilities: readonly string[] | null = null;
  if (row.capabilities) {
    try {
      const parsed = JSON.parse(row.capabilities) as unknown;
      if (Array.isArray(parsed) && parsed.every((c): c is string => typeof c === "string")) {
        capabilities = parsed;
      }
    } catch {
      // Corrupt capabilities JSON: fail closed with an empty allowlist.
      capabilities = [];
    }
  }

  return { capabilities };
}
