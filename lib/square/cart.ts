import { ordersApi, locationId } from "@/lib/square/client";
import type { Cart, CartLineItem } from "@/lib/square/types";

interface FindDraftOrderResult {
  orderId: string;
  lineItems: unknown[];
}

/**
 * Find an existing DRAFT order for the customer, or create a new one.
 * Returns the order ID of the existing or newly created draft order.
 */
export async function findOrCreateDraftOrder(
  squareCustomerId: string,
): Promise<{ orderId: string; idempotencyKey: string }> {
  const existing = await findExistingDraftOrder(squareCustomerId);

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
 * Get the full cart for a customer.
 * Returns null if no draft order exists (empty cart).
 */
export async function getCart(
  squareCustomerId: string,
): Promise<Cart | null> {
  const existing = await findExistingDraftOrder(squareCustomerId);
  if (!existing) {
    console.log("getCart: no existing draft order found");
    return null;
  }

  const response = await ordersApi.get({ orderId: existing.orderId });
  const order = response.order;
  if (!order) {
    console.log("getCart: order not found for id", existing.orderId);
    return null;
  }

  const rawLineItems = (order.lineItems as unknown as Array<{ uid?: string | null }>) ?? [];
  console.log("getCart: fetched order", {
    orderId: existing.orderId,
    version: order.version,
    lineItemCount: rawLineItems.length,
    lineItemUids: rawLineItems.map((li) => li.uid),
  });

  return buildCart(order as unknown as Record<string, unknown>);
}

/**
 * Get just the cart item count for a customer.
 * Returns 0 if no draft order or no items. Returns -1 on error.
 */
export async function getCartItemCount(
  squareCustomerId: string,
): Promise<number> {
  try {
    const existing = await findExistingDraftOrder(squareCustomerId);
    if (!existing) {
      console.log("getCartItemCount: no draft order, returning 0");
      return 0;
    }
    const response = await ordersApi.get({ orderId: existing.orderId });
    const lineItems = response.order?.lineItems ?? [];
    console.log("getCartItemCount:", { orderId: existing.orderId, count: lineItems.length });
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
  const rawLineItems = (order.lineItems as Array<Record<string, unknown>>) ?? [];
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

  return {
    orderId: id,
    lineItems,
    subtotal: {
      amount: Number(totalMoney?.amount ?? 0),
      currency: (totalMoney?.currency as string) ?? "USD",
    },
  };
}
