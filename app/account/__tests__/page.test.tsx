import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockFetchDashboardData = vi.fn();

vi.mock("@/lib/square/dashboard", () => ({
  fetchDashboardData: (...args: unknown[]) => mockFetchDashboardData(...args),
}));

const mockGetSquareCustomerId = vi.fn();

vi.mock("@/lib/webhooks/clerk", () => ({
  getSquareCustomerId: (...args: unknown[]) => mockGetSquareCustomerId(...args),
}));

const mockRedirectToSignIn = vi.fn();
let mockUserId: string | null = "user_123";

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => Promise.resolve({ userId: mockUserId, redirectToSignIn: mockRedirectToSignIn }),
}));

const { default: AccountPage } = await import("@/app/account/page");

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSquareCustomerId.mockReset();
  mockFetchDashboardData.mockReset();
  mockUserId = "user_123";
});

describe("AccountPage", () => {
  it("should redirect to sign-in when user is not authenticated", async () => {
    mockUserId = null;

    render(await AccountPage());

    expect(mockRedirectToSignIn).toHaveBeenCalled();
    expect(mockGetSquareCustomerId).not.toHaveBeenCalled();
  });

  it("should show syncing state when squareCustomerId is missing", async () => {
    mockGetSquareCustomerId.mockResolvedValue(null);

    render(await AccountPage());

    expect(
      screen.getByText("Setting up your account..."),
    ).toBeInTheDocument();
  });

  it("should render dashboard sections when all data is available", async () => {
    mockGetSquareCustomerId.mockResolvedValue("CUST001");
    mockFetchDashboardData.mockResolvedValue({
      profile: {
        id: "CUST001",
        givenName: "Jane",
        familyName: "Doe",
        emailAddress: "jane@example.com",
        phoneNumber: undefined,
      },
      profileError: null,
      loyalty: { balance: 500, lifetimePoints: 1200 },
      loyaltyError: null,
      orders: [
        {
          id: "ORDER_001",
          closedAt: "2026-07-30T12:00:00Z",
          totalMoney: { amount: BigInt(1500), currency: "USD" },
          state: "COMPLETED",
        },
      ],
      ordersError: null,
    });

    render(await AccountPage());

    expect(screen.getByText("My Account")).toBeInTheDocument();
    expect(screen.getByText("Reward Points")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("Account Info")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Order History")).toBeInTheDocument();
  });

  it("should show individual section errors without blocking other sections", async () => {
    mockGetSquareCustomerId.mockResolvedValue("CUST001");
    mockFetchDashboardData.mockResolvedValue({
      profile: {
        id: "CUST001",
        givenName: "Jane",
        familyName: "Doe",
        emailAddress: "jane@example.com",
        phoneNumber: undefined,
      },
      profileError: null,
      loyalty: null,
      loyaltyError: "Loyalty API down",
      orders: [],
      ordersError: null,
    });

    render(await AccountPage());

    expect(screen.getByText("Account Info")).toBeInTheDocument();
    expect(screen.getByText("Points unavailable")).toBeInTheDocument();
    expect(screen.getByText(/No orders yet/)).toBeInTheDocument();
  });

  it("should show full-page error when all three APIs fail", async () => {
    mockGetSquareCustomerId.mockResolvedValue("CUST001");
    mockFetchDashboardData.mockResolvedValue({
      profile: null,
      profileError: "Network error",
      loyalty: null,
      loyaltyError: "Network error",
      orders: [],
      ordersError: "Network error",
    });

    render(await AccountPage());

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.queryByText("Reward Points")).not.toBeInTheDocument();
  });
});
