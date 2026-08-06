"use client";

import { useState } from "react";
import type { OrderSummary } from "@/lib/square/types";
import { loadMoreOrders } from "@/app/account/actions";

interface OrdersCardProps {
  orders: OrderSummary[];
  nextCursor: string | null;
  error: string | null;
}

function formatCurrency(amount: bigint | null | undefined): string {
  if (amount == null) return "$0.00";
  return `$${(Number(amount) / 100).toFixed(2)}`;
}

function getStatusLabel(state: string): string {
  switch (state) {
    case "COMPLETED":
      return "Delivered";
    case "OPEN":
      return "Processing";
    case "CANCELED":
      return "Canceled";
    default:
      return state;
  }
}

export function OrdersCard({
  orders: initialOrders,
  nextCursor: initialCursor,
  error,
}: OrdersCardProps) {
  const [orders, setOrders] = useState<OrderSummary[]>(initialOrders);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function handleLoadMore() {
    if (!cursor || loading) return;

    setLoading(true);
    setLoadError(null);

    const result = await loadMoreOrders(cursor);

    if (result.error) {
      setLoadError(result.error);
    } else {
      setOrders((prev) => [...prev, ...result.orders]);
      setCursor(result.nextCursor);
    }

    setLoading(false);
  }

  const allLoaded = !cursor && orders.length > 0;
  const showLoadMore = cursor && !allLoaded;

  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-border bg-card p-4 shadow-[0_4px_16px_rgba(14,14,44,0.04)] sm:gap-5 sm:p-6 lg:gap-6 lg:p-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-2xl font-extrabold text-primary">
          Order History
        </h2>
        {orders.length > 0 && (
          <span className="font-ui text-sm font-normal text-tertiary">
            {allLoaded
              ? `Showing all ${orders.length} orders`
              : `Showing ${orders.length} of more orders`}
          </span>
        )}
      </div>

      {error ? (
        <p className="text-sm text-muted-foreground">
          Order history unavailable
        </p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No orders yet &mdash; your order history will appear here
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {orders.map((order) => {
              const orderDate = order.closedAt
                ? new Date(order.closedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "\u2014";
              const statusLabel = getStatusLabel(order.state);

              return (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 rounded-xl bg-[#F5F5F8] p-4 sm:p-5"
                >
                  {/* Mobile: 3-band stacked layout */}
                  <div className="flex md:hidden flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="font-heading text-base font-extrabold text-[#7B4FA2]">
                        #{order.id.slice(0, 8)}
                      </p>
                      <span className="rounded-full bg-[#FFECD9] px-2.5 py-1 font-ui text-xs font-medium text-[#E89516]">
                        {statusLabel}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-ui text-xs font-bold uppercase tracking-wide text-[#E89516]">
                        Items
                      </span>
                      <span className="font-heading text-[15px] font-semibold text-primary">
                        Order {order.id.slice(0, 8)}{" "}
                        <span className="font-ui text-[13px] font-normal text-tertiary">
                          · {orderDate}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-base font-extrabold text-primary tabular-nums">
                        {formatCurrency(order.totalMoney.amount)}
                      </span>
                      <span className="font-heading text-sm font-semibold text-[#7B4FA2] shrink-0">
                        View Details
                      </span>
                    </div>
                  </div>

                  {/* Desktop/tablet: horizontal 5-column layout */}
                  <div className="hidden md:flex items-center gap-6">
                    <div className="flex w-28 flex-col gap-1">
                      <p className="font-heading text-base font-extrabold text-[#7B4FA2]">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="font-ui text-[13px] font-normal text-tertiary">
                        {orderDate}
                      </p>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-ui text-xs font-bold uppercase tracking-wide text-[#E89516]">
                        Items
                      </span>
                      <span className="truncate font-heading text-[15px] font-semibold text-primary">
                        Order {order.id.slice(0, 8)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 text-right">
                      <span className="font-ui text-xs font-bold uppercase tracking-wide text-tertiary">
                        Total
                      </span>
                      <span className="font-heading text-base font-extrabold text-primary tabular-nums whitespace-nowrap">
                        {formatCurrency(order.totalMoney.amount)}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="font-ui text-xs font-bold uppercase tracking-wide text-tertiary">
                        Status
                      </span>
                      <span className="rounded-full bg-[#FFECD9] px-2.5 py-1 font-ui text-xs font-medium text-[#E89516]">
                        {statusLabel}
                      </span>
                    </div>

                    <span className="font-heading text-lg font-semibold text-[#7B4FA2] shrink-0">
                      View Details
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {loadError && (
            <p className="text-sm text-[#E53333]">
              Failed to load more orders. Please try again.
            </p>
          )}

          {showLoadMore && (
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="self-center rounded-lg border-2 border-[#7B4FA2] px-6 py-3 font-ui text-[14px] font-bold text-[#7B4FA2] transition-colors hover:bg-[#7B4FA2] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
