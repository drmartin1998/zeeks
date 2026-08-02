# Tasks: Clerk Sign-In from Profile Icon

**Input**: Design documents from `/specs/014-clerk-sign-in/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Following the Testing Trophy (Kent C. Dodds), integration tests are the primary investment. Tests MUST be written FIRST and FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js App Router**: `app/`, `components/`, `lib/` at repository root
- **Tests**: `__tests__/` co-located alongside source modules

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure Clerk application

- [x] T001 Install `@clerk/nextjs@latest` via `npm install @clerk/nextjs@latest` and verify in `package.json`
- [x] T002 [P] Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to `.env.local` (value from Clerk Dashboard → API Keys; starts with `pk_test_` for dev or `pk_live_` for production)
- [ ] T003 [P] Enable Google OAuth in Clerk Dashboard (Clerk Dashboard → Social Connections → Google) and add Zeeks domain to allowed origins (Clerk Dashboard → Domains)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core Clerk infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Add `<ClerkProvider>` inside `<body>` in `app/layout.tsx` — import from `@clerk/nextjs`, wrap `{children}` inside provider (must be inside body per Clerk Core 3 / Next.js 16 requirement)
- [x] T005 Verify existing Clerk-to-Square webhook pipeline is unaffected: run `npm test -- lib/webhooks/__tests__/clerk.test.ts` and `npm test -- app/api/webhooks/clerk/__tests__/route.test.ts` — all must pass

**Checkpoint**: Foundation ready — ClerkProvider in place, existing webhook pipeline verified. User story implementation can now begin.

---

## Phase 3: User Story 1 - Trigger Sign-In from Profile Icon (Priority: P1) 🎯 MVP

**Goal**: Clicking the profile icon in the nav bar opens Clerk's sign-in/sign-up modal for unauthenticated visitors. Visitors can sign up via email/password or Google OAuth and return to their current page.

**Independent Test**: Load any page, click the profile icon, verify Clerk modal appears. Complete sign-up or sign-in flow, verify return to original page with authenticated state.

### Tests for User Story 1 (MANDATORY — Testing Trophy)

> Follows Kent C. Dodds' Testing Trophy: integration > unit > e2e.
> Write these tests FIRST, ensure they FAIL, then implement.

- [x] T006 [P] [US1] Add Clerk mock setup for nav-bar tests — create `components/__tests__/__mocks__/clerk.tsx` with mocked `@clerk/nextjs` components (`ClerkProvider`, `SignInButton`, `UserButton`, `Show`)
- [x] T007 [P] [US1] Integration test: unauthenticated state renders clickable profile trigger in `components/__tests__/nav-bar.test.tsx` — mock Clerk as signed-out, assert a clickable element with aria-label "User account" is rendered within the nav bar actions area
- [x] T008 [P] [US1] Integration test: profile icon click triggers Clerk modal in `components/__tests__/nav-bar.test.tsx` — mock `SignInButton mode="modal"`, assert the button is rendered and has the modal mode attribute or role

### Implementation for User Story 1

- [x] T009 [US1] Replace static `<button>` with `<SignInButton mode="modal">` in `components/nav-bar.tsx` in the actions area (line 66-68) — import `SignInButton` from `@clerk/nextjs`, wrap the `<User>` icon from lucide-react as children of SignInButton, remove the explicit `<button>` element
- [x] T010 [US1] Add loading feedback per FR-003a — Clerk's `<SignInButton>` handles its own loading state; verify the modal opens within 2s (SC-005)

**Checkpoint**: User Story 1 complete — unauthenticated visitors can sign up/sign in via profile icon. Test independently: verify all US1 tests pass.

---

## Phase 4: User Story 2 - Authenticated User Indicator (Priority: P2)

**Goal**: Signed-in users see their avatar (UserButton) in the nav bar instead of the generic user icon. They can sign out via the UserButton dropdown, returning the icon to its unauthenticated state.

**Independent Test**: Sign in, verify nav bar shows UserButton with avatar. Click UserButton → sign out → verify generic icon returns.

### Tests for User Story 2 (MANDATORY — Testing Trophy)

> Write these tests FIRST, ensure they FAIL, then implement.

- [x] T011 [P] [US2] Integration test: signed-in state renders UserButton in `components/__tests__/nav-bar.test.tsx`
- [x] T012 [P] [US2] Integration test: sign-out flow returns to unauthenticated state

### Implementation for User Story 2

- [x] T013 [US2] Add Show conditional rendering and UserButton in components/nav-bar.tsx

**Checkpoint**: User Story 2 complete — authenticated users see avatar, can sign out. Test independently: verify all US2 tests pass.

---

## Phase 5: User Story 3 - Session Persistence Across Navigation (Priority: P3)

**Goal**: Authenticated sessions persist across page navigation and browser refreshes. No additional auth prompts appear while browsing.

**Independent Test**: Sign in, navigate to 3+ pages, verify UserButton stays visible on all pages. Hard refresh → still signed in.

### Tests for User Story 3 (MANDATORY — Testing Trophy)

- [x] T014 [P] [US3] Integration test: auth state persists on re-render

### Implementation for User Story 3

- [x] T015 [US3] Verify Clerk session persistence - no code changes expected

**Checkpoint**: User Story 3 complete — sessions persist across navigation. Test independently: verify US3 test passes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, validation, and final quality gates

- [x] T016
- [x] T017
- [x] T018
- [x] T019
- [x] T020
- [x] T021

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately (T001 blocks T002/T003 only for env readiness; T002/T003 can run in parallel)
- **Foundational (Phase 2)**: Depends on Setup (T001) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on US1 (T009) — UserButton piggybacks on sign-in flow
- **User Story 3 (Phase 5)**: Depends on US2 (T013) — persistence validation needs UserButton to be rendered
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2). No dependencies on other stories.
- **User Story 2 (P2)**: Depends on US1's SignInButton (T009) being in place; adds conditional UserButton rendering.
- **User Story 3 (P3)**: Depends on US2's UserButton (T013) being in place; validates persistence with no new code.

### Within Each User Story

- Tests (T006-T008, T011-T012, T014) MUST be written and FAIL before implementation
- Tests can run in parallel within each story ([P] markers)
- Implementation tasks run after corresponding test tasks
- Story complete before moving to next priority

### Parallel Opportunities

- T002, T003: Run in parallel (env var config + Clerk Dashboard config)
- T006, T007, T008: All US1 tests can be written in parallel
- T011, T012: Both US2 tests can be written in parallel
- T016, T017: Polish tasks can run in parallel
- T019, T020: Static checks and test suite can run in parallel after all code changes

---

## Parallel Example: User Story 1

```bash
# Launch all integration tests for User Story 1 together:
Task: "T006 [P] [US1] Create Clerk mock setup in components/__tests__/__mocks__/clerk.tsx"
Task: "T007 [P] [US1] Integration test for unauthenticated profile icon in components/__tests__/nav-bar.test.tsx"
Task: "T008 [P] [US1] Integration test for Clerk modal trigger in components/__tests__/nav-bar.test.tsx"
```

## Parallel Example: User Story 2

```bash
# Launch all integration tests for User Story 2 together:
Task: "T011 [P] [US2] Integration test for UserButton (signed-in) in components/__tests__/nav-bar.test.tsx"
Task: "T012 [P] [US2] Integration test for sign-out flow in components/__tests__/nav-bar.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T005) — CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (T006-T010)
4. **STOP and VALIDATE**: Test US1 independently — click profile icon, sign up, verify return
5. Deploy/demo if ready — users can now create accounts and sign in!

### Incremental Delivery

1. Setup + Foundational → Foundation ready (ClerkProvider in layout)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! 🎯)
3. Add User Story 2 → Test independently → Deploy/Demo (users see avatar, can sign out)
4. Add User Story 3 → Test independently → Deploy/Demo (seamless sessions)
5. Polish → Final validation → Merge to main

### Parallel Team Strategy

With 2 developers:

1. Both complete Setup + Foundational together (T001-T005)
2. Once Foundational is done:
   - Developer A: US1 tests (T006-T008) then US1 implementation (T009-T010)
   - Developer B: Prepares Clerk mock setup (T006) then waits for US1 to merge before US2
3. After US1 merge: Developer B picks up US2 (T011-T013)
4. Both on Polish (T016-T021)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- The existing 105 tests (13 files) must continue to pass — run `npm test` after each implementation phase
- `@clerk/nextjs` v7+ uses `<Show>` instead of `<SignedIn>`/`<SignedOut>` (Core 3 breaking change)
- ClerkProvider must be inside `<body>` tag in `app/layout.tsx` for Next.js 16
