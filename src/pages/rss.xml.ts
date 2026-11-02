import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { blogPosts } from "@/data/blogData";
import { postIsoDate } from "@/lib/blog/dates";

export const prerender = true;

const SITE_URL = "https://po4yka.dev";

export async function GET(context: APIContext) {
  const enPosts = blogPosts.filter((p) => !p.lang || p.lang === "en");

  return rss({
    title: "po4yka.dev — Nikita Pochaev",
    description:
      "Technical writing on mobile engineering, Kotlin Multiplatform, AI/ML integration, and MobileOps by Nikita Pochaev.",
    site: context.site ?? SITE_URL,
    // Item links match the canonical URLs and the guids (trailingSlash: "never").
    trailingSlash: false,
    items: enPosts.map((post) => ({
      title: post.title,
      description: post.summary,
      // The ISO day, not the "Jun 2026" label: the label parses in local time and loses the day.
      pubDate: new Date(post.isoDate ?? postIsoDate(post) ?? ""),
      link: `/blog/${post.slug}`,
      categories: post.tags,
      customData: `<author>nikkipochaev@gmail.com (Nikita Pochaev)</author><guid isPermaLink="true">${SITE_URL}/blog/${post.slug}</guid>`,
    })),
    customData: "<language>en-us</language>",
  });
}
