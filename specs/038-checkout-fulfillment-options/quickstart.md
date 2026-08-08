# Quickstart: Validating Checkout Fulfillment Options

**Feature**: 038-checkout-fulfillment-options | **Date**: 2026-08-07

This guide documents runnable validation scenarios that prove the fulfillment-selection feature works end-to-end. It references the [data model](./data-model.md) and [contracts](./contracts/) rather than duplicating them.

## Prerequisites

- Local dev server via `vercel dev` (see `.clinerules/dev-server.md`).
- A cart with at least one item.
- Feature 037 (Resend order emails) available for the email confirmation check.

## Setup

```bash
vercel dev         # or reuse existing server on :3000
tsc --noEmit
npm run lint
```

## Validation scenarios

### Scenario 1 — Shipping/pickup choice appears at checkout

1. Add an item to the cart and go to `/checkout`.
2. **Expected**: A fulfillment section appears above the payment form with a choice between "Shipping" and "Pickup".

### Scenario 2 — Shipping shows the address form and calculated cost

1. At checkout, select "Shipping".
2. **Expected**: A shipping-address form appears, and a shipping cost is shown based on the order subtotal (see [shipping-cost](./contracts/shipping-cost.md)).

### Scenario 3 — Pickup requires no address

1. At checkout, select "Pickup".
2. **Expected**: No shipping-address form is shown; pickup is the selected method.

### Scenario 4 — Switch between shipping and pickup

1. Select "Shipping", enter a partial address.
2. Switch to "Pickup".
3. **Expected**: The address form disappears; switching back to shipping re-shows it without losing the rest of the checkout.

### Scenario 5 — Shipping address validation

1. Select "Shipping" and submit with a blank required field or an invalid state/ZIP.
2. **Expected**: The customer is prompted to correct the address before completing the order.

### Scenario 6 — Confirmation and email reflect fulfillment

1. Complete a **shipping** order.
2. **Expected**: The confirmation page and email show the shipping address.
3. Complete a **pickup** order.
4. **Expected**: The confirmation page and email show the store location, operating hours, and a "ready for pickup" note.

## Automated tests

```bash
npm test              # Vitest — unit (shipping-cost calc, address validation) + integration (fulfillment section, checkout)
npm run test:e2e      # Playwright — optional critical path
```

See `data-model.md` for the fulfillment invariants and `contracts/shipping-cost.md` / `contracts/fulfillment-persistence.md` for the interfaces.