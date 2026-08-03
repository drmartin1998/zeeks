# Contracts: Square Checkout Flow

**Feature**: 024-checkout-flow
**Date**: 2026-08-03

## Server Action: initiateCheckout

### Signature

```typescript
// app/cart/actions.ts
async function initiateCheckout(
  _prevState: CheckoutResult,
  formData: FormData
): Promise<CheckoutResult>
```

### Contract

- **Input**: FormData containing `orderId` (string) and `squareCustomerId` (string, from auth, not user-supplied)
- **Side effects**: Calls `checkoutApi.paymentLinks.create()` on Square
- **Returns**: `CheckoutResult` with `success: true` + `paymentLinkUrl` or `success: false` + `error` message
- **Auth**: Requires Clerk-authenticated user with valid Square customer ID

### Invocation

```tsx
// In CartSummary component
<form action={initiateCheckout}>
  <input type="hidden" name="orderId" value={orderId} />
  <input type="hidden" name="squareCustomerId" value={squareCustomerId} />
  <Button type="submit" disabled={hasUnavailable}>Proceed to Checkout</Button>
</form>
```

### Error Cases

| Condition | HTTP Status | Return |
|-----------|-------------|--------|
| Unauthenticated | — (redirects) | Redirect to /sign-in |
| No Square customer ID | — | `{ success: false, error: "Account setup in progress" }` |
| Empty orderId | — | `{ success: false, error: "No order to checkout" }` |
| Order not found (Square 404) | — | `{ success: false, error: "Cart not found" }` |
| Unavailable items in cart | — | `{ success: false, error: "Some items are no longer available" }` |
| Square API error | — | `{ success: false, error: "Checkout temporarily unavailable" }` |
| Payment link creation success | — | `{ success: true, paymentLinkUrl: "https://..." }` |

## Page: Order Result (`/order/result`)

### Route

```
GET /order/result?status={COMPLETED|CANCELLED}&transactionId={string}
```

### Contract

- **Input**: Query parameters from Square redirect
- **Renders**: Confirmation view (COMPLETED) or cancellation view (CANCELLED/other)
- **Auth**: Optional — shows generic confirmation/cancellation even without auth (graceful for lost sessions)
- **No Square API calls**: This page is purely display; order status is read from query params

### Views

| Status | Heading | Content |
|--------|---------|---------|
| COMPLETED | "Order Confirmed" | Order number, item summary, "Continue Shopping" link |
| CANCELLED | "Payment Not Completed" | Message explaining no charge was made, "Return to Cart" link |
| Missing | "Order Status" | Generic message with "View Orders" link |

## Square Client Exports

### Addition to lib/square/client.ts

```typescript
export const checkoutApi = squareClient.checkout;
export const paymentsApi = squareClient.payments;
```

These exports enable the checkout server action and any future payment verification.
