import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { blogPosts } from "@/data/blogData";

export const prerender = true;

const SITE_URL = "https://po4yka.dev";

export async function GET(context: APIContext) {
  const enPosts = blogPosts.filter((p) => !p.lang || p.lang === "en");

  return rss({
    title: "po4yka.dev — Nikita Pochaev",
    description:
      "Technical writing on mobile engineering, Kotlin Multiplatform, AI/ML integration, and MobileOps by Nikita Pochaev.",
    site: context.site ?? SITE_URL,
    items: enPosts.map((post) => ({
      title: post.title,
      description: post.summary,
      pubDate: new Date(post.date),
      link: `/blog/${post.slug}`,
      categories: post.tags,
    })),
    customData: "<language>en-us</language>",
  });
}
