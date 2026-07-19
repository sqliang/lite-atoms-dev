import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Platform-owned Vite configuration; generated source may not edit it.
 * `base: "./"` keeps asset URLs relative so the Preview Gateway can serve the
 * immutable build below /preview/{artifactId}/ without rewriting the HTML.
 */
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
});
