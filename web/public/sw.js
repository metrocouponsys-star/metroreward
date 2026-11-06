// Stamp Service Worker — clean, transparent passthrough
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      // Purge any legacy HTML caches that could mask the marketing site
      return Promise.all(
        keys.filter((k) => k.includes('html') || k.includes('navigation')).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', () => {
  // Passthrough to network
});

