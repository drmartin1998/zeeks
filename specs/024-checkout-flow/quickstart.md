# Quickstart: Square Checkout Flow

**Feature**: 024-checkout-flow
**Date**: 2026-08-03

## Prerequisites

- [ ] Dev server running (`vercel dev` on port 3000)
- [ ] Square sandbox credentials configured in environment
- [ ] Clerk authentication configured
- [ ] At least one Square catalog product exists in sandbox
- [ ] 023-shopping-cart feature is implemented and functional

## Validation Scenarios

### Scenario 1: Happy Path — Checkout from Cart

**Steps**:
1. Sign in to the store (Clerk-authenticated user with Square customer ID)
2. Navigate to a product page and add an item to the cart
3. Navigate to `/cart`
4. Verify the "Proceed to Checkout" button is visible and enabled
5. Click "Proceed to Checkout"

**Expected**:
- Button shows loading state while processing
- Browser redirects to a Square-hosted payment page (`https://square.link/...` or `https://checkout.square.site/...`)
- The payment page displays the correct order total matching the cart subtotal

### Scenario 2: Checkout Button Disabled — Unavailable Items

**Steps**:
1. Create a cart situation where a line item is flagged as unavailable
2. Navigate to `/cart`

**Expected**:
- "Proceed to Checkout" button is disabled (grayed out, not clickable)
- A message explains why checkout is unavailable ("Some items are no longer available")

### Scenario 3: Checkout Error Recovery

**Steps**:
1. Add items to cart and proceed to checkout
2. Simulate a Square API error (e.g., network disconnect or invalid configuration)

**Expected**:
- Customer stays on the cart page
- An error message is displayed ("Checkout temporarily unavailable. Please try again.")
- Cart items remain intact and the "Proceed to Checkout" button is still available

### Scenario 4: Return from Square — Payment Completed

**Steps**:
1. Complete checkout from cart (redirected to Square payment page)
2. Complete the test payment on Square sandbox (use test card `4111 1111 1111 1111`)
3. Observe the redirect back to the store

**Expected**:
- Browser navigates to `/order/result?status=COMPLETED&transactionId=...`
- Page displays "Order Confirmed" heading
- Order number and transaction reference are shown
- "Continue Shopping" link navigates away

### Scenario 5: Return from Square — Payment Cancelled

**Steps**:
1. Complete checkout from cart (redirected to Square payment page)
2. Click "Cancel" or close the Square payment page, or manually navigate to `/order/result?status=CANCELLED`

**Expected**:
- Page displays "Payment Not Completed" message
- "Return to Cart" link navigates to `/cart` where items are preserved

### Scenario 6: Direct Access to Checkout with Empty Cart

**Steps**:
1. Sign in with an account that has no cart items
2. Attempt to directly call the checkout action (or navigate to `/cart`)

**Expected**:
- "Proceed to Checkout" button is not shown (cart is empty)
- Empty cart state message is displayed

## Test Commands

```bash
# Static checks
tsc --noEmit          # TypeScript — must pass
npm run lint          # ESLint — 0 errors

# Unit + Integration tests (after implementation)
npm test              # Vitest — all suites pass

# E2E tests (after implementation)
npm run test:e2e      # Playwright — checkout journey passes
```
