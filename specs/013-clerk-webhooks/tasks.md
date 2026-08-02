# Tasks: Clerk Webhook Integration

**Input**: Design documents from `specs/013-clerk-webhooks/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Following the Testing Trophy (Kent C. Dodds), integration tests are the primary investment for Route Handlers. Tests MUST be written and FAIL before the implementation is considered complete.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure required configuration is in place before any implementation

- [X] T001 Add `CLERK_WEBHOOK_SECRET` to `.env.local` — copy signing secret from Clerk Dashboard → Webhooks → your endpoint → "Signing Secret" section. Format: `CLERK_WEBHOOK_SECRET="whsec_..."`

- [X] T002 [P] Verify `svix` package is available at the required version in `package.json` — should show `"svix": "^1.99.1"` under `dependencies`. Run `npm ls svix` to confirm it's installed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core contracts and types needed by all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Create the Clerk webhook feature directory structure: `specs/013-clerk-webhooks/features/`

- [X] T004 [P] Create Gherkin feature file at `specs/013-clerk-webhooks/features/clerk-webhooks.feature` with scenarios covering: valid signature → 200, invalid signature → 400, missing headers → 400, missing secret → 500, valid `user.created` event logging

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Securely Receive Clerk Webhook Events (Priority: P1) 🎯 MVP

**Goal**: A POST endpoint at `/api/webhooks/clerk` that verifies Clerk webhook signatures using Svix and returns appropriate HTTP status codes.

**Independent Test**: Send a signed POST to `/api/webhooks/clerk` with valid `svix-*` headers (using the Svix CLI or Clerk Dashboard's "Send Test Event"). Verify 200 response. Send a request with invalid signature headers and verify 400 response.

### Tests for User Story 1 (MANDATORY — Testing Trophy)

> Follows Kent C. Dodds' Testing Trophy: integration > unit. Write these tests FIRST, ensure they FAIL, then implement.

- [X] T005 [P] [US1] Integration test for invalid signature (400 response) in `app/api/webhooks/clerk/__tests__/route.test.ts` — mock `Webhook.verify()` to throw an error, send POST with any body, assert status 400 and error message `"Invalid webhook signature"`

- [X] T006 [P] [US1] Integration test for missing webhook secret (500 response) in `app/api/webhooks/clerk/__tests__/route.test.ts` — temporarily unset `CLERK_WEBHOOK_SECRET` (or mock `process.env`), send POST, assert status 500 and error message `"Webhook secret not configured"`

- [X] T007 [P] [US1] Integration test for valid signature (200 response) in `app/api/webhooks/clerk/__tests__/route.test.ts` — mock `Webhook.verify()` to return `{ type: "user.created", data: { id: "user_test123" } }`, send POST, assert status 200 and body `{ success: true }`

### Implementation for User Story 1

- [X] T008 [US1] Create the Clerk webhook Route Handler at `app/api/webhooks/clerk/route.ts`:
  - Import `{ Webhook }` from `svix` and `{ NextResponse }` from `next/server`
  - Read `CLERK_WEBHOOK_SECRET` from `process.env` at module level
  - Guard: return 500 if secret is not configured
  - Extract `svix-id`, `svix-timestamp`, `svix-signature` from request headers
  - Read raw body via `await req.text()`
  - Verify signature via `new Webhook(secret).verify(rawBody, headers)` inside try/catch — return 400 on failure
  - On success: return 200 with `{ success: true }`
  - Export `POST` as the named handler function with typed `Promise<NextResponse<...>>` return

**Checkpoint**: User Story 1 complete — endpoint accepts/rejects webhooks based on signature validity

---

## Phase 4: User Story 2 - Observability via Console Logging (Priority: P2)

**Goal**: Log the event type and data ID for every successfully verified webhook to the console for debugging and monitoring.

**Independent Test**: Send a valid webhook to the endpoint and verify `console.log` output contains `"Clerk webhook received — type: user.created, data.id: user_test123"`.

### Tests for User Story 2 (MANDATORY — Testing Trophy)

- [X] T009 [P] [US2] Integration test for console logging on valid webhook in `app/api/webhooks/clerk/__tests__/route.test.ts` — spy on `console.log`, mock `Webhook.verify()` to return a valid payload, assert `console.log` was called with a string containing the event type and data ID

### Implementation for User Story 2

- [X] T010 [US2] Add console logging to the Route Handler in `app/api/webhooks/clerk/route.ts`:
  - Define a `ClerkWebhookEvent` interface with `type: string` and `data: { id: string }`
  - Cast the verified payload from `Webhook.verify()` to `ClerkWebhookEvent`
  - Log `` `Clerk webhook received — type: ${evt.type}, data.id: ${evt.data.id}` `` via `console.log()`
  - Place the log after successful verification and before returning 200

**Checkpoint**: User Story 2 complete — every valid webhook event is logged with type and data ID

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and quality gates

- [X] T011 Validate all Gherkin scenarios from `specs/013-clerk-webhooks/features/clerk-webhooks.feature` are covered by integration tests — map each `@US1`, `@US2` scenario to corresponding test task (T005-T009)

- [ ] T012 Run `quickstart.md` validation scenarios — execute all 4 validation curl commands, confirm expected HTTP status codes and responses

- [ ] T013 Run full quality gate: `tsc --noEmit && npm run lint && npm test` — all must pass with zero errors

- [ ] T014 [P] Add `CLERK_WEBHOOK_SECRET` as a Vercel Environment Variable for production (via Vercel Dashboard or `vercel env add CLERK_WEBHOOK_SECRET production`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion (logging is added to the same route file)
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 (same route file; logging is added to the existing handler)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Integration tests (T005-T007) before implementation (T008)
- Integration test (T009) before implementation (T010)
- Story complete before moving to next priority

### Parallel Opportunities

- T001 and T002 can run in parallel (different concerns)
- T003 and T004 can run in parallel (directory creation vs Gherkin file)
- T005, T006, T007 can all run in parallel (independent test cases, same file)
- T012 and T013 are independent but both require Phase 4 completion

---

## Parallel Example: User Story 1

```bash
# Launch all integration tests for User Story 1 together:
Task: "T005 [P] [US1] Integration test for invalid signature"
Task: "T006 [P] [US1] Integration test for missing secret"
Task: "T007 [P] [US1] Integration test for valid signature"

# After tests fail, implement:
Task: "T008 [US1] Create the Clerk webhook Route Handler"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T004)
3. Complete Phase 3: User Story 1 (T005-T008)
4. **STOP and VALIDATE**: Test independently — send signed/unsigned webhooks, verify 200/400
5. Deploy/demo if ready — the endpoint is functional

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. User Story 1 → Tests pass, endpoint accepts/rejects webhooks → Deploy (MVP!)
3. User Story 2 → Tests pass, console logs event data → Deploy
4. Polish → Gherkin coverage, quickstart, quality gates green → Ready for merge

---

## Notes

- [P] tasks = different files or independent test cases, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- The Route Handler implementation (T008) may already exist — verify it against the spec
- `CLERK_WEBHOOK_SECRET` must be set in Vercel before production webhooks can be received
