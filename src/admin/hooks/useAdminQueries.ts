import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api";

// --- Query Keys ---

export const adminKeys = {
  posts: ["admin", "posts"] as const,
  post: (slug: string) => ["admin", "posts", slug] as const,
  projects: ["admin", "projects"] as const,
  roles: ["admin", "roles"] as const,
  categories: ["admin", "categories"] as const,
  settings: ["admin", "settings"] as const,
};

// --- Posts ---

export function usePosts() {
  return useQuery({
    queryKey: adminKeys.posts,
    queryFn: api.getPosts,
  });
}

export function usePost(slug: string) {
  return useQuery({
    queryKey: adminKeys.post(slug),
    queryFn: () => api.getPost(slug),
    enabled: !!slug,
  });
}

export function useSavePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.savePost,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.posts }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deletePost,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.posts }),
  });
}

// --- Projects ---

export function useProjects() {
  return useQuery({
    queryKey: adminKeys.projects,
    queryFn: api.getProjects,
  });
}

export function useSaveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.saveProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.projects }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.projects }),
  });
}

// --- Roles ---

export function useRoles() {
  return useQuery({
    queryKey: adminKeys.roles,
    queryFn: api.getRoles,
  });
}

export function useSaveRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.saveRole,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.roles }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteRole,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.roles }),
  });
}

// --- Categories ---

export function useCategories() {
  return useQuery({
    queryKey: adminKeys.categories,
    queryFn: api.getCategories,
  });
}

export function useAddCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.addCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.categories }),
  });
}

export function useRemoveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.removeCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.categories }),
  });
}

// --- Settings ---

export function useAdminSettings() {
  return useQuery({
    queryKey: adminKeys.settings,
    queryFn: api.getSettings,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.settings }),
  });
}
