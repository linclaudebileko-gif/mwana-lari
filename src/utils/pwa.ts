import { getPendingSyncQueue, removePendingSyncItem } from './offlineStorage';

type NetworkStatusCallback = (isOnline: boolean) => void;

const listeners: NetworkStatusCallback[] = [];

export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('⚡ [PWA] Service Worker enregistré avec succès, scope:', registration.scope);

      // Check for updates
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('✨ [PWA] Nouvelle version de Mwana Lari disponible !');
            }
          };
        }
      };
    } catch (error) {
      console.error('❌ [PWA] Échec d\'enregistrement du Service Worker:', error);
    }
  } else {
    console.warn('⚠️ [PWA] Service Worker non supporté sur ce navigateur');
  }
};

export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
};

export const addNetworkStatusListener = (cb: NetworkStatusCallback): (() => void) => {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx !== -1) listeners.splice(idx, 1);
  };
};

const notifyListeners = (status: boolean) => {
  listeners.forEach((cb) => {
    try {
      cb(status);
    } catch (e) {
      console.error('Erreur listener réseau:', e);
    }
  });
};

// Setup global network event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🟢 [PWA] Connexion Internet rétablie ! Lancement de la synchronisation...');
    notifyListeners(true);
    syncPendingProgressWithBackend();
  });

  window.addEventListener('offline', () => {
    console.log('🟠 [PWA] Connexion Internet perdue. Bascule en mode 100% Hors-ligne.');
    notifyListeners(false);
  });
}

// Background Sync Engine: Sends queued offline XP / lessons to FastAPI backend
export const syncPendingProgressWithBackend = async (): Promise<{ synced: number; failed: number }> => {
  if (!isOnline()) {
    console.log('⏸️ [PWA Auto-Sync] Impossible de synchroniser : appareil hors-ligne.');
    return { synced: 0, failed: 0 };
  }

  const queue = await getPendingSyncQueue();
  if (queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  console.log(`🔄 [PWA Auto-Sync] Synchronisation de ${queue.length} éléments en attente...`);
  let synced = 0;
  let failed = 0;

  const token = typeof window !== 'undefined' ? localStorage.getItem('mwana_lari_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  for (const item of queue) {
    try {
      const response = await fetch('http://localhost:8000/api/v1/progress/submit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          child_id: item.childId,
          lesson_id: item.lessonId,
          score: item.score,
          xp_earned: item.xpEarned
        })
      });

      if (response.ok) {
        if (item.id !== undefined) {
          await removePendingSyncItem(item.id);
        }
        synced++;
        console.log(`✅ [PWA Auto-Sync] Leçon ${item.lessonId} (+${item.xpEarned} XP) synchronisée !`);
      } else {
        failed++;
      }
    } catch (err) {
      console.warn('⚠️ [PWA Auto-Sync] Erreur réseau lors de la synchro:', err);
      failed++;
    }
  }

  return { synced, failed };
};
