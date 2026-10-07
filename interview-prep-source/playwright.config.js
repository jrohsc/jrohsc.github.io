import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 30000,
  fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:4187", headless: true },
  reporter: "list",
});
