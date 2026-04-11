import type { BlogPost, BlogStats, Project, TagStat } from "@/types";

export function computeBlogStats(posts: BlogPost[]): BlogStats {
  const en = posts.filter((p) => !p.lang || p.lang === "en");
  const ru = posts.filter((p) => p.lang === "ru");

  const categories = new Set(en.map((p) => p.category)).size;
  const tags = new Set(posts.flatMap((p) => p.tags)).size;

  const totalReadingMinutes = posts.reduce((sum, p) => {
    const words = p.content.trim().split(/\s+/).length;
    return sum + Math.ceil(words / 225);
  }, 0);

  const latestDate = posts.length > 0 ? (posts[0]?.date ?? null) : null;

  return {
    total: posts.length,
    en: en.length,
    ru: ru.length,
    categories,
    tags,
    totalReadingMinutes,
    latestDate,
  };
}

export function aggregateProjectTags(projects: Project[], topN = 10): TagStat[] {
  const counts: Record<string, number> = {};
  for (const project of projects) {
    for (const tag of project.tags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  if (sorted.length === 0) return [];

  const maxCount = sorted[0]![1];

  return sorted.map(([label, count]) => ({
    label,
    count,
    pct: Math.round((count / maxCount) * 100),
  }));
}

export function collectPlatforms(projects: Project[]): string[] {
  const seen = new Set<string>();
  for (const p of projects) {
    for (const platform of p.platforms) {
      seen.add(platform);
    }
  }
  return Array.from(seen).sort();
}
