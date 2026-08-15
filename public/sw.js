const CACHE_NAME_STATIC = 'mwana-lari-static-v2.1';
const CACHE_NAME_AUDIO = 'mwana-lari-audio-v2.1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/index.js',
  '/manifest.json',
  '/vite.svg',
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap',
  'https://cdn.tailwindcss.com'
];

// Installation event: Pre-cache static shell & audio assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker v2.1] Nouvelle version détectée, installation...');
  event.waitUntil(
    caches.open(CACHE_NAME_STATIC).then((cache) => {
      console.log('[Service Worker] Mise en cache du Shell statique...');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Service Worker] Avertissement pre-cache statique:', err);
      });
    })
  );
});

// Skip waiting message handler
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Activation immédiate de la mise à jour...');
    self.skipWaiting();
  }
});

// Activation event: Clean old caches and claim all clients
self.addEventListener('activate', (event) => {
  console.log('[Service Worker v2.1] Activation et suppression des anciens caches...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME_STATIC && name !== CACHE_NAME_AUDIO) {
            console.log('[Service Worker] Suppression de l\'ancien cache obsolète:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker v2.1] Prise de contrôle de tous les clients connectés.');
      return self.clients.claim();
    })
  );
});

// Fetch event: Cache-First for Audio, Network-First for APIs, Stale-While-Revalidate for Assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Audio Files: Cache-First Strategy with runtime caching
  if (url.pathname.startsWith('/audio/') || url.pathname.endsWith('.wav') || url.pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.open(CACHE_NAME_AUDIO).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            return new Response('', { status: 404, statusText: 'Audio unavailable offline' });
          });
        });
      })
    );
    return;
  }

  // 2. API Requests: Network-First with graceful Offline JSON response
  if (url.pathname.startsWith('/api/')) {
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

  // 3. Static Assets & Pages: Network-First with Cache fallback for latest updates
  event.respondWith(
    fetch(event.request).then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME_STATIC).then((cache) => {
          cache.put(event.request, responseClone);
        });
      }
      return networkResponse;
    }).catch(() => {
      return caches.match(event.request).then((cached) => {
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html') || caches.match('/');
        }
      });
    })
  );
});
