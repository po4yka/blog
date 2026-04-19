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
import { rehypeBlogImageDimensions } from "./scripts/rehype-blog-image-dimensions.mjs";

const isAstroDev = process.argv.includes("dev");

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
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "viewport",
  },
  adapter: cloudflare(isAstroDev ? { platformProxy: { enabled: true } } : {}),
  markdown: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex, rehypeSlug, autolinkConfig],
  },
  integrations: [
    react(),
    mdx({
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [rehypeKatex, rehypeSlug, autolinkConfig, rehypeBlogImageDimensions],
    }),
    sitemap(),
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
