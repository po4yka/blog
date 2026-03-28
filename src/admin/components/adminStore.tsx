import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, type ReactNode } from "react";
import { blogPosts as defaultBlogPosts, categories as defaultCategories, type BlogPost } from "../../components/blogData";

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

interface AdminContextType extends AdminState {
  login: (password: string) => boolean;
  logout: () => void;
  // Blog
  saveBlogPost: (post: BlogPost) => void;
  deleteBlogPost: (slug: string) => void;
  // Projects
  saveProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  // Experience
  saveRole: (role: Role) => void;
  deleteRole: (id: string) => void;
  // Categories
  addCategory: (cat: string) => void;
  removeCategory: (cat: string) => void;
  // Settings
  updateSettings: (settings: SiteSettings) => void;
  // Reset
  resetToDefaults: () => void;
}

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

// --- Storage keys ---

const STORAGE_KEYS = {
  blogPosts: "admin_blogPosts",
  projects: "admin_projects",
  roles: "admin_roles",
  categories: "admin_categories",
  settings: "admin_settings",
  auth: "admin_auth",
} as const;

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return fallback;
}

function saveToStorage(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Context ---

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() =>
    loadFromStorage(STORAGE_KEYS.blogPosts, defaultBlogPosts)
  );
  const [projects, setProjects] = useState<Project[]>(() =>
    loadFromStorage(STORAGE_KEYS.projects, defaultProjects)
  );
  const [roles, setRoles] = useState<Role[]>(() =>
    loadFromStorage(STORAGE_KEYS.roles, defaultRoles)
  );
  const [categories, setCategories] = useState<string[]>(() =>
    loadFromStorage(STORAGE_KEYS.categories, defaultCategories)
  );
  const [settings, setSettings] = useState<SiteSettings>(() =>
    loadFromStorage(STORAGE_KEYS.settings, defaultSettings)
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    loadFromStorage(STORAGE_KEYS.auth, false)
  );

  // Persist all state in a single batched effect using a microtask debounce.
  // This replaces 6 separate useEffect hooks with 1, reducing effect overhead
  // and batching rapid sequential edits into a single localStorage write pass.
  const pendingFlush = useRef(false);
  useEffect(() => {
    if (!pendingFlush.current) {
      pendingFlush.current = true;
      queueMicrotask(() => {
        saveToStorage(STORAGE_KEYS.blogPosts, blogPosts);
        saveToStorage(STORAGE_KEYS.projects, projects);
        saveToStorage(STORAGE_KEYS.roles, roles);
        saveToStorage(STORAGE_KEYS.categories, categories);
        saveToStorage(STORAGE_KEYS.settings, settings);
        saveToStorage(STORAGE_KEYS.auth, isAuthenticated);
        pendingFlush.current = false;
      });
    }
  }, [blogPosts, projects, roles, categories, settings, isAuthenticated]);

  const login = useCallback((password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  // Blog CRUD
  const saveBlogPost = useCallback((post: BlogPost) => {
    setBlogPosts((prev) => {
      const idx = prev.findIndex((p) => p.slug === post.slug);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = post;
        return updated;
      }
      return [post, ...prev];
    });
  }, []);

  const deleteBlogPost = useCallback((slug: string) => {
    setBlogPosts((prev) => prev.filter((p) => p.slug !== slug));
  }, []);

  // Project CRUD
  const saveProject = useCallback((project: Project) => {
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === project.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = project;
        return updated;
      }
      return [...prev, project];
    });
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Role CRUD
  const saveRole = useCallback((role: Role) => {
    setRoles((prev) => {
      const idx = prev.findIndex((r) => r.id === role.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = role;
        return updated;
      }
      return [...prev, role];
    });
  }, []);

  const deleteRole = useCallback((id: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Categories
  const addCategory = useCallback((cat: string) => {
    setCategories((prev) => prev.includes(cat) ? prev : [...prev, cat]);
  }, []);

  const removeCategory = useCallback((cat: string) => {
    setCategories((prev) => prev.filter((c) => c !== cat && c !== "All"));
  }, []);

  // Settings
  const updateSettings = useCallback((s: SiteSettings) => {
    setSettings(s);
  }, []);

  // Reset
  const resetToDefaults = useCallback(() => {
    setBlogPosts(defaultBlogPosts);
    setProjects(defaultProjects);
    setRoles(defaultRoles);
    setCategories(defaultCategories);
    setSettings(defaultSettings);
  }, []);

  // Memoize context value to prevent unnecessary consumer re-renders
  const contextValue = useMemo(
    () => ({
      blogPosts, projects, roles, categories, settings, isAuthenticated,
      login, logout,
      saveBlogPost, deleteBlogPost,
      saveProject, deleteProject,
      saveRole, deleteRole,
      addCategory, removeCategory,
      updateSettings,
      resetToDefaults,
    }),
    [
      blogPosts, projects, roles, categories, settings, isAuthenticated,
      login, logout,
      saveBlogPost, deleteBlogPost,
      saveProject, deleteProject,
      saveRole, deleteRole,
      addCategory, removeCategory,
      updateSettings,
      resetToDefaults,
    ]
  );

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}

export { defaultProjects, defaultRoles, defaultSettings };