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
