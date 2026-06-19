import { describe, expect, it } from "vitest";
import { parsePostId, blogUrl } from "@/lib/i18n";

describe("parsePostId", () => {
  it("returns lang=en for a bare slug with no prefix", () => {
    const result = parsePostId("my-first-post");
    expect(result).toEqual({ lang: "en", baseSlug: "my-first-post" });
  });

  it("returns lang=en and correct baseSlug for en/ prefix", () => {
    const result = parsePostId("en/my-first-post");
    expect(result).toEqual({ lang: "en", baseSlug: "my-first-post" });
  });

  it("returns lang=ru and correct baseSlug for ru/ prefix", () => {
    const result = parsePostId("ru/мой-пост");
    expect(result).toEqual({ lang: "ru", baseSlug: "мой-пост" });
  });

  it("treats unknown prefix as en and uses the full id as baseSlug", () => {
    // Prefix like "fr" is not a recognised locale — the whole string is baseSlug
    const result = parsePostId("fr/post-name");
    expect(result).toEqual({ lang: "en", baseSlug: "fr/post-name" });
  });

  it("handles id with multiple slashes correctly (only first slash is the split point)", () => {
    const result = parsePostId("en/nested/slug");
    expect(result).toEqual({ lang: "en", baseSlug: "nested/slug" });
  });
});

describe("blogUrl", () => {
  it("returns /blog for en locale with no slug", () => {
    expect(blogUrl("en")).toBe("/blog");
  });

  it("returns /blog/ru for ru locale with no slug", () => {
    expect(blogUrl("ru")).toBe("/blog/ru");
  });

  it("returns /blog/<slug> for en locale with slug", () => {
    expect(blogUrl("en", "my-post")).toBe("/blog/my-post");
  });

  it("returns /blog/ru/<slug> for ru locale with slug", () => {
    expect(blogUrl("ru", "мой-пост")).toBe("/blog/ru/мой-пост");
  });

  it("returns base URL when slug is empty string", () => {
    // Empty string is falsy, so no slug appended
    expect(blogUrl("en", "")).toBe("/blog");
  });
});
