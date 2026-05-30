import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/__tests__/setup.ts"],
  },
  resolve: {
    alias: {
      src: resolve(__dirname, "src"),
    },
  },
});
