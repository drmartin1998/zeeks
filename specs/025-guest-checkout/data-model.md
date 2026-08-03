# Data Model: Guest Cart & Checkout

**Feature**: 025-guest-checkout
**Date**: 2026-08-03

## Entities

### GuestCartIdentifier (new)

Represents a guest user's session identity. Stored as a browser cookie.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| orderId | string | Cookie `guest-cart-order-id` | The Square DRAFT order ID for this guest's cart |
| guestId | string | Derived: `guest-{orderId}` | Logical guest identifier (not stored separately) |

**Lifecycle**:
1. Created on first `addToCart` for an unauthenticated user
2. Updated on every subsequent cart mutation (cookie `maxAge` refreshed)
3. Cleared on successful payment link creation (before Square redirect), sign-in transfer, manual "Clear Cart", or expiry

### GuestCart (derived from Square Order)

Same shape as the existing `Cart` type — a Square DRAFT order retrieved by `orderId` rather than `customerFilter`.

| Field | Type | Description |
|-------|------|-------------|
| orderId | string | Square order ID |
| lineItems | CartLineItem[] | Items with catalogObjectId, quantity, price |
| subtotal | { amount: number; currency: string } | Sum of line item totals |
| state | "DRAFT" | Order state (guests only have DRAFT orders) |

### Updated: CheckoutInput

The `squareCustomerId` field becomes optional to support guest checkout.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| orderId | string | Yes | Non-empty string; must reference an existing Square draft order |
| squareCustomerId | string | No | For authenticated users only; derived from Clerk auth, not user-supplied. Null/absent for guests. |

**Validation rule**: At least one of `squareCustomerId` or `orderId` in cookie must be present. Guest path uses cookie-stored `orderId`; auth path uses `squareCustomerId`.

### Updated: CheckoutResult (unchanged)

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether checkout initiation succeeded |
| paymentLinkUrl | string? | The Square payment page URL (present on success) |
| error | string? | User-facing error message (present on failure) |
| errorCode | string? | Machine-readable error code for logging/tracking |

### Updated: PaymentLink (unchanged)

| Field | Type | Description |
|-------|------|-------------|
| id | string | Square payment link ID |
| url | string | Square-hosted payment page URL |
| orderId | string | The Square order ID linked to this payment |
| version | number | Square order version number |

## State Transitions

### Guest Cart Lifecycle

```
[No Cart] ──addToCart (guest)──> [DRAFT Order w/o customerId]
                                      │ cookie: guest-cart-order-id=orderId
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                  ▼
              [Checkout]        [Sign In]          [Expire / Clear]
                    │                 │                  │
                    ▼                 ▼                  ▼
           Payment link created  Transfer: update     Cookie cleared
           cookie cleared        order.customerId    Order state: DRAFT
           → redirect Square     cookie cleared      (abandoned)
```

### Auth-to-Guest Merge

```
Guest Cart (DRAFT, orderId=A, no customerId)
     +
Auth Cart (DRAFT, orderId=B, customerId=C)
     │
     ▼ [User signs in]
Merge: Copy guest line items to auth order,
       clear guest order, clear guest cookie
     │
     ▼
Auth Cart (DRAFT, orderId=B, customerId=C, merged line items)
```

## Validation Rules

1. Guest `orderId` in cookie must reference an existing Square order in DRAFT state
2. Guest cart orders must NOT have a `customerId` set (guards against auth cart mix-up)
3. On sign-in transfer: guest order's `customerId` is updated, not a new order created
4. Guest cart cookie is HttpOnly, SameSite=Lax, 7-day maxAge
5. Prices are validated at checkout time by Square's payment link creation — no server-side price validation needed beyond what Square enforces
