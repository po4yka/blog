import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { blogPosts } from "@/data/blogData";
import { postIsoDate } from "@/lib/blog/dates";

export const prerender = true;

const SITE_URL = "https://po4yka.dev";

export async function GET(context: APIContext) {
  const ruPosts = blogPosts.filter((p) => p.lang === "ru");

  return rss({
    title: "po4yka.dev — Никита Почаев",
    description:
      "Технические заметки по мобильной инженерии, Kotlin Multiplatform, интеграции AI/ML и MobileOps от Никиты Почаева.",
    site: context.site ?? SITE_URL,
    // Item links match the canonical URLs and the guids (trailingSlash: "never").
    trailingSlash: false,
    items: ruPosts.map((post) => ({
      title: post.title,
      description: post.summary,
      // The ISO day, not the "Jun 2026" label: the label parses in local time and loses the day.
      pubDate: new Date(post.isoDate ?? postIsoDate(post) ?? ""),
      link: `/blog/ru/${post.slug}`,
      categories: post.tags,
      customData: `<author>nikkipochaev@gmail.com (Nikita Pochaev)</author><guid isPermaLink="true">${SITE_URL}/blog/ru/${post.slug}</guid>`,
    })),
    customData: "<language>ru-ru</language>",
  });
}
