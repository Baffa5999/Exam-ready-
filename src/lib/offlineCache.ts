/**
 * Small IndexedDB cache for ExamReady offline content.
 * This is deliberately independent from subscription/entitlement logic.
 */

const DB_NAME = 'examready-offline';
const DB_VERSION = 1;
const STORE_NAME = 'question-cache';

type CacheRecord<T> = {
  key: string;
  savedAt: number;
  data: T;
};

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open offline cache'));
  });

export async function saveQuestionCache<T>(key: string, data: T): Promise<void> {
  const db = await openDb();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ key, savedAt: Date.now(), data } satisfies CacheRecord<T>);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Unable to save question cache'));
  });

  db.close();
}

export async function getQuestionCache<T>(key: string): Promise<{ data: T; savedAt: number } | null> {
  const db = await openDb();

  const record = await new Promise<CacheRecord<T> | undefined>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to read question cache'));
  });

  db.close();

  return record ? { data: record.data, savedAt: record.savedAt } : null;
}
