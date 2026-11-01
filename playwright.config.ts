import { defineConfig } from "@playwright/test";

// TEST_PORT selects the local production server; TEST_BASE_URL targets a deployment.
const port = Number(process.env.TEST_PORT || 3000);
const local = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 3,
  // Full-page captures can queue on shared desktop GPUs; individual assertions remain bounded.
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "reports/playwright", open: "never" }],
    ["json", { outputFile: "reports/playwright-results.json" }],
  ],
  outputDir: "reports/test-artifacts",
  use: {
    baseURL: process.env.TEST_BASE_URL || local,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chrome",
      use: {
        browserName: "chromium",
        channel: "chrome",
      },
    },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
    {
      name: "chrome-software",
      testMatch: "scene.spec.ts",
      use: {
        browserName: "chromium",
        channel: "chrome",
        launchOptions: {
          args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
        },
      },
    },
  ],
  webServer: {
    command: `npm run start -- --hostname 127.0.0.1 --port ${port}`,
    url: local,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
