// service-worker.js
const CACHE_NAME = 'sksarees-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',   // உங்க CSS path-ஐ மாத்துங்க
  '/js/main.js'      // உங்க JS path
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
