# Contract: Fulfillment Persistence on the Order

**Feature**: 038-checkout-fulfillment-options | **Date**: 2026-08-07

## Purpose

Persist the chosen fulfillment method and shipping details on the Square order so the confirmation page and email can reflect them.

## Input (from the checkout server action)

```ts
interface FulfillmentInput {
  method: "shipping" | "pickup";
  shippingAddress?: {
    recipientName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  shippingCostCents: number; // 0 for pickup
}
```

## Validation (Zod)

- `method` is `"shipping"` or `"pickup"`.
- When `method === "shipping"`, `shippingAddress` is required and validated (required fields, 2-letter state, 5-digit postal code).
- When `method === "pickup"`, `shippingAddress` is omitted and `shippingCostCents` is `0`.

## Persistence

- The checkout server action attaches the fulfillment to the Square order (Square `fulfillments` with `SHIPMENT` or `PICKUP` type, recipient + address for shipping) and records the shipping cost.
- The order `total` includes the shipping fee for shipping orders.

## Read-back

- `getCart(orderId)` returns the `Cart` including `fulfillment` and `shippingCost`/`total`, used by:
  - the order confirmation page (`app/order/confirmation/page.tsx`), and
  - the order-confirmation email (feature 037).

## Behavior

- Only the chosen method's details are stored (switching from shipping to pickup clears the shipping address/cost).