# Data Model: Square Checkout Flow

**Feature**: 024-checkout-flow
**Date**: 2026-08-03

## Entities

### CheckoutInput (Server Action input)

The validated input to the checkout server action.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| orderId | string | Yes | Non-empty string; must reference an existing Square draft order |
| squareCustomerId | string | Yes | Non-empty string; derived from Clerk auth, not user-supplied |

### PaymentLink (Square API response)

The result of a successful `checkout.paymentLinks.create()` call.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Square payment link ID |
| url | string | Square-hosted payment page URL (customer redirected here) |
| orderId | string | The Square order ID linked to this payment |
| version | number | Square order version number |

### CheckoutResult (Server Action response)

The result returned from the checkout server action to the client.

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether checkout initiation succeeded |
| paymentLinkUrl | string? | The Square payment page URL (present on success) |
| error | string? | User-facing error message (present on failure) |
| errorCode | string? | Machine-readable error code for logging/tracking |

### OrderResult (Return page state)

Derived from Square's redirect query parameters.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| status | "COMPLETED" \| "CANCELLED" \| null | `searchParams.status` | Payment outcome from Square |
| transactionId | string? | `searchParams.transactionId` | Square transaction ID (present on COMPLETED) |

### Existing Entities (no changes)

These entities from 023-shopping-cart are reused as-is:

- **Cart (Square Draft Order)** — `lib/square/types.ts:Cart`
- **CartLineItem** — `lib/square/types.ts:CartLineItem`

## State Transitions

### Order Lifecycle

```
DRAFT (cart) ──[checkout initiated]──> OPEN (payment link created, awaiting payment)
                                                  │
                          ┌───────────────────────┤
                          ▼                       ▼
                    COMPLETED                 CANCELLED
                 (payment successful)      (customer cancelled or expired)
```

### Checkout Flow State

```
[Cart Page] ──click "Proceed to Checkout"──> [Server Action: initiateCheckout]
                                                      │
                              ┌───────────────────────┤
                              ▼                       ▼
                         [SUCCESS]               [FAILURE]
                              │                       │
                              ▼                       ▼
                    Redirect to Square         Show error on cart page
                    Payment Page URL           (cart preserved, retry)
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
        [COMPLETED]                    [CANCELLED]
              │                               │
              ▼                               ▼
      /order/result                    /order/result
  (confirmation view)             (cancellation view)
```

## Validation Rules

1. `orderId` must be non-empty and reference an existing Square order in DRAFT state
2. All line items in the order must have `isUnavailable === false`
3. The authenticated user's `squareCustomerId` must match the order's customer reference
4. Idempotency key must be unique per checkout attempt (UUID v4)
