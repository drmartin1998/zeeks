# Implementation Plan: Subcategory Browsing & Filtering

**Branch**: `003-subcategory-filtering` | **Date**: 2026-08-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/subcategory-filtering/spec.md`

## Summary

Enable category listing pages (`/categories/[slug]` and `/shop/[category]`) to display all products from a top-level Square category AND its subcategories, with client-side filter chips to narrow by subcategory. Filter state persists in the URL (`?sub=<slug>`) for shareability. Includes pagination (12/page) on both routes, contextual zero-results states, and enforcement of the "no mock data in production" rule.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 16.2

**Primary Dependencies**: React 19, Square SDK 45.x, Tailwind CSS 4

**Storage**: N/A (Square Catalog API is the data source)

**Testing**: Vitest + @testing-library/react + MSW (unit/integration), Playwright (E2E)

**Target Platform**: Vercel (serverless + edge), modern browsers

**Project Type**: Next.js App Router web application

**Performance Goals**: Category page TTFB < 3s (includes Square API round-trips); filter toggles < 16ms (instant)

**Constraints**: All data MUST come from Square; zero mock data imports in production code; server components first

**Scale/Scope**: 2 page routes, ~5 components, 15 functional requirements (11 implemented, 4 pending), 11 Gherkin scenarios

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Server Components First | ✅ PASS | `categories/[slug]` and `shop/[category]` are both server components. Only `CategoryProductGrid` and `ProductListingPage` use `"use client"` for interactive filtering. |
| II. API Route Security | ✅ N/A | No new API routes. Square SDK calls happen server-side in `lib/square/catalog.ts`. |
| III. Type-Safe Data Flow | ✅ PASS | New types `SquareSubCategory`, updated `SquareProduct` defined in `lib/square/catalog.ts`. All typed. |
| IV. Gherkin-First Testing | ⚠️ RETRO | `.feature` file created concurrently with plan. Tests not yet written. |
| V. Performance Budget | ✅ PASS | Client-side filtering avoids extra API calls. Parallel `Promise.all` for categories, products, subcategories. |
| VI. Testing Trophy | ⚠️ RETRO | Unit tests for data layer needed. Integration tests for filter UI needed. |
| VII. No Mock Data Fallback | ✅ PASS | Rule created at `.clinerules/rules/no-mock-data-in-production.md`. All production code paths removed. |

## Project Structure

### Documentation (this feature)

```text
specs/subcategory-filtering/
├── spec.md                                    # Feature specification (15 FRs, 3 US, 5 clarifications)
├── plan.md                                    # This file
├── research.md                                # Phase 0: 9 research decisions
├── data-model.md                              # Phase 1: entities, pagination model, URL state model
├── quickstart.md                              # Phase 1: 8 validation scenarios
├── features/
│   └── subcategory-filtering.feature          # Gherkin scenarios (11 scenarios)
└── checklists/
    └── requirements.md                        # Quality checklist (40 items)
```

### Source Code (repository root) — files touched

```text
lib/square/
├── catalog.ts                    # +SquareSubCategory type, +getSquareSubcategories(), +fetchAllCategories()
                                  # Updated SquareProduct with subCategory/subCategorySlug
                                  # Updated getSquareProductsByCategorySlug() to search parent+children

lib/data/
└── categories.ts                 # Removed FALLBACK_NAV_CATEGORIES — returns STATIC_NAV_CATEGORIES only on error

app/
├── categories/[slug]/
│   └── page.tsx                  # Parallel fetch: category + products + subcategories
│                                # Uses CategoryProductGrid client component
├── shop/[category]/

## Phase 0: Research

See [research.md](./research.md) for detailed findings. Key decisions:

| Topic | Decision | Rationale |
|---|---|---|
| API Pagination | Cursor-based loop with `limit: 1000` | Square defaults to 100/page; categories with >100 items were silently truncated |
| Category fetching | Single `fetchAllCategories()` helper | Avoids 4 separate API calls per page request |
| Filtering | Client-side by `subCategorySlug` | Instant toggles, no extra network |
| Mock data | Removed from all production paths | Rule: no mock data in production |
| Subcategory annotation | `Map<id, SubCategory>` O(1) lookup | Efficient product annotation |
| URL filter state | `?sub=<slug>` search param via useSearchParams | Shareable, bookmarkable, back/forward support |
| Zero-results UI | Contextual message + "Show all" button | Clear action path, not confusing generic empty |
| UI Pagination | 12/page on `/categories/[slug]` matching `/shop/[category]` | Performance for 500+ product categories |
| Default sort | "Featured" (Square ordering), no dropdown | Simplicity; `/shop/[category]` has sort if needed |

## Phase 1: Design & Contracts

| Artifact | Path | Description |
|---|---|---|
| Data Model | [data-model.md](./data-model.md) | Entity definitions, relationships, data flow, pagination model |
| Quickstart | [quickstart.md](./quickstart.md) | Validation scenarios and quality gate commands |
| Contracts | N/A | No external API contracts (internal application) |

## Post-Phase-1 Constitution Re-Check

| Principle | Status | Notes |
|---|---|---|
| I. Server Components First | ✅ PASS | Server components fetch data; client components only for interactivity |
| II. API Route Security | ✅ PASS | Square SDK used server-side; no token exposure |
| III. Type-Safe Data Flow | ✅ PASS | `SquareSubCategory`, updated `SquareProduct` typed in catalog.ts |
| IV. Gherkin-First Testing | ⚠️ PARTIAL | `.feature` file exists; tests pending (E2E + integration) |
| V. Performance & Caching | ✅ PASS | Pagination fixes the 100-item truncation bug |
| VI. Testing Trophy | ⚠️ PARTIAL | Unit tests exist; integration/E2E for subcategory flow pending |
| VII. No Mock Data Fallback | ✅ PASS | All fallbacks removed from production paths |

│   └── page.tsx                  # Parallel fetch: nav + products + subcategories
│                                # Passes subCategories to ProductListingPage
└── page.tsx                      # Async Homepage — fetches Square categories/featured games
                                 # Sections hide when Square unavailable

components/
├── category-product-grid.tsx     # NEW — client component: subcategory chips + product grid
├── product-listing/
│   ├── product-listing-page.tsx  # +subCategories prop, +filteredProducts memo, +__all__ filter
│   └── filter-bar.tsx           # +subCategories prop — renders subcategory chips when provided
├── nav-bar.tsx                   # categories prop now REQUIRED (no mock fallback)
├── featured-categories.tsx      # Now accepts categories prop (was hardcoded)
├── featured-games.tsx           # Now accepts games prop (was hardcoded)
└── __tests__/
    └── nav-bar.test.tsx          # Updated for required categories prop

.clinerules/rules/
└── no-mock-data-in-production.md # NEW — rule document
```

**Structure Decision**: Single Next.js App Router project. All Square data fetching centralized in `lib/square/catalog.ts`. Components accept data as props — never import mock data modules.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `CategoryProductGrid` duplicates some logic from `ProductListingPage` | The `/categories/[slug]` page needed a lightweight client component for subcategory filtering without the full `ProductListingPage` (hero, filter bar, sorting, pagination) overhead | Merging into `ProductListingPage` would require making the simpler page carry unused complexity (sorting, pagination) |
| `fetchAllCategories()` is called once per request but destructured into per-function results | Avoids passing large category arrays between functions as parameters | Each function making its own `catalogApi.search()` call was wasteful (2-3 API calls vs 1) |
