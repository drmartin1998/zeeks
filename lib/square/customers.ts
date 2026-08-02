import { customersApi } from "@/lib/square/client";
import type {
  SquareCustomer,
  ClerkWebhookEventPayload,
} from "@/lib/square/types";

/**
 * Searches Square for a customer by email address.
 * Returns the first matching customer ID or null if not found.
 */
export async function findCustomerByEmail(
  email: string,
): Promise<string | null> {
  const response = await customersApi.search({
    query: {
      filter: {
        emailAddress: {
          fuzzy: email,
        },
      },
    },
    limit: 10n,
  });

  const customers = response.customers;
  if (!customers || customers.length === 0) {
    return null;
  }

  if (customers.length > 1) {
    console.warn(
      `Multiple Square customers found for email ${maskEmail(email)} — using first result (ID: ${customers[0].id})`,
    );
  }

  return customers[0].id ?? null;
}

/**
 * Creates a new Square customer with the given details.
 * Returns the newly created customer.
 */
export async function createSquareCustomer(
  email: string,
  givenName?: string | null,
  familyName?: string | null,
): Promise<SquareCustomer> {
  const response = await customersApi.create({
    idempotencyKey: crypto.randomUUID(),
    emailAddress: email,
    givenName: givenName ?? undefined,
    familyName: familyName ?? undefined,
  });

  const customer = response.customer;
  if (!customer?.id) {
    throw new Error("Square customer creation returned no customer ID");
  }

  return {
    id: customer.id,
    givenName: customer.givenName ?? undefined,
    familyName: customer.familyName ?? undefined,
    emailAddress: customer.emailAddress ?? undefined,
  };
}

/**
 * Extracts the primary email address from a Clerk webhook event payload.
 * Matches by primary_email_address_id, falls back to first email in array.
 * Returns null if no email addresses exist.
 */
export function extractPrimaryEmail(
  payload: ClerkWebhookEventPayload,
): string | null {
  const emails = payload.data.email_addresses;
  if (!emails || emails.length === 0) {
    return null;
  }

  const primaryId = payload.data.primary_email_address_id;
  if (primaryId) {
    const primary = emails.find((e) => e.id === primaryId);
    if (primary) {
      return primary.email_address;
    }
  }

  // Fallback to first email
  return emails[0].email_address;
}

/**
 * Masks an email address for logging (e.g., "j***@example.com").
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";
  const masked =
    localPart.length <= 2
      ? localPart[0] + "***"
      : localPart[0] + "***" + localPart[localPart.length - 1];
  return `${masked}@${domain}`;
}
