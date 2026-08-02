import { NextResponse } from "next/server";
import { Webhook } from "svix";

const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET;

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
  };
}

export async function POST(
  req: Request,
): Promise<NextResponse<{ error: string } | { success: true }>> {
  // Fail early if the webhook secret is not configured
  if (!clerkWebhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // Extract Svix headers required for signature verification
  const svixId = req.headers.get("svix-id") ?? "";
  const svixTimestamp = req.headers.get("svix-timestamp") ?? "";
  const svixSignature = req.headers.get("svix-signature") ?? "";

  // Read the raw request body — must NOT be pre-parsed as JSON
  // or the signature verification will fail
  const rawBody = await req.text();

  // Verify the webhook signature
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

  // Parse the verified payload as a Clerk webhook event
  const evt = verifiedPayload as ClerkWebhookEvent;

  // Log the event type and data ID for observability
  console.log(
    `Clerk webhook received — type: ${evt.type}, data.id: ${evt.data.id}`,
  );

  return NextResponse.json({ success: true }, { status: 200 });
}
