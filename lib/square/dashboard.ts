import {
  customersApi,
  loyaltyApi,
  ordersApi,
  locationId,
} from "@/lib/square/client";
import type {
  CustomerProfile,
  LoyaltySummary,
  OrderSummary,
  PaginatedOrdersResult,
} from "@/lib/square/types";

export interface DashboardResult {
  profile: CustomerProfile | null;
  profileError: string | null;
  loyalty: LoyaltySummary | null;
  loyaltyError: string | null;
  orders: OrderSummary[];
  ordersNextCursor: string | null;
  ordersError: string | null;
}

export async function fetchDashboardData(
  squareCustomerId: string,
): Promise<DashboardResult> {
  const [profileResult, loyaltyResult, ordersResult] =
    await Promise.allSettled([
      fetchCustomerProfile(squareCustomerId),
      fetchLoyaltyBalance(squareCustomerId),
      fetchOrderHistory(squareCustomerId, null, 10),
    ]);

  const orders: OrderSummary[] =
    ordersResult.status === "fulfilled" ? ordersResult.value.orders : [];
  const ordersNextCursor =
    ordersResult.status === "fulfilled"
      ? ordersResult.value.nextCursor
      : null;

  return {
    profile:
      profileResult.status === "fulfilled" ? profileResult.value : null,
    profileError:
      profileResult.status === "rejected"
        ? getErrorMessage(profileResult.reason)
        : null,
    loyalty:
      loyaltyResult.status === "fulfilled" ? loyaltyResult.value : null,
    loyaltyError:
      loyaltyResult.status === "rejected"
        ? getErrorMessage(loyaltyResult.reason)
        : null,
    orders,
    ordersNextCursor,
    ordersError:
      ordersResult.status === "rejected"
        ? getErrorMessage(ordersResult.reason)
        : null,
  };
}

async function fetchCustomerProfile(
  squareCustomerId: string,
): Promise<CustomerProfile> {
  const response = await customersApi.get({ customerId: squareCustomerId });
  const customer = response.customer;

  return {
    id: customer?.id ?? squareCustomerId,
    givenName: customer?.givenName ?? undefined,
    familyName: customer?.familyName ?? undefined,
    emailAddress: customer?.emailAddress ?? undefined,
    phoneNumber: customer?.phoneNumber ?? undefined,
  };
}

async function fetchLoyaltyBalance(
  squareCustomerId: string,
): Promise<LoyaltySummary> {
  const response = await loyaltyApi.accounts.search({
    query: { customerIds: [squareCustomerId] },
    limit: 1,
  });

  const accounts = response.loyaltyAccounts ?? [];
  const first = accounts[0];

  return {
    balance: Number(first?.balance ?? 0),
    lifetimePoints: Number(first?.lifetimePoints ?? 0),
  };
}

async function fetchOrderHistory(
  squareCustomerId: string,
  cursor: string | null,
  limit: number,
): Promise<PaginatedOrdersResult> {
  const response = await ordersApi.search({
    locationIds: [locationId],
    cursor: cursor ?? undefined,
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
    limit,
  });

  const orders = response.orders ?? [];
  const nextCursor = response.cursor ?? null;

  return {
    orders: orders.map((order) => ({
      id: order.id ?? "",
      closedAt: order.closedAt ?? undefined,
      totalMoney: {
        amount: order.totalMoney?.amount,
        currency: order.totalMoney?.currency,
      },
      state: order.state ?? "UNKNOWN",
    })),
    nextCursor,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}
