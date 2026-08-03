import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/nav-bar-server", () => ({
  NavBarServer: () => null,
}));

vi.mock("@/components/footer", () => ({
  Footer: () => null,
}));

import OrderResultPage from "@/app/order/result/page";

describe("OrderResultPage", () => {
  it("should show confirmation view when status is COMPLETED", async () => {
    render(
      await OrderResultPage({
        searchParams: Promise.resolve({
          status: "COMPLETED",
          transactionId: "TXN_123",
        }),
      }),
    );

    expect(screen.getByText("Order Confirmed")).toBeInTheDocument();
    expect(screen.getByText("TXN_123")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /continue shopping/i }),
    ).toBeInTheDocument();
  });

  it("should show cancellation view when status is CANCELLED", async () => {
    render(
      await OrderResultPage({
        searchParams: Promise.resolve({ status: "CANCELLED" }),
      }),
    );

    expect(screen.getByText("Payment Not Completed")).toBeInTheDocument();
    expect(screen.getByText(/no charge was made/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /return to cart/i }),
    ).toBeInTheDocument();
  });

  it("should show fallback view when status is missing", async () => {
    render(
      await OrderResultPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByText("Order Status")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /view orders/i }),
    ).toBeInTheDocument();
  });

  it("should show fallback view for unknown status", async () => {
    render(
      await OrderResultPage({
        searchParams: Promise.resolve({ status: "UNKNOWN" }),
      }),
    );

    expect(screen.getByText("Order Status")).toBeInTheDocument();
  });
});
