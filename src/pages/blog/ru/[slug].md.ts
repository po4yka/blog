import type { APIRoute, GetStaticPaths } from "astro";
import { blogPosts } from "@/data/blogData";

/**
 * Strip MDX-specific syntax so LLM consumers get clean prose.
 * Removes import/export lines, self-closing and paired JSX component tags.
 */
function stripMdxSyntax(content: string): string {
  return content
    .replace(/^(import |export (?:const|type|default|function|class)\b).+(\n|$)/gm, "")
    .replace(/<[A-Z][A-Za-z0-9]*(?:\s[^>]*)?\s*\/>/gs, "")
    .replace(/<[A-Z][A-Za-z0-9]*(?:\s[^>]*)?\s*>/gs, "")
    .replace(/<\/[A-Z][A-Za-z0-9]*>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const prerender = true;

export const getStaticPaths: GetStaticPaths = () => {
  return blogPosts
    .filter((post) => post.lang === "ru")
    .map((post) => ({
      params: { slug: post.slug },
      props: { post },
    }));
};

export const GET: APIRoute = ({ props }) => {
  const { post } = props as { post: (typeof blogPosts)[number] };

  const lang = "ru";
  const canonical = `https://po4yka.dev/blog/ru/${post.slug}`;
  const tagsYaml = `[${post.tags.map((t) => JSON.stringify(t)).join(", ")}]`;

  const frontmatter = [
    "---",
    `title: ${JSON.stringify(post.title)}`,
    `description: ${JSON.stringify(post.summary)}`,
    `author: "Nikita Pochaev"`,
    `slug: "${post.slug}"`,
    `lang: "${lang}"`,
    ...(post.isoDate ? [`date: "${post.isoDate}"`] : []),
    ...(post.wordCount !== undefined ? [`wordCount: ${post.wordCount}`] : []),
    `category: "${post.category}"`,
    `tags: ${tagsYaml}`,
    `canonical: "${canonical}"`,
    "---",
  ].join("\n");

  const lines = [
    frontmatter,
    "",
    `# ${post.title}`,
    "",
    `> ${post.summary}`,
    "",
    `Published: ${post.date} | Category: ${post.category} | Tags: ${post.tags.join(", ")}`,
    "",
    stripMdxSyntax(post.content),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
