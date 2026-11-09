import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/trips",
    name: "TOUR24 Trips",
    short_name: "TOUR24",
    description: "Your booked tours in one place: payments, documents, the day-by-day plan and support. Works offline.",
    start_url: "/trips?dir=inbound",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f3f2f2",
    theme_color: "#f3f2f2",
    categories: ["travel"],
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Inbound trips", short_name: "Inbound", url: "/trips?dir=inbound" },
      { name: "My trips (outbound)", short_name: "Outbound", url: "/trips?dir=outbound" },
    ],
  };
}
