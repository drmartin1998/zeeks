/**
 * Shipping cost calculation based on order subtotal (clarifications Q1/Q2).
 *
 * A pure, unit-testable function. The tier table is configurable; the exact
 * thresholds/amounts below are a reasonable default and can be adjusted.
 */

export interface ShippingTier {
  /** Orders with subtotal <= this amount (cents) pay `costCents`. */
  upToCents: number;
  costCents: number;
}

/** Default tiered shipping rates by order subtotal (cents). */
export const SHIPPING_TIERS: ShippingTier[] = [
  { upToCents: 5000, costCents: 500 }, // <= $50.00 → $5.00
  { upToCents: 10000, costCents: 800 }, // <= $100.00 → $8.00
  { upToCents: Infinity, costCents: 0 }, // > $100.00 → free
];

/**
 * Calculate the shipping fee in cents for a given order subtotal (cents).
 * Returns 0 for subtotals at or above the free-shipping threshold.
 */
export function calculateShippingCost(subtotalCents: number): number {
  if (!Number.isFinite(subtotalCents) || subtotalCents < 0) return 0;
  const tier = SHIPPING_TIERS.find((t) => subtotalCents <= t.upToCents);
  return tier ? tier.costCents : 0;
}