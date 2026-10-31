// Build-time generator: one 1-bit cover per post and language in public/covers/.
// The inputs (slug, word count, heading depths, publish date) come from the MDX
// source through the blog data generator, so the cover matches blogData.ts.
// The SVG has no fill: the page uses it as a mask, the OG card sets a fill.

import path from "node:path";
import { readBlogPosts } from "./generate-blog-data.js";
import { syncDir } from "./generate-plates.js";
import { COVER_H, COVER_W, coverPixels, type CoverInput } from "../src/lib/cover.js";
import { pixelsToSvg } from "../src/lib/dither.js";

export const COVERS_DIR = path.resolve("public/covers");

export function coverInputs(): Array<CoverInput & { lang: string }> {
  return readBlogPosts().map((e) => ({
    lang: e.lang,
    slug: e.slug,
    wordCount: e.wordCount,
    headings: e.headings,
    isoDate: e.isoDate,
  }));
}

export function generateCoverFiles(): Map<string, string> {
  const files = new Map<string, string>();
  for (const input of coverInputs()) {
    files.set(`${input.lang}-${input.slug}.svg`, pixelsToSvg(coverPixels(input), COVER_W, COVER_H));
  }
  return files;
}

export const writeCovers = () => syncDir(COVERS_DIR, generateCoverFiles());
