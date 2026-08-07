"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getSquareCustomerId } from "@/lib/webhooks/clerk";
import { ordersApi } from "@/lib/square/client";
import { locationId } from "@/lib/square/client";
import { findOrCreateDraftOrder } from "@/lib/square/cart";
import {
  getGuestCartOrderId,
  setGuestCartOrderId,
  clearGuestCartOrderId,
} from "@/lib/square/cookies";
import { createLoyaltyReward, deleteLoyaltyReward, getFirstIssuedReward, cleanupStaleRewards } from "@/lib/square/loyalty";
import { processCardPayment } from "@/lib/square/payments";
import { PaymentFormSchema } from "@/lib/square/types";
import type {
  AddToCartResult,
  CartMutationResult,
  PaymentResult,
  SelectRewardResult,
  DeselectRewardResult,
} from "@/lib/square/types";

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
      const order = (await ordersApi.get({ orderId })).order;
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
    const order = (await ordersApi.get({ orderId })).order;
    if (!order) {
      console.error("removeCartItem: order not found", { orderId });
      return { success: false, lineItems: [], subtotal: { amount: 0, currency: "USD" }, error: "Order not found" };
    }
    const existingVersion = order.version ?? 1;
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

export async function processPayment(
  _prevState: PaymentResult | null,
  formData: FormData,
): Promise<PaymentResult> {
  const parsed = PaymentFormSchema.safeParse({
    sourceId: formData.get("sourceId"),
    orderId: formData.get("orderId"),
    rewardTierId: formData.get("rewardTierId") || undefined,
    loyaltyAccountId: formData.get("loyaltyAccountId") || undefined,
    billingName: formData.get("billingName"),
    billingAddressLine1: formData.get("billingAddressLine1"),
    billingCity: formData.get("billingCity"),
    billingState: formData.get("billingState"),
    billingPostalCode: formData.get("billingPostalCode"),
    squareCustomerId: formData.get("squareCustomerId"),
    billingEmail: formData.get("billingEmail") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      transactionId: null,
      orderId: null,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      errorCode: "VALIDATION",
    };
  }

  const { userId } = await auth();

  const { sourceId, orderId, rewardTierId, loyaltyAccountId, billingName, billingAddressLine1, billingCity, billingState, billingPostalCode, squareCustomerId, billingEmail } = parsed.data;

  // Require an email address for guest checkout (no signed-in customer).
  const isGuest = !userId;
  if (isGuest && !billingEmail) {
    return {
      success: false,
      transactionId: null,
      orderId: null,
      error: "An email address is required for guest checkout",
      errorCode: "VALIDATION",
    };
  }

  try {
    const orderResp = await ordersApi.get({ orderId });
    const order = orderResp.order;
    if (!order || order.state !== "DRAFT") {
      return { success: false, transactionId: null, orderId: null, error: "This order cannot be processed", errorCode: "INVALID_ORDER" };
    }

    await ordersApi.update({
      orderId,
      idempotencyKey: crypto.randomUUID(),
      order: {
        locationId,
        version: order.version ?? 1,
        state: "OPEN",
      },
      fieldsToClear: [],
    });

    if (rewardTierId && loyaltyAccountId) {
      const existingReward = await getFirstIssuedReward(loyaltyAccountId);
      if (existingReward) {
        if (existingReward.rewardTierId !== rewardTierId) {
          await deleteLoyaltyReward(existingReward.id);
          const rewardResult = await createLoyaltyReward(orderId, loyaltyAccountId, rewardTierId);
          if (!rewardResult.success) {
            return { success: false, transactionId: null, orderId: null, error: rewardResult.error ?? "Failed to apply reward", errorCode: "REWARD_FAILED" };
          }
        }
      } else {
        const rewardResult = await createLoyaltyReward(orderId, loyaltyAccountId, rewardTierId);
        if (!rewardResult.success) {
          return { success: false, transactionId: null, orderId: null, error: rewardResult.error ?? "Failed to apply reward", errorCode: "REWARD_FAILED" };
        }
      }
    }

    const updatedOrder = await ordersApi.get({ orderId });
    const total = updatedOrder.order?.totalMoney as unknown as { amount?: bigint | number } | undefined;
    const amountCents = Number(total?.amount ?? 0);

    const paymentResult = await processCardPayment({
      sourceId,
      orderId,
      amountCents,
      squareCustomerId,
      billingName,
      billingAddressLine1,
      billingCity,
      billingState,
      billingPostalCode,
      billingEmail,
    });

    if (!paymentResult.success) {
      return { success: false, transactionId: null, orderId: null, error: paymentResult.error ?? "Payment failed", errorCode: "PAYMENT_FAILED" };
    }

    revalidatePath("/cart");

    return { success: true, transactionId: paymentResult.transactionId ?? null, orderId, error: null, errorCode: null };
  } catch (error) {
    return { success: false, transactionId: null, orderId: null, error: error instanceof Error ? error.message : "Checkout failed", errorCode: "CHECKOUT_FAILED" };
  }
}

export async function selectReward(
  loyaltyAccountId: string,
  rewardTierId: string,
): Promise<SelectRewardResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Please sign in to redeem rewards" };
  }
  if (!loyaltyAccountId || !rewardTierId) {
    return { success: false, error: "Invalid reward selection" };
  }

  await cleanupStaleRewards(loyaltyAccountId);

  const result = await createLoyaltyReward("", loyaltyAccountId, rewardTierId);
  revalidatePath("/cart");
  return {
    success: result.success,
    rewardId: result.reward?.id,
    error: result.error,
  };
}

export async function deselectReward(
  rewardId: string,
): Promise<DeselectRewardResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Please sign in to manage rewards" };
  }
  if (!rewardId) {
    return { success: false, error: "Invalid reward deselect" };
  }
  const result = await deleteLoyaltyReward(rewardId);
  revalidatePath("/cart");
  return result;
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

/**
 * Removes the lingering guest cart cookie.
 *
 * `cookies().delete` is only permitted inside a Server Action or Route Handler —
 * not during a Server Component render. The `/cart` page performs the guest →
 * authenticated customer transfer during render (which only touches the Square
 * Orders API) and then defers the cookie deletion here, invoked client-side on
 * mount after the page has rendered.
 *
 * Safe to call unconditionally: deleting an absent cookie is a no-op.
 */
export async function clearGuestCartCookie(): Promise<void> {
  await clearGuestCartOrderId();
}

