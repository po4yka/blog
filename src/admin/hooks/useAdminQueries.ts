import { useQuery } from "@tanstack/react-query";
import * as api from "@/admin/api";
import type { TelemetryRange } from "@/lib/telemetry-types";

// The admin is a read-only mirror of the repo content: queries only, no mutations.

export const adminKeys = {
  posts: ["admin", "posts"] as const,
  projects: ["admin", "projects"] as const,
  roles: ["admin", "roles"] as const,
  categories: ["admin", "categories"] as const,
  settings: ["admin", "settings"] as const,
  telemetry: (range: string) => ["admin", "telemetry", range] as const,
};

export const usePosts = () => useQuery({ queryKey: adminKeys.posts, queryFn: api.getPosts });
export const useProjects = () => useQuery({ queryKey: adminKeys.projects, queryFn: api.getProjects });
export const useRoles = () => useQuery({ queryKey: adminKeys.roles, queryFn: api.getRoles });
export const useCategories = () => useQuery({ queryKey: adminKeys.categories, queryFn: api.getCategories });
export const useAdminSettings = () => useQuery({ queryKey: adminKeys.settings, queryFn: api.getSettings });

export function useTelemetry(range: TelemetryRange) {
  // Poll while the page is open (the app turns off refetch on focus). The server caches each range,
  // so a poll costs no upstream call until that cache expires.
  return useQuery({
    queryKey: adminKeys.telemetry(range),
    queryFn: () => api.getTelemetry(range),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
