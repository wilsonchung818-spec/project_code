const CACHE_NAME = "school-life-speaking-v1.0.0";

const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=1.0.0",
  "./data.js?v=1.0.0",
  "./app.js?v=1.0.0",
  "./manifest.webmanifest",
  "./assets/icons/icon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/images/scene-reading.png",
  "./assets/images/scene-showing.png",
  "./assets/images/scene-finding.png",
  "./assets/audio/book-word.mp3",
  "./assets/audio/book-chunks.mp3",
  "./assets/audio/book-dialogue-1.mp3",
  "./assets/audio/book-dialogue-2.mp3",
  "./assets/audio/book-dialogue-3.mp3",
  "./assets/audio/book-answer-challenge.mp3"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => Promise.all(APP_SHELL.map(async path => {
      const response = await fetch(path, { cache: "reload" });
      if (!response.ok) throw new Error(`Unable to cache ${path}: ${response.status}`);
      await cache.put(path, response);
    })))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith("school-life-speaking-") && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
          }
          return response;
        })
        .catch(() => caches.match("./index.html").then(cached => cached || caches.match("./")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
