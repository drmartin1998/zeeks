import type { OrderSummary } from "@/lib/square/types";

interface OrdersCardProps {
  orders: OrderSummary[];
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

export function OrdersCard({ orders, error }: OrdersCardProps) {
  return (
    <div className="flex flex-col gap-6 rounded-[20px] border border-border bg-card p-8 shadow-[0_4px_16px_rgba(14,14,44,0.04)]">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-extrabold text-primary">
          Order History
        </h2>
        <span className="font-ui text-sm font-normal text-tertiary">
          Showing last {orders.length} orders
        </span>
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
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center gap-6 rounded-xl bg-[#F5F5F8] px-5 py-5"
            >
              <div className="flex flex-col gap-1">
                <p className="font-heading text-base font-extrabold text-[#7B4FA2]">
                  #{order.id.slice(0, 8)}
                </p>
                <p className="font-ui text-[13px] font-normal text-tertiary">
                  {order.closedAt
                    ? new Date(order.closedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "\u2014"}
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
                  {getStatusLabel(order.state)}
                </span>
              </div>

              <span className="font-heading text-lg font-semibold text-[#7B4FA2] shrink-0">
                View Details
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
