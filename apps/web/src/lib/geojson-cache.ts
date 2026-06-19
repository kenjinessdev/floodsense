export const DB_NAME = "floodsense-geojson-cache";
export const DB_VERSION = 1;
export const STORE_NAME = "overlays";

export interface IndexedDBRecord {
  key: string;
  data: GeoJSON.FeatureCollection;
  cachedAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

export async function readFromIndexedDB(
  hash: string,
): Promise<IndexedDBRecord | null> {
  const db = await openDB();
  return new Promise<IndexedDBRecord | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(`flood-susceptibility-v${hash}`);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function writeToIndexedDB(
  hash: string,
  data: GeoJSON.FeatureCollection,
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const currentKey = `flood-susceptibility-v${hash}`;

  store.put({
    key: currentKey,
    data,
    cachedAt: new Date().toISOString(),
  } satisfies IndexedDBRecord);

  const allKeys = await new Promise<string[]>((resolve, reject) => {
    const req = store.getAllKeys();
    req.onsuccess = () => resolve(req.result as string[]);
    req.onerror = () => reject(req.error);
  });

  for (const key of allKeys) {
    if (key !== currentKey) {
      store.delete(key);
    }
  }

  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
