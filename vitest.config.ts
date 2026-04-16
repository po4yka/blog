import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "cloudflare:workers": path.resolve(__dirname, "./src/__tests__/mocks/cloudflare-workers.ts"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    exclude: ["node_modules", "dist", "e2e", ".claude", ".codex"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/pages/api/**"],
      exclude: [
        "src/lib/webauthn-config.ts",
        "src/pages/api/auth/passkey/**",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 55,
        statements: 70,
      },
    },
  },
});
