# Research: Password Gate Redesign

**Feature**: 033-password-gate-redesign
**Date**: 2026-08-07

## 1. Design Token Map (from Figma `password-gate`)

**Decision**: Map the Figma design colors/typography to Tailwind utilities for the new page.

**Rationale**: The design specifies a dark, on-brand gate page. The exact colors are available in the Figma export and the app's existing design tokens.

**Colors** (from Figma):
- **Page background**: deep purple `rgb(0.07, 0.047, 0.157)` ≈ `#120E29` — use a custom utility or inline `bg-[#120E29]`.
- **Central glow**: purple ellipse at 40% opacity with a 150px layer blur — a blurred radial div.
- **Ember stars**: light purple `rgb(0.706, 0.51, 1)` ≈ `#B482FF` small blurred dots.
- **Top ambient**: purple at 20% opacity with blur.
- **Headline**: white, Spectral ExtraBold 800, 56px, centered, "SOMETHING EPIC IS COMING".
- **Subhead**: gray `rgb(0.565, 0.565, 0.659)`, Rubik Regular 16px.
- **Input fill**: dark `rgb(0.082, 0.075, 0.141)` ≈ `#15131B` with border `rgb(0.153, 0.153, 0.22)` ≈ `#272738`.
- **Submit button**: orange `rgb(0.91, 0.584, 0.055)` ≈ `#E8950E`, rounded-full (radius 26), white "UNLOCK EARLY ACCESS" (Rubik Bold 16px, letter-spacing 1.5).
- **Footer launch text**: orange `#F5A623`, Rubik Medium 14px, "COMING Q3 2026".
- **Social buttons**: dark fills `#15131B` with border `#272738`, circular (radius 20), 40px.

**Implementation**: Inline Tailwind arbitrary values (`bg-[#120E29]`, `text-[#E8950E]`, etc.) or add a small set of theme tokens if needed. Use Lucide React icons for social (facebook/instagram/twitter/youtube) or simple SVG placeholders.

## 2. Cookie Expiration Change

**Decision**: Change the `site_password` cookie `maxAge` from `60 * 60 * 24 * 7` (7 days) to `60 * 60 * 24` (24 hours) in `app/api/password/route.ts` (FR-005).

**Rationale**: The requirement explicitly asks to reset the cookie expiration to 24 hours for tighter access control.

**Implementation**:
- In `app/api/password/route.ts`, change `maxAge: 60 * 60 * 24 * 7` to `maxAge: 60 * 60 * 24`.

## 3. Form Structure & Reuse

**Decision**: Keep the existing `PasswordForm` submit logic (fetch to `/api/password`, `returnTo` redirect, error handling) and restructure its JSX to the new dark layout. Optionally extract it into `components/auth/password-gate-form.tsx` for clarity.

**Rationale**: The password validation behavior must not change (FR-002/003/004); only the visual layout changes. Extracting the form keeps the page clean.

**Implementation**:
- Rewrite `app/password/page.tsx` to render the dark gate layout (logo header, headline, subhead, form, footer).
- The form uses the existing `Input`/`Button` components (or matching markup) with the new Figma styling.
- Social/launch content is static markup (not data) — allowed per the no-mock-data rule.

## Assumptions

- The `text-input` component named in the Figma composition mapping is represented by the existing `Input` component; no new base component is required.
- Social icons are decorative (no functional links) per the design.
- Responsive behavior uses existing Tailwind breakpoint utilities.