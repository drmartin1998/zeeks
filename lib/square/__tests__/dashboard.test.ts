import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchDashboardData } from "@/lib/square/dashboard";

const mockCustomerGet = vi.fn();
const mockLoyaltySearch = vi.fn();
const mockOrdersSearch = vi.fn();

vi.mock("@/lib/square/client", () => ({
  customersApi: {
    get: (...args: unknown[]) => mockCustomerGet(...args),
  },
  loyaltyApi: {
    accounts: {
      search: (...args: unknown[]) => mockLoyaltySearch(...args),
    },
  },
  ordersApi: {
    search: (...args: unknown[]) => mockOrdersSearch(...args),
  },
  locationId: "LOCATION_1",
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function mockCustomerResponse(overrides: Record<string, unknown> = {}) {
  return {
    customer: {
      id: "CUST001",
      givenName: "Jane",
      familyName: "Doe",
      emailAddress: "jane@example.com",
      phoneNumber: "+15551234567",
      ...overrides,
    },
  };
}

function mockLoyaltyResponse(balance: number, lifetimePoints: number) {
  return {
    loyaltyAccounts: [
      { balance: BigInt(balance), lifetimePoints: BigInt(lifetimePoints) },
    ],
  };
}

function mockOrdersResponse(count: number) {
  const orders = Array.from({ length: count }, (_, i) => ({
    id: `ORDER_${String(i + 1).padStart(3, "0")}`,
    closedAt: `2026-07-${String(30 - i).padStart(2, "0")}T12:00:00Z`,
    totalMoney: {
      amount: BigInt((count - i) * 1000),
      currency: "USD",
    },
    state: i === 0 ? "OPEN" : "COMPLETED",
  }));
  return { orders };
}

describe("fetchDashboardData", () => {
  it("should return all data when all APIs succeed", async () => {
    mockCustomerGet.mockResolvedValue(mockCustomerResponse());
    mockLoyaltySearch.mockResolvedValue(mockLoyaltyResponse(500, 1200));
    mockOrdersSearch.mockResolvedValue(mockOrdersResponse(3));

    const result = await fetchDashboardData("CUST001");

    expect(result.profile).toEqual({
      id: "CUST001",
      givenName: "Jane",
      familyName: "Doe",
      emailAddress: "jane@example.com",
      phoneNumber: "+15551234567",
    });
    expect(result.profileError).toBeNull();
    expect(result.loyalty).toEqual({ balance: 500, lifetimePoints: 1200 });
    expect(result.loyaltyError).toBeNull();
    expect(result.orders).toHaveLength(3);
    expect(result.orders[0].id).toBe("ORDER_001");
    expect(result.ordersError).toBeNull();
  });

  it("should handle missing customer fields gracefully", async () => {
    mockCustomerGet.mockResolvedValue(
      mockCustomerResponse({ givenName: undefined, familyName: undefined }),
    );
    mockLoyaltySearch.mockResolvedValue({ loyaltyAccounts: [] });
    mockOrdersSearch.mockResolvedValue({ orders: [] });

    const result = await fetchDashboardData("CUST001");

    expect(result.profile?.givenName).toBeUndefined();
    expect(result.profile?.familyName).toBeUndefined();
    expect(result.loyalty).toEqual({ balance: 0, lifetimePoints: 0 });
    expect(result.orders).toEqual([]);
  });

  it("should degrade independently when only loyalty fails", async () => {
    mockCustomerGet.mockResolvedValue(mockCustomerResponse());
    mockLoyaltySearch.mockRejectedValue(new Error("Loyalty API down"));
    mockOrdersSearch.mockResolvedValue(mockOrdersResponse(2));

    const result = await fetchDashboardData("CUST001");

    expect(result.profile).not.toBeNull();
    expect(result.loyalty).toBeNull();
    expect(result.loyaltyError).toBe("Loyalty API down");
    expect(result.orders).toHaveLength(2);
  });

  it("should degrade independently when only orders fails", async () => {
    mockCustomerGet.mockResolvedValue(mockCustomerResponse());
    mockLoyaltySearch.mockResolvedValue(mockLoyaltyResponse(100, 500));
    mockOrdersSearch.mockRejectedValue(new Error("Orders API down"));

    const result = await fetchDashboardData("CUST001");

    expect(result.profile).not.toBeNull();
    expect(result.loyalty).not.toBeNull();
    expect(result.orders).toEqual([]);
    expect(result.ordersError).toBe("Orders API down");
  });

  it("should degrade independently when only profile fails", async () => {
    mockCustomerGet.mockRejectedValue(new Error("Profile API down"));
    mockLoyaltySearch.mockResolvedValue(mockLoyaltyResponse(50, 200));
    mockOrdersSearch.mockResolvedValue(mockOrdersResponse(1));

    const result = await fetchDashboardData("CUST001");

    expect(result.profile).toBeNull();
    expect(result.profileError).toBe("Profile API down");
    expect(result.loyalty).not.toBeNull();
    expect(result.orders).toHaveLength(1);
  });

  it("should handle all APIs failing simultaneously", async () => {
    mockCustomerGet.mockRejectedValue(new Error("Network error"));
    mockLoyaltySearch.mockRejectedValue(new Error("Network error"));
    mockOrdersSearch.mockRejectedValue(new Error("Network error"));

    const result = await fetchDashboardData("CUST001");

    expect(result.profile).toBeNull();
    expect(result.profileError).toBe("Network error");
    expect(result.loyalty).toBeNull();
    expect(result.loyaltyError).toBe("Network error");
    expect(result.orders).toEqual([]);
    expect(result.ordersError).toBe("Network error");
  });

  it("should handle non-Error rejections gracefully", async () => {
    mockCustomerGet.mockResolvedValue(mockCustomerResponse());
    mockLoyaltySearch.mockRejectedValue("String error");
    mockOrdersSearch.mockResolvedValue(mockOrdersResponse(1));

    const result = await fetchDashboardData("CUST001");

    expect(result.loyaltyError).toBe("An unexpected error occurred");
  });

  it("should pass squareCustomerId to all three APIs", async () => {
    mockCustomerGet.mockResolvedValue(mockCustomerResponse());
    mockLoyaltySearch.mockResolvedValue(mockLoyaltyResponse(0, 0));
    mockOrdersSearch.mockResolvedValue(mockOrdersResponse(0));

    await fetchDashboardData("CUST_ABC_123");

    expect(mockCustomerGet).toHaveBeenCalledWith({
      customerId: "CUST_ABC_123",
    });
    expect(mockLoyaltySearch).toHaveBeenCalledWith({
      query: { customerIds: ["CUST_ABC_123"] },
      limit: 1,
    });
    expect(mockOrdersSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        locationIds: ["LOCATION_1"],
        query: expect.objectContaining({
          filter: expect.objectContaining({
            customerFilter: { customerIds: ["CUST_ABC_123"] },
          }),
        }),
        limit: 10,
      }),
    );
  });

  it("should return default loyalty values when no loyalty accounts exist", async () => {
    mockCustomerGet.mockResolvedValue(mockCustomerResponse());
    mockLoyaltySearch.mockResolvedValue({ loyaltyAccounts: [] });
    mockOrdersSearch.mockResolvedValue(mockOrdersResponse(0));

    const result = await fetchDashboardData("CUST001");

    expect(result.loyalty).toEqual({ balance: 0, lifetimePoints: 0 });
    expect(result.loyaltyError).toBeNull();
  });
});
