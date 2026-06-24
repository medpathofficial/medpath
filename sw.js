/* ═══════════════════════════════════════════
   MEDPATH — SERVICE WORKER
   Version: 1.0
   Handles: Caching, Offline support, Update detection
   Scope: /medpath/
═══════════════════════════════════════════ */

const CACHE_NAME = 'medpath-v1';

const CORE_FILES = [
  '/medpath/',
  '/medpath/index.html',
  '/medpath/app.css',
  '/medpath/manifest.json',
  '/medpath/curriculum.js',
  '/medpath/dataService.js',
  '/medpath/engines.js',
  '/medpath/ui.js',
  '/medpath/app.js'
];


/* ═══════════════════════════════════════════
   INSTALL — Cache all core files
═══════════════════════════════════════════ */

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(CORE_FILES);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});


/* ═══════════════════════════════════════════
   ACTIVATE — Clean up old caches
═══════════════════════════════════════════ */

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function(name) {
              return name !== CACHE_NAME;
            })
            .map(function(name) {
              return caches.delete(name);
            })
        );
      })
      .then(function() {
        return self.clients.claim();
      })
  );
});


/* ═══════════════════════════════════════════
   FETCH — Network first, cache fallback
   Google Fonts: cache first (they rarely change)
   Everything else: network first
═══════════════════════════════════════════ */

self.addEventListener('fetch', function(event) {

  const url = new URL(event.request.url);

  /* Google Fonts — cache first */
  if (url.hostname === 'fonts.googleapis.com' ||
      url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(event.request)
        .then(function(cached) {
          if (cached) return cached;
          return fetch(event.request)
            .then(function(response) {
              const clone = response.clone();
              caches.open(CACHE_NAME)
                .then(function(cache) {
                  cache.put(event.request, clone);
                });
              return response;
            });
        })
    );
    return;
  }

  /* MedPath files — network first, cache fallback */
  if (url.pathname.startsWith('/medpath/')) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          const clone = response.clone();
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, clone);
            });
          return response;
        })
        .catch(function() {
          return caches.match(event.request)
            .then(function(cached) {
              if (cached) return cached;
              return caches.match('/medpath/index.html');
            });
        })
    );
    return;
  }

});


/* ═══════════════════════════════════════════
   MESSAGE — Handle update signal from app
═══════════════════════════════════════════ */

self.addEventListener('message', function(event) {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
