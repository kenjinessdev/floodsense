# =============================================================================
# Feature: Progressive Rendering — Map Interaction & Overlay
# File: gherkin-specs/progressive_rendering.feature
#
# Context
# -------
# The flood susceptibility overlay (ensemble_map_davao_City_dissolved.json)
# renders ~196k polygon features (pre-dissolve) or ~4 DN-class regions
# (post-dissolve) onto a Leaflet Canvas. Even with canvas renderer +
# interactive:false applied, the full paint on mount blocks the main thread
# long enough to make clicks and pans feel frozen until rendering is done.
#
# Two distinct rendering problems exist:
#
# Problem A — Overlay initial paint
#   All features are handed to Leaflet in one synchronous call. The canvas
#   redraws the entire layer on every pan/zoom, traversing all features even
#   those outside the viewport.
#
# Problem B — Map interaction during overlay load
#   While the GeoJSON is being fetched, reprojected, and added to the map,
#   the main thread is blocked. Clicking to drop a pin and trigger /predict
#   is unresponsive until the overlay is fully settled.
#
# Solution strategy
# -----------------
# 1. Chunked feature ingestion   — add features to the canvas layer in
#    batches, yielding to the browser between each batch so interaction
#    events are never queued behind a multi-second synchronous paint.
#
# 2. Viewport culling            — on each pan/zoom, only the features whose
#    bounding boxes intersect the current map bounds are drawn. Out-of-view
#    features are skipped without removing them from memory.
#
# 3. Spatial index (rbush)       — an in-memory R-tree over feature bounding
#    boxes makes viewport queries O(log n) instead of O(n). Built once after
#    chunked ingestion completes; invalidated when the overlay data changes.
#
# 4. Zoom-based Level of Detail  — at low zoom levels (city overview), the
#    dissolved 4-region layer is shown. At high zoom levels (neighbourhood),
#    the full-resolution cell layer is optionally swapped in. This is
#    independent of the dissolve preprocessing — it drives which data slice
#    the renderer uses at runtime.
#
# 5. Map-level isolation         — the base Leaflet map (tiles, marker,
#    boundary) must remain fully interactive at all times, completely
#    independent of the overlay's render state.
#
# Scope
# -----
# This spec covers:
#   - apps/web/src/hooks/use-flood-susceptibility.ts   (chunk scheduling)
#   - apps/web/src/lib/spatial-index.ts                (rbush wrapper)
#   - apps/web/src/components/flood-susceptibility-overlay.tsx (renderer)
#   - apps/web/src/components/map.tsx                  (map isolation)
#   - apps/web/src/hooks/use-viewport-features.ts      (culling hook, new)
# =============================================================================

@progressive-rendering @performance
Feature: Progressive chunked rendering of the map and overlay

  Background:
    Given the app is running at "/"
    And the Leaflet map is mounted with "preferCanvas: true"
    And the overlay GeoJSON has been resolved (from memory, IndexedDB, or network)
    And the overlay Canvas layer uses "L.canvas()" renderer with "interactive: false"
    And CHUNK_SIZE is configured to 500 features per batch
    And CHUNK_DELAY_MS is configured to 0 ms (setTimeout with 0 yields to the browser event loop)


  # ===========================================================================
  # MAP ISOLATION — base map always interactive, regardless of overlay state
  # ===========================================================================

  @map @isolation @priority-1
  Scenario: Base map is interactive before overlay rendering begins
    Given the overlay GeoJSON has not yet resolved
    When the map page mounts
    Then the Leaflet tile layer is visible and pannable
    And the user can click anywhere on the base map to drop a pin
    And the "Analyze Location" flow can be triggered immediately
    And NO loading state on the overlay blocks map click events

  @map @isolation @priority-1
  Scenario: Base map remains interactive while overlay chunks are being ingested
    Given chunk ingestion has started (batch 1 of N is being added)
    When the user clicks a location on the map during ingestion
    Then the click event is NOT delayed or queued behind the current batch
    And the pin drops immediately (within one frame)
    And the /predict API call fires without waiting for ingestion to complete
    And ingestion continues in the background after the click

  @map @isolation @priority-1
  Scenario: Base map pan and zoom work during overlay chunk ingestion
    Given chunk ingestion is in progress (e.g. batch 12 of 40)
    When the user pans the map
    Then the tile layer re-renders immediately
    And the partially ingested overlay canvas tiles update to the new viewport
    And the next scheduled batch still executes after the pan settles
    And no jank or frame drop > 16 ms occurs on the map tile layer

  @map @isolation
  Scenario: Marker placement and sidebar are independent of overlay render state
    Given the overlay is still being ingested
    When the user places a marker via the district quick-nav sidebar
    Then the map flies to the selected district centroid immediately
    And the marker is placed without waiting for overlay ingestion to finish


  # ===========================================================================
  # CHUNKED FEATURE INGESTION — overlay
  # ===========================================================================

  @overlay @chunked-ingestion @unit
  Scenario: Features are added to the canvas layer in discrete batches
    Given the resolved GeoJSON FeatureCollection has N features
    When ingestion starts
    Then features are processed in sequential batches of CHUNK_SIZE
    And between each batch, "await new Promise(r => setTimeout(r, CHUNK_DELAY_MS))" yields control
    And the total number of batches is Math.ceil(N / CHUNK_SIZE)
    And after all batches complete, the canvas layer contains exactly N features

  @overlay @chunked-ingestion @unit
  Scenario: First batch renders within one animation frame of data resolving
    Given the GeoJSON has resolved from cache (fast path)
    When ingestion starts
    Then batch 1 (features 0–499) is added to the canvas layer synchronously
    And the overlay is partially visible on screen within 16 ms
    And subsequent batches are scheduled asynchronously

  @overlay @chunked-ingestion @unit
  Scenario: Ingestion is cancellable when the overlay is toggled off mid-load
    Given ingestion is in progress (batch 5 of 40)
    When the user clicks the "Susceptibility" toggle to hide the overlay
    Then the current batch completes (no mid-batch cancellation)
    And all remaining scheduled batches are cancelled (AbortController or cancelled flag)
    And the canvas layer is cleared
    And no further setTimeout callbacks fire for this ingestion run

  @overlay @chunked-ingestion @unit
  Scenario: Re-toggling the overlay restarts ingestion from batch 1
    Given ingestion was cancelled at batch 5 of 40
    When the user clicks the "Susceptibility" toggle again to show the overlay
    Then a new ingestion sequence starts from the beginning
    And the progress indicator resets to 0%

  @overlay @chunked-ingestion @unit
  Scenario: Ingestion progress is tracked and exposed to the UI
    Given ingestion is running
    Then the hook exposes a "renderProgress" value between 0.0 and 1.0
    And it updates after each batch: renderProgress = batchesCompleted / totalBatches
    And it reaches exactly 1.0 when the final batch completes
    And it resets to 0.0 when ingestion is cancelled or restarted

  @overlay @chunked-ingestion @integration
  Scenario: CHUNK_SIZE is tunable without code changes
    Given CHUNK_SIZE is defined in a single configuration constant
    Then changing CHUNK_SIZE from 500 to 200 does not require changes to any component
    And the new chunk size takes effect on the next ingestion run
    # Implementation note: expose via a config object in flood-susceptibility.ts


  # ===========================================================================
  # SPATIAL INDEX — rbush R-tree
  # ===========================================================================

  @spatial-index @unit
  Scenario: Spatial index is built once after ingestion completes
    Given all N features have been ingested into the canvas layer
    When ingestion finishes (renderProgress = 1.0)
    Then "buildSpatialIndex(features)" is called exactly once
    And the resulting rbush tree is stored in "lib/spatial-index.ts" module scope
    And the index is NOT rebuilt on every pan or zoom event

  @spatial-index @unit
  Scenario: Spatial index is built from feature bounding boxes, not full geometry
    Given feature geometries may be complex polygons
    When the index is built
    Then each entry in the rbush tree contains only:
      | field  | value                          |
      | minX   | westernmost longitude of bbox  |
      | minY   | southernmost latitude of bbox  |
      | maxX   | easternmost longitude of bbox  |
      | maxY   | northernmost latitude of bbox  |
      | id     | feature index reference        |
    And full polygon geometry is NOT stored in the rbush tree (memory efficiency)

  @spatial-index @unit
  Scenario: Viewport query returns only features intersecting current bounds
    Given the spatial index is built
    And the current map bounds are {north, south, east, west}
    When "queryViewport(bounds)" is called
    Then it returns only feature IDs whose bboxes intersect the viewport bounds
    And the query completes in < 5 ms for up to 200k indexed features
    And features entirely outside the viewport are excluded

  @spatial-index @unit
  Scenario: Spatial index is invalidated and rebuilt when overlay data changes
    Given the spatial index exists for the current GeoJSON version
    When a new GeoJSON version is loaded (GEOJSON_CONTENT_HASH changed)
    Then the existing index is cleared from module scope
    And a new index is built after the new data's ingestion completes

  @spatial-index @unit
  Scenario: Spatial index build is deferred to an idle callback
    Given ingestion has just completed
    When "buildSpatialIndex()" is scheduled
    Then it runs inside "requestIdleCallback()" (or setTimeout fallback for Safari)
    So that index build does not compete with the post-ingestion canvas repaint


  # ===========================================================================
  # VIEWPORT CULLING — only draw visible features
  # ===========================================================================

  @viewport-culling @integration
  Scenario: Canvas layer only draws features visible in the current viewport
    Given the spatial index is built
    And the current viewport shows approximately 15% of Davao City's extent
    When the canvas redraws (pan or zoom event)
    Then only features returned by "queryViewport(currentBounds)" are drawn
    And features outside the viewport are skipped in the draw loop
    And the number of canvas draw calls is proportional to viewport coverage, not total feature count

  @viewport-culling @integration
  Scenario: Culling query is debounced during continuous pan gestures
    Given the user is actively panning (touchmove or mousemove)
    Then the viewport query fires at most once per animation frame (rAF-throttled)
    And NOT on every pixel of movement

  @viewport-culling @integration
  Scenario: Culling does not remove features from memory
    Given viewport culling is active
    When the user pans away from an area so its features are culled
    Then those features remain in the in-memory feature set
    And panning back shows them immediately without re-fetching or re-ingesting

  @viewport-culling @integration
  Scenario: Full-extent draw is used when spatial index is not yet built
    Given ingestion is still in progress and the spatial index has not been built
    When the canvas redraws
    Then ALL currently ingested features are drawn (no culling attempted)
    And a "culling unavailable: index not ready" debug log is emitted in dev mode

  @viewport-culling @hook
  Scenario: useViewportFeatures hook encapsulates culling logic
    Given "use-viewport-features.ts" is a standalone hook
    When called with "(allFeatures, spatialIndex, mapBounds)"
    Then it returns the subset of features visible in mapBounds
    And it re-evaluates when mapBounds changes (Leaflet "moveend" event)
    And it returns all features when spatialIndex is null (safe fallback)


  # ===========================================================================
  # ZOOM-BASED LEVEL OF DETAIL
  # ===========================================================================

  @lod @integration
  Scenario: Dissolved 4-region layer is shown at low zoom (city overview)
    Given the map zoom level is <= LOD_BREAKPOINT (default: 12)
    Then the overlay renders the dissolved FeatureCollection (4 DN-class regions)
    And the canvas draw call count is <= 4 per frame

  @lod @integration
  Scenario: Full-resolution cell layer is available at high zoom (neighbourhood detail)
    Given the map zoom level is > LOD_BREAKPOINT
    And the full-resolution GeoJSON has been loaded (from cache)
    Then the overlay switches to the full-resolution layer
    And viewport culling limits visible features to the zoomed-in area
    And the effective draw call count remains low due to culling

  @lod @integration
  Scenario: LOD transition is smooth with no visible flash
    Given the user zooms from level 11 to level 13 (crossing LOD_BREAKPOINT)
    When the transition fires
    Then the dissolved layer is removed from the canvas
    And the full-resolution layer starts chunked ingestion for the current viewport
    And during the transition, the dissolved layer remains visible until the first chunk renders
    And there is no frame where the canvas is blank

  @lod @integration
  Scenario: LOD_BREAKPOINT is configurable without code changes
    Given LOD_BREAKPOINT is defined in "lib/flood-susceptibility.ts"
    Then changing it from 12 to 13 takes effect without modifying components
    And the new threshold applies on the next zoom event

  @lod @integration
  Scenario: LOD is disabled when only the dissolved layer is available
    Given the full-resolution GeoJSON has not been loaded (not yet cached)
    When the user zooms past LOD_BREAKPOINT
    Then the dissolved layer continues to be shown at all zoom levels
    And a subtle UI hint reads "Detailed view loads on next visit" (or similar)
    And no error state is triggered


  # ===========================================================================
  # LOADING UX — what users see during progressive render
  # ===========================================================================

  @ux @loading-states
  Scenario: Progress bar shows overlay ingestion progress
    Given overlay data has resolved and ingestion has started
    Then a thin progress bar appears at the top of the map (or bottom of overlay toggle)
    And it advances proportionally as batches complete (tied to "renderProgress")
    And it disappears (fades out) when renderProgress reaches 1.0

  @ux @loading-states
  Scenario: Overlay toggle button shows ingestion state visually
    Given ingestion is in progress
    Then the "Susceptibility" toggle button shows a subtle spinner or fill animation
    And the button remains clickable (to cancel ingestion if user changes mind)
    When ingestion completes
    Then the spinner disappears and the button returns to its default active state

  @ux @loading-states
  Scenario: No loading banner blocks the map during chunked ingestion
    Given ingestion is in progress
    Then the "loading-banner.tsx" full-screen spinner is NOT shown
    And the map remains fully visible and pannable beneath the partial overlay
    # The full-screen loading banner is only shown during GeoJSON fetch/reproject (Layer 1/2)
    # NOT during canvas ingestion (this feature)

  @ux @loading-states
  Scenario Outline: User perceives overlay as "appearing" not "popping in"
    Given CHUNK_SIZE is "<chunk_size>" and total features is "<total>"
    Then the first visible overlay pixels appear within "<first_paint>" of data resolving
    And the overlay is fully rendered within "<full_render>"

    Examples:
      | chunk_size | total   | first_paint | full_render |
      | 500        | 196000  | 16 ms       | ~4 s        |
      | 500        | 4       | 16 ms       | < 50 ms     |
      | 1000       | 196000  | 16 ms       | ~2 s        |

  @ux @loading-states
  Scenario: Partially rendered overlay is still useful (high-risk areas render first)
    Given features are sorted by DN descending (High → Very Low) before ingestion
    Then High susceptibility (DN=4) features appear in the first batches
    And the most safety-critical information is visible earliest
    And Low/Very Low features fill in afterward


  # ===========================================================================
  # INTERACTION RESPONSIVENESS — quantified targets
  # ===========================================================================

  @responsiveness @non-functional
  Scenario: Click-to-pin latency is unaffected by overlay render state
    Given the overlay is in any render state (not started / in progress / complete)
    When the user clicks a map location
    Then a pin appears within 100 ms of the click
    And the /predict request fires within 150 ms of the click

  @responsiveness @non-functional
  Scenario: Pan frame rate stays above 30 fps during chunk ingestion
    Given chunk ingestion is actively running
    When the user pans the map continuously
    Then the tile layer renders at >= 30 fps (frame time <= 33 ms)
    And individual batch additions do not produce frame spikes > 50 ms

  @responsiveness @non-functional
  Scenario: Pan frame rate stays above 50 fps after ingestion completes
    Given ingestion is complete and the spatial index is built
    And viewport culling is active
    When the user pans or zooms
    Then the canvas redraws at >= 50 fps (frame time <= 20 ms)
    And the Performance timeline shows no "Long Task" entries > 50 ms during pan


  # ===========================================================================
  # IMPLEMENTATION CONTRACTS
  # ===========================================================================

  @contract @unit
  Scenario: Chunk scheduler is a standalone, testable utility
    Given "lib/chunk-scheduler.ts" exports an "ingestInChunks()" function
    Then its signature is:
      """
      ingestInChunks(
        features: GeoJSON.Feature[],
        onBatch: (batch: GeoJSON.Feature[]) => void,
        options?: { chunkSize?: number; signal?: AbortSignal }
      ): Promise<void>
      """
    And it resolves when all batches complete
    And it rejects with AbortError if signal is aborted
    And it is testable with a mock "onBatch" callback without mounting Leaflet

  @contract @unit
  Scenario: Spatial index utility is a standalone, testable module
    Given "lib/spatial-index.ts" exports:
      | Export              | Type                                |
      | buildIndex(features)| (features: Feature[]) => RBush      |
      | queryBounds(tree, bounds) | (tree, bounds) => Feature[]   |
    Then both functions are pure (no side effects, no global state)
    And testable with synthetic GeoJSON fixtures

  @contract @unit
  Scenario: useViewportFeatures hook is unit-testable via React Testing Library
    Given the hook accepts "(features, index, bounds)" as arguments
    Then it can be tested with "renderHook()" without a mounted Leaflet map
    And synthetic bounds can be passed to verify culling logic in isolation

  @contract @integration
  Scenario: flood-susceptibility-overlay.tsx wires all pieces together
    Given the component receives "geojsonData" and "isVisible" props
    Then it:
      | Step | Action                                                        |
      | 1    | Calls "ingestInChunks()" when geojsonData arrives             |
      | 2    | Updates "renderProgress" state after each batch               |
      | 3    | Triggers index build via "requestIdleCallback" after step 1   |
      | 4    | Subscribes to Leaflet "moveend" to update viewport bounds     |
      | 5    | Passes current bounds to "useViewportFeatures" on each moveend|
      | 6    | Redraws the canvas with only the culled feature subset        |
    And each step is independently unit-testable via the contracts above
