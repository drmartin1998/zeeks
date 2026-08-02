import { describe, it, expect, vi } from "vitest";

// ---------------------------------------------------------------------------
// Ensure CLERK_WEBHOOK_SECRET is set BEFORE the route module loads.
// The module reads process.env at import time, so it must be set here.
// ---------------------------------------------------------------------------
process.env.CLERK_WEBHOOK_SECRET = "whsec_test";

// ---------------------------------------------------------------------------
// Mock the svix Webhook class so we control verify() behaviour.
// ---------------------------------------------------------------------------
const mockVerify = vi.fn();
vi.mock("svix", () => ({
  Webhook: vi.fn().mockImplementation(() => ({
    verify: mockVerify,
  })),
}));

// Dynamic import AFTER mocks are in place
const { POST } = await import("../route");

// ---------------------------------------------------------------------------
// Helper: build a minimal Request for POST handler tests
// ---------------------------------------------------------------------------
function buildRequest(body: unknown, headers?: Record<string, string>): Request {
  const h = new Headers(headers);
  h.set("Content-Type", "application/json");
  return new Request("http://localhost:3000/api/webhooks/clerk", {
    method: "POST",
    headers: h,
    body: JSON.stringify(body),
  });
}

describe("POST /api/webhooks/clerk", () => {
  beforeEach(() => {
    mockVerify.mockReset();
  });

  // ---- US1: invalid signature → 400 ----
  describe("signature verification", () => {
    it("should return 400 when svix verification throws (invalid signature)", async () => {
      mockVerify.mockImplementationOnce(() => {
        throw new Error("Invalid signature");
      });

      const req = buildRequest({
        type: "user.created",
        data: { id: "user_123" },
      });
      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({ error: "Invalid webhook signature" });
    });

    it("should return 400 when svix verification throws (missing headers scenario)", async () => {
      mockVerify.mockImplementationOnce(() => {
        throw new Error("Missing required headers");
      });

      const req = buildRequest(
        { type: "user.updated", data: { id: "user_456" } },
        {}
      );
      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({ error: "Invalid webhook signature" });
    });

    it("should return 200 when svix verification succeeds", async () => {
      mockVerify.mockReturnValueOnce({
        type: "user.created",
        data: { id: "user_test123" },
      });

      const req = buildRequest({
        type: "user.created",
        data: { id: "user_test123" },
      });
      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });

  // ---- US1: missing secret → 500 ----
  // Because CLERK_WEBHOOK_SECRET is read at module import time,
  // we must reset modules and re-import without the env var set.
  describe("missing webhook secret", () => {
    it("should return 500 when CLERK_WEBHOOK_SECRET is not configured", async () => {
      vi.resetModules();
      delete process.env.CLERK_WEBHOOK_SECRET;

      vi.doMock("svix", () => ({
        Webhook: vi.fn().mockImplementation(() => ({
          verify: vi.fn(),
        })),
      }));

      const { POST: POST_NO_SECRET } = await import("../route");
      const req = buildRequest({});
      const response = await POST_NO_SECRET(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({ error: "Webhook secret not configured" });

      process.env.CLERK_WEBHOOK_SECRET = "whsec_test";
    });
  });

  // ---- US2: console logging ----
  describe("console logging", () => {
    it("should log event type and data ID on successful verification", async () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      mockVerify.mockReturnValueOnce({
        type: "user.created",
        data: { id: "user_test123" },
      });

      const req = buildRequest({
        type: "user.created",
        data: { id: "user_test123" },
      });
      const response = await POST(req);

      expect(response.status).toBe(200);
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(
        "Clerk webhook received — type: user.created, data.id: user_test123",
      );

      logSpy.mockRestore();
    });

    it("should log event type and data ID for any event type", async () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      mockVerify.mockReturnValueOnce({
        type: "user.updated",
        data: { id: "user_456" },
      });

      const req = buildRequest({
        type: "user.updated",
        data: { id: "user_456" },
      });
      const response = await POST(req);

      expect(response.status).toBe(200);
      expect(logSpy).toHaveBeenCalledWith(
        "Clerk webhook received — type: user.updated, data.id: user_456",
      );

      logSpy.mockRestore();
    });
  });
});
