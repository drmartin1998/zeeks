import { describe, it, expect } from "vitest";
import { CheckoutInputSchema } from "@/lib/square/types";

describe("CheckoutInputSchema", () => {
  it("should accept valid orderId and squareCustomerId", () => {
    const result = CheckoutInputSchema.safeParse({
      orderId: "ORDER_123",
      squareCustomerId: "CUST_456",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.orderId).toBe("ORDER_123");
      expect(result.data.squareCustomerId).toBe("CUST_456");
    }
  });

  it("should accept orderId without squareCustomerId (guest checkout)", () => {
    const result = CheckoutInputSchema.safeParse({
      orderId: "ORDER_123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.orderId).toBe("ORDER_123");
      expect(result.data.squareCustomerId).toBeUndefined();
    }
  });

  it("should accept orderId with empty string squareCustomerId", () => {
    const result = CheckoutInputSchema.safeParse({
      orderId: "ORDER_123",
      squareCustomerId: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.squareCustomerId).toBe("");
    }
  });

  it("should reject empty orderId", () => {
    const result = CheckoutInputSchema.safeParse({
      orderId: "",
      squareCustomerId: "CUST_456",
    });

    expect(result.success).toBe(false);
  });

  it("should reject missing orderId", () => {
    const result = CheckoutInputSchema.safeParse({
      squareCustomerId: "CUST_456",
    });

    expect(result.success).toBe(false);
  });

  it("should reject non-string orderId", () => {
    const result = CheckoutInputSchema.safeParse({
      orderId: 12345,
      squareCustomerId: "CUST_456",
    });

    expect(result.success).toBe(false);
  });
});
