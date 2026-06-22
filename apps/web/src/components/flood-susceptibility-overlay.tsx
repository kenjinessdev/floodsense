import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import L from "leaflet";
import type RBush from "rbush";
import { useFloodSusceptibility } from "@/hooks/use-flood-susceptibility";
import {
  SUSCEPTIBILITY_CLASSES,
  ALL_CLASSES,
  CLASS_ORDER_DESC,
  ENSEMBLE_SHORT,
  DEFAULT_OPACITY,
  CHUNK_SIZE,
} from "@/lib/flood-susceptibility";
import { ingestInChunks, AbortError } from "@/lib/chunk-scheduler";
import { buildIndex, queryBounds } from "@/lib/spatial-index";
import type { BBoxEntry } from "@/lib/spatial-index";
import { LoadingBanner } from "./loading-banner";
import { ErrorBanner } from "./error-banner";
import { Layers, Loader2 } from "lucide-react";

interface FloodSusceptibilityOverlayProps {
  map: L.Map | null;
  url: string;
}

export function FloodSusceptibilityOverlay({
  map,
  url,
}: FloodSusceptibilityOverlayProps) {
  const { data, loading, error, retry, loadingPhase } =
    useFloodSusceptibility(url);

  const [visible, setVisible] = useState(true);
  const [opacity] = useState(DEFAULT_OPACITY);
  const [activeClasses] = useState<Set<number>>(
    () => new Set(ALL_CLASSES),
  );
  const [renderProgress, setRenderProgress] = useState(0);
  const [ingestionState, setIngestionState] = useState<
    "idle" | "ingesting" | "ready"
  >("idle");

  const layerRef = useRef<L.GeoJSON | null>(null);
  const allFeaturesRef = useRef<GeoJSON.Feature[]>([]);
  const spatialIndexRef = useRef<RBush<BBoxEntry> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const activeClassesRef = useRef(activeClasses);
  const mapRef = useRef(map);
  const opacityRef = useRef(opacity);

  activeClassesRef.current = activeClasses;
  mapRef.current = map;
  opacityRef.current = opacity;

  const activeClassesKey = useMemo(
    () => JSON.stringify([...activeClasses].sort()),
    [activeClasses],
  );

  const styleFn = useCallback(
    (feature: GeoJSON.Feature | undefined): L.PathOptions => {
      const f = feature ?? ({} as GeoJSON.Feature);
      const dn = (f.properties?.DN ?? f.properties?.dn) as
        | number
        | undefined;
      return {
        fillColor: dn ? SUSCEPTIBILITY_CLASSES[dn]?.color ?? "#cccccc" : "#cccccc",
        fillOpacity: opacityRef.current,
        weight: 0,
        stroke: false,
      };
    },
    [],
  );

  const filterFn = useCallback(
    (feature: GeoJSON.Feature | undefined): boolean => {
      if (!feature?.geometry) return false;
      const dn = (feature.properties?.DN ?? feature.properties?.dn) as
        | number
        | undefined;
      return typeof dn === "number" && activeClassesRef.current.has(dn);
    },
    [],
  );

  const updateLayerFeatures = useCallback(
    (features: GeoJSON.Feature[]) => {
      if (!layerRef.current) return;
      layerRef.current.clearLayers();
      if (features.length === 0) return;
      const fc: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features,
      };
      layerRef.current.addData(fc);
    },
    [],
  );

  useEffect(() => {
    if (!map) return;

    const layer = L.geoJSON([], {
      interactive: false,
      filter: filterFn,
      style: styleFn,
    });
    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      map.removeLayer(layer);
      layerRef.current = null;
    };
  }, [map, filterFn, styleFn]);

  useEffect(() => {
    if (!map || !layerRef.current || !data || !visible) {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      setIngestionState("idle");
      setRenderProgress(0);
      if (layerRef.current) {
        layerRef.current.clearLayers();
      }
      spatialIndexRef.current = null;
      allFeaturesRef.current = [];
      return;
    }

    const features = data.features
      .filter((f) => f.geometry)
      .sort((a, b) => {
        const dnA = (a.properties?.DN ?? a.properties?.dn) as number | undefined;
        const dnB = (b.properties?.DN ?? b.properties?.dn) as number | undefined;
        return (dnB ?? 0) - (dnA ?? 0);
      });

    if (features.length === 0) return;

    allFeaturesRef.current = features;
    spatialIndexRef.current = null;
    layerRef.current.clearLayers();

    const ac = new AbortController();
    abortRef.current = ac;

    setRenderProgress(0);
    setIngestionState("ingesting");

    const runIngestion = async () => {
      try {
        await ingestInChunks(
          features,
          (batch, progress) => {
            const batchFc: GeoJSON.FeatureCollection = {
              type: "FeatureCollection",
              features: batch,
            };
            layerRef.current?.addData(batchFc);
            setRenderProgress(progress.completed / progress.total);
          },
          { chunkSize: CHUNK_SIZE, signal: ac.signal },
        );

        if (ac.signal.aborted) return;

        spatialIndexRef.current = buildIndex(features);
        setIngestionState("ready");
      } catch (err) {
        if (err instanceof AbortError) return;
        console.error("Chunked ingestion failed:", err);
      }
    };

    void runIngestion();

    return () => {
      ac.abort();
      abortRef.current = null;
    };
  }, [map, data, visible, styleFn, filterFn]);

  useEffect(() => {
    if (!map || !layerRef.current || !visible) return;
    if (ingestionState !== "ready" || !spatialIndexRef.current) {
      return;
    }

    const handleMoveEnd = () => {
      if (
        !spatialIndexRef.current ||
        !layerRef.current ||
        !mapRef.current
      )
        return;

      const bounds = mapRef.current.getBounds();
      const hits = queryBounds(spatialIndexRef.current, {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });

      const visibleFeatures = hits
        .map((h) => allFeaturesRef.current[h.id])
        .filter(Boolean);

      updateLayerFeatures(visibleFeatures);
    };

    map.on("moveend", handleMoveEnd);
    map.on("zoomend", handleMoveEnd);
    handleMoveEnd();

    return () => {
      map.off("moveend", handleMoveEnd);
      map.off("zoomend", handleMoveEnd);
    };
  }, [map, visible, ingestionState, updateLayerFeatures]);

  useEffect(() => {
    if (!layerRef.current || ingestionState !== "ready") return;
    const bounds = map?.getBounds();
    if (!bounds) return;

    const hits = spatialIndexRef.current
      ? queryBounds(spatialIndexRef.current, {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        })
      : [];

    const visibleFeatures = spatialIndexRef.current
      ? hits.map((h) => allFeaturesRef.current[h.id]).filter(Boolean)
      : allFeaturesRef.current;

    updateLayerFeatures(visibleFeatures);
  }, [activeClassesKey, ingestionState, map, updateLayerFeatures]);

  useEffect(() => {
    if (!map) return;

    class FloodLegendControl extends L.Control {
      constructor() {
        super({ position: "bottomright" });
      }

      onAdd() {
        const container = L.DomUtil.create("div", "flood-legend");
        container.innerHTML = `
          <div class="flood-legend__inner" style="background:rgba(15,23,42,0.92);backdrop-filter:blur(8px);border-radius:8px;padding:12px;color:#f1f5f9;min-width:160px">
            <p style="font-weight:600;font-size:13px;margin-bottom:2px">Flood Susceptibility</p>
            <p style="font-size:10px;color:#94a3b8;margin-bottom:8px">${ENSEMBLE_SHORT}</p>
            ${CLASS_ORDER_DESC.map((dn) => {
              const cls = SUSCEPTIBILITY_CLASSES[dn];
              return `
                <div style="display:flex;align-items:center;gap:8px;padding:2px 0">
                  <span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:${cls.color};flex-shrink:0"></span>
                  <span style="font-size:12px;flex:1">${cls.label}</span>
                  <span style="font-size:11px;color:#94a3b8">${cls.range}</span>
                </div>
              `;
            }).join("")}
          </div>`;
        return container;
      }
    }

    const legend = new FloodLegendControl();
    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [map]);

  const handleToggle = () => {
    if (visible && ingestionState === "ingesting") {
      abortRef.current?.abort();
      abortRef.current = null;
      setIngestionState("idle");
      setRenderProgress(0);
      spatialIndexRef.current = null;
      if (layerRef.current) layerRef.current.clearLayers();
    }
    setVisible((v) => !v);
  };

  return (
    <>
      <div className="absolute top-14 right-3 z-1000 flex flex-col items-end gap-2">
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-colors ${
            loading
              ? "cursor-not-allowed border-border bg-card text-muted-foreground opacity-50"
              : visible
                ? "border-[#3b82f6] bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90"
                : "border-border bg-card text-muted-foreground hover:bg-accent"
          }`}
          title={
            loading
              ? "Loading overlay data\u2026"
              : visible
                ? "Hide flood layer"
                : "Show flood layer"
          }
        >
          {ingestionState === "ingesting" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Layers className="h-3.5 w-3.5" />
          )}
          Susceptibility
        </button>

        {ingestionState === "ingesting" && visible && (
          <div className="w-36 overflow-hidden rounded-full bg-muted shadow-sm">
            <div
              className="h-1 rounded-full bg-[#3b82f6] transition-all duration-200 ease-out"
              style={{ width: `${Math.round(renderProgress * 100)}%` }}
            />
          </div>
        )}
      </div>

      {loading && <LoadingBanner phase={loadingPhase} />}
      {error && !loading && (
        <ErrorBanner message={error} onRetry={retry} />
      )}
    </>
  );
}
