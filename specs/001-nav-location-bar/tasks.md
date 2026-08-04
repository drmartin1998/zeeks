# Tasks: Navigation Location Bar

**Input**: Design documents from `specs/001-nav-location-bar/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, features/nav-location-bar.feature

**Tests**: Following the Testing Trophy (Kent C. Dodds), every user story MUST include test tasks. Integration tests are the largest investment; unit tests for pure logic. Write tests FIRST and ensure they FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing. US1 and US2 share the same data source and component, so they form a combined MVP phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to repository root (`/home/drmartin1998/code/zeeks`).

```text
lib/
├── square/
│   ├── client.ts          # Update: add locationsApi
│   ├── locations.ts       # NEW: Square Locations API wrapper
│   └── types.ts           # Update: add location types
├── data/
│   └── locations.ts       # NEW: getLocationBarData()
components/
├── location-bar.tsx        # NEW: client leaf component
├── nav-bar-server.tsx      # Update: fetch location data
└── nav-bar.tsx             # Update: render LocationBar
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add required Square SDK API export to the existing client module.

- [x] T001 [P] Export `locationsApi` from `lib/square/client.ts` using `squareClient.locations`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, schemas, and data-fetching utilities that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Add TypeScript types (`SquareLocationHours`, `LocationBarData`) and Zod schemas (`LocationBarDataSchema`) to `lib/square/types.ts`
- [x] T003 Create `lib/square/locations.ts` with `fetchLocation()` that calls `locationsApi.get({ locationId })` and returns the Square `Location` object
- [x] T004 Create `lib/data/locations.ts` with `getLocationBarData()` that calls `fetchLocation()`, extracts city/state/hours, and returns `LocationBarData | null` (returns `null` on API failure per FR-06)
- [x] T005 [P] Create `lib/square/__tests__/locations.test.ts` — unit test for `fetchLocation()` with MSW mocking Square Locations API
- [x] T006 [P] Create `lib/data/__tests__/locations.test.ts` — unit test for `getLocationBarData()` verifying data transformation and null-on-error behavior

**Checkpoint**: Foundation ready — types and data layer exist, user story implementation can now begin.

---

## Phase 3: User Stories 1 & 2 — City + Hours Display (Priority: P1) 🎯 MVP

**Goal**: Display the store's city and today's operating hours with "Open Now / Closing Soon / Closed Now" status in the navigation bar. US1 and US2 are combined because they share the same data source, computation logic, and render component.

**Independent Test**: Navigate to any page and verify the navigation bar shows the store city ("Seattle, WA"), today's hours text, and the correct open/closed status indicator.

### Tests for User Stories 1 & 2 (MANDATORY — Testing Trophy)

> Follows Kent C. Dodds' Testing Trophy: integration > unit > e2e.
> Write these tests FIRST, ensure they FAIL, then implement.

- [x] T007 [P] [US1] [US2] Unit test for `computeOpenStatus()` pure function in `lib/square/__tests__/locations.test.ts` covering all status states (open, closing-soon, closed, closed-today) and midnight-spanning hours
- [x] T008 [P] [US1] [US2] Unit test for time-formatting helper (e.g., `"09:00"` → `"9 AM"`) in `lib/data/__tests__/locations.test.ts`
- [x] T009 [US1] [US2] Integration test for `LocationBar` component in `components/__tests__/location-bar.test.tsx` with RTL + MSW, verifying:
  - City/state text renders
  - Hours text renders
  - Status indicator shows correct text for each status value
  - Screen reader announces location and status text (FR-08)
  - Component renders nothing when `locationData` prop is `null` (FR-06)

### Implementation for User Stories 1 & 2

- [x] T010 [P] [US1] [US2] Create `computeOpenStatus()` pure function in `lib/square/locations.ts` — takes business hours periods + timezone, returns `"open" | "closing-soon" | "closed" | "closed-today"`
- [x] T011 [P] [US1] [US2] Create time-formatting helper in `lib/data/locations.ts` to convert `"HH:mm"` to human-readable format (e.g., `"9 AM"`, `"9:30 PM"`)
- [x] T012 [US1] [US2] Create `LocationBar` client component in `components/location-bar.tsx`:
  - Props: `locationData: LocationBarData | null`
  - Returns `null` if `locationData` is `null` (hide bar on API failure)
  - Renders city/state, hours text, and status indicator
  - Uses Tailwind for all styling (exact visual design from Figma)
  - Includes `aria-label` for screen reader accessibility (FR-08)
  - Uses `"use client"` directive
- [x] T013 [US1] [US2] Update `components/nav-bar-server.tsx` to fetch location data in parallel with existing fetches using `Promise.allSettled()`, then pass `locationData` prop to `NavBar`
- [x] T014 [US1] [US2] Update `components/nav-bar.tsx` to accept `locationData?: LocationBarData | null` prop and render `<LocationBar locationData={locationData} />` in the appropriate position per Figma design

**Checkpoint**: City name, today's hours, and open/closed status are visible in the navigation bar on all pages.

---

## Phase 4: User Story 3 — Consistent Display Across All Pages (Priority: P2)

**Goal**: Verify the location bar appears consistently on every public-facing page. This is primarily an architectural validation phase since the feature lives in the shared `NavBarServer` component already rendered in `app/layout.tsx`.

**Independent Test**: Navigate between homepage, product pages, category pages, cart page, and informational pages — the location bar is visible and consistent on each.

### Tests for User Story 3

- [x] T015 [P] [US3] Integration test in `components/__tests__/nav-bar.test.tsx` with RTL + MSW: verify that `<NavBar>` renders `<LocationBar>` with the correct props when `locationData` is provided
- [ ] T016 [US3] E2E test in `tests/e2e/nav-location-bar.spec.ts` (Playwright): navigate across 3+ distinct page types and assert the location bar content is present on each

### Implementation for User Story 3

- [x] T017 [US3] Verify `app/layout.tsx` renders `<NavBarServer />` on all routes — confirm no route-specific layouts exclude the nav bar

**Checkpoint**: Location bar is verified present and consistent across all public-facing pages.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Edge case hardening, final validation, and cleanup.

- [x] T018 Verify midnight-spanning hours edge case: add test case for `computeOpenStatus()` when `endLocalTime < startLocalTime` (e.g., `"20:00"` – `"02:00"`)
- [x] T019 Verify "Closed today" edge case: add test case for `computeOpenStatus()` returning `"closed-today"` when no hours period matches today
- [x] T020 Verify graceful degradation: add integration test in `components/__tests__/nav-bar.test.tsx` confirming nav links render normally when `locationData` is `null` (API failure scenario)
- [x] T021 [P] Run `tsc --noEmit` and `npm run lint` — fix any type or lint errors
- [x] T022 Run `quickstart.md` validation scenarios to confirm end-to-end functionality

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1+US2 (Phase 3)**: Depends on Phase 2 completion — MVP deliverable
- **US3 (Phase 4)**: Depends on Phase 3 (needs working LocationBar to validate)
- **Polish (Phase 5)**: Depends on Phase 4 completion

### User Story Dependencies

- **US1+US2 (P1)**: Can start after Foundational (Phase 2) — self-contained MVP
- **US3 (P2)**: Can start after US1+US2 — validation of cross-page consistency

### Within Phase 3 (US1+US2)

- Tests (T007-T009) MUST be written FIRST and FAIL before implementation
- `computeOpenStatus()` (T010) and time formatter (T011) can run in parallel
- `LocationBar` component (T012) depends on T010, T011
- `NavBarServer` update (T013) depends on T012 and `getLocationBarData()` (T004)
- `NavBar` update (T014) depends on T012

### Parallel Opportunities

- T001 can run immediately (setup)
- T002, T005, T006 can run in parallel (all distinct files)
- T007, T008 can run in parallel (different test files)
- T010, T011 can run in parallel (different files, no interdependency)
- T015, T016 can run in parallel (distinct test files)
- T021, T022 can run in parallel (static checks vs manual validation)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch all parallel foundational tasks together:
Task: "Add TypeScript types and Zod schemas in lib/square/types.ts" (T002)
Task: "Unit test fetchLocation() in lib/square/__tests__/locations.test.ts" (T005)
Task: "Unit test getLocationBarData() in lib/data/__tests__/locations.test.ts" (T006)
```

## Parallel Example: Phase 3 (US1+US2 Tests)

```bash
# Launch US1+US2 test tasks together (write tests FIRST):
Task: "Unit test computeOpenStatus() in lib/square/__tests__/locations.test.ts" (T007)
Task: "Unit test time formatter in lib/data/__tests__/locations.test.ts" (T008)
# These can then be followed by:
Task: "Integration test LocationBar component in components/__tests__/location-bar.test.tsx" (T009)
```

---

## Implementation Strategy

### MVP First (US1+US2)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T006)
3. Complete Phase 3: US1+US2 tests (T007–T009) → FAIL
4. Complete Phase 3: US1+US2 implementation (T010–T014) → tests pass
5. **STOP and VALIDATE**: City + hours + status visible in nav bar
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Types and data layer ready
2. US1+US2 → City + hours with status indicator (MVP!)
3. US3 → Cross-page consistency validated
4. Polish → Edge cases and quality gates cleared
5. Each phase adds value without breaking existing functionality

### Parallel Team Strategy

With multiple developers:

1. Dev A: T001, T003, T004 (setup + data layer)
2. Dev B: T002, T005, T006 (types + tests) — in parallel with Dev A
3. Once foundational is done:
   - Dev A: T010, T011, T012 (compute logic + component)
   - Dev B: T007, T008, T009 (tests) — in parallel
4. Dev A: T013, T014 (integration into nav bar)
5. Dev B: T015, T016 (US3 tests) — after Dev A completes

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Tests MUST be written FIRST and FAIL before implementation per Testing Trophy
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
