import { describe, expect, it, vi } from "vitest";
import { ApiError, adminFetch, onUnauthorized } from "@/admin/api";

const storage = new Map<string, string>();
vi.stubGlobal("sessionStorage", {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => void storage.set(k, v),
  removeItem: (k: string) => void storage.delete(k),
});

describe("adminFetch on 401", () => {
  it("clears the auth flag and tells the listeners, so the admin returns to sign-in", async () => {
    storage.set("admin_authenticated", "1");
    vi.stubGlobal("fetch", vi.fn(async () => new Response('{"error":"Unauthorized"}', { status: 401 })));
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);

    await expect(adminFetch("posts")).rejects.toMatchObject({ status: 401 } satisfies Partial<ApiError>);
    expect(listener).toHaveBeenCalledOnce();
    expect(storage.has("admin_authenticated")).toBe(false);

    unsubscribe();
    await expect(adminFetch("posts")).rejects.toBeInstanceOf(ApiError);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("does not tell the listeners about other errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("down", { status: 503 })));
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);
    await expect(adminFetch("posts")).rejects.toMatchObject({ status: 503 });
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});
