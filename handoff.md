# Handoff: FloodSense Design System Implementation

## Goal

Apply the impeccable design system (PRODUCT.md + DESIGN.md) to the FloodSense web app. The system is registered as **product** with a **Restrained** color strategy built around Ocean Teal (`oklch(0.55 0.14 195)`) as the sole brand accent. The north star is "The Barangay Resilience Guide" — community-focused, warm, clear, anti-SaaS-dashboard.

## Current State

### What's done
- **PRODUCT.md** and **DESIGN.md** written at repo root
- **Ocean Teal accent token** applied to CSS variables (`--primary`, `--accent`, `--ring` in light and dark modes)
- **Gradient text banned** — removed from all headers (index.tsx, result.tsx, about.tsx) and gradient backgrounds on buttons and cards
- **Page backgrounds** switched from gradients to solid `bg-background`
- **`.impeccable/design.json`** sidecar written with 6 components (expanded CSS, inline SVGs, hover/focus states)
- **Critique completed** — score 27/40 with 1 P0 and 4 P1 issues identified
- **AGENTS.md** written at repo root

### Critique findings (action items pending)
| Priority | Issue | Location |
|----------|-------|----------|
| P0 | Result page content bloat (6 equal-weight sections) | result.tsx |
| P1 | Purple accent clashes with teal brand | model-comparison.tsx |
| P1 | Side-stripe borders (`border-l-4`) | about.tsx:218-264 |
| P1 | Inconsistent tokens/emoji-vs-lucide | multiple files |
| P1 | Result page ends on dead timestamp | result.tsx:208-211 |

## Files Actively Being Edited

### CSS / Tokens
- `apps/web/src/index.css` — `--primary`, `--accent`, `--ring` updated to Ocean Teal. Light: `oklch(0.55 0.14 195)`, Dark: `oklch(0.65 0.14 195)`. `--accent` is teal-tinted. `--ring` is teal at 40% opacity.

### Routes (all need further work)
- `apps/web/src/routes/index.tsx` — Home page. Headers/layout cleaned up. The sidebar's "Go to District" grid (30+ outline buttons) is dense.
- `apps/web/src/routes/result.tsx` — Result page. The ModelComparison is still purple. Sections are flat. Ends on dead timestamp.
- `apps/web/src/routes/about.tsx` — About page. Side-stripe borders remain. Factor grid uses `bg-gray-100` instead of design tokens.

### Components
- `apps/web/src/components/model-comparison.tsx` — Purple accents throughout (icon, border, gradient, badge, heading text). Primary target for colorize.
- `apps/web/src/components/map.tsx` — `bg-black` at line 286 (violates "never pure black" rule).

### Design System Files
- `PRODUCT.md` — Strategic context
- `DESIGN.md` — Visual design system (Stitch format)
- `.impeccable/design.json` — Sidecar with component HTML/CSS snippets

## What Failed / Dead Ends

- **Shader/gradient removal on buttons**: Was straightforward but the "Analyze Location" button's `shadow-lg shadow-blue-500/30` tinted shadow needed manual removal along with the gradient classes. The shadcn default button styling now takes over via `bg-primary`.
- **`supports-backdrop-filter` syntax mismatch**: about.tsx uses the old Tailwind syntax (`supports-backdrop-filter:`) while result.tsx uses Tailwind v4 bracket syntax (`supports-[backdrop-filter]:`). The v4 version is correct. about.tsx needs updating.
- **`header.tsx` dead code**: A header component exists at `src/components/header.tsx` but no route imports it. All three routes inline their own header.
- **Pre-existing type error**: `src/main.tsx:28` has a TS error (`Cannot find name 'router'`) that predates all design work.

## Next Step

Run `impeccable colorize model-comparison.tsx` — replace the purple accent (icon, border, gradient background, badge, heading text) with the Ocean Teal brand color. This is the user's stated first priority from the critique.

After that, in user's preferred order:
1. `polish about.tsx` — side-stripe borders → proper card layouts
2. `distill result.tsx` — collapse sections, reduce bloat
3. `layout result.tsx` — fix ending, add CTA
4. `polish .` — standardize icons, tokens, syntax

## Suggested Skills

- `impeccable` — All remaining actions use this skill's commands
- `mattpocock/skills@handoff` — Used for this document
