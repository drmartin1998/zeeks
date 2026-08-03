"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getSquareCustomerId } from "@/lib/webhooks/clerk";
import { ordersApi } from "@/lib/square/client";
import { locationId } from "@/lib/square/client";
import { findOrCreateDraftOrder } from "@/lib/square/cart";
import { createPaymentLink } from "@/lib/square/checkout";
import {
  getGuestCartOrderId,
  setGuestCartOrderId,
  clearGuestCartOrderId,
} from "@/lib/square/cookies";
import type { AddToCartResult, CartMutationResult, CheckoutResult } from "@/lib/square/types";

export async function addToCart(
  _prevState: AddToCartResult | null,
  formData: FormData,
): Promise<AddToCartResult> {
  const { userId } = await auth();
  const catalogObjectId = formData.get("catalogObjectId") as string;
  const variationIdRaw = formData.get("variationId") as string;
  const variationId = variationIdRaw && variationIdRaw !== catalogObjectId ? variationIdRaw : "";
  const quantityStr = formData.get("quantity") as string;
  const sanitizeVariation = (catId: string, varId?: string | null): string | undefined => {
    const v = varId ?? "";
    return v && v !== catId ? v : undefined;
  };
  const quantity = parseInt(quantityStr || "1", 10);

  if (!catalogObjectId) {
    return { success: false, lineItemCount: 0, error: "Product not found" };
  }

  if (quantity < 1) {
    return { success: false, lineItemCount: 0, error: "Invalid quantity" };
  }

  let orderId: string;
  let idempotencyKey: string;
  let isGuest = false;
  let isGuestFirstAdd = false;

  if (userId) {
    const squareCustomerId = await getSquareCustomerId(userId);
    if (!squareCustomerId) {
      return { success: false, lineItemCount: 0, error: "Account not synced" };
    }
    const result = await findOrCreateDraftOrder(squareCustomerId);
    orderId = result.orderId;
    idempotencyKey = result.idempotencyKey;
  } else {
    let existingOrderId: string | undefined;
    try {
      existingOrderId = await getGuestCartOrderId();
    } catch {
      // cookies() not available in this context — proceed without
    }
    const result = await findOrCreateDraftOrder(null, existingOrderId);
    orderId = result.orderId;
    idempotencyKey = result.idempotencyKey;
    isGuest = true;

    if (!existingOrderId) {
      isGuestFirstAdd = true;
      try {
        await setGuestCartOrderId(orderId);
      } catch {
        // cookie write failed — cart exists server-side via Square order
      }
    }
  }

  try {
    const getResponse = await ordersApi.get({ orderId });
    const existingOrder = getResponse.order;
    const existingVersion = existingOrder?.version ?? 1;
    const existingLineItems = (existingOrder?.lineItems ?? []) as Array<{
      catalogObjectId?: string;
      uid?: string;
      quantity?: string;
      variationId?: string;
    }>;

    const targetId = variationId || catalogObjectId;
    const existingIndex = existingLineItems.findIndex(
      (item) =>
        item.catalogObjectId === catalogObjectId &&
        (item.variationId ?? item.catalogObjectId) === targetId,
    );

    let updatedLineItems: Array<{
      catalogObjectId: string;
      quantity: string;
      variationId?: string;
      uid?: string;
    }>;

    if (existingIndex >= 0) {
      const existingItem = existingLineItems[existingIndex];
      const existingQty = parseInt(existingItem.quantity ?? "0", 10);
      updatedLineItems = existingLineItems.map((item, index) => {
        if (index === existingIndex) {
          return {
            catalogObjectId,
            quantity: String(existingQty + quantity),
            variationId: sanitizeVariation(catalogObjectId, variationId),
            uid: item.uid,
          };
        }
        return {
          catalogObjectId: item.catalogObjectId ?? "",
          quantity: item.quantity ?? "1",
          variationId: sanitizeVariation(item.catalogObjectId ?? "", item.variationId),
          uid: item.uid,
        };
      });
    } else {
      updatedLineItems = [
        ...existingLineItems.map((item) => ({
          catalogObjectId: item.catalogObjectId ?? "",
          quantity: item.quantity ?? "1",
          variationId: sanitizeVariation(item.catalogObjectId ?? "", item.variationId),
          uid: item.uid,
        })),
        {
          catalogObjectId,
          quantity: String(quantity),
          variationId: sanitizeVariation(catalogObjectId, variationId),
        },
      ];
    }

    await ordersApi.update({
      orderId,
      idempotencyKey,
      order: {
        locationId,
        lineItems: updatedLineItems,
        version: existingVersion,
      },
      fieldsToClear: [],
    });

    revalidatePath("/cart");

    if (isGuest) {
      try {
        await setGuestCartOrderId(orderId);
      } catch {
        // cookie write failed — non-fatal
      }
    }

    return {
      success: true,
      lineItemCount: updatedLineItems.length,
      error: null,
      ...(isGuestFirstAdd ? { guestOrderId: orderId } : {}),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("NOT_FOUND") || message.includes("not found")) {
      return {
        success: false,
        lineItemCount: 0,
        error: "This product is no longer available and cannot be added to your cart.",
      };
    }
    return {
      success: false,
      lineItemCount: 0,
      error: error instanceof Error ? error.message : "Failed to add to cart",
    };
  }
}

export async function updateCartItem(
  orderId: string,
  lineItemUid: string,
  newQuantity: number,
): Promise<CartMutationResult> {
  const { userId } = await auth();

  if (!userId) {
    const guestOrderId = await getGuestCartOrderId();
    if (!guestOrderId) {
      return { success: false, lineItems: [], subtotal: { amount: 0, currency: "USD" }, error: "Sign in required" };
    }

    if (!orderId || !lineItemUid || isNaN(newQuantity) || newQuantity < 1 || newQuantity > 99) {
      return { success: false, lineItems: [], subtotal: { amount: 0, currency: "USD" }, error: "Invalid parameters" };
    }

    try {
      const getResponse = await ordersApi.get({ orderId });
      const order = getResponse.order;
      if (!order) {
        return { success: false, lineItems: [], subtotal: { amount: 0, currency: "USD" }, error: "Order not found" };
      }
      const existingVersion = order.version ?? 1;
      const existingLineItems = (order.lineItems ?? []) as Array<{
        catalogObjectId?: string;
        uid?: string;
        quantity?: string;
        variationId?: string;
      }>;

      const updatedLineItems = existingLineItems.map((item) => {
        if (item.uid === lineItemUid) {
          return {
            catalogObjectId: item.catalogObjectId ?? "",
            quantity: String(newQuantity),
            variationId: item.variationId || undefined,
            uid: item.uid,
          };
        }
        return {
          catalogObjectId: item.catalogObjectId ?? "",
          quantity: item.quantity ?? "1",
          variationId: item.variationId || undefined,
          uid: item.uid,
        };
      });

      await ordersApi.update({
        orderId,
        idempotencyKey: crypto.randomUUID(),
        order: {
          locationId,
          lineItems: updatedLineItems,
          version: existingVersion,
        },
        fieldsToClear: [],
      });

      revalidatePath("/cart");

      return {
        success: true,
        lineItems: [],
        subtotal: { amount: 0, currency: "USD" },
        error: null,
      };
    } catch (error) {
      console.error("updateCartItem failed:", error);
      return {
        success: false,
        lineItems: [],
        subtotal: { amount: 0, currency: "USD" },
        error: error instanceof Error ? error.message : "Failed to update cart item",
      };
    }
  }

  const squareCustomerId = await getSquareCustomerId(userId);
  if (!squareCustomerId) {
    return { success: false, lineItems: [], subtotal: { amount: 0, currency: "USD" }, error: "Account not synced" };
  }

  if (!orderId || !lineItemUid || isNaN(newQuantity) || newQuantity < 1 || newQuantity > 99) {
    return { success: false, lineItems: [], subtotal: { amount: 0, currency: "USD" }, error: "Invalid parameters" };
  }

  try {
    const getResponse = await ordersApi.get({ orderId });
    const order = getResponse.order;
    if (!order) {
      return { success: false, lineItems: [], subtotal: { amount: 0, currency: "USD" }, error: "Order not found" };
    }
    const existingVersion = order.version ?? 1;
    const existingLineItems = (order.lineItems ?? []) as Array<{
      catalogObjectId?: string;
      uid?: string;
      quantity?: string;
      variationId?: string;
    }>;

    const updatedLineItems = existingLineItems.map((item) => {
      if (item.uid === lineItemUid) {
        return {
          catalogObjectId: item.catalogObjectId ?? "",
          quantity: String(newQuantity),
          variationId: item.variationId || undefined,
          uid: item.uid,
        };
      }
      return {
        catalogObjectId: item.catalogObjectId ?? "",
        quantity: item.quantity ?? "1",
        variationId: item.variationId || undefined,
        uid: item.uid,
      };
    });

    await ordersApi.update({
      orderId,
      idempotencyKey: crypto.randomUUID(),
      order: {
        locationId,
        lineItems: updatedLineItems,
        version: existingVersion,
      },
      fieldsToClear: [],
    });

    revalidatePath("/cart");

    return {
      success: true,
      lineItems: [],
      subtotal: { amount: 0, currency: "USD" },
      error: null,
    };
  } catch (error) {
    console.error("updateCartItem failed:", error);
    return {
      success: false,
      lineItems: [],
      subtotal: { amount: 0, currency: "USD" },
      error: error instanceof Error ? error.message : "Failed to update cart item",
    };
  }
}

export async function removeCartItem(
  orderId: string,
  lineItemUid: string,
): Promise<CartMutationResult> {
  const { userId } = await auth();

  // Guest path
  if (!userId) {
    const guestOrderId = await getGuestCartOrderId();
    if (!guestOrderId) {
      return { success: false, lineItems: [], subtotal: { amount: 0, currency: "USD" }, error: "Sign in required" };
    }

    if (!orderId || !lineItemUid) {
      return { success: false, lineItems: [], subtotal: { amount: 0, currency: "USD" }, error: "Invalid parameters" };
    }

    try {
      let order = (await ordersApi.get({ orderId })).order;
      if (!order) {
        return { success: false, lineItems: [], subtotal: { amount: 0, currency: "USD" }, error: "Order not found" };
      }
      let existingVersion = order.version ?? 1;
      const existingLineItems = (order.lineItems ?? []) as Array<{
        catalogObjectId?: string;
        uid?: string;
        quantity?: string;
        variationId?: string;
      }>;

      const updatedLineItems = existingLineItems
        .filter((item) => item.uid !== lineItemUid)
        .map((item) => ({
          catalogObjectId: item.catalogObjectId ?? "",
          quantity: item.quantity ?? "1",
          variationId: item.variationId || undefined,
          uid: item.uid,
        }));

      const isLastItem = updatedLineItems.length === 0;

      if (isLastItem) {
        await ordersApi.update({
          orderId,
          idempotencyKey: crypto.randomUUID(),
          order: { locationId, version: existingVersion },
          fieldsToClear: ["line_items"],
        });
      } else {
        await ordersApi.update({
          orderId,
          idempotencyKey: crypto.randomUUID(),
          order: { locationId, lineItems: updatedLineItems, version: existingVersion },
          fieldsToClear: [`line_items[${lineItemUid}]`],
        });
      }

      revalidatePath("/cart");

      return { success: true, lineItems: [], subtotal: { amount: 0, currency: "USD" }, error: null };
    } catch (error) {
      console.error("removeCartItem failed:", error);
      return {
        success: false,
        lineItems: [],
        subtotal: { amount: 0, currency: "USD" },
        error: error instanceof Error ? error.message : "Failed to remove cart item",
      };
    }
  }

  // Auth path (existing behavior)
  const squareCustomerId = await getSquareCustomerId(userId);
  if (!squareCustomerId) {
    return { success: false, lineItems: [], subtotal: { amount: 0, currency: "USD" }, error: "Account not synced" };
  }

  if (!orderId || !lineItemUid) {
    return { success: false, lineItems: [], subtotal: { amount: 0, currency: "USD" }, error: "Invalid parameters" };
  }

  try {
    let order = (await ordersApi.get({ orderId })).order;
    if (!order) {
      console.error("removeCartItem: order not found", { orderId });
      return { success: false, lineItems: [], subtotal: { amount: 0, currency: "USD" }, error: "Order not found" };
    }
    let existingVersion = order.version ?? 1;
    const existingLineItems = (order.lineItems ?? []) as Array<{
      catalogObjectId?: string;
      uid?: string;
      quantity?: string;
      variationId?: string;
    }>;

    const updatedLineItems = existingLineItems
      .filter((item) => item.uid !== lineItemUid)
      .map((item) => ({
        catalogObjectId: item.catalogObjectId ?? "",
        quantity: item.quantity ?? "1",
        variationId: item.variationId || undefined,
        uid: item.uid,
      }));

    const isLastItem = updatedLineItems.length === 0;

    if (isLastItem) {
      await ordersApi.update({
        orderId,
        idempotencyKey: crypto.randomUUID(),
        order: { locationId, version: existingVersion },
        fieldsToClear: ["line_items"],
      });
    } else {
      await ordersApi.update({
        orderId,
        idempotencyKey: crypto.randomUUID(),
        order: { locationId, lineItems: updatedLineItems, version: existingVersion },
        fieldsToClear: [`line_items[${lineItemUid}]`],
      });
    }

    revalidatePath("/cart");

    return { success: true, lineItems: [], subtotal: { amount: 0, currency: "USD" }, error: null };
  } catch (error) {
    console.error("removeCartItem failed:", error);
    return {
      success: false,
      lineItems: [],
      subtotal: { amount: 0, currency: "USD" },
      error: error instanceof Error ? error.message : "Failed to remove cart item",
    };
  }
}

export async function initiateCheckout(
  _prevState: CheckoutResult | null,
  formData: FormData,
): Promise<CheckoutResult> {
  const { userId } = await auth();
  const orderId = formData.get("orderId") as string;

  if (!orderId) {
    return {
      success: false,
      paymentLinkUrl: null,
      error: "No order to checkout",
      errorCode: "EMPTY_CART",
    };
  }

  const baseUrl =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const returnUrl = `${baseUrl}/order/result`;

  if (userId) {
    const squareCustomerId = await getSquareCustomerId(userId);
    if (!squareCustomerId) {
      return {
        success: false,
        paymentLinkUrl: null,
        error: "Account setup in progress. Please try again shortly.",
        errorCode: "ACCOUNT_NOT_SYNCED",
      };
    }

    const result = await createPaymentLink({ squareCustomerId, orderId, returnUrl });

    if (!result.success) {
      return {
        success: false,
        paymentLinkUrl: null,
        error: result.error,
        errorCode: result.errorCode,
      };
    }

    return {
      success: true,
      paymentLinkUrl: result.paymentLink.url,
      error: null,
      errorCode: null,
    };
  }

  const guestOrderId = await getGuestCartOrderId();
  if (!guestOrderId) {
    return {
      success: false,
      paymentLinkUrl: null,
      error: "Your cart is empty",
      errorCode: "EMPTY_CART",
    };
  }

  const result = await createPaymentLink({ orderId, returnUrl });

  if (!result.success) {
    return {
      success: false,
      paymentLinkUrl: null,
      error: result.error,
      errorCode: result.errorCode,
    };
  }

  return {
    success: true,
    paymentLinkUrl: result.paymentLink.url,
    error: null,
    errorCode: null,
  };
}

export async function clearCart(
  orderId: string,
): Promise<{ success: boolean; error: string | null }> {
  const { userId } = await auth();

  try {
    if (!userId) {
      const guestOrderId = await getGuestCartOrderId();
      if (!guestOrderId) {
        return { success: true, error: null };
      }
      await ordersApi.update({
        orderId,
        idempotencyKey: crypto.randomUUID(),
        order: {
          locationId,
          version: (await ordersApi.get({ orderId })).order?.version ?? 1,
        },
        fieldsToClear: ["line_items"],
      });
      await clearGuestCartOrderId();
    } else {
      await ordersApi.update({
        orderId,
        idempotencyKey: crypto.randomUUID(),
        order: {
          locationId,
          version: (await ordersApi.get({ orderId })).order?.version ?? 1,
        },
        fieldsToClear: ["line_items"],
      });
    }

    revalidatePath("/cart");
    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to clear cart",
    };
  }
}
