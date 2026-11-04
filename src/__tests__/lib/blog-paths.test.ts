import { describe, expect, it } from "vitest";
import { blogIndexPath, blogRouteLang, isBlogIndex } from "@/lib/blog/paths";

describe("blogRouteLang", () => {
  it("reads the language from the blog URL", () => {
    expect(blogRouteLang("/blog")).toBe("en");
    expect(blogRouteLang("/blog/")).toBe("en");
    expect(blogRouteLang("/blog/some-post")).toBe("en");
    expect(blogRouteLang("/blog/ru")).toBe("ru");
    expect(blogRouteLang("/blog/ru/some-post")).toBe("ru");
  });

  it("does not take a post slug that starts with ru for the Russian route", () => {
    expect(blogRouteLang("/blog/rust-on-android")).toBe("en");
  });

  it("returns undefined outside the blog", () => {
    expect(blogRouteLang("/")).toBeUndefined();
    expect(blogRouteLang("/projects")).toBeUndefined();
    expect(blogRouteLang("/blogroll")).toBeUndefined();
  });
});

describe("isBlogIndex", () => {
  it("matches only the two indexes", () => {
    for (const path of ["/blog", "/blog/", "/blog/ru", "/blog/ru/"]) expect(isBlogIndex(path)).toBe(true);
    for (const path of ["/", "/blog/some-post", "/blog/ru/some-post", "/blogroll"]) expect(isBlogIndex(path)).toBe(false);
  });
});

describe("blogIndexPath", () => {
  it("uses the chosen language outside the blog", () => {
    expect(blogIndexPath("/", "ru")).toBe("/blog/ru");
    expect(blogIndexPath("/projects", "en")).toBe("/blog");
  });

  it("uses the route language on a blog page", () => {
    expect(blogIndexPath("/blog/ru/some-post", "en")).toBe("/blog/ru");
    expect(blogIndexPath("/blog/some-post", "ru")).toBe("/blog");
  });
});
