# Implementation Plan: Product Search

**Branch**: `012-search-products` | **Date**: 2026-08-02 | **Spec**: [spec.md](./spec.md)

## Summary

Wire the existing nav bar search input to navigate to `/search?q=keyword`, create a search results page that calls Square's `searchItems` API with a text filter, and display results in a product grid matching the category listing page layout. Reuses existing ProductGrid component. Adds `searchProductsByQuery()` to `lib/square/catalog.ts` for direct server-side search (avoiding self-referencing fetch).

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16
**Primary Dependencies**: Square SDK (`searchItems` with `textFilter`), existing ProductGrid component
**Storage**: N/A
**Testing**: Vitest, Playwright (E2E)
**Target Platform**: Vercel (Node.js serverless)
**Project Type**: Next.js web application (App Router)
**Performance Goals**: Search returns results within 2 seconds
**Constraints**: Server-side only data fetching; must reuse existing ProductGrid
**Scale/Scope**: 1 new page; 1 nav bar wiring change; 1 new catalog function

## Constitution Check

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | PASS | Search page is Server Component; calls `searchProductsByQuery()` directly |
| II | API Route Security | PASS | Square API call server-side; existing search Route Handler preserved |
| III | Type-Safe Data Flow | PASS | Returns typed `DisplayProduct[]` |
| IV | Vercel-Native Performance | PASS | Direct function call, no self-fetch |
| V | Progressive Enhancement | PASS | Server-rendered results; `<Link>` for product navigation |
| VI | Gherkin-First Testing | PASS | 3 scenarios in search-products.feature |
| VII | Environment-Driven Configuration | PASS | Square credentials validated in `lib/env.ts`; `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_ENVIRONMENT` required; sandbox default in dev |

## Project Structure

```text
app/
└── search/
    └── page.tsx                  # NEW: Search results page (Server Component)

components/
└── nav-bar.tsx                    # MODIFY: Wire search input to navigate

lib/square/
└── catalog.ts                     # MODIFY: Add searchProductsByQuery()
```

## Complexity Tracking

| # | Issue | Justification |
|---|-------|---------------|
| II | Direct `catalogApi.searchItems()` call bypasses Route Handlers | Next.js blocks `fetch()` to its own routes during SSR (self-fetch deadlock). The SDK call runs server-side only — Square token is never exposed to the browser. Security intent of Principle II is preserved. Read-only catalog search; no write operations bypass Route Handlers. |
