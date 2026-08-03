# Quickstart: Guest Cart & Checkout

**Feature**: 025-guest-checkout

## Prerequisites

- [ ] Square sandbox environment configured with valid `SQUARE_ACCESS_TOKEN`
- [ ] Clerk authentication configured (for auth path regression testing)
- [ ] Dev server running (`vercel dev` on port 3000)
- [ ] Test credit card: Square sandbox test card (4111 1111 1111 1111, any future expiry, any CVV)

## Validation Scenarios

### Scenario 1: Guest Adds to Cart and Checks Out

1. Open the store in an incognito/private browser window (or clear all cookies)
2. Navigate to a product page — verify no sign-in prompt appears
3. Click "Add to Cart" — verify cart count badge updates
4. Navigate to `/cart` — verify you are NOT redirected to `/sign-in`
5. Verify cart shows the added item with correct name, quantity, and price
6. Click "Proceed to Checkout"
7. Verify you are redirected to a Square-hosted payment page (URL contains `square.site`)
8. Verify the payment page shows the correct order total
9. Complete payment using Square sandbox test card
10. Verify you return to `/order/result?status=COMPLETED&transactionId=...`
11. Verify the confirmation page shows the transaction ID (order reference)
12. After returning from Square, verify the `guest-cart-order-id` cookie is cleared (open new tab → `/cart` → should show empty cart)

### Scenario 2: Guest Cart Persists Across Navigation

1. As a guest, add two different products to the cart
2. Navigate to the home page, then another product page
3. Return to `/cart` — verify both items are still present
4. Refresh the page (F5 or Cmd+R) — verify cart remains intact
5. Close the tab, open a new tab, navigate to `/cart` — verify cart persists

### Scenario 3: Guest Signs In and Cart Transfers

1. As a guest, add an item to the cart
2. Note the item name and quantity
3. Click "Sign In" and authenticate via Clerk
4. Navigate to `/cart` — verify the same item is present with the same quantity
5. Verify the `guest-cart-order-id` cookie is no longer present (check browser dev tools → Application → Cookies)
6. Verify the cart now shows as the authenticated user's cart (Square draft order with `customerId`)

### Scenario 4: Guest Signs In with Existing Authenticated Cart (Merge)

1. Sign in as an authenticated user, add a product to the cart
2. Sign out
3. As a guest (clear cookies if needed), add a DIFFERENT product to the cart
4. Sign in again with the same credentials
5. Navigate to `/cart` — verify BOTH products are present (merged cart)

### Scenario 5: Guest Cart with Unavailable Item

1. As a guest, add an item that is marked as unavailable (test via Square dashboard)
2. Navigate to `/cart` — verify "Proceed to Checkout" is disabled
3. Verify an explanatory message appears about unavailable items

### Scenario 6: Authenticated Flow Regression

1. Sign in via Clerk with a user that has a Square customer ID
2. Add items to cart, verify cart page works as before
3. Click "Proceed to Checkout" — verify redirect to Square payment page
4. Verify the authenticated checkout path is completely unchanged

### Scenario 7: Guest Cart Badge in Header

1. As a guest with no items in cart, verify the header shows either no badge or zero count
2. Add an item to the cart — verify the header cart badge shows "1" (or the item count)
3. Navigate to different pages — verify the badge count persists
4. Remove all items from the cart — verify the badge returns to no-badge/zero state

## Expected Outcomes

| Scenario | Expected Outcome |
|----------|-----------------|
| Guest adds to cart | No sign-in prompt, item appears in cart with correct price |
| Guest cart persistence | Cart survives page refresh and tab reopen within same session |
| Guest checkout | Redirect to Square payment page, payment link total matches cart |
| Guest sign-in | Cart items transfer to authenticated cart, guest cookie cleared |
| Guest + auth merge | Guest items merge with existing auth cart items |
| Unavailable item | Checkout button disabled with explanatory message |
| Auth regression | All existing authenticated cart/checkout behavior unchanged |
| Guest cart badge | Header cart icon shows accurate item count for guest carts across all pages |
