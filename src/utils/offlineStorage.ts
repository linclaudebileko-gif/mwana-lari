import { LariWord, CulturalStory, PedagogicalUnit } from '../types';

const DB_NAME = 'MwanaLariOfflineDB';
const DB_VERSION = 1;

export interface PendingSyncItem {
  id?: number;
  childId: string;
  lessonId: string;
  score: number;
  xpEarned: number;
  timestamp: string;
}

let dbInstance: IDBDatabase | null = null;

export const initOfflineDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      return resolve(dbInstance);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('words')) {
        db.createObjectStore('words', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('stories')) {
        db.createObjectStore('stories', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('lessons')) {
        db.createObjectStore('lessons', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('pending_sync')) {
        db.createObjectStore('pending_sync', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('user_state')) {
        db.createObjectStore('user_state', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('📦 [IndexedDB] Base de données locale initialisée avec succès');
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('❌ [IndexedDB] Erreur d\'ouverture de la base:', request.error);
      reject(request.error);
    };
  });
};

// 1. Words Store
export const saveOfflineWords = async (words: LariWord[]): Promise<void> => {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('words', 'readwrite');
    const store = tx.objectStore('words');
    words.forEach((w) => store.put(w));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getOfflineWords = async (): Promise<LariWord[]> => {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('words', 'readonly');
    const store = tx.objectStore('words');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

// 2. Stories Store
export const saveOfflineStories = async (stories: CulturalStory[]): Promise<void> => {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('stories', 'readwrite');
    const store = tx.objectStore('stories');
    stories.forEach((s) => store.put(s));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getOfflineStories = async (): Promise<CulturalStory[]> => {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('stories', 'readonly');
    const store = tx.objectStore('stories');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

// 3. Pending Sync Queue (for offline XP & Lessons)
export const queueOfflineProgress = async (item: Omit<PendingSyncItem, 'id' | 'timestamp'>): Promise<number> => {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_sync', 'readwrite');
    const store = tx.objectStore('pending_sync');
    const fullItem: PendingSyncItem = {
      ...item,
      timestamp: new Date().toISOString()
    };
    const req = store.add(fullItem);
    req.onsuccess = () => {
      console.log('🔄 [IndexedDB] Progression mise en file d\'attente de synchronisation:', fullItem);
      resolve(req.result as number);
    };
    req.onerror = () => reject(req.error);
  });
};

export const getPendingSyncQueue = async (): Promise<PendingSyncItem[]> => {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_sync', 'readonly');
    const store = tx.objectStore('pending_sync');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const removePendingSyncItem = async (id: number): Promise<void> => {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_sync', 'readwrite');
    const store = tx.objectStore('pending_sync');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

// 4. Local User State Store (XP, Streak, Level)
export const saveLocalChildState = async (state: { xp: number; streak: number; level: number }): Promise<void> => {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('user_state', 'readwrite');
    const store = tx.objectStore('user_state');
    store.put({ key: 'current_child_state', ...state, updatedAt: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getLocalChildState = async (): Promise<{ xp: number; streak: number; level: number } | null> => {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('user_state', 'readonly');
    const store = tx.objectStore('user_state');
    const req = store.get('current_child_state');
    req.onsuccess = () => resolve(req.result ? { xp: req.result.xp, streak: req.result.streak, level: req.result.level } : null);
    req.onerror = () => reject(req.error);
  });
};
