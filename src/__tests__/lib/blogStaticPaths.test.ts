import { describe, expect, it } from "vitest";
import type { CollectionEntry } from "astro:content";
import { buildBlogStaticPaths } from "@/lib/blogStaticPaths";

type BlogPost = CollectionEntry<"blog">;
type BlogData = BlogPost["data"] & {
  isoDate?: string;
};

const makePost = (id: string, overrides: Partial<BlogData>): BlogPost =>
  ({
    id,
    collection: "blog",
    data: {
      title: id,
      date: "2026-01-01",
      summary: `${id} summary`,
      tags: [],
      category: "General",
      ...overrides,
    },
  }) as unknown as BlogPost;

const findPath = (paths: ReturnType<typeof buildBlogStaticPaths>, slug: string) => {
  const path = paths.find((item) => item.params.slug === slug);
  expect(path).toBeDefined();
  return path!;
};

describe("buildBlogStaticPaths", () => {
  it("builds EN paths with adjacent posts, translation flags, and ranked related posts", () => {
    const posts = [
      makePost("en/current", {
        title: "Current",
        date: "2026-04-10",
        tags: ["alpha", "beta"],
        category: "Architecture",
      }),
      makePost("en/different-category-newest", {
        title: "Different Category Newest",
        date: "2026-05-01",
        tags: ["alpha"],
        category: "Tooling",
      }),
      makePost("en/overlap-two-old", {
        title: "Overlap Two Old",
        date: "2026-01-01",
        isoDate: "2026-01-01",
        tags: ["alpha", "beta"],
        category: "Tooling",
      }),
      makePost("en/same-category-newer", {
        title: "Same Category Newer",
        date: "2026-03-01",
        tags: ["alpha"],
        category: "Architecture",
      }),
      makePost("en/same-category-older", {
        title: "Same Category Older",
        date: "2026-02-01",
        tags: ["beta"],
        category: "Architecture",
      }),
      makePost("ru/current", {
        title: "Current RU",
        date: "2026-04-09",
        tags: ["alpha"],
        category: "Architecture",
      }),
    ];

    const paths = buildBlogStaticPaths(posts, "en");
    const current = findPath(paths, "current").props;

    expect(paths.map((path) => path.params.slug)).toEqual([
      "different-category-newest",
      "current",
      "same-category-newer",
      "same-category-older",
      "overlap-two-old",
    ]);
    expect(current.prev).toEqual({
      slug: "different-category-newest",
      title: "Different Category Newest",
      date: "2026-05-01",
    });
    expect(current.next).toEqual({
      slug: "same-category-newer",
      title: "Same Category Newer",
      date: "2026-03-01",
    });
    expect(current.hasTranslation).toBe(true);
    expect(findPath(paths, "different-category-newest").props.hasTranslation).toBe(false);
    expect(current.related.map((post) => post.slug)).toEqual([
      "overlap-two-old",
      "same-category-newer",
      "same-category-older",
    ]);
    expect(current.related[0]).toMatchObject({
      slug: "overlap-two-old",
      title: "Overlap Two Old",
      date: "2026-01-01",
      isoDate: "2026-01-01",
      category: "Tooling",
      summary: "en/overlap-two-old summary",
    });
  });

  it("builds RU paths with matching EN translation detection", () => {
    const posts = [
      makePost("en/current", {
        title: "Current",
        date: "2026-04-10",
        tags: ["alpha"],
        category: "Architecture",
      }),
      makePost("ru/current", {
        title: "Current RU",
        date: "2026-04-09",
        tags: ["alpha"],
        category: "Architecture",
      }),
      makePost("ru/ru-only", {
        title: "RU Only",
        date: "2026-04-11",
        tags: ["beta"],
        category: "Notes",
      }),
    ];

    const paths = buildBlogStaticPaths(posts, "ru");
    const current = findPath(paths, "current").props;

    expect(paths.map((path) => path.params.slug)).toEqual(["ru-only", "current"]);
    expect(current.hasTranslation).toBe(true);
    expect(findPath(paths, "ru-only").props.hasTranslation).toBe(false);
    expect(current.prev).toEqual({
      slug: "ru-only",
      title: "RU Only",
      date: "2026-04-11",
    });
    expect(current.next).toBeNull();
  });
});
