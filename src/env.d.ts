/// <reference types="astro/client" />

type D1Database = import("@cloudflare/workers-types").D1Database;

interface CloudflareEnv {
  DB: D1Database;
  ADMIN_PASSWORD: string;
}

declare namespace App {
  interface Locals {
    runtime: {
      env: CloudflareEnv;
    };
  }
}
