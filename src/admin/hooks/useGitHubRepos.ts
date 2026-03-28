import { useQuery } from "@tanstack/react-query";
import type { GitHubRepoSummary } from "../../pages/api/github/repos";

export function useGitHubRepos() {
  return useQuery({
    queryKey: ["github", "repos"],
    queryFn: async (): Promise<GitHubRepoSummary[]> => {
      const res = await fetch("/api/github/repos");
      if (!res.ok) throw new Error("Failed to fetch GitHub repos");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
