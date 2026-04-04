export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { deleteSession, makeClearCookie, validateOrigin } from "@/lib/auth";

export const POST: APIRoute = async ({ request }) => {
  validateOrigin(request);

  // Extract token from cookie or Bearer header
  let token: string | null = null;
  const cookies = request.headers.get("Cookie") ?? "";
  const match = cookies.match(/__session=([^;]+)/);
  if (match?.[1]) token = match[1];
  if (!token) {
    const header = request.headers.get("Authorization");
    if (header?.startsWith("Bearer ")) token = header.slice(7);
  }

  if (token) {
    const db = env.DB;
    await deleteSession(db, token);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": makeClearCookie(),
    },
  });
};
