# Tasks: Guest Cart & Checkout

**Input**: Design documents from `/specs/025-guest-checkout/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Following the Testing Trophy (Kent C. Dodds), every user story MUST
include test tasks. Integration tests are the largest investment; E2E for
critical paths only. Tests MUST be written FIRST and FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js App Router**: `app/`, `components/`, `lib/` at repository root
- **Tests**: `__tests__/` co-located alongside the source module; E2E in `tests/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Guest cart cookie helper — the foundational mechanism all guest cart operations depend on

- [x] T001 Create guest cart cookie helper (`getGuestCartOrderId`, `setGuestCartOrderId`, `clearGuestCartOrderId`) in `lib/square/cookies.ts` per contract `contracts/guest-cart-cookie.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types and cart/checkout function overloads that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Make `squareCustomerId` optional in `CheckoutInput` Zod schema in `lib/square/types.ts` — required for guests
- [x] T003 [P] Add guest-aware overloads to `getCart`, `findOrCreateDraftOrder`, and `getCartItemCount` in `lib/square/cart.ts` per contract `contracts/cart-api.md` — accept `orderId` parameter for guest path alongside existing `squareCustomerId` parameter for auth path
- [x] T004 Update `createPaymentLink` in `lib/square/checkout.ts` to accept `orderId` directly instead of requiring `squareCustomerId` per contract `contracts/cart-api.md`

**Checkpoint**: Foundation ready — guest-aware cart functions and types available for all user stories

---

## Phase 3: User Story 1 - Guest Adds Items to Cart (Priority: P1) 🎯 MVP

**Goal**: Allow unauthenticated visitors to add products to a cart, view the cart page, and adjust quantities — all without a sign-in prompt. Cart persists across page navigation and browser refresh.

**Independent Test**: As an unauthenticated visitor, browse products, add two items to cart, navigate to `/cart`, verify both items appear. Refresh the page and verify cart is intact.

### Tests for User Story 1 (MANDATORY — Testing Trophy)

> Follows Kent C. Dodds' Testing Trophy: integration > unit > e2e.
> Write these tests FIRST, ensure they FAIL, then implement.

- [x] T005 [P] [US1] Unit test for guest cookie helpers (`setGuestCartOrderId`, `getGuestCartOrderId`, `clearGuestCartOrderId`) in `lib/square/__tests__/cookies.test.ts`
- [x] T006 [P] [US1] Unit test for `CheckoutInput` Zod schema with optional `squareCustomerId` — guest (no customerId) and auth (with customerId) variants in `lib/square/__tests__/types.test.ts`
- [x] T007 [P] [US1] Integration test for cart page guest path — unauthenticated visitor sees cart, no redirect to sign-in, items displayed correctly in `app/cart/__tests__/page.test.tsx`
- [x] T008 [US1] E2E test for guest cart journey — browse → add items → cart page → refresh persistence in `tests/e2e/guest-checkout.spec.ts` (Playwright) — P1 critical path

### Implementation for User Story 1

- [x] T009 [US1] Remove hard auth redirect from `app/cart/page.tsx` — add guest path: if no `userId`, check `guest-cart-order-id` cookie and render cart via `getCart(null, orderId)`; if no cookie, show empty cart state
- [x] T010 [US1] Add guest-aware conditional auth gate to `addToCart` server action in `app/cart/actions.ts` — for guests: call `findOrCreateDraftOrder(null, existingOrderId)`, set `guest-cart-order-id` cookie on first add
- [x] T011 [US1] Add guest-aware conditional auth gate to `updateCartItem` and `removeCartItem` server actions in `app/cart/actions.ts` — read `guest-cart-order-id` cookie, use `orderId` directly
- [x] T012 [US1] Make `squareCustomerId` prop optional/nullable in `components/cart/cart-client.tsx` — render guest path when null, pass guest identifier instead
- [x] T013 [US1] Make `squareCustomerId` prop optional/nullable in `components/cart/cart-summary.tsx` — pass `orderId` or null in hidden form field for guests
- [x] T014 [US1] Update header cart badge in `components/nav-bar.tsx` to read `guest-cart-order-id` cookie and show item count for guest users (FR-015) — call `getCartItemCount(null, orderId)` when no authenticated `squareCustomerId`

**Checkpoint**: At this point, an unauthenticated visitor can add items to a cart, view the cart page, adjust quantities, and see the cart badge in the header — all without signing in. **This is the guest cart MVP.**

---

## Phase 4: User Story 2 - Guest Completes Checkout (Priority: P1) 🎯 MVP

**Goal**: An unauthenticated visitor with items in their guest cart clicks "Proceed to Checkout," a Square payment link is generated without a customer ID, and the guest is redirected to the Square-hosted payment page. Guest cookie is cleared after link creation.

**Independent Test**: Add items as a guest, click "Proceed to Checkout," verify redirect to Square payment page, verify the `guest-cart-order-id` cookie is cleared after redirect.

### Tests for User Story 2 (MANDATORY — Testing Trophy)

> Write these tests FIRST, ensure they FAIL, then implement.

- [x] T015 [P] [US2] Integration test for `initiateCheckout` guest path — payment link generated without `squareCustomerId`, guest cookie cleared on success, Square API error preserves cart in `app/cart/__tests__/actions.test.ts`
- [x] T016 [P] [US2] Integration test for CartSummary — "Proceed to Checkout" button works for guests, disabled when unavailable items present, loading state in `components/cart/__tests__/cart-summary.test.tsx`

### Implementation for User Story 2

- [x] T017 [US2] Update `initiateCheckout` server action in `app/cart/actions.ts` — add guest path: read `guest-cart-order-id` cookie, call `createPaymentLink({ orderId, returnUrl })` without `squareCustomerId`, clear cookie on success via `clearGuestCartOrderId()`
- [x] T018 [US2] Update `CartSummary` component in `components/cart/cart-summary.tsx` — pass `orderId` (guest) or `squareCustomerId` (auth) to `initiateCheckout` based on auth state
- [x] T019 [US2] Verify `/order/result` page works unchanged for guest return — confirmation and cancellation views display correctly without auth (already auth-free, verification only)

**Checkpoint**: At this point, a guest can complete the full checkout journey: add to cart → click "Proceed to Checkout" → Square payment page → return to order confirmation. Guest cookie is cleared after payment link creation.

---

## Phase 5: User Story 3 - Guest Cart Survives Sign-In (Priority: P2)

**Goal**: When a guest with cart items signs in via Clerk, their guest cart items are transferred to their authenticated cart. If the authenticated user already has a cart, items are merged.

**Independent Test**: Add items as guest, sign in, verify items appear in authenticated cart with same quantities. Also test merge scenario: auth user with existing cart, guest adds different item, sign in, verify both items present.

### Tests for User Story 3 (MANDATORY — Testing Trophy)

> Write these tests FIRST, ensure they FAIL, then implement.

- [x] T020 [P] [US3] Integration test for cart transfer on sign-in — guest cart items appear in authenticated cart after sign-in, guest cookie cleared in `app/cart/__tests__/actions.test.ts`
- [x] T021 [P] [US3] Integration test for cart merge on sign-in — guest items merged with existing authenticated cart items, duplicate quantities summed in `app/cart/__tests__/page.test.tsx`

### Implementation for User Story 3

- [x] T022 [US3] Implement cart transfer logic on sign-in in `app/cart/actions.ts` or a new `lib/square/cart-transfer.ts` — when a user signs in (detected via Clerk webhook or middleware), if a `guest-cart-order-id` cookie exists, update the guest order's `customerId` to the authenticated user's Square customer ID, then clear the cookie
- [x] T023 [US3] Implement cart merge logic — if the authenticated user already has a draft order with items, append guest line items to the authenticated order (merge duplicates by summing quantities) instead of replacing it

**Checkpoint**: Guests who sign in mid-shopping retain their cart. Merging works when both guest and auth carts have items.

---

## Phase 6: User Story 4 - Guest Cart Expiry & Clearance (Priority: P3)

**Goal**: Guest carts automatically expire after 7 days of inactivity. Guests can also manually clear their cart via a "Clear Cart" action.

**Independent Test**: Create guest cart, verify "Clear Cart" removes all items. Set cookie with expired date, verify cart shows empty on next visit.

### Tests for User Story 4 (MANDATORY — Testing Trophy)

> Write these tests FIRST, ensure they FAIL, then implement.

- [x] T024 [P] [US4] Unit test for cookie expiry logic — expired cookie returns null/undefined from `getGuestCartOrderId`, misconfigured cookie handled gracefully in `lib/square/__tests__/cookies.test.ts`
- [x] T025 [P] [US4] Integration test for "Clear Cart" action — all items removed, guest cookie cleared, empty cart state shown in `components/cart/__tests__/cart-summary.test.tsx`

### Implementation for User Story 4

- [x] T026 [US4] Add cookie expiry handling in `app/cart/page.tsx` — if `guest-cart-order-id` cookie exists but the Square order no longer exists (deleted/expired), clear cookie and show empty cart
- [x] T027 [US4] Implement "Clear Cart" action for guests in `app/cart/actions.ts` — remove all line items from guest order, clear `guest-cart-order-id` cookie, return empty cart state

**Checkpoint**: Guest carts expire gracefully after inactivity. Guests can manually clear their cart. All user stories now deliver a complete guest experience.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, regression validation, and edge case hardening

- [x] T028 [P] Integration test for auth flow regression — authenticated user cart, checkout, and all existing cart behavior unchanged in `app/cart/__tests__/actions.test.ts` and `app/cart/__tests__/page.test.tsx`
- [x] T029 [P] Integration test for guest edge cases — double-click checkout button, unavailable items, empty cart checkout attempt in `app/cart/__tests__/actions.test.ts`
- [x] T030 [P] Unit test for `validateCartForCheckout` with guest cart (null customerId) in `lib/square/__tests__/checkout.test.ts`
- [x] T031 Run `tsc --noEmit` and fix any type errors
- [x] T032 Run `npm run lint` and fix any warnings (0 errors required)
- [x] T033 Run `npm test` (vitest run) — all suites must pass with zero failures
- [x] T034 Run `npm run test:e2e` — guest checkout journey must pass
- [x] T035 Validate all 7 quickstart scenarios from `specs/025-guest-checkout/quickstart.md`
- [x] T036 Verify `.feature` file scenarios are covered by integration/E2E tests per Gherkin Coverage gate

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (T002, T003, T004) — guest cart infrastructure
- **User Story 2 (Phase 4)**: Depends on US1 (T009, T010, T017 server action structure) — enhances existing actions
- **User Story 3 (Phase 5)**: Depends on US1 (guest cart exists) and US2 (auth path unchanged) — adds cart transfer
- **User Story 4 (Phase 6)**: Depends on US1 (guest cart exists) — adds expiry and clearance
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — standalone guest cart MVP
- **User Story 2 (P1)**: Depends on US1's cart actions (T010 — `addToCart` guest path, T017 — `initiateCheckout` guest path). Both P1; US2 logically follows US1 since you need a cart before you can checkout.
- **User Story 3 (P2)**: Depends on US1 (guest cart exists) — adds sign-in transfer. Independent of US2.
- **User Story 4 (P3)**: Depends on US1 (guest cart exists) — adds expiry and clearance. Independent of US2 and US3.

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Implementation tasks build on each other sequentially within the story
- Story complete before moving to next priority

### Parallel Opportunities

- T002 and T003 can run in parallel (different files)
- T005, T006, T007 can run in parallel (different test files)
- T015 and T016 can run in parallel (different test files)
- T020 and T021 can run in parallel (different test files)
- T024 and T025 can run in parallel (different test files)
- T028, T029, T030 can run in parallel (different test files)
- Once US1 implementation completes, US2 tests and US3 tests (T020, T021) can run in parallel
- US3 (Phase 5) and US4 (Phase 6) can be implemented in parallel if staffed — they target different code paths

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (must fail first):
Task: "Unit test for guest cookie helpers in lib/square/__tests__/cookies.test.ts"
Task: "Unit test for CheckoutInput Zod schema in lib/square/__tests__/types.test.ts"
Task: "Integration test for cart page guest path in app/cart/__tests__/page.test.tsx"

# After tests fail, implement sequentially:
Task: "Remove hard auth redirect from app/cart/page.tsx"
Task: "Add guest-aware auth gate to addToCart in app/cart/actions.ts"
Task: "Add guest-aware auth gate to updateCartItem and removeCartItem in app/cart/actions.ts"
Task: "Make squareCustomerId optional in components/cart/cart-client.tsx"
Task: "Make squareCustomerId optional in components/cart/cart-summary.tsx"
Task: "Update header cart badge in components/nav-bar.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T004)
3. Complete Phase 3: User Story 1 (T005–T014)
4. **STOP and VALIDATE**: Guest can add items, view cart, see badge
5. Complete Phase 4: User Story 2 (T015–T019)
6. **STOP and VALIDATE**: Guest can complete full checkout — **MVP!**
7. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Guest cart with badge → **Cart MVP**
3. Add User Story 2 → Guest checkout → **Full MVP!**
4. Add User Story 3 → Cart survives sign-in → Better conversion
5. Add User Story 4 → Cart expiry and clearance → Complete experience
6. Polish → Tests pass, lint clean, quickstart validated

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (T005–T014) ← priority
3. Once US1 is done:
   - Developer A: User Story 2 (T015–T019)
   - Developer B: User Story 3 (T020–T023) and User Story 4 (T024–T027) in parallel
4. Polish: All developers finalize tests and quality gates

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Critical path**: T001 → T002/T003/T004 → T010 (addToCart guest path) → T017 (initiateCheckout guest path) — the backbone of guest checkout
- Guest cookie uses 7-day `maxAge` per research §5
- Cookie name: `guest-cart-order-id` per research §3 and contract `contracts/guest-cart-cookie.md`
- Guest cart orders created via `ordersApi.create()` WITHOUT `customerId` per research §2
- Cart transfer on sign-in updates the guest order's `customerId` rather than creating a new order per research §4
- Guest cart clearance happens in `initiateCheckout` success path — call `clearGuestCartOrderId()` before returning the redirect URL
