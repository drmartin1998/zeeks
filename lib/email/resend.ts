import { Resend } from "resend";
import type { OrderConfirmationEmail } from "@/lib/square/types";

/**
 * Send a transactional email via Resend.
 *
 * Fire-and-forget: on success it resolves; on any failure (missing key, Resend
 * error) it logs the error and resolves without throwing, so the caller /
 * webhook is never blocked (FR-006, FR-007, clarification Q5). No retry.
 */
export async function sendTransactionalEmail(
  message: OrderConfirmationEmail
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("sendTransactionalEmail: RESEND_API_KEY is not configured");
    return { success: false, error: "RESEND_API_KEY is not configured" };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: `${message.sender.name} <${message.sender.email}>`,
      to: [message.to.email],
      subject: message.subject,
      html: message.htmlContent,
      text: message.textContent,
    });
    if (error) {
      console.error(
        "sendTransactionalEmail: Resend send failed:",
        error.message
      );
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    console.error(
      "sendTransactionalEmail: Resend send failed:",
      error instanceof Error ? error.message : error
    );
    return { success: false, error: "Resend send failed" };
  }
}