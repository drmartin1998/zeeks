# Tasks: Clerk Auth Migration (createRouteMatcher)

**Input**: Design documents from `/specs/032-clerk-auth-migration/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: This is a migration/refactor of existing auth behavior. Verification-focused tasks (static checks + manual validation) are used; automated unit tests are added where a testable pure function is introduced.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing infrastructure and establish quality baseline

- [x] T001 Verify the feature branch and expected files exist (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/api.md`, `features/clerk-auth-migration.feature`)
- [x] T002 Run `tsc --noEmit` — record baseline errors (note pre-existing test-file errors only, none in `middleware.ts` or `eslint.config.mjs`)
- [x] T003 [P] Run `npm run lint` — record baseline (pre-existing errors in `app/error.tsx`/`app/global-error.tsx` are unrelated)
- [x] T004 [P] Run `npm test` — record baseline failing suites (pre-existing: cart actions, locations, cart-summary, zod) — confirm no regressions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Install the Clerk ESLint plugin that the migration uses for ongoing protection

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Add `@clerk/eslint-plugin` as a pinned devDependency in `package.json` (install via `npm install --save-dev @clerk/eslint-plugin`)
- [x] T006 [P] Register the plugin and the `@clerk/next/require-auth-protection` rule in `eslint.config.mjs` with `protected: ['**']` and `public: ['app/sign-in/**', 'app/sign-up/**']` (per `contracts/api.md` Contract 2)

**Checkpoint**: Foundation ready — the Clerk ESLint plugin is installed and configured; user story implementation can begin

---

## Phase 3: User Story 1 - Remove the deprecated createRouteMatcher usage (Priority: P1) 🎯 MVP

**Goal**: The middleware no longer imports or uses `createRouteMatcher`, eliminating the deprecation warning.

**Independent Test**: Search the codebase for `createRouteMatcher` (returns no matches) and start the dev server (no deprecation warning).

### Implementation for User Story 1

- [x] T007 [P] [US1] Remove the `createRouteMatcher` import from `middleware.ts` (keep the `clerkMiddleware` import)
- [x] T008 [P] [US1] Add a small pure helper (e.g., `isExemptPath(pathname: string): boolean`) in `middleware.ts` that checks the exempt route prefixes (`/password`, `/api/password`, `/api/webhooks`, `/__clerk`, `/.well-known`) using native string/path matching, replacing the `createRouteMatcher` usage

### Tests for User Story 1

- [x] T009 [P] [US1] Unit test for `isExemptPath` in `middleware.test.ts` (co-located) — verify each exempt prefix returns true and a non-exempt path returns false (TDD: write first, expect fail)

**Checkpoint**: User Story 1 complete — no `createRouteMatcher` usage remains.

---

## Phase 4: User Story 2 - Preserve the site password gate (Priority: P1)

**Goal**: The password gate behaves identically using the new native path matching.

**Independent Test**: Request a protected page without a cookie (redirected to `/password?returnTo=`), request an exempt route without a cookie (served), and request a protected page with the correct cookie (served).

### Implementation for User Story 2

- [x] T010 [US2] Update the `clerkMiddleware` handler in `middleware.ts` to use `isExemptPath(req.nextUrl.pathname)` instead of `exemptFromPassword(req)`, preserving the `SITE_PASSWORD` check, cookie comparison, and redirect to `/password?returnTo=<path>`
- [x] T011 [P] [US2] Confirm the `config.matcher` export in `middleware.ts` is unchanged so Clerk middleware still runs on the same routes (FR-005)

### Tests for User Story 2

- [x] T012 [P] [US2] Integration/unit test for the password gate in `middleware.test.ts` — mock `req` (pathname, cookies) and verify redirect on missing cookie, no redirect on exempt path, and no gate when `SITE_PASSWORD` is unset (FR-002, FR-003, FR-008)

**Checkpoint**: User Stories 1 AND 2 complete — password gate behavior preserved with native matching.

---

## Phase 5: User Story 3 - Keep Clerk middleware and resource-based auth checks intact (Priority: P1)

**Goal**: `clerkMiddleware()` remains and protected resources still enforce their own `auth()` checks.

**Independent Test**: Confirm `clerkMiddleware()` is still present and protected resources (account, cart, checkout, account API) still reject unauthenticated access.

### Verification for User Story 3

- [x] T013 [US3] Verify `clerkMiddleware()` is still present and invoked in `middleware.ts` (FR-005)
- [x] T014 [P] [US3] Verify protected resources still call `auth()` and handle unauthenticated access — check `app/account/page.tsx`, `app/account/edit/page.tsx`, `app/cart/page.tsx`, `app/checkout/page.tsx`, `app/cart/actions.ts`, `app/account/actions.ts`, `app/api/account/profile/route.ts` (FR-006)

**Checkpoint**: All three user stories complete — middleware kept, resource auth checks intact.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Lint rule verification, quality gates, documentation

- [x] T015 Run `npm run lint` — confirm no `createRouteMatcher` usage and the `require-auth-protection` rule passes (no unprotected resources flagged) (SC-005)
- [x] T016 Update `specs/032-clerk-auth-migration/features/clerk-auth-migration.feature` if implementation reveals acceptance-criteria gaps (keep in sync)
- [x] T017 Run `quickstart.md` validation scenarios (VS-1 through VS-7) — all pass
- [x] T018 Run full quality gate: `tsc --noEmit && npm run lint && npm test`
- [x] T019 Update `specs/032-clerk-auth-migration/checklists/requirements.md` — mark completed items [x]

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories (lint plugin needed for SC-005)
- **Phase 3 (US1)**: Depends on Phase 2 — Independent of US2/US3
- **Phase 4 (US2)**: Depends on US1 (reuses `isExemptPath`) — Independent of US3
- **Phase 5 (US3)**: Depends on Phase 2 — Independent of US1/US2 (verification only)
- **Phase 6 (Polish)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **User Story 2 (P1)**: Depends on US1 — needs the `isExemptPath` helper
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) — independent (verification only)

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Implementation before verification/integration
- Story complete before moving to next priority

### Parallel Opportunities

- Phase 1 tasks T002-T004 marked [P] can run in parallel
- Phase 2 tasks T006 marked [P] can run in parallel
- US1 implementation tasks T007, T008 marked [P] can run in parallel
- US3 verification tasks T013, T014 marked [P] can run in parallel
- Phase 6 polish tasks T017 marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch both US1 implementation tasks together:
Task: "Remove the createRouteMatcher import from middleware.ts"
Task: "Add the isExemptPath helper to middleware.ts"

# Launch the US1 unit test:
Task: "Unit test for isExemptPath in middleware.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (install Clerk ESLint plugin)
3. Complete Phase 3: User Story 1 (remove createRouteMatcher + isExemptPath helper)
4. **STOP and VALIDATE**: Confirm no createRouteMatcher usage remains
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → lint plugin ready
2. Add User Story 1 → remove createRouteMatcher → Deploy (MVP!)
3. Add User Story 2 → password gate on native matching → Deploy
4. Add User Story 3 → verify auth checks intact → Deploy
5. Polish → lint gate + quality → Complete

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 + US2 (both touch middleware.ts)
   - Developer B: User Story 3 (verification only)
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
- US1 and US2 both modify `middleware.ts` — run them sequentially (T007/T008 → T010) to avoid conflict
- The Clerk ESLint plugin (Phase 2) is required for SC-005 per `research.md`