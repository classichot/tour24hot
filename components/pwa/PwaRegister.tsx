"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa";

/** Registers the offline service worker in production builds only, so dev HMR is never served from cache. */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (document.readyState === "complete") {
      registerServiceWorker();
      return;
    }
    const onLoad = () => registerServiceWorker();
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
