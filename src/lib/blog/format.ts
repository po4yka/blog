import type { CSSProperties } from "react";
import type { Locale } from "@/lib/i18n";

/**
 * view-transition-name for a post title: a valid <custom-ident>, and a different name for every slug.
 * Letters, digits and "-" pass through; every other code point (including "_") becomes `_<hex>_`, so no two slugs collide.
 */
export function postTitleTransitionName(slug: string): string {
  return `post-title-${slug.replace(/[^a-zA-Z0-9-]/gu, (c) => `_${c.codePointAt(0)!.toString(16)}_`)}`;
}

/** Inline style that lets the list title and the post title morph into each other. The cast is needed because React's CSSProperties lacks `viewTransitionClass`. */
export function postTitleStyle(slug: string): CSSProperties {
  return { viewTransitionName: postTitleTransitionName(slug), viewTransitionClass: "post-title" } as CSSProperties;
}

/** Reading time in minutes from the rendered body text (220 words per minute, at least 1). */
export function countReadingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

/** Format "2026-04-01" -> "Apr 2026". Malformed input is returned unchanged. */
export function formatIsoDate(iso: string): string {
  const parts = iso.split("-");
  if (parts.length < 2) return iso;
  const year = parts[0];
  const monthNum = parseInt(parts[1] ?? "", 10);
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  if (!Number.isFinite(monthNum) || monthNum < 1 || monthNum > 12) return iso;
  return `${monthNames[monthNum - 1]} ${year}`;
}

export function markdownUrl(slug: string, lang: Locale): string {
  return lang === "ru" ? `/blog/ru/${slug}.md` : `/blog/${slug}.md`;
}

/** Machine-readable twins of a post: markdown, RSS, llms-full.txt. */
export function alsoAsLinks(slug: string, lang: Locale): { label: string; href: string }[] {
  return [
    { label: "markdown", href: markdownUrl(slug, lang) },
    { label: "rss", href: lang === "ru" ? "/rss.ru.xml" : "/rss.xml" },
    { label: "llms-full.txt", href: "/llms-full.txt" },
  ];
}

export function isUpdated(post: { isoDate?: string; isoDateModified?: string }): boolean {
  return !!post.isoDateModified && post.isoDateModified !== post.isoDate;
}

/** Related posts are shown only when there are at least two, capped at three. */
export function pickRelated<T>(related: T[] | undefined): T[] {
  const list = related ?? [];
  return list.length >= 2 ? list.slice(0, 3) : [];
}
