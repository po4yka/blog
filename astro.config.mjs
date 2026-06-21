import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { blogPosts } from "./src/data/blogData.ts";

const isAstroDev = process.argv.includes("dev");

const BUILD_TIMESTAMP = new Date().toISOString();

const postLastmod = new Map(
  blogPosts
    .filter((p) => p.isoDate)
    .flatMap((p) => {
      const base = "https://po4yka.dev/blog";
      const date = p.isoDate;
      return p.lang === "ru"
        ? [[`${base}/ru/${p.slug}`, date]]
        : [[`${base}/${p.slug}`, date]];
    }),
);

const autolinkConfig = [
  rehypeAutolinkHeadings,
  {
    behavior: "append",
    properties: { className: ["heading-anchor"], "aria-label": "Permalink to this section" },
    content: {
      type: "element",
      tagName: "span",
      properties: { "aria-hidden": "true" },
      children: [{ type: "text", value: "#" }],
    },
  },
];

export default defineConfig({
  site: "https://po4yka.dev",
  output: "static",
  trailingSlash: "never",
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "viewport",
  },
  adapter: cloudflare(
    isAstroDev
      ? { platformProxy: { enabled: true }, imageService: "compile" }
      : { imageService: "compile" },
  ),
  image: {
    service: { entrypoint: "astro/assets/services/sharp" },
  },
  markdown: {
    // Monochrome paper/ink design: code blocks are styled entirely by the
    // --code-bg / --foreground theme tokens (correct in both light and dark).
    // Shiki's default github-dark theme injected an inline dark background on
    // <pre>, which overrode --code-bg and left dark text on a dark block in
    // light mode. Disable it so the design tokens stay authoritative.
    syntaxHighlight: false,
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex, rehypeSlug, autolinkConfig],
  },
  integrations: [
    react(),
    mdx({
      syntaxHighlight: false,
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [rehypeKatex, rehypeSlug, autolinkConfig],
    }),
    sitemap({
      filter: (page) => !page.includes("/admin/"),
      serialize(item) {
        const known = postLastmod.get(item.url.replace(/\/$/, ""));
        item.lastmod = known ?? BUILD_TIMESTAMP;
        return item;
      },
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en-US",
          ru: "ru-RU",
        },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    assetsInclude: ["**/*.svg", "**/*.csv"],
  },
});
