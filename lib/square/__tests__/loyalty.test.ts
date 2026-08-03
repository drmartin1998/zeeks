import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.SQUARE_LOYALTY_PROGRAM_ID = "prog_test123";

const mockLoyaltySearch = vi.fn();
const mockLoyaltyCreate = vi.fn();

vi.mock("@/lib/square/client", () => ({
  loyaltyApi: {
    accounts: {
      search: (...args: unknown[]) => mockLoyaltySearch(...args),
      create: (...args: unknown[]) => mockLoyaltyCreate(...args),
    },
  },
}));

const {
  isLoyaltyConfigured,
  searchLoyaltyAccount,
  createLoyaltyAccount,
} = await import("@/lib/square/loyalty");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isLoyaltyConfigured", () => {
  it("should return true when SQUARE_LOYALTY_PROGRAM_ID is set", () => {
    expect(isLoyaltyConfigured()).toBe(true);
  });
});

describe("searchLoyaltyAccount", () => {
  it("should return the loyalty account when found", async () => {
    const account = { id: "LA_001", balance: 0 };
    mockLoyaltySearch.mockResolvedValue({
      loyaltyAccounts: [account],
    });

    const result = await searchLoyaltyAccount("CUST001");

    expect(result).toEqual(account);
    expect(mockLoyaltySearch).toHaveBeenCalledWith({
      query: { customerIds: ["CUST001"] },
      limit: 1,
    });
  });

  it("should return null when no accounts exist", async () => {
    mockLoyaltySearch.mockResolvedValue({ loyaltyAccounts: [] });

    const result = await searchLoyaltyAccount("CUST001");

    expect(result).toBeNull();
  });

  it("should return null when loyaltyAccounts is undefined", async () => {
    mockLoyaltySearch.mockResolvedValue({});

    const result = await searchLoyaltyAccount("CUST001");

    expect(result).toBeNull();
  });
});

describe("createLoyaltyAccount", () => {
  it("should create a loyalty account with correct params", async () => {
    const account = { id: "LA_NEW", balance: 0 };
    mockLoyaltyCreate.mockResolvedValue({ loyaltyAccount: account });

    const result = await createLoyaltyAccount("CUST001", "+15551234567");

    expect(result).toEqual(account);
    expect(mockLoyaltyCreate).toHaveBeenCalledWith({
      loyaltyAccount: {
        programId: "prog_test123",
        customerId: "CUST001",
        mapping: { phoneNumber: "+15551234567" },
      },
      idempotencyKey: "loyalty-CUST001",
    });
  });

  it("should return null when create response has no loyaltyAccount", async () => {
    mockLoyaltyCreate.mockResolvedValue({});

    const result = await createLoyaltyAccount("CUST001", "+15551234567");

    expect(result).toBeNull();
  });
});
