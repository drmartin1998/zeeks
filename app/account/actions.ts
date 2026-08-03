"use server";

import { auth } from "@clerk/nextjs/server";
import { getSquareCustomerId } from "@/lib/webhooks/clerk";
import { ordersApi } from "@/lib/square/client";
import { locationId } from "@/lib/square/client";
import type { OrderSummary } from "@/lib/square/types";

export interface LoadMoreOrdersResult {
  orders: OrderSummary[];
  nextCursor: string | null;
  error: string | null;
}

export async function loadMoreOrders(
  cursor: string,
): Promise<LoadMoreOrdersResult> {
  const { userId } = await auth();

  if (!userId) {
    return { orders: [], nextCursor: null, error: "Unauthorized" };
  }

  const squareCustomerId = await getSquareCustomerId(userId);
  if (!squareCustomerId) {
    return { orders: [], nextCursor: null, error: "Account not synced" };
  }

  try {
    const response = await ordersApi.search({
      locationIds: [locationId],
      cursor,
      query: {
        filter: {
          customerFilter: {
            customerIds: [squareCustomerId],
          },
        },
        sort: {
          sortField: "CLOSED_AT",
          sortOrder: "DESC",
        },
      },
      limit: 10,
    });

    const orders = (response.orders ?? []).map((order) => ({
      id: order.id ?? "",
      closedAt: order.closedAt ?? undefined,
      totalMoney: {
        amount: order.totalMoney?.amount,
        currency: order.totalMoney?.currency,
      },
      state: order.state ?? "UNKNOWN",
    }));

    return {
      orders,
      nextCursor: response.cursor ?? null,
      error: null,
    };
  } catch (error) {
    return {
      orders: [],
      nextCursor: null,
      error: error instanceof Error ? error.message : "Failed to load orders",
    };
  }
}
