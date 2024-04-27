import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  // Configuration for GitHub Pages
  // based on: https://dev.to/lexlohr/deploy-a-solid-start-app-on-github-pages-2l2l
  ssr: true,
  server: {
    baseURL: process.env.BASE_PATH,
    preset: "static",
  },
});
