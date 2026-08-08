import { describe, it, expect } from "vitest";
import {
  CheckoutInputSchema,
  PaymentFormSchema,
  ShippingAddressSchema,
} from "@/lib/square/types";

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

describe("PaymentFormSchema", () => {
  const baseForm = {
    sourceId: "tok_123",
    orderId: "ORDER_1",
    billingName: "John Doe",
    billingAddressLine1: "123 Main St",
    billingCity: "Peoria",
    billingState: "IL",
    billingPostalCode: "61602",
    squareCustomerId: "",
  };

  it("should allow guest checkout without a billingEmail", () => {
    const result = PaymentFormSchema.safeParse(baseForm);
    expect(result.success).toBe(true);
  });

  it("should accept a valid billingEmail for guest checkout", () => {
    const result = PaymentFormSchema.safeParse({
      ...baseForm,
      billingEmail: "guest@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("should reject an invalid billingEmail", () => {
    const result = PaymentFormSchema.safeParse({
      ...baseForm,
      billingEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("ShippingAddressSchema", () => {
  const validAddress = {
    recipientName: "John Doe",
    addressLine1: "123 Main St",
    city: "Peoria",
    state: "IL",
    postalCode: "61602",
  };

  it("should accept a valid shipping address", () => {
    expect(ShippingAddressSchema.safeParse(validAddress).success).toBe(true);
  });

  it("should reject a missing recipient name", () => {
    expect(
      ShippingAddressSchema.safeParse({ ...validAddress, recipientName: "" })
        .success
    ).toBe(false);
  });

  it("should reject an invalid state code", () => {
    expect(
      ShippingAddressSchema.safeParse({ ...validAddress, state: "ILL" }).success
    ).toBe(false);
  });

  it("should reject an invalid postal code", () => {
    expect(
      ShippingAddressSchema.safeParse({ ...validAddress, postalCode: "12" })
        .success
    ).toBe(false);
  });
});
