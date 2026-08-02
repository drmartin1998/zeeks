# Implementation Plan: Channel-Based Category Filtering

**Branch**: `009-channel-filter` | **Date**: 2026-08-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-channel-filter/spec.md`

## Summary

Filter all Square catalog categories returned to the website by a configured channel ID. Because Square's `searchObjects` API does not support channel-based query filters, the channel filter must be applied as a **client-side post-fetch filter** in the shared `fetchAllCategories()` function. This ensures every consumer (navigation, category pages, product queries) automatically receives only channel-eligible categories without duplicating filter logic.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16

**Primary Dependencies**: Square Node.js SDK (`square`), Zod, Tailwind CSS

**Storage**: N/A (no new storage; categories fetched from Square API on each request with 1-hour ISR revalidation)

**Testing**: Vitest (unit + integration), Playwright (E2E)

**Target Platform**: Vercel (Node.js serverless)

**Project Type**: Next.js web application (App Router)

**Performance Goals**: Channel filter adds <1ms to existing category fetch (<200ms total p95). **Validation**: The channel filter is a single `Array.prototype.includes()` check per category on arrays of ≤50 categories. At ~50 nanoseconds per check, total overhead is well under 1μs — three orders of magnitude below the <1ms target. No dedicated benchmark task is warranted.

**Constraints**: Server-side only (channel ID never exposed to browser); must not increase Square API calls; no breaking changes to existing consumers

**Scale/Scope**: ~50 categories in Square catalog; 2 allowed top-level categories; 1 channel

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | PASS | Channel filter runs in `fetchAllCategories()` called from async Server Components -- no client-side data access |
| II | API Route Security | PASS | No new API routes. Channel filter on SDK response in existing server code. `SQUARE_CHANNEL_ID` is server-only env var |
| III | Type-Safe Data Flow | PASS | `SquareCatalogCategory` type already includes `channels` field. Filter is a single `.filter()` with type-safe array check |
| IV | Component Architecture | PASS | No new components. Existing FilterBar Category dropdown respects channel-filtered data automatically |
| V | Performance & Caching | PASS | Channel filter is O(n) `.includes()` check with no additional API calls. Existing ISR unchanged |
| VI | Gherkin-First Testing | PASS | `.feature` file exists with 7 scenarios. Tests validate filter correctness at unit/integration level |
| VII | No Mock Data Fallback | PASS | Channel filter on live Square data only. Empty channel = no categories, not mock data |

## Project Structure

### Documentation (this feature)

```text
specs/009-channel-filter/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
lib/square/
├── catalog.ts           # MODIFY: add channel filter to fetchAllCategories()
├── types.ts             # MODIFY: add channels field to SquareCatalogCategory type
└── __tests__/
    └── catalog.test.ts  # MODIFY: add channel filter test cases

.env.local               # MODIFY: add SQUARE_CHANNEL_ID (already in Vercel env)
```

## Complexity Tracking

No constitution violations. All seven principles pass without exception.
