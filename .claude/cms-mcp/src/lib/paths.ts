import path from "node:path";

export const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
export const BLOG_DIR = path.join(PROJECT_ROOT, "src/content/blog");
export const PROJECTS_FILE = path.join(PROJECT_ROOT, "src/content/projects.json");
export const EXPERIENCE_FILE = path.join(PROJECT_ROOT, "src/content/experience.json");
