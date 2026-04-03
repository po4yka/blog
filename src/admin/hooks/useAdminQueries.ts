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

// --- Generic delete mutation factory ---

function createDeleteHook<T>(config: {
  mutationFn: (id: string) => Promise<unknown>;
  queryKey: readonly string[];
  idField: keyof T;
  entityName: string;
}) {
  return function useDeleteEntity() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: config.mutationFn,
      onMutate: async (id: string) => {
        await qc.cancelQueries({ queryKey: config.queryKey });
        const prev = qc.getQueryData<T[]>(config.queryKey);
        qc.setQueryData<T[]>(config.queryKey, (old) =>
          old?.filter((item) => item[config.idField] !== id),
        );
        return { prev };
      },
      onError: (e: Error, _id: string, ctx: { prev?: T[] } | undefined) => {
        if (ctx?.prev) qc.setQueryData(config.queryKey, ctx.prev);
        toast.error(e.message);
      },
      onSuccess: () => toast.success(`${config.entityName} deleted`),
      onSettled: () => qc.invalidateQueries({ queryKey: config.queryKey }),
    });
  };
}

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

export const useDeletePost = createDeleteHook<BlogPost>({
  mutationFn: api.deletePost,
  queryKey: adminKeys.posts,
  idField: "slug",
  entityName: "Post",
});

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

export const useDeleteProject = createDeleteHook<Project>({
  mutationFn: api.deleteProject,
  queryKey: adminKeys.projects,
  idField: "id",
  entityName: "Project",
});

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

export const useDeleteRole = createDeleteHook<Role>({
  mutationFn: api.deleteRole,
  queryKey: adminKeys.roles,
  idField: "id",
  entityName: "Role",
});

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
