const CACHE_NAME = "tallessa-cache-v3";

const APP_SHELL_URLS = [
  "./",
  "./index.html",
  "./styles.css",
  "./styles.css?v=20260522-iphone-safe-area",
  "./app.js",
  "./app.js?v=20260522-modules",
  "./auth.js",
  "./calendar.js",
  "./memories.js",
  "./storage.js",
  "./ui.js",
  "./manifest.webmanifest",
  "./apple-touch-icon.png",
  "./supabase-config.js",
  "./supabase-config.js?v=20260521-supabase-video",
  "./assets/selector-background.png",
  "./assets/memorial-day-sunny-field.jpg",
];

const CACHEABLE_ASSET_PATHS = new Set(
  APP_SHELL_URLS.map((url) => new URL(url, self.registration.scope).pathname),
);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith("tallessa-cache-") && cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (CACHEABLE_ASSET_PATHS.has(url.pathname)) {
    event.respondWith(cacheFirstAsset(request));
  }
});

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put("./index.html", response.clone());
    }
    return response;
  } catch {
    return (await caches.match("./index.html")) || Response.error();
  }
}

async function cacheFirstAsset(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}
