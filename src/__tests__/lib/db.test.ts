import { describe, it, expect, vi } from "vitest";

// parseJson and rowToPost are not exported, so we test them indirectly
// through the public API. We also re-implement parseJson locally for
// direct unit testing since it is a pure utility.

// Direct test of parseJson logic (mirrors src/lib/db.ts implementation)
function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

describe("parseJson", () => {
  it("parses valid JSON string", () => {
    expect(parseJson('["a","b"]', [])).toEqual(["a", "b"]);
  });

  it("returns fallback for null input", () => {
    expect(parseJson(null, ["default"])).toEqual(["default"]);
  });

  it("returns fallback for empty string", () => {
    expect(parseJson("", ["default"])).toEqual(["default"]);
  });

  it("returns fallback for invalid JSON", () => {
    expect(parseJson("{broken", [])).toEqual([]);
  });

  it("parses nested objects", () => {
    const input = '[{"type":"github","href":"https://github.com"}]';
    const result = parseJson<{ type: string; href: string }[]>(input, []);
    expect(result).toEqual([{ type: "github", href: "https://github.com" }]);
  });
});

// Test rowToPost mapping indirectly via getAllPosts
describe("getAllPosts (row mapping)", () => {
  it("maps D1 rows to BlogPost objects with parsed JSON fields", async () => {
    const mockRow = {
      slug: "test-post",
      title: "Test Post",
      date: "2025-01-01",
      summary: "A test",
      tags: '["typescript","vitest"]',
      category: "Engineering",
      content: "# Hello",
      featured: 1,
      reading_time: 5,
    };

    const all = vi.fn().mockResolvedValue({ results: [mockRow] });
    const prepare = vi.fn().mockReturnValue({ all });
    const db = { prepare } as unknown as D1Database;

    const { getAllPosts } = await import("@/lib/db");
    const posts = await getAllPosts(db);

    expect(posts).toHaveLength(1);
    expect(posts[0]).toEqual({
      slug: "test-post",
      title: "Test Post",
      date: "2025-01-01",
      summary: "A test",
      tags: ["typescript", "vitest"],
      category: "Engineering",
      content: "# Hello",
      featured: true,
      readingTime: 5,
    });
  });

  it("handles null reading_time as undefined", async () => {
    const mockRow = {
      slug: "no-time",
      title: "No Time",
      date: "2025-01-01",
      summary: "",
      tags: "[]",
      category: "General",
      content: "",
      featured: 0,
      reading_time: null,
    };

    const all = vi.fn().mockResolvedValue({ results: [mockRow] });
    const prepare = vi.fn().mockReturnValue({ all });
    const db = { prepare } as unknown as D1Database;

    const { getAllPosts } = await import("@/lib/db");
    const posts = await getAllPosts(db);

    expect(posts[0]!.featured).toBe(false);
    expect(posts[0]!.readingTime).toBeUndefined();
  });
});

describe("getAllProjects (row mapping)", () => {
  it("maps D1 rows to Project objects with parsed JSON arrays", async () => {
    const mockRow = {
      id: "proj-1",
      name: "My App",
      description: "An app",
      platforms: '["android","ios"]',
      tags: '["kotlin","swift"]',
      links: '[{"type":"github","href":"https://github.com/test"}]',
      featured: 1,
      sort_order: 0,
    };

    const all = vi.fn().mockResolvedValue({ results: [mockRow] });
    const prepare = vi.fn().mockReturnValue({ all });
    const db = { prepare } as unknown as D1Database;

    const { getAllProjects } = await import("@/lib/db");
    const projects = await getAllProjects(db);

    expect(projects).toHaveLength(1);
    expect(projects[0]).toEqual({
      id: "proj-1",
      name: "My App",
      description: "An app",
      platforms: ["android", "ios"],
      tags: ["kotlin", "swift"],
      links: [{ type: "github", href: "https://github.com/test" }],
      featured: true,
      sortOrder: 0,
    });
  });
});
