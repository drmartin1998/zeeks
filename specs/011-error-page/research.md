# Research: Gaming-Themed Error Page

**Feature**: 011-error-page
**Date**: 2026-08-02
**Updated**: 2026-08-02 — Redesigned to match Figma gaming theme

## 1. Next.js Error Handling Architecture

**Decision**: Use three Next.js error files: `error.tsx`, `not-found.tsx`, `global-error.tsx`.

**Rationale**:
- `error.tsx` — catches runtime errors in child routes; must be Client Component
- `not-found.tsx` — handles 404s for all routes; can be Server Component
- `global-error.tsx` — catches errors in root layout; must be Client Component, renders its own `<html>`/`<body>`

**Implementation**: All three delegate to a shared `ErrorPage` component. `global-error.tsx` renders standalone (no nav/footer) since the root layout may be unavailable during a root error.

## 2. Figma Design Analysis

**Decision**: Match the Figma `error-page` frame (node 123:1792) exactly.

**Design structure** (VERTICAL layout, 1440×1580, white bg):
1. **nav-bar** — existing component (instance of 98:703)
2. **error-content-container** — centered, 640px max-width:
   - **illustration-frame** (640×380): battlefield image + saving-throw badge overlay
   - **text-stack**: eyebrow → headline → subheading (all center-aligned)
   - **actions-group**: Button + link (horizontal row)
3. **footer** — existing component

**Key design tokens**:
- Headline: Outfit Black 56px, `#7B4FA2` (purple), center-aligned, 110% line-height
- Subheading: Rubik Regular 16px, `#9090A8` (grey-purple), center-aligned, 160% line-height
- Badge bg: `#7B4FA2` (purple)
- Badge text: "FAILED SAVING THROW" (white, Rubik Bold 12px) + "You Rolled a Natural 1" (`#E89516` amber, Rubik Bold 14px)
- Eyebrow: `#E89516` amber, Rubik Bold, uppercase
- Button: primary variant, "Regroup at Homepage"
- Link: "Visit our homepage" below button

## 3. Illustration Asset

**Decision**: Export the battlefield illustration from Figma and serve as a static asset.

**Implementation**: Downloaded from Figma REST API (node 123:1828). Saved to `public/images/error-illustration.png` (1.7MB). Served via `next/image` with priority loading.

## 4. Component Strategy

**Decision**: Single shared `ErrorPage` component with `showNav` prop only.

**Updated (2026-08-02)**: Removed configurable `title`/`description` props. All copy is fixed to match the Figma design exactly. The only variable is whether to render nav/footer (`showNav`), which is false for `global-error.tsx`.
