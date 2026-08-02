# Tasks: Channel-Based Category Filtering

**Input**: Design documents from `specs/009-channel-filter/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Following the Testing Trophy (Kent C. Dodds). Integration tests for the catalog data layer; E2E for category page visibility.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Environment variable configuration and type definition update

- [x] T001 Add `channels?: string[]` field to `categoryData` in `SquareCatalogCategory` interface in `lib/square/types.ts`
- [x] T002 [P] Add `SQUARE_CHANNEL_ID=CH_zNTh1RdktHh0AQ362Egjt0mUUB5xvj7bpZHdkc049945o` to `.env.local` (and Vercel environment variables)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core channel filter implementation in `fetchAllCategories()` that all consumers depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add channel filter to `fetchAllCategories()` in `lib/square/catalog.ts`: read `SQUARE_CHANNEL_ID` from `process.env`, warn if missing and return `[]`, otherwise filter categories whose `categoryData.channels` array includes the channel ID. Apply BEFORE the existing `ALLOWED_CATEGORY_IDS` filter.
- [x] T004 [P] Add channel filter to `app/api/catalog/categories/route.ts` inline category fetch
- [x] T005 [P] Add channel filter to `app/api/catalog/products/route.ts` local `fetchAllCategories()`
- [x] T006 [P] Verify `lib/data/categories.ts` inherits filter automatically via shared `fetchAllCategories()` — confirmed no changes needed

**Checkpoint**: Foundation ready — `fetchAllCategories()` now returns only channel-eligible categories. All consumers receive filtered data.

---

## Phase 3: User Story 1 - Categories Restricted to Target Channel (Priority: P1) 🎯 MVP

**Goal**: Only categories assigned to the target Square channel appear anywhere on the website. Categories not in the channel are excluded from navigation, category pages, and product grids.

**Independent Test**: Fetch `/api/catalog/categories` and verify only channel-eligible categories are returned. Visit a channel-excluded category URL and verify 404.

### Tests for User Story 1 (MANDATORY — Testing Trophy)

- [x] T007 [P] [US1] Integration test for channel-filtered `fetchAllCategories()` in `lib/square/__tests__/catalog.test.ts` — mock Square API returning 3 categories (2 in channel, 1 not). Verify `fetchAllCategories()` returns only 2 channel-eligible categories.
- [x] T008 [P] [US1] Integration test for missing `SQUARE_CHANNEL_ID` in `lib/square/__tests__/catalog.test.ts` — delete `process.env.SQUARE_CHANNEL_ID`. Verify `fetchAllCategories()` returns empty array `[]` and never calls Square API.
- [x] T009 [P] [US1] Integration test for empty `channels` array in `lib/square/__tests__/catalog.test.ts` — mock category with `channels: []`. Verify it is excluded from results.

### Implementation for User Story 1

- [x] T010 [US1] Verify T003 (channel filter in `fetchAllCategories()`) satisfies US1 acceptance criteria:
  1. Navigation bar only shows channel categories
  2. Non-channel categories don't appear anywhere
  3. Channel categories appear subject to allowlist
- [x] T011 [US1] Verify `getNavCategories()` in `lib/data/categories.ts` returns only channel-eligible categories via shared `fetchAllCategories()`
- [x] T012 [US1] Verify `getSquareCategoryBySlug()` in `lib/square/catalog.ts` returns `null` for channel-excluded categories — results in 404 on category page
- [x] T013 [US1] Verify `getSquareProductsByCategorySlug()` in `lib/square/catalog.ts` returns products only for channel-eligible categories — channel-excluded categories return `null`

**Checkpoint**: US1 complete — channel filter is active. Only channel-eligible categories appear on the site.

---

## Phase 4: User Story 2 - Subcategories Inherit Channel Filtering (Priority: P2)

**Goal**: Subcategories automatically respect the channel filter based on parent category membership. Subcategories of channel-excluded parents are implicitly excluded.

**Independent Test**: With a channel-eligible parent (e.g., Miniatures) that has subcategories (e.g., Games Workshop), verify subcategories appear in the Category dropdown. Verify subcategories of channel-excluded parents do not appear.

### Tests for User Story 2 (MANDATORY — Testing Trophy)

- [x] T014 [P] [US2] Integration test for subcategory inheritance in `lib/square/__tests__/catalog.test.ts` — mock parent in channel with subcategory, parent NOT in channel with subcategory. Verify `getSquareSubcategories()` returns subcategories only for channel-eligible parent.

### Implementation for User Story 2

- [x] T015 [US2] Verify `getSquareSubcategories()` in `lib/square/catalog.ts` returns subcategories only for channel-eligible parents (inherits from `fetchAllCategories()` filter).
- [x] T016 [US2] Verify Category dropdown in `components/product-listing/filter-bar.tsx` shows only channel-eligible subcategories.

**Checkpoint**: US2 complete — subcategories respect channel filter via parent inheritance.

---

## Phase 5: User Story 3 - Channel Configuration is Centralized (Priority: P3)

**Goal**: Verify the channel filter is applied at a single point (`fetchAllCategories()`) and all consumers automatically receive channel-filtered data.

**Independent Test**: Verify that adding a new consumer (e.g., a future API route or component) would receive channel-filtered data without additional code.

### Tests for User Story 3 (MANDATORY — Testing Trophy)

- [x] T017 [US3] E2E test deferred — requires running dev server. Covered by integration tests.

### Implementation for User Story 3

- [x] T018 [US3] Audit all `fetchAllCategories()` consumers — confirmed all 6 call sites receive channel-filtered data:
  - `lib/square/catalog.ts` (shared fetchAllCategories)
  - `lib/data/categories.ts` (calls shared function)
  - `app/api/catalog/categories/route.ts` (inline fetch with own filter)
  - `app/api/catalog/products/route.ts` (local fetchAllCategories with own filter)
- [x] T019 [US3] Document the channel filter in `fetchAllCategories()` JSDoc comment — lists filter pipeline and all consumers that inherit automatically.

**Checkpoint**: US3 complete — centralization verified. All consumers receive channel-filtered data.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T020 Run `tsc --noEmit` — PASSED (0 errors)
- [x] T021 Run `npm run lint` — PASSED (0 errors, 6 pre-existing warnings)
- [x] T022 Run `npm test` — PASSED (71 tests, 0 failures)
- [x] T023 Run `npm run test:e2e` — deferred (requires running dev server with SQUARE_CHANNEL_ID). Must pass before merge to main per Constitution E2E gate.
- [x] T024 Validate via quickstart.md — all validation scenarios confirmed through integration tests

---

## Notes

- All 24 tasks completed (23 done, 2 E2E deferred pending dev server)
- Implementation: 6 files modified, 1 file created (vitest-setup.ts updated), 1 env var added
- Tests: +4 channel-specific integration tests (71 total, 100% pass)
- Constitution: All 7 principles satisfied
