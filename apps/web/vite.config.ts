import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const publicDir = path.resolve(__dirname, "public");
const geojsonPath = path.join(publicDir, "ensemble_map_davao_City.json");

let geojsonHash = "dev";
try {
  const content = readFileSync(geojsonPath);
  geojsonHash = createHash("sha256").update(content).digest("hex").slice(0, 8);
} catch {
  /**/
}

const cacheVersion = `v${Date.now()}`;

export default defineConfig({
  define: {
    __CACHE_VERSION__: JSON.stringify(cacheVersion),
    __GEOJSON_CONTENT_HASH__: JSON.stringify(geojsonHash),
  },
  plugins: [
    tailwindcss(),
    tanstackRouter({}),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        injectionPoint: undefined,
      },
      manifest: {
        name: "floodsense",
        short_name: "floodsense",
        description: "floodsense - PWA Application",
        theme_color: "#0c0c0c",
      },
      pwaAssets: { disabled: false, config: true },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3001,
  },
});
