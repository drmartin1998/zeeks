# Contract: Guest Checkout Server Action

**Feature**: 025-guest-checkout
**Type**: Server Action contract

## `initiateCheckout` — Updated

### Input (FormData)

| Field | Type | Required for Auth | Required for Guest | Description |
|-------|------|-------------------|--------------------|-------------|
| orderId | string | Yes | Yes | Square draft order ID |
| squareCustomerId | string | Yes | No | Auth user's Square customer ID (null for guests) |

### Auth Gate Logic (updated)

```typescript
const { userId } = await auth();

if (userId) {
  // Authenticated path (existing behavior, unchanged)
  const squareCustomerId = await getSquareCustomerId(userId);
  if (!squareCustomerId) return { error: "Account setup in progress" };
  // Use squareCustomerId for cart lookup and checkout
} else {
  // Guest path (new)
  const guestOrderId = getGuestCartOrderId();
  if (!guestOrderId) return { error: "Your cart is empty" };
  // Use guestOrderId for cart lookup and checkout (no squareCustomerId needed)
  // On success: clearGuestCartOrderId() before redirect
}
```

### Output

Same `CheckoutResult` type as before:
```typescript
{ success: true, paymentLinkUrl: string }  // Redirect client to Square
{ success: false, error: string, errorCode: string }  // Show error on cart page
```

## `addToCart`, `updateCartItem`, `removeCartItem` — Updated

All three follow the same updated auth gate pattern:

```typescript
const { userId } = await auth();

if (userId) {
  // Auth path (existing, unchanged)
  const squareCustomerId = await getSquareCustomerId(userId);
  if (!squareCustomerId) return { error: "Account setup in progress" };
  const { orderId } = await findOrCreateDraftOrder(squareCustomerId);
} else {
  // Guest path (new)
  const existingOrderId = getGuestCartOrderId();
  const { orderId } = await findOrCreateDraftOrder(null, existingOrderId);
  if (!existingOrderId) setGuestCartOrderId(orderId); // First cart item
}
```

### `addToCart` — Guest Path Specifics

- On first add for a guest: creates Square DRAFT order without `customerId`, sets `guest-cart-order-id` cookie
- On subsequent adds: reads `guest-cart-order-id` cookie, fetches existing order, appends line item
- Returns `lineItemCount` for cart badge display (header can read cookie to determine guest count)

### Cart Badge Count for Guests

The header cart badge currently calls `getCartItemCount(squareCustomerId)`. For guests, it must check the `guest-cart-order-id` cookie and call `getCartItemCount(null, orderId)` instead.
