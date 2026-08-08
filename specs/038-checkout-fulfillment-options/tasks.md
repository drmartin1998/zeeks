# Tasks: Checkout Fulfillment Options

**Input**: Design documents from `/specs/038-checkout-fulfillment-options/`

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

- **Single project (Next.js App Router)**: `app/`, `components/`, `lib/`, `tests/` at repository root
- Use the `@/*` path alias for all imports (Constitution III)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify the foundation.

- [x] T001 Verify the repo foundation: `tsc --noEmit` and `npm run lint` pass on the `038-checkout-fulfillment-options` branch
- [x] T002 [P] Confirm feature 037 (Resend order emails) is available on this branch for the US3 email extension (or note it as a merge dependency)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types and the shipping-cost calculator that both the checkout UI and confirmation/email depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Add `FulfillmentMethod` (`"shipping" | "pickup"`), `ShippingAddress`, and `OrderFulfillment` types to `lib/square/types.ts`
- [x] T004 Extend the `Cart` type with `shippingCost`, `total`, and `fulfillment` fields in `lib/square/types.ts`
- [x] T005 Add a Zod schema for the shipping-address form (`ShippingAddressSchema`) in `lib/square/types.ts`
- [x] T006 Create `lib/checkout/shipping-cost.ts` — pure `calculateShippingCost(subtotalCents)` tiered function with a configurable tier table
- [x] T007 [P] Add MSW handlers for the checkout-related Square calls in `tests/setup/` (if used by integration tests)

**Checkpoint**: Foundation ready — types and the shipping-cost calculator exist; user story implementation can begin.

---

## Phase 3: User Story 1 - Choose Shipping or Pickup at Checkout (Priority: P1) 🎯 MVP

**Goal**: An inline fulfillment section on the checkout page (above the payment form) lets the customer choose shipping or pickup, and shows the shipping cost when shipping is selected.

**Independent Test**: Start a checkout, select "Shipping" (address form appears, shipping cost shown), then switch to "Pickup" (address form hidden).

### Tests for User Story 1 (MANDATORY — Testing Trophy)

> Write these tests FIRST, ensure they FAIL, then implement.

- [x] T008 [P] [US1] Unit test for `calculateShippingCost` (tier boundaries, free tier, zero for pickup) in `lib/checkout/__tests__/shipping-cost.test.ts`
- [x] T009 [P] [US1] Integration test for the `FulfillmentSection` (choose shipping/pickup, show/hide address form, show shipping cost) in `components/checkout/__tests__/fulfillment-section.test.tsx`

### Implementation for User Story 1

- [x] T010 [P] [US1] Create `components/checkout/fulfillment-section.tsx` (`"use client"`) — shipping/pickup toggle (FR-001, FR-011)
- [x] T011 [US1] Wire the fulfillment section into `components/checkout/checkout-page-client.tsx` above the `PaymentForm` and pass fulfillment state (FR-011)
- [x] T012 [US1] Compute and display the shipping cost via `calculateShippingCost` when shipping is selected (FR-010)
- [x] T013 [US1] Allow switching between shipping and pickup, clearing the address/cost when switching (FR-004)

**Checkpoint**: User Story 1 fully functional and testable independently.

---

## Phase 4: User Story 2 - Capture the Shipping Address (Priority: P1)

**Goal**: When shipping is chosen, collect and validate the shipping address (with a "same as billing" option), and persist fulfillment + cost on the order.

**Independent Test**: Select shipping, enter an address (or use "same as billing"), and verify validation and that the address + cost are stored with the order.

### Tests for User Story 2 (MANDATORY — Testing Trophy)

- [x] T014 [P] [US2] Unit test for the `ShippingAddressSchema` (required fields, state/ZIP format) in `lib/square/__tests__/types.test.ts`
- [x] T015 [P] [US2] Integration test for the `ShippingAddressForm` (entry, same-as-billing, validation) in `components/checkout/__tests__/shipping-address-form.test.tsx`

### Implementation for User Story 2

- [x] T016 [P] [US2] Create `components/checkout/shipping-address-form.tsx` (`"use client"`) — address fields + "same as billing" (FR-002)
- [x] T017 [US2] Validate the shipping address (Zod) before submit (FR-005)
- [x] T018 [US2] Persist the fulfillment method, shipping address, and shipping cost on the Square order in the checkout server action (`app/cart/actions.ts`) (FR-006)

**Checkpoint**: User Stories 1 AND 2 both work independently (fulfillment selection + address capture).

---

## Phase 5: User Story 3 - Confirmation and Email Reflect the Fulfillment Method (Priority: P2)

**Goal**: The order confirmation page and order-confirmation email show the fulfillment method, the shipping address (shipping), or store location + hours + "ready for pickup" note (pickup).

**Independent Test**: Complete a shipping order and a pickup order; verify the confirmation page and email show the correct fulfillment details.

### Tests for User Story 3 (MANDATORY — Testing Trophy)

- [x] T019 [P] [US3] Integration test verifying the confirmation page renders shipping address (shipping) vs. pickup details in `app/order/confirmation/__tests__/page.test.tsx`
- [ ] T020 [P] [US3] Integration test verifying the email builder includes the fulfillment method/address in `lib/email/__tests__/order-email.test.ts` (depends on feature 037)

### Implementation for User Story 3

- [x] T021 [US3] Update `app/order/confirmation/page.tsx` to render the fulfillment method + shipping address or pickup details (FR-007)
- [ ] T022 [US3] Extend the order-confirmation email builder to include the fulfillment method + shipping address or pickup details (FR-008) (depends on feature 037)

**Checkpoint**: All user stories independently functional.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements across the feature and overall quality.

- [x] T023 [P] Run `quickstart.md` validation scenarios (choice appears, shipping address + cost, pickup no address, switching, validation, confirmation/email)
- [x] T024 Confirm the fulfillment selection works for both guest and signed-in checkout (FR-009)
- [x] T025 Run full quality gates: `tsc --noEmit`, `npm run lint`, `npm test` — zero failures

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (types + shipping-cost calculator are prerequisites).
- **User Stories (Phase 3+)**: All depend on Foundational completion.
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational. No dependency on US2/US3.
- **User Story 2 (P2)**: Can start after Foundational. Uses the fulfillment section's state; independently testable.
- **User Story 3 (P3)**: Can start after Foundational. Builds on US1/US2 data; depends on feature 037 for the email.

### Within Each User Story

- Tests MUST be written and FAIL before implementation.
- Types/helpers before components; components before persistence.
- Story complete before moving to the next priority.

### Parallel Opportunities

- All Foundational tasks marked [P] can run in parallel.
- US1 test tasks (T008, T009) can run in parallel.
- US2 and US3 can start in parallel after Foundational.

---

## Parallel Example: User Story 1

```bash
# Launch the unit + integration tests for User Story 1 together:
Task: "Unit test for calculateShippingCost in lib/checkout/__tests__/shipping-cost.test.ts"
Task: "Integration test for FulfillmentSection in components/checkout/__tests__/fulfillment-section.test.tsx"

# Launch the independent implementation files together:
Task: "Create components/checkout/fulfillment-section.tsx (shipping/pickup toggle)"
Task: "Wire fulfillment section into components/checkout/checkout-page-client.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (shipping/pickup selection + shipping cost)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP)
3. Add User Story 2 → Test independently (address capture)
4. Add User Story 3 → Test independently (confirmation + email)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (fulfillment selection)
   - Developer B: User Story 2 (shipping address)
   - Developer C: User Story 3 (confirmation + email)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- US3 email extension depends on feature 037 (Resend order emails) being merged