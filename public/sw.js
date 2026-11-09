/* TOUR24 Trips service worker — keeps booked trips readable offline.
 * Pages and data: network first, cached copy when offline.
 * Build assets (/_next/static, icons): cache first — their URLs change on every deploy.
 * Bump VERSION to drop every old cache on the next activation. */
const VERSION = "t24-trips-v1";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const START = ["/trips?dir=inbound", "/trips?dir=outbound", "/manifest.webmanifest"];
const FALLBACK = "/trips?dir=inbound";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.addAll(START))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isStatic(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/pwa-icon/") ||
    url.pathname.startsWith("/apple-icon") ||
    /\.(?:css|js|woff2?|ttf|png|jpe?g|webp|avif|svg|ico)$/.test(url.pathname)
  );
}

function skip(url) {
  return url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname === "/sw.js";
}

// The page posts the files it already loaded before this worker took control.
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "warm" || !Array.isArray(data.urls)) return;
  event.waitUntil(warm(data.urls));
});

async function warm(urls) {
  const [stat, pages] = await Promise.all([caches.open(STATIC), caches.open(PAGES)]);
  await Promise.all(
    urls.map(async (raw) => {
      try {
        const url = new URL(raw, self.location.origin);
        if (skip(url)) return;
        const cache = isStatic(url) ? stat : pages;
        if (await cache.match(url.href)) return;
        const res = await fetch(url.href, { credentials: "same-origin" });
        if (res.ok) await cache.put(url.href, res);
      } catch {
        /* one missing file must not stop the rest */
      }
    })
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (skip(url)) return;
  event.respondWith(isStatic(url) ? cacheFirst(req) : networkFirst(req));
});

async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) {
    const cache = await caches.open(STATIC);
    cache.put(req, res.clone());
  }
  return res;
}

async function networkFirst(req) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreVary: true });
    if (hit) return hit;
    if (req.mode === "navigate") {
      const fallback = await cache.match(FALLBACK, { ignoreVary: true });
      if (fallback) return fallback;
    }
    throw err;
  }
}
