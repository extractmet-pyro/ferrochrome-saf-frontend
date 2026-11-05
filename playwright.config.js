import { defineConfig } from "@playwright/test";
// PW_CHROMIUM lets CI or air-gapped hosts point at an existing Chromium binary instead of `npx playwright install`.
export default defineConfig({
  testDir: "tests/e2e", timeout: 300000,
  use: { baseURL: process.env.FECR_WEB || "http://localhost:4173", viewport: { width: 1600, height: 1000 },
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM, args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] } : {} },
  webServer: process.env.FECR_WEB ? undefined : { command: "npm run preview", port: 4173, reuseExistingServer: true },
});
