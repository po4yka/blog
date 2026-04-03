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

// --- Generic collection hook factories ---

function createCollectionHooks<T>(config: {
  queryKey: readonly string[];
  getAll: () => Promise<T[]>;
  save: (item: T) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
  idField: keyof T;
  entityName: string;
}) {
  function useList() {
    return useQuery({ queryKey: config.queryKey, queryFn: config.getAll });
  }

  function useSave() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: config.save,
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: config.queryKey });
        toast.success(`${config.entityName} saved`);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  function useDelete() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: config.remove,
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
  }

  return { useList, useSave, useDelete };
}

// --- Posts ---

const postHooks = createCollectionHooks<BlogPost>({
  queryKey: adminKeys.posts,
  getAll: api.getPosts,
  save: api.savePost,
  remove: api.deletePost,
  idField: "slug",
  entityName: "Post",
});

export const usePosts = postHooks.useList;
export const useSavePost = postHooks.useSave;
export const useDeletePost = postHooks.useDelete;

export function usePost(slug: string) {
  return useQuery({
    queryKey: adminKeys.post(slug),
    queryFn: () => api.getPost(slug),
    enabled: !!slug,
  });
}

// --- Projects ---

const projectHooks = createCollectionHooks<Project>({
  queryKey: adminKeys.projects,
  getAll: api.getProjects,
  save: api.saveProject,
  remove: api.deleteProject,
  idField: "id",
  entityName: "Project",
});

export const useProjects = projectHooks.useList;
export const useSaveProject = projectHooks.useSave;
export const useDeleteProject = projectHooks.useDelete;

// --- Roles ---

const roleHooks = createCollectionHooks<Role>({
  queryKey: adminKeys.roles,
  getAll: api.getRoles,
  save: api.saveRole,
  remove: api.deleteRole,
  idField: "id",
  entityName: "Role",
});

export const useRoles = roleHooks.useList;
export const useSaveRole = roleHooks.useSave;
export const useDeleteRole = roleHooks.useDelete;

// --- Categories (non-standard, stays hand-written) ---

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
    onError: (e: Error) => toast.error(e.message),
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

// --- Settings (single-row, stays hand-written) ---

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
    onError: (e: Error) => toast.error(e.message),
  });
}
