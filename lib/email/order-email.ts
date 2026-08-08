import type { EmailLineItem, OrderConfirmationEmail } from "@/lib/square/types";

const SENDER = { email: "orders@zeekscg.com", name: "Zeeks" };

const fmt = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

/**
 * Build the order confirmation email content as a pure value.
 *
 * Produces a styled HTML body and a plain-text fallback, both containing the
 * full order ID, itemized line items (name, quantity, unit price, line total),
 * and the subtotal (FR-002). Sends from the configured sender (clarification
 * Q1) to the given recipient (FR-003/FR-004).
 */
export function buildOrderConfirmationEmail(input: {
  to: string;
  orderId: string;
  lineItems: EmailLineItem[];
  subtotal: { amount: number; currency: string };
}): OrderConfirmationEmail {
  const { to, orderId, lineItems, subtotal } = input;
  const subject = `Your Zeeks order confirmation (${orderId})`;

  const rows = lineItems
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#1a1a2e">${escapeHtml(item.name)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b6b8a;text-align:center">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b6b8a;text-align:right">${fmt(item.unitPrice)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#1a1a2e;text-align:right;font-weight:600">${fmt(item.lineTotal)}</td>
        </tr>`
    )
    .join("");

  const textRows = lineItems
    .map(
      (item) =>
        `${item.name} — ${item.quantity} × ${fmt(item.unitPrice)} = ${fmt(item.lineTotal)}`
    )
    .join("\n");

  const htmlContent = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f5f5f8;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:600px;margin:0 auto;padding:24px">
      <div style="background:#ffffff;border-radius:12px;padding:24px;border:1px solid #e5e7eb">
        <h1 style="margin:0 0 8px;color:#1a1a2e;font-size:22px">Order Confirmed!</h1>
        <p style="margin:0 0 24px;color:#6b6b8a;font-size:14px">Thank you for your purchase.</p>
        <p style="margin:0 0 20px;color:#1a1a2e;font-size:14px">
          Order ID: <strong style="font-family:monospace">${escapeHtml(orderId)}</strong>
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px 0;border-bottom:2px solid #1a1a2e;color:#1a1a2e">Item</th>
              <th style="text-align:center;padding:8px 0;border-bottom:2px solid #1a1a2e;color:#1a1a2e">Qty</th>
              <th style="text-align:right;padding:8px 0;border-bottom:2px solid #1a1a2e;color:#1a1a2e">Price</th>
              <th style="text-align:right;padding:8px 0;border-bottom:2px solid #1a1a2e;color:#1a1a2e">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:16px;padding-top:16px;border-top:2px solid #1a1a2e;text-align:right;font-size:16px;color:#1a1a2e;font-weight:700">
          Subtotal: ${fmt(subtotal.amount)}
        </div>
      </div>
    </div>
  </body>
</html>`;

  const textContent = `Order Confirmed!
Thank you for your purchase.

Order ID: ${orderId}

Items:
${textRows}

Subtotal: ${fmt(subtotal.amount)}`;

  return {
    to: { email: to },
    sender: SENDER,
    subject,
    htmlContent,
    textContent,
    orderId,
    lineItems,
    subtotal,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}