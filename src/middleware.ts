// Content-Security-Policy for on-demand routes (the admin SPA). public/_headers
// only applies to static assets, so Worker responses get their policy here.
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

export const onRequest: MiddlewareHandler = async (context, next) => {
  // Expose a per-request nonce so components can attach it to inline <script> tags.
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = btoa(String.fromCharCode(...nonceBytes));
  context.locals.nonce = nonce;

  let response: Response;
  try {
    response = await next();
  } catch (err) {
    // requireAuth and validateOrigin throw their 401/403 as a Response; Astro would
    // turn an uncaught one into a 500 page, so the client never saw the real status.
    if (err instanceof Response) return err;
    throw err;
  }

  if (response.headers.get("content-type")?.includes("text/html")) {
    response.headers.set("Content-Security-Policy", policy(nonce));
  }

  return response;
};
