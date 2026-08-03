import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(mockCookieStore),
}));

import {
  getGuestCartOrderId,
  setGuestCartOrderId,
  clearGuestCartOrderId,
} from "@/lib/square/cookies";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getGuestCartOrderId", () => {
  it("should return the order ID from the cookie when present", async () => {
    mockCookieStore.get.mockReturnValue({ value: "ORDER_123" });

    const result = await getGuestCartOrderId();

    expect(result).toBe("ORDER_123");
    expect(mockCookieStore.get).toHaveBeenCalledWith("guest-cart-order-id");
  });

  it("should return undefined when no cookie is set", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const result = await getGuestCartOrderId();

    expect(result).toBeUndefined();
  });

  it("should return undefined when cookie value is empty", async () => {
    mockCookieStore.get.mockReturnValue({ value: "" });

    const result = await getGuestCartOrderId();

    expect(result).toBe("");
  });
});

describe("setGuestCartOrderId", () => {
  it("should set the cookie with correct properties", async () => {
    await setGuestCartOrderId("ORDER_456");

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "guest-cart-order-id",
      "ORDER_456",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        maxAge: 604800,
        path: "/",
      }),
    );
  });

  it("should set secure flag based on environment", async () => {
    await setGuestCartOrderId("ORDER_789");

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "guest-cart-order-id",
      "ORDER_789",
      expect.objectContaining({
        secure: expect.any(Boolean),
      }),
    );
  });
});

describe("clearGuestCartOrderId", () => {
  it("should delete the cookie", async () => {
    await clearGuestCartOrderId();

    expect(mockCookieStore.delete).toHaveBeenCalledWith("guest-cart-order-id");
  });
});
