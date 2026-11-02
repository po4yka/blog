import { readFileSync } from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearLoginAttempts,
  createSession,
  requireAuth,
  reserveLoginAttempt,
} from "@/lib/auth";

// The D1 mocks in ../helpers cannot catch SQL semantics (text comparison of dates,
// conditional inserts), so these tests run the real statements on SQLite with db/schema.sql.

/** The subset of the D1 API that src/lib/auth.ts uses, backed by node:sqlite. */
function sqliteD1(sqlite: DatabaseSync): D1Database {
  const statement = (sql: string, args: SQLInputValue[] = []) => ({
    bind: (...next: SQLInputValue[]) => statement(sql, next),
    run: async () => {
      const result = sqlite.prepare(sql).run(...args);
      return { success: true, meta: { changes: Number(result.changes) } };
    },
    first: async () => sqlite.prepare(sql).get(...args) ?? null,
  });
  return {
    prepare: (sql: string) => statement(sql),
    batch: async (stmts: { run: () => Promise<unknown> }[]) => {
      const results = [];
      for (const stmt of stmts) results.push(await stmt.run());
      return results;
    },
  } as unknown as D1Database;
}

let sqlite: DatabaseSync;
let db: D1Database;

beforeEach(() => {
  sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../../../db/schema.sql", import.meta.url), "utf8"));
  db = sqliteD1(sqlite);
});

const withCookie = (token: string) =>
  new Request("http://localhost/api/admin/posts", { headers: { Cookie: `__session=${token}` } });

describe("session expiry (SQLite)", () => {
  it("stores expires_at in datetime() format, 24 hours ahead", async () => {
    await createSession(db);
    const row = sqlite
      .prepare("SELECT expires_at, (julianday(expires_at) - julianday('now')) * 24 AS hours FROM admin_sessions")
      .get() as { expires_at: string; hours: number };
    // An ISO string ("...T...Z") sorts after every datetime('now') value of the same day.
    expect(row.expires_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(row.hours).toBeGreaterThan(23.9);
    expect(row.hours).toBeLessThanOrEqual(24);
  });

  it("accepts a live session and rejects it one minute after expiry", async () => {
    const token = await createSession(db);
    await expect(requireAuth(withCookie(token), db)).resolves.toEqual({ capabilities: null });

    sqlite.exec("UPDATE admin_sessions SET expires_at = datetime('now', '-1 minute')");
    const rejected = await requireAuth(withCookie(token), db).catch((err: unknown) => err);
    expect(rejected).toBeInstanceOf(Response);
    expect((rejected as Response).status).toBe(401);
  });
});

describe("reserveLoginAttempt (SQLite)", () => {
  it("allows five attempts per IP in 15 minutes and refuses the sixth", async () => {
    const results = [];
    for (let i = 0; i < 6; i++) results.push(await reserveLoginAttempt(db, "1.2.3.4"));
    expect(results).toEqual([true, true, true, true, true, false]);
    // A refused attempt takes no slot, so an attacker cannot grow the table without bound.
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM login_attempts").get()).toEqual({ n: 5 });
  });

  it("counts each IP separately and frees the slots after clearLoginAttempts", async () => {
    for (let i = 0; i < 5; i++) await reserveLoginAttempt(db, "1.2.3.4");
    expect(await reserveLoginAttempt(db, "5.6.7.8")).toBe(true);

    await clearLoginAttempts(db, "1.2.3.4");
    expect(await reserveLoginAttempt(db, "1.2.3.4")).toBe(true);
  });

  it("ignores attempts older than 15 minutes", async () => {
    for (let i = 0; i < 5; i++) await reserveLoginAttempt(db, "1.2.3.4");
    sqlite.exec("UPDATE login_attempts SET attempted_at = datetime('now', '-16 minutes')");
    expect(await reserveLoginAttempt(db, "1.2.3.4")).toBe(true);
  });
});
