// Thin fetch wrapper for admin API routes.
// Attaches auth token from sessionStorage.

import type { BlogPost, Project, Role, SiteSettings } from "@/types";

export type { BlogPost, Project, Role, SiteSettings };

const TOKEN_KEY = "admin_token";

let token: string | null | undefined = undefined;

function readToken(): string | null {
  if (token === undefined) {
    token = typeof window !== "undefined" ? sessionStorage.getItem(TOKEN_KEY) : null;
  }
  return token;
}

export function getToken(): string | null {
  return readToken();
}

export function setToken(t: string | null) {
  token = t;
  if (t) sessionStorage.setItem(TOKEN_KEY, t);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export function isTokenPresent(): boolean {
  return !!readToken();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const t = readToken();
  const res = await fetch(`/api/admin/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...init?.headers,
    },
  });
  const newToken = res.headers.get("X-New-Token");
  if (newToken) {
    setToken(newToken);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text);
  }
  return res.json();
}

// --- Posts ---
export const getPosts = () => adminFetch<BlogPost[]>("posts");
export const getPost = (slug: string) => adminFetch<BlogPost>(`posts/${slug}`);
export const savePost = (post: BlogPost) => adminFetch<{ ok: true }>("posts", { method: "POST", body: JSON.stringify(post) });
export const deletePost = (slug: string) => adminFetch<{ ok: true }>(`posts/${slug}`, { method: "DELETE" });

// --- Projects ---
export const getProjects = () => adminFetch<Project[]>("projects");
export const saveProject = (project: Project) =>
  adminFetch<{ ok: true }>("projects", { method: "POST", body: JSON.stringify(project) });
export const deleteProject = (id: string) => adminFetch<{ ok: true }>(`projects/${id}`, { method: "DELETE" });

// --- Roles ---
export const getRoles = () => adminFetch<Role[]>("roles");
export const saveRole = (role: Role) => adminFetch<{ ok: true }>("roles", { method: "POST", body: JSON.stringify(role) });
export const deleteRole = (id: string) => adminFetch<{ ok: true }>(`roles/${id}`, { method: "DELETE" });

// --- Categories ---
export const getCategories = () => adminFetch<string[]>("categories");
export const addCategory = (name: string) =>
  adminFetch<{ ok: true }>("categories", { method: "POST", body: JSON.stringify({ name }) });
export const deleteCategory = (name: string) =>
  adminFetch<{ ok: true }>(`categories/${encodeURIComponent(name)}`, { method: "DELETE" });

// --- Settings ---
export const getSettings = () => adminFetch<SiteSettings>("settings");
export const updateSettings = (settings: SiteSettings) =>
  adminFetch<{ ok: true }>("settings", { method: "PUT", body: JSON.stringify(settings) });

// --- Auth (different base path) ---
export async function logout(): Promise<void> {
  const t = readToken();
  if (!t) return;
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}` },
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
