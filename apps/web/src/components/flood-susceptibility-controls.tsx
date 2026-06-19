import { useState } from "react";
import { Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import {
  SUSCEPTIBILITY_CLASSES,
  ALL_CLASSES,
  CLASS_ORDER_DESC,
  SOURCE_LABEL,
} from "@/lib/flood-susceptibility";
import type { SusceptibilityStats } from "@/hooks/use-flood-susceptibility";

interface FloodSusceptibilityControlsProps {
  visible: boolean;
  opacity: number;
  activeClasses: Set<number>;
  data: GeoJSON.FeatureCollection | null;
  stats: SusceptibilityStats | null;
  loading: boolean;
  onVisibleChange: (v: boolean) => void;
  onOpacityChange: (v: number) => void;
  onActiveClassesChange: (v: Set<number>) => void;
}

export function FloodSusceptibilityControls({
  visible,
  opacity,
  activeClasses,
  data,
  stats,
  loading,
  onVisibleChange,
  onOpacityChange,
  onActiveClassesChange,
}: FloodSusceptibilityControlsProps) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [showStats, setShowStats] = useState(false);

  const toggleClass = (dn: number) => {
    if (!visible) return;
    const next = new Set(activeClasses);
    if (next.has(dn)) {
      if (next.size === 1) return;
      next.delete(dn);
    } else {
      next.add(dn);
    }
    onActiveClassesChange(next);
  };

  const handleSelectAll = () => {
    if (!visible) return;
    onActiveClassesChange(new Set(ALL_CLASSES));
  };

  const handleExport = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data)], {
      type: "application/geo+json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "davao_city_flood_susceptibility.geojson";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flood-controls absolute left-4 z-[1000]" style={{ top: "76px" }}>
      <div className="w-64 rounded-xl bg-[rgba(15,23,42,0.92)] text-[#f1f5f9] shadow-xl backdrop-blur-md transition-all">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <button
            onClick={() => {
              if (!loading) onVisibleChange(!visible);
            }}
            disabled={loading}
            className={`flex items-center gap-2 text-sm font-medium ${
              loading ? "cursor-not-allowed opacity-50" : ""
            }`}
            title={
              loading
                ? "Loading overlay data\u2026"
                : visible
                  ? "Hide layer"
                  : "Show layer"
            }
          >
            {visible ? (
              <Eye className="h-4 w-4 text-[#3b82f6]" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span>Flood Susceptibility</span>
          </button>
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="rounded-md p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={panelOpen ? "Collapse panel" : "Expand panel"}
          >
            {panelOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {panelOpen && (
          <div className="space-y-4 px-4 pb-4 pt-3">
            <p className="text-[10px] leading-tight text-white/50">
              {SOURCE_LABEL}
            </p>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/70">Opacity</label>
                <span className="text-xs font-medium tabular-nums text-white/80">
                  {Math.round(opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => onOpacityChange(Number(e.target.value))}
                disabled={!visible}
                className="flood-slider w-full cursor-pointer accent-[#3b82f6] disabled:opacity-40"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/70">Classes</label>
                <button
                  onClick={handleSelectAll}
                  disabled={!visible}
                  className="text-[11px] text-[#3b82f6] transition-colors hover:text-blue-400 disabled:opacity-40"
                >
                  All
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CLASS_ORDER_DESC.map((dn) => {
                  const cls = SUSCEPTIBILITY_CLASSES[dn];
                  const isActive = activeClasses.has(dn);
                  return (
                    <button
                      key={dn}
                      onClick={() => toggleClass(dn)}
                      disabled={!visible}
                      className={`flood-controls__chip rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                        isActive
                          ? "flood-controls__chip--active text-white"
                          : "border border-white/20 text-white/50"
                      } disabled:opacity-40`}
                      style={
                        isActive
                          ? { backgroundColor: cls.color }
                          : undefined
                      }
                    >
                      {cls.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {stats && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="flex w-full items-center gap-1.5 text-xs text-white/60 transition-colors hover:text-white"
                >
                  <span className="text-xs">
                    {showStats ? "\u25BE" : "\u25B8"}
                  </span>
                  {showStats ? "Hide Statistics" : "Show Statistics"}
                </button>

                {showStats && (
                  <div className="space-y-1 rounded-lg bg-white/5 p-2.5 text-xs">
                    <p className="text-white/60">
                      {(stats?.total ?? 0).toLocaleString()} total polygons
                      analyzed
                    </p>
                    {CLASS_ORDER_DESC.map((dn) => {
                      const cls = SUSCEPTIBILITY_CLASSES[dn];
                      const entry = stats?.byClass[dn];
                      return (
                        <div
                          key={dn}
                          className="flex items-center gap-2 text-white/80"
                        >
                          <span
                            className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                            style={{ backgroundColor: cls.color }}
                          />
                          <span className="flex-1">{cls.label}</span>
                          {entry && (
                            <>
                              <span className="tabular-nums">
                                {entry.count.toLocaleString()}
                              </span>
                              <span className="tabular-nums text-white/50">
                                {entry.percent}%
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={!data}
              className="w-full rounded-md bg-white/10 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {"\u2193"} Export GeoJSON
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
