# Tasks: Product Search

**Input**: Design documents from `specs/012-search-products/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md
**Status**: ✅ Complete (implemented)

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [x] T001 Add `searchProductsByQuery(q: string)` function in `lib/square/catalog.ts` — calls `catalogApi.searchItems({ textFilter: q, enabledLocationIds: [locationId], limit: 100 })`, transforms items to `DisplayProduct[]` with slug, title, price.

## Phase 2: User Story 1 - Search Products by Keyword (P1) 🎯 MVP

**Goal**: Users search by keyword and see matching products from Square in a product listing layout.

**Independent Test**: Type "warhammer" in nav search bar, press Enter → browser navigates to `/search?q=warhammer`, products display in a grid.

- [x] T002 [P] [US1] Wire search input in `components/nav-bar.tsx` — add `useState` for value, `useRouter` for navigation, `<form onSubmit>` that calls `router.push(/search?q=...)` on non-empty submit.
- [x] T003 [US1] Create `app/search/page.tsx` — Server Component reading `?q=` from searchParams, calling `searchProductsByQuery()`, displaying heading with result count, ProductGrid, and empty state for zero results.

## Phase 3: Polish

- [x] T004 Run `tsc --noEmit` — PASSED (0 errors)
- [x] T005 Run `npm test` — PASSED (78 tests)
- [x] T006 Validate search via `curl 'http://localhost:3000/search?q=warhammer'` — returns results

---

## Implementation Strategy

### MVP (Complete)

1. Setup: Create `searchProductsByQuery()` (T001)
2. US1: Wire nav bar + create search page (T002-T003)
3. Polish: Quality gates (T004-T006)
