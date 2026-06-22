# Handoff — GeoJSON → Raster Tile Overlay Migration

**Date:** 2026-06-22
**Branch:** `feat/progressive-rendering`
**Head:** `9d6fa19` — feat: implemented progressive rendering

---

## What was done

The GeoJSON-based flood susceptibility overlay (canvas + rbush spatial index + chunked ingestion) was replaced with an `L.tileLayer` pointing at a pre-rendered PNG tile pyramid served by FastAPI.

### Files modified

| File | Change |
|------|--------|
| `apps/web/src/components/flood-susceptibility-overlay.tsx` | Rewrote: removed canvas/GeoJSON/spatial-index/chunk-scheduler, uses `L.tileLayer` with URL `${VITE_SERVER_URL}/static/tiles/{z}/{x}/{y}.png`, opacity `0.7`, bounds `[6.0, 125.0]`–`[7.5, 126.0]`, zoom `8–15`. Toggle button and legend kept unchanged. |
| `apps/web/src/routes/index.tsx` | Removed `url` prop from `<FloodSusceptibilityOverlay>` |
| `apps/web/vite.config.ts` | Removed `readFileSync`/`createHash` imports, `geojsonPath`/`geojsonHash` logic, `__GEOJSON_CONTENT_HASH__` and `__CACHE_VERSION__` defines |
| `apps/web/src/env.d.ts` | Removed `__GEOJSON_CONTENT_HASH__` declaration |
| `apps/web/src/sw.ts` | Removed GeoJSON fetch cache (simplified to install + activate only) |

### Files deleted

- `apps/web/src/hooks/use-flood-susceptibility.ts`
- `apps/web/src/hooks/use-viewport-features.ts`
- `apps/web/src/lib/geojson-cache.ts`
- `apps/web/src/lib/spatial-index.ts`
- `apps/web/src/lib/chunk-scheduler.ts`
- `apps/web/src/components/flood-susceptibility-controls.tsx`
- `apps/web/src/components/loading-banner.tsx`
- `apps/web/public/ensemble_map_davao_City.json`
- `apps/web/public/ensemble_map_davao_City.geojson`

### Files kept

- `apps/web/src/lib/utm-converter.ts` — still used by `map.tsx` for city boundary WGS84 reprojection
- `apps/web/src/lib/flood-susceptibility.ts` — legend constants unchanged
- `apps/web/src/components/error-banner.tsx` — no broken imports, retained

## Key design decisions

1. **Tile URL uses `import.meta.env.VITE_SERVER_URL`** matching the pattern in `lib/api.ts`. Tiles expected at `http://127.0.0.1:8000/static/tiles/{z}/{x}/{y}.png`.
2. **`maxZoom: 15`** and **`minZoom: 8`** — matches `gdal2tiles.py` pyramid range (`--zoom=8-15`). No tiles exist outside this range.
3. **`bounds: L.latLngBounds([6.0, 125.0], [7.5, 126.0])`** — constrains tile requests to Davao City extent. Leaflet silently skips missing tiles outside bounds.
4. **Opacity `0.7`** — matches `Alpha=178` (~70%) from `color.txt` in the GDAL pipeline.
5. **Toggle via `map.addLayer`/`map.removeLayer`** — tile layer created once on mount; visibility toggle adds/removes from map without re-creating the layer.

## What to do next

### 1. Verify tile layer works end-to-end

- Start the FastAPI dev server (ensure tiles exist at `static/tiles/`)
- Start the Vite dev server: `pnpm run dev:web`
- Open `http://localhost:3001` and confirm:
  - Overlay tiles render when toggle is ON
  - Toggle OFF hides tiles
  - Pan/zoom are smooth (no float, no freeze)
  - Click-to-analyze works immediately (no blocking)
  - Missing tiles (outside Davao) show no errors
- Run `pnpm run check-types` — should pass with zero errors

### 2. Remove stale frontend handoff & old gherkin specs

- `HANDoFF.md` (this file) — current progressive-rendering handoff, now superseded
- `FRONTEND_HANDOFF.md` — older handoff, may be stale
- `floodsense-geojson-perf-handoff-2026-06-18.md` — GeoJSON-era perf notes
- `gherkin-specs/geojson_overlay_cache.feature` — superseded by `raster_tile_overlay.feature`
- `gherkin-specs/progressive_rendering.feature` — superseded by `raster_tile_overlay.feature`

### 3. Clean up stale directory references

- `apps/web/CLAUDE.md` — stale academic-rubric context, can be archived
- `package.json` dependencies that are no longer needed (e.g., `rbush` if only used by `spatial-index.ts`)
- `districts.json` route in `map.tsx` — the boundary is loaded from a local file, verify this still works

### 4. PWA service worker

- Current SW (`sw.ts`) is stripped to just install + activate with no fetch handler. If tile caching is desired, the SW could be extended to cache tile images via the `Cache-Control: immutable` headers.

## Suggested skills

| Skill | When to use |
|-------|-------------|
| `diagnose` | If tiles don't load, pan/zoom still janks, or CORS errors appear — systematic reproduction → minimisation → fix |
| `impeccable` | Polish the overlay toggle button, legend styling, or add loading state for tile fallback handling |
| `improve-codebase-architecture` | Consolidate remaining stale components, prune dead deps from `package.json`, audit the SW strategy |
| `tdd` | Write integration tests for the tile overlay toggle, legend rendering, and map interactions |
| `prototype` | Experiment with alternative tile sources or styling before committing to the GDAL pipeline output |
| `zoom-out` | Get architectural overview of the full stack (FastAPI + Vite + Leaflet) before making structural changes |
| `to-issues` | Break the remaining work (E2E verification, stale spec cleanup, PWA caching) into independently grabbable issues |

## Reference artifacts

- **Gherkin spec (active):** `gherkin-specs/raster_tile_overlay.feature` (Parts 3–4 cover frontend migration + E2E verification)
- **Agent guide:** `AGENTS.md` (monorepo setup, commands, conventions)
- **GDAL pipeline spec:** `gherkin-specs/raster_tile_overlay.feature` (Part 1 — backend tile generation)
- **Superseded specs:** `gherkin-specs/geojson_overlay_cache.feature`, `gherkin-specs/progressive_rendering.feature`
- **Backend API:** `POST {VITE_SERVER_URL}/predict` with `{ lat, lng }` — returns `FloodPredictionResponse`
