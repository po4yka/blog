import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html"]] : "html",
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", testIgnore: /visual\.spec\.ts/ },
    // Cross-engine coverage for theme, navigation and (later) scroll-timeline and transition specs.
    { name: "webkit", use: { ...devices["Desktop Safari"] }, testMatch: /(theme|navigation)\.spec\.ts/ },
    { name: "firefox", use: { ...devices["Desktop Firefox"] }, testMatch: /(theme|navigation)\.spec\.ts/ },
    // Linux-only screenshot baselines; enabled in the CI `visual` job with VISUAL=1.
    ...(process.env.VISUAL ? [{ name: "visual", testMatch: /visual\.spec\.ts/ }] : []),
  ],
  webServer: {
    command: process.env.CI
      ? "npm run preview -- --ignore-lock"
      : "npm run build && npm run preview -- --ignore-lock",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
