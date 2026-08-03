import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useFormStatus } from "react-dom";

const mockUseFormStatus = vi.fn();

vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return {
    ...actual,
    useFormStatus: () => mockUseFormStatus(),
  };
});

vi.mock("@/app/cart/actions", () => ({
  initiateCheckout: vi.fn(),
}));

import { CartSummary } from "@/components/cart/cart-summary";

describe("CartSummary component", () => {
  const baseProps = {
    subtotal: { amount: 1999, currency: "USD" },
    orderId: "ORDER_123",
    squareCustomerId: "CUST_456",
    hasUnavailable: false,
  };

  it("should render the Proceed to Checkout button when all items are available", () => {
    mockUseFormStatus.mockReturnValue({ pending: false });

    render(<CartSummary {...baseProps} />);

    expect(
      screen.getByRole("button", { name: "Proceed to Checkout" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Proceed to Checkout" }),
    ).not.toBeDisabled();
  });

  it("should disable the checkout button when items are unavailable", () => {
    mockUseFormStatus.mockReturnValue({ pending: false });

    render(<CartSummary {...baseProps} hasUnavailable />);

    expect(
      screen.getByRole("button", { name: "Proceed to Checkout" }),
    ).toBeDisabled();
  });

  it("should show loading state when form is pending", () => {
    mockUseFormStatus.mockReturnValue({ pending: true });

    render(<CartSummary {...baseProps} />);

    expect(
      screen.getByRole("button", { name: "Redirecting to checkout..." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Redirecting to checkout..." }),
    ).toBeDisabled();
  });

  it("should show warning message when items are unavailable", () => {
    mockUseFormStatus.mockReturnValue({ pending: false });

    render(<CartSummary {...baseProps} hasUnavailable />);

    expect(
      screen.getByText(/no longer available/),
    ).toBeInTheDocument();
  });

  it("should display the correct subtotal", () => {
    mockUseFormStatus.mockReturnValue({ pending: false });

    render(<CartSummary {...baseProps} />);

    expect(screen.getAllByText("$19.99")).toHaveLength(2);
  });

  it("should not show warning message when all items are available", () => {
    mockUseFormStatus.mockReturnValue({ pending: false });

    render(<CartSummary {...baseProps} />);

    expect(
      screen.queryByText(/no longer available/),
    ).not.toBeInTheDocument();
  });
});
