import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrdersTable } from "@/components/account/orders-table";
import type { OrderSummary } from "@/lib/square/types";

function createOrders(count: number): OrderSummary[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `ORDER_${String(i + 1).padStart(3, "0")}`,
    closedAt: `2026-07-${String(30 - i).padStart(2, "0")}T12:00:00Z`,
    totalMoney: {
      amount: BigInt((count - i) * 1500),
      currency: "USD",
    },
    state: i === 0 ? "OPEN" : "COMPLETED",
  }));
}

describe("OrdersTable", () => {
  it("should display order history table with data", () => {
    const orders = createOrders(3);
    render(<OrdersTable orders={orders} error={null} />);

    expect(screen.getByText("Order History")).toBeInTheDocument();
    expect(screen.getAllByText("ORDER_00")).toHaveLength(3);
  });

  it("should display formatted currency amounts", () => {
    const orders = createOrders(1);
    render(<OrdersTable orders={orders} error={null} />);

    expect(screen.getByText("$15.00")).toBeInTheDocument();
  });

  it("should display order state badges", () => {
    const orders: OrderSummary[] = [
      {
        id: "ORDER_COMPLETE",
        closedAt: "2026-07-01T12:00:00Z",
        totalMoney: { amount: BigInt(1000), currency: "USD" },
        state: "COMPLETED",
      },
      {
        id: "ORDER_OPEN",
        closedAt: undefined,
        totalMoney: { amount: BigInt(2000), currency: "USD" },
        state: "OPEN",
      },
    ];
    render(<OrdersTable orders={orders} error={null} />);

    expect(screen.getByText("COMPLETED")).toBeInTheDocument();
    expect(screen.getByText("OPEN")).toBeInTheDocument();
  });

  it("should display empty state when no orders exist", () => {
    render(<OrdersTable orders={[]} error={null} />);

    expect(
      screen.getByText(/No orders yet/),
    ).toBeInTheDocument();
  });

  it("should display error state when API fails", () => {
    render(<OrdersTable orders={[]} error="Orders API down" />);

    expect(
      screen.getByText("Order history unavailable"),
    ).toBeInTheDocument();
  });

  it("should render table column headers", () => {
    const orders = createOrders(1);
    render(<OrdersTable orders={orders} error={null} />);

    expect(screen.getByText("Order")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("should display truncated order IDs in monospace", () => {
    const orders: OrderSummary[] = [
      {
        id: "ABCDEFGH12345678",
        closedAt: "2026-07-01T12:00:00Z",
        totalMoney: { amount: BigInt(1000), currency: "USD" },
        state: "COMPLETED",
      },
    ];
    render(<OrdersTable orders={orders} error={null} />);

    expect(screen.getByText("ABCDEFGH")).toBeInTheDocument();
  });
});
