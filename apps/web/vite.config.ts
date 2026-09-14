import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    https: fs.existsSync("../../.local/localhost.pem")
      ? {
          cert: fs.readFileSync("../../.local/localhost.pem"),
          key: fs.readFileSync("../../.local/localhost.key"),
        }
      : undefined,
    proxy: Object.fromEntries(
      ["/api", "/bff", "/conta", "/conta.css", "/connect", "/.well-known"].map(
        (path) => [path, { target: "https://localhost:7443", secure: false }],
      ),
    ),
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
