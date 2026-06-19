import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "astro/zod";
import { setMockEnv } from "../mocks/cloudflare-workers";

// Stub withAdmin so defineCollection doesn't require a real auth session
vi.mock("@/lib/admin-handler", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/admin-handler")>();
  return {
    ...actual,
    withAdmin: vi.fn(
      (
        _options: unknown,
        handler: (ctx: {
          db: D1Database;
          data: unknown;
          params: Record<string, string | undefined>;
        }) => Promise<Response>,
      ) =>
        async (ctx: {
          request: Request;
          params: Record<string, string | undefined>;
          db: D1Database;
        }) =>
          handler({ db: ctx.db, data: undefined, params: ctx.params ?? {} }),
    ),
  };
});

import { defineCollection } from "@/lib/collections/define";

interface TestItem {
  id: string;
  label: string;
  count: number;
  active: boolean;
  tags: string[];
}

function makeTestCollection() {
  return defineCollection<TestItem>({
    name: "test_items",
    table: "test_items",
    primaryKey: "id",
    orderBy: "label ASC",
    idGeneration: "uuid",
    capabilities: { read: "read:posts", write: "write:posts" },
    fields: {
      id: { column: "id", type: "text", zod: z.string().optional().default("") },
      label: { column: "label", type: "text", zod: z.string() },
      count: { column: "count", type: "integer", zod: z.number(), optional: true },
      active: { column: "active", type: "boolean", zod: z.boolean() },
      tags: { column: "tags", type: "json", zod: z.array(z.string()), default: [] },
    },
  });
}

function makeFullMockDb() {
  const run = vi.fn().mockResolvedValue({ success: true, meta: { changes: 1 } });
  const first = vi.fn().mockResolvedValue(null);
  const all = vi.fn().mockResolvedValue({ results: [] });
  const bind = vi.fn().mockReturnValue({ run, first, all });
  const prepare = vi.fn().mockReturnValue({ run, bind, first, all });
  const batch = vi.fn().mockResolvedValue([]);
  return { prepare, bind, run, first, all, batch } as unknown as D1Database & {
    prepare: ReturnType<typeof vi.fn>;
    bind: ReturnType<typeof vi.fn>;
    run: ReturnType<typeof vi.fn>;
    first: ReturnType<typeof vi.fn>;
    all: ReturnType<typeof vi.fn>;
  };
}

describe("defineCollection()", () => {
  beforeEach(() => {
    setMockEnv({ DB: makeFullMockDb() });
  });

  it("throws on unsafe table name", () => {
    expect(() =>
      defineCollection<{ id: string }>({
        name: "bad",
        table: "bad table; DROP",
        primaryKey: "id",
        orderBy: "id ASC",
        capabilities: { read: "read:posts", write: "write:posts" },
        fields: { id: { column: "id", type: "text", zod: z.string() } },
      }),
    ).toThrow(/Unsafe SQL identifier/);
  });

  it("throws on unsafe ORDER BY expression", () => {
    expect(() =>
      defineCollection<{ id: string }>({
        name: "safe",
        table: "safe_table",
        primaryKey: "id",
        orderBy: "id; DROP TABLE safe_table",
        capabilities: { read: "read:posts", write: "write:posts" },
        fields: { id: { column: "id", type: "text", zod: z.string() } },
      }),
    ).toThrow(/Unsafe ORDER BY/);
  });

  it("getAll returns empty array when no rows exist", async () => {
    const col = makeTestCollection();
    const db = makeFullMockDb();
    (db.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
      run: db.run,
      bind: db.bind,
      first: db.first,
      all: vi.fn().mockResolvedValue({ results: [] }),
    });

    const items = await col.getAll(db);
    expect(items).toEqual([]);
  });

  it("getAll maps rows using field definitions", async () => {
    const col = makeTestCollection();
    const db = makeFullMockDb();
    const fakeRow = { id: "abc", label: "hello", count: 3, active: 1, tags: '["a","b"]' };
    (db.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
      run: db.run,
      bind: db.bind,
      first: db.first,
      all: vi.fn().mockResolvedValue({ results: [fakeRow] }),
    });

    const items = await col.getAll(db);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "abc",
      label: "hello",
      count: 3,
      active: true,
      tags: ["a", "b"],
    });
  });

  it("getByPk returns null when row is not found", async () => {
    const col = makeTestCollection();
    const db = makeFullMockDb();
    const firstNull = vi.fn().mockResolvedValue(null);
    (db.bind as ReturnType<typeof vi.fn>).mockReturnValue({ run: db.run, first: firstNull });

    const item = await col.getByPk(db, "nonexistent");
    expect(item).toBeNull();
  });

  it("upsert generates a uuid when id is not provided", async () => {
    const col = makeTestCollection();
    const db = makeFullMockDb();
    const mockBind = vi.fn().mockReturnValue({ run: vi.fn().mockResolvedValue({ success: true }) });
    (db.prepare as ReturnType<typeof vi.fn>).mockReturnValue({ bind: mockBind });

    const input: TestItem = { id: "", label: "new item", count: 0, active: true, tags: [] };
    await col.upsert(db, input);

    // The first positional argument to bind() is the id; it should be a UUID
    const bindArgs = mockBind.mock.calls[0] as unknown[];
    const generatedId = bindArgs[0] as string;
    expect(generatedId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("remove calls DELETE with the correct primary key", async () => {
    const col = makeTestCollection();
    const db = makeFullMockDb();
    const mockBind = vi.fn().mockReturnValue({ run: vi.fn().mockResolvedValue({ success: true }) });
    (db.prepare as ReturnType<typeof vi.fn>).mockReturnValue({ bind: mockBind });

    await col.remove(db, "target-id");

    const sql = (db.prepare as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(sql).toMatch(/DELETE FROM test_items/);
    expect(mockBind).toHaveBeenCalledWith("target-id");
  });

  it("schema validates a complete item correctly", () => {
    const col = makeTestCollection();
    const valid = col.schema.safeParse({
      id: "x",
      label: "test",
      count: 1,
      active: false,
      tags: ["go"],
    });
    expect(valid.success).toBe(true);
  });
});
