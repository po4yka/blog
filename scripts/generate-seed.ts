// Build-time generator: derives db/seed.sql from canonical source files.
// Reads MDX blog posts, projects.json, and experience.json.
// Run via: npx tsx scripts/generate-seed.ts

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const BLOG_DIR = path.resolve("src/content/blog");
const PROJECTS_FILE = path.resolve("src/content/projects.json");
const EXPERIENCE_FILE = path.resolve("src/content/experience.json");
const OUTPUT_FILE = path.resolve("db/seed.sql");

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

interface BlogFrontMatter {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  category: string;
  featured?: boolean;
}

/** Count words in content the same way generate-blog-data.ts does. */
function countWords(content: string): number {
  const stripped = content.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");
  const tokens = stripped.split(/\s+/).filter((t) => /\w/.test(t));
  return tokens.length;
}

interface BlogSeedEntry {
  slug: string;
  lang: string;
  fm: BlogFrontMatter;
  body: string;
  readingTime: number;
}

/** Recursively collect entries from en/ and ru/ subdirs of BLOG_DIR. */
function collectBlogEntries(): BlogSeedEntry[] {
  const entries: BlogSeedEntry[] = [];
  const items = fs.readdirSync(BLOG_DIR, { withFileTypes: true });
  for (const item of items) {
    if (!item.isDirectory() || (item.name !== "en" && item.name !== "ru")) continue;
    const lang = item.name;
    const langDir = path.join(BLOG_DIR, lang);
    const files = fs.readdirSync(langDir).filter((f) => f.endsWith(".mdx")).sort();
    for (const file of files) {
      const raw = fs.readFileSync(path.join(langDir, file), "utf-8");
      const { data, content } = matter(raw);
      const fm = data as BlogFrontMatter;
      const body = content.trim();
      const wordCount = countWords(body);
      entries.push({
        slug: file.replace(/\.mdx$/, ""),
        lang,
        fm,
        body,
        readingTime: Math.ceil(wordCount / 200),
      });
    }
  }
  return entries;
}

interface ProjectJSON {
  id: string;
  name: string;
  description: string;
  platforms: string[];
  tags: string[];
  links: { type: string; href: string }[];
  featured?: boolean;
}

interface RoleJSON {
  id: string;
  period: string;
  company: string;
  title: string;
  description: string;
  tags?: string[];
}

interface ExperienceJSON {
  roles: RoleJSON[];
}

function generateBlogSeed(entries: BlogSeedEntry[]): string {
  if (entries.length === 0) return "";

  const values: string[] = [];

  for (const { slug, lang, fm, body, readingTime } of entries) {
    values.push(
      `('${escapeSql(slug)}', '${escapeSql(lang)}', '${escapeSql(fm.title)}', '${escapeSql(fm.date)}',\n` +
        ` '${escapeSql(fm.summary)}',\n` +
        ` '${escapeSql(JSON.stringify(fm.tags))}', '${escapeSql(fm.category)}',\n` +
        ` '${escapeSql(body)}', ${fm.featured ? 1 : 0}, ${readingTime})`,
    );
  }

  return (
    "-- Blog posts\n" +
    "INSERT INTO blog_posts (slug, lang, title, date, summary, tags, category, content, featured, reading_time) VALUES\n" +
    values.join(",\n\n") +
    ";\n"
  );
}

function generateCategoriesSeed(blogCategories: string[]): string {
  const cats = ["All", ...blogCategories];
  const values = cats.map((c) => `('${escapeSql(c)}')`).join(", ");
  return `-- Categories\nINSERT INTO categories (name) VALUES\n${values};\n`;
}

function generateProjectsSeed(): string {
  const raw = fs.readFileSync(PROJECTS_FILE, "utf-8");
  const projects = JSON.parse(raw) as ProjectJSON[];

  const values = projects.map((p, i) => {
    const platforms = JSON.stringify(p.platforms);
    const tags = JSON.stringify(p.tags);
    const links = JSON.stringify(p.links);
    return (
      `('${escapeSql(p.id)}', '${escapeSql(p.name)}',\n` +
      ` '${escapeSql(p.description)}',\n` +
      ` '${escapeSql(platforms)}', '${escapeSql(tags)}',\n` +
      ` '${escapeSql(links)}', ${p.featured ? 1 : 0}, ${i})`
    );
  });

  return (
    "-- Projects\n" +
    "INSERT INTO projects (id, name, description, platforms, tags, links, featured, sort_order) VALUES\n" +
    values.join(",\n") +
    ";\n"
  );
}

function generateRolesSeed(): string {
  const raw = fs.readFileSync(EXPERIENCE_FILE, "utf-8");
  const data = JSON.parse(raw) as ExperienceJSON;

  const values = data.roles.map((r, i) => {
    const tags = r.tags ? JSON.stringify(r.tags) : "[]";
    return (
      `('${escapeSql(r.id)}', '${escapeSql(r.period)}', '${escapeSql(r.company)}', '${escapeSql(r.title)}',\n` +
      ` '${escapeSql(r.description)}',\n` +
      ` '${escapeSql(tags)}', ${i})`
    );
  });

  return (
    "-- Roles\n" +
    "INSERT INTO roles (id, period, company, title, description, tags, sort_order) VALUES\n" +
    values.join(",\n") +
    ";\n"
  );
}

function generateSettingsSeed(): string {
  return (
    "-- Site settings\n" +
    "INSERT INTO site_settings (id, name, handle, role, bio, github, email, telegram, linkedin) VALUES\n" +
    "(1, 'Nikita Pochaev', '@po4yka',\n" +
    " 'AI Engineer & Senior Mobile Developer — Android, Kotlin Multiplatform Mobile (KMM)',\n" +
    " 'AI Engineer and Senior Mobile Developer. I ship native Android apps, architect Kotlin Multiplatform Mobile (KMM) shared modules, and integrate ML-powered features into production products. I care about clean architecture, reliable release pipelines, and tools that help teams ship better software.',\n" +
    " 'https://github.com/po4yka', 'hello@po4yka.dev', 'https://t.me/po4yka', 'https://linkedin.com/in/po4yka');\n"
  );
}

export function generateSeedSource(): string {
  const entries = collectBlogEntries();

  // Derive categories from English posts only (mirrors generate-blog-data.ts deriveCategories)
  const categories = new Set<string>();
  for (const e of entries) {
    if (e.lang === "en") categories.add(e.fm.category);
  }

  const sections = [
    "-- Auto-generated from source files. Do not edit manually.",
    "-- Run \"npm run generate:all\" to regenerate.\n",
    generateBlogSeed(entries),
    generateCategoriesSeed(Array.from(categories)),
    generateProjectsSeed(),
    generateRolesSeed(),
    generateSettingsSeed(),
  ];

  return sections.join("\n");
}

// Run as script
if (import.meta.url === `file://${process.argv[1]}`) {
  const output = generateSeedSource();
  fs.writeFileSync(OUTPUT_FILE, output, "utf-8");
  console.log(`Generated ${OUTPUT_FILE}`);
}
