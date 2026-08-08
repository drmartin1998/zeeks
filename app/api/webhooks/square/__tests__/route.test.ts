import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.SQUARE_WEBHOOK_SIGNATURE_KEY = "test-signature-key";
process.env.SQUARE_WEBHOOK_URL = "https://example.com/api/webhooks/square";
process.env.RESEND_API_KEY = "re_test_key";

// Mock Square SDK signature verification.
const mockVerifySignature = vi.fn();
vi.mock("square", () => ({
  WebhooksHelper: {
    verifySignature: (...args: unknown[]) => mockVerifySignature(...args),
  },
}));

// Mock the email send service.
const mockSendEmail = vi.fn();
vi.mock("@/lib/email/resend", () => ({
  sendTransactionalEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

const mockOrdersGet = vi.fn();
const mockPaymentsGet = vi.fn();
vi.mock("@/lib/square/client", () => ({
  ordersApi: { get: (...args: unknown[]) => mockOrdersGet(...args) },
  paymentsApi: { get: (...args: unknown[]) => mockPaymentsGet(...args) },
}));

import { POST } from "../route";

const validBody = JSON.stringify({
  type: "payment.updated",
  event_id: "evt_1",
  data: {
    type: "payment",
    id: "PAYMENT_1",
    object: {
      payment: {
        id: "PAYMENT_1",
        order_id: "ORDER_1",
        status: "COMPLETED",
        buyerEmailAddress: "customer@example.com",
      },
    },
  },
});

function makeRequest(body = validBody, signature = "valid-sig") {
  return new Request("https://example.com/api/webhooks/square", {
    method: "POST",
    headers: { "x-square-hmacsha256-signature": signature },
    body,
  });
}

describe("POST /api/webhooks/square", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySignature.mockResolvedValue(true);
    mockSendEmail.mockResolvedValue({ success: true });
    mockPaymentsGet.mockResolvedValue({
      payment: { buyerEmailAddress: "customer@example.com" },
    });
    mockOrdersGet.mockResolvedValue({
      order: {
        id: "ORDER_1",
        lineItems: [
          {
            uid: "LI_1",
            name: "Space Marines",
            quantity: "2",
            basePriceMoney: { amount: 3500 },
            totalMoney: { amount: 7000 },
          },
        ],
        totalMoney: { amount: 7000 },
        fulfillments: [
          {
            shipmentDetails: {
              recipient: { emailAddress: "customer@example.com" },
            },
          },
        ],
      },
    });
  });

  it("should return 403 when the signature is invalid", async () => {
    mockVerifySignature.mockResolvedValue(false);
    const res = await POST(makeRequest());
    expect(res.status).toBe(403);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("should send an email for a valid payment.completed event", async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    await vi.waitFor(() => {
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });
    const email = mockSendEmail.mock.calls[0][0];
    expect(email.to.email).toBe("customer@example.com");
    expect(email.orderId).toBe("ORDER_1");
    expect(email.htmlContent).toContain("Space Marines");
    expect(email.textContent).toContain("ORDER_1");
  });

  it("should ignore non-payment.updated events", async () => {
    const res = await POST(
      makeRequest(
        JSON.stringify({
          type: "payment.created",
          data: { type: "payment", id: "P", object: {} },
        })
      )
    );
    expect(res.status).toBe(200);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("should not send for a payment.updated that is not COMPLETED", async () => {
    const res = await POST(
      makeRequest(
        JSON.stringify({
          type: "payment.updated",
          data: {
            type: "payment",
            id: "P",
            object: { payment: { id: "P", order_id: "ORDER_1", status: "PENDING" } },
          },
        })
      )
    );
    expect(res.status).toBe(200);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("should return 200 and not send if the order is missing", async () => {
    mockOrdersGet.mockResolvedValue({ order: null });
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("should still return 200 when the email send fails (fire-and-forget)", async () => {
    mockSendEmail.mockResolvedValue({ success: false });
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
  });

  it("should return 500 when webhook config is missing", async () => {
    const originalKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    delete process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
    process.env.SQUARE_WEBHOOK_SIGNATURE_KEY = originalKey;
  });

  it("should fall back to the order fulfillment email when the payment has no buyer email", async () => {
    // Payment without a buyer email → falls back to the order fulfillment.
    mockPaymentsGet.mockResolvedValue({ payment: {} });
    const body = JSON.stringify({
      type: "payment.updated",
      data: {
        type: "payment",
        id: "PAYMENT_1",
        object: {
          payment: { id: "PAYMENT_1", order_id: "ORDER_1", status: "COMPLETED" },
        },
      },
    });
    mockOrdersGet.mockResolvedValue({
      order: {
        id: "ORDER_1",
        lineItems: [
          {
            uid: "LI_1",
            name: "Space Marines",
            quantity: "2",
            basePriceMoney: { amount: 3500 },
            totalMoney: { amount: 7000 },
          },
        ],
        totalMoney: { amount: 7000 },
        fulfillments: [
          {
            pickupDetails: {
              recipient: { emailAddress: "signedin@example.com" },
            },
          },
        ],
      },
    });
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(200);
    await vi.waitFor(() => {
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });
    expect(mockSendEmail.mock.calls[0][0].to.email).toBe(
      "signedin@example.com"
    );
  });
});