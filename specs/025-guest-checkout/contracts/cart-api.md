# Contract: Guest-Aware Cart Functions

**Feature**: 025-guest-checkout
**Type**: Function API contracts (overloads of existing `lib/square/cart.ts`)

## `getCart` — Guest Overload

Adds a `orderId` parameter path for guests alongside the existing `squareCustomerId` path.

```typescript
// Existing (auth path)
getCart(squareCustomerId: string): Promise<Cart | null>

// New (guest path)
getCart(squareCustomerId: null, orderId: string): Promise<Cart | null>
```

**Behavior**:
- If `squareCustomerId` is provided → use existing `customerFilter` search (auth path, unchanged)
- If `orderId` is provided → use `ordersApi.get({ orderId })` directly (guest path)
- If neither → return null (no cart)

## `findOrCreateDraftOrder` — Guest Overload

```typescript
// Existing (auth path)
findOrCreateDraftOrder(squareCustomerId: string): Promise<{ orderId: string; idempotencyKey: string }>

// New (guest path)
findOrCreateDraftOrder(squareCustomerId: null, existingOrderId?: string): Promise<{ orderId: string; idempotencyKey: string }>
```

**Behavior**:
- If `existingOrderId` is provided → fetch existing order, return it (guest returning to their cart)
- If `existingOrderId` is absent → create new DRAFT order WITHOUT `customerId`
- If `squareCustomerId` is provided → existing auth path (unchanged)

## `getCartItemCount` — Guest Overload

```typescript
// Existing (auth path)
getCartItemCount(squareCustomerId: string): Promise<number>

// New (guest path)  
getCartItemCount(squareCustomerId: null, orderId: string): Promise<number>
```

## `createPaymentLink` — Guest Overload

```typescript
// Currently
createPaymentLink(squareCustomerId: string, returnUrl: string): Promise<CheckoutAction>

// Updated
createPaymentLink(params: {
  squareCustomerId?: string;
  orderId: string;
  returnUrl: string;
}): Promise<CheckoutAction>
```

**Behavior**:
- Always requires `orderId` and `returnUrl`
- `squareCustomerId` is optional — only needed to fetch cart for auth path
- Guest path: uses `orderId` directly to get the order, then creates payment link as normal

## Validation: `validateCartForCheckout` — Unchanged

Guest carts use the same validation logic (non-empty, no unavailable items). No changes needed.
