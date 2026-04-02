// Simple token-based auth for the admin API.
// Sessions are stored in D1 with a 24-hour expiry.

export async function createSession(db: D1Database): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Clean up expired sessions
  await db.prepare("DELETE FROM admin_sessions WHERE expires_at < datetime('now')").run();

  await db
    .prepare("INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)")
    .bind(token, expiresAt)
    .run();

  return token;
}

export async function deleteSession(db: D1Database, token: string): Promise<void> {
  await db.prepare("DELETE FROM admin_sessions WHERE token = ?").bind(token).run();
}

/**
 * Validates the request's Bearer token against active sessions.
 * @throws {Response} 401 response if unauthorized (Astro convention)
 */
export async function requireAuth(request: Request, db: D1Database): Promise<void> {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = header.slice(7);
  const session = await db
    .prepare("SELECT token FROM admin_sessions WHERE token = ? AND expires_at > datetime('now')")
    .bind(token)
    .first();

  if (!session) {
    throw new Response(JSON.stringify({ error: "Session expired" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
}
