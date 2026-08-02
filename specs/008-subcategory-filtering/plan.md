# Implementation Plan: Subcategory Filtering on Category Pages

**Branch**: `008-subcategory-filtering` | **Date**: 2026-08-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-subcategory-filtering/spec.md`

## Summary

Enable category listing pages (`/categories/[slug]` and `/shop/[category]`) to display all products from a top-level Square category AND its subcategories in a unified view, with client-side filter chips for subcategory narrowing. Filter state persists in the URL (`?sub=<slug>`) for shareability and browser navigation. Includes pagination (12 items/page), contextual zero-results states, and enforcement of the zero-mock-data rule.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: Next.js 16.x (App Router), React 19, Square SDK 45.x, Tailwind CSS 4, Zod

**Storage**: N/A — Square Catalog API is the sole data source

**Testing**: Vitest + @testing-library/react + MSW (unit/integration), Playwright (E2E)

**Target Platform**: Vercel (serverless + edge), modern evergreen browsers

**Project Type**: Next.js App Router web application (single project, `@/*` path alias)

**Performance Goals**: Category page TTFB < 3s (includes Square API round-trips); filter toggles < 100ms (client-side, no network)

**Constraints**: All product/category data MUST come from Square via Route Handlers; zero mock data imports in production code; server components first with `"use client"` only at interactive leaf nodes

**Scale/Scope**: 2 page routes (`/categories/[slug]`, `/shop/[category]`), ~5 components, 13 functional requirements, 16 Gherkin scenarios

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | ✅ PASS | `categories/[slug]` and `shop/[category]` are async server components. Only `CategoryProductGrid` and `FilterBar` use `"use client"` for interactive filtering. |
| II | API Route Security | ✅ PASS | No new API routes needed. Existing Route Handlers at `/api/catalog/products` and `/api/catalog/categories` proxy Square API calls server-side. Tokens never exposed to browser. |
| III | Type-Safe Data Flow | ✅ PASS | Types defined in `lib/square/catalog.ts` (`SquareProduct`, `SquareSubCategory`) and `lib/square/types.ts` (`SquareCatalogCategory`). Zod schemas validate API inputs. `@/*` imports used throughout. |
| IV | Component Architecture | ✅ PASS | shadcn/ui components (Button, Pagination) + Tailwind utility classes + `cn()` helper. Consistent with existing design system. |
| V | Performance & Caching | ✅ PASS | Client-side filtering avoids extra API calls. `Promise.all` parallelizes category + products + subcategories fetch. ISR `revalidate` on category pages reduces Square API traffic. |
## Project Structure

### Documentation (this feature)

```text
specs/008-subcategory-filtering/
├── spec.md                                    # Feature specification (13 FRs, 3 US)
├── plan.md                                    # This file
├── research.md                                # Phase 0: research decisions
├── data-model.md                              # Phase 1: entities, data flow
├── quickstart.md                              # Phase 1: validation scenarios
├── features/
│   └── subcategory-filtering.feature          # Gherkin scenarios (16 scenarios)
└── checklists/
    └── requirements.md                        # Quality checklist (all pass)
```

### Source Code (repository root) — key files

```text
app/
├── categories/[slug]/page.tsx          # RSC: fetches category + products + subcategories
├── shop/[category]/page.tsx            # RSC: similar, via ProductListingPage
└── api/
    ├── catalog/products/route.ts       # GET products by category slug (includes subcategories)
    └── catalog/categories/route.ts     # GET allowed top-level categories

lib/square/
├── catalog.ts                          # Data layer: fetchAllCategories, getSquareSubcategories, SquareProduct
├── types.ts                            # SquareCatalogCategory, NavCategory, Zod schemas
└── client.ts                           # Square SDK client initialization

components/
├── category-product-grid.tsx           # "use client": filter chips + product grid + pagination
├── game-card.tsx                       # Product card with subcategory label
├── product-listing/
│   ├── filter-bar.tsx                  # "use client": subcategory chips support
│   ├── product-listing-page.tsx        # "use client": full listing with filtering
│   └── pagination.tsx                  # Shared pagination component
├── nav-bar-server.tsx                  # RSC: fetches categories for navigation
└── __tests__/
    └── category-product-grid.test.tsx  # Integration tests for filter + pagination

tests/
├── e2e/                                # Playwright E2E tests
└── setup/                              # Vitest setup (MSW handlers, etc.)
```

**Structure Decision**: Single Next.js App Router project. All Square data fetching centralized in `lib/square/catalog.ts` with pure data transforms exportable for Route Handlers. Components accept data as props — never import mock data modules. Filter chips implemented in two separate client components (`CategoryProductGrid` for `/categories/[slug]`, `FilterBar` for `/shop/[category]`) because the page layouts differ (simple grid vs. hero + filter bar + sort controls).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `CategoryProductGrid` duplicates filter logic from `ProductListingPage` | `/categories/[slug]` page needs a lightweight client component for subcategory filtering without the full `ProductListingPage` overhead (hero, filter bar, sorting) | Merging into `ProductListingPage` would require the simpler page to carry unused complexity (sort dropdown, filter sidebar) |

| VI | Gherkin-First Testing (Testing Trophy) | ⚠️ PARTIAL | `.feature` file exists with 16 scenarios. Unit tests for data layer exist. Integration tests for `CategoryProductGrid` exist. E2E tests for subcategory flow needed. |
| VII | No Mock Data Fallback | ✅ PASS | All production code paths use Square data exclusively. Error states (404, ErrorBanner) instead of mock fallbacks. Rule enforced via `.clinerules/rules/no-mock-data-in-production.md`. |
