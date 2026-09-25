import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  listPosts,
  readPost,
  writePost,
  deletePost,
  postExists,
  assertLang,
  assertSlug,
  assertIsoDate,
  type PostFrontmatter,
} from "../lib/frontmatter.js";
import { BLOG_LANGS } from "../lib/paths.js";

const lang = {
  type: "string",
  enum: [...BLOG_LANGS],
  description: "Post language; the file lives at src/content/blog/<lang>/<slug>.mdx. Defaults to 'en'.",
};
const slug = { type: "string", pattern: "^[a-z0-9-]+$", description: "Post slug (filename without .mdx), kebab-case. Shared by the en and ru variants." };
const isoDate = { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" };

export const blogTools: Tool[] = [
  {
    name: "cms_list_posts",
    description: "List all blog posts (both languages) with their frontmatter",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "cms_get_post",
    description: "Get a blog post's full content and frontmatter by language and slug",
    inputSchema: {
      type: "object" as const,
      properties: { lang, slug },
      required: ["slug"],
    },
  },
  {
    name: "cms_create_post",
    description:
      "Create a new blog post as an MDX file under src/content/blog/<lang>/. Run cms_regenerate after to update derived files.",
    inputSchema: {
      type: "object" as const,
      properties: {
        lang,
        slug,
        title: { type: "string" },
        date: { type: "string", description: "Display label, format 'Mon YYYY' (e.g. 'Apr 2026')" },
        publishedAt: { ...isoDate, description: "ISO publish date, e.g. '2026-04-01'" },
        summary: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        category: { type: "string" },
        content: { type: "string", description: "Markdown body content" },
        featured: { type: "boolean" },
        readingTime: { type: "number" },
      },
      required: ["slug", "title", "date", "publishedAt", "summary", "tags", "category", "content"],
    },
  },
  {
    name: "cms_update_post",
    description:
      "Update an existing blog post's frontmatter and/or content. Only provided fields are changed. Set updatedAt when revising a published post. Run cms_regenerate after.",
    inputSchema: {
      type: "object" as const,
      properties: {
        lang,
        slug,
        title: { type: "string" },
        date: { type: "string" },
        publishedAt: isoDate,
        updatedAt: { ...isoDate, description: "ISO date of the revision, e.g. '2026-05-12'" },
        summary: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        category: { type: "string" },
        content: { type: "string" },
        featured: { type: "boolean" },
        readingTime: { type: "number" },
      },
      required: ["slug"],
    },
  },
  {
    name: "cms_delete_post",
    description: "Delete one language variant of a blog post. Run cms_regenerate after.",
    inputSchema: {
      type: "object" as const,
      properties: { lang, slug },
      required: ["slug"],
    },
  },
  {
    name: "cms_search_posts",
    description: "Search blog posts (both languages) by keyword across title, summary, tags, and content",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search term (case-insensitive)" },
      },
      required: ["query"],
    },
  },
];

export function handleBlogTool(
  name: string,
  args: Record<string, unknown>,
): string {
  const postLang = () => assertLang(args.lang ?? "en");

  switch (name) {
    case "cms_list_posts": {
      const posts = listPosts().map(({ lang, slug }) => ({ lang, slug, ...readPost(lang, slug).frontmatter }));
      return JSON.stringify(posts, null, 2);
    }

    case "cms_get_post": {
      return JSON.stringify(readPost(postLang(), args.slug), null, 2);
    }

    case "cms_create_post": {
      const lang = postLang();
      const slug = assertSlug(args.slug);
      if (postExists(lang, slug)) {
        throw new Error(`Post already exists: ${lang}/${slug}. Use cms_update_post instead.`);
      }
      const frontmatter: PostFrontmatter = {
        title: args.title as string,
        date: args.date as string,
        publishedAt: assertIsoDate("publishedAt", args.publishedAt),
        summary: args.summary as string,
        tags: args.tags as string[],
        category: args.category as string,
      };
      if (args.featured !== undefined) frontmatter.featured = args.featured as boolean;
      if (args.readingTime !== undefined) frontmatter.readingTime = args.readingTime as number;
      writePost(lang, slug, frontmatter, args.content as string, { create: true });
      return JSON.stringify({
        ok: true,
        lang,
        slug,
        message: "Post created. Run cms_regenerate to update derived files.",
      });
    }

    case "cms_update_post": {
      const lang = postLang();
      const slug = assertSlug(args.slug);
      const existing = readPost(lang, slug);
      const fm = { ...existing.frontmatter };
      if (args.title !== undefined) fm.title = args.title as string;
      if (args.date !== undefined) fm.date = args.date as string;
      if (args.publishedAt !== undefined) fm.publishedAt = assertIsoDate("publishedAt", args.publishedAt);
      if (args.updatedAt !== undefined) fm.updatedAt = assertIsoDate("updatedAt", args.updatedAt);
      if (args.summary !== undefined) fm.summary = args.summary as string;
      if (args.tags !== undefined) fm.tags = args.tags as string[];
      if (args.category !== undefined) fm.category = args.category as string;
      if (args.featured !== undefined) fm.featured = args.featured as boolean;
      if (args.readingTime !== undefined) fm.readingTime = args.readingTime as number;
      const content = (args.content as string) ?? existing.content;
      writePost(lang, slug, fm, content);
      return JSON.stringify({
        ok: true,
        lang,
        slug,
        message: "Post updated. Run cms_regenerate to update derived files.",
      });
    }

    case "cms_delete_post": {
      const lang = postLang();
      deletePost(lang, args.slug);
      return JSON.stringify({
        ok: true,
        lang,
        slug: args.slug,
        message: "Post deleted. Run cms_regenerate to update derived files.",
      });
    }

    case "cms_search_posts": {
      const query = (args.query as string).toLowerCase();
      const results = [];
      for (const { lang, slug } of listPosts()) {
        const post = readPost(lang, slug);
        const haystack = [
          post.frontmatter.title,
          post.frontmatter.summary,
          (post.frontmatter.tags ?? []).join(" "),
          post.content,
        ]
          .join(" ")
          .toLowerCase();
        if (haystack.includes(query)) {
          results.push({ lang, slug, ...post.frontmatter });
        }
      }
      return JSON.stringify(results, null, 2);
    }

    default:
      throw new Error(`Unknown blog tool: ${name}`);
  }
}
