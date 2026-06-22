import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import {
  SUSCEPTIBILITY_CLASSES,
  CLASS_ORDER_DESC,
  ENSEMBLE_SHORT,
} from "@/lib/flood-susceptibility";
import { Layers } from "lucide-react";

const TILE_URL = `${import.meta.env.VITE_SERVER_URL}/static/tiles/{z}/{x}/{y}.png`;
const TILE_OPACITY = 0.7;
const DAVAO_BOUNDS = L.latLngBounds([6.0, 125.0], [7.5, 126.0]);

interface FloodSusceptibilityOverlayProps {
  map: L.Map | null;
}

export function FloodSusceptibilityOverlay({
  map,
}: FloodSusceptibilityOverlayProps) {
  const [visible, setVisible] = useState(true);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!map) return;

    const layer = L.tileLayer(TILE_URL, {
      opacity: TILE_OPACITY,
      bounds: DAVAO_BOUNDS,
      minZoom: 8,
      maxZoom: 15,
      attribution: "FloodSense",
    });

    if (visible) {
      layer.addTo(map);
    }

    tileLayerRef.current = layer;

    return () => {
      layer.remove();
      tileLayerRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const layer = tileLayerRef.current;
    if (!layer || !map) return;

    if (visible) {
      map.addLayer(layer);
    } else {
      map.removeLayer(layer);
    }
  }, [visible, map]);

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
    <div className="absolute top-14 right-3 z-1000 flex flex-col items-end gap-2">
      <button
        onClick={() => setVisible((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-colors ${
          visible
            ? "border-[#3b82f6] bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90"
            : "border-border bg-card text-muted-foreground hover:bg-accent"
        }`}
        title={visible ? "Hide flood layer" : "Show flood layer"}
      >
        <Layers className="h-3.5 w-3.5" />
        Susceptibility
      </button>
    </div>
  );
}
