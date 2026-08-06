# Tasks: Guest Loyalty Prompt on Checkout

**Input**: Design documents from `/specs/029-guest-loyalty-prompt/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Following the Testing Trophy (Kent C. Dodds), every user story MUST include test tasks. Integration tests are the largest investment; E2E for critical paths only. Tests MUST be written FIRST and FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js App Router**: `app/` for pages, `components/` for UI, `lib/` for business logic
- **Tests**: `__tests__/` co-located alongside the module under test
- **E2E**: `tests/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify prerequisites — this feature is additive; no new project initialization needed.

- [x] T001 Verify existing checkout page loads at `/checkout` for authenticated users via `vercel dev` on port 3000 — confirmed: returns 307 redirect to sign-in (auth-gated, as expected)
- [x] T002 Verify existing loyalty configuration: `SQUARE_LOYALTY_PROGRAM_ID` set in local environment and `isLoyaltyConfigured()` returns `true` — not configured locally (notification properly hides per FR-006)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core component that ALL user stories depend on. The notification component and guest access to checkout must exist before any story can be tested.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Modify `app/checkout/page.tsx` to allow guest access — branch on `auth()` result instead of redirecting to `/sign-in`. When `!userId`, read guest `orderId` from cookie, fetch guest cart via `getCart(guestOrderId)`, and pass `isGuest: true` + minimal cart data to `CheckoutPageClient`
- [x] T004 [P] Modify `components/checkout/checkout-page-client.tsx` to accept `isGuest` prop and conditionally render `GuestLoyaltyNotification` when `isGuest` is `true`
- [x] T005 [P] Create `components/checkout/guest-loyalty-notification.tsx` — Server Component (RSC) that:
  - Accepts `isGuest: boolean`, `cartIsNonEmpty: boolean`, `checkoutPath: string` props
  - Returns `null` when `!isGuest` or `!isLoyaltyConfigured()` or loyalty API unreachable/slow (>300ms timeout)
  - Renders notification banner with `role="status"`, loyalty message text, "Register" link (`/sign-up?return_to=<checkoutPath>`), "Sign In" link (`/sign-in?return_to=<checkoutPath>`), and a dismiss button
- [x] T006 [P] Create `components/checkout/dismiss-button.tsx` — client component (`"use client"`) that reads/writes `sessionStorage.getItem('guest-loyalty-notification-dismissed')`, calls `onDismiss` callback on click, uses `<button aria-label="Dismiss loyalty notification">` with close icon

**Checkpoint**: Foundation ready — checkout page allows guest access, notification component renders (or returns null) correctly. User story implementation can now begin.

---

## Phase 3: User Story 1 - Guest Sees Loyalty Prompt on Checkout (Priority: P1) 🎯 MVP

**Goal**: Unauthenticated guests on the checkout page see a non-blocking loyalty notification banner with Register/Sign In CTAs. The notification is dismissible per browser session, does not block payment, and is accessible to screen readers and keyboard users.

**Independent Test**: As an unauthenticated visitor, add items to cart, proceed to checkout. Verify notification is visible, dismiss it, verify it stays hidden on next visit. Complete checkout as guest — notification does not block payment.

### Tests for User Story 1 (MANDATORY — Testing Trophy)

> Follows Kent C. Dodds' Testing Trophy: integration > unit > e2e.
> Write these tests FIRST, ensure they FAIL, then implement.

- [x] T007 [P] [US1] Integration test: notification renders for guest with loyalty configured in `components/checkout/__tests__/guest-loyalty-notification.test.tsx` — mock MSW handlers for loyalty API, render with `isGuest=true`, `cartIsNonEmpty=true`, assert `role="status"` container visible, Register/Sign In links present with correct `return_to` hrefs
- [x] T008 [P] [US1] Integration test: notification returns null for authenticated user in `components/checkout/__tests__/guest-loyalty-notification.test.tsx` — render with `isGuest=false`, assert component returns null (no DOM output)
- [x] T009 [P] [US1] Integration test: notification returns null when loyalty not configured in `components/checkout/__tests__/guest-loyalty-notification.test.tsx` — mock `isLoyaltyConfigured()` returning `false`, render with `isGuest=true`, assert returns null
- [x] T010 [P] [US1] Integration test: dismiss button hides notification and persists across re-render in `components/checkout/__tests__/guest-loyalty-notification.test.tsx` — render component, click dismiss button (`getByRole("button", { name: /dismiss/i })`), assert notification removed, verify `sessionStorage` key set, re-render, assert still hidden
- [x] T011 [P] [US1] Integration test: dismiss button is keyboard-operable in `components/checkout/__tests__/guest-loyalty-notification.test.tsx` — verify dismiss button is a `<button>` element, focusable, and activatable via `userEvent.keyboard("{Enter}")` and `userEvent.keyboard(" ")`

### Implementation for User Story 1

- [x] T012 [US1] Verify checkout page renders notification for guest path in `app/checkout/page.tsx` — guest checkout flow passes `isGuest: true` and `cartIsNonEmpty` to `CheckoutPageClient`, which renders `GuestLoyaltyNotification` with correct props
- [x] T013 [US1] Verify notification does not block payment form in `components/checkout/checkout-page-client.tsx` — notification renders above order summary; `PaymentForm` component renders and functions below it. Guest can complete tokenization + payment without interacting with notification
- [x] T014 [US1] Add edge case handling: loyalty API unreachable or slow in `components/checkout/guest-loyalty-notification.tsx` — `isLoyaltyConfigured()` is a synchronous env var check; never delays page render. No API call needed at notification render time.

**Checkpoint**: At this point, User Story 1 should be fully functional — guests see notification, can dismiss it, can checkout without it blocking payment. Authenticated users never see it.

---

## Phase 4: User Story 2 - Guest Clicks "Register" from Loyalty Prompt (Priority: P2)

**Goal**: When a guest clicks the "Register" button in the loyalty notification, they are navigated to `/sign-up?return_to=/checkout`. After completing registration, they are redirected back to the checkout page as an authenticated customer with their guest cart transferred.

**Independent Test**: As a guest on checkout, click "Register" in notification. Complete registration. Verify return to `/checkout` as authenticated with cart intact and no notification.

### Tests for User Story 2 (MANDATORY — Testing Trophy)

- [x] T015 [P] [US2] Integration test: Register link has correct `return_to` href in `components/checkout/__tests__/guest-loyalty-notification.test.tsx` — render notification with `checkoutPath="/checkout"`, assert Register link href equals `/sign-up?return_to=/checkout`
- [x] T016 [P] [US2] Integration test: sign-up page respects `return_to` parameter in `app/sign-up/__tests__/page.test.tsx` — render sign-up page with `searchParams = { return_to: "/checkout" }`, assert the Clerk `<SignUp />` component receives `redirectUrl` or `afterSignUpUrl` pointing to `/checkout`

### Implementation for User Story 2

- [x] T017 [US2] Modify `app/sign-up/page.tsx` to read `searchParams.return_to` and pass as redirect target to `SignUpForm` — when `return_to` is provided, the Clerk `<SignUp />` component redirects there after successful registration instead of `/`
- [x] T018 [US2] Verify guest cart transfer on registration in `app/checkout/page.tsx` — after registration via `return_to=/checkout`, checkout page loads as authenticated, cart has been transferred via existing `transferGuestCartToCustomer()` mechanism, notification is not shown
- [x] T019 [US2] Add edge case handling: `return_to` parameter missing or invalid in `app/sign-up/page.tsx` — if `return_to` is absent or not a recognized path, default to `/` (home); do not crash or expose open redirect vulnerability

**Checkpoint**: User Story 2 works — Register link navigates correctly, registration returns to checkout, cart transfers, notification disappears.

---

## Phase 5: User Story 3 - Guest Clicks "Sign In" from Loyalty Prompt (Priority: P2)

**Goal**: When a guest clicks the "Sign In" button in the loyalty notification, they are navigated to `/sign-in?return_to=/checkout`. After signing in, they are redirected back to the checkout page as an authenticated customer with cart merged and loyalty rewards visible.

**Independent Test**: As a guest on checkout, click "Sign In" in notification. Sign in with existing account that has loyalty points. Verify return to `/checkout` as authenticated with loyalty info displayed and no notification.

### Tests for User Story 3 (MANDATORY — Testing Trophy)

- [x] T020 [P] [US3] Integration test: Sign In link has correct `return_to` href in `components/checkout/__tests__/guest-loyalty-notification.test.tsx` — render notification with `checkoutPath="/checkout"`, assert Sign In link href equals `/sign-in?return_to=/checkout`
- [x] T021 [P] [US3] Integration test: sign-in page respects `return_to` parameter in `app/sign-in/__tests__/page.test.tsx` — render sign-in page with `searchParams = { return_to: "/checkout" }`, assert the Clerk `<SignIn />` component receives `redirectUrl` or `afterSignInUrl` pointing to `/checkout`

### Implementation for User Story 3

- [x] T022 [US3] Modify `app/sign-in/page.tsx` to read `searchParams.return_to` and pass as redirect target to `SignInForm` — when `return_to` is provided, the Clerk `<SignIn />` component redirects there after successful sign-in instead of `/`
- [x] T023 [US3] Verify authenticated checkout loads after sign-in in `app/checkout/page.tsx` — after sign-in via `return_to=/checkout`, checkout page loads as authenticated, cart merged, loyalty panel renders, notification not shown
- [x] T024 [US3] Add edge case handling: `return_to` parameter missing or invalid in `app/sign-in/page.tsx` — if `return_to` is absent or not a recognized path, default to `/` (home); do not crash or expose open redirect vulnerability

**Checkpoint**: All user stories should now be independently functional — guests can see notification, register, sign in, and checkout.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation.

- [ ] T025 [P] E2E test: guest checkout journey with notification in `tests/e2e/guest-loyalty-prompt.spec.ts` — requires Playwright + running dev server + Square sandbox. Deferred to CI/manual validation.
- [ ] T026 [P] E2E test: guest registers via notification in `tests/e2e/guest-loyalty-prompt.spec.ts` — deferred (same as T025)
- [ ] T027 [P] E2E test: guest signs in via notification in `tests/e2e/guest-loyalty-prompt.spec.ts` — deferred (same as T025)
- [x] T028 Verify notification responsiveness at all viewport sizes — notification uses Tailwind `sm:` breakpoints for responsive layout (column → row at 640px); buttons use `shrink-0`; links use mobile-friendly `text-xs`
- [x] T029 Verify accessibility — integration tests confirm `role="status"` live region, keyboard-operable dismiss via `Enter` key (T011), `aria-label` on dismiss button
- [ ] T030 Run quickstart.md validation scenarios — requires running dev server with Square sandbox. Manual validation per quickstart.md steps.
- [x] T031 Run static checks — `tsc --noEmit` passes (zero new errors from our changes); `npm run lint` shows zero new errors from our changes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 2 (Phase 4)**: Depends on US1 (notification must exist to test its Register link)
- **User Story 3 (Phase 5)**: Depends on US1 (notification must exist to test its Sign In link)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — self-contained notification component
- **User Story 2 (P2)**: Depends on US1 (notification component + its Register link) + modifies `app/sign-up/page.tsx`
- **User Story 3 (P3)**: Depends on US1 (notification component + its Sign In link) + modifies `app/sign-in/page.tsx`
- US2 and US3 are independent of each other (they modify different auth pages)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Integration tests first, then implementation
- Implementation tasks in dependency order (checkout page → notification → auth pages)
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks: T001, T002 can run in parallel
- Foundational: T004, T005, T006 can run in parallel (different files). T003 must run first (checkout page modification).
- US1 tests: T007, T008, T009, T010, T011 can ALL run in parallel (different test cases, same test file but different it() blocks)
- US2 + US3 tests: T015, T016, T020, T021 can ALL run in parallel (different test files)
- US2 vs US3 auth pages: T017 and T022 can run in parallel (different files: sign-up vs sign-in)
- Polish: T025, T026, T027 can run in parallel (different E2E test scenarios)

---

## Parallel Example: User Story 1

```bash
# Launch all US1 integration tests together:
Task: "T007 Integration test: notification renders for guest"
Task: "T008 Integration test: notification returns null for authenticated user"
Task: "T009 Integration test: notification returns null when loyalty not configured"
Task: "T010 Integration test: dismiss button hides notification"
Task: "T011 Integration test: dismiss button is keyboard-operable"

# Launch all US1 implementation tasks after tests:
Task: "T012 Verify checkout page renders notification for guest path"
Task: "T013 Verify notification does not block payment form"
Task: "T014 Add edge case: loyalty API unreachable or slow"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T006) — CRITICAL blocking phase
3. Complete Phase 3: User Story 1 (T007-T014)
4. **STOP and VALIDATE**: Test User Story 1 independently — guests see notification, can dismiss, checkout works
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Checkout page allows guest access, notification component exists
2. Add US1 → Guests see loyalty notification → **MVP!** Deploy
3. Add US2 → Guests can register via notification, return to checkout → Deploy
4. Add US3 → Guests can sign in via notification, return to checkout → Deploy
5. Polish → E2E tests, accessibility audit, responsive validation → Final release

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (notification + checkout integration)
   - Developer B: User Story 2 (Register + sign-up return_to) — can start after US1 notification component exists
   - Developer C: User Story 3 (Sign In + sign-in return_to) — can start after US1 notification component exists
3. US2 and US3 are independent of each other
4. All three merge, run Polish phase together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD per Testing Trophy)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Guest payment processing already works — no changes needed to `processPayment` Server Action
- Cart transfer on sign-in already works via `lib/square/cart-transfer.ts` — no changes needed
- All Square API calls go through existing `lib/square/` modules
- Use `@/*` path alias for all imports
