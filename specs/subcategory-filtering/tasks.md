# Tasks: Subcategory Browsing & Filtering

**Input**: Design documents from `/specs/subcategory-filtering/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Status**: FR-001 through FR-011 already implemented. FR-012 through FR-015 are pending.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing infrastructure is in place

- [x] T001 Verify Square API pagination fix in `lib/square/catalog.ts` — cursor-based loop with limit:1000
- [x] T002 [P] Run `tsc --noEmit` and `npm run lint` — ensure zero errors before proceeding
- [x] T003 [P] Run `npm test` — confirm all existing tests pass

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Verify shared data layer and components that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Verify `getSquareSubcategories()` in `lib/square/catalog.ts` resolves children by parentCategoryId
- [x] T005 [P] Verify `getSquareProductsByCategorySlug()` in `lib/square/catalog.ts` annotates products with subCategory/subCategorySlug
- [x] T006 [P] Verify `CategoryProductGrid` in `components/category-product-grid.tsx` renders filter chips from SquareSubCategory[] AND shows subcategory association in card labels (FR-006: "Parent — Subcategory" format)
- [x] T007 [P] Verify `FilterBar` in `components/product-listing/filter-bar.tsx` renders subcategory chips when subCategories prop provided
- [x] T008 Verify `ProductListingPage` in `components/product-listing/product-listing-page.tsx` accepts subCategories and filters by subCategorySlug

**Checkpoint**: Foundation ready — all existing FRs verified.

---

## Phase 3: User Story 1 - View All Products Including Subcategories (Priority: P1) 🎯 MVP

**Goal**: Category pages show ALL products from parent + subcategories; pagination prevents performance issues

**Independent Test**: Navigate to `/categories/board-games` → count = parent + subcategory products; 12 per page with page controls

**Status**: Core logic (FR-001) done. Pagination (FR-014) pending.

### Implementation for User Story 1

- [x] T009 [US1] Add `Pagination` import and state (`currentPage`, `setCurrentPage`) in `components/category-product-grid.tsx`
- [x] T010 [US1] Apply client-side pagination (12 items/page) in `components/category-product-grid.tsx` — slice filteredProducts, render `<Pagination>` below grid with page change handler that scrolls to top
- [x] T011 [US1] Ensure "Featured" default sort (Square catalog ordering) — no sort dropdown (FR-015)

### Tests for User Story 1

- [x] T012 [P] [US1] Unit test for cursor pagination in `lib/square/__tests__/catalog.test.ts` — mock 3-page searchItems response, verify all items accumulated
- [x] T013 [P] [US1] Integration test for pagination in `components/__tests__/category-product-grid.test.tsx` — render 20 products, verify page 1 shows 12, page 2 shows 8

---

## Phase 4: User Story 2 - Filter by Subcategory (Priority: P2)

**Goal**: Filter chips narrow the grid; filter state in URL; zero-results shows contextual message + "Show all"

**Independent Test**: Click "Strategy" chip → only Strategy products shown, URL = `?sub=strategy`, refresh preserves. Zero results → contextual message + "Show all" button.

**Status**: Chip rendering + filtering (FR-002-005) done. URL persistence (FR-012) and zero-results (FR-013) pending.

### Implementation for User Story 2

- [x] T014 [US2] Import `useSearchParams`, `useRouter` from `next/navigation` in `components/category-product-grid.tsx`
- [x] T015 [US2] Read initial filter from URL `?sub=<slug>` on mount in `components/category-product-grid.tsx` — sync with activeSub state; update URL via `router.push()` on chip click (set param or remove for "All")
- [x] T016 [US2] Replace generic empty state with contextual zero-results in `components/category-product-grid.tsx` — when activeSub set and filteredProducts empty, show "No products in this subcategory" + "Show all" button that clears activeSub and removes `?sub=` from URL
- [x] T017 [P] [US2] Apply same URL persistence and contextual zero-results to `components/product-listing/product-listing-page.tsx`

### Tests for User Story 2

- [x] T018 [P] [US2] Integration test for URL persistence in `components/__tests__/category-product-grid.test.tsx` — mock useSearchParams, verify chip state syncs with URL
- [x] T019 [P] [US2] Integration test for zero-results in `components/__tests__/category-product-grid.test.tsx` — verify message + "Show all" functional

---

## Phase 5: User Story 3 - Graceful Degradation Without Mock Data (Priority: P3)

**Goal**: Square API unreachable → 404, static-only NavBar, hidden homepage sections

**Independent Test**: Simulate Square downtime → category 404, NavBar = About Us/Locations/Sale only, Featured sections hidden

**Status**: FR-007-011 implemented. Verification + tests pending.

### Verification for User Story 3

- [x] T020 [US3] Verify `app/categories/[slug]/page.tsx` calls `notFound()` when `getSquareCategoryBySlug` returns null
- [x] T021 [P] [US3] Verify `app/shop/[category]/page.tsx` calls `notFound()` when `getSquareCategoryBySlug` returns null
- [x] T022 [P] [US3] Verify `lib/data/categories.ts` `getNavCategories()` returns only STATIC_NAV_CATEGORIES on error (no FALLBACK_NAV_CATEGORIES)
- [x] T023 [P] [US3] Verify `components/nav-bar.tsx` requires `categories` prop (NOT optional) and does NOT import from `@/lib/data`
- [x] T024 [US3] Verify `app/page.tsx` hides `<FeaturedCategories>` / `<FeaturedGames>` when Square data empty

### Tests for User Story 3

- [x] T025 [P] [US3] Unit test for `getNavCategories()` error path in `lib/data/__tests__/categories.test.ts` — mock catalogApi.search rejection, verify returns STATIC_NAV_CATEGORIES only
- [x] T026 [P] [US3] Integration test for NavBar empty state in `components/__tests__/nav-bar.test.tsx` — render with empty categories, verify no product category links

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: E2E tests, Gherkin update, documentation alignment

- [x] T027 Update `specs/subcategory-filtering/features/subcategory-filtering.feature` — add Scenario for URL persistence (@US2) and filter zero-results (@US2) (✅ done during gherkin-sync)
- [x] T028 [P] E2E test for subcategory browsing in `tests/e2e/subcategory-filtering.spec.ts` — Playwright: navigate, verify chips, click chip, verify products + URL
- [x] T029 [P] Run `quickstart.md` validation scenarios — all 8 curl commands pass
- [x] T030 Run full quality gate: `tsc --noEmit && npm run lint && npm test`
- [x] T031 Update `specs/subcategory-filtering/checklists/requirements.md` — mark completed items [x]
- [x] T032 [P] Measure and document SC-001 (TTFB < 3s for category page) — run `curl -w "@curl-format.txt"` against `/categories/board-games` and record time_total

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — Independent of US2/US3
- **Phase 4 (US2)**: Depends on US1 (needs pagination before URL/zero-results)
- **Phase 5 (US3)**: Depends on Phase 2 — Independent of US1/US2
- **Phase 6 (Polish)**: Depends on all user stories complete

### Parallel Opportunities

- T002-T003 (Phase 1) can run in parallel
- T005-T007 (Phase 2) can run in parallel
- T012-T013 (US1 tests) can run in parallel
- T018-T019 (US2 tests) can run in parallel
- T021-T023 (US3 verification) can run in parallel
- T025-T026 (US3 tests) can run in parallel
- T028-T029 (Polish) can run in parallel
- Phase 3 (US1) and Phase 5 (US3) can run in parallel (different files)

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phase 1: Setup → verify tests pass
2. Phase 2: Foundational → verify data layer + components
3. Phase 3: US1 → pagination on categories/[slug]
4. Phase 4: US2 → URL persistence + zero-results
5. **STOP & VALIDATE** — test independently, then deploy

### Incremental Delivery

1. Setup + Foundational → verify existing code
2. Add US1 → pagination → Deploy (performance fix)
3. Add US2 → URL + zero-results → Deploy (UX improvements)
4. US3 already complete (verification only)
5. Polish → E2E + Gherkin → Complete

---

## Notes

- [P] tasks = different files/independent modules, can run in parallel
- [Story] label maps task to user story for traceability
- FR-001-011 already implemented — tasks focus on verification and new FR-012-015
- Tests MUST be written to FAIL first, then implementation makes them pass
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
