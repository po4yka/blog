// Thin fetch wrapper for admin API routes.
// Attaches auth token from sessionStorage.

import type { BlogPost, Project, Role, SiteSettings } from "@/types";

export type { BlogPost, Project, Role, SiteSettings };

const TOKEN_KEY = "admin_token";

let token: string | null = typeof window !== "undefined" ? sessionStorage.getItem(TOKEN_KEY) : null;

export function getToken(): string | null {
  return token;
}

export function setToken(t: string | null) {
  token = t;
  if (t) sessionStorage.setItem(TOKEN_KEY, t);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export function isTokenPresent(): boolean {
  return !!token;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text);
  }
  return res.json();
}

// --- Posts ---
export const getPosts = () => api<BlogPost[]>("posts");
export const getPost = (slug: string) => api<BlogPost>(`posts/${slug}`);
export const savePost = (post: BlogPost) => api<{ ok: true }>("posts", { method: "POST", body: JSON.stringify(post) });
export const updatePost = (post: BlogPost) =>
  api<{ ok: true }>(`posts/${post.slug}`, { method: "PUT", body: JSON.stringify(post) });
export const deletePost = (slug: string) => api<{ ok: true }>(`posts/${slug}`, { method: "DELETE" });

// --- Projects ---
export const getProjects = () => api<Project[]>("projects");
export const saveProject = (project: Project) =>
  api<{ ok: true }>("projects", { method: "POST", body: JSON.stringify(project) });
export const deleteProject = (id: string) => api<{ ok: true }>(`projects/${id}`, { method: "DELETE" });

// --- Roles ---
export const getRoles = () => api<Role[]>("roles");
export const saveRole = (role: Role) => api<{ ok: true }>("roles", { method: "POST", body: JSON.stringify(role) });
export const deleteRole = (id: string) => api<{ ok: true }>(`roles/${id}`, { method: "DELETE" });

// --- Categories ---
export const getCategories = () => api<string[]>("categories");
export const addCategory = (name: string) =>
  api<{ ok: true }>("categories", { method: "POST", body: JSON.stringify({ name }) });
export const removeCategory = (name: string) =>
  api<{ ok: true }>(`categories/${encodeURIComponent(name)}`, { method: "DELETE" });

// --- Settings ---
export const getSettings = () => api<SiteSettings>("settings");
export const updateSettings = (settings: SiteSettings) =>
  api<{ ok: true }>("settings", { method: "PUT", body: JSON.stringify(settings) });

// --- Auth (different base path) ---
export async function logout(): Promise<void> {
  if (!token) return;
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Best-effort: clear client state even if the request fails
  }
  setToken(null);
}

export async function login(password: string): Promise<string> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    throw new ApiError(res.status, "Invalid password");
  }
  const { token: t } = (await res.json()) as { token: string };
  setToken(t);
  return t;
}
