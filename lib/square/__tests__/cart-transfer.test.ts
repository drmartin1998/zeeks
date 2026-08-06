import { describe, it, expect, vi, beforeEach } from "vitest";

const mockOrdersGet = vi.fn();
const mockOrdersUpdate = vi.fn();
const mockClearGuestCartOrderId = vi.fn();

vi.mock("@/lib/env", () => ({
  env: {
    SQUARE_ACCESS_TOKEN: "test-token",
    SQUARE_LOCATION_ID: "TEST_LOCATION",
    SQUARE_APPLICATION_ID: "test-app-id",
  },
}));

vi.mock("@/lib/square/client", () => ({
  ordersApi: {
    get: (...args: unknown[]) => mockOrdersGet(...args),
    update: (...args: unknown[]) => mockOrdersUpdate(...args),
  },
  locationId: "TEST_LOCATION",
}));

vi.mock("@/lib/square/cookies", () => ({
  getGuestCartOrderId: vi.fn(),
  setGuestCartOrderId: vi.fn(),
  clearGuestCartOrderId: (...args: unknown[]) =>
    mockClearGuestCartOrderId(...args),
}));

import { transferGuestCartToCustomer } from "@/lib/square/cart-transfer";

describe("transferGuestCartToCustomer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrdersGet.mockReset();
    mockOrdersUpdate.mockReset();
    mockClearGuestCartOrderId.mockReset();
  });

  it("should transfer the guest order to the customer and return its ID", async () => {
    mockOrdersGet.mockResolvedValue({ order: { version: 1 } });
    mockOrdersUpdate.mockResolvedValue({});

    const result = await transferGuestCartToCustomer(
      "ORDER_GUEST",
      "CUST_456",
      null,
    );

    expect(result).toBe("ORDER_GUEST");
    expect(mockOrdersUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "ORDER_GUEST",
        order: expect.objectContaining({ customerId: "CUST_456" }),
      }),
    );
  });

  it("should merge line items when an existing auth order is provided", async () => {
    mockOrdersGet
      .mockResolvedValueOnce({
        order: {
          version: 2,
          lineItems: [
            {
              catalogObjectId: "CAT_A",
              uid: "U1",
              quantity: "1",
              variationId: null,
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        order: {
          version: 5,
          lineItems: [
            { catalogObjectId: "CAT_A", uid: "A1", quantity: "1" },
            { catalogObjectId: "CAT_B", uid: "A2", quantity: "2" },
          ],
        },
      });
    mockOrdersUpdate.mockResolvedValue({});

    const result = await transferGuestCartToCustomer(
      "ORDER_GUEST",
      "CUST_456",
      "ORDER_AUTH",
    );

    expect(result).toBe("ORDER_AUTH");
    expect(mockOrdersUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "ORDER_AUTH",
        order: expect.objectContaining({
          customerId: "CUST_456",
          version: 5,
          lineItems: expect.arrayContaining([
            expect.objectContaining({ catalogObjectId: "CAT_A", quantity: "2" }),
            expect.objectContaining({ catalogObjectId: "CAT_B", quantity: "2" }),
          ]),
        }),
      }),
    );
  });

  it("should never mutate cookies (pure SSR-safe operation)", async () => {
    mockOrdersGet.mockResolvedValue({ order: { version: 1 } });
    mockOrdersUpdate.mockResolvedValue({});

    await transferGuestCartToCustomer("ORDER_GUEST", "CUST_456", null);

    expect(mockClearGuestCartOrderId).not.toHaveBeenCalled();
  });
});
