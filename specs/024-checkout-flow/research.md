# Research: Square Checkout Flow

**Feature**: 024-checkout-flow
**Date**: 2026-08-03

## Research Tasks

### 1. Square Payment Links API vs Checkout API

**Decision**: Use Square Payment Links API (`checkout.paymentLinks.create()`)

**Rationale**: Square SDK 45.x exposes `checkout.paymentLinks.create()` which creates a Square-hosted checkout page with a unique URL. The customer is redirected to that URL to complete payment. This is the simplest integration path — no PCI compliance burden, no client-side payment form, Square handles all payment processing.

**Alternatives considered**:
- **Square Web Payments SDK**: Requires building a client-side payment form with `SqPaymentForm`. Higher complexity, PCI SAQ-A requirements, must handle card tokenization. Rejected for MVP — Payment Links achieves checkout with zero custom payment UI.
- **Square Terminal/Reader API**: In-person only, not applicable to web store.

**Key API details**:
```typescript
// Square CheckoutClient.paymentLinks.create()
// Request: {
//   idempotencyKey: string,
//   orderId?: string,                          // Link to existing order
//   checkoutOptions?: {
//     redirectUrl?: string,                    // Post-payment return URL
//     askForShippingAddress?: boolean,
//     allowTipping?: boolean,
//     enableCoupon?: boolean,
//     enableLoyalty?: boolean,
//   },
//   prePopulatedData?: {
//     buyerEmail?: string,
//   }
// }
// Response: { paymentLink: { id: string, url: string, orderId: string } }
```

### 2. Order State Transition: DRAFT → Payment Link

**Decision**: The draft order is NOT explicitly converted to a non-DRAFT state before creating the payment link. Square's Payment Links API accepts a DRAFT order and handles the state transition internally when the payment link is created.

**Rationale**: Square's `paymentLinks.create()` with an `orderId` parameter accepts orders in DRAFT state. The order transitions to OPEN when the payment link is created. The payment link's URL is the customer-facing checkout page.

**Alternatives considered**:
- **Manually update order state before payment link**: Redundant — Square handles this. Would be an extra API call with no benefit.
- **Create a new order instead of converting the draft**: Would lose the cart line items. The draft order IS the cart.

### 3. Return URL Handling

**Decision**: Use two return URLs controlled by a single page that reads Square's return query parameters.

**Rationale**: Square's payment link `redirectUrl` receives query parameters on return:
- `?transactionId=...&status=COMPLETED` on success
- `?status=CANCELLED` on cancellation

A single return page (`/order/result`) can read the `status` param and display either the confirmation or cancellation view. This avoids needing two separate redirect URLs.

**Alternatives considered**:
- **Two separate pages**: `/order/confirmation` and `/order/cancelled` — simpler to reason about but requires Square to support multiple redirect URLs (it only supports one).
- **Server Action vs Route Handler**: Server Action (`initiateCheckout`) handles the checkout initiation (POST). The return from Square is a GET to `/order/result` which reads query params.

**Implementation approach**: Single return page `/order/result/page.tsx` that reads `searchParams.status` and renders accordingly. The `redirectUrl` passed to Square points to `{baseUrl}/order/result`.

### 4. Authentication Flow for Checkout

**Decision**: Reuse existing authentication pattern from cart actions.

**Rationale**: The cart page (`app/cart/page.tsx`) already authenticates via Clerk's `auth()` and resolves the Square customer ID via `getSquareCustomerId(userId)`. The checkout action follows the same pattern:
```typescript
const { userId } = await auth();
if (!userId) redirect("/sign-in");
const squareCustomerId = await getSquareCustomerId(userId);
if (!squareCustomerId) return { error: "Account setup in progress" };
```

### 5. Cart Validation Before Checkout

**Decision**: The checkout action validates:
1. Cart is non-empty (all scenarios)
2. No line items are unavailable (`isUnavailable === true`)
3. The draft order exists and is accessible

**Rationale**: FR-002 requires disabling checkout when items are unavailable. Server-side validation is a defense-in-depth measure — even if the button is disabled client-side, the server action re-validates.

### 6. Idempotency Key Strategy

**Decision**: Use a UUID v4 idempotency key per checkout attempt.

**Rationale**: Square requires idempotency keys for mutating operations. Using `crypto.randomUUID()` ensures each checkout attempt is unique. If the same cart is checked out twice (e.g., browser back + retry), a new key prevents duplicate payment links.

### 7. Error Recovery

**Decision**: On any Square API failure during checkout, return an error response to the client. The cart page stays rendered, cart state is preserved (the draft order was never modified if payment link creation fails).

**Rationale**: FR-006 requires cart state preservation on failure. Since order state transition happens inside Square's `paymentLinks.create()`, if that call fails, the draft order remains untouched. No rollback needed.

## Resolved Unknowns

All unknowns from Technical Context were resolved through codebase exploration:
- Square SDK version: 45.0.1 (confirmed in package.json)
- Available APIs: ordersApi initialized; checkoutApi and paymentsApi need to be added to exports
- Auth pattern: Clerk auth() + getSquareCustomerId(userId)
- Cart page: RSC at app/cart/page.tsx with CartClient component
- Checkout button: Dead button in components/cart/cart-summary.tsx
