# Tasks: Square Product Display

**Input**: Design documents from `/specs/004-square-product-display/`

**Status**: Root cause found and fixed during `/speckit-plan` — `console.dir(object)` typo in `lib/square/catalog.ts:86` removed.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Verify the fix compiles and existing tests pass

- [x] T001 Verify `console.dir(object)` removed from `lib/square/catalog.ts:86`
- [x] T002 [P] Run `tsc --noEmit` — confirm zero errors
- [x] T003 [P] Run `npm test` — confirm all 30 tests pass

---

## Phase 2: Foundational — API Connectivity Verification

**Purpose**: Confirm Square API is reachable and returns data

- [x] T004 Verify Square client initialization in `lib/square/client.ts` — token and environment are set
- [x] T005 [P] Verify `catalogApi.search()` returns categories in `lib/square/catalog.ts` `getSquareCategories()`
- [x] T006 [P] Verify `catalogApi.searchItems()` returns items in `lib/square/catalog.ts` `getSquareProductsByCategorySlug()`

---

## Phase 3: User Story 1 — Products Display on Category Pages (P1) 🎯 MVP

**Goal**: Category pages render product cards from Square

**Independent Test**: Navigate to `/categories/board-games` → product cards visible with titles, prices

- [x] T007 [US1] Start dev server and visit `/categories/board-games` — verify HTTP 200 and product card content in HTML
- [x] T008 [US1] Verify `CategoryProductGrid` in `components/category-product-grid.tsx` renders when products array is non-empty
- [x] T009 [US1] Verify category page returns 404 when Square API returns null for category slug

---

## Phase 4: User Story 2 — Featured Products on Homepage (P2)

**Goal**: Homepage "New Arrivals" section shows products from Square

**Independent Test**: Visit homepage → "New Arrivals" section visible with product cards

- [x] T010 [US2] Verify `app/page.tsx` calls `getSquareCategories()` and `getSquareProductsByCategorySlug()`
- [x] T011 [US2] Verify homepage hides Featured sections when Square returns empty data

---

## Phase 5: User Story 3 — Product Card Data Accuracy (P3)

**Goal**: Product cards show correct title, price, category from Square

**Independent Test**: Compare site product card against Square Dashboard for same item

- [x] T012 [US3] Verify `GameCard` in `components/game-card.tsx` renders title from `product.title`
- [x] T013 [US3] Verify price display in `GameCard` uses `$price.toFixed(2)` dollar format
- [x] T014 [US3] Verify subcategory label format in `components/category-product-grid.tsx` — "Parent — Subcategory" with em dash

---

## Phase 6: Polish

**Purpose**: Final validation and documentation

- [x] T015 Run `quickstart.md` validation scenarios — all 4 checks pass
- [x] T016 Run full quality gate: `tsc --noEmit && npm run lint && npm test`
- [x] T017 Verify zero mock data imports in production: `grep -r "from.*@/lib/data['\"]" app/ components/ --include="*.tsx" --include="*.ts" -l`

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: ✅ Complete — T001-T003 already verified
- **Phase 2 (Foundational)**: T004-T006 — verify Square API connectivity
- **Phase 3 (US1)**: Depends on Phase 2 — verify category page products
- **Phase 4 (US2)**: Depends on Phase 2 — verify homepage products
- **Phase 5 (US3)**: Independent of US1/US2 — verify data accuracy
- **Phase 6 (Polish)**: Depends on all phases complete

### Parallel Opportunities

- T002-T003 (Phase 1) can run in parallel ✅ already done
- T005-T006 (Phase 2) can run in parallel
- Phase 3 (US1) and Phase 5 (US3) can run in parallel
- T016 can include T017

---

## Implementation Strategy

### MVP (US1 Only)

1. Phase 1: Setup ✅ done
2. Phase 2: Verify API connectivity
3. Phase 3: Verify category page products → deploy

### Incremental

1. Setup + Foundational → confirm API works
2. US1 → category pages show products → deploy
3. US2 → homepage shows products → deploy
4. US3 → verify data accuracy → complete
5. Polish → final validation

---

## Notes

- Bug was already found and fixed: `console.dir(object)` → `console.dir(objects)` removed from `lib/square/catalog.ts:86`
- Most tasks are verification, not implementation — the infrastructure already exists
- No new files needed
