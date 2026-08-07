# Tasks: Password Gate Redesign

**Input**: Design documents from `/specs/033-password-gate-redesign/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Following the Testing Trophy (Kent C. Dodds), the user stories include test tasks. The password API cookie-expiration test is a unit test; the password gate page is a component integration test.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing infrastructure and establish quality baseline

- [x] T001 Verify the feature branch and expected files exist (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/api.md`, `features/password-gate-redesign.feature`)
- [x] T002 Run `tsc --noEmit` — record baseline errors (note pre-existing test-file errors only, none in `app/password/` or `app/api/password/`)
- [x] T003 [P] Run `npm run lint` — record baseline (pre-existing errors in `app/error.tsx`/`app/global-error.tsx` are unrelated)
- [x] T004 [P] Run `npm test` — record baseline failing suites (pre-existing: cart actions, locations, cart-summary, zod) — confirm no regressions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No shared blocking infrastructure is required for this feature (the page + API are self-contained). This phase verifies the existing password form logic that US2 will reuse.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Verify the existing password form logic in `app/password/page.tsx` (fetch to `/api/password`, `returnTo` redirect, error handling) is intact and reusable for the redesign (FR-002/003/004)

**Checkpoint**: Foundation ready — existing password logic verified; user story implementation can begin

---

## Phase 3: User Story 1 - See the new password gate page design (Priority: P1) 🎯 MVP

**Goal**: The password page renders the new Figma dark layout (logo header, headline, subhead, form, footer).

**Independent Test**: Visit `/password` and confirm the dark-themed layout with logo, headline, form, and footer.

### Tests for User Story 1 (MANDATORY — Testing Trophy)

- [x] T006 [P] [US1] Integration test for the new password gate layout in `app/password/__tests__/page.test.tsx` (RTL) — render the page, verify the logo, "SOMETHING EPIC IS COMING" headline, "UNLOCK EARLY ACCESS" button, and footer launch/social content are present

### Implementation for User Story 1

- [x] T007 [US1] Rewrite `app/password/page.tsx` to render the new Figma layout: dark purple background (`bg-[#120E29]`) with a central purple glow + ember accents, a centered Zeeks logo header, the "SOMETHING EPIC IS COMING" headline, the subhead copy, the password form, and a footer with "COMING Q3 2026" + social icon row
- [x] T008 [P] [US1] Style the password input and "UNLOCK EARLY ACCESS" button to match the Figma (dark input `#15131B` with `#272738` border, orange `#E8950E` rounded-full button, hint text) in `app/password/page.tsx`

**Checkpoint**: User Story 1 complete — the new password gate layout renders.

---

## Phase 4: User Story 2 - Keep the password validation behavior (Priority: P1)

**Goal**: The redesigned page still validates the password and redirects via `returnTo`, with error handling.

**Independent Test**: Submit an incorrect password (error shown) then the correct password (redirect to `returnTo`).

### Tests for User Story 2 (MANDATORY — Testing Trophy)

- [x] T009 [P] [US2] Integration test for incorrect password in `app/password/__tests__/page.test.tsx` (RTL + fetch mock) — mock a 401 response, submit, verify an error message is shown and access is not granted
- [x] T010 [P] [US2] Integration test for correct password + redirect in `app/password/__tests__/page.test.tsx` (RTL + fetch mock) — mock a 200 response, submit, verify redirect to the `returnTo` destination

### Implementation for User Story 2

- [x] T011 [US2] Preserve the existing `PasswordForm` submit logic (fetch to `/api/password`, `returnTo` = `searchParams.get("returnTo") ?? "/"`, error state) in the redesigned `app/password/page.tsx` (FR-002/003/004)

**Checkpoint**: User Stories 1 AND 2 complete — the new layout preserves password validation.

---

## Phase 5: User Story 3 - Reset the password cookie expiration to 24 hours (Priority: P1)

**Goal**: The `site_password` cookie expires after 24 hours instead of 7 days.

**Independent Test**: After a successful login, inspect the cookie's expiration — it should be ~24 hours.

### Tests for User Story 3 (MANDATORY — Testing Trophy)

- [x] T012 [P] [US3] Unit test for the cookie expiration in `app/api/password/__tests__/route.test.ts` — mock a correct password, call POST, and verify the `site_password` cookie's `Max-Age` is 86400 (24 hours)

### Implementation for User Story 3

- [x] T013 [US3] Change the `site_password` cookie `maxAge` from `60 * 60 * 24 * 7` (7 days) to `60 * 60 * 24` (24 hours) in `app/api/password/route.ts` (FR-005)

**Checkpoint**: All three user stories complete — new layout, preserved validation, 24-hour cookie.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Responsive verification, quality gates, documentation

- [x] T014 [P] Verify the password gate page is responsive (centered, usable at mobile widths) in `app/password/page.tsx` (FR-007)
- [x] T015 Update `specs/033-password-gate-redesign/features/password-gate-redesign.feature` if implementation reveals acceptance-criteria gaps (keep in sync)
- [x] T016 Run `quickstart.md` validation scenarios (VS-1 through VS-6) — all pass
- [x] T017 Run full quality gate: `tsc --noEmit && npm run lint && npm test`
- [x] T018 Update `specs/033-password-gate-redesign/checklists/requirements.md` — mark completed items [x]

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — Independent of US2/US3
- **Phase 4 (US2)**: Depends on Phase 2 and US1 (reuses the redesigned page) but is independently testable
- **Phase 5 (US3)**: Depends on Phase 2 — Independent of US1/US2 (only the API route)
- **Phase 6 (Polish)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **User Story 2 (P1)**: Depends on US1 — needs the redesigned page but is independently testable
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) — independent (only the API route)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Implementation before verification
- Story complete before moving to next priority

### Parallel Opportunities

- Phase 1 tasks T002-T004 marked [P] can run in parallel
- US1 tests T006 and US3 tests T012 marked [P] can run in parallel (different files)
- US2 tests T009, T010 marked [P] can run in parallel
- US3 (Phase 5) can run in parallel with US1/US2 (different files: `app/api/password` vs `app/password`)
- Phase 6 polish task T014 marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch both US1 tasks together:
Task: "Rewrite app/password/page.tsx with the new Figma layout"
Task: "Integration test for the new password gate layout in app/password/__tests__/page.test.tsx"

# US3 (cookie) can run in parallel — different file:
Task: "Change the cookie maxAge to 24 hours in app/api/password/route.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (verify existing password logic)
3. Complete Phase 3: User Story 1 (new Figma layout)
4. **STOP and VALIDATE**: Confirm the new layout renders
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → verify existing logic
2. Add User Story 1 → new layout → Deploy (MVP!)
3. Add User Story 2 → preserved validation → Deploy
4. Add User Story 3 → 24-hour cookie → Deploy
5. Polish → responsive + quality → Complete

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 + US2 (both touch `app/password/page.tsx`)
   - Developer B: User Story 3 (only `app/api/password/route.ts`)
3. Stories integrate once complete

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- US1 and US2 both modify `app/password/page.tsx` — run them sequentially (T007/T008 → T011) to avoid conflict
- US3 (cookie) is independent and can run in parallel with the page work