"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getSquareCustomerId } from "@/lib/webhooks/clerk";
import { ordersApi } from "@/lib/square/client";
import { locationId } from "@/lib/square/client";
import { findOrCreateDraftOrder } from "@/lib/square/cart";
import { createPaymentLink } from "@/lib/square/checkout";
import type { AddToCartResult, CartMutationResult, CheckoutResult } from "@/lib/square/types";

export async function addToCart(
  _prevState: AddToCartResult | null,
  formData: FormData,
): Promise<AddToCartResult> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, lineItemCount: 0, error: "Sign in required" };
  }

  const squareCustomerId = await getSquareCustomerId(userId);
  if (!squareCustomerId) {
    return { success: false, lineItemCount: 0, error: "Account not synced" };
  }

  const catalogObjectId = formData.get("catalogObjectId") as string;
  const variationId = formData.get("variationId") as string;
  const quantityStr = formData.get("quantity") as string;
  const quantity = parseInt(quantityStr || "1", 10);

  if (!catalogObjectId) {
    return { success: false, lineItemCount: 0, error: "Product not found" };
  }

  if (quantity < 1) {
    return { success: false, lineItemCount: 0, error: "Invalid quantity" };
  }

  try {
    const { orderId, idempotencyKey } =
      await findOrCreateDraftOrder(squareCustomerId);

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
            variationId: variationId || undefined,
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
    } else {
      updatedLineItems = [
        ...existingLineItems.map((item) => ({
          catalogObjectId: item.catalogObjectId ?? "",
          quantity: item.quantity ?? "1",
          variationId: item.variationId || undefined,
          uid: item.uid,
        })),
        {
          catalogObjectId,
          quantity: String(quantity),
          variationId: variationId || undefined,
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

    return {
      success: true,
      lineItemCount: updatedLineItems.length,
      error: null,
    };
  } catch (error) {
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
    return { success: false, lineItems: [], subtotal: { amount: 0, currency: "USD" }, error: "Sign in required" };
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

  if (!userId) {
    return { success: false, lineItems: [], subtotal: { amount: 0, currency: "USD" }, error: "Sign in required" };
  }

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

    console.log("removeCartItem: current state", {
      orderId,
      lineItemUid,
      version: existingVersion,
      lineItemCount: existingLineItems.length,
      lineItemUids: existingLineItems.map((li) => li.uid),
    });

    const updatedLineItems = existingLineItems
      .filter((item) => item.uid !== lineItemUid)
      .map((item) => ({
        catalogObjectId: item.catalogObjectId ?? "",
        quantity: item.quantity ?? "1",
        variationId: item.variationId || undefined,
        uid: item.uid,
      }));

    const isLastItem = updatedLineItems.length === 0;

    console.log("removeCartItem: sending update", {
      remainingCount: updatedLineItems.length,
      isLastItem,
    });

    if (isLastItem) {
      await ordersApi.update({
        orderId,
        idempotencyKey: crypto.randomUUID(),
        order: {
          locationId,
          version: existingVersion,
        },
        fieldsToClear: ["line_items"],
      });
    } else {
      await ordersApi.update({
        orderId,
        idempotencyKey: crypto.randomUUID(),
        order: {
          locationId,
          lineItems: updatedLineItems,
          version: existingVersion,
        },
        fieldsToClear: [`line_items[${lineItemUid}]`],
      });
    }

    console.log("removeCartItem: Square update HTTP succeeded, verifying...");

    // Verify the update was applied - retry up to 3 times with 500ms delay
    let removalConfirmed = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 500));
      }
      order = (await ordersApi.get({ orderId })).order;
      const currentItemUids = ((order?.lineItems ?? []) as Array<{ uid?: string | null }>)
        .map((li) => li.uid);
      console.log(`removeCartItem: verification attempt ${attempt + 1}`, { lineItemUids: currentItemUids });

      if (!currentItemUids.includes(lineItemUid)) {
        console.log("removeCartItem: removal verified");
        removalConfirmed = true;
        break;
      }
      if (attempt < 2) {
        existingVersion = order?.version ?? 1;
        if (isLastItem) {
          await ordersApi.update({
            orderId,
            idempotencyKey: crypto.randomUUID(),
            order: {
              locationId,
              version: existingVersion,
            },
            fieldsToClear: ["line_items"],
          });
        } else {
          await ordersApi.update({
            orderId,
            idempotencyKey: crypto.randomUUID(),
            order: {
              locationId,
              lineItems: updatedLineItems,
              version: existingVersion,
            },
            fieldsToClear: [`line_items[${lineItemUid}]`],
          });
        }
      }
    }

    if (!removalConfirmed) {
      console.error("removeCartItem: removal not confirmed after 3 attempts");
      return { success: false, lineItems: [], subtotal: { amount: 0, currency: "USD" }, error: "Unable to remove item after multiple attempts" };
    }

    revalidatePath("/cart");

    return {
      success: true,
      lineItems: [],
      subtotal: { amount: 0, currency: "USD" },
      error: null,
    };
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

  if (!userId) {
    return {
      success: false,
      paymentLinkUrl: null,
      error: "Sign in required",
      errorCode: "UNAUTHENTICATED",
    };
  }

  const squareCustomerIdFromForm = formData.get("squareCustomerId") as string;
  const orderId = formData.get("orderId") as string;

  if (!orderId) {
    return {
      success: false,
      paymentLinkUrl: null,
      error: "No order to checkout",
      errorCode: "EMPTY_CART",
    };
  }

  const squareCustomerId = await getSquareCustomerId(userId);
  if (!squareCustomerId) {
    return {
      success: false,
      paymentLinkUrl: null,
      error: "Account setup in progress. Please try again shortly.",
      errorCode: "ACCOUNT_NOT_SYNCED",
    };
  }

  void squareCustomerIdFromForm;

  const baseUrl =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const returnUrl = `${baseUrl}/order/result`;

  const result = await createPaymentLink(squareCustomerId, returnUrl);

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
