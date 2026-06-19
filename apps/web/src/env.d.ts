/// <reference types="vite/client" />

declare const __CACHE_VERSION__: string;
declare const __GEOJSON_CONTENT_HASH__: string;

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
