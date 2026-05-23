import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@/genealogy-visualization-engine": path.resolve(__dirname, "../packages/genealogy-visualization-engine/src"),
      "@/lib": path.resolve(__dirname, "lib"),
      "@": path.resolve(__dirname, "src"),
    },
  },
});
