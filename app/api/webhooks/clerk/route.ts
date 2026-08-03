import { NextResponse } from "next/server";
import { Webhook } from "svix";
import type { ClerkWebhookEventPayload } from "@/lib/square/types";
import {
  findCustomerByEmail,
  createSquareCustomer,
  extractPrimaryEmail,
  maskEmail,
} from "@/lib/square/customers";
import {
  getSquareCustomerId,
  setSquareCustomerId,
} from "@/lib/webhooks/clerk";
import { withRetry } from "@/lib/webhooks/retry";
import {
  isLoyaltyConfigured,
  searchLoyaltyAccount,
  createLoyaltyAccount,
} from "@/lib/square/loyalty";

const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(
  req: Request,
): Promise<NextResponse<{ error: string } | { success: true }>> {
  if (!clerkWebhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const svixId = req.headers.get("svix-id") ?? "";
  const svixTimestamp = req.headers.get("svix-timestamp") ?? "";
  const svixSignature = req.headers.get("svix-signature") ?? "";
  const rawBody = await req.text();

  const wh = new Webhook(clerkWebhookSecret);
  let verifiedPayload: unknown;
  try {
    verifiedPayload = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  const evt = verifiedPayload as ClerkWebhookEventPayload;

  console.log(
    `Clerk webhook received — type: ${evt.type}, data.id: ${evt.data.id}`,
  );

  // Only process user.created events (T020 event type guard)
  if (evt.type !== "user.created") {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  try {
    return await handleUserCreated(evt);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Clerk webhook user.created failed — user: ${evt.data.id}, error: ${msg}`,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function handleUserCreated(
  evt: ClerkWebhookEventPayload,
): Promise<NextResponse<{ error: string } | { success: true }>> {
  const userId = evt.data.id;
  const email = extractPrimaryEmail(evt);

  if (!email) {
    console.warn(`Clerk webhook user.created missing email — user: ${userId}`);
    return NextResponse.json(
      { error: "User has no email address" },
      { status: 400 },
    );
  }

  const masked = maskEmail(email);

  // Idempotency check
  let existingId: string | null;
  try {
    existingId = await getSquareCustomerId(userId);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to read Clerk metadata — user: ${userId}, error: ${msg}`);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  if (existingId) {
    console.log(`user.created skipped (already synced) — user: ${userId}, squareCustomerId: ${existingId}`);
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // Search Square for existing customer (with retry)
  let squareCustomerId: string;
  try {
    squareCustomerId = (await withRetry(() => findCustomerByEmail(email))) ?? "";
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`Square customer search failed — user: ${userId}, email: ${masked}, error: ${msg}`);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // If not found, create new Square customer (with retry)
  if (!squareCustomerId) {
    try {
      const customer = await withRetry(() =>
        createSquareCustomer(email, evt.data.first_name, evt.data.last_name),
      );
      squareCustomerId = customer.id;
      console.log(`Square customer created — user: ${userId}, email: ${masked}, squareCustomerId: ${squareCustomerId}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error(`Square customer creation failed — user: ${userId}, email: ${masked}, error: ${msg}`);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  } else {
    console.log(`Square customer found by email — user: ${userId}, email: ${masked}, squareCustomerId: ${squareCustomerId}`);
  }

  // Save to Clerk metadata
  try {
    await setSquareCustomerId(userId, squareCustomerId);
    console.log(`Clerk metadata updated — user: ${userId}, squareCustomerId: ${squareCustomerId}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`Clerk metadata update failed (Square customer orphaned) — user: ${userId}, squareCustomerId: ${squareCustomerId}, error: ${msg}`);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // Enroll in loyalty program (non-blocking)
  await enrollInLoyalty(squareCustomerId, userId, evt);

  return NextResponse.json({ success: true }, { status: 200 });
}

function extractPrimaryPhone(
  evt: ClerkWebhookEventPayload,
): string | null {
  const phones = evt.data.phone_numbers;
  if (!phones || phones.length === 0) return null;

  if (evt.data.primary_phone_number_id) {
    const primary = phones.find(
      (p) => p.id === evt.data.primary_phone_number_id,
    );
    if (primary) return primary.phone_number;
  }

  return phones[0].phone_number ?? null;
}

async function enrollInLoyalty(
  squareCustomerId: string,
  userId: string,
  evt: ClerkWebhookEventPayload,
): Promise<void> {
  if (!isLoyaltyConfigured()) {
    console.warn(
      `Loyalty enrollment skipped (no program configured) — user: ${userId}, squareCustomerId: ${squareCustomerId}`,
    );
    return;
  }

  const phone = extractPrimaryPhone(evt);
  if (!phone) {
    console.warn(
      `Loyalty enrollment skipped (no phone number) — user: ${userId}, squareCustomerId: ${squareCustomerId}`,
    );
    return;
  }

  try {
    const existing = await withRetry(() =>
      searchLoyaltyAccount(squareCustomerId),
    );

    if (existing) {
      console.log(
        `Loyalty account already exists — user: ${userId}, squareCustomerId: ${squareCustomerId}, loyaltyAccountId: ${existing.id}`,
      );
      return;
    }

    const account = await withRetry(() =>
      createLoyaltyAccount(squareCustomerId, phone),
    );

    console.log(
      `Loyalty account created — user: ${userId}, squareCustomerId: ${squareCustomerId}, loyaltyAccountId: ${account?.id}`,
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Loyalty enrollment failed (non-blocking) — user: ${userId}, squareCustomerId: ${squareCustomerId}, error: ${msg}`,
    );
  }
}
