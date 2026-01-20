const CACHE = "color-fall-v1";
const FILES = [
  "./",
  "./index.html",
  "./icon-192.png",
  "./icon-512.png",
  "./manifest.json"
];

self.addEventListener("install", e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k!==CACHE && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e=>{
  e.respondWith(
    caches.match(e.request).then(res=>res || fetch(e.request))
  );
});
