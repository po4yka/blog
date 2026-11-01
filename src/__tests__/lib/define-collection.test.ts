import { beforeEach, describe, expect, it, vi } from "vitest";
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
    capabilities: { read: "read:posts" },
    fields: {
      id: { column: "id", type: "text" },
      label: { column: "label", type: "text" },
      count: { column: "count", type: "integer", optional: true },
      active: { column: "active", type: "boolean" },
      tags: { column: "tags", type: "json", default: [] },
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
        capabilities: { read: "read:posts" },
        fields: { id: { column: "id", type: "text" } },
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
        capabilities: { read: "read:posts" },
        fields: { id: { column: "id", type: "text" } },
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
});
