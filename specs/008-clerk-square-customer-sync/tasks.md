# Tasks: Clerk-to-Square Customer Sync

**Input**: Design documents from `/specs/008-clerk-square-customer-sync/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Following the Testing Trophy (Kent C. Dodds). Integration tests for the Route Handler; unit tests for pure logic (retry, email extraction, customer helpers). Tests written FIRST and verified to FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, configure environment variables, and update shared type definitions

- [x] T001 Install `@clerk/backend` package via `npm install @clerk/backend`
- [x] T002 [P] Add `CLERK_SECRET_KEY` environment variable to `.env.local`
- [x] T003 [P] Add `CLERK_SECRET_KEY` validation to Zod schema in `lib/env.ts`
- [x] T004 [P] Export `customersApi` from `lib/square/client.ts` (add `export const customersApi = squareClient.customers;`)
- [x] T005 [P] Add `SquareCustomer` type and `ClerkWebhookEvent` interface to `lib/square/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared modules that ALL user stories depend on. Must complete before any story work.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create Clerk SDK client initialization in `lib/webhooks/clerk.ts` — export `clerkClient` using `createClerkClient({ secretKey: CLERK_SECRET_KEY })` and a helper to read user metadata
- [x] T007 [P] Create `withRetry()` utility in `lib/webhooks/retry.ts` — exponential backoff (1s→2s→4s), max 3 attempts, 3s timeout via `AbortSignal.timeout(3000)`
- [x] T008 [P] Unit test for `withRetry()` in `lib/webhooks/__tests__/retry.test.ts` — test success first try, success after 2 failures, exhaustion after 3 failures, timeout behavior
- [x] T009 Unit test for Clerk client helpers in `lib/webhooks/__tests__/clerk.test.ts` — test `getSquareCustomerId()` reads metadata, test `setSquareCustomerId()` calls `updateUserMetadata`



## Phase 3: User Story 1 — Automatic Square Customer Creation on Registration (Priority: P1) 🎯 MVP

**Goal**: When a `user.created` webhook arrives, extract the user's email and name, search for an existing Square customer, create one if not found, and save the Square customer ID to Clerk.

**Independent Test**: Register a new user through Clerk, verify `squareCustomerId` appears in Clerk user's private metadata, and a corresponding Square customer exists in Square Dashboard.

### Tests for User Story 1 (MANDATORY — Testing Trophy)

> Write these tests FIRST, ensure they FAIL, then implement.

- [x] T010 [P] [US1] Unit test for email extraction utility in `lib/square/__tests__/customers.test.ts` — test primary email via `primary_email_address_id` match, fallback to first email, empty array returns null
- [x] T011 [P] [US1] Integration test for `findCustomerByEmail()` in `lib/square/__tests__/customers.test.ts` — mock Square `customers.search` returning a customer, verify returned ID; mock empty array, verify null
- [x] T012 [P] [US1] Integration test for `createSquareCustomer()` in `lib/square/__tests__/customers.test.ts` — mock Square `customers.create` returning new customer, verify returned ID
- [x] T013 [P] [US1] Integration test for new user → new Square customer flow in `app/api/webhooks/clerk/__tests__/route.test.ts` — mock full happy path, assert 200 and `updateUserMetadata` called with `squareCustomerId`
- [x] T014 [P] [US1] Integration test for returning user → existing Square customer in `app/api/webhooks/clerk/__tests__/route.test.ts` — mock `customers.search` returning existing customer, assert no `create` call, metadata updated with existing ID
- [x] T015 [P] [US1] Integration test for unverified webhook → 400 in `app/api/webhooks/clerk/__tests__/route.test.ts` — mock `Webhook.verify()` to throw, assert 400, assert no Square or Clerk SDK calls

### Implementation for User Story 1

- [x] T016 [US1] Create `findCustomerByEmail(email: string)` in `lib/square/customers.ts` — calls `customersApi.search({ query: { filter: { emailAddress: { fuzzy: email } } } })`, returns first customer's `id` or `null`
- [x] T017 [US1] Create `createSquareCustomer(email, givenName?, familyName?)` in `lib/square/customers.ts` — calls `customersApi.create({ idempotencyKey: crypto.randomUUID(), emailAddress: email, givenName, familyName })`, returns customer `id`
- [x] T018 [US1] Create `extractPrimaryEmail(payload: ClerkWebhookEvent)` in `lib/square/customers.ts` — matches `primary_email_address_id`, falls back to first email, returns `string | null`
- [x] T019 [US1] Update `app/api/webhooks/clerk/route.ts` — add `user.created` handler: extract email, read Clerk metadata, check for existing `squareCustomerId`, search or create Square customer, update metadata, return 200
- [x] T020 [US1] Add event type guard to skip non-`user.created` events in `app/api/webhooks/clerk/route.ts` (return 200 without Square/Clerk operations)

**Checkpoint**: All US1 tests pass — new users get Square customer IDs saved to Clerk

**Checkpoint**: Foundation ready — user story implementation can now begin


## Phase 4: User Story 2 — Graceful Error Handling (Priority: P2)

**Goal**: Handle Square API failures, missing email data, and rate-limit/timeout scenarios with appropriate error responses and logging. No partial state left behind.

**Independent Test**: Send invalid Square credentials or missing-email payload, verify 400/500 responses and no partial Clerk metadata updates.

### Tests for User Story 2 (MANDATORY — Testing Trophy)

- [x] T021 [P] [US2] Integration test for Square API unreachable → 500 in `app/api/webhooks/clerk/__tests__/route.test.ts` — mock `customers.search` to reject with network error, assert 500, assert `updateUserMetadata` NOT called, assert error logged
- [x] T022 [P] [US2] Integration test for missing email → 400 in `app/api/webhooks/clerk/__tests__/route.test.ts` — mock `Webhook.verify()` returning user with empty `email_addresses`, assert 400, assert no Square or Clerk SDK calls
- [x] T023 [P] [US2] Integration test for rate-limited → retry → 500 in `app/api/webhooks/clerk/__tests__/route.test.ts` — mock `customers.search` to fail with 429 three times, assert error logged and 500 returned after 3 retries
- [x] T024 [P] [US2] Integration test for user without name → still creates in `app/api/webhooks/clerk/__tests__/route.test.ts` — mock `user.created` with email but null `first_name`/`last_name`, assert `customers.create` called with email only, assert 200
- [x] T025 [P] [US2] Integration test for `updateUserMetadata` failure → 500 in `app/api/webhooks/clerk/__tests__/route.test.ts` — mock Square calls succeed but Clerk update fails, assert 500 and orphaned customer logged

### Implementation for User Story 2

- [x] T026 [US2] Add email validation in `app/api/webhooks/clerk/route.ts` — if `extractPrimaryEmail()` returns null, return 400 with error message
- [x] T027 [US2] Wrap Square API calls with `withRetry()` in `app/api/webhooks/clerk/route.ts` — apply to `findCustomerByEmail()` and `createSquareCustomer()` calls
- [x] T028 [US2] Add `console.error` logging for all failure paths in `app/api/webhooks/clerk/route.ts` — log user ID, masked email, error message, event type
- [x] T029 [US2] Handle `updateUserMetadata()` failure edge case in `app/api/webhooks/clerk/route.ts` — if Square customer created but Clerk metadata update fails, log orphaned Square customer ID

**Checkpoint**: All US1 + US2 tests pass — errors handled gracefully with proper HTTP status codes

---

## Phase 5: User Story 3 — Idempotent Webhook Processing (Priority: P3)

**Goal**: Detect when a Clerk user already has a `squareCustomerId` and skip all Square API calls, returning 200 immediately.

**Independent Test**: Send same `user.created` webhook twice; verify first call creates customer, second returns 200 with no Square API calls.

### Tests for User Story 3 (MANDATORY — Testing Trophy)

- [x] T030 [P] [US3] Integration test for duplicate webhook → 200 skip in `app/api/webhooks/clerk/__tests__/route.test.ts` — mock `clerkClient.users.getUser()` returning `privateMetadata: { squareCustomerId: "EXISTING" }`, assert 200, assert no `customers.search` or `customers.create` calls
- [x] T031 [P] [US3] Integration test for existing customer verify → 200 in `app/api/webhooks/clerk/__tests__/route.test.ts` — verify response body is `{ success: true }` and status 200 on idempotent skip

### Implementation for User Story 3

- [x] T032 [US3] Add idempotency guard in `app/api/webhooks/clerk/route.ts` — after reading Clerk user, if `privateMetadata.squareCustomerId` exists, return 200 immediately before any Square API calls

**Checkpoint**: All US1 + US2 + US3 tests pass — duplicate webhooks are harmless


## Phase 6: Polish & Quality Gates

**Purpose**: Final validation, linting, and cross-cutting concerns

- [ ] T033 Run `npm test` — all vitest suites pass with zero failures
- [ ] T034 Run `tsc --noEmit` — zero TypeScript errors
- [ ] T035 Run `npm run lint` — zero ESLint errors
- [ ] T036 Validate all 9 Gherkin scenarios from `features/clerk-to-square-customer-sync.feature` are covered by integration tests — map each `@US1`, `@US2`, `@US3` scenario to corresponding test task
- [ ] T037 Run `quickstart.md` validation scenarios — execute all 5 validation steps, confirm expected outcomes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — 🎯 MVP
- **User Story 2 (Phase 4)**: Depends on US1 completion (extends existing handler)
- **User Story 3 (Phase 5)**: Depends on US1 completion (adds guard to handler)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No other story dependencies — starts after Foundational
- **User Story 2 (P2)**: Depends on US1 (extends handler with error handling)
- **User Story 3 (P3)**: Depends on US1 (adds idempotency guard)

### Parallel Opportunities

- T001–T005 (Setup): All [P] tasks run in parallel
- T006, T007 (Foundational): Different files, run in parallel
- T008, T009 (Foundational tests): Different files, run in parallel after T006/T007
- T010–T015 (US1 tests): All [P], different test files
- T016–T018 (US1 helpers): All [P], independent functions
- T021–T025 (US2 tests): All [P]
- T030–T031 (US3 tests): Both [P]

---

## Parallel Example: User Story 1

```bash
# Launch all US1 tests together (write first, expect FAIL):
Task: "T010 Unit test for email extraction in lib/square/__tests__/customers.test.ts"
Task: "T011 Integration test for findCustomerByEmail in lib/square/__tests__/customers.test.ts"
Task: "T012 Integration test for createSquareCustomer in lib/square/__tests__/customers.test.ts"
Task: "T013 Integration test for new user → new Square customer in route.test.ts"
Task: "T014 Integration test for returning user → existing customer in route.test.ts"
Task: "T015 Integration test for unverified webhook → 400 in route.test.ts"

# Launch all US1 helpers together:
Task: "T016 Create findCustomerByEmail in lib/square/customers.ts"
Task: "T017 Create createSquareCustomer in lib/square/customers.ts"
Task: "T018 Create extractPrimaryEmail in lib/square/customers.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Register a test user, verify Square customer creation
5. Deploy/demo if ready — users now get Square customer IDs

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Deploy/Demo (MVP! 🎯)
3. Add US2 → Test independently → Deploy/Demo (errors handled)
4. Add US3 → Test independently → Deploy/Demo (idempotent)
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The existing webhook handler already handles Svix verification — this feature adds `user.created` processing on top
