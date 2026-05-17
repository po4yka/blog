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
  publishedAt?: string | Date;
  updatedAt?: string | Date;
  summary: string;
  tags: string[];
  category: string;
  featured?: boolean;
}

const FALLBACK_DAY = "01";

function toIsoDateString(value: string | Date | undefined, humanDate: string): string {
  // 1) explicit publishedAt from frontmatter (string or Date)
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && value.length > 0) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }
  // 2) infer from the "Mon YYYY" date string
  const parts = humanDate.split(" ");
  if (parts.length === 2 && parts[0]! in MONTH_ORDER) {
    const month = String((MONTH_ORDER[parts[0]!] ?? 0) + 1).padStart(2, "0");
    const year = parts[1]!;
    return `${year}-${month}-${FALLBACK_DAY}`;
  }
  // 3) last resort: today
  return new Date().toISOString().slice(0, 10);
}

function countWords(content: string): number {
  // Strip fenced code blocks so long snippets don't inflate the count.
  const stripped = content.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");
  const tokens = stripped.split(/\s+/).filter((t) => /\w/.test(t));
  return tokens.length;
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

function parseDateForSort(dateStr: string, filePath?: string): number {
  const parts = dateStr.split(" ");
  if (parts.length !== 2 || !(parts[0]! in MONTH_ORDER) || isNaN(parseInt(parts[1]!, 10))) {
    throw new Error(`Invalid date format "${dateStr}"${filePath ? ` in ${filePath}` : ""}. Expected "Mon YYYY" (e.g. "Jan 2025").`);
  }
  const month = MONTH_ORDER[parts[0]!] ?? 0;
  const year = parseInt(parts[1]!, 10);
  return year * 12 + month;
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

interface BlogEntry {
  slug: string;
  lang: string;
  frontmatter: FrontMatter;
  content: string;
  isoDate: string;
  isoDateModified: string;
  wordCount: number;
  sortKey: number;
}

function readEntry(filePath: string, slug: string, lang: string): BlogEntry {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const fm = data as FrontMatter;
  const body = decodeHtmlEntities(content.trim());
  const isoDate = toIsoDateString(fm.publishedAt, fm.date);
  const isoDateModified = toIsoDateString(fm.updatedAt, fm.date) || isoDate;
  return {
    slug,
    lang,
    frontmatter: fm,
    content: body,
    isoDate,
    isoDateModified,
    wordCount: countWords(body),
    sortKey: parseDateForSort(fm.date, filePath),
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

function readBlogPosts(): BlogEntry[] {
  const entries: BlogEntry[] = [];

  appendEntriesForDir(entries, BLOG_DIR, "en");

  const langDirs = listBlogLangDirs();
  for (const lang of langDirs) {
    appendEntriesForDir(entries, path.join(BLOG_DIR, lang), lang);
  }

  entries.sort((a, b) => b.sortKey - a.sortKey);

  return entries;
}

function deriveCategories(entries: BlogEntry[]): string[] {
  const cats = new Set<string>();
  for (const e of entries) {
    if (e.lang === "en") cats.add(e.frontmatter.category);
  }
  return ["All", ...Array.from(cats)];
}

function generateBlogPostEntry(entry: BlogEntry): string {
  const { slug, lang, frontmatter: fm, content, isoDate, isoDateModified, wordCount } = entry;
  const lines: string[] = [];
  lines.push("  {");
  lines.push(`    slug: "${escapeForDoubleQuotedString(slug)}",`);
  lines.push(`    lang: "${escapeForDoubleQuotedString(lang)}",`);
  lines.push(`    title: "${escapeForDoubleQuotedString(fm.title)}",`);
  lines.push(`    date: "${escapeForDoubleQuotedString(fm.date)}",`);
  lines.push(`    isoDate: "${escapeForDoubleQuotedString(isoDate)}",`);
  lines.push(`    isoDateModified: "${escapeForDoubleQuotedString(isoDateModified)}",`);
  lines.push(`    wordCount: ${wordCount},`);
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
