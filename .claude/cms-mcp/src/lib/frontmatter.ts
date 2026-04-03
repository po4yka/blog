import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { BLOG_DIR } from "./paths.js";

export interface PostFrontmatter {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  category: string;
  featured?: boolean;
  readingTime?: number;
}

export interface PostData {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
}

export function listPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""))
    .sort();
}

export function readPost(slug: string): PostData {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Post not found: ${slug}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    slug,
    frontmatter: data as PostFrontmatter,
    content: content.trim(),
  };
}

export function writePost(
  slug: string,
  frontmatter: PostFrontmatter,
  content: string,
): void {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  const output = matter.stringify(`\n${content}\n`, frontmatter);
  fs.writeFileSync(filePath, output, "utf-8");
}

export function deletePost(slug: string): void {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Post not found: ${slug}`);
  }
  fs.unlinkSync(filePath);
}
