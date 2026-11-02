// Security headers for on-demand routes (the admin SPA and /api). public/_headers
// only applies to static assets, so Worker responses get their headers here.
// Prerendered pages are served as static assets and keep the _headers policy.

import type { MiddlewareHandler } from "astro";

// Same as the enforced policy in public/_headers, with a per-request nonce in
// place of 'unsafe-inline' for scripts.
const policy = (nonce: string) =>
  [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

// Same values as the /* block in public/_headers.
const BASELINE_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
};

// Session and admin responses must not be kept by the browser or a shared cache.
const NO_STORE_PREFIXES = ["/api/auth/", "/api/admin/"];

function withSecurityHeaders(response: Response, pathname: string, nonce: string): Response {
  // A Response from fetch() has immutable headers; copy it before setting any.
  let res = response;
  try {
    res.headers.set("X-Content-Type-Options", "nosniff");
  } catch {
    res = new Response(response.body, response);
  }

  for (const [name, value] of Object.entries(BASELINE_HEADERS)) {
    if (!res.headers.has(name)) res.headers.set(name, value);
  }
  if (NO_STORE_PREFIXES.some((p) => pathname.startsWith(p)) && !res.headers.has("Cache-Control")) {
    res.headers.set("Cache-Control", "no-store");
  }
  if (res.headers.get("content-type")?.includes("text/html")) {
    res.headers.set("Content-Security-Policy", policy(nonce));
  }
  return res;
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  // Expose a per-request nonce so components can attach it to inline <script> tags.
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = btoa(String.fromCharCode(...nonceBytes));
  context.locals.nonce = nonce;
  const pathname = context.url?.pathname ?? "";

  let response: Response;
  try {
    response = await next();
  } catch (err) {
    // requireAuth and validateOrigin throw their 401/403 as a Response; Astro would
    // turn an uncaught one into a 500 page, so the client never saw the real status.
    if (err instanceof Response) return withSecurityHeaders(err, pathname, nonce);
    throw err;
  }

  return withSecurityHeaders(response, pathname, nonce);
};
