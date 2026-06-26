import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AVDC POS",
    short_name: "POS",
    description: "Point of Sales System",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#5b5af7",
    icons: [
      {
        src: "/AVDCLogoOnly.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/AVDCLogoOnly.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
