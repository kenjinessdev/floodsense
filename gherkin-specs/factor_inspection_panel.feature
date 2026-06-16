# factor_inspection_panel.feature
# FloodsenseWeb — Avena et al., 2026
# Scope: extracted_values inspection only.
# baseline_rf / ensemble / coordinates rendering is out of scope (handled elsewhere).

Feature: Extracted Factor Inspection Sidebar
  As a researcher or public user exploring flood susceptibility
  I want to inspect the eight extracted environmental factors for any point I click
  So that I can understand what geographic inputs drove the model prediction

  Background:
    Given the FloodsenseWeb map is loaded and centered on Davao City
    And flood susceptibility tiles are rendered on the map
    And the factor inspection sidebar is in its default hidden state

  # ─────────────────────────────────────────────
  # PANEL LIFECYCLE
  # ─────────────────────────────────────────────

  Scenario: Sidebar opens when the user clicks a point on the map
    When the user clicks a location on the map
    Then the sidebar slides in from the right edge of the viewport
    And the sidebar displays the eight extracted factor rows
    And the map remains fully interactive behind the sidebar

  Scenario: Sidebar remains open while the user pans or zooms
    Given the factor inspection sidebar is open for a location
    When the user pans or zooms the map
    Then the sidebar remains visible with the same factor values
    And the inspection marker stays pinned to the original clicked point

  Scenario: Sidebar updates when the user clicks a different point
    Given the factor inspection sidebar is open for location A
    When the user clicks a different location B on the map
    Then the sidebar enters a loading state
    And once the response arrives the sidebar replaces the factor values with those for location B
    And the inspection marker moves to location B

  Scenario: User dismisses the sidebar
    Given the factor inspection sidebar is open
    When the user clicks the close button on the sidebar
    Then the sidebar slides out and returns to its hidden state
    And the inspection marker is removed from the map
    And the map reclaims the full viewport width

  # ─────────────────────────────────────────────
  # FACTOR DISPLAY — LABELS
  # ─────────────────────────────────────────────

  Scenario Outline: Each raw key is displayed with a human-readable label
    Given the sidebar is open with a valid extracted_values payload
    Then the factor row for "<raw_key>" displays the label "<display_label>"

    Examples:
      | raw_key            | display_label         |
      | Elevation          | Elevation             |
      | Rainfall           | Rainfall              |
      | Slope              | Slope                 |
      | Profile_Curvature  | Profile Curvature     |
      | LULC               | Land Use / Land Cover |
      | Lithology          | Lithology             |
      | Distance_to_River  | Distance to River     |
      | Aspect             | Aspect                |

  # ─────────────────────────────────────────────
  # FACTOR DISPLAY — VALUE FORMATTING
  # ─────────────────────────────────────────────

  Scenario: Continuous numeric factors display with units and fixed decimal precision
    Given the sidebar is open with the following extracted values:
      | factor            | raw_value               |
      | Elevation         | 235.0                   |
      | Rainfall          | 4.510000228881836       |
      | Slope             | 8.95201587677002        |
      | Distance_to_River | 23.0                    |
      | Aspect            | 1.4711276292800903      |
    Then the Elevation row displays "235.00 m"
    And the Rainfall row displays "4.51 mm"
    And the Slope row displays "8.95°"
    And the Distance to River row displays "23.00 m"
    And the Aspect row displays "1.47 rad"

  Scenario: Profile Curvature renders in scientific notation
    Given the Profile_Curvature extracted value is 8.562116704524669e-07
    Then the Profile Curvature row displays "8.56 × 10⁻⁷"
    And the raw floating-point string is not shown directly to the user

  Scenario: Categorical factors display their class code with a visual badge
    Given the LULC extracted value is 17.0
    And the Lithology extracted value is 2.0
    Then the Land Use / Land Cover row displays "17" alongside a "Class" badge
    And the Lithology row displays "2" alongside a "Class" badge
    And neither value is shown with a decimal point

  Scenario Outline: All factor values are never shown as raw unformatted floats
    Given the sidebar is open with a valid extracted_values payload
    Then the displayed value for "<factor>" does not contain more than 2 decimal places
    And the displayed value for "<factor>" does not contain a trailing sequence of zeros beyond precision

    Examples:
      | factor            |
      | Elevation         |
      | Rainfall          |
      | Slope             |
      | Distance_to_River |
      | Aspect            |

  # ─────────────────────────────────────────────
  # LOADING STATE
  # ─────────────────────────────────────────────

  Scenario: Sidebar shows skeleton placeholders while the backend request is in flight
    Given the user has just clicked a point on the map
    When the backend extraction request has not yet resolved
    Then the sidebar is visible
    And each of the eight factor rows shows a skeleton loader in place of its value
    And no stale values from a previous location are shown during loading

  Scenario: Skeleton loaders are replaced by real values on successful response
    Given the sidebar is in a loading state
    When the backend returns a successful extracted_values payload
    Then all skeleton loaders are replaced by formatted factor values
    And no loading indicators remain visible

  # ─────────────────────────────────────────────
  # ERROR STATE
  # ─────────────────────────────────────────────

  Scenario: Sidebar shows an error state when extraction fails
    Given the user clicks a point on the map
    When the backend returns a non-2xx response or the request times out
    Then the sidebar displays the message "Could not extract values for this location."
    And a Retry button is visible within the sidebar
    And no factor rows are shown

  Scenario: User retries after an extraction failure
    Given the sidebar is in an error state for a location
    When the user clicks the Retry button
    Then the sidebar re-enters a loading state
    And the extraction request is retried for the same coordinates
    And the Retry button is no longer visible during the retry attempt

  # ─────────────────────────────────────────────
  # RESPONSIVE BEHAVIOR
  # ─────────────────────────────────────────────

  Scenario: Sidebar renders as a fixed right panel on desktop
    Given the viewport width is 1024 px or wider
    When the factor inspection sidebar is open
    Then it renders as a fixed panel anchored to the right side of the map container
    And the map's right boundary reflows to prevent tile content from being hidden beneath the sidebar
    And the sidebar does not overlap the zoom controls or attribution text

  Scenario: Sidebar renders as a bottom sheet on mobile
    Given the viewport width is less than 768 px
    When the factor inspection sidebar is open
    Then it renders as a bottom sheet that slides up from the bottom of the viewport
    And the sheet is partially collapsed by default showing only the section header and a drag handle
    And the map remains interactable in the area above the collapsed sheet

  Scenario: User expands the mobile bottom sheet to view all factors
    Given the bottom sheet is in its default partially collapsed state on mobile
    When the user drags the sheet upward or taps the expand affordance
    Then the sheet expands to reveal all eight factor rows
    And the sheet stops at a maximum height that does not fully cover the map

  Scenario: Bottom sheet snaps closed when dragged down past the midpoint
    Given the bottom sheet is expanded on mobile
    When the user drags the sheet downward past 50% of the sheet height
    Then the sheet snaps back to its hidden state
    And the map reclaims the full viewport

  # ─────────────────────────────────────────────
  # ACCESSIBILITY
  # ─────────────────────────────────────────────

  Scenario: Sidebar container has correct ARIA semantics
    Given the factor inspection sidebar is open
    Then the sidebar container has role="complementary"
    And the sidebar has an accessible name of "Extracted Factors"
    And the close button has an aria-label of "Close factor inspection panel"

  Scenario: Each factor row exposes label and value to assistive technology
    Given the factor inspection sidebar is open with a valid payload
    Then each factor row has an aria-label combining its display label and formatted value
    Examples of expected aria-labels include:
      | "Elevation: 235.00 m"              |
      | "Slope: 8.95°"                     |
      | "Profile Curvature: 8.56 × 10⁻⁷"  |
      | "Land Use / Land Cover: 17 Class"  |

  Scenario: Sidebar is keyboard navigable
    Given the factor inspection sidebar is open
    When the user presses Tab from within the map
    Then focus enters the sidebar at the close button
    And subsequent Tab presses move focus through each factor row in display order
    And the final Tab press moves focus back to the map

  Scenario: Focus is returned to the map when the sidebar is closed via keyboard
    Given the sidebar is open and the close button has focus
    When the user presses Enter or Space on the close button
    Then the sidebar closes
    And focus is returned to the map container
