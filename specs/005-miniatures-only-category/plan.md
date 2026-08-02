# Implementation Plan: Allowlisted Category Filtering (Miniatures + Hobby Supplies)

**Branch**: `005-miniatures-only-category` | **Date**: 2026-08-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-miniatures-only-category/spec.md`

## Summary

Add a hardcoded category ID allowlist to the Square catalog data layer so only "Miniatures" (ZCZJWQX6WREDLATZFW3U7OCJ) and "Hobby Supplies" (62G7JSXJDS4U574NW4XS4WKV) top-level categories are returned across all consumers — nav bar, category pages, and the categories API endpoint. Non-allowlisted categories return 404 on category pages. Implementation is a single filter addition to `fetchAllCategories()` in `lib/square/catalog.ts`.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: Next.js 15 (App Router), Square Node.js SDK, Zod, Tailwind CSS, shadcn/ui

**Storage**: N/A — data comes from Square Catalog API at runtime

**Testing**: Vitest (unit/integration), @testing-library/react + MSW (integration), Playwright (E2E)

**Target Platform**: Vercel (serverless Node.js)

**Project Type**: Web application (Next.js App Router, server components first)

**Performance Goals**: Category filtering adds <1ms overhead (in-memory filter on already-fetched array)

**Constraints**: Zero mock data in production; filter must operate on live Square API responses; all existing tests must continue to pass

**Scale/Scope**: 2 allowlisted categories; 3 consumer touchpoints (nav bar, category pages, API route); modification to 1 source file; no new files or routes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | ✅ PASS | Filter applies in server-side data layer; no client component changes needed |
| II | API Route Security | ✅ PASS | No new API routes; existing route handler security is preserved |
| III | Type-Safe Data Flow | ✅ PASS | Filter operates on typed `SquareCatalogCategory[]`; no type changes needed |
| IV | Component Architecture | ✅ PASS | No UI changes; existing shadcn/ui components unchanged |
| V | Performance & Caching | ✅ PASS | In-memory filter on already-fetched array; no additional API calls; existing caching via `Cache-Control` headers preserved |
| VI | Gherkin-First Testing | ✅ PASS | `.feature` file exists with 9 scenarios across 3 user stories; tests will validate against acceptance criteria |
| VII | No Mock Data Fallback | ✅ PASS | Filter operates on live Square data only; graceful fallback to empty array/404; zero mock data in production code |

## Project Structure

### Documentation (this feature)

```text
specs/005-miniatures-only-category/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── features/
│   └── miniatures-only-category.feature
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (NOT created by /speckit-plan)
```

### Source Code (affected files)

```text
lib/square/
├── catalog.ts           # PRIMARY: Add ALLOWED_CATEGORY_IDS filter
├── types.ts             # Unchanged
├── client.ts            # Unchanged
└── __tests__/
    └── catalog.test.ts  # Updated: Add filtering tests

lib/data/
├── categories.ts        # Unchanged (consumes filtered upstream)
└── __tests__/
    └── categories.test.ts  # Updated: Verify only allowlisted categories

app/api/catalog/categories/
├── route.ts             # Unchanged (consumes filtered upstream)
└── __tests__/
    └── route.test.ts    # Updated: Verify only allowlisted categories returned
```

## Complexity Tracking

> No constitution violations. No complexity entries needed.
