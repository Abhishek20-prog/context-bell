// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

export default defineConfig({
  vite: {
    // Server-only secrets are intentionally not exposed as VITE_* variables.
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(
        loadEnv("", process.cwd(), "")["GEMINI_API_KEY"] || loadEnv("", process.cwd(), "")["LOVABLE_API_KEY"],
      ),
      "process.env.LOVABLE_API_KEY": JSON.stringify(
        loadEnv("", process.cwd(), "")["GEMINI_API_KEY"] || loadEnv("", process.cwd(), "")["LOVABLE_API_KEY"],
      ),
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
