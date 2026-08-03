# Requirements Checklist: Shopping Cart

**Purpose**: Validate all functional requirements are covered by Gherkin scenarios and implementation tasks
**Created**: 2026-08-03
**Feature**: [spec.md](../spec.md)

## Functional Requirements Coverage

| FR | Requirement | Gherkin Coverage | Status |
|----|-------------|------------------|--------|
| FR-001 | Create or update Square draft order on "Add to Cart" | @US1 "Add an in-stock product to cart" | [ ] |
| FR-002 | Increment quantity when adding product already in cart | @US1 "Increment quantity when adding same product again" | [ ] |
| FR-003 | Visual confirmation after successful add-to-cart | @US1 "Add an in-stock product to cart" (And confirmation indicator) | [ ] |
| FR-004 | "Out of Stock" instead of "Add to Cart" for unavailable products | @US1 "Out of stock product shows disabled button" | [ ] |
| FR-005 | Require authentication; redirect unauthenticated users to sign in | @US1 "Unauthenticated user is redirected to sign in" | [ ] |
| FR-006 | Display all cart line items on cart page (name, qty, unit price, line total) | @US2 "View cart with multiple line items" | [ ] |
| FR-007 | Display cart subtotal (sum of line totals) | @US2 "View cart with multiple line items" (And subtotal) | [ ] |
| FR-008 | Show skeleton placeholders on cart page while loading | Not yet in Gherkin (spec clarification) | [ ] |
| FR-009 | Flag line items for products that became unavailable | @US2 "Unavailable product in cart is flagged" | [ ] |
| FR-010 | Allow quantity updates (range 1 to available stock) | @US3 "Update line item quantity" | [ ] |
| FR-011 | Allow removal of individual line items | @US3 "Remove an item from the cart" | [ ] |
| FR-012 | Revert to previous cart state and show error on mutation failure | @US3 "Quantity update failure reverts to previous state" | [ ] |
| FR-013 | Navigate to product detail when "Add to Cart" clicked on listing card for variation products | Not yet in Gherkin (spec clarification) | [ ] |

## Edge Case Coverage

- [ ] Adding same product variant twice → quantity incremented, no duplicate (Gherkin: @US1 increment scenario)
- [ ] Invalid quantity values (0, negative, non-numeric) → rejected before API call (Gherkin: @edge "Invalid quantity input is rejected")
- [ ] Product goes out of stock after being added to cart → flagged on next page load (Gherkin: @US2 unavailable product scenario)
- [ ] Customer signs out with items in cart → items reappear on sign-in (Gherkin: @edge "Cart persists across sign-out and sign-in")
- [ ] Square API unreachable during add-to-cart → error message, previous state preserved (Gherkin: @edge "Square API is unreachable")
- [ ] Rapid/duplicate clicks on "Add to Cart" → form submission handles idempotency
- [ ] "Add to Cart" on listing card for variation product → navigates to product detail page (spec clarification)
- [ ] Cart open in two browser tabs → last write wins, no cross-tab sync (spec clarification)

## Middleware & Auth

- [ ] `/cart` route added to middleware matcher for authentication protection
- [ ] All Server Actions have auth guard (`auth()` → `getSquareCustomerId()`)
- [ ] Unauthenticated users redirected to `/sign-in` with return URL to product page

## Data Integrity

- [ ] One draft order per customer (search existing before creating new)
- [ ] Line item matching by `catalogObjectId` + `variationId` (not just product ID)
- [ ] Idempotency keys on mutating Square API calls (createOrder, updateOrder)
- [ ] Cart subtotal recalculated after every mutation (Square handles this natively)

## Success Criteria Verification

- [ ] SC-001: Add-to-cart confirmation within 2 seconds (manual or E2E timing check)
- [ ] SC-002: Same product added twice → quantity increments, no duplicate line item
- [ ] SC-003: Cart page displays all items with correct subtotal on first load
- [ ] SC-004: 100% of quantity updates and removals accurately reflected in Square and UI

## Notes

- FR-004 (Out of Stock display) exists already in the current UI but checks `isOutOfStock` from product data — verify it continues to work correctly alongside the new Server Action form.
- FR-008 (unavailable product flagging) requires checking product availability at cart page load time, not just at add-to-cart time — needs a separate catalog check in `getCart()`.
- Idempotency keys should be generated server-side (e.g., UUID) to prevent duplicate orders from rapid clicks.
