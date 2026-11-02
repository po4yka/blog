/**
 * Thin wrapper around the Cloudflare Workers Cache API (.default namespace).
 *
 * The standard DOM CacheStorage type does not expose `.default`; that property
 * is a Cloudflare Workers extension. We access it via a cast to `any` in one
 * place so every API route stays type-clean.
 *
 * Returns undefined in environments where `caches` is not defined (local dev).
 */

function workerCaches(): Cache | undefined {
  if (typeof caches === "undefined") return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (caches as any).default as Cache;
}

export async function cfCacheGet(url: string): Promise<Response | undefined> {
  const cache = workerCaches();
  if (!cache) return undefined;
  const match = await cache.match(new Request(url, { method: "GET" }));
  return match ?? undefined;
}

export async function cfCachePut(url: string, response: Response): Promise<void> {
  const cache = workerCaches();
  if (!cache) return;
  await cache.put(new Request(url, { method: "GET" }), response);
}

/** Seconds a failed upstream call is remembered, so an outage is not retried on every visitor request. */
export const FAILURE_TTL_S = 60;

// A query parameter, not a fragment: the Cache API ignores fragments when it matches keys.
function failureKey(key: string): string {
  const url = new URL(key);
  url.searchParams.set("upstream-failed", "1");
  return url.toString();
}

/**
 * Fetch `url` unless a failure under `cacheKey` was recorded in the last FAILURE_TTL_S seconds.
 * Returns the response when it is OK, else null, and records the failure (an error status or a
 * thrown fetch). Without this, every request during a GitHub outage went upstream with GITHUB_TOKEN.
 */
export async function fetchUpstream(url: string, init: RequestInit, cacheKey: string = url): Promise<Response | null> {
  if (await cfCacheGet(failureKey(cacheKey))) return null;
  let res: Response | null = null;
  try {
    res = await fetch(url, init);
  } catch {
    // Treated as a failure below.
  }
  if (res?.ok) return res;
  // Unread, the error body would hold the connection until garbage collection.
  await res?.body?.cancel();
  await cfCachePut(failureKey(cacheKey), new Response("failed", { headers: { "Cache-Control": `max-age=${FAILURE_TTL_S}` } }));
  return null;
}
