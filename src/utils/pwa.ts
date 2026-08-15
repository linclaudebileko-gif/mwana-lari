import { getPendingSyncQueue, removePendingSyncItem } from './offlineStorage';

type NetworkStatusCallback = (isOnline: boolean) => void;
type UpdateAvailableCallback = (version: string) => void;

const networkListeners: NetworkStatusCallback[] = [];
let updateAvailableCallback: UpdateAvailableCallback | null = null;
let waitingWorker: ServiceWorker | null = null;

export const CURRENT_APP_VERSION = 'v2.1.0 (+300 mots MBUTA)';

export const registerServiceWorker = async (onUpdate?: (version: string) => void): Promise<void> => {
  if (onUpdate) {
    updateAvailableCallback = onUpdate;
  }

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('⚡ [PWA] Service Worker enregistré avec succès, scope:', registration.scope);

      // Listen for updates on existing registrations
      if (registration.waiting) {
        waitingWorker = registration.waiting;
        console.log('✨ [PWA] Nouvelle mise à jour en attente d\'activation !');
        if (updateAvailableCallback) {
          updateAvailableCallback(CURRENT_APP_VERSION);
        }
      }

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              waitingWorker = installingWorker;
              console.log('✨ [PWA] Nouvelle version de Mwana Lari prête !');
              if (updateAvailableCallback) {
                updateAvailableCallback(CURRENT_APP_VERSION);
              }
            }
          };
        }
      };

      // Periodic check for new updates every 15 minutes
      setInterval(() => {
        registration.update().catch(() => {});
      }, 15 * 60 * 1000);

    } catch (error) {
      console.error('❌ [PWA] Échec d\'enregistrement du Service Worker:', error);
    }

    // Auto reload when new controller takes over
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('🔄 [PWA] Rechargement de l\'application pour appliquer la mise à jour...');
        window.location.reload();
      }
    });
  } else {
    console.warn('⚠️ [PWA] Service Worker non supporté sur ce navigateur');
  }
};

// Manually apply the new service worker update
export const applyAppUpdate = (): void => {
  if (waitingWorker) {
    console.log('🚀 [PWA] Envoi de SKIP_WAITING au Service Worker...');
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  } else if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg && reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        window.location.reload();
      }
    });
  } else {
    window.location.reload();
  }
};

// Check for updates manually on button click
export const checkForAppUpdates = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        if (reg.waiting) {
          waitingWorker = reg.waiting;
          return true;
        }
      }
    } catch (e) {
      console.warn('Erreur lors de la vérification des mises à jour:', e);
    }
  }
  return false;
};

export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
};

export const addNetworkStatusListener = (cb: NetworkStatusCallback): (() => void) => {
  networkListeners.push(cb);
  return () => {
    const idx = networkListeners.indexOf(cb);
    if (idx !== -1) networkListeners.splice(idx, 1);
  };
};

const notifyNetworkListeners = (status: boolean) => {
  networkListeners.forEach((cb) => {
    try {
      cb(status);
    } catch (e) {
      console.error('Erreur listener réseau:', e);
    }
  });
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🟢 [PWA] Connexion Internet rétablie ! Lancement de la synchronisation...');
    notifyNetworkListeners(true);
    syncPendingProgressWithBackend();
  });

  window.addEventListener('offline', () => {
    console.log('🟠 [PWA] Connexion Internet perdue. Mode Hors-ligne actif.');
    notifyNetworkListeners(false);
  });
}

// Background Sync Engine
export const syncPendingProgressWithBackend = async (): Promise<{ synced: number; failed: number }> => {
  if (!isOnline()) {
    console.log('⏸️ [PWA Auto-Sync] Appareil hors-ligne.');
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
      const response = await fetch('/api/v1/progress/submit', {
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
      failed++;
    }
  }

  return { synced, failed };
};
