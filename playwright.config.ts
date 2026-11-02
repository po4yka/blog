import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // One worker per vCPU of the GitHub-hosted runner for public repositories. Files run in parallel;
  // tests inside a file stay in order (fullyParallel: false).
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? [["github"], ["html"]] : "html",
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", testIgnore: /visual\.spec\.ts/ },
    // Cross-engine coverage for theme, navigation, Reveal and (later) scroll-timeline and transition specs.
    // WebKit and Firefox render in software on the Linux runner. With four workers on four vCPUs a
    // view-transition navigation or theme wipe there can take longer than the default 5 s expect timeout.
    { name: "webkit", use: { ...devices["Desktop Safari"] }, testMatch: /(theme|navigation|reveal)\.spec\.ts/, expect: { timeout: 15_000 } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] }, testMatch: /(theme|navigation|reveal)\.spec\.ts/, expect: { timeout: 15_000 } },
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
