import { ordersApi, locationId } from "@/lib/square/client";
import type { Cart, CartLineItem } from "@/lib/square/types";

interface FindDraftOrderResult {
  orderId: string;
  lineItems: unknown[];
}

/**
 * Find an existing DRAFT order for the customer, or create a new one.
 * Returns the order ID of the existing or newly created draft order.
 *
 * Guest path: pass `null` for squareCustomerId and optionally an existingOrderId.
 * Creates a DRAFT order WITHOUT a customerId for guests.
 */
export async function findOrCreateDraftOrder(
  squareCustomerId: string | null,
  existingOrderId?: string,
): Promise<{ orderId: string; idempotencyKey: string }> {
  if (squareCustomerId !== null) {
    return findOrCreateDraftOrderForCustomer(squareCustomerId);
  }

  if (existingOrderId) {
    try {
      const existingOrder = await ordersApi.get({ orderId: existingOrderId });
      if (existingOrder.order?.id) {
        return { orderId: existingOrder.order.id, idempotencyKey: crypto.randomUUID() };
      }
    } catch {
      // Order not found or expired — fall through to create new
    }
  }

  const idempotencyKey = crypto.randomUUID();
  const response = await ordersApi.create({
    order: {
      locationId,
      state: "DRAFT",
    },
    idempotencyKey,
  });

  const order = response.order;
  if (!order?.id) {
    throw new Error("Failed to create draft order");
  }

  return { orderId: order.id, idempotencyKey };
}

async function findOrCreateDraftOrderForCustomer(
  squareCustomerId: string,
): Promise<{ orderId: string; idempotencyKey: string }> {
  const existing = await findExistingDraftOrderByCustomer(squareCustomerId);

  if (existing) {
    return { orderId: existing.orderId, idempotencyKey: crypto.randomUUID() };
  }

  const idempotencyKey = crypto.randomUUID();

  const response = await ordersApi.create({
    order: {
      locationId,
      customerId: squareCustomerId,
      state: "DRAFT",
    },
    idempotencyKey,
  });

  const order = response.order;
  if (!order?.id) {
    throw new Error("Failed to create draft order");
  }

  return { orderId: order.id, idempotencyKey };
}

/**
 * Find an existing draft order for the customer.
 * Returns the order ID if found, null otherwise.
 */
export async function findExistingDraftOrder(
  squareCustomerId: string,
): Promise<FindDraftOrderResult | null> {
  return findExistingDraftOrderByCustomer(squareCustomerId);
}

async function findExistingDraftOrderByCustomer(
  squareCustomerId: string,
): Promise<FindDraftOrderResult | null> {
  const response = await ordersApi.search({
    locationIds: [locationId],
    query: {
      filter: {
        stateFilter: {
          states: ["DRAFT"],
        },
        customerFilter: {
          customerIds: [squareCustomerId],
        },
      },
    },
    limit: 1,
  });

  const orders = response.orders ?? [];
  if (orders.length === 0 || !orders[0].id) {
    return null;
  }

  return {
    orderId: orders[0].id,
    lineItems: orders[0].lineItems ?? [],
  };
}

/**
 * Get the full cart for a customer or guest.
 * Auth path: pass squareCustomerId to search by customer.
 * Guest path: pass null for squareCustomerId and an orderId to fetch directly.
 */
export async function getCart(
  squareCustomerId: string | null,
  orderId?: string,
): Promise<Cart | null> {
  let targetOrderId: string | undefined;

  if (orderId) {
    targetOrderId = orderId;
  } else if (squareCustomerId) {
    const existing = await findExistingDraftOrderByCustomer(squareCustomerId);
    if (!existing) {
      console.log("getCart: no existing draft order found");
      return null;
    }
    targetOrderId = existing.orderId;
  } else {
    console.log("getCart: no squareCustomerId or orderId provided");
    return null;
  }

  const response = await ordersApi.get({ orderId: targetOrderId });
  const order = response.order;
  if (!order) {
    console.log("getCart: order not found for id", targetOrderId);
    return null;
  }

  const rawLineItems = (order.lineItems as unknown as Array<{ uid?: string | null }>) ?? [];
  console.log("getCart: fetched order", {
    orderId: targetOrderId,
    version: order.version,
    lineItemCount: rawLineItems.length,
    lineItemUids: rawLineItems.map((li) => li.uid),
  });

  return buildCart(order as unknown as Record<string, unknown>);
}

/**
 * Get just the cart item count for a customer or guest.
 * Auth path: pass squareCustomerId.
 * Guest path: pass null for squareCustomerId and an orderId.
 * Returns 0 if no draft order or no items. Returns -1 on error.
 */
export async function getCartItemCount(
  squareCustomerId: string | null,
  orderId?: string,
): Promise<number> {
  try {
    let targetOrderId: string | undefined;

    if (orderId) {
      targetOrderId = orderId;
    } else if (squareCustomerId) {
      const existing = await findExistingDraftOrderByCustomer(squareCustomerId);
      if (!existing) {
        console.log("getCartItemCount: no draft order, returning 0");
        return 0;
      }
      targetOrderId = existing.orderId;
    } else {
      return 0;
    }

    const response = await ordersApi.get({ orderId: targetOrderId });
    const lineItems = response.order?.lineItems ?? [];
    console.log("getCartItemCount:", { orderId: targetOrderId, count: lineItems.length });
    return lineItems.length;
  } catch (error) {
    console.error("getCartItemCount failed:", error);
    return -1;
  }
}

/**
 * Transform a Square Order object into our Cart type.
 */
function buildCart(order: Record<string, unknown>): Cart {
  const id = (order.id as string) ?? "";
  const rawLineItems = (order.lineItems as unknown as Array<Record<string, unknown>>) ?? [];
  const totalMoney = order.totalMoney as Record<string, unknown> | undefined;

  const lineItems: CartLineItem[] = rawLineItems.map((item) => {
    const basePrice = item.basePriceMoney as Record<string, unknown> | undefined;
    const lineTotal = item.totalMoney as Record<string, unknown> | undefined;

    return {
      uid: (item.uid as string) ?? "",
      catalogObjectId: (item.catalogObjectId as string) ?? "",
      variationId: (item.variationId as string) ?? (item.catalogObjectId as string) ?? "",
      name: (item.name as string) ?? "Unknown Product",
      imageUrl: null,
      quantity: String(item.quantity ?? "1"),
      unitPrice: {
        amount: Number(basePrice?.amount ?? 0),
        currency: (basePrice?.currency as string) ?? "USD",
      },
      lineTotal: {
        amount: Number(lineTotal?.amount ?? 0),
        currency: (lineTotal?.currency as string) ?? "USD",
      },
      isUnavailable: false,
    };
  });

  // Extract fulfillment + shipping cost from the order (feature 038).
  const rawFulfillments = (order.fulfillments as unknown as Array<Record<string, unknown>>) ?? [];
  const shipment = rawFulfillments.find((f) => f.type === "SHIPMENT");
  const fulfillment = shipment
    ? {
        method: "shipping" as const,
        shippingAddress: extractShippingAddress(shipment),
        shippingCost: null,
      }
    : {
        method: "pickup" as const,
        shippingAddress: null,
        shippingCost: null,
      };

  const shippingCostAmount = 0; // shipping cost is charged at payment; total reflects it
  const subtotalAmount = Number(totalMoney?.amount ?? 0);

  return {
    orderId: id,
    lineItems,
    subtotal: {
      amount: subtotalAmount,
      currency: (totalMoney?.currency as string) ?? "USD",
    },
    shippingCost: { amount: shippingCostAmount, currency: "USD" },
    total: { amount: subtotalAmount, currency: "USD" },
    fulfillment,
  };
}

/** Extract a shipping address from a SHIPMENT fulfillment, or null. */
function extractShippingAddress(
  fulfillment: Record<string, unknown>
): { recipientName: string; addressLine1: string; addressLine2?: string; city: string; state: string; postalCode: string } | null {
  const details = fulfillment.shipmentDetails as Record<string, unknown> | undefined;
  const recipient = details?.recipient as Record<string, unknown> | undefined;
  const address = recipient?.address as Record<string, unknown> | undefined;
  if (!address) return null;
  return {
    recipientName: (recipient?.displayName as string) ?? "",
    addressLine1: (address.addressLine1 as string) ?? "",
    addressLine2: (address.addressLine2 as string) ?? undefined,
    city: (address.locality as string) ?? "",
    state: (address.administrativeDistrictLevel1 as string) ?? "",
    postalCode: (address.postalCode as string) ?? "",
  };
}
