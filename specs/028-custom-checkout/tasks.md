# Tasks: Custom Checkout Page Flow

**Input**: Design documents from `specs/028-custom-checkout/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Integration > Unit > E2E (Testing Trophy). Tests MUST be written FIRST and FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Pages**: `app/checkout/page.tsx`, `app/order/confirmation/page.tsx`
- **Components**: `components/checkout/`
- **Lib**: `lib/square/`
- **Server Actions**: `app/cart/actions.ts`
- **Tests**: `__tests__/` co-located alongside source modules

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type definitions, Zod schemas, and Square payments library — shared by all user stories

- [ ] T001 Add `PaymentFormInput` Zod schema (`PaymentFormSchema`) and type to `lib/square/types.ts`
- [ ] T002 [P] Add `PaymentResult` and `OrderConfirmationData` types to `lib/square/types.ts`
- [ ] T003 [P] Add `CheckoutData` aggregate type to `lib/square/types.ts`
- [ ] T004 Implement `processCardPayment` function wrapping `paymentsApi.create` with idempotency key in `lib/square/payments.ts`

**Checkpoint**: Types and payment processing foundation ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core checkout infrastructure — Server Action, route structure, and Square Web Payments SDK setup

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Remove `initiateCheckout` Server Action and `createPaymentLink` import from `app/cart/actions.ts`
- [ ] T006 Remove or deprecate `createPaymentLink` function from `lib/square/checkout.ts`
- [ ] T007 Change cart "Proceed to Checkout" button from `<form action={initiateCheckout}>` to `<Link href="/checkout">` in `components/cart/cart-client.tsx`
- [ ] T008 Create `app/checkout/page.tsx` async Server Component — auth guard, fetch `CheckoutData` (cart + loyalty + profile in parallel `Promise.allSettled`), render skeleton-wrapped `CheckoutPageClient`
- [ ] T009 [P] Create `CheckoutSkeleton` component with per-section skeleton placeholders (order summary, customer info, payment form) in `components/checkout/checkout-skeleton.tsx`
- [ ] T010 Add `SQUARE_APPLICATION_ID` as `NEXT_PUBLIC_SQUARE_APPLICATION_ID` exposure if not already present in `lib/env.ts`
- [ ] T011 Register Square Web Payments SDK script (`@square/web-sdk`) in package.json and verify import

**Checkpoint**: Checkout page loads with skeletons — user story implementation can begin

---

## Phase 3: User Story 1 - Complete Order with Payment (Priority: P1) 🎯 MVP

**Goal**: Customer sees a checkout page with order summary and payment form. Can enter card + billing address, submit payment, and see order confirmation.

**Independent Test**: Add items to cart, proceed to checkout, enter test card (`4111111111111111`), submit, verify redirect to confirmation page with transaction ID.

### Tests for User Story 1 (MANDATORY — Testing Trophy)

- [ ] T012 [P] [US1] Unit test for `PaymentFormSchema` Zod validation (valid/invalid inputs) in `lib/square/__tests__/types.test.ts`
- [ ] T013 [P] [US1] Integration test for `processPayment` Server Action (mock Square APIs with MSW) in `app/cart/__tests__/checkout.test.ts`
- [ ] T014 [US1] Integration test for checkout page rendering with valid cart data (RTL + MSW) in `components/checkout/__tests__/checkout-page.test.tsx`
- [ ] T015 [US1] E2E test for complete checkout flow (cart → checkout → payment → confirmation) in `tests/e2e/checkout.spec.ts` (Playwright)

### Implementation for User Story 1

- [ ] T016 [P] [US1] Create `OrderSummary` component — displays line items, quantities, unit prices, and subtotal in `components/checkout/order-summary.tsx`
- [ ] T017 [P] [US1] Create `PaymentForm` client component — initializes Square Web Payments SDK, mounts card input, collects billing address fields, tokenizes on submit, uses `useActionState` with `processPayment` in `components/checkout/payment-form.tsx`
- [ ] T018 [US1] Implement `processPayment` Server Action — Zod validation, auth check, order DRAFT→OPEN transition, payment via `paymentsApi.create`, return `PaymentResult` in `app/cart/actions.ts`
- [ ] T019 [US1] Create `CheckoutPageClient` — composes `OrderSummary` + `PaymentForm`, handles loading/error states in `components/checkout/checkout-page-client.tsx`
- [ ] T020 [US1] Create `app/order/confirmation/page.tsx` — reads `?orderId=` and `?transactionId=` from search params, displays success message with transaction reference and order total
- [ ] T021 [US1] Wire `CheckoutPageClient` into `app/checkout/page.tsx` with proper Suspense boundaries per section (order summary, payment form)

**Checkpoint**: Customer can complete a full checkout flow — cart → checkout → payment → confirmation. No loyalty rewards yet.

---

## Phase 4: User Story 2 - View Applied Loyalty Reward on Checkout (Priority: P1)

**Goal**: Loyalty reward selected on cart is visible as a discount line item on the checkout page and processed as part of payment.

**Independent Test**: Select "$10 Off" reward on cart, proceed to checkout, verify "-$10.00" line item appears, complete payment with discounted total.

### Tests for User Story 2 (MANDATORY — Testing Trophy)

- [ ] T022 [P] [US2] Integration test for reward creation with `order_id` during payment processing (MSW mock loyalty API) in `app/cart/__tests__/checkout.test.ts`
- [ ] T023 [P] [US2] Integration test for checkout page displaying reward discount line item in `components/checkout/__tests__/checkout-page.test.tsx`

### Implementation for User Story 2

- [ ] T024 [P] [US2] Create `RewardDiscount` component — displays discount description, negative dollar amount, and remaining points in `components/checkout/reward-discount.tsx`
- [ ] T025 [US2] Update `processPayment` Server Action — read `rewardTierId`/`loyaltyAccountId` from form data, check for existing reward, create new reward with `order_id` after order OPEN transition, include reward info in confirmation in `app/cart/actions.ts`
- [ ] T026 [US2] Update `OrderSummary` to accept optional `rewardDiscount` prop and display it as a line item before the total in `components/checkout/order-summary.tsx`
- [ ] T027 [US2] Update `CheckoutPageClient` to pass loyalty data (reward tier info, remaining points) to `OrderSummary` and `RewardDiscount` in `components/checkout/checkout-page-client.tsx`
- [ ] T028 [US2] Update `app/checkout/page.tsx` to include loyalty data in `CheckoutData` fetch
- [ ] T029 [US2] Update `app/order/confirmation/page.tsx` to show applied reward description on confirmation

**Checkpoint**: Loyalty rewards are visible on checkout page as discount line items and reflected in the final total.

---

## Phase 5: User Story 3 - View Customer Information on Checkout (Priority: P2)

**Goal**: Customer sees their name and email pre-populated on the checkout page.

**Independent Test**: Log in, add items, proceed to checkout. Verify name and email from account profile are displayed.

### Tests for User Story 3

- [ ] T030 [P] [US3] Integration test for customer info display on checkout page in `components/checkout/__tests__/checkout-page.test.tsx`

### Implementation for User Story 3

- [ ] T031 [P] [US3] Create `CustomerInfo` component — displays pre-populated name and email in `components/checkout/customer-info.tsx`
- [ ] T032 [US3] Update `CheckoutPageClient` to render `CustomerInfo` with profile data from `CheckoutData` in `components/checkout/checkout-page-client.tsx`
- [ ] T033 [US3] Update `app/checkout/page.tsx` to fetch customer profile (name, email) in parallel with cart and loyalty data

**Checkpoint**: Customer information visible on checkout page alongside order summary and payment form.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, edge cases, accessibility, and final validation

- [ ] T034 [P] Run `tsc --noEmit` and fix any type errors
- [ ] T035 [P] Run `npm run lint` and fix any lint warnings
- [ ] T036 Handle payment decline — map Square error codes to user-facing messages and display inline in `components/checkout/payment-form.tsx`
- [ ] T037 Handle missing reward edge case — if reward tier was selected on cart but no longer available at checkout, remove discount and notify user in `components/checkout/checkout-page-client.tsx`
- [ ] T038 Handle empty cart redirect — if `/checkout` loaded with empty cart, redirect to `/cart` in `app/checkout/page.tsx`
- [ ] T039 [P] Accessibility audit — verify payment form labels are associated, keyboard navigation works, error messages are announced, card input has proper ARIA
- [ ] T040 Run quickstart.md validation — execute VS-1 through VS-10 and confirm expected outcomes
- [ ] T041 Performance check — verify checkout page loads within 3s and payment processing completes within 5s (SC-001)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — core checkout flow (MVP)
- **US2 (Phase 4)**: Depends on Phase 3 (needs checkout page + payment flow to exist)
- **US3 (Phase 5)**: Depends on Phase 3 (needs checkout page); can run in parallel with US2
- **Polish (Phase 6)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: Foundation — all other stories build on the core checkout page and payment flow
- **US2 (P1)**: Depends on US1 (needs `CheckoutPageClient`, `OrderSummary`, `processPayment`)
- **US3 (P2)**: Depends on US1 (needs `CheckoutPageClient`); can run in PARALLEL with US2

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models/schemas before components
- Leaf components before parent compositions
- Core implementation before edge cases

### Parallel Opportunities

- T001, T002, T003 can run in parallel (all in types.ts)
- T009, T010 can run in parallel (different files)
- Phase 3 tests (T012, T013, T014, T015) all parallel
- T016, T017 can run in parallel (OrderSummary + PaymentForm)
- Phase 4 tests (T022, T023) parallel
- US2 and US3 can run in PARALLEL by different developers
- Phase 6 tasks (T034, T035, T039, T040, T041) all parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 + Phase 2 → Foundation ready
2. Complete Phase 3 (User Story 1) → checkout + payment + confirmation work
3. **STOP and VALIDATE**: Full payment flow works end-to-end
4. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Checkout, payment, confirmation (MVP!)
3. Add US2 → Loyalty reward visible as discount line item
4. Add US3 → Customer info pre-populated
5. Polish → Error handling, accessibility, quickstart validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (Testing Trophy)
- Square Web Payments SDK requires `NEXT_PUBLIC_SQUARE_APPLICATION_ID` — ensure this is exposed in Vercel environment variables for all environments
- All payment mutations MUST use idempotency keys: `payment-{orderId}`
- The existing `/order/result` page is replaced by `/order/confirmation`
- Remove `createPaymentLink` and `initiateCheckout` — no backward compatibility needed
