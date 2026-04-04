// Canonical shared types for blog, projects, roles, and site settings.
// Used by both the public static site and the admin D1 backend.

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  category: string;
  content: string;
  featured?: boolean;
  readingTime?: number;
  lang?: string;
}

/** Subset of BlogPost used for SEO meta tags and JSON-LD. */
export interface BlogPostData {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  category: string;
}

export interface ProjectLink {
  type: string;
  href: string;
}

export interface Project {
  id: string;
  name: string;
  slug?: string;
  description: string;
  longDescription?: string;
  platforms: string[];
  tags: string[];
  links: ProjectLink[];
  featured?: boolean;
  sortOrder?: number;
  previewLabel?: string;
  year?: string;
  status?: string;
}

export interface Role {
  id: string;
  period: string;
  company: string;
  title: string;
  description: string;
  tags?: string[];
  sortOrder?: number;
  highlights?: string[];
  location?: string;
}

export interface SiteSettings {
  name: string;
  handle: string;
  role: string;
  bio: string;
  github: string;
  email: string;
  telegram: string;
  linkedin: string;
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export interface GitHubRepoSummary {
  name: string;
  description: string;
  url: string;
  stars: number;
  language: string | null;
  topics: string[];
}
