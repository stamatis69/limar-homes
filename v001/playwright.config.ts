import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const env = "LIMAR_INVENTORY=fixture LIMAR_DEPLOY_ENV=test ENQUIRY_RATE_LIMIT=20";

/**
 * Acceptance tests run against a production build using the labelled QA fixture
 * (the canonical dataset has no unit schedule yet). Chromium is the preinstalled browser.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 45_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: { executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" },
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, testIgnore: /mobile\.spec/ },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } }, testMatch: /mobile\.spec/ },
  ],
  webServer: {
    command: `${env} npx next build && ${env} npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: true,
    timeout: 300_000,
  },
});
