---
name: FloodSense
description: Davao FloodSusceptibility Risk Mapper
colors:
  brand-ocean: "oklch(0.55 0.14 195)"
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  card-surface: "oklch(1 0 0)"
  card-foreground: "oklch(0.145 0 0)"
  control-surface: "oklch(0.97 0 0)"
  control-foreground: "oklch(0.205 0 0)"
  muted-text: "oklch(0.556 0 0)"
  danger: "oklch(0.58 0.22 27)"
  boundary: "oklch(0.922 0 0)"
  chart-primary: "oklch(0.623 0.214 259.815)"
  chart-secondary: "oklch(0.546 0.245 262.881)"
typography:
  display:
    fontFamily: "Inter Variable, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 4vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.15
  body:
    fontFamily: "Inter Variable, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter Variable, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.025em"
rounded:
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.brand-ocean}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-primary-hover:
    backgroundColor: "oklch(0.48 0.14 195)"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  card-default:
    backgroundColor: "{colors.card-surface}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: "1rem 1rem"
  input-default:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.625rem"
    size: "2rem"
  chip-default:
    backgroundColor: "{colors.control-surface}"
    textColor: "{colors.control-foreground}"
    rounded: "{rounded.full}"
    padding: "0.125rem 0.625rem"
---

# Design System: FloodSense

## 1. Overview

**Creative North Star: "The Barangay Resilience Guide"**

Davao FloodSense is a public service tool, not a commercial dashboard. It feels approachable and trustworthy, like a community notice board that happens to be powered by machine learning. The interface is clean and confident, with a warm ocean accent that connects the tool to Davao's coastal identity without feeling thematic or decorative.

The system explicitly rejects the generic SaaS dashboard: no gray sidebars, no metric card grids, no gradient text, no glassmorphism. Information is organized around the map, which is the primary interface. Cards float with a gentle shadow that signals depth without competing with the content. Every element earns its place.

**Key Characteristics:**
- Map-first. The sidebar supports location selection, not the other way around.
- Warm restraint. A single teal accent used sparingly (under 10% of any screen). Neutrals are achromatic.
- Gentle shadow vocabulary. Cards are lifted but not floating, with soft diffused shadows.
- Interpreted data, not raw values. Users are told what the risk means in plain language.

## 2. Colors

The palette is restrained: achromatic neutrals carry the surface, a single teal accent provides orientation and interaction cues, and semantic color is reserved for risk levels.

### Primary (Brand)
- **Ocean Teal** (`oklch(0.55 0.14 195)`): The sole brand accent. Used for primary actions (Analyze button, interactive markers) and selected states. Never decorative. Never used as a background tint on cards.

### Neutral
- **White Surface** (`oklch(1 0 0)`): Card backgrounds, page background. The default container surface.
- **Near-Black Text** (`oklch(0.145 0 0)`): Body and heading text in light mode.
- **Soft Gray Surface** (`oklch(0.97 0 0)`): Muted backgrounds, secondary control surfaces, skeleton loading.
- **Muted Text** (`oklch(0.556 0 0)`): Secondary labels, descriptions, units, timestamps.
- **Boundary** (`oklch(0.922 0 0)`): Borders, dividers, input strokes. Very light, never harsh.

### Semantic
- **Danger** (`oklch(0.58 0.22 27)`): Destructive actions, error states, Very High risk indicators. A muted rose, not a bright red.
- **Risk Low** (`oklch(0.62 0.15 160)`): Emerald-leaning teal for low risk.
- **Risk Moderate** (`oklch(0.7 0.16 75)`): Amber for moderate risk.
- **Risk High** (`oklch(0.65 0.18 45)`): Orange for high risk.
- **Risk Very High** (`oklch(0.58 0.22 27)`): Same as danger — the most urgent color is shared.

### Chart
- **Chart Blue** (`oklch(0.623 0.214 259.815)`): Primary data series, model comparison accents.
- **Chart Deep Teal** (`oklch(0.546 0.245 262.881)`): Secondary data series.

### Dark Mode
Dark mode inverts the neutral stack: surfaces become dark near-blacks, text becomes light. The ocean teal accent remains at the same chroma but shifts to a lighter lightness (`oklch(0.65 0.14 195)`) for contrast. The danger and risk colors hold their hue but increase lightness. Boundaries become `oklch(1 0 0 / 10%)`.

### Named Rules
**The Minimal Palette Rule.** The teal accent covers under 10% of any screen. Color is a scarce resource; its rarity is the point. If a screen has more than two functional colors (accent + one semantic), something is wrong.

**The Semantic Pledge.** Risk levels use shape, position, and text label in addition to color. Red and green are never the only differentiator. The gauge legend, the badge text, and the factor breakdown all encode risk level redundantly.

## 3. Typography

**Display Font:** Inter Variable (with system-ui, sans-serif fallback)
**Body Font:** Inter Variable (with system-ui, sans-serif fallback)

**Character:** Inter is a warm, humanist sans-serif. At display sizes it reads as confident and modern; at body sizes it stays approachable without feeling informal. The single-family stack keeps the interface cohesive and performant.

### Hierarchy
- **Display** (700, clamp(1.5rem, 4vw, 2.25rem), 1.15): Page and section titles. Used sparingly, for the flood risk gauge percentage and the main page heading.
- **Title** (600, 0.9375rem, 1.3): Card titles, section headers within cards.
- **Body** (400, 0.8125rem, 1.5): Primary reading text. Card content, descriptions, paragraphs. Max line length 65ch.
- **Label** (600, 0.75rem, 1.4, 0.025em letter-spacing): Small labels, factor names, metric units. Uppercase where emphasis is needed; otherwise sentence case.

### Named Rules
**The Flat Hierarchy Rule.** Three functional sizes (title, body, label) plus one display size for hero emphasis. No intermediate sizes. Scale contrast does the work that intermediate sizes would do in a less confident system.

## 4. Elevation

Surfaces are flat by default with gentle, diffused shadows that lift cards and dialogs off the background. The shadow vocabulary is soft, using wide blur radii and low opacity rather than tight hard shadows.

### Shadow Vocabulary
- **Card Rest** (`0 4px 24px oklch(0 0 0 / 0.06)`): Default card state. A wide, barely perceptible lift. The entire result page uses this for its cards.
- **Card Hover** (`0 8px 32px oklch(0 0 0 / 0.10)`): Interactive cards on hover. Accent cards (like the location selection card) use `shadow-lg shadow-blue-500/10` which has a tinted hue.
- **Modal / Dialog** (`0 20px 60px oklch(0 0 0 / 0.15)`): The highest elevation. Reserved for overlays and toasts.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to hierarchy (cards that need separation) or interaction (hover, focus). The background itself never casts a shadow.

## 5. Components

### Buttons
- **Shape:** Rounded with medium radius (`rounded-lg`, 0.5rem).
- **Primary:** Ocean Teal background, white text, 0.5rem vertical padding, 1rem horizontal. Used for the single primary action per view (Analyze Location).
- **Hover / Focus:** Darkened variant of Ocean Teal (`oklch(0.48 0.14 195)`). Focus ring uses the ring token at 50% opacity. Transition: 0.2s ease.
- **Outlined:** 1px boundary border, transparent background, hover fills muted surface. Used for secondary actions (Back to Map, About).
- **Ghost:** No border or background, hover fills muted surface. Used in dense control areas.
- **Sizes:** Default (h-8), sm (h-7), xs (h-6), lg (h-9), icon (h/w-8). All use the same radius except xs/sm which use `rounded-md` (0.375rem).

### Cards
- **Corner Style:** Extra-rounded (`rounded-xl`, 1rem).
- **Background:** Pure white (`bg-card`). Accent cards use subtle tinted backgrounds (blue-50, amber-50) with matching border tones.
- **Shadow Strategy:** Card Rest shadow at rest. No border by default (uses `ring-1 ring-foreground/10` for a hairline edge).
- **Internal Padding:** 1rem on all sides via px-4/py-4. Header separates from content with a 0.25rem gap.
- **Title:** Text-sm (0.875rem), font-medium. No bottom border.

### Inputs / Fields
- **Style:** 1px boundary border (`border-input`), transparent background, medium radius (`rounded-lg`, 0.5rem). Height fixed at h-8 (2rem).
- **Focus:** Boundary shifts to ring color, a 1px focus ring appears at 50% opacity. Transition: colors 0.2s ease.
- **Placeholder:** Muted text color.
- **Error:** Danger color replaces the boundary and ring.
- **Disabled:** 50% opacity, muted surface background.

### Badges / Chips
- **Style:** Fully rounded (`rounded-full`), small horizontal padding (0.625rem), vertical padding (0.125rem). Text size xs (0.75rem), semibold.
- **Variants:** Default (primary bg + primary-foreground text), Outline (foreground text, no bg), Secondary (muted bg + muted-foreground), Destructive (danger bg + white text).
- **Usage:** Model agreement indicators (Models Agree / Models Differ), risk level pills, ensemble model labels.

### Skeleton
- **Style:** Muted surface background (`bg-muted`), medium radius (`rounded-lg`), pulse animation.
- **Usage:** Loading placeholders for the gauge, charts, and card content.

### Navigation
- **Style:** Simple top bar with app title and a single action button (About). No sidebar, no tabs. The map IS the navigation.
- **Mobile:** The same top bar, with the action sheet overlaying the map as a bottom panel.

### Risk Gauge (Signature Component)
- Not a gauge visualization — it is a bold percentage with a semantic badge below it. The percentage dominates the card (6xl, extrabold). Below it sits a pill badge with the risk level name. Below that, a 2x2 legend grid shows all four risk thresholds with their color dots.
- This avoids the hero-metric template by replacing the gauge ring/donut with raw typographic weight. The visual hierarchy is: number → label → legend.

## 6. Do's and Don'ts

### Do:
- **Do** use the teal accent sparingly: one element per view at most.
- **Do** let the map occupy the majority of the screen. The sidebar is a reference panel, not a navigation column.
- **Do** use semantic color redundantly with text labels and position for risk levels.
- **Do** prefer flat surfaces with gentle shadows over bordered containers.
- **Do** keep card content tight: one title, one value or short description, one optional action.
- **Do** use the full risk gauge legend (all four tiers) so users always see the scale.

### Don't:
- **Don't** use gradient text, glassmorphism, or heavy animations. The subject demands seriousness.
- **Don't** use side-stripe borders as colored accents on cards. Use full background tints or nothing.
- **Don't** build metric card grids. This is not a business analytics dashboard.
- **Don't** show raw extracted values (Elevation: 123m, Slope: 4.5deg) to the user. Interpret the data instead.
- **Don't** use a sidebar navigation pattern. The map is the interface.
- **Don't** use em dashes in copy. Use commas, colons, or periods.
- **Don't** nest cards. A card inside a card contradicts the elevation model.
- **Don't** use modals as a first resort. Prefer inline expansion or a dedicated route.

<!-- SEED: re-run /impeccable document once teal accent tokens are implemented in the CSS to capture exact values. -->
