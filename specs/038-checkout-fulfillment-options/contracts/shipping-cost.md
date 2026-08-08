# Contract: Shipping Cost Calculation

**Feature**: 038-checkout-fulfillment-options | **Date**: 2026-08-07

## Interface

`calculateShippingCost(subtotalCents: number): number`

Returns the shipping fee in currency minor units (cents) based on the order subtotal, using a tiered table (clarification Q2). Returns `0` for pickup (no shipping fee).

## Behavior

- Pure function: deterministic, no side effects (unit-testable).
- Tier thresholds and amounts are configurable constants (e.g., a `SHIPPING_TIERS` array of `{ upToCents, costCents }`).

Example tier shape (configurable):

| Order subtotal (cents) | Shipping fee (cents) |
|------------------------|----------------------|
| ≤ 5000                | 500                 |
| ≤ 10000               | 800                 |
| > 10000               | 0 (free)            |

## Usage

- Checkout page: computed client-side when shipping is selected (instant display).
- Persisted on the order at submit.
- Confirmation page and email: read back from the order.

## Validation

- `subtotalCents` is a non-negative integer.
- Returns a non-negative integer.