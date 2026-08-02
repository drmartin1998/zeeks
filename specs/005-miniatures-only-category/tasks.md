# Tasks: Allowlisted Category Filtering (Miniatures + Hobby Supplies)

**Input**: Design documents from `/specs/005-miniatures-only-category/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Following the Testing Trophy (Kent C. Dodds). Integration tests for components/routes; unit tests for pure logic. Tests written FIRST and verified to FAIL before implementation.

**Organization**: Tasks grouped by user story. All three user stories share a single implementation (filter in `fetchAllCategories()`), but each has independent test verification.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Verify Existing Infrastructure)

**Purpose**: Confirm the project is in a working state before changes

- [x] T001 Verify TypeScript compilation passes: `tsc --noEmit`
- [x] T002 [P] Verify ESLint passes: `npm run lint`
- [x] T003 [P] Verify all existing tests pass: `npm test`

**Checkpoint**: Baseline verified — ready to start implementation

---

## Phase 2: User Story 1 - Nav Bar Shows Only Allowlisted Categories (Priority: P1) 🎯 MVP

**Goal**: Add allowlist filter to `fetchAllCategories()` so nav bar only shows Miniatures and Hobby Supplies

**Independent Test**: `npm test` — all tests pass, nav bar unit/integration tests verify only allowlisted categories appear

### Tests for User Story 1 (MANDATORY — Testing Trophy)

- [x] T004 [P] [US1] Unit test: Add filtering tests in `lib/square/__tests__/catalog.test.ts` — verify `fetchAllCategories()` returns only allowlisted category IDs, excludes others
- [x] T005 [P] [US1] Integration test: Update `lib/data/__tests__/categories.test.ts` — verify `getNavCategories()` returns only allowlisted categories, mock data uses allowlisted IDs
- [x] T006 [P] [US1] Integration test: Update nav bar component test in `components/__tests__/nav-bar.test.tsx` — verify only allowlisted categories appear in nav

### Implementation for User Story 1

- [x] T007 [US1] Add `ALLOWED_CATEGORY_IDS` constant in `lib/square/catalog.ts` with IDs `ZCZJWQX6WREDLATZFW3U7OCJ` (Miniatures) and `62G7JSXJDS4U574NW4XS4WKV` (Hobby Supplies)
- [x] T008 [US1] Add `.filter()` in `fetchAllCategories()` in `lib/square/catalog.ts` to only return categories whose IDs are in `ALLOWED_CATEGORY_IDS`
- [x] T009 [US1] Run T004–T006 tests to confirm they now pass

**Checkpoint**: Nav bar filtering works — allowlisted categories appear, others excluded

---

## Phase 3: User Story 2 - Category Pages Only for Allowlisted Categories (Priority: P2)

**Goal**: Verify category page routes return 200 for allowlisted, 404 for others

**Independent Test**: Visit `/categories/miniatures` → 200; `/categories/board-games` → 404

### Tests for User Story 2

- [x] T010 [P] [US2] Integration test: Update `lib/square/__tests__/catalog.test.ts` — verify `getSquareCategoryBySlug()` returns null for non-allowlisted slugs
- [x] T011 [P] [US2] Verify `lib/data/categories.test.ts` and `app/api/catalog/categories/__tests__/route.test.ts` — confirm tests pass with allowlisted-only mock data

**Checkpoint**: Category pages resolve correctly — allowlisted pages load, others 404

---

## Phase 4: User Story 3 - API Returns Only Allowlisted Categories (Priority: P3)

**Goal**: Verify the categories API endpoint returns only allowlisted top-level categories

**Independent Test**: `GET /api/catalog/categories` returns at most 2 categories (Miniatures, Hobby Supplies)

### Tests for User Story 3

- [x] T012 [P] [US3] Update `app/api/catalog/categories/__tests__/route.test.ts` — verify response contains only allowlisted category IDs; add test case for filtering out non-allowlisted categories
- [x] T013 [US3] Verify all existing route handler tests pass with updated mock data

**Checkpoint**: API returns only allowlisted categories

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T014 Run full test suite: `npm test` — all 30+ tests pass, zero failures
- [x] T015 Run type check: `tsc --noEmit` — zero errors
- [x] T016 Run linter: `npm run lint` — zero errors
- [x] T017 Verify subcategory filtering still works — run existing subcategory tests
- [x] T018 Run quickstart.md validation scenarios (curl commands against dev server)
- [x] T019 Verify Gherkin scenarios are satisfied — cross-reference `.feature` file against implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — verify baseline
- **Phase 2 (US1)**: Depends on Phase 1 — core filter implementation
- **Phase 3 (US2)**: Depends on Phase 2 — tests verify existing behavior after filter
- **Phase 4 (US3)**: Depends on Phase 2 — tests verify API after filter
- **Phase 5 (Polish)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: Core filter implementation — all downstream changes depend on this
- **US2 (P2)**: Test-only verification — depends on US1 filter being in place
- **US3 (P3)**: Test-only verification — depends on US1 filter being in place

### MVP Scope

**MVP = Phase 1 + Phase 2 only** — the core filter implementation with tests delivers all user value:
- Nav bar shows only allowlisted categories (US1)
- Category pages work for allowlisted, 404 for others (US2 — upstream effect)
- API returns only allowlisted categories (US3 — upstream effect)

### Parallel Opportunities

- T001, T002, T003 can run in parallel (Phase 1)
- T004, T005, T006 can run in parallel (US1 tests)
- T010, T011 can run in parallel (US2)

---

## Key Files Affected

| File | Task(s) | Change |
|------|---------|--------|
| `lib/square/catalog.ts` | T007, T008 | Add ALLOWED_CATEGORY_IDS + filter |
| `lib/square/__tests__/catalog.test.ts` | T004, T010 | Add filtering test cases |
| `lib/data/__tests__/categories.test.ts` | T005 | Use allowlisted mock IDs |
| `app/api/catalog/categories/__tests__/route.test.ts` | T012 | Verify allowlist in response |
| `components/__tests__/nav-bar.test.tsx` | T006 | Verify nav filtering |

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently verifiable
- Verify tests fail before implementing
- Commit after each phase completion
- No mock data in production code — all changes operate on live/filtered Square data
