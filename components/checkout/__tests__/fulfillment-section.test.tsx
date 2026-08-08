import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FulfillmentSection } from "@/components/checkout/fulfillment-section";

describe("FulfillmentSection", () => {
  const onChange = vi.fn();

  it("should let the customer choose shipping or pickup", () => {
    render(<FulfillmentSection subtotalCents={3000} onFulfillmentChange={onChange} />);
    expect(
      screen.getByRole("button", { name: "Shipping" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Pickup" })
    ).toBeInTheDocument();
  });

  it("should show the shipping-address form and shipping cost when shipping is selected", () => {
    render(<FulfillmentSection subtotalCents={3000} onFulfillmentChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Shipping" }));
    expect(screen.getByText("Recipient Name")).toBeInTheDocument();
    // $30.00 subtotal → first tier $5.00 shipping
    expect(screen.getByText("Shipping: $5.00")).toBeInTheDocument();
  });

  it("should not show the shipping form when pickup is selected", () => {
    render(<FulfillmentSection subtotalCents={3000} onFulfillmentChange={onChange} />);
    expect(screen.queryByText("Recipient Name")).toBeNull();
    expect(
      screen.getByText(/Available for pickup/i)
    ).toBeInTheDocument();
  });

  it("should switch back and forth between shipping and pickup", () => {
    render(<FulfillmentSection subtotalCents={3000} onFulfillmentChange={onChange} />);
    const shipping = screen.getByRole("button", { name: "Shipping" });
    const pickup = screen.getByRole("button", { name: "Pickup" });
    fireEvent.click(shipping);
    expect(screen.getByText("Recipient Name")).toBeInTheDocument();
    fireEvent.click(pickup);
    expect(screen.queryByText("Recipient Name")).toBeNull();
  });
});