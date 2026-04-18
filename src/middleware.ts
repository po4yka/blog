// Server-side pageview fallback for visitors whose browsers strip or block
// the Umami tracker before it runs. On HTML responses that are NOT from a
// client that already executed /m.js (no `_us=1` cookie) and NOT from a
// known bot, fire a tagged pageview to Umami from the Cloudflare Worker.
// The client-side tracker tags its events with no tag; server-side events
// are tagged `edge`, so the two streams can be distinguished in Umami.

import type { MiddlewareHandler } from "astro";

const UMAMI_COLLECT = "https://analytics.po4yka.dev/api/send";
const UMAMI_WEBSITE_ID = "00b2d486-bc06-431f-b5cf-80dce36ab698";

const BOT_UA =
  /bot|crawler|spider|crawling|facebookexternalhit|slackbot|linkedinbot|whatsapp|telegrambot|twitterbot|preview|prerender|headlesschrome|lighthouse/i;

type RuntimeLocals = {
  runtime?: { ctx?: { waitUntil?: (p: Promise<unknown>) => void } };
};

export const onRequest: MiddlewareHandler = async (context, next) => {
  const response = await next();

  if (!import.meta.env.PROD) return response;

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  const req = context.request;
  const url = new URL(req.url);

  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return response;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return response;

  const cookie = req.headers.get("cookie") || "";
  if (cookie.includes("_us=1")) return response;

  const ua = req.headers.get("user-agent") || "";
  if (!ua || BOT_UA.test(ua)) return response;

  const ip =
    req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "";
  const acceptLang = req.headers.get("accept-language")?.split(",")[0]?.trim() || "en";

  const beacon = fetch(UMAMI_COLLECT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": ua,
      ...(ip ? { "x-forwarded-for": ip } : {}),
    },
    body: JSON.stringify({
      type: "event",
      payload: {
        website: UMAMI_WEBSITE_ID,
        hostname: url.hostname,
        screen: "",
        language: acceptLang,
        title: "",
        url: url.pathname + url.search,
        referrer: req.headers.get("referer") || "",
        tag: "edge",
      },
    }),
  }).catch(() => { /* fire-and-forget */ });

  const runtime = (context.locals as RuntimeLocals).runtime;
  runtime?.ctx?.waitUntil?.(beacon);

  return response;
};
