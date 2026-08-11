import { defineConfig, devices } from "@playwright/test";

// Next 16 allows only one dev server per project dir. If one is already
// running (any port), point the tests at it instead of booting another:
//   PW_BASE_URL=http://localhost:3003 npm run e2e
const PORT = 3117;
const baseURL = process.env.PW_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  retries: 0,
  // both specs drive the same dev server + heavy map page — run them serially
  workers: 1,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PW_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- --port ${PORT}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
        // Force mock mode so the write-flow specs are deterministic and never
        // touch the real backend (no test users/purchases created live).
        env: { NEXT_PUBLIC_API_BASE_URL: "" },
      },
});
