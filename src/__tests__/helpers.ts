import { vi } from "vitest";
import { setMockEnv } from "./mocks/cloudflare-workers";

/**
 * D1 mock for read operations (uses .first() for single results).
 * Exposes bind, run, and first as vi.fn() for assertions.
 */
export function createMockDb() {
  const run = vi.fn().mockResolvedValue({ success: true, results: [] });
  const first = vi.fn();
  const bind = vi.fn().mockReturnValue({ run, first });
  const prepare = vi.fn().mockReturnValue({ run, bind });

  const batch = vi.fn().mockResolvedValue([]);

  return { prepare, bind, run, first, batch } as unknown as D1Database & {
    bind: ReturnType<typeof vi.fn>;
    run: ReturnType<typeof vi.fn>;
    first: ReturnType<typeof vi.fn>;
    batch: ReturnType<typeof vi.fn>;
  };
}

/**
 * D1 mock for write operations (uses .run() after bind).
 * Exposes _run and _bind as vi.fn() for assertions.
 */
export function createWriteMockDb() {
  const run = vi.fn().mockResolvedValue({ success: true });
  const bind = vi.fn();
  bind.mockReturnValue({ run });
  const prepare = vi.fn().mockReturnValue({ bind });
  return { prepare, _run: run, _bind: bind } as unknown as D1Database & {
    _run: ReturnType<typeof vi.fn>;
    _bind: ReturnType<typeof vi.fn>;
  };
}

/**
 * Astro APIContext factory for API route testing.
 */
export function createApiContext(options: {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  db?: D1Database;
  adminPassword?: string;
}) {
  const {
    method = "GET",
    body,
    headers = {},
    params = {},
    db,
    adminPassword = "test-password",
  } = options;

  const mockDb = db ?? createMockDb();

  // Set the cloudflare:workers mock env
  setMockEnv({ DB: mockDb, ADMIN_PASSWORD: adminPassword, ALLOW_PASSWORD_LOGIN: "true" });

  // Mutations require Origin or X-Requested-With for CSRF protection
  const mutationHeaders: Record<string, string> =
    method !== "GET" && method !== "HEAD" && !headers["Origin"]
      ? { Origin: "http://localhost:4321" }
      : {};

  const requestInit: RequestInit = { method, headers: { ...mutationHeaders, ...headers } };
  if (body) {
    requestInit.body = JSON.stringify(body);
    requestInit.headers = { ...mutationHeaders, ...headers, "Content-Type": "application/json" };
  }

  const request = new Request("http://localhost/api/test", requestInit);

  return {
    request,
    params,
  } as unknown as import("astro").APIContext;
}

/**
 * Context with valid auth token (mocks the session check to pass).
 * The db must have a `.first` mock (use createMockDb()).
 */
export function createAuthenticatedContext(
  options: Omit<Parameters<typeof createApiContext>[0], "headers"> & {
    db: D1Database & { first: ReturnType<typeof vi.fn> };
  },
) {
  const token = "valid-test-token";
  // Mock the session lookup to return a valid session
  options.db.first.mockResolvedValueOnce({ token });

  return createApiContext({
    ...options,
    headers: { Authorization: `Bearer ${token}` },
  });
}
