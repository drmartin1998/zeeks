# Tasks: Resend Order Emails

**Input**: Design documents from `/specs/037-brevo-order-emails/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Following the Testing Trophy (Kent C. Dodds), every user story MUST
include test tasks. Integration tests are the largest investment; E2E for
critical paths only. Tests MUST be written FIRST and FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project (Next.js App Router)**: `app/`, `lib/`, `components/`, `tests/` at repository root
- Use the `@/*` path alias for all imports (Constitution III)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify the foundation and add the Resend dependency.

- [x] T001 Verify the repo foundation: `tsc --noEmit` and `npm run lint` pass on the `037-brevo-order-emails` branch
- [x] T002 Install the Resend Node SDK (`resend`) and confirm it is added to `package.json`
- [x] T003 [P] Confirm the Square SDK version (≥ 40) exports `WebhooksHelper` from `square` (used for signature verification)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure both email sending and the webhook endpoint depend on — types, the email content builder, and the Resend send service.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Add `EmailLineItem` and `OrderConfirmationEmail` types to `lib/square/types.ts`
- [x] T005 Add `SquareWebhookEvent` type (with `payment.updated` payload shape) to `lib/square/types.ts`
- [x] T006 Add `SQUARE_WEBHOOK_URL`, `SQUARE_WEBHOOK_SIGNATURE_KEY`, and `RESEND_API_KEY` validation to `lib/env.ts` (Constitution VII)
- [x] T007 Create `lib/email/order-email.ts` — pure function `buildOrderConfirmationEmail()` returning `{ html, text, subject }` (send from `orders@zeekscg.com`)
- [x] T008 Create `lib/email/email.ts` — `sendTransactionalEmail()` using `RESEND_API_KEY` via the Resend SDK (fire-and-forget; logs and skips on failure)
- [x] T009 [P] Add MSW handlers for Resend and the Square order fetch in `tests/setup/` (used by integration tests)

**Checkpoint**: Foundation ready — email content builder and Resend send service exist; user story implementation can begin.

---

## Phase 3: User Story 1 - Order Confirmation Email on Completion (Priority: P1) 🎯 MVP

**Goal**: Receive a `payment.updated` Square webhook, verify its signature, fetch the order, and send a confirmation email to the customer with the order details. Never blocks checkout.

**Independent Test**: POST a signed `payment.updated` webhook and verify a `200`, and that an email with the full order ID, itemized items, and subtotal is sent to the customer's address.

### Tests for User Story 1 (MANDATORY — Testing Trophy)

> Write these tests FIRST, ensure they FAIL, then implement.

- [x] T010 [P] [US1] Unit test for `buildOrderConfirmationEmail()` (HTML + text include order ID, line items, subtotal) in `lib/email/__tests__/order-email.test.ts`
- [x] T011 [P] [US1] Integration test for `POST /api/webhooks/square` — valid signature sends an email, invalid signature returns `403` (RTL/Node + MSW) in `app/api/webhooks/square/__tests__/route.test.ts`

### Implementation for User Story 1

- [x] T012 [US1] Create `app/api/webhooks/square/route.ts` — verify `WebhooksHelper.verifySignature`, parse `payment.updated`, extract `order_id`
- [x] T013 [US1] Fetch the order (via existing `getCart()`/`ordersApi`) and resolve the customer email in `app/api/webhooks/square/route.ts`
- [x] T014 [US1] Build the email via `buildOrderConfirmationEmail()` and send via `sendTransactionalEmail()` (fire-and-forget) in `app/api/webhooks/square/route.ts`
- [x] T015 [US1] Return `200` for handled/non-trigger events and `403` for invalid signatures; log send failures (no retry) in `app/api/webhooks/square/route.ts`

**Checkpoint**: User Story 1 fully functional and testable independently (order-confirmation email on completion).

---

## Phase 4: User Story 2 - Email for Signed-In Customers (Priority: P2)

**Goal**: Ensure the confirmation email goes to the signed-in customer's account email (Square customer profile), with the same content as guest orders.

**Independent Test**: Complete checkout while signed in and verify the email is sent to the account's email address with the standard confirmation details.

### Tests for User Story 2 (MANDATORY — Testing Trophy)

- [x] T016 [P] [US2] Integration test verifying the webhook resolves the signed-in customer's Square email and sends to it in `app/api/webhooks/square/__tests__/route.test.ts`

### Implementation for User Story 2

- [x] T017 [US2] Resolve the recipient from the Square customer record when the order belongs to a signed-in customer (fall back to billing email for guests) in `lib/email/order-email.ts` or the webhook route
- [x] T018 [US2] Confirm the email builder/content is identical for signed-in and guest recipients in `lib/email/order-email.ts`

**Checkpoint**: User Stories 1 AND 2 both work independently (confirmation email for signed-in and guest customers).

---

## Phase 5: User Story 3 - Graceful Failure When Email Cannot Be Sent (Priority: P3)

**Goal**: If the email cannot be sent, the webhook still returns `200`, the order flow is unaffected, and the failure is logged (no retry).

**Independent Test**: Send a valid `payment.updated` webhook with an invalid `RESEND_API_KEY` and verify the webhook still returns `200` and the send failure is logged without surfacing an error.

### Tests for User Story 3 (MANDATORY — Testing Trophy)

- [x] T019 [P] [US3] Integration test verifying a Resend send failure is logged and the webhook still returns `200` in `app/api/webhooks/square/__tests__/route.test.ts`

### Implementation for User Story 3

- [x] T020 [US3] Ensure `sendTransactionalEmail()` catches Resend errors, logs them, and never throws to the caller in `lib/email/email.ts`
- [x] T021 [US3] Confirm the webhook route returns `200` even when the email send fails (no blocking, no retry) in `app/api/webhooks/square/route.ts`

**Checkpoint**: All user stories independently functional, including graceful email-failure handling.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements across the feature and overall quality.

- [x] T022 [P] Add env documentation for `RESEND_API_KEY`, `SQUARE_WEBHOOK_URL`, `SQUARE_WEBHOOK_SIGNATURE_KEY` (e.g., to `.env` example / README)
- [x] T023 [P] Run `quickstart.md` validation scenarios (signature verification, email sent, correct recipient, failure non-blocking, non-trigger ignored)
- [x] T024 Confirm the webhook route returns quickly (fire-and-forget email) and logging covers verification + send outcomes
- [x] T025 Run full quality gates: `tsc --noEmit`, `npm run lint`, `npm test` — zero failures

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — verifies foundation and installs the Resend SDK.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (types, email builder, Resend service are prerequisites).
- **User Stories (Phase 3+)**: All depend on Foundational completion.
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational. No dependency on US2/US3 — independently testable.
- **User Story 2 (P2)**: Can start after Foundational. Reuses the same webhook route/email builder; independently testable with a signed-in recipient.
- **User Story 3 (P3)**: Can start after Foundational. Validates failure handling on top of US1; independently testable.

### Within Each User Story

- Tests MUST be written and FAIL before implementation.
- Types/helpers before the route; the route before failure handling.
- Story complete before moving to the next priority.

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel.
- All Foundational tasks marked [P] can run in parallel (within Phase 2).
- Once Foundational completes, US1 test tasks can run in parallel, and US2/US3 can start in parallel.
- All tests for a user story marked [P] can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Launch the unit + integration tests for User Story 1 together:
Task: "Unit test for buildOrderConfirmationEmail in lib/email/__tests__/order-email.test.ts"
Task: "Integration test for POST /api/webhooks/square in app/api/webhooks/square/__tests__/route.test.ts"

# Launch the independent implementation files together:
Task: "Create app/api/webhooks/square/route.ts (signature verification + order fetch)"
Task: "Create lib/email/order-email.ts (content builder)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (webhook → email)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP)
3. Add User Story 2 → Test independently (signed-in recipient)
4. Add User Story 3 → Test independently (graceful failure)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (webhook route + send)
   - Developer B: User Story 2 (signed-in recipient resolution)
   - Developer C: User Story 3 (failure handling)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- The webhook signature MUST be verified (Square SDK `WebhooksHelper`) before processing
- The email never blocks checkout; failures are logged and skipped (no retry)