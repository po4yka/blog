import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { BLOG_DIR, BLOG_LANGS } from "./paths.js";

export type Lang = (typeof BLOG_LANGS)[number];

export interface PostFrontmatter {
  title: string;
  date: string;
  publishedAt: string;
  updatedAt?: string;
  summary: string;
  tags: string[];
  category: string;
  featured?: boolean;
  readingTime?: number;
}

export interface PostData {
  lang: Lang;
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
}

const SLUG_RE = /^[a-z0-9-]+$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function assertLang(lang: unknown): Lang {
  if (!BLOG_LANGS.includes(lang as Lang)) {
    throw new Error(`Invalid lang: ${String(lang)}. Expected one of: ${BLOG_LANGS.join(", ")}`);
  }
  return lang as Lang;
}

// Slugs become file names, so anything outside [a-z0-9-] (path separators, "..") is rejected.
export function assertSlug(slug: unknown): string {
  if (typeof slug !== "string" || !SLUG_RE.test(slug)) {
    throw new Error(`Invalid slug: ${String(slug)}. Must match ${SLUG_RE.source}`);
  }
  return slug;
}

export function assertIsoDate(field: string, value: unknown): string {
  if (
    typeof value !== "string" ||
    !ISO_DATE_RE.test(value) ||
    new Date(value).toISOString().slice(0, 10) !== value
  ) {
    throw new Error(`Invalid ${field}: ${String(value)}. Expected an ISO date like "2026-04-01"`);
  }
  return value;
}

function postPath(lang: unknown, slug: unknown): string {
  return path.join(BLOG_DIR, assertLang(lang), `${assertSlug(slug)}.mdx`);
}

export function postExists(lang: Lang, slug: string): boolean {
  return fs.existsSync(postPath(lang, slug));
}

export function listPosts(): { lang: Lang; slug: string }[] {
  return BLOG_LANGS.flatMap((lang) => {
    const dir = path.join(BLOG_DIR, lang);
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => f.replace(/\.mdx$/, ""))
      .filter((slug) => SLUG_RE.test(slug))
      .sort()
      .map((slug) => ({ lang, slug }));
  });
}

// YAML parses unquoted dates into Date objects; keep them as ISO date strings so a rewrite does not turn them into timestamps.
function normalizeDate(value: unknown): unknown {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

export function readPost(lang: unknown, slug: unknown): PostData {
  const filePath = postPath(lang, slug);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Post not found: ${String(lang)}/${String(slug)}`);
  }
  const { data, content } = matter(fs.readFileSync(filePath, "utf-8"));
  const frontmatter = { ...data } as PostFrontmatter;
  for (const key of ["publishedAt", "updatedAt"] as const) {
    if (frontmatter[key] !== undefined) frontmatter[key] = normalizeDate(frontmatter[key]) as string;
  }
  return { lang: lang as Lang, slug: slug as string, frontmatter, content: content.trim() };
}

export function writePost(
  lang: Lang,
  slug: string,
  frontmatter: PostFrontmatter,
  content: string,
  { create = false }: { create?: boolean } = {},
): void {
  const output = matter.stringify(`\n${content}\n`, frontmatter);
  // "wx" fails if the file already exists, so a create never overwrites a post.
  fs.writeFileSync(postPath(lang, slug), output, { encoding: "utf-8", flag: create ? "wx" : "w" });
}

export function deletePost(lang: unknown, slug: unknown): void {
  const filePath = postPath(lang, slug);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Post not found: ${String(lang)}/${String(slug)}`);
  }
  fs.unlinkSync(filePath);
}
