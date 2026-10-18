const CACHE = "ot-mantenimiento-ops-4-3-8-ot-general-retrasos";
const STATIC = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/admin.html",
  "/admin.js",
  "/pdf-reader.js",
  "/tecnico.html",
  "/tecnico.js",
  "/lake-house-logo.jpg",
  "/pwa.js",
  "/manifest.webmanifest",
  "/icons/icon-source.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(STATIC)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/.netlify/functions/")) return;

  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/index.html")));
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res.ok && url.pathname.startsWith("/")) {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
      }
      return res;
    }))
  );
});
