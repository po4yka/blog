// Build-time generator: derives src/data/blogData.ts from MDX content files.
// Run via: npx tsx scripts/generate-blog-data.ts

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const BLOG_DIR = path.resolve("src/content/blog");
const OUTPUT_FILE = path.resolve("src/data/blogData.ts");

interface FrontMatter {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  category: string;
  featured?: boolean;
}

const MONTH_ORDER: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

function parseDateForSort(dateStr: string): number {
  const parts = dateStr.split(" ");
  if (parts.length !== 2) return 0;
  const month = MONTH_ORDER[parts[0]] ?? 0;
  const year = parseInt(parts[1], 10);
  return year * 12 + month;
}

function escapeForTemplateLiteral(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
}

function escapeForDoubleQuotedString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

const HTML_ENTITY_MAP: Record<string, string> = {
  "&lt;": "<",
  "&gt;": ">",
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
};
const HTML_ENTITY_RE = /&(?:lt|gt|amp|quot|#39);/g;

function decodeHtmlEntities(str: string): string {
  return str.replace(HTML_ENTITY_RE, (match) => HTML_ENTITY_MAP[match] ?? match);
}

interface BlogEntry {
  slug: string;
  frontmatter: FrontMatter;
  content: string;
}

function readBlogPosts(): BlogEntry[] {
  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .sort();

  const entries: BlogEntry[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    const fm = data as FrontMatter;
    const slug = file.replace(/\.mdx$/, "");

    // Trim leading/trailing whitespace from content body
    const body = decodeHtmlEntities(content.trim());

    entries.push({ slug, frontmatter: fm, content: body });
  }

  // Sort by date descending
  entries.sort((a, b) => parseDateForSort(b.frontmatter.date) - parseDateForSort(a.frontmatter.date));

  return entries;
}

function deriveCategories(entries: BlogEntry[]): string[] {
  const cats = new Set<string>();
  for (const e of entries) {
    cats.add(e.frontmatter.category);
  }
  return ["All", ...Array.from(cats)];
}

function generateBlogPostEntry(entry: BlogEntry): string {
  const { slug, frontmatter: fm, content } = entry;
  const lines: string[] = [];
  lines.push("  {");
  lines.push(`    slug: "${escapeForDoubleQuotedString(slug)}",`);
  lines.push(`    title: "${escapeForDoubleQuotedString(fm.title)}",`);
  lines.push(`    date: "${escapeForDoubleQuotedString(fm.date)}",`);
  lines.push("    summary:");
  lines.push(`      "${escapeForDoubleQuotedString(fm.summary)}",`);
  lines.push(`    tags: [${fm.tags.map((t) => `"${escapeForDoubleQuotedString(t)}"`).join(", ")}],`);
  lines.push(`    category: "${escapeForDoubleQuotedString(fm.category)}",`);
  if (fm.featured === true) {
    lines.push("    featured: true,");
  } else if (fm.featured === false) {
    lines.push("    featured: false,");
  }
  lines.push(`    content: \`${escapeForTemplateLiteral(content)}\`,`);
  lines.push("  },");
  return lines.join("\n");
}

export function generateBlogDataSource(): string {
  const entries = readBlogPosts();
  const categories = deriveCategories(entries);

  const postEntries = entries.map((e) => generateBlogPostEntry(e)).join("\n");
  const categoriesStr = categories.map((c) => `"${escapeForDoubleQuotedString(c)}"`).join(", ");

  return `// Auto-generated from MDX content files. Do not edit manually.
// Run "npm run generate:blog" to regenerate.
import type { BlogPost } from "@/types";

export type { BlogPost };

export const blogPosts: BlogPost[] = [
${postEntries}
];

export const categories = [${categoriesStr}];
`;
}

// Run as script
if (import.meta.url === `file://${process.argv[1]}`) {
  const output = generateBlogDataSource();
  fs.writeFileSync(OUTPUT_FILE, output, "utf-8");
  console.log(`Generated ${OUTPUT_FILE}`);
}
