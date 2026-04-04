// Thin fetch wrapper for admin API routes.
// Auth is via HttpOnly session cookie (set by server on login).
// Client tracks auth state via a lightweight sessionStorage flag.

import type { BlogPost, Project, Role, SiteSettings } from "@/types";

export type { BlogPost, Project, Role, SiteSettings };

const AUTH_FLAG = "admin_authenticated";

export function setAuthFlag(authenticated: boolean) {
  if (authenticated) sessionStorage.setItem(AUTH_FLAG, "1");
  else sessionStorage.removeItem(AUTH_FLAG);
}

export function isAuthenticated(): boolean {
  return typeof window !== "undefined" && sessionStorage.getItem(AUTH_FLAG) === "1";
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

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin/${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "AdminPanel",
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    setAuthFlag(false);
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
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "X-Requested-With": "AdminPanel" },
    });
  } catch {
    // Best-effort: clear client state even if the request fails
  }
  setAuthFlag(false);
}

export async function login(password: string): Promise<void> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text || "Invalid password");
  }
  setAuthFlag(true);
}

// --- Passkey ---

export async function getPasskeyStatus(): Promise<{ hasPasskey: boolean; allowPassword: boolean }> {
  const res = await fetch("/api/auth/passkey/status");
  if (!res.ok) throw new ApiError(res.status, "Failed to get passkey status");
  return res.json();
}

export async function getPasskeyAuthOptions(): Promise<unknown> {
  const res = await fetch("/api/auth/passkey/auth-options");
  if (!res.ok) throw new ApiError(res.status, "Failed to get auth options");
  return res.json();
}

export async function verifyPasskeyAuth(assertion: unknown): Promise<void> {
  const res = await fetch("/api/auth/passkey/auth-verify", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(assertion),
  });
  if (!res.ok) throw new ApiError(res.status, "Passkey verification failed");
  setAuthFlag(true);
}

export async function getPasskeyRegisterOptions(setupToken: string): Promise<unknown> {
  const res = await fetch("/api/auth/passkey/register-options", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "AdminPanel" },
    body: JSON.stringify({ setupToken }),
  });
  if (!res.ok) throw new ApiError(res.status, "Failed to get registration options");
  return res.json();
}

export async function verifyPasskeyRegister(
  setupToken: string,
  credential: unknown,
): Promise<{ ok: boolean; credentialID: string }> {
  const res = await fetch("/api/auth/passkey/register-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "AdminPanel" },
    body: JSON.stringify({ setupToken, credential }),
  });
  if (!res.ok) throw new ApiError(res.status, "Registration failed");
  return res.json();
}
