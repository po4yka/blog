// Build-time generator: derives src/data/blogData.ts from MDX content files.
// Run via: npx tsx scripts/generate-blog-data.ts

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { compareNewestFirst, parseDateLabel, postIsoDate } from "../src/lib/blog/dates.js";

const BLOG_DIR = path.resolve("src/content/blog");
const OUTPUT_FILE = path.resolve("src/data/blogData.ts");

interface FrontMatter {
  title: string;
  date: string;
  publishedAt?: string | Date;
  updatedAt?: string | Date;
  summary: string;
  tags: string[];
  category: string;
  featured?: boolean;
}

export function countWords(content: string): number {
  // Strip fenced code blocks so long snippets don't inflate the count.
  const stripped = content.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");
  // \p{L}, not \w: \w has no Cyrillic, so Russian words were not counted.
  const tokens = stripped.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t));
  return tokens.length;
}

/** Depth (2 to 6) of each Markdown heading, in order, skipping fenced code. */
export function headingDepths(content: string): number[] {
  const stripped = content.replace(/```[\s\S]*?```/g, " ");
  return [...stripped.matchAll(/^(#{2,6})\s+\S/gm)].map((m) => m[1]!.length);
}

/** The ISO publication day; a label that is not "Mon YYYY" stops the build. */
function isoDateOf(fm: FrontMatter, filePath: string): string {
  const iso = postIsoDate(fm);
  if (!iso || !parseDateLabel(fm.date)) {
    throw new Error(`Invalid date format "${fm.date}" in ${filePath}. Expected "Mon YYYY" (e.g. "Jan 2025").`);
  }
  return iso;
}

function escapeForTemplateLiteral(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
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

export interface BlogEntry {
  slug: string;
  lang: string;
  frontmatter: FrontMatter;
  content: string;
  isoDate: string;
  isoDateModified: string;
  wordCount: number;
  headings: number[];
}

function readEntry(filePath: string, slug: string, lang: string): BlogEntry {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const fm = data as FrontMatter;
  const body = decodeHtmlEntities(content.trim());
  const isoDate = isoDateOf(fm, filePath);
  // No label fallback for updatedAt: an unreadable one must not give a modified day before the published one.
  const isoDateModified = (fm.updatedAt && postIsoDate({ date: "", publishedAt: fm.updatedAt })) || isoDate;
  return {
    slug,
    lang,
    frontmatter: fm,
    content: body,
    isoDate,
    isoDateModified,
    wordCount: countWords(body),
    headings: headingDepths(body),
  };
}

function listMdxFiles(dir: string): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.isFile() && item.name.endsWith(".mdx")) files.push(item.name);
  }
  files.sort();
  return files;
}

function listBlogLangDirs(): string[] {
  const dirs: string[] = [];
  const items = fs.readdirSync(BLOG_DIR, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory() && (item.name === "en" || item.name === "ru")) dirs.push(item.name);
  }
  dirs.sort();
  return dirs;
}

function appendEntriesForDir(entries: BlogEntry[], dir: string, lang: string): void {
  const files = listMdxFiles(dir);
  for (const file of files) {
    const slug = file.replace(/\.mdx$/, "");
    entries.push(readEntry(path.join(dir, file), slug, lang));
  }
}

export function readBlogPosts(): BlogEntry[] {
  const entries: BlogEntry[] = [];

  const langDirs = listBlogLangDirs();
  for (const lang of langDirs) {
    appendEntriesForDir(entries, path.join(BLOG_DIR, lang), lang);
  }

  entries.sort((a, b) => compareNewestFirst(a, b) || a.lang.localeCompare(b.lang));

  return entries;
}

function deriveCategories(entries: BlogEntry[]): string[] {
  const cats = new Set<string>();
  for (const e of entries) {
    if (e.lang === "en") cats.add(e.frontmatter.category);
  }
  return ["All", ...Array.from(cats)];
}

function generateBlogPostEntry(entry: BlogEntry, withContent = true): string {
  const { slug, lang, frontmatter: fm, content, isoDate, isoDateModified, wordCount, headings } = entry;
  const lines: string[] = [];
  lines.push("  {");
  lines.push(`    slug: "${escapeForDoubleQuotedString(slug)}",`);
  lines.push(`    lang: "${escapeForDoubleQuotedString(lang)}",`);
  lines.push(`    title: "${escapeForDoubleQuotedString(fm.title)}",`);
  lines.push(`    date: "${escapeForDoubleQuotedString(fm.date)}",`);
  lines.push(`    isoDate: "${escapeForDoubleQuotedString(isoDate)}",`);
  lines.push(`    isoDateModified: "${escapeForDoubleQuotedString(isoDateModified)}",`);
  lines.push(`    wordCount: ${wordCount},`);
  lines.push(`    headings: [${headings.join(", ")}],`);
  lines.push("    summary:");
  lines.push(`      "${escapeForDoubleQuotedString(fm.summary)}",`);
  lines.push(`    tags: [${fm.tags.map((t) => `"${escapeForDoubleQuotedString(t)}"`).join(", ")}],`);
  lines.push(`    category: "${escapeForDoubleQuotedString(fm.category)}",`);
  if (fm.featured === true) {
    lines.push("    featured: true,");
  } else if (fm.featured === false) {
    lines.push("    featured: false,");
  }
  if (withContent) {
    lines.push(`    content: \`${escapeForTemplateLiteral(content)}\`,`);
  }
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

// Content-free twin of blogData.ts for client islands (home preview, panels,
// footer shell). Keeps the full post bodies out of the browser bundle.
export function generateBlogMetaSource(): string {
  const entries = readBlogPosts();
  const categories = deriveCategories(entries);

  const postEntries = entries.map((e) => generateBlogPostEntry(e, false)).join("\n");
  const categoriesStr = categories.map((c) => `"${escapeForDoubleQuotedString(c)}"`).join(", ");

  return `// Auto-generated from MDX content files. Do not edit manually.
// Run "npm run generate:blog" to regenerate.
// Metadata only (no post bodies) -- safe to import from client islands.
import type { BlogPostMeta } from "@/types";

export type { BlogPostMeta };

export const blogPostsMeta: BlogPostMeta[] = [
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
  const metaFile = path.resolve("src/data/blogMeta.ts");
  fs.writeFileSync(metaFile, generateBlogMetaSource(), "utf-8");
  console.log(`Generated ${metaFile}`);
}
