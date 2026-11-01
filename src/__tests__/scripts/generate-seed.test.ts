import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { D1_MAX_STATEMENT_BYTES, generateSeedSource, insertRows } from "../../../scripts/generate-seed";

describe("generate-seed", () => {
  it("writes one INSERT per blog post, so no statement holds every post body", () => {
    const mdxCount = ["en", "ru"]
      .map((lang) => fs.readdirSync(path.resolve("src/content/blog", lang)).filter((f) => f.endsWith(".mdx")).length)
      .reduce((a, b) => a + b, 0);
    const inserts = generateSeedSource().match(/^INSERT INTO blog_posts /gm) ?? [];
    expect(inserts).toHaveLength(mdxCount);
  });

  it("refuses a row over the D1 statement limit", () => {
    const big = `('${"x".repeat(D1_MAX_STATEMENT_BYTES)}')`;
    expect(() => insertRows("Test", "INSERT INTO t (a) VALUES", [big])).toThrow(/over the D1 limit/);
    expect(insertRows("Test", "INSERT INTO t (a) VALUES", ["('a')", "('b')"])).toBe(
      "-- Test\nINSERT INTO t (a) VALUES\n('a');\n\nINSERT INTO t (a) VALUES\n('b');\n",
    );
  });
});
