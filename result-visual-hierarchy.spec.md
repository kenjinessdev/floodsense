# Result Page — Visual Hierarchy & Text Emphasis

## Context

Beta tester feedback after viewing the result page for the first time:
- Important information is not immediately obvious
- The risk level pill (e.g. "High") sits inline next to text and gets lost
- Key facts in the Interpretation section need bolding to draw the eye
- A first-time viewer should be able to scan and know the verdict in under 3 seconds

Applies to: `apps/web/src/routes/result.tsx` (or equivalent result page component)

---

```gherkin
Feature: Result Page Visual Hierarchy and Text Emphasis
  As a first-time FloodSense viewer
  I want the most critical information to be visually prominent
  So that I can immediately understand the flood risk verdict without reading everything

  # ─── Risk Level Pill Placement ────────────────────────────────────────────

  Scenario: Risk level pill is displayed as a standalone prominent element
    Given the result page has loaded with a prediction response
    Then the risk level pill (e.g. "High", "Very Low", "Moderate") is NOT rendered inline beside body text
    And the pill is placed in its own visually distinct area
    And the pill is large enough to be the first thing the eye lands on in its section

  Scenario: Risk level pill in the Interpretation section stands alone above the text
    Given the Interpretation section is visible
    Then the risk level pill appears above the interpretation paragraph
    And there is visible spacing between the pill and the paragraph text below it
    And the pill does not share a line with any descriptive text

  Scenario: Risk level pill color matches severity
    Given the prediction result has a risk level
    Then "Very Low" renders with a green pill
    And "Low" renders with a green or teal pill
    And "Moderate" renders with an orange or amber pill
    And "High" renders with a red pill
    And "Very High" renders with a deep red or destructive pill

  # ─── Text Emphasis in Interpretation Section ──────────────────────────────

  Scenario: Key facts in the Interpretation paragraph are bolded
    Given the Interpretation section is rendered
    Then the specific claim about flood susceptibility level is in bold
      (e.g. "high susceptibility to flooding" or "low flood risk")
    And the recommendation action phrase is in bold
      (e.g. "consider when planning construction" or "continue to monitor")
    And the source qualifier is in bold or italicized
      (e.g. "ensemble model's assessment")
    And non-critical filler text remains in normal weight

  Scenario: Bolded phrases are scannable without reading the full paragraph
    Given the Interpretation paragraph contains bolded phrases
    When a user scans only the bolded text
    Then they can understand the core verdict and recommended action
    Without needing to read the surrounding sentence context

  # ─── Model Performance Comparison Section ────────────────────────────────

  Scenario: Key values in the Model Performance Comparison are visually emphasized
    Given the Model Performance Comparison section is visible
    Then the Probability percentage (e.g. "80.9%") is displayed in a larger or bolder weight than its label
    And the Outcome value (e.g. "Flooded" or "Not Flooded") is bold
    And the AUC score label and value are de-emphasized relative to Risk Level and Probability

  Scenario: The higher-performing model card is visually dominant
    Given both the Baseline and Ensemble model cards are rendered
    Then the Ensemble (RF + XGBoost) card has a more prominent visual treatment
      (e.g. colored border, slightly elevated shadow, or highlighted header)
    And the Baseline card is visually secondary by comparison

  # ─── Overall Scan Path ────────────────────────────────────────────────────

  Scenario: A first-time viewer can identify the verdict in under 3 seconds
    Given the result page has fully loaded
    Then the following are immediately visible without scrolling (above the fold or near top):
      | Element                        | Visibility Requirement         |
      | Flood probability percentage   | Large, prominent number        |
      | Risk level pill                | Standalone, color-coded badge  |
      | Outcome (Flooded / Not Flooded)| Bold, unambiguous label        |
    And secondary details (AUC scores, methodology, regional context) appear below
    And the visual weight of the page decreases top-to-bottom

  # ─── Regression: No Content Removal ──────────────────────────────────────

  Scenario: All existing result page sections remain present
    Given visual hierarchy changes are applied
    Then the Model Performance Comparison section is still visible
    And the Interpretation section is still visible
    And the Regional Context section is still visible
    And the Recommendations section is still visible
    And the Methodology section is still visible
    And no text content is removed — only weight, size, or position is changed
```

---

## Implementation Notes for OpenCode / DeepSeek Agent

### Target file
`apps/web/src/routes/result.tsx` (and any child components it renders)

### Specific changes expected

**1. Risk pill — move and resize**
- Remove it from inline position (next to text)
- Render it as a standalone block element above the interpretation paragraph
- Increase pill font size: at minimum `text-sm font-semibold px-3 py-1`, consider `text-base`

**2. Interpretation paragraph — add bold spans**
Wrap key phrases in `<strong>` or Tailwind `font-semibold`:
- The susceptibility claim (e.g. *"high susceptibility to flooding"*)
- The action recommendation (e.g. *"consider this when planning construction"*)
- The model attribution (e.g. *"ensemble model's assessment"*)

**3. Model comparison card — weight hierarchy**
- `Probability` value: bump to `text-2xl font-bold` or similar
- `Outcome` value: `font-semibold`
- `AUC` score row: reduce to `text-xs text-muted-foreground`

**4. Ensemble card distinction**
- Already has a colored border — verify it is visually heavier than the Baseline card
- If not, add `shadow-md` or increase border width on the Ensemble card only

### Tailwind v4 note
This project uses Tailwind v4 — use utility classes directly, no `@apply` in component files.
Do not modify `routeTree.gen.ts` — it is auto-generated.
