// Build-time posters for the hero field: the same heroField output the canvas draws, frame 0, no name
// mask and no pointer, rendered to 1-bit PNGs. CSS paints them through mask-image (ink on transparent), so
// one file serves both themes and, being a mask rather than an <img> or background-image, it is never an LCP candidate.
//
// The canvas draws 2 CSS px cells and spreads the 13 weeks across the layer's width, so one stretched image
// cannot match it. Each poster covers one layout range at 1 px per cell, sized to the largest field in that
// range, and CSS shows it at 2 CSS px per cell (theme.css, .hero-field-poster; keep the media queries there
// in step with this table). A narrower field in the range shows the poster's left part.

import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { heroField, pixelsToSvg, weeklyDensity } from "../src/lib/dither.js";

type Poster = { file: string; width: number; height: number };

/** Field size in cells per viewport range, measured at 2 px cells in both languages (the Russian hero is taller). */
export const POSTERS: readonly Poster[] = [
  { file: "public/field-poster-phone.png", width: 216, height: 760 }, // below 480px: field up to 431 x 1512 px
  { file: "public/field-poster-small.png", width: 360, height: 530 }, // 480 to 767px: up to 719 x 1059 px
  { file: "public/field-poster-tablet.png", width: 472, height: 460 }, // 768 to 1023px: up to 943 x 920 px
  { file: "public/field-poster-desktop.png", width: 572, height: 310 }, // 1024px and up: up to 1144 x 616 px
];
/** DESIGN.md / PLAN section 8 budget, per poster (a visitor loads only the one for their layout). */
export const POSTER_MAX_BYTES = 20 * 1024;

export function generateFieldPoster(counts: readonly number[], { width, height }: Poster): Buffer {
  const pixels = heroField({ weeks: weeklyDensity(counts), width, height, step: 0 });
  const svg = pixelsToSvg(pixels, width, height);
  const png = new Resvg(svg, { fitTo: { mode: "original" } }).render().asPng();
  if (png.length > POSTER_MAX_BYTES) throw new Error(`field poster ${width}x${height} is ${png.length} bytes, over the ${POSTER_MAX_BYTES} byte budget`);
  return png;
}

export function writeFieldPosters(counts: readonly number[]): void {
  for (const poster of POSTERS) {
    const png = generateFieldPoster(counts, poster);
    const file = path.resolve(poster.file);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, png);
    console.log(`Generated ${poster.file} (${png.length} bytes)`);
  }
}

/** The posters that are missing or differ from what `counts` renders. */
export function posterDrift(counts: readonly number[]): string[] {
  return POSTERS.filter((p) => {
    const file = path.resolve(p.file);
    return !fs.existsSync(file) || !fs.readFileSync(file).equals(generateFieldPoster(counts, p));
  }).map((p) => p.file);
}
