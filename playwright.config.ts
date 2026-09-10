import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

const chromePaths = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];
const hasSystemChrome = process.platform === "win32" && chromePaths.some(existsSync);
const databaseUrl = process.env.DATABASE_URL || "postgresql://stkuser:stkpassword@127.0.0.1:5432/stkmotor?schema=public";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: "http://localhost:3100",
    ...(hasSystemChrome ? { channel: "chrome" as const } : {}),
    locale: "fa-IR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next build && node scripts/copy-standalone-assets.mjs && node .next-test/standalone/server.js",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: databaseUrl,
      JWT_SECRET: "test-only-secret-with-at-least-32-characters",
      NEXT_DIST_DIR: ".next-test",
      PORT: "3100",
    },
  },
});
