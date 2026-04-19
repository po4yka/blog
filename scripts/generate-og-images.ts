// Build-time generator: renders one OG PNG per blog post to public/og/.
// Runs during the `build` pipeline so the images ship as static assets.
// No Node APIs leak into the Cloudflare Workers runtime this way.

import fs from "node:fs";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

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

const FONT_REGULAR = path.resolve(
  "node_modules/@fontsource/geist-sans/files/geist-sans-latin-400-normal.woff",
);
const FONT_MEDIUM = path.resolve(
  "node_modules/@fontsource/geist-sans/files/geist-sans-latin-500-normal.woff",
);

const OUTPUT_DIR = path.resolve("public/og");
const DEFAULT_OUTPUT = path.resolve("public/og-default.png");

const SATORI_FONTS_CACHE: { regular?: Buffer; medium?: Buffer } = {};

function loadFonts(): { regular: Buffer; medium: Buffer } {
  SATORI_FONTS_CACHE.regular ??= fs.readFileSync(FONT_REGULAR);
  SATORI_FONTS_CACHE.medium ??= fs.readFileSync(FONT_MEDIUM);
  return { regular: SATORI_FONTS_CACHE.regular, medium: SATORI_FONTS_CACHE.medium };
}

function svgToPng(svg: string): Buffer {
  return Buffer.from(new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng());
}

async function renderCard(post: {
  slug: string;
  lang?: string;
  title: string;
  date: string;
}): Promise<Buffer> {
  const { regular: fontRegular, medium: fontMedium } = loadFonts();

  const svg = await satori(
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
                      { type: "span", props: { children: "06 / WRITING" } },
                      { type: "span", props: { children: "po4yka.dev" } },
                    ],
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      fontSize: "64px",
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

  const svg = await satori(
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

  for (const post of posts) {
    const lang = post.lang ?? "en";
    const outFile = path.join(OUTPUT_DIR, `${lang}-${post.slug}.png`);
    const png = await renderCard(post);
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
