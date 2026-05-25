const DB_NAME = 'gestion-ecole-settings';
const DB_VERSION = 1;
const STORE_NAME = 'settings';
const USER_KEY = 'user';

export interface AppSettings {
  theme: 'light' | 'dark';
  color: 'blue' | 'violet' | 'green' | 'red' | 'orange' | 'indigo';
  language: 'fr' | 'en' | 'mg';
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  color: 'blue',
  language: 'fr',
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(USER_KEY);
      request.onsuccess = () => resolve({ ...DEFAULT_SETTINGS, ...(request.result ?? {}) });
      request.onerror = () => resolve(DEFAULT_SETTINGS);
    });
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(partial: Partial<AppSettings>): Promise<void> {
  try {
    const current = await loadSettings();
    const merged = { ...current, ...partial };
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(merged, USER_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // silently fail — preferences are non-critical
  }
}
