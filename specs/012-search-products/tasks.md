# Tasks: Product Search

**Input**: Design documents from `specs/012-search-products/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md
**Status**: 🔄 In Progress (Phases 1–3 implemented; Phase 4 Testing pending)

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [x] T001 Add `searchProductsByQuery(q: string)` function in `lib/square/catalog.ts` — calls `catalogApi.searchItems({ textFilter: q, enabledLocationIds: [locationId], limit: 100 })`, transforms items to `DisplayProduct[]` with slug, title, price.

## Phase 2: User Story 1 - Search Products by Keyword (P1) 🎯 MVP

**Goal**: Users search by keyword and see matching products from Square in a product listing layout.

**Independent Test**: Type "warhammer" in nav search bar, press Enter → browser navigates to `/search?q=warhammer`, products display in a grid.

- [x] T002 [P] [US1] Wire search input in `components/nav-bar.tsx` — add `useState` for value, `useRouter` for navigation, `<form onSubmit>` that calls `router.push(/search?q=...)` on non-empty submit.
- [x] T003 [US1] Create `app/search/page.tsx` — Server Component reading `?q=` from searchParams, calling `searchProductsByQuery()`, displaying heading with result count, ProductGrid (with built-in pagination), loading skeleton during fetch, empty state for zero results, and error message on API failure.

## Phase 3: Polish

- [x] T004 Run `tsc --noEmit` — PASSED (0 errors)
- [x] T005 Run `npm test` — PASSED (78 tests)
- [x] T006 Validate search via `curl 'http://localhost:3000/search?q=warhammer'` — returns results

## Phase 4: Testing

- [ ] T007 [P] [US1] Unit test for `searchProductsByQuery()` in `lib/square/__tests__/catalog.test.ts` — mock `catalogApi.searchItems`, verify it transforms items to `DisplayProduct[]` with slug/title/price.
- [ ] T008 [P] [US1] Integration test for `app/search/page.tsx` in `app/search/__tests__/page.test.tsx` — render with searchParams, MSW intercepts Square API, assert ProductGrid renders products and empty state displays for zero results.
- [ ] T009 [US1] E2E test for search journey in `tests/e2e/search.spec.ts` — navigate to home, type keyword in nav search bar, submit, verify navigation to `/search?q=keyword`, verify product grid renders, verify empty search submits stay on page.
- [ ] T010 Performance verification: Measure server-side `searchProductsByQuery()` execution time — add `console.time` or a simple timing wrapper, verify <500ms for typical queries. Verify search page LCP < 2.5s using browser DevTools or Playwright tracing.
- [ ] T011 [P] [US1] Integration test for search error state — MSW returns 500 from Square, assert error message renders, nav bar still present, no blank page.
- [ ] T012 [P] [US1] Integration test for search loading state — verify loading skeleton appears before results render.

---

## Implementation Strategy

### MVP (Complete)

1. Setup: Create `searchProductsByQuery()` (T001)
2. US1: Wire nav bar + create search page (T002-T003)
3. Polish: Quality gates (T004-T006)
4. Testing: Unit + Integration + E2E + Performance (T007-T012)
