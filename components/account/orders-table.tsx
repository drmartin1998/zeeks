import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderSummary } from "@/lib/square/types";

interface OrdersTableProps {
  orders: OrderSummary[];
  error: string | null;
  className?: string;
}

function formatCurrency(amount: bigint | null | undefined): string {
  if (amount == null) return "$0.00";
  return `$${(Number(amount) / 100).toFixed(2)}`;
}

function stateBadgeVariant(
  state: string,
): "default" | "secondary" | "outline" {
  switch (state) {
    case "COMPLETED":
      return "default";
    case "OPEN":
      return "secondary";
    case "CANCELED":
      return "outline";
    default:
      return "outline";
  }
}

export function OrdersTable({ orders, error, className }: OrdersTableProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Order History</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-muted-foreground text-sm">
            Order history unavailable
          </p>
        ) : orders.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No orders yet &mdash; your order history will appear here
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                    Order
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="px-2 py-2 text-right font-medium text-muted-foreground">
                    Total
                  </th>
                  <th className="px-2 py-2 text-right font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="px-2 py-2 font-mono text-xs">
                      {order.id.slice(0, 8)}
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">
                      {order.closedAt
                        ? new Date(order.closedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )
                        : "\u2014"}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {formatCurrency(order.totalMoney.amount)}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <Badge variant={stateBadgeVariant(order.state)}>
                        {order.state}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
