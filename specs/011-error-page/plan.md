# Implementation Plan: Gaming-Themed Error Page

**Branch**: `011-error-page` | **Date**: 2026-08-02 | **Spec**: [spec.md](./spec.md)

**Updated**: 2026-08-02 — Redesigned to match Figma gaming theme (node 123:1792)

## Summary

Create a branded, gaming-themed error page matching the Figma `error-page` design. Features a battlefield illustration with a D20 dice, "FAILED SAVING THROW" badge overlay, "CRITICAL MISS!" headline (Outfit Black 56px, purple #7B4FA2), thematic subheading, "Regroup at Homepage" primary button, and "Visit our homepage" link. Uses three Next.js error files: `error.tsx`, `not-found.tsx`, `global-error.tsx`, all sharing a common `ErrorPage` component.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16
**Primary Dependencies**: next/image, existing Button and Link components
**Assets**: `public/images/error-illustration.png` (battlefield illustration from Figma)
**Storage**: N/A
**Testing**: Vitest, Playwright (E2E)
**Target Platform**: Vercel (Node.js serverless)
**Project Type**: Next.js web application (App Router)
**Performance Goals**: Error page renders in <500ms
**Constraints**: `error.tsx` and `global-error.tsx` must be Client Components; `not-found.tsx` can be Server Component
**Scale/Scope**: 4 new files; 1 shared component; 1 static image asset; reuses existing nav/footer

## Constitution Check

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | PASS | not-found.tsx is RSC; error.tsx must be client (Next.js requirement) |
| II | API Route Security | PASS | No API routes; no Square data access |
| III | Type-Safe Data Flow | PASS | Simplified props (showNav only); proper Next.js error types |
| IV | Vercel-Native Performance | PASS | Static error page; next/image optimization for illustration |
| V | Progressive Enhancement | PASS | not-found.tsx renders without JS |
| VI | Gherkin-First Testing | PASS | Updated scenarios in error-page.feature |
| VII | No Mock Data Fallback | PASS | No data fetching on error pages |

## Project Structure

```text
public/images/
└── error-illustration.png      # NEW: Battlefield illustration (1.7MB)

components/
└── error-page.tsx              # NEW: Shared gaming-themed error page

app/
├── not-found.tsx               # NEW: 404 page (Server Component)
├── error.tsx                   # NEW: Route-level error boundary (Client Component)
└── global-error.tsx            # NEW: Root-level error boundary (Client Component)
```

## Complexity Tracking

No constitution violations.
