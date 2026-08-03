import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/env", () => ({
  env: {
    SQUARE_ACCESS_TOKEN: "test-token",
    SQUARE_LOCATION_ID: "TEST_LOCATION",
    SQUARE_APPLICATION_ID: "test-app-id",
    CLERK_SECRET_KEY: "test-clerk-key",
  },
}));

const mockGetSquareCustomerId = vi.fn();
const mockGetCart = vi.fn();

vi.mock("@/lib/webhooks/clerk", () => ({
  getSquareCustomerId: (...args: unknown[]) =>
    mockGetSquareCustomerId(...args),
}));

vi.mock("@/lib/square/cart", () => ({
  getCart: (...args: unknown[]) => mockGetCart(...args),
}));

vi.mock("@/lib/square/client", () => ({
  ordersApi: {},
  locationId: "TEST_LOCATION",
}));

vi.mock("@/components/nav-bar-server", () => ({
  NavBarServer: () => null,
}));

vi.mock("@/components/footer", () => ({
  Footer: () => null,
}));

let mockUserId: string | null = "user_123";

const mockRedirect = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => Promise.resolve({ userId: mockUserId }),
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSquareCustomerId.mockReset();
  mockGetCart.mockReset();
  mockRedirect.mockReset();
  mockUserId = "user_123";
});

describe("CartPage", () => {
  it("should redirect to sign-in when not authenticated", async () => {
    mockUserId = null;

    const { default: CartPage } = await import("@/app/cart/page");
    await CartPage();

    expect(mockRedirect).toHaveBeenCalledWith("/sign-in");
  });

  it("should show error message when cart fetch fails", async () => {
    mockGetSquareCustomerId.mockResolvedValue("CUST_456");
    mockGetCart.mockRejectedValue(new Error("API error"));

    const { default: CartPage } = await import("@/app/cart/page");
    render(await CartPage());

    expect(screen.getByText(/API error/)).toBeInTheDocument();
  });

  it("should show empty cart state when cart is null", async () => {
    mockGetSquareCustomerId.mockResolvedValue("CUST_456");
    mockGetCart.mockResolvedValue(null);

    const { default: CartPage } = await import("@/app/cart/page");
    render(await CartPage());

    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it("should show checkout button when cart has items", async () => {
    mockGetSquareCustomerId.mockResolvedValue("CUST_456");
    mockGetCart.mockResolvedValue({
      orderId: "ORDER_1",
      lineItems: [
        {
          uid: "LI_1",
          catalogObjectId: "CAT_1",
          variationId: "VAR_1",
          name: "Product",
          imageUrl: null,
          quantity: "1",
          unitPrice: { amount: 1999, currency: "USD" },
          lineTotal: { amount: 1999, currency: "USD" },
          isUnavailable: false,
        },
      ],
      subtotal: { amount: 1999, currency: "USD" },
    });

    const { default: CartPage } = await import("@/app/cart/page");
    render(await CartPage());

    expect(screen.getByText("Shopping Cart")).toBeInTheDocument();
  });
});
