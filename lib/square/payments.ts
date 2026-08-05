import { paymentsApi, ordersApi, locationId } from "@/lib/square/client";

const KNOWN_DECLINE_CODES: Record<string, string> = {
  CARD_DECLINED: "Your card was declined. Please try a different card.",
  CARD_DECLINED_INSUFFICIENT_FUNDS: "Insufficient funds. Please try a different card.",
  CARD_DECLINED_CALL_ISSUER: "Your card was declined. Please contact your card issuer.",
  CARD_EXPIRED: "Your card has expired. Please use a different card.",
  INVALID_CARD_DATA: "The card information you entered is invalid. Please check and try again.",
  GENERIC_DECLINE: "Payment could not be processed. Please try again or use a different card.",
};

function mapDeclineError(errors?: Array<{ code?: string; detail?: string }>): string {
  if (!errors || errors.length === 0) return "Payment could not be processed.";
  for (const err of errors) {
    if (err.code && KNOWN_DECLINE_CODES[err.code]) {
      return KNOWN_DECLINE_CODES[err.code];
    }
  }
  return errors[0]?.detail ?? "Payment could not be processed.";
}

export async function processCardPayment(params: {
  sourceId: string;
  orderId: string;
  amountCents: number;
  currency?: string;
  squareCustomerId: string;
  billingName: string;
  billingAddressLine1: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
}): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  const idempotencyKey = `payment-${params.orderId}`;
  const currency = params.currency ?? "USD";

  try {
    const response = await paymentsApi.create({
      sourceId: params.sourceId,
      idempotencyKey,
      amountMoney: {
        amount: BigInt(params.amountCents),
        currency: currency as "USD",
      } as { amount: bigint; currency: "USD" },
      orderId: params.orderId,
      locationId,
      customerId: params.squareCustomerId,
      billingAddress: {
        addressLine1: params.billingAddressLine1,
        locality: params.billingCity,
        administrativeDistrictLevel1: params.billingState,
        postalCode: params.billingPostalCode,
      },
    });

    if (response.errors && response.errors.length > 0) {
      return { success: false, error: mapDeclineError(response.errors) };
    }

    const payment = response.payment;
    if (!payment) {
      return { success: false, error: "Payment could not be processed." };
    }

    const status = payment.status ?? "";
    if (status === "COMPLETED" || status === "APPROVED") {
      return {
        success: true,
        transactionId: payment.id ?? undefined,
      };
    }

    if (status === "FAILED") {
      return { success: false, error: mapDeclineError(response.errors as Array<{ code?: string; detail?: string }> | undefined) };
    }

    return { success: false, error: "Payment is pending. Please check your order status." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment service unavailable";
    return { success: false, error: message };
  }
}
