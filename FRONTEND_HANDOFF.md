# Handoff — FloodSense

## Project Overview

FloodSense is a flood susceptibility mapping PWA for Davao City, Philippines. It uses ensemble ML (Random Forest + XGBoost) to assess flood risk from 8 conditioning factors. The frontend is a React 19 SPA with TanStack Router, Leaflet maps, and Tailwind v4. **No server code lives in this repo** — it calls a separate FastAPI backend at `POST {VITE_SERVER_URL}/predict`.

---

## Current State (branch `feat/map-visualization`)

The app is fully functional with 3 routes:
- **`/`** — Map page: Leaflet map with Davao City boundary overlay, flood susceptibility GeoJSON overlay with legend, district quick-nav sidebar, landmark presets, location selection
- **`/result`** — Results page: model comparison (baseline RF vs ensemble), extracted conditioning factors, interpretation, recommendations
- **`/about`** — Technology explainer, disclaimers, use cases

GeoJSON overlay (`ensemble_map_davao_City.json`, ~53MB, UTM Zone 51N) is reprojected client-side to WGS84. Toggle button ("Susceptibility") at top-right controls visibility. Legend in bottom-right shows 4 DN classes (1=Very Low through 4=High). Hover tooltips show class label + range.

An untracked Gherkin spec (`flood_susceptibility_full.feature`) documents the overlay feature exhaustively.

---

## Key Architecture

### Routes (`apps/web/src/routes/`)
| File | Purpose |
|---|---|
| `__root.tsx` | Root layout: ThemeProvider, Toaster, devtools, grid layout |
| `index.tsx` | Home/map page — Leaflet map + sidebar + district nav + overlay |
| `result.tsx` | Prediction results — model comparison, factors, interpretation, recommendations |
| `about.tsx` | App information and technology explainer |

### Components (`apps/web/src/components/`)
| File | Purpose |
|---|---|
| `map.tsx` | Leaflet map with marker, boundary polygon, geolocation, reverse geocoding |
| `flood-susceptibility-overlay.tsx` | GeoJSON overlay orchestrator — layer, legend, toggle |
| `flood-susceptibility-controls.tsx` | Controls panel (opacity, class filter, export) — currently unused, replaced by toggle |
| `loading-banner.tsx` | Spinner overlay for GeoJSON fetch |
| `error-banner.tsx` | Error display with retry for GeoJSON fetch |
| `factor-inspection-panel.tsx` | Right sidebar / mobile bottom sheet for extracted factor inspection |
| `model-comparison.tsx` | Baseline RF vs Ensemble comparison cards with inside-ensemble breakdown |
| `extracted-factors.tsx` | Grid of 8 extracted conditioning factors with formatted values |
| `interpretation.tsx` | Plain-language risk interpretation with risk level pill |
| `factor-analysis.tsx` | Regional context disclaimer card |
| `risk-gauge.tsx` | Bold percentage + risk level badge + legend grid (currently unused in result page) |
| `header.tsx` | Simple nav header |
| `loader.tsx` | Minimal spinner for route transitions |
| `theme-provider.tsx` | next-themes wrapper |
| `mode-toggle.tsx` | Dark/light/system toggle |
| `ui/` | shadcn/ui components: badge, button, card, checkbox, dropdown-menu, input, label, skeleton, sonner |

### Lib (`apps/web/src/lib/`)
| File | Purpose |
|---|---|
| `api.ts` | Axios client, `predictFloodRisk()` POST to `/predict`, `FloodPredictionResponse` type |
| `risk-color.ts` | Risk level thresholds (Very Low–High), solid/tint background classes |
| `flood-susceptibility.ts` | DN class definitions, colors, labels, opacity constants |
| `factor-labels.ts` | 8 factor labels, units, formatting (scientific notation for curvature, categorical badge for LULC/Lithology) |
| `landmarks.ts` | Loader for `public/landmarks.json` — district landmark presets |
| `reverse-geocode.ts` | Geoapify reverse geocoding API client |
| `utm-converter.ts` | UTM Zone 51N → WGS84 coordinate converter |
| `utils.ts` | `cn()` — clsx + tailwind-merge utility |

### Hooks (`apps/web/src/hooks/`)
| File | Purpose |
|---|---|
| `use-flood-susceptibility.ts` | Fetch GeoJSON, UTM→WGS84 transform, compute stats, retry |

### Static Data (`apps/web/public/`)
| File | Purpose |
|---|---|
| `final_davao_city_boundary.geojson` | Davao City polygon boundary (UTM → WGS84 on load) |
| `davao_city_boundary.geojson` | Simpler boundary |
| `ensemble_map_davao_City.json` | ~53MB classified polygon overlay (UTM coords) |
| `ensemble_map_davao_City.geojson` | Same data in .geojson format |
| `districts.json` | District centroids for quick-nav |
| `landmarks.json` | Curated landmarks per district for demo cross-validation |
| `regions.json` | Region data |
| `logo.png` | PWA icon source |

### Gherkin Specs (project root)
| File | Purpose |
|---|---|
| `flood_susceptibility_full.feature` | Exhaustive spec for overlay, hook, controls, legend, styling, GeoJSON format (602 lines) |
| `gherkin-specs/factor_inspection_panel.feature` | Spec for factor inspection sidebar/bottom-sheet behavior (203 lines) |
| `district-landmarks.spec.md` | Spec for district landmark cross-validation points |
| `result-visual-hierarchy.spec.md` | Spec for result page layout, emphasis, scan path |

---

## How It Works

1. **User drops a pin** on the Leaflet map (or clicks a district/landmark in sidebar)
2. **Navigates to `/result?lat=...&lng=...`** — TanStack Router param validation via Zod
3. **`useQuery` fires `predictFloodRisk()`** → `POST {VITE_SERVER_URL}/predict` with `{ lat, lng }`
4. **Backend returns `FloodPredictionResponse`** with:
   - `baseline_rf` — standalone Random Forest prediction
   - `rf_inside_ensemble` / `xgb_inside_ensemble` — base learners within ensemble (optional)
   - `ensemble` — stacked RF+XGBoost prediction
   - `extracted_values` — 8 geospatial factor values
5. **Result page renders** model comparison cards, extracted factors grid, interpretation, recommendations

### API Types
```ts
interface FloodPredictionResponse {
  baseline_rf: ModelPrediction;
  rf_inside_ensemble?: ModelPrediction;
  xgb_inside_ensemble?: ModelPrediction;
  ensemble: ModelPrediction;
  extracted_values: ExtractedValues;
}

interface ModelPrediction {
  prediction: number;       // 0 or 1
  probability: number;      // 0–1
  risk_level: string;       // "Very Low" | "Low" | "Moderate" | "High"
  label: string;            // "Not Flooded" | "Flooded"
  override: boolean;
  override_reason: string | null;
}
```

### Risk Thresholds
| Probability | Risk Level | DN Class (Overlay) |
|---|---|---|
| 0–25% | Very Low | 1 |
| 25–50% | Low | 2 |
| 50–75% | Moderate | 3 |
| 75–100% | High | 4 |

---

## Configuration & Conventions

### Stack Versions
- Node: unspecified, uses pnpm 10.20.0
- React 19.2.3, TanStack Router 1.141.1, TanStack Query 5.90.12
- Tailwind CSS 4.0.15, shadcn/ui (base-lyra style), lucide-react 0.473
- Leaflet 1.9.4, Vite 6.2.2, Turborepo 2.6.3
- TypeScript 5 (strict, Bundler module resolution, verbatimModuleSyntax)

### CSS
- Tailwind v4: `@import "tailwindcss"` (no `@tailwind` directives)
- `@theme inline` block defines custom CSS variables from oklch tokens
- `@layer base` for global resets
- Custom `.flood-*` classes for Leaflet tooltip/popup/overlay styling
- Dark mode via `.dark` class, `next-themes` `ThemeProvider`

### Paths
- `@/` → `apps/web/src/`
- `routeTree.gen.ts` is auto-generated — **do not edit**

### Dev
```bash
pnpm install
pnpm run dev        # turbo dev → apps/web on port 3001
pnpm run dev:web    # turbo -F web dev
pnpm run check-types  # tsc --noEmit per package
pnpm run build      # turbo build
```

### Env (`apps/web/.env`)
```
VITE_SERVER_URL=http://127.0.0.1:8000
VITE_GEOAPIFY_API_KEY=<key>
```

---

## Design System

- **Brand**: Ocean Teal `oklch(0.55 0.14 195)` — single accent, <10% screen coverage
- **Typography**: Inter Variable, 3 functional sizes (title/body/label) + 1 display
- **Shadows**: Card Rest `0 4px 24px oklch(0 0 0 / 0.06)`
- **Risk colors**: Emerald (Low), Amber (Moderate), Orange (High), Rose (Very High) — never only red/green
- **Design doc**: `DESIGN.md` — full design system with do's/don'ts
- **Product doc**: `PRODUCT.md` — brand personality, anti-references, users

---

## Key Design Decisions

1. **Map is the interface** — sidebar supports map, not vice versa
2. **Interpret, don't expose** — users see plain-language risk assessment, not raw ML metrics
3. **No server code** — backend is a separate FastAPI service
4. **GeoJSON fetched at runtime** from `public/` — 53MB overlay is a known perf bottleneck
5. **UTM→WGS84 reprojection client-side** — source GeoJSON is in UTM Zone 51N
6. **`header.tsx` is commented out in `__root.tsx`** — the Header component exists but is unused; the index route has its own inline header
7. **`risk-gauge.tsx` exists but is unused** — the result page renders `ModelComparison` instead
8. **TanStack Router v1** (file-based) — v2 migration may be needed eventually

---

## Potential Problems / Known Issues

- **53MB GeoJSON** causes slow initial load (~5-10s). Mitigation: simplify via mapshaper, convert to vector tiles via tippecanoe, or host as tileserver-gl
- **Self-intersecting polygons** from raster-to-vector conversion (398k+ unrepaired intersections). Leaflet renders them without crashing but visual artifacts may appear
- **`FloodSusceptibilityControls` is mounted but unused** — overlay uses a simple toggle button instead. The controls panel has opacity slider, class filter chips, stats, and GeoJSON export
- **`header.tsx` is dead code** — commented out in root route
- **`risk-gauge.tsx` is dead code** — replaced by `ModelComparison` on result page
- **`mode-toggle.tsx` is also dead code** — Header is unused, so the dark mode toggle is unreachable

---

## Suggested Skills for Next Agent

- `impeccable` — refine the overlay legend, controls panel visuals, or result page layout
- `improve-codebase-architecture` — clean up dead components (Header, RiskGauge, ModeToggle, FloodSusceptibilityControls), consolidate map-related code
- `diagnose` — investigate the 53MB GeoJSON performance bottleneck
- `zoom-out` — if unfamiliar with project structure, get a high-level orientation first
- `tdd` — implement feature tests from the Gherkin spec files
