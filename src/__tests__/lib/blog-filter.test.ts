import { describe, expect, it } from "vitest";
import { filterPosts, findFeatured, readTagParam, uniqueTags, withTagParam } from "@/lib/blog/filter";
import type { BlogPostMeta } from "@/types";

const post = (slug: string, category: string, tags: string[], featured?: boolean): BlogPostMeta => ({
  slug,
  title: slug,
  date: "Jan 2026",
  summary: "",
  tags,
  category,
  featured,
});

const posts = [
  post("a", "AI", ["rag", "llm"]),
  post("b", "Android", ["kotlin"], true),
  post("c", "AI", ["llm"], true),
];

describe("filterPosts", () => {
  it("All keeps everything", () => {
    expect(filterPosts(posts, "All", null)).toHaveLength(3);
  });

  it("combines category and tag as AND", () => {
    expect(filterPosts(posts, "AI", "llm").map((p) => p.slug)).toEqual(["a", "c"]);
    expect(filterPosts(posts, "AI", "rag").map((p) => p.slug)).toEqual(["a"]);
    expect(filterPosts(posts, "Android", "llm")).toEqual([]);
  });

  it("returns nothing for an unknown tag", () => {
    expect(filterPosts(posts, "All", "nope")).toEqual([]);
  });
});

describe("findFeatured", () => {
  it("returns the first featured post or undefined", () => {
    expect(findFeatured(posts)?.slug).toBe("b");
    expect(findFeatured([post("x", "AI", [])])).toBeUndefined();
  });
});

describe("uniqueTags", () => {
  it("lists each tag once, in first-seen order", () => {
    expect(uniqueTags(posts)).toEqual(["rag", "llm", "kotlin"]);
    expect(uniqueTags([])).toEqual([]);
  });
});

describe("tag param", () => {
  it("reads ?tag=", () => {
    expect(readTagParam("?tag=rag&x=1")).toBe("rag");
    expect(readTagParam("")).toBeNull();
  });

  it("sets or deletes tag and keeps other params", () => {
    expect(withTagParam("https://x.dev/blog?a=1", "rag")).toBe("https://x.dev/blog?a=1&tag=rag");
    expect(withTagParam("https://x.dev/blog?a=1&tag=rag", null)).toBe("https://x.dev/blog?a=1");
    expect(withTagParam("https://x.dev/blog?tag=old", "new")).toBe("https://x.dev/blog?tag=new");
  });
});
