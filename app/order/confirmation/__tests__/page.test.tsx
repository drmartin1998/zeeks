import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockGetCart = vi.fn();
vi.mock("@/lib/square/cart", () => ({
  getCart: (...args: unknown[]) => mockGetCart(...args),
}));

import OrderConfirmationPage from "@/app/order/confirmation/page";

const shippingOrder = {
  orderId: "ORDER_1",
  lineItems: [
    {
      uid: "LI_1",
      catalogObjectId: "CAT_1",
      variationId: "VAR_1",
      name: "Space Marines",
      imageUrl: null,
      quantity: "1",
      unitPrice: { amount: 3500, currency: "USD" },
      lineTotal: { amount: 3500, currency: "USD" },
      isUnavailable: false,
    },
  ],
  subtotal: { amount: 3500, currency: "USD" },
  shippingCost: { amount: 500, currency: "USD" },
  total: { amount: 4000, currency: "USD" },
  fulfillment: {
    method: "shipping",
    shippingAddress: {
      recipientName: "John Doe",
      addressLine1: "123 Main St",
      city: "Peoria",
      state: "IL",
      postalCode: "61602",
    },
    shippingCost: { amount: 500, currency: "USD" },
  },
};

const pickupOrder = {
  ...shippingOrder,
  orderId: "ORDER_2",
  shippingCost: null,
  total: { amount: 3500, currency: "USD" },
  fulfillment: { method: "pickup", shippingAddress: null, shippingCost: null },
};

describe("OrderConfirmationPage fulfillment", () => {
  it("should show the shipping address for a shipping order", async () => {
    mockGetCart.mockResolvedValue(shippingOrder);
    render(
      await OrderConfirmationPage({
        searchParams: Promise.resolve({ orderId: "ORDER_1" }),
      })
    );
    expect(await screen.findByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
    expect(screen.getByText(/Peoria, IL 61602/)).toBeInTheDocument();
  });

  it("should show pickup details for a pickup order", async () => {
    mockGetCart.mockResolvedValue(pickupOrder);
    render(
      await OrderConfirmationPage({
        searchParams: Promise.resolve({ orderId: "ORDER_2" }),
      })
    );
    expect(await screen.findByText("Pickup")).toBeInTheDocument();
    expect(
      screen.getByText(/ready for pickup at our store/i)
    ).toBeInTheDocument();
  });
});