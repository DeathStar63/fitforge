const CACHE_VERSION = "v2";
const STATIC_CACHE = `fitforge-static-${CACHE_VERSION}`;
const GIF_CACHE = `fitforge-gifs-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `fitforge-dynamic-${CACHE_VERSION}`;
const OFFLINE_URL = "/";

// App shell files to pre-cache
const APP_SHELL = [
  OFFLINE_URL,
  "/manifest.json",
];

// Install — cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  const currentCaches = [STATIC_CACHE, GIF_CACHE, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !currentCaches.includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — strategy depends on request type
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Exercise GIFs from exercisedb — cache-first (they never change)
  if (url.hostname === "static.exercisedb.dev") {
    event.respondWith(
      caches.open(GIF_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // API calls (Supabase, Gemini) — network-first, no cache fallback
  if (
    url.hostname.includes("supabase") ||
    url.hostname.includes("googleapis") ||
    url.hostname.includes("generativelanguage")
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets (JS, CSS, fonts, images) — stale-while-revalidate
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    request.destination === "image" ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => cached);

          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Navigation — network-first, fallback to cached shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Everything else — network with dynamic cache fallback
  event.respondWith(
    caches.open(DYNAMIC_CACHE).then((cache) =>
      fetch(request)
        .then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cache.match(request))
    )
  );
});
