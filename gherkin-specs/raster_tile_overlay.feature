# =============================================================================
# Feature: Raster Tile Overlay (GDAL Pipeline — Path 1)
# File: gherkin-specs/raster_tile_overlay.feature
#
# Context
# -------
# The GeoJSON-based flood susceptibility overlay (ensemble_map_davao_City.json,
# ~53 MB) causes three critical rendering bugs at the current data scale:
#   1. Overlay floats visually on pan (Leaflet CSS-translates the canvas before
#      the redraw catches up)
#   2. Page freezes on zoom (Leaflet's viewreset fires a synchronous full
#      redraw of all features, blocking the main thread for several seconds)
#   3. Click-to-analyze is unresponsive while the canvas is drawing
#
# These are architectural limits of Leaflet + GeoJSON at ~196k features.
# Canvas renderer, chunked ingestion, and spatial indexing improve initial
# load but cannot fix Leaflet's internal synchronous pan/zoom redraw cycle.
#
# Solution
# --------
# Replace the GeoJSON layer with a PNG tile pyramid generated offline via GDAL.
# The browser fetches pre-rendered PNG images per zoom level — identical to how
# the OpenStreetMap base map works. Leaflet positions tiles natively, so:
#   - Pan: tiles slide with the map (no float)
#   - Zoom: a sharper pre-rendered tile swaps in (no freeze, no blur)
#   - Click: the base map receives events immediately (tiles are passive images)
#
# GDAL pipeline (one-time, run on the backend machine):
#   Step 1: gdal_rasterize  — GeoJSON DN values → classified GeoTIFF
#   Step 2: gdaldem          — apply 4-class color map to GeoTIFF
#   Step 3: gdal2tiles.py   — generate {z}/{x}/{y}.png pyramid (zoom 8–15)
#
# Output is committed to thesis-flood-susceptibility/static/tiles/ and served
# by FastAPI as static files at GET /static/tiles/{z}/{x}/{y}.png.
#
# Frontend migration
# ------------------
# flood-susceptibility-overlay.tsx:
#   REMOVE: L.geoJSON layer, GeoJSON fetch, reprojection, canvas config
#   ADD:    L.tileLayer pointing to /static/tiles/{z}/{x}/{y}.png
#   KEEP:   toggle button, legend, opacity handling
#
# Removed frontend artifacts (no longer needed):
#   - use-flood-susceptibility.ts (GeoJSON fetch + reproject hook)
#   - lib/geojson-cache.ts (IndexedDB + SW caching for GeoJSON)
#   - lib/utm-converter.ts (verify not used elsewhere before removing)
#   - lib/spatial-index.ts (rbush — not needed, tile layer is viewport-native)
#   - lib/chunk-scheduler.ts (chunked ingestion — not needed)
#   - hooks/use-viewport-features.ts (viewport culling hook — not needed)
#   - vite.config.ts mapshaper transform (no source file to process)
#   - public/ensemble_map_davao_City.json + .geojson (not served to browser)
#   - gherkin-specs/geojson_overlay_cache.feature (superseded by this spec)
#   - gherkin-specs/progressive_rendering.feature (superseded by this spec)
#
# Kept frontend artifacts:
#   - Susceptibility toggle button (now controls L.tileLayer visibility)
#   - Legend component (colors match color.txt exactly — hardcoded)
#   - City boundary outline (separate layer, unaffected)
#   - map.tsx preferCanvas: true (harmless, keep)
#   - District nav, landmark presets, marker, /predict flow (unaffected)
# =============================================================================

@raster-tiles @performance @gdal
Feature: Raster PNG tile overlay replacing GeoJSON layer

  # ===========================================================================
  # PART 1 — GDAL OFFLINE PIPELINE (backend / preprocessing)
  # ===========================================================================

  @gdal @preprocessing @offline
  Feature: GDAL tile generation pipeline

    Background:
      Given GDAL is installed and available on the backend machine
      And the source file "static/ensemble_map_davao_City.geojson" exists
      And the source GeoJSON contains a "DN" integer property on every feature
      And DN values are: 1 (Very Low), 2 (Low), 3 (Moderate), 4 (High)
      And the output directory "static/tiles/" exists or is created before running

    # -------------------------------------------------------------------------
    # Step 1 — Rasterize
    # -------------------------------------------------------------------------

    @gdal @step-1-rasterize
    Scenario: GeoJSON is rasterized to a classified single-band GeoTIFF
      When the following command is run from the "static/" directory:
        """
        gdal_rasterize \
          -a DN \
          -tr 30 30 \
          -ot Byte \
          -a_nodata 0 \
          -of GTiff \
          ensemble_map_davao_City.geojson \
          ensemble_classified.tif
        """
      Then "ensemble_classified.tif" is created in "static/"
      And it is a single-band GeoTIFF with dtype Byte (uint8)
      And pixel values are exactly {0, 1, 2, 3, 4} — 0 meaning NoData
      And the spatial resolution is 30m × 30m (matching the source rasters)
      And the CRS is EPSG:4326 (WGS84) since the GeoJSON is already reprojected
      And the extent covers the full bounding box of the input GeoJSON features

    @gdal @step-1-rasterize
    Scenario: NoData pixels are transparent in downstream output
      Given "ensemble_classified.tif" has been generated
      Then pixels with value 0 (NoData) must map to fully transparent PNG pixels
      And areas outside Davao City's data coverage show the base map through

    @gdal @step-1-rasterize
    Scenario: Rasterize uses nearest-neighbour to avoid interpolating class values
      Given the "-tr 30 30" resolution flag is set
      Then GDAL uses nearest-neighbour resampling (default for gdal_rasterize)
      And class boundary pixels are not blended between two DN classes
      And pixel values remain integer {1, 2, 3, 4} — no fractional values appear

    # -------------------------------------------------------------------------
    # Step 2 — Colorize
    # -------------------------------------------------------------------------

    @gdal @step-2-colorize
    Scenario: A 4-class color map file is created before colorizing
      Given a plain text file "static/color.txt" is created with contents:
        """
        0   0   0   0   0
        1   0 180  80 178
        2 255 200   0 178
        3 255 140   0 178
        4 210  40  40 178
        """
      Then the format is: "DN_value R G B Alpha" (space-separated)
      And DN=0 maps to fully transparent (Alpha=0) for NoData pixels
      And DN=1 (Very Low) maps to green   rgba(0,   180, 80,  178)
      And DN=2 (Low)      maps to yellow  rgba(255, 200, 0,   178)
      And DN=3 (Moderate) maps to orange  rgba(255, 140, 0,   178)
      And DN=4 (High)     maps to red     rgba(210, 40,  40,  178)
      And Alpha=178 (~70% opacity) so the base map shows through the overlay

    @gdal @step-2-colorize
    Scenario: Classified GeoTIFF is colorized to an RGBA GeoTIFF
      When the following command is run from "static/":
        """
        gdaldem color-relief \
          -alpha \
          ensemble_classified.tif \
          color.txt \
          ensemble_colored.tif
        """
      Then "ensemble_colored.tif" is created in "static/"
      And it is a 4-band RGBA GeoTIFF
      And each pixel's color corresponds to its DN class per color.txt
      And NoData pixels (DN=0) are fully transparent (Alpha=0)
      And the file is in EPSG:4326

    @gdal @step-2-colorize
    Scenario: Colors in color.txt match the existing frontend legend exactly
      Given the frontend legend in "lib/flood-susceptibility.ts" defines:
        | DN | Label    | Hex color |
        | 1  | Very Low | #00B450   |
        | 2  | Low      | #FFC800   |
        | 3  | Moderate | #FF8C00   |
        | 4  | High     | #D22828   |
      Then the RGB values in color.txt are derived from the same hex values
      And the legend component does NOT need to change after this migration

    # -------------------------------------------------------------------------
    # Step 3 — Tile generation
    # -------------------------------------------------------------------------

    @gdal @step-3-tiles
    Scenario: PNG tile pyramid is generated from the colored GeoTIFF
      When the following command is run from "static/":
        """
        gdal2tiles.py \
          --zoom=8-15 \
          --resampling=near \
          --processes=4 \
          --webviewer=none \
          ensemble_colored.tif \
          tiles/
        """
      Then "static/tiles/" is populated with subdirectories 8/ through 15/
      And each subdirectory contains column folders with {y}.png tile files
      And every .png tile is 256×256 pixels with RGBA channels
      And tiles outside the Davao City extent are either absent or fully transparent
      And the "--webviewer=none" flag suppresses generation of HTML viewer files

    @gdal @step-3-tiles
    Scenario: Zoom level 8 covers the entire city in a small number of tiles
      Given the tile pyramid has been generated
      Then zoom level 8 contains <= 9 tiles covering Davao City's extent
      And each tile at zoom 8 is visually identifiable as a city-scale overview

    @gdal @step-3-tiles
    Scenario: Zoom level 15 provides street-level detail without blur
      Then zoom level 15 tiles resolve individual classification cells
      And no interpolation artifacts appear between adjacent DN class regions
      And cell boundaries are crisp (nearest-neighbour resampling preserves edges)

    @gdal @step-3-tiles
    Scenario: Tile generation uses nearest-neighbour resampling
      Given "--resampling=near" is specified
      Then class boundary pixels are not blended between DN classes at any zoom
      And pixel values in every tile remain visually aligned to the 4 DN classes
      And no "grey fringe" artifacts appear at classification boundaries

    @gdal @step-3-tiles
    Scenario: Tile pyramid total size is within acceptable bounds
      Given zoom levels 8–15 are generated
      Then the total size of "static/tiles/" is < 200 MB
      # Typical output for a classified single-class raster at this extent
      # is 50–150 MB. If it exceeds 200 MB, reduce max zoom to 14.

    # -------------------------------------------------------------------------
    # Pipeline management
    # -------------------------------------------------------------------------

    @gdal @pipeline
    Scenario: The full pipeline is scripted as a single repeatable shell script
      Given a file "scripts/generate_tiles.sh" exists at the project root
      Then running "bash scripts/generate_tiles.sh" from the project root:
        | Step | Action                                                    |
        | 1    | Validates that GDAL is installed (gdal_rasterize --version)|
        | 2    | Validates that source GeoJSON exists                      |
        | 3    | Runs gdal_rasterize to produce ensemble_classified.tif    |
        | 4    | Writes color.txt                                          |
        | 5    | Runs gdaldem color-relief to produce ensemble_colored.tif |
        | 6    | Runs gdal2tiles.py to produce static/tiles/               |
        | 7    | Removes intermediate files (classified.tif, colored.tif)  |
        | 8    | Prints total tile count and directory size                 |
      And intermediate GeoTIFF files are cleaned up after tile generation
      And the script is idempotent (safe to run again — overwrites existing tiles)

    @gdal @pipeline
    Scenario: Tile output is committed to git or documented as a build artifact
      Given "static/tiles/" has been generated
      Then either:
        | Option A | tiles/ is committed to git as a static asset              |
        | Option B | tiles/ is listed in .gitignore and generated in CI/CD     |
      And the chosen option is documented in the project README
      And the pipeline is NOT run on every FastAPI startup or Vite build


  # ===========================================================================
  # PART 2 — FASTAPI STATIC FILE SERVING (backend)
  # ===========================================================================

  @fastapi @backend
  Feature: FastAPI serves the tile pyramid as static files

    Background:
      Given the tile pyramid exists at "static/tiles/"
      And FastAPI mounts the static directory via "StaticFiles"

    @fastapi @static-serving
    Scenario: Tile endpoint responds correctly to a valid tile request
      When a GET request is made to "/static/tiles/12/3234/1821.png"
      Then the response status is 200
      And the Content-Type is "image/png"
      And the response body is a valid 256×256 RGBA PNG image
      And Cache-Control header is "public, max-age=31536000, immutable"

    @fastapi @static-serving
    Scenario: Tile endpoint returns 404 for tiles outside data coverage
      Given a tile coordinate that falls outside Davao City's extent
      When a GET request is made to "/static/tiles/12/9999/9999.png"
      Then the response status is 404
      And Leaflet silently skips missing tiles (default behavior — no error shown)

    @fastapi @static-serving
    Scenario: Cache-Control headers enable long-term browser caching
      Given tiles are static and change only when the pipeline is re-run
      Then every tile response includes "Cache-Control: public, max-age=31536000, immutable"
      And the browser caches individual tiles indefinitely until the URL changes
      And re-visiting the map fetches only new/uncached tiles from the server

    @fastapi @static-serving
    Scenario: CORS headers allow the frontend origin to fetch tiles
      Given the frontend runs at a different origin in development
      Then tile responses include "Access-Control-Allow-Origin: *"
      And Leaflet can fetch tiles from the FastAPI server without CORS errors

    @fastapi @static-serving
    Scenario: Existing /predict and /health endpoints are unaffected
      Given the static file mount is added to app/main.py
      Then "POST /predict" continues to function as before
      And "GET /health" continues to return {"status": "ok"}
      And no existing routes are shadowed by the static file mount


  # ===========================================================================
  # PART 3 — FRONTEND MIGRATION (React / Leaflet)
  # ===========================================================================

  @frontend @migration
  Feature: Frontend tile layer replaces GeoJSON overlay

    Background:
      Given the app is running at "/"
      And VITE_SERVER_URL is set to the FastAPI backend URL
      And the Leaflet map is mounted

    # -------------------------------------------------------------------------
    # Component migration
    # -------------------------------------------------------------------------

    @frontend @component
    Scenario: flood-susceptibility-overlay.tsx uses L.tileLayer instead of L.geoJSON
      Given the component previously created an L.geoJSON layer
      When the component mounts with "isVisible: true"
      Then it creates an "L.tileLayer" with URL template:
        """
        ${VITE_SERVER_URL}/static/tiles/{z}/{x}/{y}.png
        """
      And the tile layer is added to the Leaflet map
      And NO GeoJSON fetch is initiated
      And NO UTM→WGS84 reprojection is performed
      And NO canvas renderer configuration is applied to the overlay

    @frontend @component
    Scenario: Removed dependencies are no longer imported
      Given the migration is complete
      Then "flood-susceptibility-overlay.tsx" does NOT import:
        | Module                          |
        | use-flood-susceptibility        |
        | lib/geojson-cache               |
        | lib/utm-converter               |
        | lib/spatial-index               |
        | lib/chunk-scheduler             |
        | hooks/use-viewport-features     |
      And the component file size is significantly smaller than the GeoJSON version

    @frontend @component
    Scenario: Tile layer opacity is configurable and matches legend intent
      Given the tile layer is created
      Then "opacity" is set to 0.7 (matching Alpha=178 in color.txt)
      And the base map labels and roads are visible through the overlay
      And changing the opacity constant in one place updates both tile and legend

    @frontend @component
    Scenario: Tile layer bounds are constrained to Davao City extent
      Given the tile layer is created
      Then the "bounds" option is set to the Davao City bounding box:
        """
        L.latLngBounds([6.0, 125.0], [7.5, 126.0])
        """
      And Leaflet does not request tiles outside this extent
      And the tile layer does not cover areas outside Davao City

    # -------------------------------------------------------------------------
    # Toggle behavior
    # -------------------------------------------------------------------------

    @frontend @toggle
    Scenario: Susceptibility toggle shows and hides the tile layer
      Given the tile layer is added to the map
      When the user clicks the "Susceptibility" toggle button to hide
      Then the tile layer is removed from the map (or opacity set to 0)
      And base map tiles are fully visible with no overlay
      When the user clicks the toggle again to show
      Then the tile layer is re-added to the map
      And overlay tiles appear immediately with no loading delay

    @frontend @toggle
    Scenario: Toggle button has no loading/disabled state (tiles load instantly)
      Given the tile layer URL is configured
      When the component mounts
      Then the "Susceptibility" toggle button is immediately enabled
      And there is NO loading spinner on the toggle button
      And there is NO loading banner over the map
      # Unlike the GeoJSON approach, there is no async fetch to wait for.
      # Individual tile images load progressively in the background.

    @frontend @toggle
    Scenario: Toggle state persists correctly across map interactions
      Given the overlay is visible (toggle is ON)
      When the user pans the map
      Then the overlay remains visible and correctly repositioned
      When the user zooms in
      Then sharper tiles load for the new zoom level
      And the toggle state remains ON without any manual intervention

    # -------------------------------------------------------------------------
    # Performance — the core requirement
    # -------------------------------------------------------------------------

    @frontend @performance
    Scenario: Pan does not cause the overlay to float
      Given the tile layer is visible
      When the user pans the map in any direction
      Then the overlay tiles move synchronously with the base map tiles
      And there is no visible lag or float between the base map and the overlay
      And no canvas redraw loop is triggered on pan

    @frontend @performance
    Scenario: Zoom does not freeze the page
      Given the tile layer is visible
      When the user zooms in or out (mouse wheel, pinch, or +/- buttons)
      Then the page remains responsive throughout the zoom animation
      And the main thread is NOT blocked
      And clicking the map immediately after zooming works without delay

    @frontend @performance
    Scenario: Click-to-analyze works immediately regardless of tile load state
      Given the tile layer is visible but some tiles are still loading
      When the user clicks a location on the map
      Then the pin drops immediately (within one frame)
      And the /predict request fires immediately
      And partially loaded tile images do NOT block the click event

    @frontend @performance
    Scenario: Individual tile images load progressively without blocking the UI
      Given the user navigates to a new area
      When Leaflet requests new tiles for the current viewport
      Then each tile loads independently as its HTTP response arrives
      And tiles that have loaded are visible immediately
      And tiles still loading show the base map through (transparent placeholder)
      And the map remains pannable and zoomable while tiles are in flight

    @frontend @performance
    Scenario: Tile images are cached by the browser after first load
      Given a tile has been loaded once (HTTP 200, Cache-Control: immutable)
      When the user pans away and back to the same area
      Then the tile is served from the browser HTTP cache (no network request)
      And it appears instantly without a loading flash

    # -------------------------------------------------------------------------
    # Legend
    # -------------------------------------------------------------------------

    @frontend @legend
    Scenario: Legend colors match the tile colors exactly
      Given the legend component renders 4 class swatches
      Then the swatch colors are:
        | DN | Label    | Color                  |
        | 4  | High     | rgba(210, 40,  40, 0.7)|
        | 3  | Moderate | rgba(255, 140, 0,  0.7)|
        | 2  | Low      | rgba(255, 200, 0,  0.7)|
        | 1  | Very Low | rgba(0,   180, 80, 0.7)|
      And these values are sourced from a single constant shared by color.txt generation and the legend component

    @frontend @legend
    Scenario: Legend is visible as soon as the map mounts
      Given the tile layer is configured
      When the component mounts
      Then the legend renders immediately (not gated on any data fetch)

    # -------------------------------------------------------------------------
    # Removed code cleanup
    # -------------------------------------------------------------------------

    @frontend @cleanup
    Scenario: Dead code is removed after migration
      Given the migration to tile layer is complete
      Then the following files are deleted:
        | File                                       | Reason                          |
        | apps/web/src/hooks/use-flood-susceptibility.ts | GeoJSON fetch hook — obsolete |
        | apps/web/src/lib/geojson-cache.ts          | IndexedDB GeoJSON cache — obsolete|
        | apps/web/src/lib/spatial-index.ts          | rbush index — obsolete          |
        | apps/web/src/lib/chunk-scheduler.ts        | Chunked ingestion — obsolete    |
        | apps/web/src/hooks/use-viewport-features.ts| Viewport culling hook — obsolete|
      And the following files are verified before deleting:
        | File                                       | Check                           |
        | apps/web/src/lib/utm-converter.ts          | Not imported anywhere else      |
      And the following public assets are removed from apps/web/public/:
        | File                               | Reason                              |
        | ensemble_map_davao_City.json       | No longer fetched by frontend       |
        | ensemble_map_davao_City.geojson    | No longer fetched by frontend       |
      And "vite.config.ts" has the mapshaper transform block removed
      And "pnpm check-types" passes with zero errors after cleanup

    @frontend @cleanup
    Scenario: Service Worker cache spec scope is updated
      Given "gherkin-specs/geojson_overlay_cache.feature" previously targeted the 53MB GeoJSON
      Then it is either deleted or amended to note it is superseded by this spec
      And the SW implementation (if already built) is updated to remove the geojson cache route
      And the SW continues to cache other assets (app shell, JS bundles) as before


  # ===========================================================================
  # PART 4 — END-TO-END USER FLOW VERIFICATION
  # ===========================================================================

  @e2e
  Feature: Verified user flows after raster tile migration

    @e2e @pan
    Scenario: Open map → overlay ON → pan → no float
      Given the user opens "/" with the overlay visible by default
      When the user pans the map in any direction
      Then the overlay moves with the base map in sync
      And no floating or misalignment is visible at any point during the pan

    @e2e @zoom
    Scenario: Open map → overlay ON → zoom → no freeze
      Given the user opens "/" with the overlay visible
      When the user zooms in from level 10 to level 14 using the scroll wheel
      Then the page remains interactive throughout
      And each zoom step completes within 200 ms
      And the user can immediately click a location after zooming

    @e2e @analyze
    Scenario: Open map → overlay ON → click location → result page
      Given the overlay is visible
      When the user clicks a map location
      Then the pin drops immediately
      And the "Analyze Location" button becomes active
      And clicking it navigates to "/result?lat=...&lng=..."
      And the result page renders the prediction without errors
      And the overlay's visual risk classification for that area matches the result page risk level

    @e2e @toggle
    Scenario: Open map → overlay ON → toggle OFF → pan → toggle ON → tiles reappear
      Given the overlay is visible
      When the user toggles it off
      Then the overlay disappears immediately
      When the user pans to a new area
      And toggles the overlay back on
      Then tiles for the new viewport load and appear within 1 s
      And previously cached tiles appear instantly

    @e2e @zoom-detail
    Scenario: Zoom to street level shows crisp classification boundaries
      Given the user zooms to level 14 or 15
      Then overlay tiles load for the current viewport
      And classification cell boundaries are crisp (not blurred)
      And the base map street names and roads are readable through the overlay
      And the legend colors correctly identify each visible region
