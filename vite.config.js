import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: [
        "favicon.svg",
        "pwa-192x192.png",
        "pwa-512x512.png",
      ],

      manifest: {
        name: "VGlytics",
        short_name: "VGlytics",

        description:
          "Smart food expense tracking and spending analytics",

        theme_color: "#0f9f9a",
        background_color: "#eef7f7",

        display: "standalone",
        orientation: "portrait",

        start_url: "/",
        scope: "/",

        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },

      workbox: {
        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,woff2}",
        ],
      },

      devOptions: {
        enabled: true,
      },
    }),
  ],
});