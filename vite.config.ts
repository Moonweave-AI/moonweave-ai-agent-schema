import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { currentCommitSha } from "./scripts/lib/site-build-metadata.mjs";

const buildCommitSha = currentCommitSha(import.meta.dirname);

export default defineConfig({
  base: "./",
  define: {
    __MOONWEAVE_BUILD_COMMIT_SHA__: JSON.stringify(buildCommitSha),
  },
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173
  }
});
