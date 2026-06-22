/// <reference types="vite/client" />

interface Window {
  __floodsense?: {
    cacheStatus: () => {
      memorySingleton: boolean;
      indexedDB: {
        hit: boolean;
        key: string | null;
        cachedAt: string | null;
      };
      serviceWorker: {
        registered: boolean;
        cacheVersion: string | null;
      };
    };
  };
}
