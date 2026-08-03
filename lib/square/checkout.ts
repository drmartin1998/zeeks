import { checkoutApi, ordersApi } from "@/lib/square/client";
import { locationId } from "@/lib/square/client";
import type { PaymentLink, Cart } from "@/lib/square/types";
import { getCart } from "@/lib/square/cart";

export interface CreatePaymentLinkResult {
  success: true;
  paymentLink: PaymentLink;
}

export interface CreatePaymentLinkError {
  success: false;
  error: string;
  errorCode: "ORDER_NOT_FOUND" | "EMPTY_CART" | "UNAVAILABLE_ITEMS" | "SQUARE_API_ERROR";
}

export type CheckoutAction = CreatePaymentLinkResult | CreatePaymentLinkError;

export async function createPaymentLink(params: {
  squareCustomerId?: string;
  orderId: string;
  returnUrl: string;
}): Promise<CheckoutAction> {
  const { squareCustomerId, orderId, returnUrl } = params;

  const cart: Cart | null = squareCustomerId
    ? await getCart(squareCustomerId)
    : await getCart(null, orderId);

  if (!cart) {
    return {
      success: false,
      error: "Cart not found",
      errorCode: "ORDER_NOT_FOUND",
    };
  }

  if (cart.lineItems.length === 0) {
    return {
      success: false,
      error: "Your cart is empty",
      errorCode: "EMPTY_CART",
    };
  }

  const hasUnavailable = cart.lineItems.some((item) => item.isUnavailable);
  if (hasUnavailable) {
    return {
      success: false,
      error:
        "Some items in your cart are no longer available. Please remove them to continue.",
      errorCode: "UNAVAILABLE_ITEMS",
    };
  }

  try {
    const orderResponse = await ordersApi.get({
      orderId: cart.orderId,
    });

    const fullOrder = orderResponse.order;
    if (!fullOrder) {
      return {
        success: false,
        error: "Cart not found",
        errorCode: "ORDER_NOT_FOUND",
      };
    }

    const idempotencyKey = crypto.randomUUID();

    const lineItems = ((fullOrder.lineItems ?? []) as unknown as Array<Record<string, unknown>>).map(
      (item) => {
        const catId = item["catalogObjectId"] as string;
        const rawVarId = item["variationId"] as string | undefined;
        const varId = rawVarId && rawVarId !== "" && rawVarId !== catId ? rawVarId : undefined;
        return {
          catalogObjectId: catId,
          quantity: (item["quantity"] ?? "1") as string,
          ...(varId ? { variationId: varId } : {}),
        };
      },
    );

    const response = await checkoutApi.paymentLinks.create({
      idempotencyKey,
      order: {
        locationId,
        lineItems,
      },
      checkoutOptions: {
        redirectUrl: returnUrl,
      },
    });

    const paymentLink = response.paymentLink;

    if (!paymentLink || !paymentLink.url) {
      return {
        success: false,
        error: "Failed to create payment link. Please try again.",
        errorCode: "SQUARE_API_ERROR",
      };
    }

    return {
      success: true,
      paymentLink: {
        id: paymentLink.id ?? "",
        url: paymentLink.url,
        orderId: paymentLink.orderId ?? cart.orderId,
        version: paymentLink.version,
      },
    };
  } catch (error) {
    console.error("createPaymentLink failed:", error);
    return {
      success: false,
      error:
        "Checkout is temporarily unavailable. Please try again.",
      errorCode: "SQUARE_API_ERROR",
    };
  }
}

export function validateCartForCheckout(cart: Cart | null): {
  valid: boolean;
  error: string | null;
  hasUnavailable: boolean;
} {
  if (!cart || cart.lineItems.length === 0) {
    return { valid: false, error: "Your cart is empty", hasUnavailable: false };
  }

  const hasUnavailable = cart.lineItems.some((item) => item.isUnavailable);
  if (hasUnavailable) {
    return {
      valid: false,
      error:
        "Some items in your cart are no longer available. Please remove them to continue.",
      hasUnavailable: true,
    };
  }

  return { valid: true, error: null, hasUnavailable: false };
}
