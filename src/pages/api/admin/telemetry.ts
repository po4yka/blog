export const prerender = false;

import { env } from "cloudflare:workers";
import { withAdmin } from "@/lib/admin-handler";
import { cfCacheGet, cfCachePut } from "@/lib/cf-cache";
import { jsonError } from "@/lib/validation";
import { collectTelemetry } from "@/lib/telemetry";
import { TELEMETRY_RANGES, type TelemetryRange } from "@/lib/telemetry-types";

const CACHE_TTL_S = 300;
// A section that is unconfigured or failing may be fixed any minute (a new secret, a passing outage).
const CACHE_TTL_DEGRADED_S = 30;

export const GET = withAdmin({ capability: "read:telemetry" }, async ({ request, db }) => {
  const range = new URL(request.url).searchParams.get("range") ?? "7d";
  if (!(TELEMETRY_RANGES as readonly string[]).includes(range)) {
    return jsonError(`range must be one of ${TELEMETRY_RANGES.join(", ")}`, 400);
  }

  // A .invalid host can never be requested, so no public request can match this admin-only entry.
  // The cache keeps upstream API calls to one per range every 5 minutes.
  const cacheKey = `https://admin-telemetry.invalid/${range}`;
  const cached = await cfCacheGet(cacheKey);
  if (cached) return new Response(cached.body, { headers: { "Content-Type": "application/json" } });

  const telemetry = await collectTelemetry(env, db, range as TelemetryRange);
  const body = JSON.stringify(telemetry);
  // Every section, including ones added later: any that is not ok keeps the cache short.
  const degraded = Object.values(telemetry).some((v) => typeof v === "object" && v !== null && "status" in v && v.status !== "ok");
  const ttl = degraded ? CACHE_TTL_DEGRADED_S : CACHE_TTL_S;
  await cfCachePut(
    cacheKey,
    new Response(body, { headers: { "Content-Type": "application/json", "Cache-Control": `max-age=${ttl}` } }),
  );
  return new Response(body, { headers: { "Content-Type": "application/json" } });
});
