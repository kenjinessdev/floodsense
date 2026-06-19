# Handoff: FloodSense GeoJSON Overlay Performance Optimization

## Session summary

Investigated map interaction lag (click, pan, zoom) when the flood susceptibility overlay is visible. The 3-layer caching (Service Worker, IndexedDB, memory singleton) from `gherkin-specs/geojson_overlay_cache.feature` solves data-fetch latency, but **rendering the overlay** remains the bottleneck: ~196k polygon features on a Leaflet Canvas with every interaction triggering a full redraw.

### What's already in place (confirmed not the issue)

- `L.canvas()` renderer (`flood-susceptibility-overlay.tsx:52`) + `preferCanvas: true` on map (`map.tsx:83`)
- `interactive: false` on overlay layer (`flood-susceptibility-overlay.tsx:53`)
- These are necessary but insufficient — the sheer draw-call count is the bottleneck

### What was done this session

- Installed `mapshaper` dev dep in `apps/web`
- Added build-time simplification in `vite.config.ts` (`-simplify dp 5%`)
- Result: vertices reduced 44% (3.2M → 1.8M), file 76.7 MB → 48.2 MB
- **Problem**: Feature count unchanged at 196k since data is already simple grid cells (~8 vertices each). Simplification only removes vertices, not whole polygons. Canvas redraw cost is dominated by draw calls per feature, not vertices per feature.

## Next step (unfinished)

Replace or augment the `-simplify` command with mapshaper's `-dissolve` to merge adjacent grid cells of the same susceptibility class (DN field) into contiguous regions. This should collapse 196k features to probably <1000.

**Recommended `vite.config.ts` change** (line 22):

```
`-i data.json -dissolve DN -simplify dp 5% -o format=geojson`
```

The `-dissolve` step runs before simplification and merges adjacent polygons sharing `properties.DN`. Since there are only 4 DN classes (1–4), this reduces draw calls by ~99.8%.

## Relevant artifacts

| Artifact | Path |
|----------|------|
| Cache feature spec | `gherkin-specs/geojson_overlay_cache.feature` |
| Current vite config | `apps/web/vite.config.ts` |
| Overlay component | `apps/web/src/components/flood-susceptibility-overlay.tsx` |
| Flood susceptibility hook | `apps/web/src/hooks/use-flood-susceptibility.ts` |
| GeoJSON cache lib | `apps/web/src/lib/geojson-cache.ts` |
| Map component | `apps/web/src/components/map.tsx` |
| Mapshaper dep added | `apps/web/package.json` (devDependencies) |
| Simplified GeoJSON (backup) | `C:\Users\tabad\AppData\Local\Temp\opencode\simp.json` |

## Suggested skills

- **caveman** — for ultra-concise communication if the agent is verbose
- **diagnose** — for structured debugging if the dissolve doesn't resolve the lag
- **impeccable** — for any follow-up UI polish (loading states during dissolve, etc.)
- **handoff** — if the work needs another handoff after this step

## Sensitive info

None. The GeoJSON file is public domain spatial data. No API keys or credentials appear in the discussed code paths. The `VITE_GEOAPIFY_API_KEY` is in `apps/web/.env` (not version-controlled).
