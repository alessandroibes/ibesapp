import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "https://localhost:7443",
    ignoreHTTPSErrors: true,
  },
  reporter: "list",
});
