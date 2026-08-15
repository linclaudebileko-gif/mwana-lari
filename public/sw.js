const CACHE_NAME_STATIC = 'mwana-lari-static-v1';
const CACHE_NAME_AUDIO = 'mwana-lari-audio-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/index.js',
  '/manifest.json',
  '/vite.svg',
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap',
  'https://cdn.tailwindcss.com'
];

const AUDIO_ASSETS = [
  '/audio/words/mbote.wav',
  '/audio/words/mama.wav',
  '/audio/words/tata.wav',
  '/audio/words/mwana.wav',
  '/audio/words/nzo.wav',
  '/audio/words/masa.wav',
  '/audio/words/nkulu.wav',
  '/audio/words/nkosi.wav',
  '/audio/words/mosi.wav',
  '/audio/words/zole.wav',
  '/audio/stories/nkosi_na_mbolo.wav',
  '/audio/stories/kongo_dia_ntotila.wav',
  '/audio/stories/nkimba_ya_mwana.wav',
  '/audio/koko/koko_welcome.wav',
  '/audio/koko/koko_bravo.wav',
  '/audio/koko/koko_tryagain.wav'
];

// Installation event: Pre-cache static shell & audio assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation en cours...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME_STATIC).then((cache) => {
        console.log('[Service Worker] Mise en cache du Shell statique...');
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn('[Service Worker] Avertissement pre-cache statique:', err);
        });
      }),
      caches.open(CACHE_NAME_AUDIO).then((cache) => {
        console.log('[Service Worker] Pre-chargement des audios Lari...');
        return cache.addAll(AUDIO_ASSETS).catch((err) => {
          console.warn('[Service Worker] Avertissement pre-cache audio:', err);
        });
      })
    ]).then(() => {
      self.skipWaiting();
    })
  );
});

// Activation event: Clean old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation et nettoyage des anciens caches...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME_STATIC && name !== CACHE_NAME_AUDIO) {
            console.log('[Service Worker] Suppression de l\'ancien cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Cache-First for Audio, Network-First for APIs, Stale-While-Revalidate for Assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Audio Files: Cache-First Strategy
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
            console.warn('[Service Worker] Audio inaccessible hors-ligne:', url.pathname);
            return new Response('', { status: 404, statusText: 'Audio unavailable offline' });
          });
        });
      })
    );
    return;
  }

  // 2. API Requests: Network-First with Cache Fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        return networkResponse;
      }).catch(async () => {
        console.log('[Service Worker] Requête API hors-ligne interceptée:', url.pathname);
        // Serve a graceful offline JSON response
        return new Response(JSON.stringify({
          offline: true,
          message: "Mode hors-ligne actif. Données servies depuis le stockage local.",
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // 3. Static Assets: Stale-While-Revalidate Strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME_STATIC).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If offline and requesting navigation, return cached index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html') || caches.match('/');
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});
