// IndexNow submission script — POSTs the site's URL list to Bing/Yandex.
// Run via: node scripts/indexnow-submit.mjs
// Or:      npm run indexnow
// Does NOT run automatically on build to avoid spurious pings.

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

const HOST = "po4yka.dev";
const KEY = "0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const FALLBACK_URLS = [
  `https://${HOST}/`,
  `https://${HOST}/blog`,
  `https://${HOST}/projects`,
  `https://${HOST}/experience`,
  `https://${HOST}/contact`,
  `https://${HOST}/blog/ru`,
  `https://${HOST}/about`,
];

function extractUrlsFromSitemap(xml) {
  const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
  return Array.from(matches, (m) => m[1].trim()).filter(
    (url) => !url.includes("/admin/"),
  );
}

function loadUrlList() {
  const sitemapPath = resolve(rootDir, "dist", "sitemap-0.xml");
  if (existsSync(sitemapPath)) {
    try {
      const xml = readFileSync(sitemapPath, "utf-8");
      const urls = extractUrlsFromSitemap(xml);
      if (urls.length > 0) {
        console.log(`Loaded ${urls.length} URLs from dist/sitemap-0.xml`);
        return urls;
      }
    } catch (err) {
      console.warn(`Could not parse sitemap: ${err.message}`);
    }
  }
  console.log("Sitemap not found — using hardcoded fallback URL list");
  return FALLBACK_URLS;
}

async function submit() {
  const urlList = loadUrlList();

  const body = JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  });

  console.log(`Submitting ${urlList.length} URLs to IndexNow…`);

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body,
  });

  console.log(`IndexNow response: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    if (text) console.error("Response body:", text);
    process.exit(1);
  }
}

submit().catch((err) => {
  console.error("IndexNow submission failed:", err);
  process.exit(1);
});
