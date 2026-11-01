/// <reference types="astro/client" />

type D1Database = import("@cloudflare/workers-types").D1Database;

interface CloudflareEnv {
  DB: D1Database;
  ADMIN_PASSWORD: string;
  ALLOW_PASSWORD_LOGIN?: string;
  GITHUB_TOKEN?: string;
  // Admin Telemetry page (src/lib/telemetry.ts); each panel says which one is missing.
  UMAMI_API_TOKEN?: string;
  UMAMI_WEBSITE_ID?: string;
  CLOUDFLARE_ANALYTICS_TOKEN?: string;
  CLOUDFLARE_ZONE_ID?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
}

declare module "cloudflare:workers" {
  const env: CloudflareEnv;
}

declare namespace App {
  interface Locals {
    runtime?: { ctx?: { waitUntil?: (p: Promise<unknown>) => void } };
    nonce?: string;
  }
}