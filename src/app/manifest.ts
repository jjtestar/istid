import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Femtekedjan",
    short_name: "Femtekedjan",
    description: "Ditt lag, dina träningar och matcher.",
    lang: "sv",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/pwa/skate-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/skate-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/skate-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
