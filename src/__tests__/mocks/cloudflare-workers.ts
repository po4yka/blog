// Mock for "cloudflare:workers"
// Uses a global variable to survive vi.resetModules()
const globalKey = "__cloudflare_mock_env__" as const;

function getEnv(): Record<string, unknown> {
  return (globalThis as Record<string, unknown>)[globalKey] as Record<string, unknown> ?? {};
}

export const env = new Proxy({} as Record<string, unknown>, {
  get(_target, prop: string) {
    return getEnv()[prop];
  },
});

export function setMockEnv(newEnv: Record<string, unknown>) {
  (globalThis as Record<string, unknown>)[globalKey] = newEnv;
}

export function resetMockEnv() {
  (globalThis as Record<string, unknown>)[globalKey] = {};
}
