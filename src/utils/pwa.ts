import { getPendingSyncQueue, removePendingSyncItem } from './offlineStorage';
import { getCsrfToken, API_BASE_URL } from '../services/api';

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

  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  for (const item of queue) {
    try {
      const response = await fetch(`${API_BASE_URL}/progress/submit`, {
        method: 'POST',
        credentials: 'include',
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

// ----------------------------------------------------
// PWA Installation & Prompt Management
// ----------------------------------------------------
let deferredInstallPrompt: any = null;
const installListeners: Array<(canInstall: boolean) => void> = [];

export const isPwaInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isNavigatorStandalone = (window.navigator as any).standalone === true;
  return isStandalone || isNavigatorStandalone;
};

export const isIosDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
};

export const isIosSafari = (): boolean => {
  if (!isIosDevice()) return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes('safari') && !ua.includes('crios') && !ua.includes('fxios');
};

export const addInstallPromptListener = (cb: (canInstall: boolean) => void): (() => void) => {
  installListeners.push(cb);
  // Send immediate state if prompt already caught
  cb(!!deferredInstallPrompt);
  return () => {
    const idx = installListeners.indexOf(cb);
    if (idx !== -1) installListeners.splice(idx, 1);
  };
};

const notifyInstallListeners = (canInstall: boolean) => {
  installListeners.forEach((cb) => {
    try {
      cb(canInstall);
    } catch (e) {
      console.error('Erreur install listener:', e);
    }
  });
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    console.log('📲 [PWA] Événement beforeinstallprompt intercepté !');
    notifyInstallListeners(true);
  });

  window.addEventListener('appinstalled', () => {
    console.log('🎉 [PWA] Application Mwana Lari installée avec succès !');
    deferredInstallPrompt = null;
    notifyInstallListeners(false);
    localStorage.setItem('mwana_lari_pwa_installed', 'true');
  });
}

export const canPromptPwaInstall = (): boolean => {
  return !!deferredInstallPrompt;
};

export const promptPwaInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
  if (!deferredInstallPrompt) {
    return 'unavailable';
  }

  try {
    deferredInstallPrompt.prompt();
    const choiceResult = await deferredInstallPrompt.userChoice;
    console.log('📲 [PWA] Choix d\'installation de l\'utilisateur:', choiceResult.outcome);
    if (choiceResult.outcome === 'accepted') {
      deferredInstallPrompt = null;
      notifyInstallListeners(false);
      return 'accepted';
    } else {
      return 'dismissed';
    }
  } catch (err) {
    console.warn('⚠️ [PWA] Erreur lors du prompt d\'installation:', err);
    return 'unavailable';
  }
};

const DISMISS_PWA_KEY = 'mwana_lari_pwa_install_dismissed_until';

export const isPwaInstallDismissed = (): boolean => {
  if (typeof window === 'undefined') return false;
  const dismissedUntil = localStorage.getItem(DISMISS_PWA_KEY);
  if (!dismissedUntil) return false;
  return Date.now() < parseInt(dismissedUntil, 10);
};

export const dismissPwaInstall = (days: number = 7): void => {
  if (typeof window === 'undefined') return;
  const expireAt = Date.now() + days * 24 * 60 * 60 * 1000;
  localStorage.setItem(DISMISS_PWA_KEY, expireAt.toString());
};

