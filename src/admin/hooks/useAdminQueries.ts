import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "@/admin/api";
import type { Project, Role } from "@/admin/api";
import type { BlogPost } from "@/types";

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.posts });
      toast.success("Post saved");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deletePost,
    onMutate: async (slug) => {
      await qc.cancelQueries({ queryKey: adminKeys.posts });
      const prev = qc.getQueryData<BlogPost[]>(adminKeys.posts);
      qc.setQueryData<BlogPost[]>(adminKeys.posts, (old) =>
        old?.filter((p) => p.slug !== slug),
      );
      return { prev };
    },
    onError: (e, _slug, ctx) => {
      if (ctx?.prev) qc.setQueryData(adminKeys.posts, ctx.prev);
      toast.error(e.message);
    },
    onSuccess: () => toast.success("Post deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: adminKeys.posts }),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.projects });
      toast.success("Project saved");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteProject,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: adminKeys.projects });
      const prev = qc.getQueryData<Project[]>(adminKeys.projects);
      qc.setQueryData<Project[]>(adminKeys.projects, (old) =>
        old?.filter((p) => p.id !== id),
      );
      return { prev };
    },
    onError: (e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(adminKeys.projects, ctx.prev);
      toast.error(e.message);
    },
    onSuccess: () => toast.success("Project deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: adminKeys.projects }),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.roles });
      toast.success("Role saved");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteRole,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: adminKeys.roles });
      const prev = qc.getQueryData<Role[]>(adminKeys.roles);
      qc.setQueryData<Role[]>(adminKeys.roles, (old) =>
        old?.filter((r) => r.id !== id),
      );
      return { prev };
    },
    onError: (e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(adminKeys.roles, ctx.prev);
      toast.error(e.message);
    },
    onSuccess: () => toast.success("Role deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: adminKeys.roles }),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.categories });
      toast.success("Category added");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useRemoveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteCategory,
    onMutate: async (name) => {
      await qc.cancelQueries({ queryKey: adminKeys.categories });
      const prev = qc.getQueryData<string[]>(adminKeys.categories);
      qc.setQueryData<string[]>(adminKeys.categories, (old) =>
        old?.filter((c) => c !== name),
      );
      return { prev };
    },
    onError: (e, _name, ctx) => {
      if (ctx?.prev) qc.setQueryData(adminKeys.categories, ctx.prev);
      toast.error(e.message);
    },
    onSuccess: () => toast.success("Category removed"),
    onSettled: () => qc.invalidateQueries({ queryKey: adminKeys.categories }),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.settings });
      toast.success("Settings saved");
    },
    onError: (e) => toast.error(e.message),
  });
}
