import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  listPostSlugs,
  readPost,
  writePost,
  deletePost,
  type PostFrontmatter,
} from "../lib/frontmatter.js";

export const blogTools: Tool[] = [
  {
    name: "cms_list_posts",
    description: "List all blog posts with their frontmatter (slug, title, date, category, tags, featured)",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "cms_get_post",
    description: "Get a blog post's full content and frontmatter by slug",
    inputSchema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "Post slug (filename without .mdx)" },
      },
      required: ["slug"],
    },
  },
  {
    name: "cms_create_post",
    description:
      "Create a new blog post as an MDX file. Run cms_regenerate after to update derived files.",
    inputSchema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "URL slug and filename (e.g. 'my-new-post')" },
        title: { type: "string" },
        date: { type: "string", description: "Format: 'Mon YYYY' (e.g. 'Apr 2026')" },
        summary: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        category: { type: "string" },
        content: { type: "string", description: "Markdown body content" },
        featured: { type: "boolean" },
        readingTime: { type: "number" },
      },
      required: ["slug", "title", "date", "summary", "tags", "category", "content"],
    },
  },
  {
    name: "cms_update_post",
    description:
      "Update an existing blog post's frontmatter and/or content. Only provided fields are changed. Run cms_regenerate after.",
    inputSchema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "Post slug to update" },
        title: { type: "string" },
        date: { type: "string" },
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
    description: "Delete a blog post by slug. Run cms_regenerate after.",
    inputSchema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "Post slug to delete" },
      },
      required: ["slug"],
    },
  },
  {
    name: "cms_search_posts",
    description: "Search blog posts by keyword across title, summary, tags, and content",
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
  switch (name) {
    case "cms_list_posts": {
      const slugs = listPostSlugs();
      const posts = slugs.map((slug) => {
        const { frontmatter } = readPost(slug);
        return { slug, ...frontmatter };
      });
      return JSON.stringify(posts, null, 2);
    }

    case "cms_get_post": {
      const post = readPost(args.slug as string);
      return JSON.stringify(post, null, 2);
    }

    case "cms_create_post": {
      const slug = args.slug as string;
      const existing = listPostSlugs();
      if (existing.includes(slug)) {
        throw new Error(`Post already exists: ${slug}. Use cms_update_post instead.`);
      }
      const frontmatter: PostFrontmatter = {
        title: args.title as string,
        date: args.date as string,
        summary: args.summary as string,
        tags: args.tags as string[],
        category: args.category as string,
      };
      if (args.featured !== undefined) frontmatter.featured = args.featured as boolean;
      if (args.readingTime !== undefined) frontmatter.readingTime = args.readingTime as number;
      writePost(slug, frontmatter, args.content as string);
      return JSON.stringify({
        ok: true,
        slug,
        message: "Post created. Run cms_regenerate to update derived files.",
      });
    }

    case "cms_update_post": {
      const slug = args.slug as string;
      const existing = readPost(slug);
      const fm = { ...existing.frontmatter };
      if (args.title !== undefined) fm.title = args.title as string;
      if (args.date !== undefined) fm.date = args.date as string;
      if (args.summary !== undefined) fm.summary = args.summary as string;
      if (args.tags !== undefined) fm.tags = args.tags as string[];
      if (args.category !== undefined) fm.category = args.category as string;
      if (args.featured !== undefined) fm.featured = args.featured as boolean;
      if (args.readingTime !== undefined) fm.readingTime = args.readingTime as number;
      const content = (args.content as string) ?? existing.content;
      writePost(slug, fm, content);
      return JSON.stringify({
        ok: true,
        slug,
        message: "Post updated. Run cms_regenerate to update derived files.",
      });
    }

    case "cms_delete_post": {
      deletePost(args.slug as string);
      return JSON.stringify({
        ok: true,
        slug: args.slug,
        message: "Post deleted. Run cms_regenerate to update derived files.",
      });
    }

    case "cms_search_posts": {
      const query = (args.query as string).toLowerCase();
      const slugs = listPostSlugs();
      const results = [];
      for (const slug of slugs) {
        const post = readPost(slug);
        const haystack = [
          post.frontmatter.title,
          post.frontmatter.summary,
          post.frontmatter.tags.join(" "),
          post.content,
        ]
          .join(" ")
          .toLowerCase();
        if (haystack.includes(query)) {
          results.push({ slug, ...post.frontmatter });
        }
      }
      return JSON.stringify(results, null, 2);
    }

    default:
      throw new Error(`Unknown blog tool: ${name}`);
  }
}
