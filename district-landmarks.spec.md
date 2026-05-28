# District Landmark Cross-Validation Points

## Feature Overview

Beta tester feedback requested clickable specific locations per district that allow
cross-validation of the flood susceptibility model against known historically flooded
and non-flooded spots during the demo presentation.

Data source: `landmarks.json` at project root — hardcoded coordinates derived from
OSM, PhilAtlas, and LatLong.net. Verify coordinates before final demo.

---

```gherkin
Feature: District Landmark Cross-Validation Points
  As a FloodSense demo presenter
  I want to click a district and see curated specific locations
  So that I can cross-validate the model against known flooded and non-flooded areas

  Background:
    Given the user is on the map page
    And the "Go to District" panel is visible
    And landmarks.json is loaded with 5 curated points per district
    And each point has a name, lat, lng, and a "flooded" boolean tag

  # ─── Panel Interaction ────────────────────────────────────────────────────

  Scenario: Expanding a district reveals its curated landmark points
    Given the user sees the district list in the panel
    When the user clicks on a district (e.g. "Agdao District")
    Then the district entry expands
    And a list of curated landmark points for Agdao is shown below it
    And each landmark displays its name and its flood history badge

  Scenario: Only one district is expanded at a time
    Given the user has already expanded "Agdao District"
    When the user clicks "Talomo District"
    Then "Agdao District" collapses automatically
    And "Talomo District" expands and shows its landmark points

  Scenario: Clicking an already-expanded district collapses it
    Given the user has expanded "Buhangin District"
    When the user clicks "Buhangin District" again
    Then the district entry collapses
    And no landmark points are visible

  Scenario: No landmark points are visible on initial load
    Given the user has not clicked any district
    Then no landmark points are visible
    And only the district names are listed in the panel

  # ─── Visual Differentiation ───────────────────────────────────────────────

  Scenario: Flooded and non-flooded landmarks are visually distinguished
    Given the user has expanded any district
    Then landmarks with flooded: true show a red badge or indicator
    And landmarks with flooded: false show a green badge or indicator
    So the presenter can tell at a glance which points are validation candidates

  # ─── Map Navigation ───────────────────────────────────────────────────────

  Scenario: Clicking a landmark navigates the map to that location
    Given the user has expanded a district
    When the user clicks a specific landmark (e.g. "Bucana Barangay")
    Then the panel closes or collapses
    And the map flies to the hardcoded lat/lng of that landmark
    And a pin marker is placed at those coordinates

  Scenario: Clicking a landmark automatically triggers flood prediction
    Given the map has flown to the landmark coordinates
    Then the flood risk prediction for those coordinates is triggered automatically
    As if the user had clicked that point on the map manually

  # ─── Cross-Validation ─────────────────────────────────────────────────────

  Scenario: A historically flooded landmark returns a meaningful risk level
    Given the user clicked a landmark tagged flooded: true
    (e.g. Bucana Barangay, Lasang, Tibungco, Bankerohan Market)
    When the result page loads
    Then the flood probability should be in the Moderate to Very High range
    And the result can be used to demonstrate model accuracy during the presentation

  Scenario: A non-flooded landmark returns a low risk level
    Given the user clicked a landmark tagged flooded: false
    (e.g. Malagos Garden Resort, Davao City Hall, PSHS-DRC)
    When the result page loads
    Then the flood probability should be in the Low to Very Low range
    And the result can be used to demonstrate model accuracy during the presentation

  # ─── Edge Cases ───────────────────────────────────────────────────────────

  Scenario: Panel remains usable if landmarks.json fails to load
    Given landmarks.json cannot be fetched or parsed
    Then the district panel still shows all 11 districts by name
    And expanding a district shows an error state or empty message
    And no broken UI elements are rendered

  Scenario: Landmark list is scrollable if it overflows the panel height
    Given a district with 5 landmark points is expanded
    And the panel height is constrained
    Then the landmark list scrolls within the panel
    And the district list above it remains visible and accessible
```

---

## Implementation Notes

### Data
- Source file: `src/data/landmarks.json` (or `public/landmarks.json` if fetched at runtime)
- Structure: `{ districts: [{ district: string, landmarks: [{ name, lat, lng, flooded }] }] }`
- The `flooded` boolean is for UI badging only — it does not influence the ML prediction

### Component Behavior
- Accordion: one district open at a time (controlled state, not CSS-only)
- On landmark click: call existing map fly-to logic + trigger existing prediction flow
- No new API endpoints required — reuses the same `POST /predict` flow

### Suggested Badge Labels
| flooded | Badge text | Color |
|---|---|---|
| true | Historically Flooded | Red / destructive |
| false | Not Flooded | Green / success |

### Coordinate Verification Checklist
Before the demo, spot-check these high-impact validation points in Google Maps:
- [ ] Bucana Barangay (7.0402, 125.6082) — expected: flooded
- [ ] Lasang / Alejandra Navarro (7.0672, 125.6735) — expected: flooded
- [ ] Tibungco (7.1045, 125.6328) — expected: flooded
- [ ] Bankerohan Market (7.0611, 125.6068) — expected: flooded
- [ ] Malagos Garden Resort (7.1312, 125.4104) — expected: not flooded
- [ ] PSHS-DRC Santo Niño (7.0838, 125.5081) — expected: not flooded
- [ ] Davao City Hall (7.0736, 125.6122) — expected: not flooded
