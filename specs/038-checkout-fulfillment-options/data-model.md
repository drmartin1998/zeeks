# Data Model: Checkout Fulfillment Options

**Feature**: 038-checkout-fulfillment-options | **Date**: 2026-08-07

## Entities

### FulfillmentMethod

The chosen delivery method.

| Value | Meaning |
|-------|---------|
| `"shipping"` | Delivered to a shipping address. |
| `"pickup"` | Collected in store. |

**Validation**: One of the two values; exactly one is required per order.

### ShippingAddress

The delivery address captured when shipping is selected (FR-002).

| Field | Type | Validation |
|-------|------|------------|
| `recipientName` | `string` | Required, non-empty |
| `addressLine1` | `string` | Required, non-empty |
| `addressLine2` | `string` | Optional |
| `city` | `string` | Required, non-empty |
| `state` | `string` | Required, 2-letter code |
| `postalCode` | `string` | Required, 5-digit format |

**Validation**: All required fields present; `state` is a 2-letter code; `postalCode` matches the 5-digit format (FR-005).

### OrderFulfillment

The fulfillment details attached to an order.

| Field | Type | Description |
|-------|------|-------------|
| `method` | `FulfillmentMethod` | `"shipping"` or `"pickup"`. |
| `shippingAddress` | `ShippingAddress \| null` | Present when `method === "shipping"`; null for pickup. |
| `shippingCost` | `{ amount: number; currency: string } \| null` | Calculated shipping fee (cents) for shipping; null for pickup. |

**Invariants**:
- `method === "shipping"` ⟹ `shippingAddress` is set and `shippingCost` is set.
- `method === "pickup"` ⟹ `shippingAddress` is null and `shippingCost` is null.
- Only the chosen method's details are stored (edge case: discarded if switching).

### Cart (extended)

The existing `Cart` type gains fulfillment info so the confirmation page and email can render it.

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | `string` | Unchanged. |
| `lineItems` | `CartLineItem[]` | Unchanged. |
| `subtotal` | `{ amount; currency }` | Unchanged. |
| `shippingCost` | `{ amount; currency } \| null` | Add: shipping fee (null for pickup). |
| `total` | `{ amount; currency }` | Add: subtotal − discounts + shipping. |
| `fulfillment` | `OrderFulfillment \| null` | Add: the chosen method + address. |

## Data flow

1. On the checkout page, the `FulfillmentSection` client component holds the chosen method + address state.
2. When shipping is selected, `calculateShippingCost(subtotal)` computes the fee and the shipping-address form is shown.
3. On submit, the checkout server action validates the address (Zod), records the `OrderFulfillment` on the Square order, and includes the shipping cost in the total.
4. The confirmation page and email read the order's fulfillment via `getCart` and render the method + address (shipping) or store location + hours + "ready for pickup" note (pickup).

## State transitions

### Fulfillment selection

| From | Trigger | To |
|------|---------|-----|
| Checkout (default, e.g., pickup) | Choose "Shipping" | Shipping selected; address form shown; shipping cost computed |
| Shipping | Choose "Pickup" | Pickup selected; address/cost cleared |
| Any | Submit order | Fulfillment persisted on the order |

## Relationships

- An `OrderFulfillment.method` is a `FulfillmentMethod`.
- `OrderFulfillment.shippingAddress` is a `ShippingAddress` (only when shipping).
- `Cart.fulfillment` is an `OrderFulfillment`; `Cart.shippingCost` reflects the shipping fee.
- Shipping cost is derived from `Cart.subtotal` via the tiered table (not stored independently of the order).