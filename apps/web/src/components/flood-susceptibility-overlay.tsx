import { useState, useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import { useFloodSusceptibility } from "@/hooks/use-flood-susceptibility";
import {
  SUSCEPTIBILITY_CLASSES,
  ALL_CLASSES,
  CLASS_ORDER_DESC,
  ENSEMBLE_SHORT,
  DEFAULT_OPACITY,
  HOVER_OPACITY_BOOST,
  MAX_HOVER_OPACITY,
} from "@/lib/flood-susceptibility";
import { LoadingBanner } from "./loading-banner";
import { ErrorBanner } from "./error-banner";
import { Layers } from "lucide-react";

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
  const [activeClasses] = useState<Set<number>>(() => new Set(ALL_CLASSES));

  const layerRef = useRef<L.GeoJSON | null>(null);

  const activeClassesKey = useMemo(
    () => JSON.stringify([...activeClasses].sort()),
    [activeClasses],
  );

  useEffect(() => {
    if (!map || !data || !visible) {
      if (layerRef.current) {
        map?.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    const ac = new Set(activeClasses);

    const layer = L.geoJSON(data, {
      renderer: L.canvas(),
      interactive: false,
      filter: (feature) => {
        if (!feature.geometry) return false;
        const dn = (feature.properties?.DN ?? feature.properties?.dn) as
          | number
          | undefined;
        return typeof dn === "number" && ac.has(dn);
      },
      style: (feature) => {
        const dn = (feature.properties?.DN ?? feature.properties?.dn) as
          | number
          | undefined;
        const cls = dn ? SUSCEPTIBILITY_CLASSES[dn] : undefined;
        return {
          fillColor: cls?.color ?? "#cccccc",
          fillOpacity: opacity * (cls?.opacity ?? 1),
          weight: 0,
          stroke: false,
        };
      },
    }).addTo(map);

    layerRef.current = layer;

    return () => {
      map.removeLayer(layer);
      layerRef.current = null;
    };
  }, [map, data, visible, activeClassesKey, opacity]);

  useEffect(() => {
    if (!layerRef.current) return;
    layerRef.current.setStyle({ fillOpacity: opacity });
  }, [opacity]);

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

  return (
    <>
      <div className="absolute top-14 right-3 z-1000">
        <button
          onClick={() => setVisible((v) => !v)}
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
          <Layers className="h-3.5 w-3.5" />
          Susceptibility
        </button>
      </div>

      {loading && <LoadingBanner phase={loadingPhase} />}
      {error && !loading && (
        <ErrorBanner message={error} onRetry={retry} />
      )}
    </>
  );
}
