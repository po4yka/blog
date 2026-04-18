import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { blogPosts } from "@/data/blogData";

export const prerender = true;

const SITE_URL = "https://po4yka.dev";

export async function GET(context: APIContext) {
  const ruPosts = blogPosts.filter((p) => p.lang === "ru");

  return rss({
    title: "po4yka.dev — Никита Почаев",
    description:
      "Технические заметки по мобильной инженерии, Kotlin Multiplatform, интеграции AI/ML и MobileOps от Никиты Почаева.",
    site: context.site ?? SITE_URL,
    items: ruPosts.map((post) => ({
      title: post.title,
      description: post.summary,
      pubDate: new Date(post.date),
      link: `/blog/ru/${post.slug}`,
      categories: post.tags,
    })),
    customData: "<language>ru-ru</language>",
  });
}
