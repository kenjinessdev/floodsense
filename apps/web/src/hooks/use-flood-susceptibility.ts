import { useState, useEffect, useCallback } from "react";
import { utmToWgs84 } from "@/lib/utm-converter";
import { readFromIndexedDB, writeToIndexedDB } from "@/lib/geojson-cache";

export interface CacheInfo {
  source: "memory" | "indexeddb" | "network";
  loadTimeMs: number;
  cachedAt: string | null;
}

export interface SusceptibilityStats {
  total: number;
  byClass: Record<number, { count: number; percent: string }>;
}

export type LoadingPhase = "fetching" | "reprojecting" | "idle" | "cached";

interface MemoryEntry {
  promise: Promise<GeoJSON.FeatureCollection>;
  hash: string;
  resolved: boolean;
  data: GeoJSON.FeatureCollection | null;
  cachedAt: string | null;
}

let memorySingleton: MemoryEntry | null = null;

export function __resetSingleton(): void {
  if (import.meta.env.DEV) {
    memorySingleton = null;
  }
}

const GEOJSON_CONTENT_HASH: string =
  typeof __GEOJSON_CONTENT_HASH__ !== "undefined"
    ? __GEOJSON_CONTENT_HASH__
    : "dev";
const CACHE_VERSION: string =
  typeof __CACHE_VERSION__ !== "undefined" ? __CACHE_VERSION__ : "dev";

function isUtmCoords(coords: number[]): boolean {
  return coords.length >= 2 && coords[0] > 180;
}

function transformCoords(
  data: GeoJSON.FeatureCollection,
): GeoJSON.FeatureCollection {
  const traverse = (coords: unknown): unknown => {
    if (!Array.isArray(coords)) return coords;
    if (coords.length === 0) return coords;
    if (typeof coords[0] === "number") {
      if (isUtmCoords(coords as number[])) {
        const [e, n] = coords as number[];
        const [lat, lng] = utmToWgs84(e, n);
        return [lng, lat, ...(coords as number[]).slice(2)];
      }
      return coords;
    }
    return coords.map(traverse);
  };

  return {
    type: "FeatureCollection",
    features: data.features.map((f) => {
      if (!f.geometry || f.geometry.type === "GeometryCollection") {
        return f;
      }
      const geom = f.geometry as GeoJSON.Geometry & { coordinates: unknown };
      return {
        ...f,
        geometry: { ...geom, coordinates: traverse(geom.coordinates) },
      };
    }),
  } as GeoJSON.FeatureCollection;
}

export function useFloodSusceptibility(url: string) {
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [stats, setStats] = useState<SusceptibilityStats | null>(null);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("idle");

  const computeStats = useCallback(
    (fc: GeoJSON.FeatureCollection): SusceptibilityStats => {
      const byClass: Record<number, { count: number; percent: string }> = {};
      let total = 0;

      for (const feature of fc.features) {
        if (!feature.geometry) continue;
        const dn = (feature.properties?.DN ?? feature.properties?.dn) as
          | number
          | undefined;
        if (typeof dn === "number" && dn >= 1 && dn <= 4) {
          if (!byClass[dn]) byClass[dn] = { count: 0, percent: "0.0" };
          byClass[dn].count++;
          total++;
        }
      }

      for (const key of Object.keys(byClass)) {
        const dn = Number(key);
        byClass[dn].percent =
          total > 0
            ? ((byClass[dn].count / total) * 100).toFixed(1)
            : "0.0";
      }

      return { total, byClass };
    },
    [],
  );

  const fetchAndProcess = useCallback(async () => {
    setLoadingPhase("fetching");
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    let json = (await response.json()) as GeoJSON.FeatureCollection;
    if (!json.features || !Array.isArray(json.features)) {
      throw new Error("Invalid GeoJSON: missing features array");
    }
    setLoadingPhase("reprojecting");
    const reprojected = transformCoords(json);
    return reprojected;
  }, [url]);

  const loadData = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setCacheInfo(null);
    setLoadingPhase("idle");

    const isDev = import.meta.env.DEV;
    const bypass =
      isDev &&
      typeof localStorage !== "undefined" &&
      localStorage.getItem("floodsense_bypass_geojson_cache") === "true";

    try {
      let result: {
        fc: GeoJSON.FeatureCollection;
        source: CacheInfo["source"];
        cachedAt: string | null;
      } | null = null;

      if (
        !bypass &&
        memorySingleton?.hash === GEOJSON_CONTENT_HASH &&
        memorySingleton.resolved &&
        memorySingleton.data
      ) {
        result = {
          fc: memorySingleton.data,
          source: "memory",
          cachedAt: memorySingleton.cachedAt,
        };
      }

      if (!result && !bypass) {
        try {
          const record = await readFromIndexedDB(GEOJSON_CONTENT_HASH);
          if (record) {
            memorySingleton = {
              hash: GEOJSON_CONTENT_HASH,
              resolved: true,
              data: record.data,
              cachedAt: record.cachedAt,
              promise: Promise.resolve(record.data),
            };
            result = {
              fc: record.data,
              source: "indexeddb",
              cachedAt: record.cachedAt,
            };
          }
        } catch (idbErr) {
          console.warn(
            "IndexedDB read failed, falling back to network",
            idbErr,
          );
        }
      }

      if (!result) {
        const reprojected = await fetchAndProcess();

        writeToIndexedDB(GEOJSON_CONTENT_HASH, reprojected).catch(
          (writeErr) => {
            console.warn(
              "IndexedDB write failed — overlay will not be cached",
              writeErr,
            );
          },
        );

        memorySingleton = {
          hash: GEOJSON_CONTENT_HASH,
          resolved: true,
          data: reprojected,
          cachedAt: null,
          promise: Promise.resolve(reprojected),
        };

        result = { fc: reprojected, source: "network", cachedAt: null };
      }

      if (isDev) {
        const logMap: Record<CacheInfo["source"], string> = {
          memory: "DEV: overlay served from memory singleton",
          indexeddb: "DEV: overlay served from IndexedDB",
          network: "DEV: overlay fetched from network/SW cache",
        };
        console.log(logMap[result.source]);
        if (bypass) {
          console.log("DEV: geojson cache bypassed via localStorage flag");
        }
      }

      setData(result.fc);
      setStats(computeStats(result.fc));
      setCacheInfo({
        source: result.source,
        loadTimeMs: 0,
        cachedAt: result.cachedAt,
      });
      setLoadingPhase(
        result.source === "memory" || result.source === "indexeddb"
          ? "cached"
          : "idle",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
      setData(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [url, computeStats, fetchAndProcess]);

  useEffect(() => {
    if (!url) return;
    void loadData();
  }, [url, loadData, attempt]);

  const retry = useCallback(() => {
    memorySingleton = null;
    setAttempt((a) => a + 1);
  }, []);

  return {
    data,
    loading,
    error,
    stats,
    retry,
    attempt,
    cacheInfo,
    loadingPhase,
  };
}

if (typeof window !== "undefined" && import.meta.env.DEV) {
  (window as Window).__floodsense = {
    cacheStatus: () => ({
      memorySingleton: memorySingleton?.resolved ?? false,
      indexedDB: {
        hit: false,
        key: null,
        cachedAt: null,
      },
      serviceWorker: {
        registered: "serviceWorker" in navigator,
        cacheVersion: CACHE_VERSION,
      },
    }),
  };
}
