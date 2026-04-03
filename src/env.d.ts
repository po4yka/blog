/// <reference types="astro/client" />

type D1Database = import("@cloudflare/workers-types").D1Database;

interface CloudflareEnv {
  DB: D1Database;
  ADMIN_PASSWORD: string;
  ALLOW_PASSWORD_LOGIN?: string;
}

declare module "cloudflare:workers" {
  const env: CloudflareEnv;
}