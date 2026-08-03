import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSquareCustomerId = vi.fn();
const mockFindOrCreateDraftOrder = vi.fn();
const mockCreatePaymentLink = vi.fn();

vi.mock("@/lib/webhooks/clerk", () => ({
  getSquareCustomerId: (...args: unknown[]) =>
    mockGetSquareCustomerId(...args),
}));

vi.mock("@/lib/square/cart", () => ({
  findOrCreateDraftOrder: (...args: unknown[]) =>
    mockFindOrCreateDraftOrder(...args),
}));

vi.mock("@/lib/square/client", () => ({
  ordersApi: {},
  checkoutApi: {},
  locationId: "TEST_LOCATION",
}));

vi.mock("@/lib/square/checkout", () => ({
  createPaymentLink: (...args: unknown[]) => mockCreatePaymentLink(...args),
}));

vi.mock("@/lib/env", () => ({
  env: {
    SQUARE_ACCESS_TOKEN: "test-token",
    SQUARE_LOCATION_ID: "TEST_LOCATION",
    SQUARE_APPLICATION_ID: "test-app-id",
  },
}));

let mockUserId: string | null = "user_123";

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => Promise.resolve({ userId: mockUserId }),
}));

import { redirect } from "next/navigation";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { initiateCheckout } = await import("@/app/cart/actions");

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSquareCustomerId.mockReset();
  mockCreatePaymentLink.mockReset();
  mockUserId = "user_123";
});

describe("initiateCheckout server action", () => {
  it("should redirect to sign-in when user is not authenticated", async () => {
    mockUserId = null;

    const formData = new FormData();
    formData.set("orderId", "ORDER_123");

    const result = await initiateCheckout(null, formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Sign in required");
    expect(mockCreatePaymentLink).not.toHaveBeenCalled();
  });

  it("should return error when Square customer ID is missing", async () => {
    mockGetSquareCustomerId.mockResolvedValue(null);

    const formData = new FormData();
    formData.set("orderId", "ORDER_123");
    formData.set("squareCustomerId", "CUST_456");

    const result = await initiateCheckout(null, formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Account setup in progress. Please try again shortly.");
  });

  it("should return error when orderId is missing from form data", async () => {
    mockGetSquareCustomerId.mockResolvedValue("CUST_456");

    const formData = new FormData();

    const result = await initiateCheckout(null, formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe("No order to checkout");
  });

  it("should create payment link and return redirect URL on success", async () => {
    mockGetSquareCustomerId.mockResolvedValue("CUST_456");
    mockCreatePaymentLink.mockResolvedValue({
      success: true,
      paymentLink: {
        id: "PL_123",
        url: "https://square.link/u/abc123",
        orderId: "ORDER_123",
        version: 1,
      },
    });

    const formData = new FormData();
    formData.set("orderId", "ORDER_123");
    formData.set("squareCustomerId", "CUST_456");

    const result = await initiateCheckout(null, formData);

    expect(result.success).toBe(true);
    expect(result.paymentLinkUrl).toBe("https://square.link/u/abc123");
    expect(mockCreatePaymentLink).toHaveBeenCalledWith(
      "CUST_456",
      expect.stringContaining("/order/result"),
    );
  });

  it("should return error when createPaymentLink fails with empty cart", async () => {
    mockGetSquareCustomerId.mockResolvedValue("CUST_456");
    mockCreatePaymentLink.mockResolvedValue({
      success: false,
      error: "Your cart is empty",
      errorCode: "EMPTY_CART",
    });

    const formData = new FormData();
    formData.set("orderId", "ORDER_123");
    formData.set("squareCustomerId", "CUST_456");

    const result = await initiateCheckout(null, formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Your cart is empty");
    expect(result.errorCode).toBe("EMPTY_CART");
  });

  it("should return error when createPaymentLink fails with unavailable items", async () => {
    mockGetSquareCustomerId.mockResolvedValue("CUST_456");
    mockCreatePaymentLink.mockResolvedValue({
      success: false,
      error:
        "Some items in your cart are no longer available. Please remove them to continue.",
      errorCode: "UNAVAILABLE_ITEMS",
    });

    const formData = new FormData();
    formData.set("orderId", "ORDER_123");
    formData.set("squareCustomerId", "CUST_456");

    const result = await initiateCheckout(null, formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain("no longer available");
    expect(result.errorCode).toBe("UNAVAILABLE_ITEMS");
  });
});
