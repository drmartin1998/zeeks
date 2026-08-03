# Tasks: Automatic Loyalty Program Enrollment

**Input**: Design documents from `/specs/016-loyalty-enrollment/`

**Prerequisites**: plan.md (required), spec.md (required)

**Tests**: Following the Testing Trophy (Kent C. Dodds). Integration tests for the webhook route handler; unit tests for loyalty helpers. Tests written FIRST and verified to FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add environment variable and export required Square API client

- [ ] T001 [P] Add `SQUARE_LOYALTY_PROGRAM_ID` to Zod schema in `lib/env.ts` — make it optional (`z.string().optional()`) with a comment noting the feature degrades gracefully when absent
- [ ] T002 [P] Export `loyaltyApi` from `lib/square/client.ts` — already exists (verified), no action needed beyond verification

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create loyalty helper functions that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Create `lib/square/loyalty.ts` with two functions:
  - `searchLoyaltyAccount(customerId: string)` — calls `loyaltyApi.accounts.search({ query: { customerIds: [customerId] }, limit: 1 })`, returns the first loyalty account or `null`
  - `createLoyaltyAccount(customerId: string, phoneNumber: string)` — calls `loyaltyApi.accounts.create({ loyaltyAccount: { programId: SQUARE_LOYALTY_PROGRAM_ID!, customerId, mapping: { phoneNumber } }, idempotencyKey: `loyalty-${customerId}` })`, returns the created account
- [ ] T004 [P] Extract phone number from Clerk webhook payload — add `extractPrimaryPhone(payload)` to `lib/webhooks/clerk.ts` or inline in the route — matches `primary_phone_number_id`, falls back to first phone, returns `string | null`
- [ ] T005 [P] Unit test for loyalty helpers in `lib/square/__tests__/loyalty.test.ts` — test `searchLoyaltyAccount` returns account when found, returns null when empty; test `createLoyaltyAccount` calls Square with correct params
- [ ] T006 [P] Unit test for phone extraction in `lib/webhooks/__tests__/clerk.test.ts` — test primary phone match, fallback to first phone, empty array returns null

---

## Phase 3: User Story 1 — Automatic Enrollment on Sign-Up (Priority: P1) 🎯 MVP

**Goal**: When a `user.created` webhook processes a new user with a phone number, search for an existing loyalty account and create one if not found. Skip if no phone number or no program configured.

**Independent Test**: Fire a `user.created` webhook for a user with a phone number; verify `loyaltyApi.accounts.create` is called and the webhook returns 200.

### Tests for User Story 1 (MANDATORY — Testing Trophy)

> Write these tests FIRST, ensure they FAIL, then implement.

- [ ] T007 [P] [US1] Integration test for new user with phone → loyalty created in `app/api/webhooks/clerk/__tests__/route.test.ts` — mock full flow, assert `loyaltyApi.accounts.create` called with `programId`, `customerId`, phone `mapping`, assert 200
- [ ] T008 [P] [US1] Integration test for new user without phone → enrollment skipped in `app/api/webhooks/clerk/__tests__/route.test.ts` — mock user with empty `phone_numbers`, assert loyalty create NOT called, assert warning logged, assert 200
- [ ] T009 [P] [US1] Integration test for no loyalty program configured → skipped in `app/api/webhooks/clerk/__tests__/route.test.ts` — unset `SQUARE_LOYALTY_PROGRAM_ID`, assert loyalty API not called, assert warning logged, assert 200

### Implementation for User Story 1

- [ ] T010 [US1] Add `SQUARE_LOYALTY_PROGRAM_ID` env var check in webhook handler — if not set, log warning, skip loyalty enrollment
- [ ] T011 [US1] Extract phone number from Clerk webhook payload in `handleUserCreated` — use `extractPrimaryPhone()`; if null, log warning, skip loyalty
- [ ] T012 [US1] Add loyalty enrollment logic after Square customer sync in `handleUserCreated` (after line 134 of `route.ts`) — call `searchLoyaltyAccount()` → if null, call `createLoyaltyAccount()` with retry; wrap in try/catch so errors don't block 200 response

**Checkpoint**: All US1 tests pass — new users with phone are enrolled, without phone are skipped, without program are skipped

---

## Phase 4: User Story 2 — Idempotency (Priority: P2)

**Goal**: Retried webhooks must not create duplicate loyalty accounts.

**Independent Test**: Fire duplicate `user.created` webhook; verify `searchLoyaltyAccount` finds existing account, `createLoyaltyAccount` is NOT called, webhook returns 200.

### Tests for User Story 2 (MANDATORY — Testing Trophy)

- [ ] T013 [P] [US2] Integration test for existing loyalty account → skip creation in `app/api/webhooks/clerk/__tests__/route.test.ts` — mock `loyaltyApi.accounts.search` returning a loyalty account, assert `loyaltyApi.accounts.create` NOT called, assert 200

### Implementation for User Story 2

- [ ] T014 [US2] No additional implementation needed — the search-first pattern from T003 already provides idempotency. Verify the existing `squareCustomerId` idempotency check (lines 90-103 of `route.ts`) also covers loyalty by skipping the entire handler on retry

**Checkpoint**: All US1 + US2 tests pass — duplicate webhooks are harmless

---

## Phase 5: User Story 3 — Graceful Degradation on Loyalty API Failure (Priority: P3)

**Goal**: Loyalty API errors must not cause the webhook to return non-200. Core customer sync completes regardless.

**Independent Test**: Mock loyalty API to throw; verify Square customer still created, Clerk metadata still updated, webhook returns 200.

### Tests for User Story 3 (MANDATORY — Testing Trophy)

- [ ] T015 [P] [US3] Integration test for loyalty search failure → customer sync succeeds in `app/api/webhooks/clerk/__tests__/route.test.ts` — mock `loyaltyApi.accounts.search` to reject, assert customer created and metadata saved, assert 200, assert error logged
- [ ] T016 [P] [US3] Integration test for loyalty create failure → customer sync succeeds in `app/api/webhooks/clerk/__tests__/route.test.ts` — mock search returns null, create rejects, assert customer created and metadata saved, assert 200, assert error logged

### Implementation for User Story 3

- [ ] T017 [US3] Wrap loyalty enrollment block in try/catch in `handleUserCreated` — catch all loyalty errors, log with user context (`userId`, `squareCustomerId`), always proceed to return 200

**Checkpoint**: All US1 + US2 + US3 tests pass — loyalty failures never block customer sync

---

## Phase 6: Polish & Quality Gates

**Purpose**: Final validation, linting, and cross-cutting concerns

- [ ] T018 Run `npm test` — all vitest suites pass with zero failures
- [ ] T019 Run `tsc --noEmit` — zero TypeScript errors
- [ ] T020 Run `npm run lint` — zero ESLint errors
- [ ] T021 Validate all 9 Gherkin scenarios from `features/loyalty-enrollment.feature` are covered by integration tests

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — 🎯 MVP
- **User Story 2 (Phase 4)**: Depends on US1 completion (reuses search-first pattern)
- **User Story 3 (Phase 5)**: Depends on US1 completion (adds error handling)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No other story dependencies — starts after Foundational
- **User Story 2 (P2)**: Depends on US1 (builds on search pattern)
- **User Story 3 (P3)**: Depends on US1 (adds try/catch around loyalty block)

### Parallel Opportunities

- T001–T002 (Setup): Both [P], run in parallel
- T003, T004 (Foundational): Different files, run in parallel
- T005, T006 (Foundational tests): Both [P], run in parallel after T003/T004
- T007–T009 (US1 tests): All [P]
- T015–T016 (US3 tests): Both [P]

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (env var)
2. Complete Phase 2: Foundational (loyalty helpers + phone extraction)
3. Complete Phase 3: User Story 1 (enrollment logic + tests)
4. **STOP and VALIDATE**: Fire test webhook, verify loyalty account created
5. Deploy/demo if ready — new users get enrolled in loyalty

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Deploy/Demo (MVP! 🎯)
3. Add US2 → Test independently → Deploy/Demo (idempotent)
4. Add US3 → Test independently → Deploy/Demo (errors non-blocking)
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The existing `handleUserCreated` function in `route.ts` is the insertion point — loyalty enrollment is added after the Square customer ID is saved to Clerk metadata (after line 134)
