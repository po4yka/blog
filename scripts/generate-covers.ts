// Build-time generator: one 1-bit cover per post and language in public/covers/.
// The input is the post's outline (its blocks in reading order), read from the
// MDX source by the blog data generator, so the cover matches blogData.ts.
// The SVG has no fill: the page uses it as a mask, the OG card sets a fill.

import path from "node:path";
import { readBlogPosts } from "./generate-blog-data.js";
import { syncDir } from "./generate-plates.js";
import { COVER_H, COVER_W, coverPixels } from "../src/lib/cover.js";
import { pixelsToSvg } from "../src/lib/dither.js";

export const COVERS_DIR = path.resolve("public/covers");

export function coverInputs(): Array<{ lang: string; slug: string; outline: string }> {
  return readBlogPosts().map((e) => ({ lang: e.lang, slug: e.slug, outline: e.outline }));
}

export function generateCoverFiles(): Map<string, string> {
  const files = new Map<string, string>();
  for (const input of coverInputs()) {
    files.set(`${input.lang}-${input.slug}.svg`, pixelsToSvg(coverPixels(input.outline), COVER_W, COVER_H));
  }
  return files;
}

export const writeCovers = () => syncDir(COVERS_DIR, generateCoverFiles());
