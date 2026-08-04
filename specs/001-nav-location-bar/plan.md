# Implementation Plan: Navigation Location Bar

**Branch**: `001-nav-location-bar` | **Date**: 2026-08-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-nav-location-bar/spec.md`

## Summary

Add a location bar to the site navigation header that displays the store's city and today's operating hours with an "Open Now / Closing Soon / Closed Now" status indicator. The location bar is informational only (single physical store, no store selector). Data is fetched server-side from the Square Locations API and passed to the existing `NavBar` client component. On API failure, the location bar is hidden entirely — navigation links remain intact.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode), React 19.2.4
**Primary Dependencies**: Next.js 16.2.10 (App Router), Square Node.js SDK v45.0.1, Tailwind CSS v4, Clerk v7.6.4, Zod v3.25.76, shadcn/ui, lucide-react
**Storage**: N/A — data fetched from Square Locations API per request
**Testing**: Vitest v4 (unit + integration), @testing-library/react, MSW v2 (API mocking), Playwright v1.62 (E2E)
**Target Platform**: Web (Linux/Azure production, Vercel deployment)
**Project Type**: Next.js web application (single-package in `app/`)
**Performance Goals**: Location bar renders within 2s of navigation bar (SC-04); data fetched in parallel with existing category + cart fetches in `NavBarServer`
**Constraints**: "use client" only at leaf nodes (Constitution I); data from Square, no mock fallback (Constitution VII); screen reader support (FR-08)
**Scale/Scope**: Single store, 1 additional fetch in the shared layout server component

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | PASS | Location data fetched in `NavBarServer` (async RSC); `LocationBar` is a client leaf component receiving server-fetched props |
| II | API Route Security | PASS | Square Locations API called server-side only via SDK — no tokens exposed to browser |
| III | Type-Safe Data Flow | PASS | Zod schema for location/business-hours data; TypeScript interfaces in `lib/square/types.ts`; `@/*` imports only |
| IV | Component Architecture | PASS | shadcn/ui primitives where applicable; Tailwind utility classes; `cn()` for merging |
| V | Performance & Caching | PASS | Data fetched once per page render in layout; parallel with existing category/cart fetches |
| VI | Gherkin-First Testing | PASS | `.feature` file exists; integration tests with RTL+MSW for the component; unit tests for open-status logic |
| VII | No Mock Data Fallback | PASS | On Square failure, location bar hides per FR-06 — no mock data substitution |

**No violations.** All 7 principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/001-nav-location-bar/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── layout.tsx                    # Imports NavBarServer (shared layout)
└── api/
    └── catalog/                  # Existing catalog Route Handlers

components/
├── nav-bar-server.tsx            # Updated: adds location data fetch
├── nav-bar.tsx                   # Updated: renders location bar
├── location-bar.tsx              # NEW: client leaf component
└── ui/                           # Existing shadcn/ui primitives

lib/
├── square/
│   ├── client.ts                 # Updated: add locationsApi export
│   ├── locations.ts              # NEW: fetchLocation() / getLocationHours()
│   └── types.ts                  # Updated: add location/hours types + schemas
├── data/
│   └── locations.ts              # NEW: getLocationBarData() sugar
└── utils.ts                      # Existing utilities

specs/
└── 001-nav-location-bar/
    └── features/
        └── nav-location-bar.feature   # Gherkin scenarios (to be created by gherkin-sync)
```

**Structure Decision**: Single web app (Option 2). Feature adds one new component (`location-bar.tsx`), one new Square module (`lib/square/locations.ts`), one new data layer (`lib/data/locations.ts`), plus updates to existing `nav-bar-server.tsx`, `nav-bar.tsx`, `client.ts`, and `types.ts`.

## Complexity Tracking

No violations to justify.
