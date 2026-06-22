import { useState, useEffect, useCallback, useRef } from "react";
import type L from "leaflet";
import type RBush from "rbush";
import type { BBoxEntry, ViewportBounds } from "@/lib/spatial-index";
import { queryBounds } from "@/lib/spatial-index";

export interface UseViewportFeaturesOptions {
  map: L.Map | null;
  features: GeoJSON.Feature[];
  spatialIndex: RBush<BBoxEntry> | null;
}

export function useViewportFeatures({
  map,
  features,
  spatialIndex,
}: UseViewportFeaturesOptions): {
  visibleFeatures: GeoJSON.Feature[];
  visibleCount: number;
} {
  const [visibleBounds, setVisibleBounds] = useState<{
    bounds: ViewportBounds;
    timestamp: number;
  } | null>(null);

  const rafRef = useRef<number | null>(null);
  const featuresRef = useRef(features);
  featuresRef.current = features;

  const scheduleBoundsUpdate = useCallback(() => {
    if (!map || !featuresRef.current.length) return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const bounds = map.getBounds();
      setVisibleBounds({
        bounds: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
        timestamp: Date.now(),
      });
    });
  }, [map]);

  useEffect(() => {
    if (!map) return;

    scheduleBoundsUpdate();

    map.on("moveend", scheduleBoundsUpdate);
    map.on("zoomend", scheduleBoundsUpdate);

    return () => {
      map.off("moveend", scheduleBoundsUpdate);
      map.off("zoomend", scheduleBoundsUpdate);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [map, scheduleBoundsUpdate]);

  if (!map || !features.length) {
    return { visibleFeatures: features, visibleCount: features.length };
  }

  if (!spatialIndex || !visibleBounds) {
    return { visibleFeatures: features, visibleCount: features.length };
  }

  const hits = queryBounds(spatialIndex, visibleBounds.bounds);

  if (!hits.length) {
    return { visibleFeatures: [], visibleCount: 0 };
  }

  const visibleFeatures = hits.map((h) => features[h.id]).filter(Boolean);

  return { visibleFeatures, visibleCount: visibleFeatures.length };
}
