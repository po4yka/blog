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

function generateBlogSeed(): string {
  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .sort();

  if (files.length === 0) return "";

  const values: string[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    const fm = data as BlogFrontMatter;
    const slug = file.replace(/\.mdx$/, "");
    const body = content.trim();

    values.push(
      `('${escapeSql(slug)}', '${escapeSql(fm.title)}', '${escapeSql(fm.date)}',\n` +
        ` '${escapeSql(fm.summary)}',\n` +
        ` '${escapeSql(JSON.stringify(fm.tags))}', '${escapeSql(fm.category)}',\n` +
        ` '${escapeSql(body)}', ${fm.featured ? 1 : 0})`,
    );
  }

  return (
    "-- Blog posts\n" +
    "INSERT INTO blog_posts (slug, title, date, summary, tags, category, content, featured) VALUES\n" +
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
    " 'Mobile Developer — Android, iOS, Kotlin Multiplatform, MobileOps',\n" +
    " 'Mobile engineer focused on Android, iOS, and Kotlin Multiplatform. I care about clean architecture, reliable release pipelines, and tools that help teams ship better software.',\n" +
    " 'https://github.com/po4yka', 'hello@po4yka.dev', 'https://t.me/po4yka', 'https://linkedin.com/in/po4yka');\n"
  );
}

export function generateSeedSource(): string {
  // Collect categories from blog posts
  const blogFiles = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"));

  const categories = new Set<string>();
  for (const file of blogFiles) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data } = matter(raw);
    categories.add((data as BlogFrontMatter).category);
  }

  const sections = [
    "-- Auto-generated from source files. Do not edit manually.",
    "-- Run \"npm run generate:all\" to regenerate.\n",
    generateBlogSeed(),
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
