import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

const isAstroDev = process.argv.includes("dev");

export default defineConfig({
  site: "https://po4yka.dev",
  output: "static",
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "viewport",
  },
  adapter: cloudflare(isAstroDev ? { platformProxy: { enabled: true } } : {}),
  integrations: [react(), mdx(), sitemap()],
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
