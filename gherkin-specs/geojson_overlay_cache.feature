# =============================================================================
# Feature: Aggressive GeoJSON Overlay Caching
# File: gherkin-specs/geojson_overlay_cache.feature
#
# Context
# -------
# The flood susceptibility overlay (ensemble_map_davao_City.json) is ~53 MB of
# UTM Zone 51N polygon data that must be reprojected to WGS84 client-side before
# Leaflet can render it. On a cold load this takes 5–10 s on a fast connection
# and is effectively unusable on mobile data. FloodSense is a PWA, so we have
# access to the full browser storage stack: Cache API (via Service Worker),
# IndexedDB, and in-memory module scope.
#
# Caching layers (outermost → innermost)
# ----------------------------------------
# Layer 1 — Service Worker (Cache API)
#   Intercepts the HTTP fetch for /ensemble_map_davao_City.json and serves it
#   from the SW cache. Eliminates the 53 MB network round-trip on repeat visits.
#   Cache key is the URL; invalidation is driven by a CACHE_VERSION string baked
#   into the SW at build time (changes when the file changes).
#
# Layer 2 — IndexedDB (reprojected payload)
#   Stores the already-reprojected WGS84 FeatureCollection under a versioned key.
#   Eliminates the UTM→WGS84 transform cost (~1–2 s CPU) on every page reload.
#   Keyed by GEOJSON_CONTENT_HASH so stale reprojected data is never served after
#   a source file update.
#
# Layer 3 — React module-level memory cache
#   A module-singleton Promise (or resolved value) inside use-flood-susceptibility.ts.
#   Prevents duplicate fetches when the hook unmounts/remounts within one session
#   (e.g. navigating away and back to the map page).
#
# Invalidation contract
# ----------------------
# Source file update → Vite content-hash changes → SW CACHE_VERSION bumps →
#   SW activates, deletes old cache, fetches fresh file →
#   GEOJSON_CONTENT_HASH changes → IndexedDB entry is replaced →
#   Module-level singleton is cleared on next page load.
#
# Dev vs Prod
# -----------
# In development (VITE_MODE=development) the Service Worker is NOT registered
# (it would mask hot-reload). Layers 2 and 3 still apply so DX doesn't suffer.
# A dev-only "bypass cache" flag in localStorage lets devs force a cold load.
# =============================================================================

@geojson-cache @performance @pwa
Feature: Aggressive GeoJSON overlay caching
  As a user of FloodSense on repeat visits (or on slow mobile data)
  I want the flood susceptibility overlay to appear without re-downloading 53 MB
  So that the map is usable in < 1 s after the first visit

  # ---------------------------------------------------------------------------
  # Background
  # ---------------------------------------------------------------------------
  Background:
    Given the app is a PWA running at "https://floodsense.example.com"
    And the overlay source file is "public/ensemble_map_davao_City.json" (~53 MB, UTM Zone 51N)
    And a CACHE_VERSION string is injected into the Service Worker at build time
    And a GEOJSON_CONTENT_HASH is derived from the file's Vite content-hash at build time
    And IndexedDB database name is "floodsense-geojson-cache" version 1
    And IndexedDB object store name is "overlays"
    And the IndexedDB record key is "flood-susceptibility-v{GEOJSON_CONTENT_HASH}"


  # ===========================================================================
  # LAYER 3 — In-memory module singleton
  # ===========================================================================

  @memory-cache @unit
  Scenario: In-memory singleton prevents duplicate fetches within the same session
    Given the overlay has already been fetched and reprojected in the current page session
    And the result is held in a module-level singleton Promise inside "use-flood-susceptibility.ts"
    When the user navigates away from "/" to "/about" and then back to "/"
    And the "useFloodSusceptibility" hook remounts
    Then the hook returns the singleton Promise immediately
    And NO new network request is made for "ensemble_map_davao_City.json"
    And NO IndexedDB read is performed
    And the overlay renders without any loading banner

  @memory-cache @unit
  Scenario: Singleton is scoped to the module lifetime, not the browser tab lifetime
    Given the user refreshes the page (full reload)
    Then the module-level singleton is cleared
    And the hook falls through to the IndexedDB layer on next mount


  # ===========================================================================
  # LAYER 2 — IndexedDB (reprojected WGS84 payload)
  # ===========================================================================

  @indexeddb @integration
  Scenario: Reprojected GeoJSON is persisted to IndexedDB after first successful load
    Given IndexedDB does NOT contain a record with key "flood-susceptibility-v{GEOJSON_CONTENT_HASH}"
    And the module-level singleton is empty (fresh page load)
    When the "useFloodSusceptibility" hook mounts
    Then the hook fetches "ensemble_map_davao_City.json" (from SW cache or network)
    And performs the UTM Zone 51N → WGS84 reprojection
    And writes the reprojected FeatureCollection to IndexedDB with key "flood-susceptibility-v{GEOJSON_CONTENT_HASH}"
    And the record includes a "cachedAt" ISO timestamp
    And the hook resolves with the reprojected data
    And the loading banner disappears

  @indexeddb @integration
  Scenario: Reprojected GeoJSON is served from IndexedDB on subsequent loads (cache hit)
    Given IndexedDB contains a valid record with key "flood-susceptibility-v{GEOJSON_CONTENT_HASH}"
    And the module-level singleton is empty (fresh page load)
    When the "useFloodSusceptibility" hook mounts
    Then the hook reads the reprojected FeatureCollection from IndexedDB
    And skips the UTM→WGS84 reprojection step entirely
    And skips the network/SW fetch for "ensemble_map_davao_City.json"
    And the hook resolves with the reprojected data in < 500 ms
    And the overlay renders without showing the loading banner for more than 500 ms

  @indexeddb @integration
  Scenario: Stale IndexedDB record is replaced when GEOJSON_CONTENT_HASH changes
    Given IndexedDB contains a record with key "flood-susceptibility-v{OLD_HASH}"
    And the current build has GEOJSON_CONTENT_HASH = "{NEW_HASH}" (file was updated)
    When the "useFloodSusceptibility" hook mounts
    Then the hook finds no record matching "flood-susceptibility-v{NEW_HASH}"
    And falls through to the SW cache / network fetch
    And after successful reprojection, writes the new record "flood-susceptibility-v{NEW_HASH}"
    And deletes the old record "flood-susceptibility-v{OLD_HASH}" to reclaim storage

  @indexeddb @error-handling
  Scenario: IndexedDB read failure falls through to network gracefully
    Given IndexedDB throws a "QuotaExceededError" or "UnknownError" on read
    When the "useFloodSusceptibility" hook mounts
    Then the hook logs a console warning "IndexedDB read failed, falling back to network"
    And proceeds to fetch "ensemble_map_davao_City.json" from the SW cache or network
    And does NOT show an error banner to the user
    And does NOT attempt to write back to IndexedDB during this session (to avoid a write-fail loop)

  @indexeddb @error-handling
  Scenario: IndexedDB write failure is silent and non-blocking
    Given IndexedDB throws on write (e.g. storage quota exceeded)
    When the hook attempts to persist the reprojected GeoJSON
    Then the hook logs a console warning "IndexedDB write failed — overlay will not be cached"
    And the overlay still renders correctly using the in-memory data
    And NO error banner is shown to the user


  # ===========================================================================
  # LAYER 1 — Service Worker (Cache API)
  # ===========================================================================

  @service-worker @integration
  Scenario: Service Worker is registered on production builds only
    Given VITE_MODE is "production"
    When the app boots
    Then the Service Worker at "/sw.js" is registered via "navigator.serviceWorker.register()"
    And the SW intercepts fetch events for "/ensemble_map_davao_City.json"

  @service-worker @integration
  Scenario: Service Worker is NOT registered in development mode
    Given VITE_MODE is "development"
    When the app boots
    Then "navigator.serviceWorker.register()" is NOT called
    And the overlay is fetched directly from the Vite dev server on every page load
    And Layers 2 and 3 (IndexedDB + memory) still apply

  @service-worker @integration
  Scenario: Service Worker caches the raw JSON on first network fetch (cache-first for overlay)
    Given the SW is active
    And the SW cache does NOT contain "/ensemble_map_davao_City.json"
    When the hook triggers a fetch for "ensemble_map_davao_City.json"
    Then the SW lets the request through to the network
    And on response, clones and stores the response in cache named "floodsense-overlay-v{CACHE_VERSION}"
    And returns the response to the page

  @service-worker @integration
  Scenario: Service Worker serves the overlay from cache on subsequent fetches (cache hit)
    Given the SW is active
    And the SW cache "floodsense-overlay-v{CACHE_VERSION}" contains "/ensemble_map_davao_City.json"
    When the hook triggers a fetch for "ensemble_map_davao_City.json"
    Then the SW intercepts the request
    And returns the cached response immediately WITHOUT touching the network
    And the response arrives in < 200 ms (local disk read)

  @service-worker @invalidation
  Scenario: Old SW cache is deleted when CACHE_VERSION changes (source file updated)
    Given the browser has an active SW with CACHE_VERSION = "v1"
    And a new build is deployed with CACHE_VERSION = "v2"
    When the browser downloads and activates the new SW
    Then during the SW "activate" event, the old cache "floodsense-overlay-v1" is deleted
    And the new cache "floodsense-overlay-v2" starts empty
    And the next overlay fetch goes to the network and populates "floodsense-overlay-v2"

  @service-worker @invalidation
  Scenario: SW skips waiting so cache invalidation takes effect immediately
    Given a new SW is installed
    When the install event fires
    Then "self.skipWaiting()" is called
    And "clients.claim()" is called in the activate event
    So that the new cache version is active without requiring a second page reload


  # ===========================================================================
  # FULL CACHE LIFECYCLE — end-to-end scenarios
  # ===========================================================================

  @e2e @cold-load
  Scenario: First ever visit — full cold load
    Given the user has never visited FloodSense before
    And no SW is registered, no IndexedDB data, no in-memory singleton
    When the user navigates to "/"
    Then the SW is registered (first registration, not yet controlling)
    And the hook fetches "ensemble_map_davao_City.json" from the network (~53 MB)
    And the loading banner is shown with message "Loading flood susceptibility data…"
    And after download completes, UTM→WGS84 reprojection runs
    And the reprojected data is written to IndexedDB
    And the overlay renders on the map
    And the raw response is cached by the SW for the next visit

  @e2e @warm-load
  Scenario: Second visit — SW cache hit + IndexedDB hit (fastest path)
    Given the user has visited before
    And SW cache "floodsense-overlay-v{CACHE_VERSION}" is populated
    And IndexedDB record "flood-susceptibility-v{GEOJSON_CONTENT_HASH}" exists
    When the user navigates to "/"
    Then the hook reads from IndexedDB (skipping network + reprojection)
    And the overlay is visible on the map in < 500 ms
    And the loading banner is shown for < 500 ms total (or not at all if read is fast enough)
    And zero bytes are transferred over the network for the overlay file

  @e2e @warm-load
  Scenario: Second visit — SW cache hit but IndexedDB miss (e.g. user cleared site data partially)
    Given SW cache is populated but IndexedDB is empty
    When the user navigates to "/"
    Then the hook falls through to Layer 1 (SW cache)
    And the SW serves the response from disk cache (< 200 ms)
    And UTM→WGS84 reprojection runs (~1–2 s)
    And the reprojected data is written back to IndexedDB
    And the overlay renders
    And the loading banner is visible for approximately the reprojection duration

  @e2e @in-session-navigation
  Scenario: In-session navigation to map page (memory singleton hit)
    Given the user is in an active session and has already loaded the overlay
    When the user navigates away and then back to "/"
    Then the overlay appears instantly with no loading banner
    And no network request, no IndexedDB read, no reprojection occurs


  # ===========================================================================
  # CACHE INVALIDATION — source file updated
  # ===========================================================================

  @invalidation @e2e
  Scenario: App is updated with a new GeoJSON file — all caches invalidated correctly
    Given the user has a warm cache from the previous version (CACHE_VERSION="v1", OLD_HASH)
    When the team deploys a new build (CACHE_VERSION="v2", NEW_HASH)
    And the user visits "/" (browser downloads new SW)
    Then the new SW activates and deletes "floodsense-overlay-v1"
    And on the hook mount, IndexedDB key "flood-susceptibility-v{OLD_HASH}" is not found
    And the hook fetches the updated file from network (cache miss on "floodsense-overlay-v2")
    And reprojection runs and new IndexedDB record is written under NEW_HASH
    And the updated overlay renders correctly

  @invalidation @unit
  Scenario: GEOJSON_CONTENT_HASH is derived deterministically from Vite asset hash
    Given Vite builds the project
    Then "ensemble_map_davao_City.json" gets a content-hash suffix in the build output
    And the GEOJSON_CONTENT_HASH injected into the SW and the hook matches that suffix
    So that a file byte change always produces a new hash and triggers full invalidation


  # ===========================================================================
  # DEVELOPER EXPERIENCE
  # ===========================================================================

  @dx @development
  Scenario: Developer can force a cold load without clearing all site data
    Given VITE_MODE is "development"
    And localStorage key "floodsense_bypass_geojson_cache" is set to "true"
    When the hook mounts
    Then it skips the IndexedDB read
    And fetches fresh from the Vite dev server
    And skips the IndexedDB write
    And logs "DEV: geojson cache bypassed via localStorage flag"

  @dx @development
  Scenario: Developer sees cache layer used in console on every load
    Given VITE_MODE is "development"
    When the hook mounts and resolves overlay data
    Then the console logs which cache layer was used:
      | Layer   | Log message                                    |
      | Memory  | "DEV: overlay served from memory singleton"    |
      | IDB     | "DEV: overlay served from IndexedDB"           |
      | SW/Net  | "DEV: overlay fetched from network/SW cache"   |

  @dx @development
  Scenario: DevTools panel (or console helper) reports cache status
    Given the app is running in development mode
    When the developer calls "window.__floodsense.cacheStatus()" in the browser console
    Then the function returns an object:
      """
      {
        memorySingleton: boolean,
        indexedDB: { hit: boolean, key: string | null, cachedAt: string | null },
        serviceWorker: { registered: boolean, cacheVersion: string | null }
      }
      """


  # ===========================================================================
  # LOADING UX — what users see during each cache state
  # ===========================================================================

  @ux @loading-states
  Scenario Outline: Loading banner behavior depends on cache layer
    Given the overlay cache state is "<cache_state>"
    When the user opens the map page
    Then the loading banner "<banner_behavior>"
    And the estimated wait is "<wait>"

    Examples:
      | cache_state                        | banner_behavior                                  | wait          |
      | All caches cold (first visit)      | is shown for the full load duration              | 5–15 s        |
      | SW cache hit + IDB miss            | is shown during reprojection only                | 1–3 s         |
      | SW cache hit + IDB hit             | flashes briefly or is not shown at all           | < 500 ms      |
      | Memory singleton hit               | is never shown                                   | ~0 ms         |

  @ux @loading-states
  Scenario: Loading banner shows a progress hint distinguishing download vs reprojection phases
    Given this is a cold load (no caches)
    When the fetch begins
    Then the loading banner shows "Downloading flood data…" with an indeterminate spinner
    When the download completes and reprojection begins
    Then the banner text updates to "Processing map data…"
    When reprojection completes
    Then the banner disappears and the overlay is visible

  @ux @loading-states
  Scenario: Overlay toggle is disabled while the GeoJSON is loading
    Given the overlay data has not yet resolved
    Then the "Susceptibility" toggle button is disabled and visually muted
    And a tooltip on hover reads "Loading overlay data…"
    When the data resolves
    Then the toggle is enabled and clickable


  # ===========================================================================
  # STORAGE BUDGET & CLEANUP
  # ===========================================================================

  @storage @housekeeping
  Scenario: Only one IndexedDB record is kept at a time (no accumulation of old versions)
    Given the user has upgraded through several app versions
    When the hook writes a new record to IndexedDB
    Then it deletes ALL records in the "overlays" store whose keys do NOT match the current GEOJSON_CONTENT_HASH
    And at most one record exists in the "overlays" store at any time

  @storage @housekeeping
  Scenario: SW cache contains only the current version's overlay (no old versions accumulate)
    Given the SW "activate" handler runs
    Then it deletes every cache whose name does NOT match "floodsense-overlay-v{CACHE_VERSION}"
    And only the current version's cache remains

  @storage @housekeeping
  Scenario: Total browser storage used by the cache is < 60 MB
    Given the reprojected GeoJSON is stored in IndexedDB (~53 MB uncompressed)
    And the raw JSON is stored in the SW Cache API
    Then the implementation stores EITHER the raw response (SW Cache) OR the reprojected data (IndexedDB)
    But AVOIDS storing both in full if the combined size would exceed a 60 MB budget
    # Implementation note: the SW Cache already holds the ~53 MB raw response;
    # IndexedDB holds the ~53 MB reprojected FeatureCollection.
    # If storage is a concern, the SW cache can be omitted and the raw file
    # re-fetched from the network when IDB is cold. Trade network latency vs disk.
    # Decision to be made during implementation.


  # ===========================================================================
  # IMPLEMENTATION CONTRACTS (normative)
  # ===========================================================================

  @contract @unit
  Scenario: useFloodSusceptibility hook exposes cache metadata to consumers
    When the hook resolves
    Then it returns a "cacheInfo" field alongside the GeoJSON data:
      """
      {
        source: "memory" | "indexeddb" | "network",
        loadTimeMs: number,
        cachedAt: string | null   // ISO timestamp from IDB record, null if network
      }
      """
    And consuming components MAY use this to show a "Loaded from cache" indicator

  @contract @unit
  Scenario: Cache layer functions are pure, testable, and separated from hook logic
    Then the following utilities exist as standalone importable functions:
      | Function                  | File                                      | Responsibility                            |
      | readFromIndexedDB(hash)   | lib/geojson-cache.ts                      | Open IDB, read record by hash key        |
      | writeToIndexedDB(hash, data) | lib/geojson-cache.ts                   | Open IDB, write record, purge old keys   |
      | getSWCacheVersion()       | lib/geojson-cache.ts                      | Return CACHE_VERSION from build constant  |
    And these functions are unit-testable without mounting a React component

  @contract @unit
  Scenario: The module-level singleton is resettable for testing purposes
    Then "use-flood-susceptibility.ts" exports an internal "__resetSingleton()" function
    And it is only available when "VITE_MODE !== 'production'"
    And test suites call it in "beforeEach" to guarantee a cold-start state per test
