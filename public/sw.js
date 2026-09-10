const CACHE_NAME_STATIC = 'mwana-lari-static-v3.1';
const CACHE_NAME_AUDIO = 'mwana-lari-audio-v3.1';

// Installation event: Pre-cache core shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker v3.1] Installation...');
  self.skipWaiting();
});

// Skip waiting message handler
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activation event: Clean old caches and claim all clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME_STATIC && name !== CACHE_NAME_AUDIO) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event: Stale-While-Revalidate for Assets, Cache-First for Audio, Network-First for APIs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Audio Files: Passthrough range requests, Cache-First for standard GET
  if (url.pathname.includes('/audio/') || url.pathname.endsWith('.wav') || url.pathname.endsWith('.mp3') || url.pathname.endsWith('.m4a') || url.pathname.endsWith('.ogg')) {
    if (event.request.headers.has('range')) {
      return;
    }

    event.respondWith(
      caches.open(CACHE_NAME_AUDIO).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone()).catch(() => {});
            }
            return networkResponse;
          }).catch(() => {
            return new Response('', { status: 404, statusText: 'Audio indisponible hors-ligne' });
          });
        });
      })
    );
    return;
  }

  // 2. API Requests: Network-First with graceful Offline JSON response
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        return networkResponse;
      }).catch(async () => {
        return new Response(JSON.stringify({
          offline: true,
          message: "Mode hors-ligne actif. Données synchronisées localement.",
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // 3. Static Assets (JS, CSS, Fonts, Images): Stale-While-Revalidate (Instant 0ms from Cache + Background Update)
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.json') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('cdn.tailwindcss.com')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME_STATIC).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone()).catch(() => {});
            }
            return networkResponse;
          }).catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 4. HTML Navigation: Network-First with Cache fallback
  event.respondWith(
    fetch(event.request).then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME_STATIC).then((cache) => {
          cache.put(event.request, responseClone).catch(() => {});
        });
      }
      return networkResponse;
    }).catch(() => {
      return caches.match(event.request).then((cached) => {
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html') || caches.match('./index.html') || caches.match('/');
        }
      });
    })
  );
});
