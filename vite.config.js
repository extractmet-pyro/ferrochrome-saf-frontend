import { defineConfig } from "vite";

export default defineConfig({
  server: { port: 5173, host: true },
  build: { outDir: "dist", sourcemap: false, chunkSizeWarningLimit: 1200,
    rollupOptions: { output: { manualChunks: { three: ["three"], chart: ["chart.js"] } } } },
});
