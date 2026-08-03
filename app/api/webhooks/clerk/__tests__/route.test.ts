import { describe, it, expect, vi } from "vitest";

process.env.CLERK_WEBHOOK_SECRET = "whsec_test";
process.env.CLERK_SECRET_KEY = "sk_test_mock";
process.env.SQUARE_LOYALTY_PROGRAM_ID = "prog_test_123";

const mockVerify = vi.fn();
vi.mock("svix", () => ({
  Webhook: vi.fn(class { verify = mockVerify }),
}));

const mockSquareSearch = vi.fn();
const mockSquareCreate = vi.fn();
const mockLoyaltyAccSearch = vi.fn();
const mockLoyaltyAccCreate = vi.fn();
vi.mock("@/lib/square/client", () => ({
  squareClient: {},
  catalogApi: {},
  customersApi: {
    search: (...args: unknown[]) => mockSquareSearch(...args),
    create: (...args: unknown[]) => mockSquareCreate(...args),
  },
  loyaltyApi: {
    accounts: {
      search: (...args: unknown[]) => mockLoyaltyAccSearch(...args),
      create: (...args: unknown[]) => mockLoyaltyAccCreate(...args),
    },
  },
  locationId: "TEST_LOCATION",
  squareAccessToken: "TEST_TOKEN",
}));

const mockClerkGetUser = vi.fn();
const mockClerkUpdateMetadata = vi.fn();
vi.mock("@clerk/backend", () => ({
  createClerkClient: vi.fn().mockReturnValue({
    users: {
      getUser: mockClerkGetUser,
      updateUserMetadata: mockClerkUpdateMetadata,
    },
  }),
}));

const { POST } = await import("../route");

function buildRequest(body: unknown, headers?: Record<string, string>): Request {
  const h = new Headers(headers);
  h.set("Content-Type", "application/json");
  return new Request("http://localhost:3000/api/webhooks/clerk", {
    method: "POST",
    headers: h,
    body: JSON.stringify(body),
  });
}

function userPayload(overrides: Record<string, unknown> = {}) {
  return {
    type: "user.created",
    data: {
      id: "user_test123",
      first_name: "John",
      last_name: "Doe",
      email_addresses: [{ id: "eml_1", email_address: "john@example.com" }],
      primary_email_address_id: "eml_1",
      phone_numbers: [{ id: "phn_1", phone_number: "+15551234567" }],
      primary_phone_number_id: "phn_1",
      ...overrides,
    },
  };
}

describe("POST /api/webhooks/clerk", () => {
  beforeEach(() => {
    mockVerify.mockReset();
    mockSquareSearch.mockReset();
    mockSquareCreate.mockReset();
    mockClerkGetUser.mockReset();
    mockClerkUpdateMetadata.mockReset();
    mockLoyaltyAccSearch.mockReset();
    mockLoyaltyAccCreate.mockReset();
  });

  describe("signature verification", () => {
    it("should return 400 when svix verification throws", async () => {
      mockVerify.mockImplementationOnce(() => { throw new Error("Invalid"); });
      const req = buildRequest({ type: "user.created", data: { id: "x" } });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("should return 200 for non-user.created event", async () => {
      mockVerify.mockReturnValueOnce({ type: "user.updated", data: { id: "x" } });
      const req = buildRequest({ type: "user.updated", data: { id: "x" } });
      const res = await POST(req);
      expect(res.status).toBe(200);
    });
  });

  describe("missing webhook secret", () => {
    it("should return 500 when CLERK_WEBHOOK_SECRET is not configured", async () => {
      vi.resetModules();
      delete process.env.CLERK_WEBHOOK_SECRET;
      vi.doMock("svix", () => ({ Webhook: vi.fn(class { verify = vi.fn() }) }));
      vi.doMock("@/lib/square/client", () => ({
        squareClient: {},
        catalogApi: {},
        customersApi: { search: vi.fn(), create: vi.fn() },
        locationId: "TEST",
        squareAccessToken: "TEST",
      }));
      vi.doMock("@clerk/backend", () => ({
        createClerkClient: vi.fn(() => ({
          users: { getUser: vi.fn(), updateUserMetadata: vi.fn() },
        })),
      }));
      const { POST: P } = await import("../route");
      const res = await P(buildRequest({}));
      expect(res.status).toBe(500);
      process.env.CLERK_WEBHOOK_SECRET = "whsec_test";
    });
  });

  describe("console logging", () => {
    it("should log event type and data ID", async () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      mockVerify.mockReturnValueOnce({ type: "user.updated", data: { id: "x" } });
      await POST(buildRequest({ type: "user.updated", data: { id: "x" } }));
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });


  // ===== US1: New user → new Square customer =====
  describe("user.created — new Square customer", () => {
    it("should create Square customer and save ID to Clerk metadata", async () => {
      mockVerify.mockReturnValueOnce(userPayload());
      mockClerkGetUser.mockResolvedValue({ privateMetadata: {} });
      mockSquareSearch.mockResolvedValue({ customers: [] });
      mockSquareCreate.mockResolvedValue({
        customer: { id: "SQ_NEW_001", givenName: "John", familyName: "Doe" },
      });
      mockClerkUpdateMetadata.mockResolvedValue({});

      const res = await POST(buildRequest(userPayload()));
      expect(res.status).toBe(200);
      expect(mockSquareCreate).toHaveBeenCalledTimes(1);
      expect(mockClerkUpdateMetadata).toHaveBeenCalledWith("user_test123", {
        privateMetadata: { squareCustomerId: "SQ_NEW_001" },
      });
    });
  });

  // ===== US1: Returning user → existing Square customer =====
  describe("user.created — existing Square customer", () => {
    it("should link existing customer without creating duplicate", async () => {
      mockVerify.mockReturnValueOnce(userPayload());
      mockClerkGetUser.mockResolvedValue({ privateMetadata: {} });
      mockSquareSearch.mockResolvedValue({ customers: [{ id: "SQ_EXISTING" }] });
      mockClerkUpdateMetadata.mockResolvedValue({});

      const res = await POST(buildRequest(userPayload()));
      expect(res.status).toBe(200);
      expect(mockSquareCreate).not.toHaveBeenCalled();
      expect(mockClerkUpdateMetadata).toHaveBeenCalledWith("user_test123", {
        privateMetadata: { squareCustomerId: "SQ_EXISTING" },
      });
    });
  });

  // ===== US2: Missing email → 400 =====
  describe("user.created — missing email", () => {
    it("should return 400 when user has no email addresses", async () => {
      mockVerify.mockReturnValueOnce(
        userPayload({ email_addresses: [], primary_email_address_id: null }),
      );
      const res = await POST(
        buildRequest(userPayload({ email_addresses: [], primary_email_address_id: null })),
      );
      expect(res.status).toBe(400);
      expect(mockSquareSearch).not.toHaveBeenCalled();
    });
  });

  // ===== US2: Square API error → 500 =====
  describe("user.created — Square API error", () => {
    it("should return 500 when Square search fails", async () => {
      mockVerify.mockReturnValueOnce(userPayload());
      mockClerkGetUser.mockResolvedValue({ privateMetadata: {} });
      mockSquareSearch.mockRejectedValue(new Error("Network error"));

      const res = await POST(buildRequest(userPayload()));
      expect(res.status).toBe(500);
      expect(mockClerkUpdateMetadata).not.toHaveBeenCalled();
    });
  });

  // ===== US2: User without name =====
  describe("user.created — user without name", () => {
    it("should create Square customer with email only", async () => {
      mockVerify.mockReturnValueOnce(
        userPayload({ first_name: null, last_name: null }),
      );
      mockClerkGetUser.mockResolvedValue({ privateMetadata: {} });
      mockSquareSearch.mockResolvedValue({ customers: [] });
      mockSquareCreate.mockResolvedValue({
        customer: { id: "SQ_NONAME" },
      });
      mockClerkUpdateMetadata.mockResolvedValue({});

      const res = await POST(
        buildRequest(userPayload({ first_name: null, last_name: null })),
      );
      expect(res.status).toBe(200);
    });
  });

  // ===== US3: Idempotent skip =====
  describe("user.created — idempotent skip", () => {
    it("should return 200 when squareCustomerId already exists", async () => {
      mockVerify.mockReturnValueOnce(userPayload());
      mockClerkGetUser.mockResolvedValue({
        privateMetadata: { squareCustomerId: "SQ_ALREADY_SET" },
      });

      const res = await POST(buildRequest(userPayload()));
      expect(res.status).toBe(200);
      expect(mockSquareSearch).not.toHaveBeenCalled();
      expect(mockSquareCreate).not.toHaveBeenCalled();
    });
  });

  // ===== US1 Loyalty: New user → enrolled in loyalty =====
  describe("user.created — loyalty enrollment", () => {
    const loyaltyAccount = { id: "LA_NEW", balance: 0 };

    it("should create loyalty account for new user with phone", async () => {
      mockVerify.mockReturnValueOnce(userPayload());
      mockClerkGetUser.mockResolvedValue({ privateMetadata: {} });
      mockSquareSearch.mockResolvedValue({ customers: [] });
      mockSquareCreate.mockResolvedValue({
        customer: { id: "SQ_NEW" },
      });
      mockClerkUpdateMetadata.mockResolvedValue({});
      mockLoyaltyAccSearch.mockResolvedValue({ loyaltyAccounts: [] });
      mockLoyaltyAccCreate.mockResolvedValue({ loyaltyAccount });

      const res = await POST(buildRequest(userPayload()));

      expect(res.status).toBe(200);
      expect(mockLoyaltyAccSearch).toHaveBeenCalledWith({
        query: { customerIds: ["SQ_NEW"] },
        limit: 1,
      });
      expect(mockLoyaltyAccCreate).toHaveBeenCalledWith({
        loyaltyAccount: {
          programId: "prog_test_123",
          customerId: "SQ_NEW",
          mapping: { phoneNumber: "+15551234567" },
        },
        idempotencyKey: "loyalty-SQ_NEW",
      });
    });

    it("should skip loyalty enrollment when user has no phone", async () => {
      mockVerify.mockReturnValueOnce(
        userPayload({ phone_numbers: [], primary_phone_number_id: null }),
      );
      mockClerkGetUser.mockResolvedValue({ privateMetadata: {} });
      mockSquareSearch.mockResolvedValue({ customers: [] });
      mockSquareCreate.mockResolvedValue({
        customer: { id: "SQ_NOPHONE" },
      });
      mockClerkUpdateMetadata.mockResolvedValue({});

      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const res = await POST(
        buildRequest(userPayload({ phone_numbers: [], primary_phone_number_id: null })),
      );

      expect(res.status).toBe(200);
      expect(mockLoyaltyAccSearch).not.toHaveBeenCalled();
      expect(mockLoyaltyAccCreate).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  // ===== US2 Loyalty: Idempotent — existing loyalty account =====
  describe("user.created — existing loyalty account", () => {
    it("should skip creation when loyalty account already exists", async () => {
      mockVerify.mockReturnValueOnce(userPayload());
      mockClerkGetUser.mockResolvedValue({ privateMetadata: {} });
      mockSquareSearch.mockResolvedValue({ customers: [] });
      mockSquareCreate.mockResolvedValue({
        customer: { id: "SQ_NEW" },
      });
      mockClerkUpdateMetadata.mockResolvedValue({});
      mockLoyaltyAccSearch.mockResolvedValue({
        loyaltyAccounts: [{ id: "LA_EXIST", balance: 100 }],
      });

      const res = await POST(buildRequest(userPayload()));

      expect(res.status).toBe(200);
      expect(mockLoyaltyAccCreate).not.toHaveBeenCalled();
    });
  });

  // ===== US3 Loyalty: Graceful degradation =====
  describe("user.created — loyalty API errors", () => {
    it("should return 200 when loyalty search fails", async () => {
      mockVerify.mockReturnValueOnce(userPayload());
      mockClerkGetUser.mockResolvedValue({ privateMetadata: {} });
      mockSquareSearch.mockResolvedValue({ customers: [] });
      mockSquareCreate.mockResolvedValue({
        customer: { id: "SQ_NEW" },
      });
      mockClerkUpdateMetadata.mockResolvedValue({});
      mockLoyaltyAccSearch.mockRejectedValue(new Error("Loyalty API down"));

      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const res = await POST(buildRequest(userPayload()));

      expect(res.status).toBe(200);
      expect(mockClerkUpdateMetadata).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("should return 200 when loyalty create fails", async () => {
      mockVerify.mockReturnValueOnce(userPayload());
      mockClerkGetUser.mockResolvedValue({ privateMetadata: {} });
      mockSquareSearch.mockResolvedValue({ customers: [] });
      mockSquareCreate.mockResolvedValue({
        customer: { id: "SQ_NEW" },
      });
      mockClerkUpdateMetadata.mockResolvedValue({});
      mockLoyaltyAccSearch.mockResolvedValue({ loyaltyAccounts: [] });
      mockLoyaltyAccCreate.mockRejectedValue(new Error("Create failed"));

      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const res = await POST(buildRequest(userPayload()));

      expect(res.status).toBe(200);
      expect(mockClerkUpdateMetadata).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});