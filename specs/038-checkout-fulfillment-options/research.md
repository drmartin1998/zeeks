# Research: Checkout Fulfillment Options

**Feature**: 038-checkout-fulfillment-options | **Date**: 2026-08-07

Research resolves the fulfillment-selection design and shipping-cost decisions.

## 1. Where the fulfillment selection lives

**Decision**: Add the shipping/pickup selection as an inline section on the existing checkout page, above the payment form (clarification Q5).

**Rationale**: Checkout is the natural point where order details are finalized. An inline section (rather than a separate step) keeps the flow to a single page, avoids forcing the customer through an extra step, and matches the clarification. The section owns the fulfillment state (method + address) and passes it to the payment form / server action.

**Alternatives considered**:
- *Separate fulfillment step* — rejected (clarification Q5: inline section).
- *On the cart page* — rejected (fulfillment is a checkout concern).

## 2. Shipping cost calculation

**Decision**: Compute shipping cost from the order subtotal using a tiered fee table (clarifications Q1/Q2). Implemented as a pure function `calculateShippingCost(subtotalCents)` returning a cost in cents, with tier thresholds/amounts as configurable constants.

**Rationale**: A tiered-by-subtotal model is simple, transparent to customers, and easy to adjust. Keeping it a pure function makes it unit-testable (Constitution VI) and used consistently at checkout, on the confirmation page, and in the email.

**Alternatives considered**:
- *Free shipping* — rejected (clarification Q1: calculated).
- *Weight-based* — rejected (clarification Q2: subtotal amount).

## 3. Shipping address capture and "same as billing"

**Decision**: When shipping is selected, show a shipping-address form (recipient name, street, city, state, postal code) with a "same as billing" toggle that pre-fills the fields from the billing details (clarification Q4). Validate the address (required fields, 2-letter state, 5-digit ZIP) before submit.

**Rationale**: A "same as billing" option reduces typing for the common case while still allowing a distinct delivery address. Client-side validation prevents incomplete addresses from reaching the order.

## 4. Pickup details in confirmation/email

**Decision**: For pickup orders, the confirmation page and email show the store location, operating hours, and a "ready for pickup" note (no specific pickup time) (clarification Q3).

**Rationale**: Pickup customers need to know where and roughly when to collect their order, but committing to a specific time is risky. The store's existing location data supplies the location/hours.

## 5. Persisting fulfillment on the order

**Decision**: Store the fulfillment method and (for shipping) the shipping address and shipping cost on the Square order via the existing checkout server action (Square Fulfillment object / order fields). The confirmation page and email read them back via `getCart`.

**Rationale**: The Square order is the source of truth. Persisting fulfillment there keeps the confirmation page and email consistent and satisfies FR-006/FR-007/FR-008.

## 6. Email integration dependency

**Decision**: The order-confirmation email (feature 037, Resend) is extended to include the fulfillment method and (for shipping) the shipping address, or pickup details. This feature depends on 037 being available/merged.

**Rationale**: FR-008 requires the email to reflect fulfillment. The email builder (from 037) is extended rather than recreated.

## Consolidated decisions

- **D1**: Inline fulfillment section on the checkout page, above the payment form.
- **D2**: Shipping cost = pure tiered function of subtotal (`calculateShippingCost`).
- **D3**: Shipping address form with "same as billing" option; client-side validation.
- **D4**: Pickup confirmation shows store location + hours + "ready for pickup" note (no specific time).
- **D5**: Fulfillment + shipping cost persisted on the Square order; read back for confirmation/email.
- **D6**: Email update depends on feature 037 (Resend order emails).