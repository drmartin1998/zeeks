import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

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
const mockFindExistingDraftOrder = vi.fn();
const mockGetGuestCartOrderId = vi.fn();
const mockTransferGuestCartToCustomer = vi.fn();
let mockGuestCartSyncProps: { active: boolean }[] = [];

vi.mock("@/lib/webhooks/clerk", () => ({
  getSquareCustomerId: (...args: unknown[]) =>
    mockGetSquareCustomerId(...args),
}));

vi.mock("@/lib/square/cart", () => ({
  getCart: (...args: unknown[]) => mockGetCart(...args),
  findExistingDraftOrder: (...args: unknown[]) =>
    mockFindExistingDraftOrder(...args),
}));

vi.mock("@/lib/square/client", () => ({
  ordersApi: {},
  locationId: "TEST_LOCATION",
}));

vi.mock("@/lib/square/cookies", () => ({
  getGuestCartOrderId: (...args: unknown[]) =>
    mockGetGuestCartOrderId(...args),
}));

vi.mock("@/lib/square/cart-transfer", () => ({
  transferGuestCartToCustomer: (...args: unknown[]) =>
    mockTransferGuestCartToCustomer(...args),
}));

// Mock the cleanup client component so we can assert it is mounted when the
// page decides the guest cookie should be cleared.
vi.mock("@/components/cart/guest-cart-sync", () => ({
  GuestCartSync: (props: { active: boolean }) => {
    mockGuestCartSyncProps.push(props);
    return null;
  },
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
  mockFindExistingDraftOrder.mockReset();
  mockRedirect.mockReset();
  mockGetGuestCartOrderId.mockReset();
  mockGetGuestCartOrderId.mockResolvedValue(undefined);
  mockTransferGuestCartToCustomer.mockReset();
  mockGetSquareCustomerId.mockResolvedValue("CUST_456");
  mockUserId = "user_123";
  mockGuestCartSyncProps = [];
});

describe("CartPage (guest cart hand-off)", () => {
  it("should not transfer or clear a cookie when no guest cart cookie is present", async () => {
    mockGetGuestCartOrderId.mockResolvedValue(undefined);
    mockGetCart.mockResolvedValue({
      orderId: "ORDER_AUTH",
      lineItems: [],
      subtotal: { amount: 0, currency: "USD" },
    });

    const { default: CartPage } = await import("@/app/cart/page");
    await act(async () => {
      render(await CartPage());
    });

    expect(mockTransferGuestCartToCustomer).not.toHaveBeenCalled();
    // No guest cart existed, so no deferred cookie-clearing is scheduled.
    expect(mockGuestCartSyncProps).toEqual([
      { active: false },
    ]);
  });

  it("should transfer the guest cart during render and schedule the cookie clear", async () => {
    mockGetGuestCartOrderId.mockResolvedValue("ORDER_GUEST");
    mockFindExistingDraftOrder.mockResolvedValue(null);
    mockTransferGuestCartToCustomer.mockResolvedValue("ORDER_GUEST");
    mockGetCart.mockResolvedValue({
      orderId: "ORDER_GUEST",
      lineItems: [],
      subtotal: { amount: 0, currency: "USD" },
    });

    const { default: CartPage } = await import("@/app/cart/page");
    await act(async () => {
      render(await CartPage());
    });

    // The pure Square transfer ran during render with the expected args.
    expect(mockTransferGuestCartToCustomer).toHaveBeenCalledWith(
      "ORDER_GUEST",
      "CUST_456",
      null,
    );
    // The cleanup component requests the cookie be cleared post-render.
    expect(mockGuestCartSyncProps).toEqual([{ active: true }]);
  });

  it("should show error message when cart fetch fails", async () => {
    mockGetCart.mockRejectedValue(new Error("API error"));

    const { default: CartPage } = await import("@/app/cart/page");
    await act(async () => {
      render(await CartPage());
    });

    expect(screen.getByText(/API error/)).toBeInTheDocument();
  });

  it("should schedule a cookie clear when the guest order is not a DRAFT", async () => {
    mockUserId = null;
    mockGetGuestCartOrderId.mockResolvedValue("ORDER_GUEST");

    // The existing (real) ordersApi mock returns `{}`, so order state is
    // "UNKNOWN" -> the page treats the guest order as invalid and clears it.
    const { default: CartPage } = await import("@/app/cart/page");
    await act(async () => {
      render(await CartPage());
    });

    expect(mockGuestCartSyncProps).toEqual([{ active: true }]);
  });
});
