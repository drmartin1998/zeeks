# Implementation Plan: Product Display Page

**Branch**: `010-product-display-page` | **Date**: 2026-08-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-product-display-page/spec.md`

## Summary

Create a dedicated product detail page at `/products/[slug]` that displays comprehensive product information from the Square catalog. When a user clicks any product name or card anywhere on the site, they navigate to this page. The page matches the Figma `product-detail-page` design and includes: product image gallery, title, price, description, variations, breadcrumb navigation, related products, and an add-to-cart button (visual-only in v1). Data is fetched by calling `getProductDetailBySlug()` directly from the Server Component (no self-referencing `fetch()` — Next.js blocks internal fetches during SSR). The slug resolution uses `catalogApi.search({ objectTypes: ["ITEM"] })` — the same proven method as `fetchAllCategories()`.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16

**Primary Dependencies**: Square Node.js SDK (`square`), Zod, Tailwind CSS, shadcn/ui

**Storage**: N/A (all product data from Square API; ISR caching with 1-hour revalidation)

**Testing**: Vitest (unit + integration), Playwright (E2E)

**Target Platform**: Vercel (Node.js serverless)

**Project Type**: Next.js web application (App Router)

**Performance Goals**: Product detail page loads within 2 seconds (SC-002); image gallery uses `next/image` with lazy loading

**Constraints**: Server-side only data fetching (no client-side Square API calls); must respect existing channel filter; no breaking changes to existing product listings

**Scale/Scope**: ~50 products in Square catalog; 2 allowed top-level categories; 1 new page route; 1 new Route Handler; product links added to existing components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | PASS | Product detail page is an async Server Component; data fetched server-side via Route Handler. Only leaf nodes (image gallery, variation selector) will be client components if interactive behavior requires hooks |
| II | API Route Security | PASS | New Route Handler at `/api/catalog/products/slug/[slug]` proxies Square API; `SQUARE_ACCESS_TOKEN` never exposed to browser; Zod validates input |
| III | Type-Safe Data Flow | PASS | New `ProductDetail` type defined in `lib/square/types.ts`; Zod schema validates API responses; `@/*` imports throughout |
| IV | Vercel-Native Performance | PASS | ISR with 1-hour revalidate; `next/image` for product images; `<Link>` for breadcrumb navigation; `<Suspense>` for related products section |
| V | Progressive Enhancement | PASS | Core content (title, price, image) renders server-side without JS; `<Link>` components produce real `<a href>` tags; add-to-cart is a `<form>` with Server Action (placeholder in v1) |
| VI | Gherkin-First Testing | PASS | `.feature` file exists with 11 scenarios across 3 user stories. Integration tests for Route Handler; component tests for product detail page; E2E for navigation flow |
| VII | No Mock Data Fallback | PASS | All product data from Square API; 404 for missing products; error state for API failures; no mock/fallback data |

## Project Structure

### Documentation (this feature)

```text
specs/010-product-display-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── features/
│   └── product-display-page.feature
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
app/
├── products/
│   └── [slug]/
│       └── page.tsx              # NEW: Product detail page (Server Component)
│
app/api/catalog/products/
├── slug/
│   └── [slug]/
│       └── route.ts              # NEW: Slug-based product lookup Route Handler
│
lib/square/
├── catalog.ts                     # MODIFY: Export slugify for reuse; add getProductBySlug()
├── types.ts                       # MODIFY: Add ProductDetail, ProductVariation types + Zod schemas
└── __tests__/
    └── catalog.test.ts            # MODIFY: Add slug-based product lookup tests

components/
├── product-detail/                 # NEW: Product detail page components
│   ├── product-image-gallery.tsx   # NEW: Image gallery/carousel (client component)
│   ├── product-info.tsx            # NEW: Title, price, description, variations
│   ├── product-variations.tsx      # NEW: Variation selector (client component)
│   └── related-products.tsx        # NEW: Related products grid
└── product-listing/
    ├── product-grid.tsx            # MODIFY: Add product links (<Link> to /products/[slug])
    └── product-card.tsx            # MODIFY: Wrap product title in <Link>

app/categories/[slug]/
└── page.tsx                        # MODIFY: Ensure product links point to /products/[slug]
```

**Structure Decision**: Next.js App Router with Server Components. The product detail page is a new route at `app/products/[slug]/`. A dedicated slug-based Route Handler handles product lookup. Product detail UI components are co-located in `components/product-detail/`. Existing product listing components are modified to add navigation links.

## Complexity Tracking

No constitution violations. All seven principles pass without exception.
