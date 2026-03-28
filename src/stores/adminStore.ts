import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { blogPosts as defaultBlogPosts, categories as defaultCategories, type BlogPost } from "../components/blogData";

// --- Types ---

export interface Project {
  id: string;
  name: string;
  description: string;
  platforms: string[];
  tags: string[];
  links: { type: string; href: string }[];
  featured?: boolean;
}

export interface Role {
  id: string;
  period: string;
  company: string;
  title: string;
  description: string;
  tags?: string[];
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

interface AdminState {
  blogPosts: BlogPost[];
  projects: Project[];
  roles: Role[];
  categories: string[];
  settings: SiteSettings;
  isAuthenticated: boolean;
}

interface AdminActions {
  login: (password: string) => boolean;
  logout: () => void;
  saveBlogPost: (post: BlogPost) => void;
  deleteBlogPost: (slug: string) => void;
  saveProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  saveRole: (role: Role) => void;
  deleteRole: (id: string) => void;
  addCategory: (cat: string) => void;
  removeCategory: (cat: string) => void;
  updateSettings: (settings: SiteSettings) => void;
  resetToDefaults: () => void;
}

type AdminStore = AdminState & AdminActions;

// --- Defaults ---

const ADMIN_PASSWORD = "po4yka2026";

const defaultProjects: Project[] = [
  {
    id: "proj-1",
    name: "Meridian",
    description: "Cross-platform habit tracker built with Kotlin Multiplatform. Shared business logic, native UI on both platforms.",
    platforms: ["Android", "iOS"],
    tags: ["KMP", "Compose", "SwiftUI"],
    links: [
      { type: "GitHub", href: "#" },
      { type: "Google Play", href: "#" },
      { type: "App Store", href: "#" },
    ],
    featured: true,
  },
  {
    id: "proj-2",
    name: "Deploybot",
    description: "Internal release automation tool for mobile teams. Manages build variants, signing configs, and distribution channels.",
    platforms: ["Android"],
    tags: ["MobileOps", "Gradle Plugin", "Internal Tooling"],
    links: [{ type: "GitHub", href: "#" }],
  },
  {
    id: "proj-3",
    name: "Compose Metrics Dashboard",
    description: "Visualization tool for Jetpack Compose compiler metrics. Tracks recomposition counts, stability, and performance regressions.",
    platforms: ["Android"],
    tags: ["Compose", "Performance", "Tooling"],
    links: [
      { type: "GitHub", href: "#" },
      { type: "Google Play", href: "#" },
    ],
  },
  {
    id: "proj-4",
    name: "Castaway",
    description: "Podcast player with offline-first architecture. Background downloads, queue management, and playback speed control.",
    platforms: ["iOS"],
    tags: ["Swift", "AVFoundation", "CoreData"],
    links: [
      { type: "GitHub", href: "#" },
      { type: "App Store", href: "#" },
    ],
  },
];

const defaultRoles: Role[] = [
  {
    id: "role-1",
    period: "2023 — Present",
    company: "Freelance / Independent",
    title: "Mobile Engineer & Consultant",
    description: "Building apps and tooling for clients. Focus on KMP architecture, release automation, and CI/CD pipelines for mobile teams.",
    tags: ["KMP", "MobileOps", "Architecture"],
  },
  {
    id: "role-2",
    period: "2021 — 2023",
    company: "Tech Company",
    title: "Senior Android Developer",
    description: "Led the Android platform team. Migrated from XML to Compose, built modularization strategy, reduced build times by 40%.",
    tags: ["Android", "Compose", "Gradle"],
  },
  {
    id: "role-3",
    period: "2019 — 2021",
    company: "Startup",
    title: "Mobile Developer",
    description: "Full-cycle mobile development for a product-stage startup. Built features across Android and iOS, set up CI/CD from scratch.",
    tags: ["Android", "iOS", "CI/CD"],
  },
  {
    id: "role-4",
    period: "2018 — 2019",
    company: "University / Open Source",
    title: "Junior Developer",
    description: "Started contributing to open source Android libraries. Built first production app. Learned Kotlin, RxJava, and clean architecture.",
    tags: ["Kotlin", "Open Source"],
  },
];

const defaultSettings: SiteSettings = {
  name: "Nikita Pochaev",
  handle: "@po4yka",
  role: "Mobile Developer — Android, iOS, Kotlin Multiplatform, MobileOps",
  bio: "Mobile engineer focused on Android, iOS, and Kotlin Multiplatform. I care about clean architecture, reliable release pipelines, and tools that help teams ship better software.",
  github: "https://github.com/po4yka",
  email: "hello@po4yka.dev",
  telegram: "https://t.me/po4yka",
  linkedin: "https://linkedin.com/in/po4yka",
};

const defaultState: AdminState = {
  blogPosts: defaultBlogPosts,
  projects: defaultProjects,
  roles: defaultRoles,
  categories: defaultCategories,
  settings: defaultSettings,
  isAuthenticated: false,
};

// --- Storage keys for migration from old format ---

const OLD_STORAGE_KEYS = {
  blogPosts: "admin_blogPosts",
  projects: "admin_projects",
  roles: "admin_roles",
  categories: "admin_categories",
  settings: "admin_settings",
  auth: "admin_auth",
} as const;

function loadOldKey<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return fallback;
}

function migrateFromOldKeys(): AdminState | null {
  // Check if any old keys exist
  const hasOldData = Object.values(OLD_STORAGE_KEYS).some((key) => localStorage.getItem(key) !== null);
  if (!hasOldData) return null;

  const state: AdminState = {
    blogPosts: loadOldKey(OLD_STORAGE_KEYS.blogPosts, defaultBlogPosts),
    projects: loadOldKey(OLD_STORAGE_KEYS.projects, defaultProjects),
    roles: loadOldKey(OLD_STORAGE_KEYS.roles, defaultRoles),
    categories: loadOldKey(OLD_STORAGE_KEYS.categories, defaultCategories),
    settings: loadOldKey(OLD_STORAGE_KEYS.settings, defaultSettings),
    isAuthenticated: loadOldKey(OLD_STORAGE_KEYS.auth, false),
  };

  // Clean up old keys
  Object.values(OLD_STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));

  return state;
}

// --- Store ---

export const useAdminStore = create<AdminStore>()(
  devtools(
    persist(
      (set) => ({
        ...defaultState,

        login: (password) => {
          if (password === ADMIN_PASSWORD) {
            set({ isAuthenticated: true });
            return true;
          }
          return false;
        },

        logout: () => set({ isAuthenticated: false }),

        saveBlogPost: (post) =>
          set((state) => {
            const idx = state.blogPosts.findIndex((p) => p.slug === post.slug);
            if (idx >= 0) {
              const updated = [...state.blogPosts];
              updated[idx] = post;
              return { blogPosts: updated };
            }
            return { blogPosts: [post, ...state.blogPosts] };
          }),

        deleteBlogPost: (slug) =>
          set((state) => ({ blogPosts: state.blogPosts.filter((p) => p.slug !== slug) })),

        saveProject: (project) =>
          set((state) => {
            const idx = state.projects.findIndex((p) => p.id === project.id);
            if (idx >= 0) {
              const updated = [...state.projects];
              updated[idx] = project;
              return { projects: updated };
            }
            return { projects: [...state.projects, project] };
          }),

        deleteProject: (id) =>
          set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),

        saveRole: (role) =>
          set((state) => {
            const idx = state.roles.findIndex((r) => r.id === role.id);
            if (idx >= 0) {
              const updated = [...state.roles];
              updated[idx] = role;
              return { roles: updated };
            }
            return { roles: [...state.roles, role] };
          }),

        deleteRole: (id) =>
          set((state) => ({ roles: state.roles.filter((r) => r.id !== id) })),

        addCategory: (cat) =>
          set((state) => ({
            categories: state.categories.includes(cat) ? state.categories : [...state.categories, cat],
          })),

        removeCategory: (cat) =>
          set((state) => ({
            categories: state.categories.filter((c) => c !== cat && c !== "All"),
          })),

        updateSettings: (settings) => set({ settings }),

        resetToDefaults: () =>
          set({
            blogPosts: defaultBlogPosts,
            projects: defaultProjects,
            roles: defaultRoles,
            categories: defaultCategories,
            settings: defaultSettings,
          }),
      }),
      {
        name: "admin_state",
        partialize: ({ blogPosts, projects, roles, categories, settings, isAuthenticated }) => ({
          blogPosts,
          projects,
          roles,
          categories,
          settings,
          isAuthenticated,
        }),
        migrate: (persisted) => {
          // On first load, try to migrate from old separate localStorage keys
          if (typeof window !== "undefined") {
            const migrated = migrateFromOldKeys();
            if (migrated) return migrated;
          }
          return { ...defaultState, ...(persisted as Partial<AdminState>) };
        },
        version: 1,
      },
    ),
    { name: "AdminStore" },
  ),
);

/** Convenience hook preserving the original useAdmin() API */
export function useAdmin() {
  return useAdminStore();
}

export { defaultProjects, defaultRoles, defaultSettings };
