import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    SQUARE_ACCESS_TOKEN: "test-token",
    SQUARE_LOCATION_ID: "TEST_LOCATION",
    SQUARE_APPLICATION_ID: "test-app-id",
    CLERK_SECRET_KEY: "test-clerk-key",
  },
}));

vi.mock("@/lib/square/client", () => ({
  checkoutApi: {},
  ordersApi: {},
  locationId: "TEST_LOCATION",
}));

vi.mock("@/lib/square/cart", () => ({
  getCart: vi.fn(),
}));

import { validateCartForCheckout } from "@/lib/square/checkout";
import type { Cart } from "@/lib/square/types";

const emptyCart: Cart = {
  orderId: "ORDER_1",
  lineItems: [],
  subtotal: { amount: 0, currency: "USD" },
};

const availableCart: Cart = {
  orderId: "ORDER_2",
  lineItems: [
    {
      uid: "LI_1",
      catalogObjectId: "CAT_1",
      variationId: "VAR_1",
      name: "Test Product",
      imageUrl: null,
      quantity: "1",
      unitPrice: { amount: 1999, currency: "USD" },
      lineTotal: { amount: 1999, currency: "USD" },
      isUnavailable: false,
    },
  ],
  subtotal: { amount: 1999, currency: "USD" },
};

const unavailableCart: Cart = {
  orderId: "ORDER_3",
  lineItems: [
    {
      uid: "LI_1",
      catalogObjectId: "CAT_1",
      variationId: "VAR_1",
      name: "Sold Out Product",
      imageUrl: null,
      quantity: "1",
      unitPrice: { amount: 1999, currency: "USD" },
      lineTotal: { amount: 1999, currency: "USD" },
      isUnavailable: true,
    },
  ],
  subtotal: { amount: 1999, currency: "USD" },
};

const mixedCart: Cart = {
  orderId: "ORDER_4",
  lineItems: [
    {
      uid: "LI_1",
      catalogObjectId: "CAT_1",
      variationId: "VAR_1",
      name: "Available Product",
      imageUrl: null,
      quantity: "1",
      unitPrice: { amount: 999, currency: "USD" },
      lineTotal: { amount: 999, currency: "USD" },
      isUnavailable: false,
    },
    {
      uid: "LI_2",
      catalogObjectId: "CAT_2",
      variationId: "VAR_2",
      name: "Unavailable Product",
      imageUrl: null,
      quantity: "1",
      unitPrice: { amount: 1999, currency: "USD" },
      lineTotal: { amount: 1999, currency: "USD" },
      isUnavailable: true,
    },
  ],
  subtotal: { amount: 2998, currency: "USD" },
};

describe("validateCartForCheckout", () => {
  it("should return invalid for null cart", () => {
    const result = validateCartForCheckout(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Your cart is empty");
    expect(result.hasUnavailable).toBe(false);
  });

  it("should return invalid for empty cart", () => {
    const result = validateCartForCheckout(emptyCart);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Your cart is empty");
  });

  it("should return valid for cart with only available items", () => {
    const result = validateCartForCheckout(availableCart);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
    expect(result.hasUnavailable).toBe(false);
  });

  it("should return invalid for cart with all unavailable items", () => {
    const result = validateCartForCheckout(unavailableCart);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("no longer available");
    expect(result.hasUnavailable).toBe(true);
  });

  it("should return invalid for cart with mixed available/unavailable items", () => {
    const result = validateCartForCheckout(mixedCart);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("no longer available");
    expect(result.hasUnavailable).toBe(true);
  });
});
