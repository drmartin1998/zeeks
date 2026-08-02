# Tasks: Subcategory Filtering on Category Pages

**Input**: Design documents from `/specs/008-subcategory-filtering/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅, contracts/ ✅

**Tests**: Following the Testing Trophy (Kent C. Dodds), every user story MUST include test tasks. Integration tests are the largest investment; E2E for critical paths only. Tests MUST be written FIRST and FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify development environment and existing code quality gates

- [ ] T001 Run `tsc --noEmit` and `npm run lint` — ensure zero errors before proceeding
- [ ] T002 [P] Run `npm test` — confirm all existing tests pass
- [ ] T003 [P] Verify dev server is running (`vercel dev` on port 3000) and accessible at `http://localhost:3000`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Verify shared data layer and components that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Verify `getSquareSubcategories()` in `lib/square/catalog.ts` resolves child subcategories by `parentCategory.id` for a given parent slug — returns `SquareSubCategory[]` with correct `id`, `name`, `slug`
- [x] T005 [P] Verify `getSquareProductsByCategorySlug()` in `lib/square/catalog.ts` fetches products from parent + ALL child categories and annotates each product with `subCategory` and `subCategorySlug` fields when applicable
- [x] T006 [P] Verify `fetchAllCategories()` in `lib/square/catalog.ts` filters categories through `ALLOWED_CATEGORY_IDS` and correctly distinguishes top-level from subcategories via `isTopLevelCategory()`

**Checkpoint**: Foundation ready — data layer verified. User story implementation can now begin.

---

## Phase 3: User Story 1 - Browse All Products in a Category Including Subcategories (Priority: P1) 🎯 MVP

**Goal**: Category pages (`/categories/[slug]` and `/shop/[category]`) display ALL products from the parent category AND its subcategories in a unified grid with pagination.

**Independent Test**: Visit `/categories/miniatures` → product count equals parent + subcategory products. Page shows 12 items per page with pagination controls when >12 products.

**FRs covered**: FR-001 (unified fetch), FR-009 (pagination), FR-010 (Featured sort)

### Tests for User Story 1

- [x] T007 [P] [US1] Unit test for `getSquareProductsByCategorySlug()` unified fetch in `lib/square/__tests__/catalog.test.ts` — mock Square API returning products across parent + 2 subcategories, verify all products returned with correct subCategory/subCategorySlug annotations
- [x] T008 [P] [US1] Integration test for pagination in `components/__tests__/category-product-grid.test.tsx` — render with 20 products, verify page 1 shows 12, page 2 shows 8; page controls visible and functional

### Implementation for User Story 1

- [x] T009 [US1] Verify `app/categories/[slug]/page.tsx` fetches category, products, and subcategories in parallel via `Promise.all` — confirm products include both parent-tagged and subcategory-tagged items
- [x] T010 [US1] Verify `app/shop/[category]/page.tsx` passes products (including subcategory products) to `ProductListingPage` component — confirm subcategory-tagged items appear in the product grid
- [x] T011 [US1] Verify `components/category-product-grid.tsx` implements client-side pagination — `ITEMS_PER_PAGE = 12`, `useState` for `currentPage`, `.slice()` on filtered products, `<Pagination>` rendered below grid with page change handler that scrolls to top
- [x] T012 [US1] Verify default sort order is Square's "Featured" ordering (merchant-defined) — no custom sorting applied to products array in either page route (FR-010)

---

## Phase 4: User Story 2 - Filter Products by Subcategory (Priority: P2)

**Goal**: Filter chips display above the product grid showing available subcategories. Clicking a chip filters products client-side. Zero-results shows contextual empty state. Chips are keyboard-accessible.

**Independent Test**: Visit `/categories/board-games` → filter chips for each subcategory visible. Click "Strategy" chip → only Strategy products shown. Click "All" → all products return. Category with no subcategories → no chips appear.

**FRs covered**: FR-002 (filter chips), FR-003 (All default), FR-004 (chip filters), FR-005 (client-side), FR-006 (subcategory label), FR-008 (zero-results), FR-013 (ARIA)

### Tests for User Story 2

- [x] T013 [P] [US2] Integration test for filter chip rendering in `components/__tests__/category-product-grid.test.tsx` — render with 3 subcategories, verify "All" chip + 3 subcategory chips rendered, "All" selected by default
- [x] T014 [P] [US2] Integration test for chip click filtering in `components/__tests__/category-product-grid.test.tsx` — click subcategory chip, verify only matching products visible, verify chip highlight state changes
- [x] T015 [P] [US2] Integration test for zero-results state in `components/__tests__/category-product-grid.test.tsx` — set activeSub to a slug with no matching products, verify "No products in this subcategory" message and "Show all" button rendered

### Implementation for User Story 2

- [x] T016 [US2] Verify `components/category-product-grid.tsx` renders filter chips from `subCategories` prop — "All" chip always present, one chip per subcategory, chips hidden when `subCategories.length === 0`
- [x] T017 [US2] Verify `components/category-product-grid.tsx` client-side filtering — `useMemo` filters `products` by `activeSub` matching `subCategorySlug`; chip click sets `activeSub` and resets `currentPage` to 1
- [x] T018 [US2] Verify `components/category-product-grid.tsx` zero-results UI — when `activeSub` set and `filteredProducts.length === 0`, display contextual "No products in this subcategory" message with "Show all" `<button>` that sets `activeSub = null`
- [x] T019 [US2] Verify `components/game-card.tsx` displays subcategory label — products with `subCategory` show label in "Parent — Subcategory" format (em dash separator) (FR-006)
- [x] T020 [US2] Verify `components/product-listing/filter-bar.tsx` renders subcategory chips when `subCategories` prop provided — integrates with existing filter/sort bar on `/shop/[category]`
- [x] T021 [US2] Verify `components/product-listing/product-listing-page.tsx` applies subcategory filtering — `filteredProducts` memo filters by `activeSub` matching `subCategorySlug`, same zero-results UI pattern as `CategoryProductGrid`
- [x] T022 [US2] Add `aria-pressed` attribute to filter chip `<button>` elements in `components/category-product-grid.tsx` — `aria-pressed="true"` when active, `aria-pressed="false"` when inactive; ensure chips remain keyboard-focusable and activatable via Enter/Space (FR-013)
- [x] T023 [P] [US2] Add `aria-pressed` attribute to subcategory filter chip `<button>` elements in `components/product-listing/filter-bar.tsx` — same pattern as T022 (FR-013)


---

## Phase 5: User Story 3 - Preserve Filter State for Shareability (Priority: P3)

**Goal**: Active subcategory filter is reflected in the URL (`?sub=<slug>`). Opening a filtered URL directly restores the filter state. Browser back/forward navigates between filter states. Error states (404, API failure) are handled gracefully with no mock data.

**Independent Test**: Click "Strategy" chip → URL shows `?sub=strategy`. Copy URL, open in new tab → "Strategy" filter active. Browser back → previous filter restored. Invalid `?sub=` → falls back to "All". Invalid category slug → 404.

**FRs covered**: FR-007 (URL persistence), FR-011 (no mock data), FR-012 (error states)

### Tests for User Story 3

- [x] T024 [P] [US3] Integration test for URL persistence in `components/__tests__/category-product-grid.test.tsx` — mock `useSearchParams` with `sub=strategy`, verify "Strategy" chip pre-selected on mount
- [x] T025 [P] [US3] Integration test for URL update on chip click in `components/__tests__/category-product-grid.test.tsx` — click chip, verify `router.push` called with `?sub=<slug>`; click "All", verify `router.push` called with `?`
- [x] T026 [P] [US3] Integration test for invalid `?sub=` parameter in `components/__tests__/category-product-grid.test.tsx` — mock `useSearchParams` with `sub=nonexistent`, verify falls back to "All" selected

### Implementation for User Story 3

- [x] T027 [US3] Verify `components/category-product-grid.tsx` reads initial filter from `useSearchParams().get("sub")` — validates sub slug against `subCategories`, falls back to `null` (All) for invalid slugs
- [x] T028 [US3] Verify `components/category-product-grid.tsx` updates URL on chip click — `router.push("?sub=" + slug, { scroll: false })` for subcategory, `router.push("?", { scroll: false })` for "All"
- [x] T029 [US3] Verify `components/product-listing/product-listing-page.tsx` implements same URL persistence pattern as `CategoryProductGrid` — `useSearchParams` for initial state, `router.push` on chip click
- [x] T030 [US3] Verify `app/categories/[slug]/page.tsx` returns 404 via `notFound()` when `getSquareCategoryBySlug()` returns `null` (unrecognized category slug) — FR-012
- [x] T031 [US3] Verify `app/shop/[category]/page.tsx` returns 404 via `notFound()` when `getSquareCategoryBySlug()` returns `null` — FR-012
- [x] T032 [US3] Verify `app/categories/[slug]/page.tsx` renders `ErrorBanner` component when Square API fetch fails (transient error) — no mock data served (FR-011)
- [x] T033 [P] [US3] Verify `app/shop/[category]/page.tsx` renders `ErrorBanner` component when Square API fetch fails — no mock data served (FR-011)
- [x] T034 [US3] Verify `components/nav-bar-server.tsx` fetches categories from Square API and passes them as props — no import from `@/lib/data` mock modules (FR-011)
- [x] T035 [P] [US3] Verify `app/page.tsx` homepage hides `FeaturedCategories` and `FeaturedGames` sections when Square data is unavailable — graceful degradation, no mock fallback (FR-011)

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: E2E tests, Gherkin coverage validation, documentation alignment, quality gates

- [x] T036 [P] Create E2E test for subcategory browsing in `tests/e2e/subcategory-filtering.spec.ts` — Playwright: navigate to `/categories/miniatures`, verify chips visible (if subcategories exist), click subcategory chip, verify products filtered, verify URL updated with `?sub=`, refresh page and verify filter preserved
- [x] T037 [P] Create E2E test for error states in `tests/e2e/subcategory-filtering.spec.ts` — navigate to `/categories/nonexistent-slug`, verify 404 page displayed; verify no mock products served
- [x] T038 Verify all 16 Gherkin scenarios from `specs/008-subcategory-filtering/features/subcategory-filtering.feature` are covered by integration or E2E tests — map each `@US1`, `@US2`, `@US3`, `@edge` scenario to corresponding test task
- [ ] T039 Run `quickstart.md` validation scenarios — execute all 8 VS scenarios (curl + browser), confirm all pass
- [ ] T040 Run full quality gate: `tsc --noEmit && npm run lint && npm test && npm run test:e2e` — all must pass with zero errors
- [ ] T041 [P] Measure and document SC-004 (TTFB < 3s for category page) — use browser DevTools or `curl -w` timing against `/categories/miniatures`, record `time_total`
- [x] T042 [P] Update `specs/008-subcategory-filtering/checklists/requirements.md` — mark all items as completed [x] after verification

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — Independent of US2/US3
- **Phase 4 (US2)**: Depends on Phase 2; integrates with US1 (needs unified products to filter)
- **Phase 5 (US3)**: Depends on Phase 2; integrates with US2 (needs URL-enabled chip clicks)
- **Phase 6 (Polish)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 — No dependencies on other stories. Delivers unified product view + pagination independently.
- **User Story 2 (P2)**: Can start after Phase 2 — Depends on US1 only for product data being available. Filter chips and client-side filtering are self-contained within client components.
- **User Story 3 (P3)**: Can start after Phase 2 — Depends on US2 for filter chip click handlers; adds URL layer on top.

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Tests [P] can run in parallel within the same phase
- Implementation tasks run sequentially within each phase (shared files)
- Story complete before moving to next priority

### Parallel Opportunities

- T001-T003 (Phase 1) can run in parallel
- T004-T006 (Phase 2) can run in parallel
- T007-T008 (US1 tests) can run in parallel
- T013-T015 (US2 tests) can run in parallel
- T022 and T023 (ARIA) can run in parallel
- T024-T026 (US3 tests) can run in parallel
- T033 and T035 (US3 verification) can run in parallel
- T036-T037, T041-T042 (Polish) can all run in parallel

---

## Parallel Example: User Story 2

```bash
# Launch all integration tests for User Story 2 together:
Task: "T013 [P] [US2] Integration test for filter chip rendering"
Task: "T014 [P] [US2] Integration test for chip click filtering"
Task: "T015 [P] [US2] Integration test for zero-results state"

# Launch ARIA accessibility additions in parallel:
Task: "T022 [US2] Add aria-pressed to category-product-grid.tsx"
Task: "T023 [P] [US2] Add aria-pressed to filter-bar.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup → dev environment verified
2. Complete Phase 2: Foundational → data layer verified
3. Complete Phase 3: User Story 1 → unified products + pagination
4. **STOP & VALIDATE**: Test US1 independently — products from parent + subcategories visible, pagination works
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → deploy (MVP — unified category view)
3. Add User Story 2 → Test independently → deploy (filter chips + zero-results)
4. Add User Story 3 → Test independently → deploy (URL persistence + error states)
5. Polish → E2E + Gherkin validation → Complete
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:
1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (unified view + pagination)
   - Developer B: User Story 2 (filter chips, ARIA) — can start after US1 products available
   - Developer C: User Story 3 (URL, error states) — can start after US2 chips exist
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests MUST be written to FAIL first, then implementation makes them pass
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- FR-011 (no mock data) is verified across T032-T035 — ensure zero `@/lib/data` imports in production code
- FR-013 (ARIA) is the primary net-new implementation gap (T022, T023); the rest are verification of existing code

