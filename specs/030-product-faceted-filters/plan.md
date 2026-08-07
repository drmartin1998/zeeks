# Implementation Plan: Faceted Product Listing Filters

**Branch**: `030-product-faceted-filters` | **Date**: 2026-08-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/030-product-faceted-filters/spec.md`

## Summary

Update the category product listing page (`app/shop/[category]`) with the new Figma faceted designs (`product-listing-faceted` for large/medium/small) and make three facet groups work: subcategories below the currently selected top category, brand (from a per-item custom attribute), and availability (in stock / out of stock). Filters are applied client-side over the already-loaded product set (SC-001, FR-009), combine AND across facet groups and OR within a facet, and dynamically narrow the available options across all three facets as filters are applied (FR-003, FR-006). Availability classifies a product as "in stock" if any variation is available (FR-005). The layout is responsive: left sidebar on large screens, horizontal filter strip on medium, and a "Filter & Categories" toggle with chips on small (FR-008).

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19, Next.js 16 (App Router)

**Primary Dependencies**: Square Node.js SDK (`square`), Zod, Tailwind CSS 4, shadcn/ui, Lucide React, CVA

**Storage**: N/A — all product data from Square API; category listing uses client-side filtering over the loaded product set

**Testing**: Vitest (unit + integration via RTL + MSW), Playwright (E2E)

**Target Platform**: Vercel (Node.js serverless)

**Project Type**: Next.js web application (App Router)

**Performance Goals**: Product list updates within 1 second of filter selection (SC-001); filtering is client-side so no network round-trip per filter change

**Constraints**: Server-side only Square API access (no client-side Square calls); filters applied over the already-loaded product set; no regressions to existing listing, pagination, or sort behavior

**Scale/Scope**: ~50 products across 2 allowed top-level categories; 3 facet groups; updates to the existing category listing page and its components; brand + availability fields added to the listing data path

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | PASS | Page stays an async Server Component; data fetched server-side. New client components are leaf nodes (facet sidebar, filter toggle, chips) that require interactivity via hooks |
| II | API Route Security | PASS | Square fallback data (brand, availability) is computed server-side in `lib/square/catalog.ts`; token never exposed. New API route (if added) validates input via Zod |
| III | Type-Safe Data Flow | PASS | New `brand`, `availability` fields added to `SquareProduct`/`DisplayProduct` types in `lib/square/types.ts`; explicit interfaces; `@/*` imports throughout |
| IV | Vercel-Native Performance | PASS | Client-side filtering avoids per-filter network round-trips; existing ISR/pagination retained; images use `next/image` |
| V | Progressive Enhancement | PASS | Core product grid renders without JS; facet selections are reflected in URL query params so filters are preserved and shareable; graceful empty state when no results |
| VI | Gherkin-First Testing | PASS | `.feature` file exists with 12 scenarios across 4 user stories. Integration tests for the facet components and filtering logic; E2E for the category browse journey |
| VII | Environment-Driven Configuration | PASS | No new config values; reuses `SQUARE_*` env vars validated in `lib/env.ts` |

## Project Structure

### Documentation (this feature)

```text
specs/030-product-faceted-filters/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
├── features/
│   └── product-faceted-filters.feature
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
lib/square/
├── catalog.ts                     # MODIFY: read brand custom attribute + availability in getSquareProductsByCategorySlug()
├── types.ts                       # MODIFY: add brand?, availability to SquareProduct / DisplayProduct
└── __tests__/
    └── catalog.test.ts            # MODIFY: unit tests for brand/availability extraction

app/api/catalog/products/
└── route.ts                        # MODIFY: include brand/availability in response mapping (if used by listing)

app/shop/[category]/
└── page.tsx                        # MODIFY: pass brand facets + availability to listing component

components/product-listing/
├── product-listing-page.tsx        # MODIFY: orchestrate facet state (subcategory/brand/availability), URL sync, dynamic narrowing
├── filter-bar.tsx                  # MODIFY/RESPONSIVE: left sidebar (lg), horizontal strip (md), filter toggle (sm)
├── facet-group.tsx                 # NEW: reusable facet group (label + checkbox options)
├── facet-checkbox.tsx              # NEW: checkbox row for a single facet option
├── filter-toggle.tsx               # NEW: mobile "Filter & Categories" toggle + active-count badge
├── category-chips.tsx              # NEW: wrapping subcategory chips (md/sm)
├── product-grid.tsx                # MODIFY: pass brand/availability for display if needed
└── __tests__/
    ├── filter-facets.test.tsx      # NEW: integration tests for facet filtering/narrowing
    └── filter-bar.test.tsx         # NEW: responsive facet layout tests
```

**Structure Decision**: Next.js App Router. The existing `ProductListingPage` client component is extended to manage facet state (subcategory, brand, availability) with URL query-param sync. Facet UI is split into reusable leaf components (`facet-group`, `facet-checkbox`, `filter-toggle`, `category-chips`) that render responsively across the three breakpoints. The data layer (`lib/square/catalog.ts` + `types.ts`) is extended to surface brand and availability on the product listing data path.

## Research (Phase 0)

Resolved in [research.md](./research.md). Key decisions:
- **Brand extraction**: read `itemData.customAttributeValues` for the brand definition key in `getSquareProductsByCategorySlug()`; no server-side `customAttributeFilters` needed since filtering is client-side.
- **Availability extraction**: derive per-product availability from `variations[].itemVariationData.locationOverrides[]` (in stock if any variation is available), consistent with `getProductDetailBySlug`.
- **Client-side faceted navigation**: options across all three facets dynamically narrow based on the currently applied filters.

## Complexity Tracking

No constitution violations. All seven principles pass without exception.