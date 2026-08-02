import { describe, it, expect, vi } from "vitest";

// Mock Square customers API
const mockSearch = vi.fn();
const mockCreate = vi.fn();

vi.mock("@/lib/square/client", () => ({
  squareClient: {},
  catalogApi: {},
  customersApi: {
    search: (...args: unknown[]) => mockSearch(...args),
    create: (...args: unknown[]) => mockCreate(...args),
  },
  locationId: "TEST_LOCATION",
  squareAccessToken: "TEST_TOKEN",
}));

import {
  findCustomerByEmail,
  createSquareCustomer,
  extractPrimaryEmail,
  maskEmail,
} from "@/lib/square/customers";
import type { ClerkWebhookEventPayload } from "@/lib/square/types";

beforeEach(() => {
  mockSearch.mockReset();
  mockCreate.mockReset();
});

// ---------------------------------------------------------------------------
// extractPrimaryEmail
// ---------------------------------------------------------------------------
describe("extractPrimaryEmail", () => {
  it("should return the primary email matched by primary_email_address_id", () => {
    const payload: ClerkWebhookEventPayload = {
      type: "user.created",
      data: {
        id: "user_1",
        first_name: "John",
        last_name: "Doe",
        email_addresses: [
          { id: "eml_1", email_address: "secondary@example.com" },
          { id: "eml_2", email_address: "primary@example.com" },
        ],
        primary_email_address_id: "eml_2",
      },
    };
    expect(extractPrimaryEmail(payload)).toBe("primary@example.com");
  });

  it("should fall back to first email when primary_email_address_id is null", () => {
    const payload: ClerkWebhookEventPayload = {
      type: "user.created",
      data: {
        id: "user_2",
        first_name: null,
        last_name: null,
        email_addresses: [{ id: "eml_1", email_address: "only@example.com" }],
        primary_email_address_id: null,
      },
    };
    expect(extractPrimaryEmail(payload)).toBe("only@example.com");
  });

  it("should return null when email_addresses is empty", () => {
    const payload: ClerkWebhookEventPayload = {
      type: "user.created",
      data: {
        id: "user_3",
        first_name: null,
        last_name: null,
        email_addresses: [],
        primary_email_address_id: null,
      },
    };
    expect(extractPrimaryEmail(payload)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// findCustomerByEmail
// ---------------------------------------------------------------------------
describe("findCustomerByEmail", () => {
  it("should return customer ID when a matching customer is found", async () => {
    mockSearch.mockResolvedValue({
      customers: [{ id: "SQ_EXISTING" }],
    });
    const id = await findCustomerByEmail("test@example.com");
    expect(id).toBe("SQ_EXISTING");
  });

  it("should return null when no customer matches", async () => {
    mockSearch.mockResolvedValue({
      customers: [],
    });
    const id = await findCustomerByEmail("unknown@example.com");
    expect(id).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// createSquareCustomer
// ---------------------------------------------------------------------------
describe("createSquareCustomer", () => {
  it("should create a customer and return the customer object", async () => {
    mockCreate.mockResolvedValue({
      customer: {
        id: "SQ_NEW",
        givenName: "Jane",
        familyName: "Doe",
        emailAddress: "jane@example.com",
      },
    });
    const customer = await createSquareCustomer(
      "jane@example.com",
      "Jane",
      "Doe",
    );
    expect(customer.id).toBe("SQ_NEW");
    expect(customer.givenName).toBe("Jane");
  });
});

// ---------------------------------------------------------------------------
// maskEmail
// ---------------------------------------------------------------------------
describe("maskEmail", () => {
  it("should mask the local part of an email", () => {
    expect(maskEmail("john@example.com")).toMatch(/j\*\*\*n@example\.com/);
  });
});
