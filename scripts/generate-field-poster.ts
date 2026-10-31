// Build-time poster for the hero field: the same heroField output the canvas draws, frame 0, no name
// mask and no pointer, rendered to a 1-bit PNG. CSS paints it through mask-image (ink on transparent), so
// one file serves both themes and, being a mask rather than an <img> or background-image, it is never an LCP candidate.

import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { heroField, pixelsToSvg, weeklyDensity } from "../src/lib/dither.js";

export const POSTER_FILE = path.resolve("public/field-poster.png");
export const POSTER_WIDTH = 256;
export const POSTER_HEIGHT = 144;
/** DESIGN.md / PLAN section 8 budget. */
export const POSTER_MAX_BYTES = 20 * 1024;

export function generateFieldPoster(counts: readonly number[]): Buffer {
  const pixels = heroField({ weeks: weeklyDensity(counts), width: POSTER_WIDTH, height: POSTER_HEIGHT, step: 0 });
  const svg = pixelsToSvg(pixels, POSTER_WIDTH, POSTER_HEIGHT);
  const png = new Resvg(svg, { fitTo: { mode: "original" } }).render().asPng();
  if (png.length > POSTER_MAX_BYTES) throw new Error(`field poster is ${png.length} bytes, over the ${POSTER_MAX_BYTES} byte budget`);
  return png;
}

export function writeFieldPoster(counts: readonly number[]): void {
  const png = generateFieldPoster(counts);
  fs.mkdirSync(path.dirname(POSTER_FILE), { recursive: true });
  fs.writeFileSync(POSTER_FILE, png);
  console.log(`Generated ${POSTER_FILE} (${png.length} bytes)`);
}

/** True when the committed poster is missing or differs from what `counts` renders. */
export function posterDrift(counts: readonly number[]): boolean {
  return !fs.existsSync(POSTER_FILE) || !fs.readFileSync(POSTER_FILE).equals(generateFieldPoster(counts));
}
