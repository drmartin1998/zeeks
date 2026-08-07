# Tasks: Shop Menu Drilldown

**Input**: Design documents from `/specs/036-shop-menu-drilldown/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Following the Testing Trophy (Kent C. Dodds), every user story MUST
include test tasks. Integration tests are the largest investment; E2E for
critical paths only. Tests MUST be written FIRST and FAIL before the
corresponding implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project (Next.js App Router)**: `app/`, `lib/`, `components/`, `tests/` at repository root
- Use `@/*` path alias for all imports (Constitution III)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new project scaffolding required — this is an existing Next.js app. Verify the foundation is ready and the Chrome/Dev tooling is configured.

- [x] T001 Verify repo foundation: `tsc --noEmit` and `npm run lint` pass with zero errors on the `036-shop-menu-drilldown` branch
- [x] T002 [P] Confirm the existing `lib/square/catalog.ts` exports `buildCategoryTree()`, `CategoryTreeNode`, and `fetchAllCategories()` (used by the new tree data layer)
- [x] T003 [P] Confirm the existing Route Handler `app/api/catalog/categories/route.ts` and its `NavCategory`/`mapSquareCategoryToNavCategory` types in `lib/square/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure that both the desktop megamenu and mobile drawer depend on — the nested category tree data type, the extended API contract, and the server data layer that feeds the nav.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Add the hierarchical `NavCategoryNode` type (label, href, children, hasChildren) to `lib/square/types.ts` alongside the existing `NavCategory`
- [x] T005 Add a Zod schema for the nested category-tree API response in `lib/square/types.ts` (Constitution III, validates `nested=true` response)
- [x] T006 Extend `app/api/catalog/categories/route.ts` to support `?nested=true`, returning a `NavCategoryNode[]` tree built from `buildCategoryTree()` + `mapSquareCategoryToNavCategory`; keep the legacy flat response when the param is absent
- [x] T007 Add `getNavCategoryTree()` to `lib/data/categories.ts` that fetches `/api/catalog/categories?nested=true` and returns a `CategoryTree` (`{ root, source }`), returning `source: "empty"` on failure (no fabricated data)
- [x] T008 Update `components/nav-bar-server.tsx` to fetch the `CategoryTree` via `getNavCategoryTree()` and pass it to `NavBar` alongside the existing cart/location data
- [x] T009 [P] Add MSW handler for `GET /api/catalog/categories?nested=true` in `tests/setup/` (used by integration tests)

**Checkpoint**: Foundation ready — the nav receives a nested category tree; user story implementation can begin.

---

## Phase 3: User Story 1 - Shop Megamenu on Desktop (Priority: P1) 🎯 MVP

**Goal**: Replace the flat top-level category links in the main nav row with a single "Shop" item that opens a full-width desktop megamenu showing top-level categories as columns, each with subcategory links, level-2 children indented under their parent, and a "Shop All" link. Opens on hover/click, closes on leave/click-away, closed by default.

**Independent Test**: Render the nav at a desktop viewport, hover/click "Shop", and verify the megamenu panel appears with category columns, subcategories, indented level-2 children, and "Shop All" links; verify it closes on pointer-leave and that subcategory links navigate to `/categories/[slug]?sub=<sub>`.

### Tests for User Story 1 (MANDATORY — Testing Trophy)

> Write these tests FIRST, ensure they FAIL, then implement.

- [x] T010 [P] [US1] Unit test for the `NavCategoryNode` tree-building transform (level-2 indentation, leaf detection) in `lib/square/__tests__/catalog.test.ts` (Vitest)
- [x] T011 [P] [US1] Integration test for the extended `/api/catalog/categories?nested=true` Route Handler with RTL + MSW in `app/api/catalog/categories/__tests__/route.test.ts` (Vitest)
- [x] T012 [US1] Integration test for `NavBar` + `ShopMegamenu` open/close & navigation with RTL + user-event + MSW in `components/shop-menu/__tests__/shop-menu.test.tsx`

### Implementation for User Story 1

- [x] T013 [P] [US1] Add a distinct "Shop" nav item (with chevron affordance) to `components/nav-bar.tsx`, replacing the flat top-level category links; informational links (About, etc.) remain
- [x] T014 [P] [US1] Create `components/shop-menu/shop-megamenu.tsx` ("use client") — full-width panel rendering top-level categories as columns with heading, subcategory links, indented level-2 children, and "Shop All" link
- [x] T015 [US1] Wire hover-open / leave-close / click-toggle behavior and closed-by-default state into `components/nav-bar.tsx` (mounts `ShopMegamenu`; uses `cn()` and existing nav styling tokens)
- [x] T016 [US1] Ensure subcategory links resolve to `/categories/[slug]?sub=<sub>` and top-level links to `/categories/[slug]` in `components/shop-menu/shop-megamenu.tsx`
- [x] T017 [US1] Add graceful handling: when `source === "empty"` or tree is empty, do not render the Shop menu (no fabricated data) in `components/nav-bar.tsx`

**Checkpoint**: User Story 1 fully functional and testable independently (desktop megamenu MVP).

---

## Phase 4: User Story 2 - Shop Drilldown Menu on Mobile (Priority: P2)

**Goal**: A full-screen mobile drawer triggered by tapping "Shop", with a three-level drilldown (top-level → subcategories → leaf subcategories), a back control, the selected parent category visible in the header, and direct navigation for leaf categories.

**Independent Test**: Render the nav at a mobile viewport, tap "Shop", and verify the drawer opens; tap a category with subcategories to advance to level-2, tap a subcategory with children to reach level-3, verify the back control returns to the previous level, and leaf categories navigate directly.

### Tests for User Story 2 (MANDATORY — Testing Trophy)

- [x] T018 [P] [US2] Integration test for the mobile drawer drilldown (open, advance level-2, advance level-3, back, leaf navigation) with RTL + user-event + MSW in `components/shop-menu/__tests__/shop-mobile-drawer.test.tsx`

### Implementation for User Story 2

- [x] T019 [P] [US2] Create `components/shop-menu/shop-mobile-drawer.tsx` ("use client") — full-screen drawer listing top-level categories (level-1)
- [x] T020 [US2] Implement drilldown state in `components/shop-menu/shop-mobile-drawer.tsx`: advancing to level-2 (subcategories) and level-3 (leaf subcategories), with the selected parent category visible in the header
- [x] T021 [US2] Add a back control that returns to the previous level in `components/shop-menu/shop-mobile-drawer.tsx`
- [x] T022 [US2] Wire leaf-category direct navigation (to `/categories/[slug]?sub=<sub>` or `/categories/[slug]`) and drawer close on navigation in `components/shop-menu/shop-mobile-drawer.tsx`

**Checkpoint**: User Stories 1 AND 2 both work independently (desktop megamenu + mobile drilldown).

---

## Phase 5: User Story 3 - Miniatures Category with Deep Nesting (Priority: P2)

**Goal**: Confirm the drilldown correctly handles the Miniatures category's two-level nesting — nested child ranges (e.g., Games Workshop → Warhammer 40K) render indented under their parent on desktop, and drilling reaches the third level on mobile with the hierarchy visible.

**Independent Test**: Populate the nav tree with a Miniatures category that has a subcategory with its own children; verify on desktop the nested range renders indented in the Miniatures column, and on mobile drilling reaches level-3 and back-navigation works.

### Tests for User Story 3 (MANDATORY — Testing Trophy)

- [x] T023 [P] [US3] Unit test asserting the tree builder preserves a two-level-deep Miniatures hierarchy (grandchild under child) in `lib/square/__tests__/catalog.test.ts` (Vitest)
- [x] T024 [US3] Integration test verifying deep nesting renders and drills correctly with three-level Miniatures data in `components/shop-menu/__tests__/shop-menu.test.tsx`

### Implementation for User Story 3

- [x] T025 [P] [US3] Verify/ensure the tree-building transform (`buildCategoryTree` usage in the data layer) yields correct two-level nesting for Miniatures in `lib/data/categories.ts`
- [x] T026 [US3] Add a Miniatures-with-deep-nesting fixture to the MSW handler in `tests/setup/` and confirm desktop indentation + mobile level-3 drilldown render correctly
- [x] T027 [US3] Confirm the selected parent category stays visible in the panel header at each depth for deep hierarchies in `components/shop-menu/shop-mobile-drawer.tsx`

**Checkpoint**: All user stories independently functional, including the hardest Miniatures nesting case.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and overall quality.

- [x] T028 [P] Add E2E test for the Shop → category journey on desktop and mobile in `tests/e2e/shop-menu.spec.ts` (Playwright, critical path)
- [x] T029 [P] Run `quickstart.md` validation scenarios (API tree, desktop open/close, mobile drilldown, default-closed, no-fabricated-data) and confirm all pass
- [x] T030 Confirm accessibility: keyboard open/close (Escape to close), focus management, and aria attributes on the megamenu and drawer
- [x] T031 Run full quality gates: `tsc --noEmit`, `npm run lint`, `npm test`, `npm run test:e2e` — zero failures

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — verifies existing foundation.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories (the nested tree data layer is required by both desktop and mobile).
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational. No dependency on US2/US3 — the desktop megamenu is independently testable.
- **User Story 2 (P2)**: Can start after Foundational. Shares the same `CategoryTree` prop and nav integration as US1; independently testable at a mobile viewport.
- **User Story 3 (P2)**: Can start after Foundational. Validates the deep-nesting case on top of the US1/US2 rendering; independently testable with a Miniatures fixture.

### Within Each User Story

- Tests MUST be written and FAIL before implementation.
- Data-layer / transform tasks before component rendering.
- Story complete before moving to the next priority.

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel.
- All Foundational tasks marked [P] can run in parallel (within Phase 2).
- Once Foundational completes, US1 and US2 can start in parallel (US1 desktop, US2 mobile).
- All tests for a user story marked [P] can run in parallel.
- Different user stories can be worked on in parallel by different team members.

---

## Parallel Example: User Story 1

```bash
# Launch all unit + integration tests for User Story 1 together:
Task: "Unit test for NavCategoryNode tree transform in lib/square/__tests__/catalog.test.ts"
Task: "Integration test for /api/catalog/categories Route Handler in app/api/catalog/categories/__tests__/route.test.ts"

# Launch the independent implementation files together:
Task: "Add Shop nav item to components/nav-bar.tsx"
Task: "Create components/shop-menu/shop-megamenu.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (desktop megamenu)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (nested tree prop)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP: desktop megamenu)
3. Add User Story 2 → Test independently → Deploy/Demo (mobile drilldown)
4. Add User Story 3 → Test independently (Miniatures deep nesting)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (desktop megamenu)
   - Developer B: User Story 2 (mobile drilldown)
3. Developer A/B jointly validate User Story 3 (deep nesting) once both renderers exist

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All Square data MUST come via Route Handlers (Constitution II); no hardcoded categories (Constitution VII)