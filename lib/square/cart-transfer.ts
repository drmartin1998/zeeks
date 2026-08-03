import { ordersApi } from "@/lib/square/client";
import { locationId } from "@/lib/square/client";
import { clearGuestCartOrderId } from "@/lib/square/cookies";

/**
 * Transfer a guest cart to an authenticated customer on sign-in.
 *
 * Updates the guest DRAFT order's customerId to the authenticated user's
 * Square customer ID, making it their cart. If the authenticated user already
 * has a DRAFT order, line items are merged.
 *
 * Returns the resulting order ID (the existing auth order, or the transferred guest order).
 */
export async function transferGuestCartToCustomer(
  guestOrderId: string,
  squareCustomerId: string,
  existingAuthOrderId?: string | null,
): Promise<string> {
  if (existingAuthOrderId && existingAuthOrderId !== guestOrderId) {
    const guestOrder = await ordersApi.get({ orderId: guestOrderId });
    const guestLineItems = (guestOrder.order?.lineItems ?? []) as Array<{
      catalogObjectId?: string | null;
      uid?: string | null;
      quantity?: string;
      variationId?: string | null;
    }>;

    const authOrder = await ordersApi.get({ orderId: existingAuthOrderId });
    const authLineItems = (authOrder.order?.lineItems ?? []) as Array<{
      catalogObjectId?: string | null;
      uid?: string | null;
      quantity?: string;
      variationId?: string | null;
    }>;
    const authVersion = authOrder.order?.version ?? 1;

    const mergedMap = new Map<string, { catalogObjectId: string; quantity: number; variationId?: string }>();

    for (const item of authLineItems) {
      const key = item.catalogObjectId ?? "";
      const existing = mergedMap.get(key);
      mergedMap.set(key, {
        catalogObjectId: key,
        quantity: (existing?.quantity ?? 0) + parseInt(item.quantity ?? "0", 10),
        variationId: item.variationId || undefined,
      });
    }

    for (const item of guestLineItems) {
      const key = item.catalogObjectId ?? "";
      const existing = mergedMap.get(key);
      mergedMap.set(key, {
        catalogObjectId: key,
        quantity: (existing?.quantity ?? 0) + parseInt(item.quantity ?? "0", 10),
        variationId: item.variationId || undefined,
      });
    }

    const mergedLineItems = Array.from(mergedMap.values()).map((item) => ({
      catalogObjectId: item.catalogObjectId,
      quantity: String(item.quantity),
      variationId: item.variationId || undefined,
    }));

    await ordersApi.update({
      orderId: existingAuthOrderId,
      idempotencyKey: crypto.randomUUID(),
      order: {
        locationId,
        customerId: squareCustomerId,
        lineItems: mergedLineItems,
        version: authVersion,
      },
      fieldsToClear: [],
    });

    await clearGuestCartOrderId();
    return existingAuthOrderId;
  }

  await ordersApi.update({
    orderId: guestOrderId,
    idempotencyKey: crypto.randomUUID(),
    order: {
      locationId,
      customerId: squareCustomerId,
      version: (await ordersApi.get({ orderId: guestOrderId })).order?.version ?? 1,
    },
    fieldsToClear: [],
  });

  await clearGuestCartOrderId();
  return guestOrderId;
}
