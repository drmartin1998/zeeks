# Tasks: Faceted Product Listing Filters

**Input**: Design documents from `/specs/030-product-faceted-filters/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Following the Testing Trophy (Kent C. Dodds), every user story MUST
include test tasks. Integration tests are the largest investment; E2E for
critical paths only. Tests MUST be written FIRST and FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing infrastructure and establish quality baseline

- [x] T001 Verify the feature branch and expected files exist (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/api.md`, `features/product-faceted-filters.feature`)
- [x] T002 Run `tsc --noEmit` — record baseline errors (note pre-existing test-file errors only, none in `lib/square/catalog.ts` or `lib/square/types.ts`)
- [x] T003 [P] Run `npm run lint` — record baseline (pre-existing errors in `app/error.tsx`/`app/global-error.tsx` are unrelated)
- [x] T004 [P] Run `npm test` — record baseline failing suites (pre-existing: cart actions, locations, cart-summary, category-product-grid, zod) — confirm no regressions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the shared data layer so brand and availability are available to the listing page before any facet UI is built

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Add `brand?: string` and `availability: "IN_STOCK" | "OUT_OF_STOCK"` to `SquareProduct` in `lib/square/catalog.ts` (interface at lines ~108-123)
- [x] T006 [P] Add `brand?: string` and `availability: "IN_STOCK" | "OUT_OF_STOCK"` to `DisplayProduct` in `lib/square/types.ts` (interface at lines ~231-243)
- [x] T007 Add a `BRAND_KEY` constant (e.g., `"brand"`) in `lib/square/catalog.ts` for the brand custom attribute definition key
- [x] T008 [P] Extend the item mapping in `getSquareProductsByCategorySlug()` in `lib/square/catalog.ts` to read `brand` from `itemData.customAttributeValues?.[BRAND_KEY]?.stringValue`
- [x] T009 [P] Extend the item mapping in `getSquareProductsByCategorySlug()` in `lib/square/catalog.ts` to compute `availability` from variation `itemVariationData.locationOverrides[]` (in stock if any variation is not sold out at `locationId`; default `"IN_STOCK"` when no override data)
- [x] T010 Mirror the `brand`/`availability` reads into the mapper in `app/api/catalog/products/route.ts` so the API contract matches (per `contracts/api.md` Contract 1)
- [x] T011 [P] Unit tests for brand + availability extraction in `lib/square/__tests__/catalog.test.ts` — mock `searchItems` responses with `customAttributeValues` and `locationOverrides`; assert `brand` and `availability` populate correctly (TDD: write first, expect fail)

**Checkpoint**: Foundation ready — `SquareProduct`/`DisplayProduct` carry brand + availability; user story implementation can begin

---

## Phase 3: User Story 1 - Filter products by subcategory (Priority: P1) 🎯 MVP

**Goal**: A subcategory facet populated with subcategories below the selected top-level category that filters the product list (single-select, URL `?sub=`), with dynamic narrowing.

**Independent Test**: Navigate to `/shop/<category>`, select a subcategory → grid shows only that subcategory's products, results count updates, URL gains `?sub=<slug>`.

### Tests for User Story 1 (MANDATORY — Testing Trophy)

- [x] T012 [P] [US1] Integration test for subcategory filtering in `components/product-listing/__tests__/filter-facets.test.tsx` (RTL + MSW) — render `ProductListingPage` with products in multiple subcategories, toggle a subcategory, verify grid + results count + URL updates
- [x] T013 [P] [US1] Integration test for dynamic narrowing in `components/product-listing/__tests__/filter-facets.test.tsx` — verify subcategory options narrow to values present in the filtered set

### Implementation for User Story 1

- [x] T014 [US1] Create reusable `FacetGroup` component in `components/product-listing/facet-group.tsx` (label + list of `FacetCheckbox` options)
- [x] T015 [P] [US1] Create `FacetCheckbox` component in `components/product-listing/facet-checkbox.tsx` (checkbox row with label + selected state)
- [x] T016 [US1] Add subcategory filter state to `components/product-listing/product-listing-page.tsx` — track `activeSubcategories`, read/sync `?sub=` from URL, filter products by `subCategorySlug`
- [x] T017 [US1] Wire the subcategory `FacetGroup` into the filter UI and compute its visible options (distinct subcategories present in the filtered set) in `components/product-listing/product-listing-page.tsx`

**Checkpoint**: User Story 1 fully functional — subcategory facet filters and narrows independently.

---

## Phase 4: User Story 2 - Filter products by brand (Priority: P1)

**Goal**: A brand facet that filters the product list by the brand custom attribute (multi-select, OR within group), with dynamic narrowing and URL `?brand=`.

**Independent Test**: Select a brand → only that brand's products shown; select a second brand → products matching EITHER brand shown; URL gains `?brand=...`.

### Tests for User Story 2 (MANDATORY — Testing Trophy)

- [x] T018 [P] [US2] Integration test for brand filtering in `components/product-listing/__tests__/filter-facets.test.tsx` (RTL + MSW) — select one brand, verify only matching products; select a second brand, verify OR semantics
- [x] T019 [P] [US2] Integration test for brand facet dynamic narrowing in `components/product-listing/__tests__/filter-facets.test.tsx` — verify brand options narrow to values present in the filtered set

### Implementation for User Story 2

- [x] T020 [US2] Add brand filter state to `components/product-listing/product-listing-page.tsx` — track `activeBrands`, read/sync `?brand=` (repeatable) from URL, filter products by `brand` (OR within group)
- [x] T021 [US2] Wire the brand `FacetGroup` into the filter UI and compute visible brand options (distinct brands present in the filtered set) in `components/product-listing/product-listing-page.tsx`

**Checkpoint**: User Stories 1 AND 2 both work independently.

---

## Phase 5: User Story 3 - Filter products by availability (Priority: P2)

**Goal**: An availability facet (In Stock / Out of Stock) that filters the product list; a product is "in stock" if any variation is available.

**Independent Test**: Select "In Stock" → only in-stock products shown; select "Out of Stock" → only out-of-stock products shown; URL gains `?availability=...`.

### Tests for User Story 3 (MANDATORY — Testing Trophy)

- [x] T022 [P] [US3] Integration test for availability filtering in `components/product-listing/__tests__/filter-facets.test.tsx` (RTL + MSW) — verify "In Stock" and "Out of Stock" filtering, including any-variation in-stock semantics
- [x] T023 [P] [US3] Integration test for availability facet dynamic narrowing in `components/product-listing/__tests__/filter-facets.test.tsx`

### Implementation for User Story 3

- [x] T024 [US3] Add availability filter state to `components/product-listing/product-listing-page.tsx` — track `activeAvailability`, read/sync `?availability=` from URL, filter products by `availability`
- [x] T025 [US3] Wire the availability `FacetGroup` into the filter UI and compute visible availability options in `components/product-listing/product-listing-page.tsx`

**Checkpoint**: All three functional facets (subcategory, brand, availability) work independently and combine via AND across groups.

---

## Phase 6: User Story 4 - Use faceted filters across all screen sizes (Priority: P2)

**Goal**: Render the faceted layouts responsively per the Figma designs — left sidebar (lg), horizontal filter strip with chips (md), "Filter & Categories" toggle + chips (sm). Includes the active-filter count and clear-all control (FR-007).

**Independent Test**: View the listing at lg/md/sm widths — correct facet presentation at each; "Active: N" badge count matches applied filters; clear-all restores the full list.

### Tests for User Story 4 (MANDATORY — Testing Trophy)

- [x] T026 [P] [US4] Integration test for responsive facet layout in `components/product-listing/__tests__/filter-bar.test.tsx` (RTL) — verify sidebar (lg), strip + chips (md), and toggle + chips (sm) render at the appropriate breakpoints
- [x] T027 [P] [US4] Integration test for active-filter count + clear-all in `components/product-listing/__tests__/filter-bar.test.tsx` — verify "Active: N" matches applied filters and clear-all restores the full list

### Implementation for User Story 4

- [x] T028 [US4] Create `FilterToggle` component in `components/product-listing/filter-toggle.tsx` — mobile "Filter & Categories" trigger with sliders icon + "Active: N" badge
- [x] T029 [P] [US4] Create `CategoryChips` component in `components/product-listing/category-chips.tsx` — wrapping subcategory pill chips (md/sm)
- [x] T030 [US4] Update `components/product-listing/filter-bar.tsx` to render the three responsive layouts — left sidebar (lg), horizontal strip (md), toggle + chips (sm) — for the three facet groups
- [x] T031 [US4] Add active-filter count computation and clear-all handler in `components/product-listing/product-listing-page.tsx` (FR-007, SC-005)
- [x] T032 [US4] Ensure filter state is preserved across pagination and URL-driven initial load in `components/product-listing/product-listing-page.tsx` (FR-009, edge cases)

**Checkpoint**: All four user stories functional and independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: E2E coverage, empty-state handling, Gherkin alignment, quality gates

- [x] T033 [P] E2E test for the category browse journey in `tests/e2e/product-faceted-filters.spec.ts` — Playwright: navigate to a category, apply a subcategory/brand/availability filter, verify grid + URL (critical path)
- [x] T034 [P] Handle edge cases in `components/product-listing/product-listing-page.tsx` — hide subcategory facet when none exist, hide brand facet when no products carry a brand, empty state with clear-filters option when zero results (FR-011, edge cases)
- [x] T035 Update `specs/030-product-faceted-filters/features/product-faceted-filters.feature` if implementation reveals acceptance-criteria gaps (keep in sync with clarified behavior)
- [x] T036 Run `quickstart.md` validation scenarios (VS-1 through VS-7) — all pass
- [x] T037 Run full quality gate: `tsc --noEmit && npm run lint && npm test`
- [x] T038 Update `specs/030-product-faceted-filters/checklists/requirements.md` — mark completed items [x]

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — Independent of US2/US3/US4
- **Phase 4 (US2)**: Depends on Phase 2 — reuses US1 filter-UI primitives but is independently testable
- **Phase 5 (US3)**: Depends on Phase 2 — reuses US1 filter-UI primitives but is independently testable
- **Phase 6 (US4)**: Depends on Phase 2 and the facet UI primitives from US1–US3 (responsive layout renders all facets)
- **Phase 7 (Polish)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) — needs the `FacetGroup`/`FacetCheckbox` primitives from US1
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) — needs the `FacetGroup`/`FacetCheckbox` primitives from US1
- **User Story 4 (P2)**: Depends on US1–US3 facet state being present to render responsively

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Data-layer changes completed in Phase 2 before UI (per story)
- Component primitives before wiring into the page
- Story complete before moving to next priority

### Parallel Opportunities

- Phase 1 tasks T002-T004 marked [P] can run in parallel
- Phase 2 tasks T006, T008, T009, T011 marked [P] can run in parallel
- Tests within each story marked [P] can run in parallel
- US2 (Phase 4) and US3 (Phase 5) can run in parallel after US1 primitives exist
- Phase 7 polish tasks T033, T034, T036 marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch both US1 tests together:
Task: "Integration test for subcategory filtering in components/product-listing/__tests__/filter-facets.test.tsx"
Task: "Integration test for dynamic narrowing in components/product-listing/__tests__/filter-facets.test.tsx"

# Launch US1 component primitives together:
Task: "Create FacetGroup in components/product-listing/facet-group.tsx"
Task: "Create FacetCheckbox in components/product-listing/facet-checkbox.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (brand + availability data layer)
3. Complete Phase 3: User Story 1 (subcategory facet)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → data layer ready
2. Add User Story 1 → subcategory facet → Deploy (MVP!)
3. Add User Story 2 → brand facet → Deploy
4. Add User Story 3 → availability facet → Deploy
5. Add User Story 4 → responsive layouts → Deploy
6. Polish → E2E + edge cases → Complete

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 + primitives
   - Developer B: User Story 2 (after US1 primitives)
   - Developer C: User Story 3 (after US1 primitives)
   - Developer D: User Story 4 (after US1-3)
3. Stories integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- The data-layer changes (Phase 2) are required before any facet UI per `research.md`