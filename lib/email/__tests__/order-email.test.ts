import { describe, it, expect } from "vitest";
import { buildOrderConfirmationEmail } from "@/lib/email/order-email";

const baseInput = {
  to: "customer@example.com",
  orderId: "ORDER_1234567890",
  lineItems: [
    { name: "Space Marines", quantity: 2, unitPrice: 3500, lineTotal: 7000 },
    { name: "Dice Set", quantity: 1, unitPrice: 1200, lineTotal: 1200 },
  ],
  subtotal: { amount: 8200, currency: "USD" },
};

describe("buildOrderConfirmationEmail", () => {
  it("should include the full order ID in subject, html, and text", () => {
    const email = buildOrderConfirmationEmail(baseInput);
    expect(email.subject).toContain("ORDER_1234567890");
    expect(email.htmlContent).toContain("ORDER_1234567890");
    expect(email.textContent).toContain("ORDER_1234567890");
  });

  it("should include every line item with quantity and prices in html and text", () => {
    const email = buildOrderConfirmationEmail(baseInput);
    expect(email.htmlContent).toContain("Space Marines");
    expect(email.htmlContent).toContain("Dice Set");
    expect(email.textContent).toContain("Space Marines");
    expect(email.textContent).toContain("Dice Set");
    expect(email.textContent).toContain("2 × $35.00");
    expect(email.textContent).toContain("1 × $12.00");
  });

  it("should include the subtotal in html and text", () => {
    const email = buildOrderConfirmationEmail(baseInput);
    expect(email.htmlContent).toContain("$82.00");
    expect(email.textContent).toContain("$82.00");
  });

  it("should send to the provided recipient from the configured sender", () => {
    const email = buildOrderConfirmationEmail({ ...baseInput, to: "guest@example.com" });
    expect(email.to.email).toBe("guest@example.com");
    expect(email.sender.email).toBe("orders@zeekscg.com");
  });

  it("should provide both html and text content", () => {
    const email = buildOrderConfirmationEmail(baseInput);
    expect(email.htmlContent.length).toBeGreaterThan(0);
    expect(email.textContent.length).toBeGreaterThan(0);
  });
});