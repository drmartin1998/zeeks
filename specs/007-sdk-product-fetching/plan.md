# Implementation Plan: SDK-Only Product Fetching

**Branch**: `007-sdk-product-fetching` | **Date**: 2026-08-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-sdk-product-fetching/spec.md`

## Summary

Enforce that 100% of product data displayed in the Zeeks storefront originates from Square SDK calls routed through Next.js Route Handlers. This involves: (1) removing all remaining mock data fallback paths, (2) ensuring all Square SDK calls flow through Route Handlers per Constitution Principle II, (3) adding Zod validation, retry logic, and server-side caching to all product endpoints, and (4) handling SDK errors gracefully with user-facing error states.

Key finding from research: The homepage (`app/page.tsx`) and category page (`app/categories/[slug]/page.tsx`) already use SDK-backed functions from `@/lib/square/catalog`. However, these bypass the Route Handler requirement by calling `catalogApi` directly. Additionally, `lib/data/categories.ts` also calls `catalogApi` directly. The fix is to refactor all direct SDK calls to go through Route Handlers, add Zod validation at the Route Handler boundary, implement retry logic, and add server-side caching.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 19.x, Next.js 16.x (App Router)

**Primary Dependencies**: `square` npm package (v45.0.1), Zod, Next.js Route Handlers, MSW (testing)

**Storage**: Vercel KV / Edge Config (caching); no database migration needed — this is a refactor of the data-fetching layer

**Testing**: Vitest (unit/integration) + @testing-library/react + user-event + MSW (integration) + Playwright (E2E)

**Target Platform**: Vercel (Pro) — Linux serverless functions

**Project Type**: Web application (Next.js App Router eCommerce storefront)

**Performance Goals**: Product page loads < 2 seconds for catalogs ≤ 500 items (SC-003); cached responses < 50ms; TTFB < 200ms

**Constraints**: All SDK calls through Route Handlers (Constitution II); no mock data in production (Constitution VII); Zod-validated all inputs/outputs (Constitution III); `@/*` path alias only (Constitution III)

**Scale/Scope**: ~5 product-displaying pages; ~4 Route Handlers (categories, products, search, detail); ~10 existing files to refactor

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | ✅ PASS | All data fetching in async RSC; `"use client"` only at leaf components |
| II | API Route Security | ⚠️ **VIOLATION** | `lib/square/catalog.ts` and `lib/data/categories.ts` call `catalogApi` directly, bypassing Route Handlers. This MUST be refactored: SDK calls → Route Handlers → Server Components via `fetch()` |
| III | Type-Safe Data Flow | ⚠️ **PARTIAL** | `lib/square/types.ts` has typed interfaces but `lib/square/catalog.ts` uses `as Record<string, unknown>` casts without Zod validation of SDK responses (violates FR-008) |
| IV | Vercel-Native Performance | ⚠️ **PARTIAL** | Categories endpoint has `Cache-Control` headers; product endpoints lack caching. ISR, `next/image`, `next/font` are used in components |
| V | Progressive Enhancement | ✅ PASS | Native `<form>`, `<Link>`, Server Actions already in use; this feature is data-layer only |
| VI | Gherkin-First Testing | ⚠️ **PARTIAL** | `.feature` file NOT yet created. Must run `/speckit-gherkin-sync` before implementation. Existing tests exist for catalog utilities |
| VII | No Mock Data Fallback | ⚠️ **PARTIAL** | No `FALLBACK_*` constants exist. `lib/data.ts` has mock data (`FEATURED_GAMES`, `ALL_PRODUCTS`) but NO production pages import from it directly. However `lib/data.ts` and `lib/data/products.ts` remain as imports available to any page — they should be deprecated/removed or guarded to prevent accidental production use |

### Gate Evaluation

- **Constitution II violation is CRITICAL**: Direct SDK calls in `lib/square/catalog.ts` and `lib/data/categories.ts` MUST be refactored before this feature is complete. This is the core work of this feature.
- **Constitution III (FR-008)**: Zod validation MUST be added to all Route Handlers that process SDK responses.
- **Constitution VI**: `.feature` file MUST exist before implementation begins (enforced by `before_implement` hook).
- **No unjustified violations**: All above violations are pre-existing in the codebase and this feature explicitly exists to resolve them.

## Project Structure

### Documentation (this feature)

```text
specs/007-sdk-product-fetching/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
├── features/            # Gherkin .feature files
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
app/
├── api/
│   └── catalog/
│       ├── categories/route.ts    # Existing — already follows Route Handler pattern
│       ├── products/route.ts      # NEW — product listing by slug
│       ├── search/route.ts        # NEW — product search
│       └── [id]/route.ts          # NEW — product detail by Square item ID
├── categories/[slug]/page.tsx     # Refactor — use Route Handler via fetch()
├── shop/[category]/page.tsx       # Refactor — use Route Handler via fetch()
└── page.tsx                        # Refactor — use Route Handler via fetch()

lib/
├── data.ts                         # MARK AS DEPRECATED — remove mock exports
├── data/
│   ├── categories.ts               # Refactor — route through Route Handler
│   └── products.ts                 # MARK AS TEST-ONLY
├── square/
│   ├── client.ts                   # Keep — Route Handlers need this
│   ├── catalog.ts                  # Refactor — move SDK logic into Route Handlers
│   └── types.ts                    # Enhance — add Zod schemas for SDK responses
├── env.ts                          # Keep — existing Zod env validation
└── utils.ts                        # Keep — existing utilities

tests/
├── setup/vitest-setup.ts
└── e2e/
```

**Structure Decision**: Single Next.js App Router project. No sub-packages needed — this is a refactor of the existing data-fetching layer. New Route Handlers go in `app/api/catalog/`. The `lib/square/` directory retains shared types and Zod schemas. `lib/data/` is systematically deprecated in production paths.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Constitution II: Direct SDK calls bypassed Route Handlers | Pre-existing architecture predated this feature spec | Server Components calling SDK functions directly is simpler but violates constitutional requirement for centralized API security, caching, and retry logic. Route Handlers provide a single chokepoint for all three. |
| `lib/data.ts` mock data remains in codebase | Historical fallback pattern; no production page imports it today | Could be deleted entirely, but test files and MSW handlers may reference the interfaces. Keep as `@deprecated` until all consumers are verified. |
