# Tasks: Square Checkout Flow

**Input**: Design documents from `/specs/024-checkout-flow/`

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

- **Next.js App Router**: `app/`, `components/`, `lib/` at repository root
- **Tests**: `__tests__/` co-located alongside the source module; E2E in `tests/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Square API client exports and type definitions needed by all stories

- [x] T001 Export `checkoutApi` from Square client in `lib/square/client.ts`
- [x] T002 [P] Add `CheckoutInput`, `CheckoutResult`, `PaymentLink`, and `OrderResult` types with Zod validation schemas in `lib/square/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core checkout logic that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Implement `createPaymentLink` and `validateCartForCheckout` functions in `lib/square/checkout.ts`

**Checkpoint**: Foundation ready — Square checkout client and types available for all user stories

---

## Phase 3: User Story 1 - Initiate Checkout from Cart (Priority: P1) 🎯 MVP

**Goal**: Wire the "Proceed to Checkout" button to create a Square payment link and redirect the customer to the Square-hosted payment page.

**Independent Test**: Add items to cart, click "Proceed to Checkout", verify redirect to Square payment page with correct order total.

### Tests for User Story 1 (MANDATORY — Testing Trophy)

> Follows Kent C. Dodds' Testing Trophy: integration > unit > e2e.
> Write these tests FIRST, ensure they FAIL, then implement.

- [x] T004 [P] [US1] Unit test for `CheckoutInput` Zod schema validation (valid/invalid orderId, squareCustomerId) in `lib/square/__tests__/types.test.ts`
- [x] T005 [P] [US1] Integration test for `initiateCheckout` server action happy path (form submission → payment link → redirect) with MSW in `app/cart/__tests__/actions.test.ts`
- [x] T006 [US1] E2E test for checkout initiation journey (add to cart → click checkout → Square redirect) in `tests/e2e/checkout.spec.ts` (Playwright) — P1 critical path

### Implementation for User Story 1

- [x] T007 [US1] Implement `initiateCheckout` server action in `app/cart/actions.ts` (auth guard, cart validation, `createPaymentLink` call, return redirect URL)
- [x] T008 [US1] Wire "Proceed to Checkout" button in `components/cart/cart-summary.tsx` — wrap in `<form>` with `action={initiateCheckout}`, add hidden inputs for `orderId` and `squareCustomerId`, show loading state via `useFormStatus`
- [x] T009 [US1] Add disabled state logic to checkout button when any `lineItem.isUnavailable` is true in `components/cart/cart-summary.tsx`
- [x] T010 [US1] Pass `squareCustomerId` from `app/cart/page.tsx` through to `CartSummary` component via props in `components/cart/cart-summary.tsx`

**Checkpoint**: At this point, a customer can click "Proceed to Checkout" from their cart, be redirected to a Square-hosted payment page, and complete payment. Button is disabled when items are unavailable. **This is the MVP.**

---

## Phase 4: User Story 2 - Handle Checkout Errors (Priority: P2)

**Goal**: All checkout failure modes produce clear error messages, preserve cart state, and allow retry. Empty cart checkout attempts redirect back with a message.

**Independent Test**: Simulate Square API failure during checkout and verify error message on cart page with cart intact and retry available.

### Tests for User Story 2 (MANDATORY — Testing Trophy)

> Write these tests FIRST, ensure they FAIL, then implement.

- [x] T011 [P] [US2] Integration test for checkout error scenarios — Square API error preserves cart, empty cart redirect, unavailable items server-side validation in `app/cart/__tests__/actions.test.ts`
- [x] T012 [P] [US2] Integration test for CartSummary component — disabled button state with unavailable items, error message display in `components/cart/__tests__/cart-summary.test.tsx`

### Implementation for User Story 2

- [x] T013 [US2] Add granular error handling to `initiateCheckout` in `app/cart/actions.ts` — map Square API error types to user-facing messages, add server-side cart validation with specific error codes
- [x] T014 [US2] Add empty cart redirect protection — if `orderId` is missing or order not found, return to `/cart` with error message in `app/cart/actions.ts` and `components/cart/cart-summary.tsx`
- [x] T015 [US2] Add unavailable item warning message above the checkout button in `components/cart/cart-summary.tsx` when `hasUnavailable` is true

**Checkpoint**: All error scenarios handled gracefully — cart preserved on failure, clear messages displayed, empty cart redirected. User Stories 1 AND 2 both work.

---

## Phase 5: User Story 3 - Return from Square Payment Page (Priority: P3)

**Goal**: After completing or cancelling payment on Square, the customer returns to the store and sees an order confirmation or cancellation page.

**Independent Test**: Navigate to `/order/result?status=COMPLETED` and verify confirmation view; navigate to `/order/result?status=CANCELLED` and verify cancellation view.

### Tests for User Story 3 (MANDATORY — Testing Trophy)

> Write these tests FIRST, ensure they FAIL, then implement.

- [x] T016 [P] [US3] Integration test for order result page — COMPLETED status shows confirmation, CANCELLED status shows message, missing status shows fallback, malformed params handled in `app/order/__tests__/result.test.tsx`

### Implementation for User Story 3

- [x] T017 [US3] Create order result page with confirmation view (COMPLETED) and cancellation view (CANCELLED) in `app/order/result/page.tsx` — reads `searchParams.status` and `searchParams.transactionId`
- [x] T018 [US3] Add fallback view for missing/malformed status parameters in `app/order/result/page.tsx`
- [x] T019 [US3] Set return URL in `initiateCheckout` to point to `/order/result` using `VERCEL_URL` environment variable in `app/cart/actions.ts`

**Checkpoint**: Full checkout lifecycle complete — initiate → Square payment → return → confirmation or cancellation. All 3 user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, edge cases, and validation

- [x] T020 [P] Unit test for `validateCartForCheckout` edge cases (empty cart, all unavailable, mixed available/unavailable) in `lib/square/__tests__/checkout.test.ts`
- [x] T021 [P] Integration test for cart page — checkout button visibility with empty cart, with items, with unavailable items in `app/cart/__tests__/page.test.tsx`
- [x] T022 Run `tsc --noEmit` and fix any type errors
- [x] T023 Run `npm run lint` and fix any warnings (0 errors required)
- [x] T024 Run `npm test` (vitest run) — all suites must pass with zero failures
- [x] T025 Run `npm run test:e2e` — checkout journey must pass
- [x] T026 Validate all 6 quickstart scenarios from `specs/024-checkout-flow/quickstart.md`
- [x] T027 Verify `.feature` file scenarios are covered by integration/E2E tests per Gherkin Coverage gate

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001, T002) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (T003) — No dependencies on other stories
- **User Story 2 (Phase 4)**: Depends on US1 (T007 for the server action it enhances) — enhances error handling
- **User Story 3 (Phase 5)**: Depends on US1 (T007 for the return URL in `initiateCheckout`) — adds return pages
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — standalone MVP
- **User Story 2 (P2)**: Depends on US1's `initiateCheckout` server action (T007) — enhances existing action
- **User Story 3 (P3)**: Depends on US1's `initiateCheckout` (T007 for return URL) — adds return flow

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Implementation tasks build on each other sequentially
- Story complete before moving to next priority

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T004 and T005 can run in parallel (different test files)
- T011 and T012 can run in parallel (different test files)
- T020 and T021 can run in parallel (different test files)
- Once Foundational completes, US1 tests (T004, T005) can start in parallel
- Once US1 implementation completes, US2 tests (T011, T012) and US3 test (T016) can start in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (must fail first):
Task: "Unit test for CheckoutInput Zod schema in lib/square/__tests__/types.test.ts"
Task: "Integration test for initiateCheckout server action in app/cart/__tests__/actions.test.ts"

# After tests fail, implement sequentially:
Task: "Implement initiateCheckout server action in app/cart/actions.ts"
Task: "Wire Proceed to Checkout button in components/cart/cart-summary.tsx"
Task: "Add disabled state logic in components/cart/cart-summary.tsx"
Task: "Pass squareCustomerId through cart page in app/cart/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001, T002)
2. Complete Phase 2: Foundational (T003)
3. Complete Phase 3: User Story 1 (T004–T010)
4. **STOP and VALIDATE**: Customer can click checkout, get redirected to Square payment page
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Initiate checkout with Square redirect → **MVP!**
3. Add User Story 2 → Error handling, cart preservation, retry → Robust checkout
4. Add User Story 3 → Return page with confirmation/cancellation → Complete flow
5. Polish → Tests pass, lint clean, quickstart validated

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (T004–T010) ← priority
3. Once US1 implementation (T007) is done:
   - Developer A: User Story 2 (T011–T015) — enhances server action
   - Developer B: User Story 3 (T016–T019) — return page (can work in parallel with US2)
4. Polish: All developers finalize tests and quality gates

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- T007 (`initiateCheckout` server action) is the critical path — both US2 and US3 depend on it
- The `checkoutApi.paymentLinks.create()` call in T007 MUST use a UUID v4 idempotency key per research §6
- Return URL in T019 MUST use `VERCEL_URL` or derived base URL per research §3
