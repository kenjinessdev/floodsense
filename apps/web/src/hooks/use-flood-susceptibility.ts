import { useState, useEffect, useCallback } from "react";
import { utmToWgs84 } from "@/lib/utm-converter";

export interface SusceptibilityStats {
  total: number;
  byClass: Record<number, { count: number; percent: string }>;
}

function isUtmCoords(coords: number[]): boolean {
  return coords.length >= 2 && coords[0] > 180;
}

function transformCoords(data: GeoJSON.FeatureCollection): GeoJSON.FeatureCollection {
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

  const fetchData = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      let json = (await response.json()) as GeoJSON.FeatureCollection;
      if (!json.features || !Array.isArray(json.features)) {
        throw new Error("Invalid GeoJSON: missing features array");
      }
      json = transformCoords(json);
      setData(json);
      setStats(computeStats(json));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
      setData(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [url, computeStats]);

  useEffect(() => {
    if (!url) return;
    void fetchData();
  }, [url, fetchData]);

  const retry = useCallback(() => {
    setAttempt((a) => a + 1);
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, stats, retry, attempt };
}
