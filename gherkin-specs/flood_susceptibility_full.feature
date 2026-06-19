Feature: Flood Susceptibility Ensemble Model Overlay
  As a thesis researcher
  I want to visualize the ensemble RF/XGBoost classification on the interactive map
  So that stakeholders can explore spatial flood risk patterns across Davao City

  # ──────────────────────────────────────────────────────────────
  # CONSTANTS
  # ──────────────────────────────────────────────────────────────

  Feature: Susceptibility Class Definitions
    Scenario: DN values map to classes
      Then the following classification scheme is defined:
        | DN | Label    | Hex Color | Probability Range |
        | 1  | Very Low | #1a9641   | 0–25%             |
        | 2  | Low      | #ffffb2   | 25–50%            |
        | 3  | Moderate | #fd8d3c   | 50–75%            |
        | 4  | High     | #d7191c   | 75–100%           |
      And each class has a plain-language description:
        | DN | Description                                                              |
        | 1  | Minimal inundation probability. Typically elevated or well-drained areas. |
        | 2  | Low inundation probability. Minor risk during extreme rainfall events.     |
        | 3  | Moderate risk. At risk during moderate-to-heavy rainfall.                 |
        | 4  | High probability. Prone to flooding during significant storm events.       |
      And the model source label reads "Ensemble RF + XGBoost (Avena et al., 2026)"
      And ALL_CLASSES is defined as [1, 2, 3, 4]

  # ──────────────────────────────────────────────────────────────
  # HOOK — useFloodSusceptibility
  # ──────────────────────────────────────────────────────────────

  Feature: useFloodSusceptibility hook
    Scenario: Initial state before fetch
      Given the hook is initialized with a GeoJSON URL
      Then loading is false
      And data is null
      And error is null
      And stats is null

    Scenario: Successful data fetch
      Given the GeoJSON URL returns a valid FeatureCollection
      When the hook mounts
      Then loading becomes true during the request
      And loading becomes false after the response
      And data is set to the parsed FeatureCollection
      And error remains null

    Scenario: Stats are computed after successful fetch
      Given the GeoJSON contains features with DN properties 1 through 4
      When the fetch resolves
      Then stats.total equals the count of all features with DN 1–4
      And stats.byClass contains an entry for each DN value
      And each entry contains:
        | Field   | Type   | Description                        |
        | count   | number | Number of features with that DN    |
        | percent | string | Percentage of total, 1 decimal     |
      And features with null geometry are excluded from stats

    Scenario: Features with null geometry are skipped in stats
      Given the GeoJSON contains features where geometry is null
      When stats are computed
      Then those features do not increment any DN count

    Scenario: Fetch fails with HTTP error
      Given the GeoJSON URL returns HTTP 404
      When the hook mounts
      Then error is set to "HTTP 404: Not Found"
      And data remains null
      And loading is false

    Scenario: Fetch fails with network error
      Given the network is unavailable
      When the hook mounts
      Then error is set to the caught error message
      And data remains null

    Scenario: Invalid GeoJSON structure
      Given the response JSON has no features array
      When the hook mounts
      Then error is set to "Invalid GeoJSON: missing features array"

    Scenario: Retry after failure
      Given the hook is in an error state
      When retry() is called
      Then attempt increments by 1
      And the fetch is triggered again
      And loading becomes true
      And error is cleared

    Scenario: No fetch when URL is empty
      Given the hook is initialized with an empty string URL
      When the hook mounts
      Then no fetch is performed
      And all state remains at initial values

  # ──────────────────────────────────────────────────────────────
  # COMPONENT — FloodSusceptibilityLayer
  # ──────────────────────────────────────────────────────────────

  Feature: FloodSusceptibilityLayer component
    Background:
      Given data is a valid WGS84 GeoJSON FeatureCollection
      And activeClasses is a Set containing [1, 2, 3, 4]
      And opacity is 0.65

    Scenario: Renders nothing when data is null
      Given data is null
      Then no GeoJSON layer is added to the Leaflet map

    Scenario: Polygon fill color matches DN class
      When the layer renders
      Then each polygon's fillColor matches SUSCEPTIBILITY_CLASSES[DN].color
      And polygons with unrecognized DN render with fillColor "#cccccc"

    Scenario: Polygon borders are hidden
      When the layer renders
      Then all polygons have weight: 0
      And stroke is false

    Scenario: Fill opacity uses the opacity prop
      When opacity prop is 0.65
      Then all polygons render with fillOpacity 0.65

    Scenario: Filter hides polygons outside activeClasses
      Given activeClasses is a Set containing [3, 4]
      When the layer renders
      Then polygons with DN 1 are not rendered
      And polygons with DN 2 are not rendered
      And polygons with DN 3 are rendered
      And polygons with DN 4 are rendered

    Scenario: Features with null geometry are skipped
      Given a feature has geometry: null
      When the layer renders
      Then that feature produces no visual output and no error

    Scenario: Hover increases polygon opacity
      When the user moves their pointer over a polygon
      Then that polygon's fillOpacity increases to min(opacity + 0.2, 0.95)

    Scenario: Mouseout restores polygon opacity
      Given a polygon is in the hover state
      When the user moves their pointer off the polygon
      Then that polygon's fillOpacity returns to the base opacity prop

    Scenario: Tooltip appears on hover
      When the user hovers over a polygon with DN 4
      Then a sticky tooltip appears near the cursor
      And the tooltip contains:
        | Element     | Content                              |
        | Color dot   | Filled circle with color #d7191c     |
        | Class name  | "High"                               |
        | Range       | "75–100%"                            |
      And the tooltip follows the cursor position

    Scenario: Popup appears on click
      When the user clicks a polygon with DN 4
      Then a Leaflet popup opens anchored to the click location
      And the popup header background is #d7191c
      And the popup body contains:
        | Field    | Value                              |
        | Class    | "High"                             |
        | Desc     | The class description string       |
        | DN row   | "DN 4"                             |
        | Range    | "75–100% probability"              |
        | Model    | "Ensemble RF + XGBoost"            |
      And click event propagation is stopped

    Scenario: Opacity prop change updates layer without remount
      Given the layer is rendered with opacity 0.65
      When the opacity prop changes to 0.4
      Then setStyle is called on the existing GeoJSON layer
      And the layer is not unmounted and remounted

    Scenario: Filter change forces layer remount
      Given the layer is rendered with activeClasses [1, 2, 3, 4]
      When activeClasses changes to [3, 4]
      Then the GeoJSON component key changes
      And the layer remounts with the new filter

  # ──────────────────────────────────────────────────────────────
  # COMPONENT — FloodSusceptibilityLegend
  # ──────────────────────────────────────────────────────────────

  Feature: FloodSusceptibilityLegend component
    Scenario: Legend is added as a Leaflet control
      Given visible is true
      When the component mounts
      Then a Leaflet control is added at position "bottomright"
      And the control contains the legend UI

    Scenario: Legend is removed when not visible
      Given visible is false
      When the component mounts
      Then no Leaflet control is added

    Scenario: Legend is removed on unmount
      Given the legend control is active
      When the component unmounts
      Then legend.remove() is called

    Scenario: Legend classes render in High-to-Low order
      When the legend renders
      Then classes appear top-to-bottom as: High, Moderate, Low, Very Low

    Scenario: Each legend item shows swatch, label, and range
      When the legend renders
      Then each class row contains:
        | Element | Content                           |
        | Swatch  | Colored square with class color   |
        | Label   | Class name string                 |
        | Range   | Probability range string          |

    Scenario: Inactive classes are visually muted
      Given activeClasses is a Set containing only [4]
      When the legend renders
      Then the DN 1, 2, 3 rows have reduced opacity (flood-legend__item--muted)
      And the DN 4 row renders at full opacity

    Scenario: Legend title and attribution
      When the legend renders
      Then the title reads "Flood Susceptibility"
      And the subtitle reads "RF + XGBoost Ensemble"
      And the footer reads "Avena et al., 2026 · OpenStreetMap"

  # ──────────────────────────────────────────────────────────────
  # COMPONENT — FloodSusceptibilityControls
  # ──────────────────────────────────────────────────────────────

  Feature: FloodSusceptibilityControls component
    Background:
      Given visible is true
      And opacity is 0.65
      And activeClasses is a Set containing [1, 2, 3, 4]
      And data is a loaded FeatureCollection
      And stats is a computed stats object

    Scenario: Panel is open by default
      When the component mounts
      Then panelOpen is true
      And the body section (opacity, filter, export) is visible

    Scenario: Collapse button toggles panel body
      When the user clicks the collapse button (−)
      Then panelOpen becomes false
      And the body section is hidden
      And the button label changes to (+)
      When the user clicks the expand button (+)
      Then panelOpen becomes true
      And the body section is visible again

    Scenario: Toggle button shows layer visibility state
      Given visible is true
      Then the toggle button has class flood-controls__toggle--active
      When the user clicks the toggle button
      Then onVisibleChange is called with false
      Given visible is false
      Then the toggle button does not have the active class

    Scenario: Opacity label shows current percent
      Given opacity is 0.65
      Then the label displays "65%"
      When opacity changes to 0.4
      Then the label displays "40%"

    Scenario: Opacity slider is bound to opacity prop
      When the user drags the slider to 0.3
      Then onOpacityChange is called with 0.3

    Scenario: Opacity slider is disabled when layer is hidden
      Given visible is false
      Then the opacity slider has the disabled attribute

    Scenario: Class filter chips reflect activeClasses
      Given activeClasses contains [1, 2, 3, 4]
      Then all four chips have class flood-controls__chip--active
      And each active chip's background matches its class color

    Scenario: Clicking an active chip removes it from activeClasses
      Given activeClasses contains [1, 2, 3, 4]
      When the user clicks the "Very Low" chip
      Then onActiveClassesChange is called with a Set containing [2, 3, 4]

    Scenario: Clicking an inactive chip adds it to activeClasses
      Given activeClasses contains [3, 4]
      When the user clicks the "Low" chip
      Then onActiveClassesChange is called with a Set containing [2, 3, 4]

    Scenario: Cannot deselect the last active class
      Given activeClasses contains only [4]
      When the user clicks the "High" chip
      Then onActiveClassesChange is not called
      And activeClasses remains [4]

    Scenario: "All" link resets to all four classes
      Given activeClasses contains [3, 4]
      When the user clicks "All"
      Then onActiveClassesChange is called with a Set containing [1, 2, 3, 4]

    Scenario: Class chips are disabled when layer is hidden
      Given visible is false
      Then all class chips have the disabled attribute

    Scenario: Statistics section is collapsed by default
      When the component mounts
      Then the stats table is not visible
      And the toggle reads "▸ Show Statistics"

    Scenario: Statistics toggle expands the stats table
      When the user clicks "▸ Show Statistics"
      Then showStats becomes true
      And the stats table is visible
      And the toggle reads "▾ Hide Statistics"

    Scenario: Statistics table renders computed stats
      Given stats.total is 5000
      And stats.byClass[4].count is 1200 and percent is "24.0"
      When the stats table renders
      Then the total row reads "5,000 total polygons analyzed"
      And the High row shows: swatch | "High" | "1,200" | "24.0%"

    Scenario: Statistics section hidden when stats is null
      Given stats is null
      Then the statistics toggle button is not rendered

    Scenario: Export button is disabled when data is null
      Given data is null
      Then the export button has the disabled attribute

    Scenario: Export button triggers GeoJSON download
      Given data is a loaded FeatureCollection
      When the user clicks "↓ Export GeoJSON"
      Then a Blob is created with type "application/geo+json"
      And an anchor element is created with the blob URL
      And the anchor download attribute is "davao_city_flood_susceptibility.geojson"
      And the anchor click is triggered
      And the object URL is revoked after download

  # ──────────────────────────────────────────────────────────────
  # COMPONENT — FloodSusceptibilityOverlay (main wrapper)
  # ──────────────────────────────────────────────────────────────

  Feature: FloodSusceptibilityOverlay component
    Background:
      Given the component receives url="/static/ensemble_map_davao_City_wgs84.geojson"
      And it is rendered inside a react-leaflet <MapContainer>

    Scenario: Default state on mount
      When the component mounts
      Then visible is true
      And opacity is 0.65
      And activeClasses is a Set containing [1, 2, 3, 4]

    Scenario: Loading banner shown while fetching
      Given the fetch is in progress
      Then a LoadingBanner is rendered with text "Loading flood susceptibility data…"
      And it has role="status" and aria-live="polite"
      And it contains an animated spinner

    Scenario: Loading banner hidden after fetch resolves
      Given the fetch has completed successfully
      Then the LoadingBanner is not rendered

    Scenario: Error banner shown on fetch failure
      Given the fetch has failed with an error message
      And loading is false
      Then an ErrorBanner is rendered with the error message prefixed by "⚠ "
      And it has role="alert"
      And it contains a Retry button

    Scenario: Retry button calls the retry function
      Given the ErrorBanner is visible
      When the user clicks "Retry"
      Then the retry function from useFloodSusceptibility is called

    Scenario: Layer hidden when visible is false
      Given data has loaded successfully
      When visible is set to false
      Then FloodSusceptibilityLayer is not rendered

    Scenario: Layer shown when visible is true
      Given data has loaded and visible is true
      Then FloodSusceptibilityLayer is rendered with the loaded data

    Scenario: Layer not rendered while data is null
      Given the fetch has not completed
      Then FloodSusceptibilityLayer is not rendered even if visible is true

    Scenario: Legend always mounted (manages its own visibility)
      When the component renders
      Then FloodSusceptibilityLegend is always mounted
      And it receives the current activeClasses and visible props

    Scenario: Controls always mounted
      When the component renders
      Then FloodSusceptibilityControls is always mounted
      And it receives visible, opacity, activeClasses, data, and stats props

    Scenario: Opacity change flows to layer
      When onOpacityChange is called with 0.3
      Then opacity state becomes 0.3
      And FloodSusceptibilityLayer receives opacity={0.3}

    Scenario: Class filter change flows to layer and legend
      When onActiveClassesChange is called with Set([3, 4])
      Then FloodSusceptibilityLayer receives activeClasses as Set([3, 4])
      And FloodSusceptibilityLegend receives activeClasses as Set([3, 4])

  # ──────────────────────────────────────────────────────────────
  # STYLING
  # ──────────────────────────────────────────────────────────────

  Feature: Visual styling and accessibility
    Scenario: Tooltip dark glass appearance
      Then the tooltip has background rgba(15, 23, 42, 0.9)
      And text color is #f1f5f9
      And it has backdrop-filter: blur(4px)
      And border-radius is 6px

    Scenario: Popup dark body
      Then the popup body has background #1e293b
      And the class name text is #f1f5f9 at 18px font-weight 700
      And the description text is #94a3b8 at 12px

    Scenario: Controls panel positioned top-left over the map
      Then .flood-controls has position: absolute
      And top: 80px, left: 16px
      And z-index: 1000
      And background is rgba(15, 23, 42, 0.92) with backdrop-filter: blur(8px)

    Scenario: Legend positioned bottom-right
      Then the Leaflet control position is "bottomright"
      And .flood-legend__inner background is rgba(15, 23, 42, 0.92)

    Scenario: Opacity slider thumb interaction
      Then the slider thumb is 14x14px circle with background #3b82f6
      And on hover the thumb scales to 1.2x

    Scenario: Reduced motion compliance
      Given the user has prefers-reduced-motion: reduce
      Then .flood-banner__spinner animation is disabled
      And all transitions on controls, chips, slider, and export button are set to none

    Scenario: Loading spinner animation
      Then .flood-banner__spinner rotates 360deg at 0.7s linear infinite
      And the keyframe is named flood-spin

  # ──────────────────────────────────────────────────────────────
  # GEOJSON FILE — Coordinate System (UTM → WGS84)
  # ──────────────────────────────────────────────────────────────

  Feature: GeoJSON coordinate system requirements
    Background:
      Given the source file is ensemble_map_davao_City.json
      And it was exported from Mapshaper without reprojection
      And it carries an RFC 7946 non-WGS84 warning on export

    Scenario: Raw exported file uses UTM projected coordinates
      When the GeoJSON is inspected
      Then coordinates are in UTM meter values, e.g. [762731.95, 837343.82]
      And these are not valid WGS84 longitude/latitude values
      And Leaflet cannot position these polygons on the map

    Scenario: Leaflet requires WGS84 decimal degrees
      Given the GeoJSON contains UTM coordinates
      When FloodSusceptibilityLayer attempts to render the features
      Then all polygons appear at incorrect positions far outside Davao City
      Or no polygons are visible at all
      And no JavaScript error is thrown (Leaflet silently misplaces them)

    Scenario: Reprojection via Mapshaper console
      Given the file is loaded in mapshaper.org
      When the user runs "$ project wgs84" in the Mapshaper console
      Then all coordinates are converted to EPSG:4326 decimal degrees
      And coordinates for Davao City fall within:
        | Axis      | Min     | Max     |
        | Longitude | 125.00  | 126.00  |
        | Latitude  | 6.80    | 7.80    |
      When the user exports as GeoJSON
      Then the output file is valid RFC 7946 GeoJSON
      And the export warning is no longer shown

    Scenario: Reprojection via QGIS as an alternative
      Given the classified raster layer is open in QGIS
      When the user right-clicks the layer and selects Export → Save As
      And sets CRS to EPSG:4326
      And sets Format to GeoJSON
      Then the exported file uses WGS84 decimal degree coordinates
      And it is suitable for direct use in Leaflet

    Scenario: Correct file is served from FastAPI
      Given the reprojected file is named ensemble_map_davao_City_wgs84.geojson
      And it is placed in the FastAPI /static/ directory
      When FloodSusceptibilityOverlay receives url="/static/ensemble_map_davao_City_wgs84.geojson"
      Then useFloodSusceptibility fetches the correct file
      And polygons render accurately over Davao City on the OSM base layer

  # ──────────────────────────────────────────────────────────────
  # GEOJSON FILE — File Size and Performance
  # ──────────────────────────────────────────────────────────────

  Feature: GeoJSON file size and load performance
    Background:
      Given the original GeoJSON is approximately 100MB before simplification
      And after 10% simplification in Mapshaper the file is approximately 51MB
      And the file contains a large number of small polygon features

    Scenario: 51MB file causes slow initial load
      Given the GeoJSON url points to a 51MB file
      When the fetch begins
      Then the LoadingBanner is shown immediately
      And the browser parses the JSON after the full response is received
      And total load time may exceed 5–10 seconds on average connections

    Scenario: Loading banner persists for the full fetch duration
      Given the file is 51MB
      When the fetch is in progress
      Then the LoadingBanner with spinner remains visible until data is set
      And the map base layer remains interactive during loading
      And no map controls are blocked

    Scenario: Map remains usable during GeoJSON fetch
      Given the GeoJSON fetch is in progress
      When the user pans or zooms the OSM base layer
      Then the map responds normally
      And the fetch continues in the background uninterrupted

    Scenario: Browser memory impact of 51MB parse
      Given the parsed FeatureCollection is held in React state
      Then the data object remains in memory for the lifetime of the component
      And unmounting FloodSusceptibilityOverlay releases the data reference
      And garbage collection can reclaim the memory

    Scenario: Recommended mitigation if load time is unacceptable
      Given the 51MB file causes load times above 10 seconds
      Then the recommended fallback is to convert to vector tiles via tippecanoe:
        """
        tippecanoe \
          --output=flood_tiles.mbtiles \
          --minimum-zoom=6 \
          --maximum-zoom=15 \
          --drop-smallest-as-needed \
          ensemble_map_davao_City_wgs84.geojson
        """
      And serve tiles via tileserver-gl at /data/flood_tiles/{z}/{x}/{y}.png
      And replace FloodSusceptibilityLayer with a react-leaflet <TileLayer>

  # ──────────────────────────────────────────────────────────────
  # GEOJSON FILE — Self-Intersecting Geometry
  # ──────────────────────────────────────────────────────────────

  Feature: Self-intersecting geometry from Mapshaper simplification
    Background:
      Given Mapshaper reported "398,297 intersections could not be repaired"
        at 5% simplification
      And "399,373 intersections could not be repaired" at 10% simplification
      And "399,833 intersections could not be repaired" at 15% simplification
      And these intersections result from raster-to-vector conversion in QGIS
        producing pixel-aligned polygon edges that tangle during simplification

    Scenario: Leaflet renders self-intersecting polygons without crashing
      Given the GeoJSON contains features with self-intersecting ring coordinates
      When FloodSusceptibilityLayer renders the GeoJSON
      Then Leaflet draws each polygon using its raw coordinate ring
      And no JavaScript error is thrown
      And the map does not crash or freeze

    Scenario: Visual artifacts may appear at self-intersection sites
      Given a polygon ring crosses itself
      When Leaflet renders the polygon using SVG or Canvas
      Then the fill may appear as an unfilled hole at the crossing point
      And this is a known SVG even-odd fill rule artifact
      And it does not affect surrounding polygons

    Scenario: Self-intersections do not affect DN classification
      Given a polygon has self-intersecting geometry but a valid DN property
      When the layer applies styling via styleFeature()
      Then the polygon receives the correct fillColor for its DN value
      And the intersection geometry does not alter the DN attribute

    Scenario: Self-intersections do not affect tooltip or popup
      Given a polygon has self-intersecting geometry
      When the user hovers over any rendered portion of the polygon
      Then the tooltip displays the correct class label and range
      When the user clicks any rendered portion of the polygon
      Then the popup displays the correct DN, class, description, and model source

    Scenario: Intersection count is consistent across simplification levels
      Given simplification at 5%, 10%, and 15% all produce ~398k–399k unrepaired intersections
      Then the intersection count is driven by source geometry complexity
      And not by the simplification percentage
      And further simplification beyond 15% is unlikely to reduce intersection count meaningfully

    Scenario: Recommended fix if visual artifacts are unacceptable
      Given self-intersection artifacts are visible and affect thesis presentation quality
      Then the recommended fix is to run ST_MakeValid in PostGIS before export:
        """
        SELECT ST_MakeValid(geom) AS geom, DN
        FROM flood_susceptibility_polygons;
        """
      Or to use QGIS Vector → Geometry Tools → Fix Geometries on the polygon layer
      And re-export as GeoJSON after geometry repair
      And re-run Mapshaper simplification on the repaired output
