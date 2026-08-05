# Tasks: Rewards Redemption

**Input**: Design documents from `specs/027-rewards-redemption/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Following the Testing Trophy (Kent C. Dodds), every user story MUST include test tasks. Integration tests are the largest investment; E2E for critical paths only. Tests MUST be written FIRST and FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: Next.js App Router at repository root
- **Components**: `components/cart/loyalty-panel/`
- **Lib**: `lib/square/`
- **Server Actions**: `app/cart/actions.ts`
- **Tests**: `__tests__/` co-located alongside source modules
- **E2E**: `tests/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type definitions and Square loyalty API layer — shared by all user stories

- [x] T001 Add loyalty type definitions (LoyaltyAccount, RewardTier, LoyaltyReward, LoyaltyProgramDetail, EarnedPoints, LoyaltyPanelData) to `lib/square/types.ts`
- [x] T002 [P] Add Zod schemas for SelectRewardSchema and DeselectRewardSchema to `lib/square/types.ts`
- [x] T003 [P] Add SelectRewardResult and DeselectRewardResult type exports to `lib/square/types.ts`

**Checkpoint**: Types and schemas ready — all stories can reference shared type system

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Square loyalty API service layer — all data fetching and mutation functions that user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Implement `fetchLoyaltyAccount(squareCustomerId)` calling `searchLoyaltyAccounts` in `lib/square/loyalty.ts`
- [x] T005 [P] Implement `fetchLoyaltyProgram()` calling `retrieveLoyaltyProgram("main")` in `lib/square/loyalty.ts`
- [x] T006 [P] Implement `fetchActiveReward(orderId, accountId)` calling `searchLoyaltyRewards` filtering by ISSUED status in `lib/square/loyalty.ts`
- [x] T007 [P] Implement `fetchEarnedPoints(orderId, accountId)` calling `calculateLoyaltyPoints` in `lib/square/loyalty.ts`
- [x] T008 Implement aggregate `getLoyaltyPanelData(squareCustomerId, orderId)` using `Promise.allSettled()` for all four fetches with graceful degradation in `lib/square/loyalty.ts`
- [x] T009 [P] Implement `createLoyaltyReward(orderId, accountId, tierId)` wrapping `loyaltyApi.rewards.create` with idempotency key in `lib/square/loyalty.ts`
- [x] T010 [P] Implement `deleteLoyaltyReward(rewardId)` wrapping `loyaltyApi.rewards.delete` in `lib/square/loyalty.ts`

**Checkpoint**: All Square loyalty API functions implemented — user story implementation can now begin

---

## Phase 3: User Story 1 - View Rewards Points and Available Rewards (Priority: P1) 🎯 MVP

**Goal**: Cart page renders a loyalty panel below cart items showing: points balance, membership tier, all reward tiers with names/descriptions/point costs, and earned-points notice in order summary

**Independent Test**: Log in with a test customer that has a Square loyalty account. Add items to cart. Verify the loyalty panel appears with correct point balance and all reward tiers listed.

### Tests for User Story 1 (MANDATORY — Testing Trophy)

> Follows Kent C. Dodds' Testing Trophy: integration > unit > e2e.
> Write these tests FIRST, ensure they FAIL, then implement.

- [ ] T011 [P] [US1] Unit test for `getLoyaltyPanelData` aggregate function (mock individual fetch functions) in `lib/square/__tests__/loyalty.test.ts`
- [ ] T012 [P] [US1] Unit test for Zod schemas (SelectRewardSchema, DeselectRewardSchema validation) in `lib/square/__tests__/types.test.ts`
- [ ] T013 [US1] Integration test for LoyaltyPanel server component rendering reward tiers with MSW (mock Square loyalty API responses) in `components/cart/loyalty-panel/__tests__/loyalty-panel.test.tsx`
- [ ] T014 [US1] Integration test for cart page rendering loyalty panel when authenticated customer has loyalty account in `components/cart/__tests__/cart-loyalty.test.tsx`

### Implementation for User Story 1

- [x] T015 [P] [US1] Create `LoyaltyPanelSkeleton` component (gray placeholder with animate-pulse, matching panel dimensions) in `components/cart/loyalty-panel/loyalty-panel-skeleton.tsx`
- [x] T016 [P] [US1] Create `LoyaltyPanel` server component — calls `getLoyaltyPanelData()`, wraps in `<Suspense>` with skeleton fallback in `components/cart/loyalty-panel/loyalty-panel.tsx`
- [x] T017 [P] [US1] Create `RewardOption` client component — renders single reward tier row with name, description, point cost, and radio circle (selected/unselected/unaffordable visual states per Figma) in `components/cart/loyalty-panel/reward-option.tsx`
- [x] T018 [US1] Create `LoyaltyPanelClient` client component — composes: header (brand logo, tier label, large points metric), divider, "Apply Your Rewards" heading, RewardOption[] vertical list, footer (remaining points) using Figma design tokens (cream bg `#FDF8F0`, gold accent `#F5A623`, 16px border-radius, 28px padding) in `components/cart/loyalty-panel/loyalty-panel-client.tsx`
- [x] T019 [US1] Add `<Suspense>` boundary around loyalty panel in `components/cart/cart-client.tsx` (render `<LoyaltyPanel>` only when customer is authenticated)
- [x] T020 [US1] Add earned-points notice ("You'll earn X points on this order") to order summary sidebar below checkout button in `components/cart/cart-summary.tsx`
- [x] T021 [US1] Handle US1 edge cases: no loyalty account → panel not rendered, zero reward tiers → panel not rendered, loyalty API error → inline error with "Try again" button, multiple loyalty accounts → use first active

**Checkpoint**: Loyalty panel renders on cart page with points balance and all reward tiers displayed. No interactivity yet — that's US2.

---

## Phase 4: User Story 2 - Select a Reward to Apply to the Order (Priority: P1)

**Goal**: Customer can click a reward option to select it (gold border, filled radio circle, "Selected" badge), click again to deselect, or click a different option to switch. Selection calls Square `createLoyaltyReward` with `order_id`. Deselection calls `deleteLoyaltyReward`. Points remaining footer updates after each mutation.

**Independent Test**: Log in with test customer (4,280 points). Click a reward option. Verify gold border + badge appears, remaining points update, and a Square loyalty reward is created.

### Tests for User Story 2 (MANDATORY — Testing Trophy)

- [ ] T022 [P] [US2] Unit test for `createLoyaltyReward` function (mock loyaltyApi.rewards.create) in `lib/square/__tests__/loyalty.test.ts`
- [ ] T023 [P] [US2] Unit test for `deleteLoyaltyReward` function (mock loyaltyApi.rewards.delete) in `lib/square/__tests__/loyalty.test.ts`
- [ ] T024 [US2] Integration test for reward selection flow (click → API call → visual update) with MSW in `components/cart/loyalty-panel/__tests__/loyalty-panel.test.tsx`
- [ ] T025 [US2] Integration test for reward deselection flow (click selected → API call → reset visual state) in `components/cart/loyalty-panel/__tests__/loyalty-panel.test.tsx`
- [ ] T026 [US2] Integration test for switching reward selection (select A → select B → A deselects, B selects) in `components/cart/loyalty-panel/__tests__/loyalty-panel.test.tsx`
- [ ] T027 [US2] Integration test for error handling (Square API error → inline error message, selection reverts) in `components/cart/loyalty-panel/__tests__/loyalty-panel.test.tsx`

### Implementation for User Story 2

- [x] T028 [US2] Implement `selectReward` Server Action — validates input with Zod, calls `createLoyaltyReward`, returns `SelectRewardResult`, calls `revalidatePath("/cart")` in `app/cart/actions.ts`
- [x] T029 [US2] Implement `deselectReward` Server Action — validates input with Zod, calls `deleteLoyaltyReward`, returns `DeselectRewardResult`, calls `revalidatePath("/cart")` in `app/cart/actions.ts`
- [x] T030 [US2] Add radio-button click handler to `RewardOption` — `onSelect` fires Server Action, `aria-checked` toggles, `data-state` reflects selected/unselected in `components/cart/loyalty-panel/reward-option.tsx`
- [x] T031 [US2] Add `radiogroup` ARIA pattern to `LoyaltyPanelClient` — `role="radiogroup"`, `aria-label="Apply Your Rewards"`, keyboard navigation (Tab, Arrow Up/Down, Space/Enter) in `components/cart/loyalty-panel/loyalty-panel-client.tsx`
- [x] T032 [US2] Add click throttling — disable reward option clicks during in-flight API calls (`isMutating` state guard, `pointer-events-none` on disabled state) in `components/cart/loyalty-panel/loyalty-panel-client.tsx`
- [x] T033 [US2] Handle pre-selected reward on page load (existing ISSUED reward on order → show as selected with gold border) in `components/cart/loyalty-panel/loyalty-panel-client.tsx`
- [x] T034 [US2] Handle US2 edge cases: points decrease between load and click → Square "insufficient points" error → inline error displayed, rapid multi-click → only last click processed, reward already REDEEMED → cannot deselect

**Checkpoint**: Full reward selection/deselection flow works. Customer can select, switch, and deselect rewards on the cart page.

---

## Phase 5: User Story 3 - Responsive Loyalty Panel on Cart (Priority: P2)

**Goal**: Loyalty panel adapts to lg (1280px), md (768px), and sm (375px) viewport widths. Reward options remain tappable at all sizes. Panel transitions smoothly between breakpoints.

**Independent Test**: View cart at 1280px, 768px, and 375px widths. Verify panel layout adapts, text is readable, and touch targets are ≥44px on mobile.

### Tests for User Story 3 (MANDATORY — Testing Trophy)

- [ ] T035 [P] [US3] Integration test for loyalty panel layout at desktop viewport (1280px) — panel in cart column, reward rows full width in `components/cart/loyalty-panel/__tests__/loyalty-panel-responsive.test.tsx`
- [ ] T036 [P] [US3] Integration test for loyalty panel layout at tablet viewport (768px) — panel adapts, text readable in `components/cart/loyalty-panel/__tests__/loyalty-panel-responsive.test.tsx`
- [ ] T037 [P] [US3] Integration test for loyalty panel layout at mobile viewport (375px) — single column, touch targets ≥44px, full-width rows in `components/cart/loyalty-panel/__tests__/loyalty-panel-responsive.test.tsx`

### Implementation for User Story 3

- [x] T038 [P] [US3] Add responsive Tailwind classes to `LoyaltyPanelSkeleton` — adapt skeleton dimensions to viewport in `components/cart/loyalty-panel/loyalty-panel-skeleton.tsx`
- [x] T039 [P] [US3] Add responsive Tailwind classes to `RewardOption` — reward rows fill width, text truncates gracefully on small screens, point cost label realigns in `components/cart/loyalty-panel/reward-option.tsx`
- [x] T040 [US3] Add responsive Tailwind classes to `LoyaltyPanelClient` — panel padding/margins adapt (`px-4 sm:px-7`), header layout stacks on mobile, points balance font-size scales in `components/cart/loyalty-panel/loyalty-panel-client.tsx`
- [x] T041 [US3] Add responsive order summary earned-points notice — adapts spacing and font size at each breakpoint in `components/cart/cart-summary.tsx`

**Checkpoint**: Loyalty panel is fully responsive across lg, md, and sm breakpoints matching the Figma cart-standard layout.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, accessibility validation, and final verification

- [ ] T042 [P] Run `tsc --noEmit` and fix any type errors introduced by new loyalty code
- [ ] T043 [P] Run `npm run lint` and fix any lint warnings (ESLint)
- [ ] T044 [P] Add `loading.tsx` suspense boundary for cart page route segment if not already present in `app/cart/loading.tsx`
- [ ] T045 Security review — verify Square access token never reaches client bundle; all loyalty mutations use idempotency keys
- [ ] T046 [P] Accessibility audit — verify all reward options have proper ARIA roles, keyboard navigation works, focus indicators visible, and color contrast meets WCAG 2.1 AA
- [ ] T047 Run quickstart.md validation — execute all 10 validation scenarios (VS-1 through VS-10) and confirm expected outcomes
- [ ] T048 Performance check — verify cart page with loyalty panel loads within 3s (SC-001) and reward selection completes within 10s (SC-002)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (types and schemas) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 (lib functions) — display-only MVP
- **User Story 2 (Phase 4)**: Depends on Phase 3 (panel component exists to add interactivity to)
- **User Story 3 (Phase 5)**: Depends on Phase 3 (panel component exists to add responsive styles to) — can run parallel with US2
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2. Core display functionality. No dependencies on other stories.
- **User Story 2 (P1)**: Depends on US1 (needs `LoyaltyPanelClient`, `RewardOption` components to exist). Adds interactivity on top of display.
- **User Story 3 (P2)**: Depends on US1 (needs components to exist). Can run in PARALLEL with US2 since it touches the same components but for layout concerns.

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Skeleton components before real components
- Server Actions after lib functions (already in Phase 2)
- Component composition: leaf components before parent components
- Core implementation before edge cases

### Parallel Opportunities

- T001, T002, T003 can run in parallel (all in types.ts)
- T004, T005, T006, T007 can run in parallel (independent Square API functions)
- T009, T010 can run in parallel with T008 (different functions)
- Phase 3 tests (T011, T012, T013, T014) all parallel
- T015, T016 can run in parallel (skeleton + server wrapper)
- T017, T020 can run in parallel (RewardOption + earned-points notice)
- Phase 4 tests (T022-T027) all parallel
- Phase 5 tests (T035-T037) all parallel
- T038, T039 can run in parallel (different files)
- US2 and US3 can run in PARALLEL by different developers
- Phase 6 tasks (T042-T046, T048) all parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for US1 together:
Task: "Unit test for getLoyaltyPanelData in lib/square/__tests__/loyalty.test.ts"
Task: "Unit test for Zod schemas in lib/square/__tests__/types.test.ts"
Task: "Integration test for LoyaltyPanel with MSW in components/cart/loyalty-panel/__tests__/loyalty-panel.test.tsx"
Task: "Integration test for cart page loyalty rendering in components/cart/__tests__/cart-loyalty.test.tsx"

# Launch skeleton + server component together:
Task: "Create LoyaltyPanelSkeleton in components/cart/loyalty-panel/loyalty-panel-skeleton.tsx"
Task: "Create LoyaltyPanel in components/cart/loyalty-panel/loyalty-panel.tsx"

# Launch leaf components together:
Task: "Create RewardOption in components/cart/loyalty-panel/reward-option.tsx"
Task: "Add earned-points notice in components/cart/cart-summary.tsx"
```

---

## Parallel Example: User Story 2 & 3 Concurrent

```bash
# Developer A: User Story 2
Task: "Implement selectReward Server Action in app/cart/actions.ts"
Task: "Implement deselectReward Server Action in app/cart/actions.ts"
Task: "Add radio-button click handler to RewardOption"

# Developer B: User Story 3 (can run simultaneously)
Task: "Add responsive Tailwind classes to LoyaltyPanelSkeleton"
Task: "Add responsive Tailwind classes to RewardOption"
Task: "Add responsive Tailwind classes to LoyaltyPanelClient"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003) — add types and schemas
2. Complete Phase 2: Foundational (T004-T010) — Square loyalty API functions
3. Complete Phase 3: User Story 1 (T011-T021) — loyalty panel display
4. **STOP and VALIDATE**: Cart page shows loyalty panel with points and reward tiers
5. Deploy/demo if ready

### Full Feature Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Loyalty panel visible on cart (MVP!)
3. Add User Story 2 → Reward selection/deselection works
4. Add User Story 3 → Responsive across all device sizes
5. Polish → Quality gates pass, quickstart validates

### Incremental Value

- After US1: Customers can SEE their points and available rewards (informational)
- After US2: Customers can SELECT rewards to apply discounts (functional)
- After US3: Panel works on all devices (universal)
- Each phase adds value without breaking previous phases

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (Testing Trophy: write tests FIRST)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US2 and US3 modify same component files — coordinate to avoid merge conflicts if running in parallel
- Figma design reference: node `167:2749` "squares-loyalty-panel" in Zeeks file (key: `DxuZEmTmV7Hzqa1iBrcVZO`)
- All Square loyalty mutations MUST use idempotency keys (`crypto.randomUUID()`)
- Server-side data fetching MUST use `withRetry` from `lib/utils.ts` for resilience
