# Tasks: Search Typeahead

**Input**: Design documents from `/specs/031-search-typeahead/`

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

- [x] T001 Verify the feature branch and expected files exist (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/api.md`, `features/search-typeahead.feature`)
- [x] T002 Run `tsc --noEmit` — record baseline errors (note pre-existing test-file errors only, none in `components/` or `lib/`)
- [x] T003 [P] Run `npm run lint` — record baseline (pre-existing errors in `app/error.tsx`/`app/global-error.tsx` are unrelated)
- [x] T004 [P] Run `npm test` — record baseline failing suites (pre-existing: cart actions, locations, cart-summary, zod) — confirm no regressions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the search API route so the typeahead can fetch capped suggestions with a total count

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Add an optional `limit` query param to `app/api/catalog/products/search/route.ts` (validated via Zod) that caps the returned `products` array while keeping the full match count available
- [x] T006 [P] Extend the search route response to include `totalCount` (the total number of catalog matches for the query, independent of `limit`) in `app/api/catalog/products/search/route.ts`
- [x] T007 [P] Unit test for the search route `limit` + `totalCount` in `app/api/catalog/products/search/__tests__/route.test.ts` (or co-located) — mock `searchItems`, verify capped products and correct totalCount (TDD: write first, expect fail)

**Checkpoint**: Foundation ready — the search route supports capped suggestions with a total count; user story implementation can begin

---

## Phase 3: User Story 1 - See product suggestions while typing (Priority: P1) 🎯 MVP

**Goal**: Typing in the search bar shows a dropdown of up to 5 matching product suggestions, updating with each pause in typing (debounced server-side fetch).

**Independent Test**: Focus the nav search input, type "war", and confirm a dropdown of matching suggestions appears and updates with continued typing.

### Tests for User Story 1 (MANDATORY — Testing Trophy)

- [x] T008 [P] [US1] Integration test for debounced suggestion fetch in `components/search-typeahead/__tests__/search-typeahead.test.tsx` (RTL + MSW) — type a query, advance debounce, verify the search route is called once (not per keystroke) and suggestions render
- [x] T009 [P] [US1] Integration test for suggestion updates in `components/search-typeahead/__tests__/search-typeahead.test.tsx` — type a partial keyword, then continue typing, verify the dropdown updates to reflect the full query

### Implementation for User Story 1

- [x] T010 [US1] Create `SearchTypeahead` client component in `components/search-typeahead/search-typeahead.tsx` — managed input value, debounce (~250ms), fetch `/api/catalog/products/search?q=&limit=5`, loading state, dropdown visibility
- [x] T011 [P] [US1] Create `SuggestionRow` component in `components/search-typeahead/suggestion-row.tsx` — renders a single suggestion (name, price, optional image) linking to `/products/<slug>`
- [x] T012 [US1] Create `SuggestionList` component in `components/search-typeahead/suggestion-list.tsx` — dropdown results panel with "PRODUCTS (N results)" header, suggestion rows, and "View all" footer

**Checkpoint**: User Story 1 fully functional — suggestions appear and update while typing.

---

## Phase 4: User Story 2 - See a results count and view all results (Priority: P1)

**Goal**: The dropdown shows the total match count and a "View all results" action that opens the full search results page.

**Independent Test**: Type a query with multiple matches, confirm the dropdown shows "(N results)" and a working "View all results" link to `/search?q=...`.

### Tests for User Story 2 (MANDATORY — Testing Trophy)

- [x] T013 [P] [US2] Integration test for the results count in `components/search-typeahead/__tests__/search-typeahead.test.tsx` (RTL + MSW) — verify "PRODUCTS (N results)" shows the totalCount
- [x] T014 [P] [US2] Integration test for "View all results" in `components/search-typeahead/__tests__/search-typeahead.test.tsx` — click the footer link, verify navigation to `/search?q=<query>`

### Implementation for User Story 2

- [x] T015 [US2] Wire the results count into the `SuggestionList` header (use `totalCount` from the API) in `components/search-typeahead/suggestion-list.tsx`
- [x] T016 [US2] Add the "View all N results for 'query' →" footer link to `/search?q=<query>` in `components/search-typeahead/suggestion-list.tsx`

**Checkpoint**: User Stories 1 AND 2 both work independently.

---

## Phase 5: User Story 3 - Clear the search and see an empty state (Priority: P2)

**Goal**: A clear control empties the input and closes the dropdown; a no-match query shows the Figma empty-state panel.

**Independent Test**: Clear a query (input empties, dropdown closes) and type a nonsense query (empty-state message with alternative searches appears).

### Tests for User Story 3 (MANDATORY — Testing Trophy)

- [x] T017 [P] [US3] Integration test for the clear control in `components/search-typeahead/__tests__/search-typeahead.test.tsx` (RTL) — type a query, click the clear control, verify input empties and dropdown closes
- [x] T018 [P] [US3] Integration test for the empty state in `components/search-typeahead/__tests__/search-typeahead.test.tsx` (RTL + MSW) — mock a zero-result response, verify "No products found for 'query'" and alternative searches render

### Implementation for User Story 3

- [x] T019 [US3] Add the clear "x" control to the typeahead input (only when a query is present) in `components/search-typeahead/search-typeahead.tsx` — empties the query and closes the dropdown (FR-005)
- [x] T020 [P] [US3] Create `EmptyState` component in `components/search-typeahead/empty-state.tsx` — ghost icon + "No products found for 'query'" + "Try searching for..." copy (FR-006)
- [x] T021 [US3] Render the `EmptyState` when the search returns zero matches in `components/search-typeahead/search-typeahead.tsx`

**Checkpoint**: User Stories 1, 2, AND 3 work independently.

---

## Phase 6: User Story 4 - Typeahead works in the navigation search bar (Priority: P1)

**Goal**: The typeahead replaces the nav search bar on every page; submitting still navigates to the search results page.

**Independent Test**: On any page, the nav search bar shows typeahead suggestions while typing; pressing Enter or the search button still goes to `/search?q=...`.

### Tests for User Story 4 (MANDATORY — Testing Trophy)

- [x] T022 [P] [US4] Integration test for nav-bar integration in `components/__tests__/nav-bar.test.tsx` — render the nav, type in the search input, verify the typeahead dropdown appears
- [x] T023 [P] [US4] Integration test for submit navigation in `components/__tests__/nav-bar.test.tsx` — type a query and submit (Enter/button), verify navigation to `/search?q=<query>`

### Implementation for User Story 4

- [x] T024 [US4] Replace the inline search form in `components/nav-bar.tsx` with the `<SearchTypeahead />` component, preserving the submit-to-search behavior (FR-007, FR-008)
- [x] T025 [P] [US4] Add keyboard navigation (ArrowUp/ArrowDown/Enter) and ARIA combobox/listbox roles to `components/search-typeahead/search-typeahead.tsx` (FR-010)
- [x] T026 [US4] Add dropdown dismissal (Escape, outside click) in `components/search-typeahead/search-typeahead.tsx` (FR-009)
- [x] T027 [US4] Ensure a whitespace-only query does not trigger suggestions in `components/search-typeahead/search-typeahead.tsx` (FR-011)

**Checkpoint**: All four user stories functional and independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: E2E coverage, documentation alignment, quality gates

- [x] T028 [P] E2E test for the navigation search journey in `tests/e2e/search-typeahead.spec.ts` — Playwright: navigate, type a query, see suggestions, select one, land on the product page (critical path)
- [x] T029 Update `specs/031-search-typeahead/features/search-typeahead.feature` if implementation reveals acceptance-criteria gaps (keep in sync with clarified behavior)
- [x] T030 Run `quickstart.md` validation scenarios (VS-1 through VS-7) — all pass
- [x] T031 Run full quality gate: `tsc --noEmit && npm run lint && npm test`
- [x] T032 Update `specs/031-search-typeahead/checklists/requirements.md` — mark completed items [x]

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — Independent of US2/US3/US4
- **Phase 4 (US2)**: Depends on Phase 2 and US1 (reuses the SuggestionList) but is independently testable
- **Phase 5 (US3)**: Depends on Phase 2 and US1 (reuses the typeahead input) but is independently testable
- **Phase 6 (US4)**: Depends on US1–US3 (integrates the full typeahead into the nav)
- **Phase 7 (Polish)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational + US1 — needs the SuggestionList
- **User Story 3 (P2)**: Can start after Foundational + US1 — needs the typeahead input
- **User Story 4 (P1)**: Depends on US1–US3 — integrates the complete typeahead into the nav

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Data/API changes completed in Phase 2 before UI (per story)
- Component primitives before wiring into the page
- Story complete before moving to next priority

### Parallel Opportunities

- Phase 1 tasks T002-T004 marked [P] can run in parallel
- Phase 2 tasks T006, T007 marked [P] can run in parallel
- Tests within each story marked [P] can run in parallel
- US2 (Phase 4) and US3 (Phase 5) can run in parallel after US1 primitives exist
- Phase 7 polish tasks T028, T030 marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch both US1 tests together:
Task: "Integration test for debounced suggestion fetch in components/search-typeahead/__tests__/search-typeahead.test.tsx"
Task: "Integration test for suggestion updates in components/search-typeahead/__tests__/search-typeahead.test.tsx"

# Launch US1 component primitives together:
Task: "Create SearchTypeahead in components/search-typeahead/search-typeahead.tsx"
Task: "Create SuggestionRow in components/search-typeahead/suggestion-row.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (search route limit + totalCount)
3. Complete Phase 3: User Story 1 (typeahead with suggestions)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → search API ready
2. Add User Story 1 → suggestions while typing → Deploy (MVP!)
3. Add User Story 2 → results count + view all → Deploy
4. Add User Story 3 → clear + empty state → Deploy
5. Add User Story 4 → nav integration + keyboard/a11y → Deploy
6. Polish → E2E + docs → Complete

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 + primitives
   - Developer B: User Story 2 (after US1 SuggestionList)
   - Developer C: User Story 3 (after US1 input)
3. Stories integrate into the nav (US4) once complete

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- The search API changes (Phase 2) are required before any typeahead UI per `research.md`