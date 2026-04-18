import type { APIRoute } from "astro";
import { blogPosts } from "@/data/blogData";
import { projects } from "@/data/projectsData";
import { roles } from "@/data/experienceData";

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin ?? "https://po4yka.dev";

  const posts = blogPosts.map((p) => {
    const basePath = p.lang === "ru" ? `/blog/ru/${p.slug}` : `/blog/${p.slug}`;
    return {
      slug: p.slug,
      lang: p.lang,
      title: p.title,
      isoDate: p.isoDate ?? null,
      summary: p.summary,
      tags: p.tags,
      category: p.category,
      url: `${origin}${basePath}`,
      markdownUrl: `${origin}${basePath}.md`,
    };
  });

  const projectList = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    platforms: p.platforms,
    tags: p.tags,
    year: p.year ?? null,
    status: p.status ?? null,
    links: p.links,
  }));

  const experience = roles.map((r) => ({
    id: r.id,
    company: r.company,
    title: r.title,
    period: r.period,
    description: r.description,
    tags: r.tags ?? [],
    location: r.location ?? null,
  }));

  return new Response(
    JSON.stringify({
      site: {
        name: "Nikita Pochaev",
        handle: "@po4yka",
        origin,
        llmsUrl: `${origin}/llms.txt`,
        llmsFullUrl: `${origin}/llms-full.txt`,
      },
      posts,
      projects: projectList,
      experience,
    }),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
};
