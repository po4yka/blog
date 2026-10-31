// Build-time generator: renders one OG PNG per blog post to public/og/.
// Runs during the `build` pipeline so the images ship as static assets.
// No Node APIs leak into the Cloudflare Workers runtime this way.

import fs from "node:fs";
import path from "node:path";
import satori, { type SatoriOptions } from "satori";
import { Resvg } from "@resvg/resvg-js";
import { COVER_H, COVER_W, coverPixels } from "../src/lib/cover.js";
import { pixelsToSvg } from "../src/lib/dither.js";
import { coverInputs } from "./generate-covers.js";

// Satori accepts plain VDOM objects `{ type, props }` at runtime, but its
// TypeScript signature uses `ReactNode` which includes `ReactPortal`
// (requiring `children`+`key`). This wrapper restores the intended flexibility
// without scattering `as unknown as ReactNode` at every call site.
function renderSvg(element: unknown, options: SatoriOptions): Promise<string> {
  return satori(element as Parameters<typeof satori>[0], options);
}

// Dynamic import keeps tsx from choking on the @ alias — blogData is TS ESM.
async function loadBlogPosts(): Promise<
  Array<{
    slug: string;
    lang?: string;
    title: string;
    date: string;
  }>
> {
  const mod = await import("../src/data/blogData.ts");
  return mod.blogPosts;
}

// Static Geist TTFs from the `geist` package: Latin and Cyrillic, so RU titles render.
// Satori reads TTF, OTF and WOFF only, not the site's woff2 files.
const FONT_REGULAR = path.resolve("node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf");
const FONT_MEDIUM = path.resolve("node_modules/geist/dist/fonts/geist-sans/Geist-Medium.ttf");

const OUTPUT_DIR = path.resolve("public/og");
const DEFAULT_OUTPUT = path.resolve("public/og-default.png");

/** Section label of a post card: posts belong to the blog index, 07 in the DESIGN.md section number list. */
const OG_WRITING_LABEL = "07 / WRITING";

const SATORI_FONTS_CACHE: { regular?: Buffer; medium?: Buffer } = {};

function loadFonts(): { regular: Buffer; medium: Buffer } {
  SATORI_FONTS_CACHE.regular ??= fs.readFileSync(FONT_REGULAR);
  SATORI_FONTS_CACHE.medium ??= fs.readFileSync(FONT_MEDIUM);
  return { regular: SATORI_FONTS_CACHE.regular, medium: SATORI_FONTS_CACHE.medium };
}

function svgToPng(svg: string): Buffer {
  return Buffer.from(new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng());
}

/** Cover band of the card: 992px wide, the full inner width, in the meta grey. */
const OG_COVER_W = 992;
const OG_COVER_H = Math.round((OG_COVER_W * COVER_H) / COVER_W);

async function renderCard(post: {
  slug: string;
  lang?: string;
  title: string;
  date: string;
}, cover: string | undefined): Promise<Buffer> {
  const { regular: fontRegular, medium: fontMedium } = loadFonts();

  const svg = await renderSvg(
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          width: "1200px",
          height: "630px",
          background: "#0b0b0c",
          color: "#e9e8e4",
          fontFamily: "Geist",
          padding: "48px",
          boxSizing: "border-box",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                border: "1px solid rgba(233,232,228,0.10)",
                borderRadius: "2px",
                padding: "40px 56px",
                boxSizing: "border-box",
                justifyContent: "space-between",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "18px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#a6a6ac",
                      fontWeight: 400,
                    },
                    children: [
                      { type: "span", props: { children: OG_WRITING_LABEL } },
                      { type: "span", props: { children: "po4yka.dev" } },
                    ],
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      fontSize: "56px",
                      lineHeight: "1.1",
                      letterSpacing: "-0.02em",
                      fontWeight: 500,
                      color: "#ffffff",
                      marginTop: "24px",
                      marginBottom: "24px",
                    },
                    children: post.title,
                  },
                },
                ...(cover
                  ? [
                      {
                        type: "img",
                        props: {
                          src: `data:image/svg+xml;base64,${Buffer.from(cover).toString("base64")}`,
                          width: OG_COVER_W,
                          height: OG_COVER_H,
                          style: { display: "flex", marginBottom: "24px" },
                        },
                      },
                    ]
                  : []),
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "22px",
                      color: "#a6a6ac",
                    },
                    children: [
                      { type: "span", props: { children: "@po4yka" } },
                      { type: "span", props: { children: post.date } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Geist", data: fontRegular, weight: 400, style: "normal" },
        { name: "Geist", data: fontMedium, weight: 500, style: "normal" },
      ],
    },
  );

  return svgToPng(svg);
}

async function renderDefaultCard(): Promise<Buffer> {
  const { regular: fontRegular, medium: fontMedium } = loadFonts();

  const svg = await renderSvg(
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          width: "1200px",
          height: "630px",
          background: "#0b0b0c",
          color: "#e9e8e4",
          fontFamily: "Geist",
          padding: "48px",
          boxSizing: "border-box",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                border: "1px solid rgba(233,232,228,0.10)",
                borderRadius: "2px",
                padding: "40px 56px",
                boxSizing: "border-box",
                justifyContent: "space-between",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "18px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#a6a6ac",
                      fontWeight: 400,
                    },
                    children: [
                      { type: "span", props: { children: "00 / HOME" } },
                      { type: "span", props: { children: "po4yka.dev" } },
                    ],
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      marginTop: "24px",
                      marginBottom: "24px",
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            fontSize: "96px",
                            lineHeight: "1.0",
                            letterSpacing: "-0.02em",
                            fontWeight: 500,
                            color: "#ffffff",
                          },
                          children: "Nikita Pochaev",
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            fontSize: "36px",
                            lineHeight: "1.2",
                            letterSpacing: "-0.01em",
                            fontWeight: 400,
                            color: "#d4d3cf",
                            marginTop: "20px",
                          },
                          children: "AI Engineer · Senior Mobile Developer",
                        },
                      },
                    ],
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "22px",
                      color: "#a6a6ac",
                    },
                    children: [
                      { type: "span", props: { children: "@po4yka" } },
                      { type: "span", props: { children: "Android · KMM · ML" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Geist", data: fontRegular, weight: 400, style: "normal" },
        { name: "Geist", data: fontMedium, weight: 500, style: "normal" },
      ],
    },
  );

  return svgToPng(svg);
}

export async function generateOgImages(): Promise<void> {
  const posts = await loadBlogPosts();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const covers = new Map(coverInputs().map((c) => [`${c.lang}-${c.slug}`, c]));
  for (const post of posts) {
    const lang = post.lang ?? "en";
    const outFile = path.join(OUTPUT_DIR, `${lang}-${post.slug}.png`);
    const input = covers.get(`${lang}-${post.slug}`);
    const cover = input && pixelsToSvg(coverPixels(input), COVER_W, COVER_H, "#6f6f75");
    const png = await renderCard(post, cover);
    fs.writeFileSync(outFile, png);
    console.log(`Generated ${outFile}`);
  }

  const defaultPng = await renderDefaultCard();
  fs.writeFileSync(DEFAULT_OUTPUT, defaultPng);
  console.log(`Generated ${DEFAULT_OUTPUT}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateOgImages().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
