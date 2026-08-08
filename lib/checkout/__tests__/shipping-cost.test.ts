import { describe, it, expect } from "vitest";
import { calculateShippingCost, SHIPPING_TIERS } from "@/lib/checkout/shipping-cost";

describe("calculateShippingCost", () => {
  it("should charge the first-tier rate for low subtotals", () => {
    expect(calculateShippingCost(0)).toBe(500);
    expect(calculateShippingCost(2500)).toBe(500);
    expect(calculateShippingCost(5000)).toBe(500);
  });

  it("should charge the second-tier rate for mid subtotals", () => {
    expect(calculateShippingCost(5001)).toBe(800);
    expect(calculateShippingCost(7500)).toBe(800);
    expect(calculateShippingCost(10000)).toBe(800);
  });

  it("should be free above the free-shipping threshold", () => {
    expect(calculateShippingCost(10001)).toBe(0);
    expect(calculateShippingCost(20000)).toBe(0);
  });

  it("should return 0 for invalid/negative subtotals", () => {
    expect(calculateShippingCost(-1)).toBe(0);
    expect(calculateShippingCost(Number.NaN)).toBe(0);
  });

  it("should define a sorted tier table", () => {
    for (let i = 1; i < SHIPPING_TIERS.length; i++) {
      expect(SHIPPING_TIERS[i].upToCents).toBeGreaterThan(
        SHIPPING_TIERS[i - 1].upToCents
      );
    }
  });
});