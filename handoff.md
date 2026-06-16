# Handoff — Flood Susceptibility Overlay

## Summary

Built the flood susceptibility overlay feature from the Gherkin spec (`flood_susceptibility_full.feature`). The feature renders a UTM-to-WGS84 reprojected GeoJSON polygon layer on the Leaflet map, color-coded by DN class (1=Very Low through 4=High).

## Files created

| File | Purpose |
|---|---|
| `apps/web/src/lib/flood-susceptibility.ts` | Constants: SUSCEPTIBILITY_CLASSES, ALL_CLASSES, labels |
| `apps/web/src/hooks/use-flood-susceptibility.ts` | Hook: fetch GeoJSON, compute stats, UTM→WGS84 transform, retry |
| `apps/web/src/components/flood-susceptibility-overlay.tsx` | Orchestrator: manages GeoJSON layer + Leaflet legend + toggle button |
| `apps/web/src/components/loading-banner.tsx` | Loading indicator with spinner |
| `apps/web/src/components/error-banner.tsx` | Error display with retry button |
| `apps/web/src/components/flood-susceptibility-controls.tsx` | Controls panel (currently unused — replaced by toggle) |

## Files modified

| File | Change |
|---|---|
| `apps/web/src/components/map.tsx` | Added `onMapReady` callback + ref-based callbacks to avoid stale closures |
| `apps/web/src/routes/index.tsx` | Wired in FloodSusceptibilityOverlay with map instance |
| `apps/web/src/index.css` | Added spinner animation, tooltip/popup overrides, reduced-motion support |

## Current state

- Toggle button ("Susceptibility") below "My Location" at top-right toggles the GeoJSON layer
- Hover tooltip shows class label + probability range with color dot
- **No click popup** — polygon clicks fall through to map's location-select handler
- Legend (bottom-right, Leaflet control) shows class colors + labels + ranges
- GeoJSON is reprojected from UTM Zone 51N to WGS84 client-side using `utmToWgs84`
- 53MB file causes lag — recommend simplifying via mapshaper.org or converting to vector tiles

## GeoJSON note

The file `ensemble_map_davao_City.json` (53MB, UTM coordinates) is in `public/`. For production, either simplify with mapshaper or convert to vector tiles via tippecanoe.

## Suggested skills

- `impeccable` — refine the toggle button or legend appearance
- `improve-codebase-architecture` — refactor hook + overlay into cleaner module boundaries
- `diagnose` — investigate and fix the 53MB performance bottleneck
