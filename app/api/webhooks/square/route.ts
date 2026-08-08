import { NextResponse } from "next/server";
import { WebhooksHelper } from "square";
import { buildOrderConfirmationEmail } from "@/lib/email/order-email";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { getCart } from "@/lib/square/cart";
import type {
  PaymentCompletedEventObject,
  SquareWebhookEvent,
} from "@/lib/square/types";

/**
 * Square webhook endpoint.
 *
 * Subscribed to the `payment.updated` event (Square has no `payment.completed`
 * event). Verifies the HMAC signature, and for a `payment.updated` event where
 * the payment reached COMPLETED, fetches the order and sends an
 * order-confirmation email to the customer. The email send is fire-and-forget
 * and never blocks checkout (clarification Q2, FR-006); on send failure it is
 * logged and skipped (clarification Q5).
 */
export async function POST(req: Request) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const notificationUrl = process.env.SQUARE_WEBHOOK_URL;

  if (!signatureKey || !notificationUrl) {
    console.error("Square webhook: missing signature key or notification URL");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  const rawBody = await req.text();
  const signature =
    req.headers.get("x-square-hmacsha256-signature") ?? "";

  // Verify the payload originated from Square. Invalid signatures are
  // discarded with 403 (FR security).
  const isValid = await WebhooksHelper.verifySignature({
    requestBody: rawBody,
    signatureHeader: signature,
    signatureKey,
    notificationUrl,
  });
  if (!isValid) {
    console.error("Square webhook: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let event: SquareWebhookEvent<PaymentCompletedEventObject>;
  try {
    event = JSON.parse(rawBody) as SquareWebhookEvent<PaymentCompletedEventObject>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Only handle payment.completed; ignore all other events (return 200).
  // Only handle payment.updated where the payment reached COMPLETED. Square
  // does not have a `payment.completed` event; `payment.updated` fires on
  // status changes, so we verify the status is COMPLETED before sending.
  if (event.type !== "payment.updated") {
    return NextResponse.json({ success: true });
  }

  const payment = event.data?.object?.payment;
  const status = payment?.status;
  if (status !== "COMPLETED" && status !== "APPROVED") {
    return NextResponse.json({ success: true });
  }

  const orderId = payment?.order_id;
  const paymentId = payment?.id;
  if (!orderId) {
    console.error("Square webhook: payment.updated missing order_id");
    return NextResponse.json({ success: true });
  }

  // Fetch the order and resolve the customer email, then send the email
  // (fire-and-forget — do not await a failure that would block the response).
  // The webhook event payload does not include the buyer email, so we pass the
  // payment id and resolve the email from the Payments API / order fulfillment.
  void handleOrderConfirmation(orderId, paymentId).catch((error) => {
    console.error(
      "Square webhook: order confirmation failed:",
      error instanceof Error ? error.message : error
    );
  });

  return NextResponse.json({ success: true });
}

/**
 * Fetch the order, resolve the recipient email, build the confirmation email,
 * and send it via Resend. Failures are logged and skipped (no retry).
 */
async function handleOrderConfirmation(
  orderId: string,
  paymentId?: string
): Promise<void> {
  const order = await getCart(null, orderId);
  if (!order || order.lineItems.length === 0) {
    console.error(`Square webhook: order not found or empty for ${orderId}`);
    return;
  }

  // Resolve the recipient: the webhook event does not carry the buyer email,
  // so fetch the payment (which has `buyerEmailAddress`) and fall back to the
  // order's fulfillment recipient email.
  const recipientEmail = await resolveRecipientEmail(orderId, paymentId);
  if (!recipientEmail) {
    console.error(`Square webhook: no recipient email for order ${orderId}`);
    return;
  }

  console.log('recipient email::  ' + recipientEmail)

  const email = buildOrderConfirmationEmail({
    to: recipientEmail,
    orderId,
    lineItems: order.lineItems.map((item) => ({
      name: item.name,
      quantity: Number(item.quantity) || 1,
      unitPrice: item.unitPrice.amount,
      lineTotal: item.lineTotal.amount,
    })),
    subtotal: order.subtotal,
  });

  const result = await sendTransactionalEmail(email);
  if (!result.success) {
    console.error(`Square webhook: email send failed for order ${orderId}`);
  }
}

/**
 * Resolve the customer email for an order.
 *
 * The webhook event payload does not include the buyer email, so this fetches
 * the payment by ID (which carries `buyerEmailAddress`) and falls back to the
 * order's fulfillment recipient email. The email is never fabricated
 * (FR-008).
 */
async function resolveRecipientEmail(
  orderId: string,
  paymentId?: string
): Promise<string | null> {
  // 1) Prefer the payment's buyer email (reliable for guests and signed-in
  //    customers, captured at checkout).
  if (paymentId) {
    console.log(`payment received - retreieving`)
    try {
      const { paymentsApi } = await import("@/lib/square/client");
      const paymentResp = await paymentsApi.get({ paymentId });
      const buyerEmail = paymentResp.payment?.buyerEmailAddress;
      console.dir(paymentResp.payment)
      console.log('payment email ' + buyerEmail)
      if (buyerEmail && buyerEmail.length > 0) return buyerEmail;
    } catch (error) {
      console.error(
        `Square webhook: failed to fetch payment ${paymentId}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  // 2) Fall back to the order's fulfillment recipient email.
  try {
    const { ordersApi } = await import("@/lib/square/client");
    const response = await ordersApi.get({ orderId });
    console.log('getting order')
    console.dir(response)
    const raw =
      response.order as unknown as Record<string, unknown> | undefined;
    const fulfillment = (
      raw?.fulfillments as Record<string, unknown>[] | undefined
    )?.[0];
    const shipAddress = fulfillment?.shipmentDetails as
      | Record<string, unknown>
      | undefined;
    const pickupDetails = fulfillment?.pickupDetails as
      | Record<string, unknown>
      | undefined;
    const recipient = (
      shipAddress?.recipient || pickupDetails?.recipient
    ) as { emailAddress?: string } | undefined;
    const email = recipient?.emailAddress;
    return email && email.length > 0 ? email : null;
  } catch (error) {
    console.error(
      `Square webhook: failed to resolve fulfillment email for ${orderId}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}