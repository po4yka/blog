import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PostHeader } from "@/components/blog/PostHeader";
import { PostPager } from "@/components/blog/PostPager";
import { PostRow } from "@/components/blog/PostRow";
import type { PostMeta } from "@/components/blog/types";
import type { BlogPostMeta } from "@/types";

const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

const meta: PostMeta = {
  title: "Hello",
  date: "Apr 2026",
  isoDate: "2026-04-01",
  summary: "s",
  tags: ["rag"],
  category: "AI",
};

describe("PostHeader", () => {
  it("renders header > h1 and a <time datetime>", () => {
    const out = html(createElement(PostHeader, { post: meta, slug: "hello", lang: "en", listHref: "/blog" }));
    expect(out).toMatch(/^<header[^>]*><h1/);
    expect(out).toMatch(/<time datetime="2026-04-01"/i);
    expect(out).toContain('href="/blog?tag=rag"');
    expect(out).toContain('href="/blog/hello.md"');
  });

  it("omits datetime when there is no ISO date", () => {
    const out = html(
      createElement(PostHeader, { post: { ...meta, isoDate: undefined }, slug: "hello", lang: "en", listHref: "/blog" }),
    );
    expect(out).not.toMatch(/<time datetime/i);
    expect(out).toContain("<time");
  });

  it("shows the updated date only when it differs", () => {
    const same = html(
      createElement(PostHeader, { post: { ...meta, isoDateModified: "2026-04-01" }, slug: "h", lang: "en", listHref: "/blog" }),
    );
    expect(same.match(/<time/g)).toHaveLength(1);
    const changed = html(
      createElement(PostHeader, { post: { ...meta, isoDateModified: "2026-05-02" }, slug: "h", lang: "en", listHref: "/blog" }),
    );
    expect(changed.match(/<time/g)).toHaveLength(2);
    expect(changed).toContain("May 2026");
  });
});

describe("PostPager", () => {
  it("renders only the index link between two empty slots when prev and next are null", () => {
    const out = html(createElement(PostPager, { prev: null, next: null, lang: "en", listHref: "/blog" }));
    expect(out).toContain("<span></span>");
    expect(out.match(/<a /g)).toHaveLength(1);
    expect(out).toContain('href="/blog"');
  });

  it("links prev and next with language-aware urls", () => {
    const out = html(
      createElement(PostPager, {
        prev: { slug: "p", title: "Prev", date: "Jan 2026" },
        next: { slug: "n", title: "Next", date: "Feb 2026" },
        lang: "ru",
        listHref: "/blog/ru",
      }),
    );
    expect(out).toContain('href="/blog/ru/p"');
    expect(out).toContain('href="/blog/ru/n"');
    expect(out).toContain("sm:justify-end");
    expect(out).toContain("sm:text-right");
  });
});

describe("PostRow", () => {
  const row: BlogPostMeta = {
    slug: "hello",
    title: "Hello",
    date: "Apr 2026",
    summary: "Sum",
    tags: [],
    category: "AI",
    readingTime: 4,
    featured: true,
  };

  it("renders the en link, title, featured tag and reading time", () => {
    const out = html(createElement(PostRow, { post: row, lang: "en", featuredLabel: "Featured", minLabel: "min" }));
    expect(out).toContain('href="/blog/hello"');
    expect(out).toContain("Hello");
    expect(out).toContain("Featured");
    expect(out).toContain("4 min");
  });

  it("renders the ru link and the given labels", () => {
    const out = html(
      createElement(PostRow, { post: { ...row, featured: false }, lang: "ru", featuredLabel: "Избранное", minLabel: "мин" }),
    );
    expect(out).toContain('href="/blog/ru/hello"');
    expect(out).toContain("4 мин");
    expect(out).not.toContain("Избранное");
  });
});
