import { describe, it, expect } from "vitest";
import { computeBlogStats, aggregateProjectTags, collectPlatforms } from "@/lib/homeStats";
import type { BlogPost, Project } from "@/types";

const makePosts = (overrides: Partial<BlogPost>[] = []): BlogPost[] =>
  overrides.map((o, i) => ({
    slug: `post-${i}`,
    title: `Post ${i}`,
    date: "Apr 2025",
    summary: "test",
    tags: [],
    category: "General",
    content: "word ".repeat(450), // ~2 min read each
    ...o,
  }));

const makeProjects = (overrides: Partial<Project>[] = []): Project[] =>
  overrides.map((o, i) => ({
    id: `proj-${i}`,
    name: `Project ${i}`,
    description: "",
    platforms: [],
    tags: [],
    links: [],
    ...o,
  }));

describe("computeBlogStats", () => {
  it("returns zero stats for empty array", () => {
    const stats = computeBlogStats([]);
    expect(stats.total).toBe(0);
    expect(stats.en).toBe(0);
    expect(stats.ru).toBe(0);
    expect(stats.categories).toBe(0);
    expect(stats.tags).toBe(0);
    expect(stats.totalReadingMinutes).toBe(0);
    expect(stats.latestDate).toBeNull();
  });

  it("counts EN and RU posts correctly", () => {
    const posts = makePosts([
      { lang: "en" },
      { lang: "en" },
      { lang: "ru" },
      {}, // no lang = en
    ]);
    const stats = computeBlogStats(posts);
    expect(stats.total).toBe(4);
    expect(stats.en).toBe(3);
    expect(stats.ru).toBe(1);
  });

  it("counts unique categories from EN posts only", () => {
    const posts = makePosts([
      { lang: "en", category: "Android" },
      { lang: "en", category: "Android" },
      { lang: "en", category: "iOS" },
      { lang: "ru", category: "Android" }, // ru posts excluded from category count
    ]);
    const stats = computeBlogStats(posts);
    expect(stats.categories).toBe(2);
  });

  it("counts unique tags across all posts", () => {
    const posts = makePosts([
      { tags: ["Kotlin", "Android"] },
      { tags: ["Kotlin", "KMP"] },
      { lang: "ru", tags: ["Android", "iOS"] },
    ]);
    const stats = computeBlogStats(posts);
    expect(stats.tags).toBe(4); // Kotlin, Android, KMP, iOS
  });

  it("computes reading time at ~225 wpm", () => {
    const posts = makePosts([
      { content: "word ".repeat(225) }, // exactly 1 min
      { content: "word ".repeat(450) }, // exactly 2 min
    ]);
    const stats = computeBlogStats(posts);
    expect(stats.totalReadingMinutes).toBe(3);
  });

  it("returns the date of the first post as latestDate", () => {
    const posts = makePosts([{ date: "Mar 2026" }, { date: "Jan 2025" }]);
    const stats = computeBlogStats(posts);
    expect(stats.latestDate).toBe("Mar 2026");
  });
});

describe("aggregateProjectTags", () => {
  it("returns empty array for no projects", () => {
    expect(aggregateProjectTags([])).toEqual([]);
  });

  it("returns top N tags sorted by frequency", () => {
    const projects = makeProjects([
      { tags: ["Kotlin", "Android"] },
      { tags: ["Kotlin", "KMP"] },
      { tags: ["Kotlin", "Android", "KMP"] },
    ]);
    const result = aggregateProjectTags(projects, 3);
    expect(result[0]!.label).toBe("Kotlin");
    expect(result[0]!.count).toBe(3);
    expect(result[0]!.pct).toBe(100);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("normalizes pct relative to the top tag", () => {
    const projects = makeProjects([
      { tags: ["A", "B"] },
      { tags: ["A"] },
    ]);
    const result = aggregateProjectTags(projects);
    const a = result.find((r) => r.label === "A")!;
    const b = result.find((r) => r.label === "B")!;
    expect(a.pct).toBe(100);
    expect(b.pct).toBe(50);
  });

  it("respects topN limit", () => {
    const projects = makeProjects([{ tags: ["A", "B", "C", "D", "E"] }]);
    expect(aggregateProjectTags(projects, 3).length).toBe(3);
  });
});

describe("collectPlatforms", () => {
  it("returns empty array for no projects", () => {
    expect(collectPlatforms([])).toEqual([]);
  });

  it("deduplicates and sorts platforms", () => {
    const projects = makeProjects([
      { platforms: ["Android", "iOS"] },
      { platforms: ["Android", "Backend"] },
    ]);
    expect(collectPlatforms(projects)).toEqual(["Android", "Backend", "iOS"]);
  });
});
