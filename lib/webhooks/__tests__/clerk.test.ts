import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @clerk/backend before importing the module under test
const mockGetUser = vi.fn();
const mockUpdateUserMetadata = vi.fn();

vi.mock("@clerk/backend", () => ({
  createClerkClient: vi.fn().mockReturnValue({
    users: {
      getUser: mockGetUser,
      updateUserMetadata: mockUpdateUserMetadata,
    },
  }),
}));

// Ensure env var is set BEFORE importing the module under test
process.env.CLERK_SECRET_KEY = "sk_test_mock";

const {
  getSquareCustomerId,
  setSquareCustomerId,
  SQUARE_CUSTOMER_ID_KEY,
} = await import("@/lib/webhooks/clerk");

describe("getSquareCustomerId", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
  });

  it("should return squareCustomerId when present in privateMetadata", async () => {
    mockGetUser.mockResolvedValue({
      privateMetadata: { squareCustomerId: "SQ_TEST_123" },
    });

    const id = await getSquareCustomerId("user_1");
    expect(id).toBe("SQ_TEST_123");
    expect(mockGetUser).toHaveBeenCalledWith("user_1");
  });

  it("should return null when squareCustomerId is not set", async () => {
    mockGetUser.mockResolvedValue({
      privateMetadata: {},
    });

    const id = await getSquareCustomerId("user_2");
    expect(id).toBeNull();
  });

  it("should return null when privateMetadata is empty object", async () => {
    mockGetUser.mockResolvedValue({
      privateMetadata: {},
    });

    const id = await getSquareCustomerId("user_3");
    expect(id).toBeNull();
  });
});

describe("setSquareCustomerId", () => {
  beforeEach(() => {
    mockUpdateUserMetadata.mockReset();
  });

  it("should call updateUserMetadata with correct squareCustomerId", async () => {
    mockUpdateUserMetadata.mockResolvedValue({});

    await setSquareCustomerId("user_1", "SQ_NEW_456");

    expect(mockUpdateUserMetadata).toHaveBeenCalledTimes(1);
    expect(mockUpdateUserMetadata).toHaveBeenCalledWith("user_1", {
      privateMetadata: {
        [SQUARE_CUSTOMER_ID_KEY]: "SQ_NEW_456",
      },
    });
  });

  it("should propagate errors from the Clerk SDK", async () => {
    mockUpdateUserMetadata.mockRejectedValue(new Error("Clerk API error"));

    await expect(setSquareCustomerId("user_1", "SQ_ERR")).rejects.toThrow(
      "Clerk API error",
    );
  });
});
