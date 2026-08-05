# Quickstart: Custom Checkout Page Flow

**Feature**: 028-custom-checkout
**Phase**: 1 — Design & Contracts

## Prerequisites

1. **Dev server running** (port 3000):
   ```bash
   lsof -ti:3000  # check
   vercel dev      # start if not running
   ```

2. **Square Sandbox configured** with:
   - A Square application ID (for Web Payments SDK)
   - Test card numbers: `4111111111111111` (Visa), any future expiration, any CVC, any postal code

3. **A test Clerk user** with:
   - Linked Square customer
   - Loyalty account with points
   - Items in cart

## Validation Scenarios

### VS-1: Navigate to checkout from cart

**Given**: Authenticated user with items in cart

1. On cart page, click "Proceed to Checkout"
2. **Expect**: Redirected to `/checkout`
3. **Expect**: Order summary visible with items, quantities, prices
4. **Expect**: Customer name and email pre-populated
5. **Expect**: Payment form with card input and billing address fields

---

### VS-2: Loyalty reward discount visible on checkout

**Given**: Loyalty reward selected on cart page (e.g., "$10 Off — 1,000 pts")

1. Click "Proceed to Checkout"
2. **Expect**: Reward discount shown as a separate line item ("-$10.00")
3. **Expect**: Final total reflects the discount ($40.00 instead of $50.00)
4. **Expect**: Points remaining shown below order summary

---

### VS-3: Complete payment successfully

**Given**: On checkout page with valid card information

1. Enter test card: `4111111111111111`, any future date, any CVC
2. Fill billing address
3. Click "Pay"
4. **Expect**: Button is disabled during processing
5. **Expect**: Redirected to `/order/confirmation?orderId=...&transactionId=...`
6. **Expect**: Confirmation shows transaction ID, order total, and applied reward

---

### VS-4: Payment declined — retry

**Given**: On checkout page

1. Enter a card that Square declines (e.g., `4000000000000002`)
2. Click "Pay"
3. **Expect**: Decline message shown inline (e.g., "Your card was declined")
4. **Expect**: Form is NOT cleared — can correct and retry
5. **Expect**: Order remains in OPEN state

---

### VS-5: Double-click protection

**Given**: On checkout page with valid card

1. Rapidly click "Pay" twice
2. **Expect**: Button disables immediately on first click
3. **Expect**: Only one payment processed
4. **Expect**: No duplicate charges

---

### VS-6: Reward no longer available

**Given**: On checkout page with a reward that was just deleted

1. **Expect**: Order summary updates to show total without discount
2. **Expect**: Notification: "The selected reward is no longer available"

---

### VS-7: Loading states

**Given**: Slow network or API latency

1. Navigate to `/checkout`
2. **Expect**: Per-section skeleton placeholders render immediately (order summary, customer info, payment form)
3. **Expect**: Each section renders independently as its data arrives
4. **Expect**: No layout shift as content replaces skeletons

---

### VS-8: Mobile checkout

**Given**: On a phone (375px viewport)

1. Navigate to `/checkout`
2. **Expect**: Order summary and payment form stack vertically
3. **Expect**: All touch targets ≥ 44px
4. **Expect**: Card input field is usable on mobile

---

### VS-9: Empty cart redirect

**Given**: Authenticated user with empty cart

1. Navigate directly to `/checkout`
2. **Expect**: Redirected to `/cart` with empty cart message

---

### VS-10: Guest checkout (no loyalty)

**Given**: Guest user with items in cart

1. Click "Proceed to Checkout"
2. **Expect**: Order summary and payment form visible
3. **Expect**: No customer info section
4. **Expect**: No loyalty reward section
5. **Expect**: Can complete payment as guest

---

## Automated Test Commands

```bash
tsc --noEmit
npm run lint
npm test -- --run
npm run test:e2e
```
