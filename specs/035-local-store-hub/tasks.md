# Tasks: Homepage Local Store Hub

**Input**: Design documents from `/specs/035-local-store-hub/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Following the Testing Trophy (Kent C. Dodds), the user stories include test tasks. The `LocalStoreHub` section is primarily assessed via an integration test (RTL) since it is a presentational server component; no E2E is required (not a critical commerce path).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing infrastructure and establish quality baseline

- [x] T001 Verify the feature branch `035-local-store-hub` and expected files exist (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/events.md`, `features/local-store-hub.feature`, `checklists/requirements.md`)
- [x] T002 Run `tsc --noEmit` — record baseline errors (note pre-existing test-file errors only)
- [x] T003 [P] Run `npm run lint` — record baseline (note pre-existing errors, if any)
- [x] T004 [P] Run `npm test` — record baseline failing suites (confirm no regressions)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the shared static events data and the presentational card component that US1 and US2 depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create the typed static events data module `components/local-store-hub/events-data.ts` exporting an `Event` interface and a `events` array with the four designed example events (category, dateTime, title, description) per `data-model.md`
- [x] T006 Create the display-only `EventCard` component `components/local-store-hub/event-card.tsx` accepting `EventCardProps` (`id`, `category`, `dateTime`, `title`, `description`) and rendering the design (category badge, orange date/time, bold title, muted description) per `contracts/events.md` and `data-model.md`

**Checkpoint**: Foundation ready — static events data and `EventCard` exist and are independently testable.

---

## Phase 3: User Story 1 - See the Local Store Hub section on the homepage (Priority: P1) 🎯 MVP

**Goal**: Render the Local Store Hub section on the homepage in its designed position with the header, subtitle, event cards, and "VIEW ALL EVENTS" link.

**Independent Test**: Visit the homepage and confirm the Local Store Hub section renders between New Arrivals and the Rewards promo banner with its heading, subtitle, event cards, and "VIEW ALL EVENTS" link.

### Tests for User Story 1 (MANDATORY — Testing Trophy)

> Write these tests FIRST, ensure they FAIL, then implement.

- [x] T007 [P] [US1] Integration test for `LocalStoreHub` renders the section header (heading "Local Store Hub", subtitle, "VIEW ALL EVENTS" link) in `components/local-store-hub/__tests__/local-store-hub.test.tsx` (RTL)

### Implementation for User Story 1

- [x] T008 [US1] Create the section container `components/local-store-hub/local-store-hub.tsx` rendering the header (heading, subtitle, "VIEW ALL EVENTS" link with `Link` + `ArrowRight` to `/events`) and mapping the four events from `events-data.ts` to `EventCard`s
- [x] T009 [US1] Wire `<LocalStoreHub />` into `app/page.tsx` between `<FeaturedGames />` and `<PromoBanner />`

**Checkpoint**: At this point, User Story 1 is functional — the section renders on the homepage with header and event cards.

---

## Phase 4: User Story 2 - Event cards render the designed content (Priority: P1)

**Goal**: Ensure the four event cards match the design (badge, orange date/time, bold title, muted description) and stack responsively.

**Independent Test**: View the homepage at desktop and mobile widths and confirm the event cards match the design and respond sensibly across breakpoints.

### Tests for User Story 2 (MANDATORY — Testing Trophy)

> Write these tests FIRST, ensure they FAIL, then implement.

- [x] T010 [P] [US2] Integration test asserting each rendered event card shows its category badge (uppercase accent), date/time, bold title, and description in `components/local-store-hub/__tests__/local-store-hub.test.tsx` (RTL)

### Implementation for User Story 2

- [x] T011 [US2] Ensure `LocalStoreHub` renders exactly four cards (design parity) using responsive layout (row on large screens, vertical stack on small screens) per `data-model.md` and `FR-006`
- [x] T012 [US2] Add responsive styling to `local-store-hub.tsx` / `event-card.tsx` (grid → stacked) and verify no horizontal overflow at mobile widths

**Checkpoint**: At this point, User Stories 1 AND 2 both work — the section renders with four design-faithful, responsive cards.

---

## Phase 5: User Story 3 - Section links navigate to the events destination (Priority: P2)

**Goal**: The "VIEW ALL EVENTS" link navigates to a placeholder events route that does not 404.

**Independent Test**: Click "VIEW ALL EVENTS" and confirm it navigates to `/events` without a 404/error.

### Tests for User Story 3 (MANDATORY — Testing Trophy)

> Write these tests FIRST, ensure they FAIL, then implement.

- [x] T013 [P] [US3] Integration test asserting the "VIEW ALL EVENTS" link has `href` `/events` in `components/local-store-hub/__tests__/local-store-hub.test.tsx` (RTL)

### Implementation for User Story 3

- [x] T014 [US3] Create the placeholder events page `app/events/page.tsx` returning a minimal styled page (heading + "event calendar coming soon" note) so the link does not 404

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final verification

- [x] T015 [P] Add empty-list edge handling: if `events` is empty, `LocalStoreHub` renders header + link with a neutral/empty card area and no malformed cards (FR-007)
- [x] T016 [P] Add integration test for the empty-list edge case in `components/local-store-hub/__tests__/local-store-hub.test.tsx` (RTL)
- [x] T017 Re-run `tsc --noEmit` — zero errors
- [x] T018 Re-run `npm run lint` — zero errors
- [x] T019 Re-run `npm test` — all new tests pass; no regressions
- [x] T020 Run `quickstart.md` validation scenarios (VS-1 through VS-5) and update `checklists/requirements.md` notes; mark all tasks complete in this file

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 and US2 both depend on the `EventCard` (T006) foundation; US3 depends on the section rendering (US1)
  - User stories can proceed in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - builds on US1's rendered cards
- **User Story 3 (P2)**: Can start after US1 (the link lives in the section header) - No dependencies on US2

### Within Each User Story

- Tests (where included) MUST be written and FAIL before implementation
- Foundation (events-data, EventCard) before section composition
- Section composition before page wiring

### Parallel Opportunities

- All Setup tasks (T002, T003, T004) marked [P] can run in parallel
- Foundational tasks T005 (events-data) and T006 (EventCard) can run in parallel
- Tests within a story marked [P] can be written in parallel
- US1 and US2 implementations can proceed in parallel after the foundation completes

---

## Parallel Example: Foundation + User Story 1

```bash
# Launch foundation data + card together:
Task: "Create typed events data in components/local-store-hub/events-data.ts"
Task: "Create EventCard in components/local-store-hub/event-card.tsx"

# Launch the US1 test + implementation together:
Task: "Integration test for LocalStoreHub header in __tests__/local-store-hub.test.tsx"
Task: "Create section container in components/local-store-hub/local-store-hub.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently (section renders with header + cards)
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence