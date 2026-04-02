import type { APIRoute, GetStaticPaths } from "astro";
import { blogPosts } from "@/data/blogData";

export const prerender = true;

export const getStaticPaths: GetStaticPaths = () => {
  return blogPosts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
};

export const GET: APIRoute = ({ props }) => {
  const { post } = props as { post: (typeof blogPosts)[number] };

  const lines = [
    `# ${post.title}`,
    "",
    `> ${post.summary}`,
    "",
    `Published: ${post.date} | Category: ${post.category} | Tags: ${post.tags.join(", ")}`,
    "",
    post.content,
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
