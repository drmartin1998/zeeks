# Tasks: Shopping Cart

**Input**: Design documents from `/specs/023-shopping-cart/`
**Scope**: Full shopping cart via Square draft orders — add to cart, view cart, manage quantities/remove.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Types & Data Layer

- [x] T001 [P] [US1] Add `Cart`, `CartLineItem`, `AddToCartInput` types to `lib/square/types.ts`
- [x] T002 [US1] Create `lib/square/cart.ts` with `findOrCreateDraftOrder` and `buildCart` functions (search existing draft order, create new one, transform line items)

## Phase 2: US1 — Add to Cart (Priority: P1) 🎯 MVP

**Goal**: Customer clicks "Add to Cart" on a product page and a Square draft order is created or updated with the item.

**Independent Test**: Visit a product page, click "Add to Cart", verify a draft order exists in Square with the correct line item.

### Tests for User Story 1

- [ ] T003 [P] [US1] Unit tests for cart data transforms (`findOrCreateDraftOrder`, `buildCart`) in `lib/square/__tests__/cart.test.ts`
- [ ] T004 [P] [US1] Integration test for `addToCart` Server Action in `app/cart/__tests__/actions.test.ts`

### Implementation for User Story 1

- [x] T005 [US1] Create Server Actions (`addToCart`, `getCart`) in `app/cart/actions.ts` — auth guard, Square API calls, typed results
- [x] T006 [P] [US1] Create `AddToCartForm` client component in `components/cart/add-to-cart-form.tsx` — wraps form with hidden inputs (catalogObjectId, variationId, quantity), loading state, confirmation
- [x] T007 [P] [US1] Wire `AddToCartForm` into `components/product-detail/product-info.tsx` — replace static button, pass catalogObjectId + selected variation
- [x] T008 [P] [US1] Wire `AddToCartForm` into `components/game-card.tsx` — add directly for non-variation products; navigate to product detail for variation products (pass `productSlug` for detection)
- [x] T009 [US1] Add `/cart` to middleware matcher in `middleware.ts` for authentication protection

**Checkpoint**: User can add items to cart from product detail and game cards. Draft order created in Square.

---

## Phase 3: US2 — View Cart with Line Items and Totals (Priority: P1)

**Goal**: Customer visits `/cart` and sees all items with names, quantities, prices, and subtotal.

**Independent Test**: Add two products, navigate to `/cart`, verify both display correctly with accurate subtotal.

### Tests for User Story 2

- [ ] T010 [P] [US2] Integration test for cart page Server Component in `app/cart/__tests__/page.test.tsx`
- [ ] T011 [P] [US2] Integration test for CartClient render in `components/cart/__tests__/cart-client.test.tsx`

### Implementation for User Story 2

- [x] T012 [US2] Create cart page Server Component at `app/cart/page.tsx` — auth guard, calls `getCart()`, passes data to CartClient
- [x] T013 [P] [US2] Create `CartClient` client component in `components/cart/cart-client.tsx` — renders line items, skeleton placeholders while loading, empty state. Match Figma `cart-standard` design (80px horizontal padding, 64px top padding, two-column layout: 800px cart items + 416px order summary, 64px gap between columns)
- [x] T014 [P] [US2] Create `CartLineItem` component in `components/cart/cart-line-item.tsx` — product image, name, unit price, line total, unavailable flag, quantity picker, remove button. Match Figma spec: 800px × 132px, horizontal layout, 16px padding, 24px internal gap, 1px border #CDCDD8, 12px border radius
- [x] T015 [US2] Create `CartSummary` component in `components/cart/cart-summary.tsx` — subtotal display, total, "Taxes and shipping calculated at checkout" note, "Proceed to Checkout" button. Match Figma spec: 416px wide, 32px padding, 24px gap, bg #F5F5F8, 1px border #CDCDD8, 16px border radius, Outfit Black 22px heading, Rubik Regular 12px for note
- [x] T016 [P] [US2] Create cart page layout at `app/cart/layout.tsx` — wraps page with NavBar + Footer (reuse existing components); page background white (#FFFFFF)

**Checkpoint**: Cart page fully functional — items displayed with correct data, skeleton loading, empty state.

---

## Phase 4: US3 — Update Quantity and Remove Items (Priority: P2)

**Goal**: Customer adjusts line item quantities or removes items from the cart page.

**Independent Test**: View cart, change a quantity, verify subtotal updates. Remove an item, verify it disappears.

### Tests for User Story 3

- [ ] T017 [P] [US3] Integration test for quantity update and remove interactions in `components/cart/__tests__/cart-client.test.tsx`

### Implementation for User Story 3

- [x] T018 [US3] Add `updateCartItem` Server Action in `app/cart/actions.ts` — updates line item quantity, validates range, handles errors with rollback
- [x] T019 [US3] Add `removeCartItem` Server Action in `app/cart/actions.ts` — removes line item by UID, handles errors with rollback
- [x] T020 [US3] Wire quantity controls and remove buttons in `CartClient` and `CartLineItem` — form actions, optimistic UI or revalidation

**Checkpoint**: Full cart management — add, view, update quantity, remove all functional.

---

## Phase 5: Verification

- [x] T021 Quality gates: `tsc --noEmit`, `npm run lint`, `npm test`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Types & Data Layer)**: No dependencies — start immediately
- **Phase 2 (US1)**: Depends on Phase 1 — blocks US2 and US3
- **Phase 3 (US2)**: Depends on Phase 2 (needs `getCart` from T005)
- **Phase 4 (US3)**: Depends on Phase 3 (needs cart page components)
- **Phase 5 (Verification)**: Depends on all phases complete

### Task Dependencies Within Phases

```
Phase 1:  T001 ──→ T002
Phase 2:  T002 ──→ T005
          T005 ──→ T007, T008, T009
          T006 (parallel with T005)
          T003, T004 (parallel, tests)
Phase 3:  T005 ──→ T012
          T012 ──→ T013, T014, T015, T016 (parallel siblings)
          T010, T011 (parallel, tests)
Phase 4:  T012 ──→ T018 ──→ T020
          T012 ──→ T019 ──→ T020
          T017 (parallel, test)
```

### Parallel Opportunities

- T001 + T003 (types + unit tests — different files)
- T006 + T005 (form component + actions — different files)
- T007 + T008 + T009 (different component files, no shared state)
- T013 + T014 + T015 + T016 (all new cart components, independent files)
- T010 + T011 (different test files)
- T018 + T019 (different functions in same file, but can be developed sequentially)

---

## Notes

- **Design source**: Figma file `DxuZEmTmV7Hzqa1iBrcVZO`, "Designs" page, `cart-standard` frame (node `152:2125`). All cart UI components (T013, T014, T015) must match the Figma design specs documented in `plan.md`.
- FR-004 (Out of Stock display) exists already in product-info.tsx — verify it continues to work correctly alongside `AddToCartForm`.
- FR-008 (skeleton placeholders) is implemented within CartClient (T013).
- FR-009 (unavailable product flagging) requires a product availability check in `getCart()` at page load — built into T005/T012.
- FR-013 (variation products navigate to detail) implemented in T008 (GameCard).
- Idempotency keys should be generated server-side (UUID) in `findOrCreateDraftOrder` and `addToCart` to prevent duplicate orders from rapid clicks.
