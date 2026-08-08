# Tasks: VIP Program Page

**Input**: Design documents from `specs/039-vip-program-page/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Following the Testing Trophy (Kent C. Dodds), every user story MUST include test tasks. Integration tests are the largest investment; E2E for critical paths only. Tests MUST be written FIRST and FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (Next.js App Router)**: `app/`, `components/`, `lib/` at repository root
- Tests co-located in `__tests__/` alongside the module; E2E in `tests/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Verify feature branch `039-vip-program-page` is current with `main` (git pull --rebase origin main)
- [ ] T002 Confirm `.feature` file exists at `specs/039-vip-program-page/features/vip-program-page.feature` (Gherkin gate)
- [ ] T003 [P] Add "VIP Program" to `STATIC_NAV_CATEGORIES` in `lib/data/categories.ts` (`{ label: "VIP Program", href: "/vip-program" }`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Add `VipSubscriptionPlan` interface and Zod schema to `lib/square/types.ts` (name, id, priceCents, billingCadence, description, benefits, purchaseActionLabel)
- [ ] T005 [P] Create `lib/square/subscriptions.ts` with `getVipSubscriptionPlans()` that calls `catalogApi.search({ objectTypes: ["SUBSCRIPTION_PLAN"] })` and maps/filters to known VIP tiers
- [ ] T006 [P] Create `components/vip-program/` directory scaffolding (empty index or barrel file)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Discover and reach the VIP Program page (Priority: P1) 🎯 MVP

**Goal**: A "VIP Program" link appears in the global navigation and navigates to the VIP Program page.

**Independent Test**: Load any page, confirm the "VIP Program" nav link is present, click it, and confirm it lands on `/vip-program`.

### Tests for User Story 1 (MANDATORY — Testing Trophy)

- [ ] T007 [P] [US1] Unit test for nav category merge (VIP Program included in static links) in `lib/data/__tests__/categories.test.ts` (Vitest)
- [ ] T008 [P] [US1] Integration test that the nav bar renders a "VIP Program" link in `components/__tests__/nav-bar.test.tsx` (RTL)

### Implementation for User Story 1

- [ ] T009 [P] [US1] Create `app/vip-program/page.tsx` as an async Server Component exporting `metadata` (title "VIP Program — Zeeks Comics and Games")
- [ ] T010 [US1] Render a minimal page shell (`<main>` + `<Footer />`) at `app/vip-program/page.tsx` so the route resolves without 404

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - View the two VIP subscription tiers (Priority: P1)

**Goal**: The VIP page lists the two purchasable tiers ("VIP Basic", "VIP Premium") from the Square catalog with name, price, and benefits.

**Independent Test**: Load `/vip-program` and confirm both tiers render with their name, price, and benefits from Square.

### Tests for User Story 2 (MANDATORY — Testing Trophy)

- [ ] T011 [P] [US2] Unit test for `getVipSubscriptionPlans()` mapping/filtering in `lib/square/__tests__/subscriptions.test.ts` (Vitest, MSW for catalog search)
- [ ] T012 [P] [US2] Integration test that `app/vip-program/page.tsx` renders both tier cards with name/price/benefits in `app/vip-program/__tests__/page.test.tsx` (RTL + MSW)
- [ ] T013 [P] [US2] Integration test for the graceful empty/error state when no plans match in `app/vip-program/__tests__/page.test.tsx` (RTL + MSW)

### Implementation for User Story 2

- [ ] T014 [P] [US2] Create `components/vip-program/tier-comparison.tsx` rendering the tier cards (name, price, benefits, purchase action)
- [ ] T015 [US2] Wire `getVipSubscriptionPlans()` into `app/vip-program/page.tsx` and render `<TierComparison>` with the fetched plans
- [ ] T016 [US2] Add error/empty state rendering in `components/vip-program/tier-comparison.tsx` when plans are unavailable (no mock data)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Purchase a VIP subscription (Priority: P1)

**Goal**: Each tier has a purchase action that routes through the existing custom web-checkout flow (card-on-file) to create the subscription in Square.

**Independent Test**: Activate a tier's purchase action and complete the existing checkout flow, confirming a subscription is created in Square.

### Tests for User Story 3 (MANDATORY — Testing Trophy)

- [ ] T017 [P] [US3] Integration test that a tier's purchase action links to the existing checkout flow in `components/vip-program/__tests__/tier-comparison.test.tsx` (RTL)
- [ ] T018 [P] [US3] Integration test for the purchase flow creating a subscription (reusing existing checkout Server Action) in `app/checkout/__tests__/` or `app/cart/__tests__/actions.test.ts` (RTL + MSW)

### Implementation for User Story 3

- [ ] T019 [P] [US3] Add the purchase action (link to the existing checkout flow) on each tier card in `components/vip-program/tier-comparison.tsx`
- [ ] T020 [US3] Handle the not-signed-in case for purchase (route through existing auth/checkout, prompting sign-in as needed) in `app/vip-program/page.tsx` / purchase action

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Read program information on the VIP page (Priority: P2)

**Goal**: The page presents the hero, tier comparison, VIP Weekends, and FAQ sections matching the Figma design.

**Independent Test**: Load `/vip-program` and confirm the hero, tier comparison, VIP Weekends, and FAQ sections render.

### Tests for User Story 4 (OPTIONAL - only if tests requested) ⚠️

- [ ] T021 [P] [US4] Integration test that the hero, VIP Weekends, and FAQ sections render in `app/vip-program/__tests__/page.test.tsx` (RTL)

### Implementation for User Story 4

- [ ] T022 [P] [US4] Create `components/vip-program/vip-hero.tsx` with the hero title/subtitle from the design
- [ ] T023 [P] [US4] Create `components/vip-program/vip-weekends.tsx` with the VIP Weekends benefits section
- [ ] T024 [P] [US4] Create `components/vip-program/vip-faq.tsx` as a `"use client"` accordion with the FAQ items
- [ ] T025 [US4] Compose all sections (hero, tier comparison, weekends, FAQ) into `app/vip-program/page.tsx`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T026 [P] Run `tsc --noEmit` and fix any type errors
- [ ] T027 [P] Run `npm run lint` and fix any lint errors
- [ ] T028 [P] Add E2E test for the VIP page critical journey (nav → view tiers) in `tests/e2e/vip-program.spec.ts` (Playwright)
- [ ] T029 Run `quickstart.md` validation scenarios end-to-end (nav, tier listing, purchase, error state)
- [ ] T030 Confirm no mock/hardcoded subscription data in production code paths

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 page shell (T009/T010)
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Depends on US2 tier cards (T014)
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Composes into the US1/US2 page

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models/types before services
- Services before components/page integration
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- Setup tasks marked [P] can run in parallel
- Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Tests for a user story marked [P] can run in parallel
- Section components (hero, weekends, FAQ) marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task: "Unit test for getVipSubscriptionPlans in lib/square/__tests__/subscriptions.test.ts"
Task: "Integration test for app/vip-program/page.tsx rendering tier cards in app/vip-program/__tests__/page.test.tsx"

# Launch all section components for User Story 4 together:
Task: "Create components/vip-program/vip-hero.tsx"
Task: "Create components/vip-program/vip-weekends.tsx"
Task: "Create components/vip-program/vip-faq.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP: nav link + reachable page)
3. Add User Story 2 → Test independently → Deploy/Demo (tiers listed)
4. Add User Story 3 → Test independently → Deploy/Demo (purchase works)
5. Add User Story 4 → Test independently → Deploy/Demo (full page)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
