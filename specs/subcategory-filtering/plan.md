# Implementation Plan: Subcategory Browsing & Filtering

**Branch**: `003-subcategory-filtering` | **Date**: 2026-08-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/subcategory-filtering/spec.md`

## Summary

Enable category listing pages (`/categories/[slug]` and `/shop/[category]`) to display all products from a top-level Square category AND its subcategories, with client-side filter chips to narrow by subcategory. Also enforce a "no mock data in production" rule — all data comes from Square API with graceful error states, never hardcoded fallbacks.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 16.2

**Primary Dependencies**: React 19, Square SDK 45.x, Tailwind CSS 4

**Storage**: N/A (Square Catalog API is the data source)

**Testing**: Vitest + @testing-library/react + MSW (unit/integration), Playwright (E2E)

**Target Platform**: Vercel (serverless + edge), modern browsers

**Project Type**: Next.js App Router web application

**Performance Goals**: Category page TTFB < 3s (includes Square API round-trips); filter toggles < 16ms (instant)

**Constraints**: All data MUST come from Square; zero mock data imports in production code; server components first

**Scale/Scope**: 2 page routes, ~5 components, 1 new data module function

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
├── spec.md                                    # Feature specification
├── plan.md                                    # This file
├── features/
│   └── subcategory-filtering.feature          # Gherkin scenarios
└── checklists/
    └── requirements.md                        # Quality checklist
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
