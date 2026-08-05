# Research: Custom Checkout Page Flow

**Feature**: 028-custom-checkout
**Phase**: 0 — Outline & Research
**Date**: 2026-08-04

## 1. Square Web Payments SDK

### Decision: Integrate Square Web Payments SDK for client-side card tokenization

**Rationale**: The Square Web Payments SDK (`@square/web-payments-sdk-types`) handles card number collection and tokenization entirely in the browser. Raw card numbers never reach our server — the SDK returns a one-time payment token (`sourceId`) that we pass to our server to process the payment via `paymentsApi.create`. This keeps PCI compliance scope minimal (SAQ A-EP vs SAQ D).

**Integration pattern**:
```typescript
// Client-side (browser only)
const payments = Square.payments(applicationId, locationId);
const card = await payments.card();
await card.attach("#card-container");
const tokenResult = await card.tokenize(); // returns { status, token }
// Send tokenResult.token to server
```

**Key details**:
- `SQUARE_APPLICATION_ID` is the only Square credential exposed to the browser (it's public by design)
- `SQUARE_LOCATION_ID` is also public-safe
- `SQUARE_ACCESS_TOKEN` stays server-side, used only in the payment Server Action/Route Handler
- The SDK must be loaded via Square's CDN script or npm package

**Alternatives considered**:
- **Square.js (v1)**: Deprecated, replaced by Web Payments SDK.
- **Stripe Elements**: Not applicable — this is a Square shop.
- **Custom card form sending raw numbers to server**: Increases PCI scope to SAQ D (full compliance), unacceptable.

---

## 2. Payment Processing via Square API

### Decision: Use `paymentsApi.create` with `sourceId` from client-side tokenization

**Rationale**: After the client tokenizes the card and returns a `sourceId`, the server calls Square's Payments API to create the payment. This keeps the access token server-side and allows server-side validation of the payment amount.

**API call** (server-side):
```typescript
const response = await paymentsApi.create({
  sourceId: tokenFromClient,
  idempotencyKey: crypto.randomUUID(),
  amountMoney: { amount: BigInt(totalCents), currency: "USD" },
  orderId: orderId,
  locationId: locationId,
  billingAddress: {
    addressLine1: billing.addressLine1,
    locality: billing.city,
    administrativeDistrictLevel1: billing.state,
    postalCode: billing.postalCode,
  },
  customerId: squareCustomerId,
});
```

**Response handling**:
- `response.payment.status === "COMPLETED"` → success, transition order to COMPLETED
- `response.payment.status === "APPROVED"` → success
- `response.payment.status === "FAILED"` → decline, show error to user
- `response.payment.status === "PENDING"` → pending, show pending state

**Error codes from Square** (mapped to user-facing messages):
- `CARD_DECLINED` → "Your card was declined. Please try a different card."
- `CARD_DECLINED_INSUFFICIENT_FUNDS` → "Insufficient funds. Please try a different card."
- `CARD_DECLINED_CALL_ISSUER` → "Your card was declined. Please contact your card issuer."
- `CARD_EXPIRED` → "Your card has expired. Please use a different card."
- `INVALID_CARD_DATA` → "The card information you entered is invalid. Please check and try again."
- `GENERIC_DECLINE` → "Payment could not be processed. Please try again or use a different card."

---

## 3. Order State Lifecycle

### Decision: Transition DRAFT → OPEN → COMPLETED in a single Server Action

**Rationale**: The spec requires the order to transition at payment submission time. The flow:
1. **DRAFT** — order is created and editable (current cart state)
2. **OPEN** — order is finalized, can no longer be modified via standard cart operations, can accept reward attachments
3. **COMPLETED** — payment was successful

**Server Action flow**:
```typescript
async function processPayment(formData: FormData): Promise<PaymentResult> {
  // 1. Get order, verify it exists and is DRAFT
  // 2. Transition order DRAFT → OPEN
  // 3. If reward selected: create loyalty reward with order_id
  // 4. Tokenize and process payment
  // 5. If success: transition order OPEN → COMPLETED (Square handles this automatically on payment)
  // 6. Return result with transaction ID for confirmation page
}
```

**Key insight**: Square automatically transitions the order to COMPLETED when payment is processed against it. We don't need to manually set `state: "COMPLETED"`.

**Alternatives considered**:
- **Transition on checkout page load**: Violates spec clarification (Q4). Would lock the cart prematurely.
- **Separate actions for each transition**: Adds complexity with no benefit.

---

## 4. Replacing Payment Links

### Decision: Remove `createPaymentLink` and `initiateCheckout`, redirect cart button to `/checkout`

**Rationale**: The spec clarifies Q1 — replace entirely. The payment link flow is incompatible with order-attached loyalty rewards and custom checkout UX.

**Changes**:
1. `app/cart/actions.ts`: Remove `initiateCheckout` Server Action and `createPaymentLink` import
2. `app/cart/cart-client.tsx`: Change checkout button from `<form action={initiateCheckout}>` to `<Link href="/checkout">`
3. `lib/square/checkout.ts`: Remove or deprecate `createPaymentLink`
4. Existing `/order/result` page: Replace with `/order/confirmation`

**Backward compatibility**: No migration needed. Payment links were the only checkout flow. Customers with existing payment links in flight would see the links expire/go to the old result page (acceptable — payment links expire after 30 days).

---

## 5. Loyalty Reward Integration at Checkout

### Decision: Create reward with `order_id` after order transitions to OPEN, before payment

**Rationale**: The order must be OPEN for Square to accept reward attachment. By transitioning OPEN first, then creating the reward with `order_id`, the reward discount is applied to the order. The payment amount then includes the discounted total.

**Flow**:
1. Order is DRAFT
2. `processPayment` called → transition order to OPEN
3. Create loyalty reward with `order_id` (discount attaches to order)
4. Calculate final total (after discount)
5. Process payment against the order (Square handles the final amount)

**Pre-existing reward handling**: If a reward was already created (e.g., from a previous checkout attempt):
- Same tier: skip creation, proceed to payment
- Different tier: delete old, create new
- No reward exists: create new

---

## 6. Client-Side Checkout Architecture

### Decision: Server Component wrapper + Client Component for form interactivity

```
app/checkout/page.tsx (Server Component)
├── fetches: cart, loyalty data, customer profile (parallel Promise.allSettled)
├── passes data as props to:
│
└── CheckoutPageClient ("use client")
    ├── OrderSummary (displays items, subtotal, reward discount, total)
    ├── CustomerInfo (pre-populated name, email)
    ├── PaymentForm ("use client" — Square Web Payments SDK)
    │   ├── CardElement (Square SDK iframe/mount point)
    │   └── BillingAddressForm (name, street, city, state, postal code)
    └── Submit button → calls processPayment Server Action
```

**Why `"use client"` for `CheckoutPageClient`**: Square Web Payments SDK requires browser DOM APIs (`document`, `window`) and attaches to a DOM element. This is a justified `"use client"` at the leaf node per Constitution I.

**Suspense boundaries**:
```tsx
<Suspense fallback={<OrderSummarySkeleton />}>
  <OrderSummary ... />
</Suspense>
<Suspense fallback={<CustomerInfoSkeleton />}>
  <CustomerInfo ... />
</Suspense>
<Suspense fallback={<PaymentFormSkeleton />}>
  <PaymentForm ... />
</Suspense>
```

---

## 7. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Card numbers exposed to server | NOT possible — Square Web Payments SDK tokenizes card numbers in the browser; only `sourceId` (one-time use token) is sent to server |
| Payment amount tampering | Server recalculates the order total from the order ID, ignoring any client-submitted amount |
| Double payments | Idempotency key (`payment-{orderId}`) prevents Square from processing the same order twice |
| CSRF | Next.js Server Actions have built-in CSRF protection |
| Access token exposure | `SQUARE_ACCESS_TOKEN` only used server-side in Server Action/Route Handler — never in client bundle |

---

## Summary of Decisions

| Decision | Rationale |
|----------|-----------|
| Square Web Payments SDK for tokenization | Industry standard, PCI SAQ A-EP compatible |
| `paymentsApi.create` with `sourceId` | Server-side access token, server-side amount validation |
| DRAFT→OPEN→COMPLETED in single Server Action | Atomic, per spec Q4 answer |
| Remove payment links entirely | Per spec Q1 answer |
| Loyalty reward created with `order_id` after OPEN transition | Square only accepts rewards on OPEN orders |
| Per-section skeleton loading | Matches existing cart page pattern, Constitution IV |
| Full billing address | Per spec Q3 answer |
