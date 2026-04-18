/**
 * WebMCP bootstrap. Exposes a small set of site-scoped tools to in-browser
 * AI agents via `navigator.modelContext.provideContext`.
 *
 * Spec: https://webmachinelearning.github.io/webmcp/
 * No-ops when the browser does not implement the API.
 */

import { useSettingsStore, type ThemeMode } from "@/stores/settingsStore";

interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<unknown> | unknown;
}

interface ModelContext {
  provideContext: (ctx: { tools: WebMCPTool[] }) => void | Promise<void>;
}

declare global {
  interface Navigator {
    modelContext?: ModelContext;
  }
}

interface SiteIndexPost {
  slug: string;
  lang: "en" | "ru";
  title: string;
  isoDate: string | null;
  summary: string;
  tags: string[];
  category: string;
  url: string;
  markdownUrl: string;
}

interface SiteIndex {
  site: { name: string; handle: string; origin: string; llmsUrl: string; llmsFullUrl: string };
  posts: SiteIndexPost[];
  projects: Array<{
    id: string;
    name: string;
    description: string;
    platforms: string[];
    tags: string[];
    year: string | null;
    status: string | null;
    links: Array<{ type: string; href: string }>;
  }>;
  experience: Array<{
    id: string;
    company: string;
    title: string;
    period: string;
    description: string;
    tags: string[];
    location: string | null;
  }>;
}

let indexPromise: Promise<SiteIndex> | null = null;

function loadIndex(): Promise<SiteIndex> {
  if (!indexPromise) {
    indexPromise = fetch("/site-index.json", { credentials: "same-origin" }).then((res) => {
      if (!res.ok) throw new Error(`site-index.json ${res.status}`);
      return res.json() as Promise<SiteIndex>;
    });
  }
  return indexPromise;
}

const SECTION_PATHS: Record<string, string> = {
  home: "/",
  blog: "/blog",
  projects: "/projects",
  experience: "/experience",
  settings: "/settings",
};

export async function registerWebMCP(): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.modelContext?.provideContext) return;
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) return;

  const tools: WebMCPTool[] = [
    {
      name: "list_blog_posts",
      description:
        "List published blog posts by Nikita Pochaev with metadata. Returns slug, title, date, tags, summary, canonical URL, and a markdown URL suitable for fetching full post content. Optionally filter by language or tag.",
      inputSchema: {
        type: "object",
        properties: {
          lang: {
            type: "string",
            enum: ["en", "ru"],
            description: "Filter by language. Omit to include both English and Russian posts.",
          },
          tag: {
            type: "string",
            description: "Filter by tag (case-insensitive substring match).",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            description: "Maximum number of posts to return.",
          },
        },
        additionalProperties: false,
      },
      async execute(input) {
        const { lang, tag, limit } = input as { lang?: "en" | "ru"; tag?: string; limit?: number };
        const { posts } = await loadIndex();
        const needle = tag?.toLowerCase();
        const filtered = posts
          .filter((p) => !lang || p.lang === lang)
          .filter((p) => !needle || p.tags.some((t) => t.toLowerCase().includes(needle)))
          .sort((a, b) => (b.isoDate ?? "").localeCompare(a.isoDate ?? ""));
        return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
      },
    },
    {
      name: "list_projects",
      description:
        "List Nikita Pochaev's selected projects with name, description, platforms, tags, and links (GitHub, Google Play, App Store where present).",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      async execute() {
        const { projects } = await loadIndex();
        return projects;
      },
    },
    {
      name: "list_experience",
      description:
        "List Nikita Pochaev's professional experience: company, role title, period, description, and skill tags.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      async execute() {
        const { experience } = await loadIndex();
        return experience;
      },
    },
    {
      name: "set_site_theme",
      description:
        "Change the site theme to light, dark, or system. The preference persists in localStorage.",
      inputSchema: {
        type: "object",
        properties: {
          mode: { type: "string", enum: ["light", "dark", "system"] },
        },
        required: ["mode"],
        additionalProperties: false,
      },
      execute(input) {
        const mode = (input as { mode: ThemeMode }).mode;
        useSettingsStore.getState().setTheme(mode);
        return { ok: true, theme: mode };
      },
    },
    {
      name: "navigate_to_section",
      description:
        "Navigate the current tab to a top-level section of po4yka.dev. Valid sections: home, blog, projects, experience, settings.",
      inputSchema: {
        type: "object",
        properties: {
          section: { type: "string", enum: Object.keys(SECTION_PATHS) },
        },
        required: ["section"],
        additionalProperties: false,
      },
      execute(input) {
        const { section } = input as { section: string };
        const path = SECTION_PATHS[section];
        if (!path) return { ok: false, error: "unknown section" };
        window.location.assign(path);
        return { ok: true, path };
      },
    },
  ];

  try {
    await navigator.modelContext.provideContext({ tools });
  } catch (err) {
    console.warn("[webmcp] provideContext failed", err);
  }
}
