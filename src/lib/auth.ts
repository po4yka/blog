// Simple token-based auth for the admin API.
// Sessions are stored in D1 with a 24-hour expiry.
// Session tokens are stored as SHA-256 hashes; the raw UUID lives only in the
// cookie/header. Existing sessions created before this change will be
// invalidated (acceptable one-time migration cost).

const PROD_ORIGINS = ["https://po4yka.dev"];
const DEV_ORIGINS = ["https://po4yka.dev", "http://localhost:4321", "http://localhost:3000"];

function getAllowedOrigins(): string[] {
  return import.meta.env.PROD ? PROD_ORIGINS : DEV_ORIGINS;
}

/**
 * Derive the client IP from request headers. Uses cf-connecting-ip (set by
 * Cloudflare and not spoofable) when present. In development falls back to
 * 127.0.0.1. Never uses the client-supplied x-forwarded-for header.
 */
export function getClientIp(request: Request): string | null {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  if (!import.meta.env.PROD) return "127.0.0.1";
  return null;
}

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
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

const MAX_LOGIN_ATTEMPTS = 5;
/** Password sign-in attempts allowed from all clients together in the same 15 minutes. */
const MAX_GLOBAL_PASSWORD_ATTEMPTS = 20;
/** Key prefix of password attempts: the global cap counts only these rows. */
const PASSWORD_SCOPE = "pw:";

/** Parses an IPv6 address into its 8 groups, or returns null when it is not one. */
function ipv6Groups(addr: string): number[] | null {
  // A dotted IPv4 tail ("::ffff:1.2.3.4") is the last two groups.
  const dotted = /^(.*:)(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(addr);
  if (dotted) {
    const [, prefix, ...octets] = dotted;
    const n = octets.map(Number);
    if (n.some((o) => o > 255)) return null;
    addr = `${prefix}${((n[0]! << 8) | n[1]!).toString(16)}:${((n[2]! << 8) | n[3]!).toString(16)}`;
  }
  const halves = addr.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const parts = [...left, ...new Array<string>(halves.length === 2 ? missing : 0).fill("0"), ...right];
  if (!parts.every((g) => /^[0-9a-f]{1,4}$/.test(g))) return null;
  return parts.map((g) => parseInt(g, 16));
}

/**
 * The key the sign-in limit counts by: an IPv4 address as is, an IPv6 address by its /64 prefix,
 * and an IPv4-mapped IPv6 address (::ffff:a.b.c.d, in any spelling) as its IPv4 address.
 * One IPv6 client usually holds a whole /64, so a per-address count let it rotate past the limit.
 * An address that does not parse is used as it is.
 */
export function rateLimitKey(ip: string): string {
  const addr = ip.split("%")[0]!.toLowerCase();
  if (!addr.includes(":")) return addr;
  const g = ipv6Groups(addr);
  if (!g) return addr;
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) {
    return [g[6]! >> 8, g[6]! & 255, g[7]! >> 8, g[7]! & 255].join(".");
  }
  return `${g.slice(0, 4).map((x) => x.toString(16)).join(":")}::/64`;
}

/**
 * Record a sign-in attempt if the client is under the limit: 5 per 15 minutes per IPv4 address
 * or IPv6 /64 (see rateLimitKey). Password attempts (`password`) are counted apart from passkey
 * attempts and also have a cap of 20 per 15 minutes from all clients together, because only a
 * password can be guessed. That cap is a lockout lever for the password fallback by design;
 * passkey sign-in has its own count, so a flood of password guesses cannot lock the admin out.
 * Returns false when throttled. The counts and the insert are one statement, so parallel
 * requests cannot all pass the same check. Every attempt takes a slot, including the successful
 * one; call clearLoginAttempts() after a sign-in.
 */
export async function reserveLoginAttempt(db: D1Database, ip: string, options: { password?: boolean } = {}): Promise<boolean> {
  const recent = "attempted_at > datetime('now', '-15 minutes')";
  const perClient = `(SELECT COUNT(*) FROM login_attempts WHERE ip_address = ? AND ${recent}) < ?`;
  if (options.password) {
    const key = PASSWORD_SCOPE + rateLimitKey(ip);
    const result = await db
      .prepare(
        `INSERT INTO login_attempts (ip_address) SELECT ? WHERE ${perClient} AND (SELECT COUNT(*) FROM login_attempts WHERE ip_address LIKE '${PASSWORD_SCOPE}%' AND ${recent}) < ?`,
      )
      .bind(key, key, MAX_LOGIN_ATTEMPTS, MAX_GLOBAL_PASSWORD_ATTEMPTS)
      .run();
    return (result.meta?.changes ?? 0) > 0;
  }
  const key = rateLimitKey(ip);
  const result = await db
    .prepare(`INSERT INTO login_attempts (ip_address) SELECT ? WHERE ${perClient}`)
    .bind(key, key, MAX_LOGIN_ATTEMPTS)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

/**
 * Add one to today's (UTC) failed sign-in count for the Telemetry page. Called for rejected
 * credentials and for attempts the rate limit throttles, so an attack is not hidden by the 429s.
 */
export async function countFailedSignIn(db: D1Database): Promise<void> {
  try {
    await db
      .prepare(
        "INSERT INTO auth_failures_daily (day, count) VALUES (date('now'), 1) ON CONFLICT(day) DO UPDATE SET count = count + 1",
      )
      .run();
  } catch (err) {
    // Until migration 007 reaches a database, sign-in and rate limiting must keep working without the counter.
    if (err instanceof Error && /no such table/i.test(err.message)) {
      console.error("[auth] auth_failures_daily is missing; apply db/migrations/007_auth_failures_daily.sql");
      return;
    }
    throw err;
  }
}

export async function clearLoginAttempts(db: D1Database, ip: string): Promise<void> {
  const key = rateLimitKey(ip);
  await db.prepare("DELETE FROM login_attempts WHERE ip_address IN (?, ?)").bind(key, PASSWORD_SCOPE + key).run();
}

export function validateOrigin(request: Request): void {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD") return;

  const origin = request.headers.get("Origin");

  // If no Origin header, accept X-Requested-With as a CSRF defense-in-depth
  // fallback, but only in development. In production every same-origin browser
  // request includes an Origin header; accepting X-Requested-With in prod would
  // allow requests from non-browser clients that can set arbitrary headers.
  if (!origin) {
    if (!import.meta.env.PROD && request.headers.get("X-Requested-With")) {
      return;
    }
    throw new Response(JSON.stringify({ error: "Missing origin or X-Requested-With header" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
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
  const tokenHash = await hashToken(token);
  const capsJson = capabilities ? JSON.stringify(capabilities) : null;

  // Clean up expired sessions, old login attempts, and stale WebAuthn challenges
  await db.batch([
    db.prepare("DELETE FROM admin_sessions WHERE expires_at < datetime('now')"),
    db.prepare("DELETE FROM login_attempts WHERE attempted_at < datetime('now', '-1 hour')"),
    db.prepare("DELETE FROM auth_challenges WHERE created_at < datetime('now', '-5 minutes')"),
  ]);

  // Store the hash, not the raw token, so a D1 breach cannot replay sessions.
  // expires_at uses SQLite's datetime() format so that the text comparisons with
  // datetime('now') are correct. An ISO string ("...T...Z") sorts after any time on
  // the same day, which kept a session valid until the next UTC midnight.
  await db
    .prepare(
      "INSERT INTO admin_sessions (token, expires_at, capabilities) VALUES (?, datetime('now', '+1 day'), ?)",
    )
    .bind(tokenHash, capsJson)
    .run();

  // Return the raw token; the caller puts it in the cookie/header.
  return token;
}

export async function deleteSession(db: D1Database, token: string): Promise<void> {
  const tokenHash = await hashToken(token);
  await db.prepare("DELETE FROM admin_sessions WHERE token = ?").bind(tokenHash).run();
}

/** Delete every admin session, on every device. Returns how many there were. */
export async function deleteAllSessions(db: D1Database): Promise<number> {
  const result = await db.prepare("DELETE FROM admin_sessions").run();
  return result.meta?.changes ?? 0;
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

export function extractSessionToken(request: Request): string | null {
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

  const tokenHash = await hashToken(token);

  const row = await db
    .prepare(
      "SELECT token, capabilities FROM admin_sessions WHERE token = ? AND expires_at > datetime('now')",
    )
    .bind(tokenHash)
    .first<{ token: string; capabilities: string | null }>();

  if (!row) {
    throw new Response(JSON.stringify({ error: "Session expired" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  await db
    .prepare("UPDATE admin_sessions SET last_used = datetime('now') WHERE token = ?")
    .bind(tokenHash)
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
