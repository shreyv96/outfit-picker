// Tiny IndexedDB wrapper. Everything is stored on this device only.
const DB_NAME = 'outfit-picker';
const DB_VERSION = 1;
let dbPromise;

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('log')) db.createObjectStore('log', { keyPath: 'id', autoIncrement: true });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function run(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve(req ? req.result : undefined);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export const getItems = () => run('items', 'readonly', (s) => s.getAll());
export const getItem = (id) => run('items', 'readonly', (s) => s.get(id));
export const putItem = (item) => run('items', 'readwrite', (s) => s.put(item));
export const deleteItem = (id) => run('items', 'readwrite', (s) => s.delete(id));
export const clearItems = () => run('items', 'readwrite', (s) => s.clear());
export const getLog = () => run('log', 'readonly', (s) => s.getAll());
export const addLog = (entry) => run('log', 'readwrite', (s) => s.add(entry));
export const clearLog = () => run('log', 'readwrite', (s) => s.clear());

export function newId() {
  return (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
}

// Ask the browser not to evict our data when the device is low on space.
export async function requestPersistence() {
  try {
    if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist();
  } catch (_) { /* ignore */ }
  return false;
}
